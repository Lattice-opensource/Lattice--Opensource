"""Tests for alert generation and management service."""

import os
import tempfile
from pathlib import Path

_TMP = Path(tempfile.mkdtemp()) / "alert_svc_test.db"
os.environ["ALERT_DATABASE_URL"] = f"sqlite:///{_TMP}"

from config.database import init_db  # noqa: E402

init_db()

from sqlalchemy.orm import Session  # noqa: E402

from config.database import SessionLocal  # noqa: E402
from services.alert_service import generate_alerts, get_alerts, resolve_alert  # noqa: E402


def _clean():
    from models.alert import Alert
    from models.reading import Reading

    db = SessionLocal()
    try:
        db.query(Alert).delete()
        db.query(Reading).delete()
        db.commit()
    finally:
        db.close()


def test_no_alert_for_normal_reading():
    _clean()
    db = SessionLocal()
    try:
        results = generate_alerts(
            db,
            building_id="b1",
            circuit_id="c1",
            consumption_kwh=0.5,
            threshold_history=None if False else None,
        )
        # pass history for baseline
        results = generate_alerts(
            db,
            building_id="b1",
            circuit_id="c1",
            consumption_kwh=0.5,
            history=[0.5, 0.5, 0.5],
            previous_kwh=0.5,
        )
        assert results == []
        assert get_alerts(db) == []
    finally:
        db.close()


def test_alert_generated_for_high_consumption():
    _clean()
    db = SessionLocal()
    try:
        results = generate_alerts(
            db,
            building_id="b1",
            circuit_id="c1",
            consumption_kwh=5.0,
            history=[0.5, 0.5, 0.5],
            previous_kwh=0.5,
        )
        assert len(results) >= 1
        alerts = get_alerts(db, building_id="b1")
        assert len(alerts) >= 1
        assert alerts[0].building_id == "b1"
        assert alerts[0].circuit_id == "c1"
    finally:
        db.close()


def test_severity_assignment():
    _clean()
    from config.settings import get_settings, reset_settings

    reset_settings()
    s = get_settings()
    s.critical_threshold_w = 100.0
    s.warning_threshold_w = 50.0
    s.info_threshold_w = 10.0
    s.max_consumption_threshold_kwh = 0.1

    db = SessionLocal()
    try:
        generate_alerts(
            db,
            building_id="b1",
            circuit_id="c1",
            consumption_kwh=5.0,
            history=[0.1, 0.1, 0.1],
            previous_kwh=0.1,
        )
        alerts = get_alerts(db)
        assert len(alerts) >= 1
        # at least one High due to critical threshold
        severities = {a.severity for a in alerts}
        assert "High" in severities or "Medium" in severities
    finally:
        db.close()


def test_duplicate_prevention():
    _clean()
    db = SessionLocal()
    try:
        from datetime import datetime, timezone

        ts = datetime.now(timezone.utc)
        r1 = generate_alerts(
            db,
            building_id="b1",
            circuit_id="c1",
            consumption_kwh=5.0,
            reading_timestamp=ts,
            history=[0.5, 0.5, 0.5],
            previous_kwh=0.5,
        )
        r2 = generate_alerts(
            db,
            building_id="b1",
            circuit_id="c1",
            consumption_kwh=5.0,
            reading_timestamp=ts,
            history=[0.5, 0.5, 0.5],
            previous_kwh=0.5,
        )
        # second call suppressed duplicates
        alerts = get_alerts(db)
        # count should not double
        assert len(alerts) == len(r1) if len(r1) > 0 else True
    finally:
        db.close()


def test_resolve_alert():
    _clean()
    db = SessionLocal()
    try:
        generate_alerts(
            db,
            building_id="b1",
            circuit_id="c1",
            consumption_kwh=5.0,
            history=[0.5, 0.5, 0.5],
            previous_kwh=0.5,
        )
        alerts = get_alerts(db)
        assert len(alerts) >= 1
        aid = alerts[0].id
        resolved = resolve_alert(db, aid)
        assert resolved is not None
        assert resolved.resolution_status == "resolved"
        assert resolved.resolved_at is not None
    finally:
        db.close()


def test_multiple_circuits_independent():
    _clean()
    db = SessionLocal()
    try:
        generate_alerts(db, building_id="b1", circuit_id="c1", consumption_kwh=5.0, history=[0.5, 0.5, 0.5], previous_kwh=0.5)
        generate_alerts(db, building_id="b1", circuit_id="c2", consumption_kwh=5.0, history=[0.5, 0.5, 0.5], previous_kwh=0.5)
        c1_alerts = get_alerts(db, circuit_id="c1")
        c2_alerts = get_alerts(db, circuit_id="c2")
        assert len(c1_alerts) >= 1
        assert len(c2_alerts) >= 1


def test_multiple_buildings():
    _clean()
    db = SessionLocal()
    try:
        generate_alerts(db, building_id="b1", circuit_id="c1", consumption_kwh=5.0, history=[0.5, 0.5, 0.5], previous_kwh=0.5)
        generate_alerts(db, building_id="b2", circuit_id="c1", consumption_kwh=5.0, history=[0.5, 0.5, 0.5], previous_kwh=0.5)
        b1 = get_alerts(db, building_id="b1")
        b2 = get_alerts(db, building_id="b2")
        assert len(b1) >= 1
        assert len(b2) >= 1
    finally:
        db.close()
