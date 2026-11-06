"""Orchestration: run detection and persist deduplicated alerts."""

from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy.orm import Session

from config.settings import get_settings
from services.detection import DetectionResult, run_all_detections
from repositories.alerts import create_alert_if_new


def process_reading(
    db: Session,
    *,
    building_id: str,
    circuit_id: str,
    consumption_kwh: float,
    reading_timestamp,
    history: Optional[List[float]] = None,
    previous_kwh: Optional[float] = None,
    is_simulated: bool = False,
) -> List[DetectionResult]:
    settings = get_settings()
    ts = reading_timestamp
    if not hasattr(ts, "tzinfo") or ts.tzinfo is None:
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
