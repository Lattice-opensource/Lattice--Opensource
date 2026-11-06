"""Tests for alert generation and management service."""

from datetime import datetime, timezone

from services.alert_service import generate_alerts, get_alerts, resolve_alert


def test_no_alert_for_normal_reading(db_session):
    db = db_session
    results, _ = generate_alerts(
        db,
        building_id="b1",
        circuit_id="c1",
        consumption_kwh=0.5,
        history=[0.5, 0.5, 0.5],
        previous_kwh=0.5,
    )
    assert results == []
    assert get_alerts(db) == []


def test_alert_generated_for_high_consumption(db_session):
    db = db_session
    results, persisted = generate_alerts(
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
    assert len(persisted) == len(results)


def test_severity_assignment(db_session):
    db = db_session
    from config.settings import get_settings, reset_settings

    reset_settings()
    s = get_settings()
    s.critical_threshold_w = 100.0
    s.warning_threshold_w = 50.0
    s.info_threshold_w = 10.0
    s.max_consumption_threshold_kwh = 0.1

    results, persisted = generate_alerts(
        db,
        building_id="b1",
        circuit_id="c1",
        consumption_kwh=5.0,
        history=[0.1, 0.1, 0.1],
        previous_kwh=0.1,
    )
    alerts = get_alerts(db)
    assert len(alerts) >= 1
    severities = {a.severity for a in alerts}
    assert severities & {"High", "Medium", "Low"}


def test_duplicate_prevention(db_session):
    db = db_session
    ts = datetime.now(timezone.utc)
    results1, _ = generate_alerts(
        db,
        building_id="b1",
        circuit_id="c1",
        consumption_kwh=5.0,
        reading_timestamp=ts,
        history=[0.5, 0.5, 0.5],
        previous_kwh=0.5,
    )
    results2, persisted2 = generate_alerts(
        db,
        building_id="b1",
        circuit_id="c1",
        consumption_kwh=5.0,
        reading_timestamp=ts,
        history=[0.5, 0.5, 0.5],
        previous_kwh=0.5,
    )
    alerts = get_alerts(db)
    assert len(alerts) == len(results1)
    assert persisted2 == []


def test_resolve_alert(db_session):
    db = db_session
    results, persisted = generate_alerts(
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


def test_multiple_circuits_independent(db_session):
    db = db_session
    generate_alerts(db, building_id="b1", circuit_id="c1", consumption_kwh=5.0, history=[0.5, 0.5, 0.5], previous_kwh=0.5)
    generate_alerts(db, building_id="b1", circuit_id="c2", consumption_kwh=5.0, history=[0.5, 0.5, 0.5], previous_kwh=0.5)
    c1_alerts = get_alerts(db, circuit_id="c1")
    c2_alerts = get_alerts(db, circuit_id="c2")
    assert len(c1_alerts) >= 1
    assert len(c2_alerts) >= 1


def test_multiple_buildings(db_session):
    db = db_session
    generate_alerts(db, building_id="b1", circuit_id="c1", consumption_kwh=5.0, history=[0.5, 0.5, 0.5], previous_kwh=0.5)
    generate_alerts(db, building_id="b2", circuit_id="c1", consumption_kwh=5.0, history=[0.5, 0.5, 0.5], previous_kwh=0.5)
    b1 = get_alerts(db, building_id="b1")
    b2 = get_alerts(db, building_id="b2")
    assert len(b1) >= 1
    assert len(b2) >= 1
