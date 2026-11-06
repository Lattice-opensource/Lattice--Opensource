"""Tests for Lattice Alert Engine configuration and detection."""

import os

os.environ.setdefault("ALERT_DATABASE_URL", "sqlite:///./test_alert_engine.db")


def test_settings_load():
    from config.settings import AlertSettings, reset_settings

    reset_settings()
    s = AlertSettings()
    assert s.max_consumption_threshold_w > 0
    assert s.database_url.startswith("sqlite")
    assert s.historical_baseline_multiplier > 1.0
    assert s.sudden_change_percent >= 0
    assert s.critical_threshold_w >= s.warning_threshold_w >= s.info_threshold_w


def test_threshold_evaluation():
    from services.detection import evaluate_threshold

    assert evaluate_threshold(6000.0) == "critical"
    assert evaluate_threshold(4000.0) == "warning"
    assert evaluate_threshold(2000.0) == "info"
    assert evaluate_threshold(500.0) is None
