"""Core energy consumption detection engine.

Pure functions only: no database, no API, no side effects. Detection logic is
fully isolated from persistence and transport layers.
"""

from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


@dataclass
class DetectionResult:
    detection_type: str
    building_id: str
    circuit_id: str
    reading_timestamp: str
    measured_value: float
    threshold: Optional[float] = None
    baseline: Optional[float] = None
    change_percent: Optional[float] = None
    message: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


def _ts_str(ts) -> str:
    if isinstance(ts, datetime):
        if ts.tzinfo is None:
            return ts.isoformat()
        return ts.astimezone(timezone.utc).isoformat()
    return str(ts)


def detect_fixed_threshold(
    *,
    building_id: str,
    circuit_id: str,
    consumption_kwh: float,
    threshold_kwh: float,
    reading_timestamp,
) -> Optional[DetectionResult]:
    """A. Fixed threshold detection."""
    if threshold_kwh is None or threshold_kwh <= 0:
        return None
    if consumption_kwh is None:
        return None
    if consumption_kwh > threshold_kwh:
        return DetectionResult(
            detection_type="fixed_threshold",
            building_id=building_id,
            circuit_id=circuit_id,
            reading_timestamp=_ts_str(reading_timestamp),
            measured_value=float(consumption_kwh),
            threshold=float(threshold_kwh),
            message=f"Consumption {consumption_kwh} kWh exceeded threshold {threshold_kwh} kWh.",
        )
    return None


def detect_historical_baseline(
    *,
    building_id: str,
    circuit_id: str,
    consumption_kwh: float,
    history: List[float],
    baseline_multiplier: float,
    min_history: int,
    reading_timestamp,
) -> Optional[DetectionResult]:
    """B. Historical baseline detection.

    `history` must NOT include the current reading (caller's responsibility).
    """
    if history is None or len(history) < min_history:
        return None
    if baseline_multiplier is None or baseline_multiplier <= 0:
        return None
    if consumption_kwh is None:
        return None
    # Filter out None/non-numeric
    values = [float(v) for v in history if v is not None]
    if len(values) < min_history:
        return None
    baseline = sum(values) / len(values)
    if baseline <= 0:
        # Avoid division by zero / meaningless comparison; only flag if consumption positive
        if consumption_kwh > 0:
            return DetectionResult(
                detection_type="historical_baseline",
                building_id=building_id,
                circuit_id=circuit_id,
                reading_timestamp=_ts_str(reading_timestamp),
                measured_value=float(consumption_kwh),
                threshold=float(baseline * baseline_multiplier),
                baseline=float(baseline),
                message=f"Consumption {consumption_kwh} kWh exceeded baseline {baseline} kWh * {baseline_multiplier}.",
            )
        return None
    if consumption_kwh > baseline * baseline_multiplier:
        return DetectionResult(
            detection_type="historical_baseline",
            building_id=building_id,
            circuit_id=circuit_id,
            reading_timestamp=_ts_str(reading_timestamp),
            measured_value=float(consumption_kwh),
            threshold=float(baseline * baseline_multiplier),
            baseline=float(baseline),
            message=f"Consumption {consumption_kwh} kWh exceeded baseline {baseline} kWh * {baseline_multiplier}.",
        )
    return None


def detect_sudden_change(
    *,
    building_id: str,
    circuit_id: str,
    current_kwh: float,
    previous_kwh: Optional[float],
    change_percent_threshold: float,
    reading_timestamp,
) -> Optional[DetectionResult]:
    """C. Sudden consumption change detection (increases only)."""
    if previous_kwh is None:
        return None
    try:
        prev = float(previous_kwh)
        cur = float(current_kwh)
    except (TypeError, ValueError):
        return None
    if prev <= 0:
        # Cannot compute meaningful percentage; skip to avoid false positives
        return None
    change_pct = ((cur - prev) / prev) * 100.0
    if change_pct > change_percent_threshold:
        return DetectionResult(
            detection_type="sudden_change",
            building_id=building_id,
            circuit_id=circuit_id,
            reading_timestamp=_ts_str(reading_timestamp),
            measured_value=cur,
            threshold=float(change_percent_threshold),
            change_percent=float(change_pct),
            message=f"Consumption changed by {change_pct:.2f}% (threshold {change_percent_threshold}%).",
        )
    return None


def run_all_detections(
    *,
    building_id: str,
    circuit_id: str,
    consumption_kwh: float,
    reading_timestamp,
    threshold_kwh: float,
    history: Optional[List[float]] = None,
    baseline_multiplier: float = 1.5,
    min_history: int = 3,
    previous_kwh: Optional[float] = None,
    change_percent_threshold: float = 30.0,
) -> List[DetectionResult]:
    """Run all three detection methods and return non-None results."""
    results: List[DetectionResult] = []
    r = detect_fixed_threshold(
        building_id=building_id,
        circuit_id=circuit_id,
        consumption_kwh=consumption_kwh,
        threshold_kwh=threshold_kwh,
        reading_timestamp=reading_timestamp,
    )
    if r is not None:
        results.append(r)
    r = detect_historical_baseline(
        building_id=building_id,
        circuit_id=circuit_id,
        consumption_kwh=consumption_kwh,
        history=history or [],
        baseline_multiplier=baseline_multiplier,
        min_history=min_history,
        reading_timestamp=reading_timestamp,
    )
    if r is not None:
        results.append(r)
    r = detect_sudden_change(
        building_id=building_id,
        circuit_id=circuit_id,
        current_kwh=consumption_kwh,
        previous_kwh=previous_kwh,
        change_percent_threshold=change_percent_threshold,
        reading_timestamp=reading_timestamp,
    )
    if r is not None:
        results.append(r)
    return results
