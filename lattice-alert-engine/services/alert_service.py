"""Alert management service connecting detection engine to persistence."""

from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy.orm import Session

from config.settings import get_settings
from models.alert import Alert
from repositories.alerts import create_alert_if_new
from services.detection import DetectionResult, run_all_detections


def generate_alerts(
    db: Session,
    *,
    building_id: str,
    circuit_id: str,
    consumption_kwh: float,
    reading_timestamp=None,
    history: Optional[List[float]] = None,
    previous_kwh: Optional[float] = None,
    is_simulated: bool = False,
) -> List[DetectionResult]:
    """Run all detection methods and persist deduplicated alerts.

    Returns the list of detection results (may be empty for normal readings).
    """
    settings = get_settings()
    ts = reading_timestamp
    if ts is None or (hasattr(ts, "tzinfo") and ts.tzinfo is None):
        ts = datetime.now(timezone.utc)

    results = run_all_detections(
        building_id=building_id,
        circuit_id=circuit_id,
        consumption_kwh=consumption_kwh,
        reading_timestamp=ts,
        threshold_kwh=settings.max_consumption_threshold_kwh,
        history=history,
        baseline_multiplier=settings.historical_baseline_multiplier,
        min_history=settings.min_history_readings,
        previous_kwh=previous_kwh,
        change_percent_threshold=settings.sudden_change_percent,
    )

    for r in results:
        if r.measured_value >= settings.critical_threshold_w:
            severity = "High"
        elif r.measured_value >= settings.warning_threshold_w:
            severity = "Medium"
        elif r.measured_value >= settings.info_threshold_w:
            severity = "Low"
        else:
            severity = "Low"
        create_alert_if_new(
            db,
            {
                "building_id": r.building_id,
                "circuit_id": r.circuit_id,
                "alert_type": r.detection_type,
                "severity": severity,
                "description": r.message,
                "value": r.measured_value,
                "threshold": r.threshold,
                "is_simulated": is_simulated,
                "timestamp": ts,
            },
        )
    return results


def get_alerts(db: Session, building_id: str | None = None, circuit_id: str | None = None) -> List[Alert]:
    q = db.query(Alert)
    if building_id is not None:
        q = q.filter(Alert.building_id == building_id)
    if circuit_id is not None:
        q = q.filter(Alert.circuit_id == circuit_id)
    return q.order_by(Alert.timestamp.desc()).all()


def resolve_alert(db: Session, alert_id: str) -> Alert | None:
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if alert is None:
        return None
    alert.resolution_status = "resolved"
    alert.resolved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(alert)
    return alert


def acknowledge_alert(db: Session, alert_id: str) -> Alert | None:
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if alert is None:
        return None
    alert.resolution_status = "acknowledged"
    alert.acknowledged_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(alert)
    return alert
