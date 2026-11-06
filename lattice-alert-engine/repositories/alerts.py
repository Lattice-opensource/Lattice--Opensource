"""Alert persistence and deduplication helpers."""

from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from models.alert import Alert


def is_duplicate_alert(
    db: Session,
    *,
    building_id: str,
    circuit_id: str | None,
    alert_type: str,
    timestamp,
) -> bool:
    """Return True if an alert with the same key already exists (dedup)."""
    q = db.query(Alert).filter(
        Alert.building_id == building_id,
        Alert.alert_type == alert_type,
    )
    if circuit_id is not None:
        q = q.filter(Alert.circuit_id == circuit_id)
    # Match on timestamp truncated to seconds
    ts_str = timestamp.isoformat() if hasattr(timestamp, "isoformat") else str(timestamp)
    # Compare by string prefix (seconds precision)
    for a in q.all():
        if a.timestamp and a.timestamp.isoformat().split(".")[0] == ts_str.split(".")[0]:
            return True
    return False


def create_alert_if_new(db: Session, alert_data: dict) -> Optional[Alert]:
    """Create an alert only if no duplicate exists for the same reading/event."""
    if is_duplicate_alert(
        db,
        building_id=alert_data["building_id"],
        circuit_id=alert_data.get("circuit_id"),
        alert_type=alert_data["alert_type"],
        timestamp=alert_data["timestamp"],
    ):
        return None
    alert = Alert(**alert_data)
    db.add(alert)
    try:
        db.commit()
        db.refresh(alert)
    except Exception:  # noqa: BLE001
        db.rollback()
        return None
    return alert
