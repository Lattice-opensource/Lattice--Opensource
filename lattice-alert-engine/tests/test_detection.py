"""Tests for detection engine."""

from datetime import datetime, timezone

from services.detection import (
    detect_fixed_threshold,
    detect_historical_baseline,
    detect_sudden_change,
    run_all_detections,
)


def test_normal_consumption_no_alert():
    r = detect_fixed_threshold(
        building_id="b1", circuit_id="c1", consumption_kwh=0.5,
        threshold_kwh=1.0, reading_timestamp=datetime.now(timezone.utc),
    )
    assert r is None


def test_high_consumption_fixed_threshold():
    r = detect_fixed_threshold(
        building_id="b1", circuit_id="c1", consumption_kwh=1.5,
        threshold_kwh=1.0, reading_timestamp=datetime.now(timezone.utc),
    )
    assert r is not None
    assert r.detection_type == "fixed_threshold"
    assert r.measured_value == 1.5
    assert r.threshold == 1.0


def test_historical_anomaly():
    r = detect_historical_baseline(
        building_id="b1", circuit_id="c1", consumption_kwh=5.0,
        history=[1.0, 1.1, 0.9, 1.0, 1.05],
        baseline_multiplier=1.5, min_history=3,
        reading_timestamp=datetime.now(timezone.utc),
    )
    assert r is not None
    assert r.detection_type == "historical_baseline"


def test_historical_normal():
    r = detect_historical_baseline(
        building_id="b1", circuit_id="c1", consumption_kwh=1.0,
        history=[1.0, 1.1, 0.9, 1.0, 1.05],
        baseline_multiplier=1.5, min_history=3,
        reading_timestamp=datetime.now(timezone.utc),
    )
    assert r is None


def test_insufficient_history():
    r = detect_historical_baseline(
        building_id="b1", circuit_id="c1", consumption_kwh=5.0,
        history=[1.0, 1.1],
        baseline_multiplier=1.5, min_history=3,
        reading_timestamp=datetime.now(timezone.utc),
    )
    assert r is None


def test_baseline_excludes_current_reading():
    # history passed should not include current; baseline computed from history only
    history = [1.0, 1.0, 1.0]
    r = detect_historical_baseline(
        building_id="b1", circuit_id="c1", consumption_kwh=10.0,
        history=history, baseline_multiplier=1.5, min_history=3,
        reading_timestamp=datetime.now(timezone.utc),
    )
    assert r is not None
    assert r.baseline == 1.0


def test_sudden_increase():
    r = detect_sudden_change(
        building_id="b1", circuit_id="c1", current_kwh=2.0,
        previous_kwh=1.0, change_percent_threshold=30.0,
        reading_timestamp=datetime.now(timezone.utc),
    )
    assert r is not None
    assert r.detection_type == "sudden_change"
    assert abs(r.change_percent - 100.0) < 1e-9


def test_sudden_normal():
    r = detect_sudden_change(
        building_id="b1", circuit_id="c1", current_kwh=1.05,
        previous_kwh=1.0, change_percent_threshold=30.0,
        reading_timestamp=datetime.now(timezone.utc),
    )
    assert r is None


def test_sudden_missing_previous():
    r = detect_sudden_change(
        building_id="b1", circuit_id="c1", current_kwh=2.0,
        previous_kwh=None, change_percent_threshold=30.0,
        reading_timestamp=datetime.now(timezone.utc),
    )
    assert r is None


def test_sudden_zero_previous():
    r = detect_sudden_change(
        building_id="b1", circuit_id="c1", current_kwh=2.0,
        previous_kwh=0, change_percent_threshold=30.0,
        reading_timestamp=datetime.now(timezone.utc),
    )
    assert r is None


def test_edge_cases():
    # None consumption
    assert detect_fixed_threshold(building_id="b1", circuit_id="c1", consumption_kwh=None, threshold_kwh=1.0, reading_timestamp=datetime.now(timezone.utc)) is None
    # zero threshold
    assert detect_fixed_threshold(building_id="b1", circuit_id="c1", consumption_kwh=1.0, threshold_kwh=0, reading_timestamp=datetime.now(timezone.utc)) is None
    # empty history
    assert detect_historical_baseline(building_id="b1", circuit_id="c1", consumption_kwh=1.0, history=[], baseline_multiplier=1.5, min_history=3, reading_timestamp=datetime.now(timezone.utc)) is None


def test_run_all_detections():
    results = run_all_detections(
        building_id="b1", circuit_id="c1", consumption_kwh=5.0,
        reading_timestamp=datetime.now(timezone.utc),
        threshold_kwh=1.0,
        history=[1.0, 1.0, 1.0],
        baseline_multiplier=1.5,
        min_history=3,
        previous_kwh=1.0,
        change_percent_threshold=30.0,
    )
    types = {r.detection_type for r in results}
    assert "fixed_threshold" in types
    assert "historical_baseline" in types
    assert "sudden_change" in types


def test_structured_result():
    r = detect_fixed_threshold(
        building_id="b1", circuit_id="c1", consumption_kwh=1.5,
        threshold_kwh=1.0, reading_timestamp=datetime.now(timezone.utc),
    )
    d = r.to_dict()
    assert "detection_type" in d
    assert "measured_value" in d
    assert "threshold" in d
    assert "building_id" in d
    assert "circuit_id" in d
    assert "reading_timestamp" in d
