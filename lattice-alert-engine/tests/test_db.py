"""Tests for database creation, insertion and retrieval."""

from datetime import datetime, timezone

import pytest

from models.alert import Alert, ALLOWED_SEVERITIES
from models.reading import Reading
from repositories.alerts import create_alert_if_new
from sqlalchemy import inspect


def test_database_creation(db_session):
    from config.database import engine

    insp = inspect(engine)
    tables = insp.get_table_names()
    assert "readings" in tables
    assert "alerts" in tables


def test_reading_insert_and_retrieve(db_session):
    db = db_session
    r = Reading(building_id="b1", circuit_id="c1", consumption_kwh=1.23)
    db.add(r)
    db.commit()
    db.refresh(r)
    rid = r.id
    assert rid is not None

    fetched = db.query(Reading).filter(Reading.id == rid).first()
    assert fetched is not None
    assert fetched.building_id == "b1"
    assert fetched.circuit_id == "c1"
    assert abs(fetched.consumption_kwh - 1.23) < 1e-9
    assert fetched.timestamp is not None
    assert fetched.timestamp.tzinfo is not None


def test_alert_insert_and_retrieve(db_session):
    db = db_session
    a = Alert(
        building_id="b1",
        circuit_id="c1",
        alert_type="max_consumption",
        severity="High",
        description="test alert",
        value=4200.0,
        threshold=3000.0,
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    aid = a.id
    assert aid is not None

    fetched = db.query(Alert).filter(Alert.id == aid).first()
    assert fetched is not None
    assert fetched.severity in ALLOWED_SEVERITIES
    assert fetched.resolution_status == "open"
    assert fetched.timestamp.tzinfo is not None


def test_unique_alert_ids(db_session):
    db = db_session
    a1 = Alert(building_id="b1", alert_type="t", severity="Low", description="d1")
    a2 = Alert(building_id="b1", alert_type="t", severity="Low", description="d2")
    db.add_all([a1, a2])
    db.commit()
    assert a1.id != a2.id


def test_dedup_prevents_duplicate(db_session):
    db = db_session
    ts = datetime.now(timezone.utc) if False else __import__("datetime").datetime.now(__import__("datetime").timezone.utc)
    data = {
        "building_id": "b1",
        "circuit_id": "c1",
        "alert_type": "fixed_threshold",
        "severity": "High",
        "description": "dup test",
        "timestamp": ts,
    }
    a1 = create_alert_if_new(db, data)
    assert a1 is not None
    a2 = create_alert_if_new(db, data)
    assert a2 is None
    count = db.query(Alert).filter(Alert.building_id == "b1").count()
    assert count == 1
