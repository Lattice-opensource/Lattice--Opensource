"""REST API routes for the Lattice Alert Engine."""

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from config.database import get_db
from models.alert import Alert, ALLOWED_SEVERITIES
from models.reading import Reading
from services.alert_service import generate_alerts, resolve_alert, acknowledge_alert

router = APIRouter(tags=["alerts"])


class ReadingInput(BaseModel):
    building_id: str = Field(..., min_length=1)
    circuit_id: str = Field(..., min_length=1)
    consumption_kwh: float = Field(..., ge=0)
    timestamp: datetime | None = None
    history: list[float] | None = None
    previous_kwh: float | None = None
    is_simulated: bool = False


@router.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "lattice-alert-engine", "timestamp": datetime.now(timezone.utc).isoformat()}


@router.get("/alerts")
def list_alerts(
    building: Optional[str] = Query(default=None, alias="building"),
    circuit: Optional[str] = Query(default=None, alias="circuit"),
    severity: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None, alias="status"),
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> dict:
    q = db.query(Alert)
    if building is not None:
        q = q.filter(Alert.building_id == building)
    if circuit is not None:
        q = q.filter(Alert.circuit_id == circuit)
    if severity is not None:
        if severity not in ALLOWED_SEVERITIES:
            raise HTTPException(status_code=400, detail=f"severity must be one of {ALLOWED_SEVERITIES}")
        q = q.filter(Alert.severity == severity)
    if status is not None:
        q = q.filter(Alert.resolution_status == status)
    total = q.count()
    rows = q.order_by(Alert.timestamp.desc()).offset(offset).limit(limit).all()
    return {
        "data": [_alert_to_dict(a) for a in rows],
        "meta": {
            "serverTime": datetime.now(timezone.utc).isoformat(),
            "total": total,
            "limit": limit,
            "offset": offset,
            "hasMore": offset + len(rows) < total,
        },
    }


@router.get("/alerts/{alert_id}")
def get_alert(alert_id: str, db: Session = Depends(get_db)) -> dict:
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"data": _alert_to_dict(alert), "meta": {"serverTime": datetime.now(timezone.utc).isoformat()}}


@router.post("/alerts", status_code=201)
def create_alert(payload: ReadingInput, db: Session = Depends(get_db)) -> dict:
    # Store the reading first.
    ts = payload.timestamp or datetime.now(timezone.utc)
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)
    reading = Reading(
        building_id=payload.building_id,
        circuit_id=payload.circuit_id,
        consumption_kwh=payload.consumption_kwh,
        timestamp=ts,
    )
    db.add(reading)
    try:
        db.commit()
        db.refresh(reading)
    except Exception as exc:  # noqa: BLE001
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to store reading: {exc}")

    results, persisted = generate_alerts(
        db,
        building_id=payload.building_id,
        circuit_id=payload.circuit_id,
        consumption_kwh=payload.consumption_kwh,
        reading_timestamp=ts,
        history=payload.history,
        previous_kwh=payload.previous_kwh,
        is_simulated=payload.is_simulated,
    )

    alert_generated = len(results) > 0
    return {
        "data": {
            "reading_id": reading.id,
            "alert_generated": alert_generated,
            "detections": [r.to_dict() for r in results],
            "alerts": [_alert_to_dict(a) for a in persisted],
        },
        "meta": {"serverTime": datetime.now(timezone.utc).isoformat()},
    }


@router.patch("/alerts/{alert_id}/resolve")
def resolve(alert_id: str, db: Session = Depends(get_db)) -> dict:
    alert = resolve_alert(db, alert_id)
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"data": _alert_to_dict(alert), "meta": {"serverTime": datetime.now(timezone.utc).isoformat()}}


@router.patch("/alerts/{alert_id}/acknowledge")
def acknowledge(alert_id: str, db: Session = Depends(get_db)) -> dict:
    alert = acknowledge_alert(db, alert_id)
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"data": _alert_to_dict(alert), "meta": {"serverTime": datetime.now(timezone.utc).isoformat()}}


def _reading_to_dict(r: Reading) -> dict:
    return {
        "id": r.id,
        "building_id": r.building_id,
        "circuit_id": r.circuit_id,
        "consumption_kwh": r.consumption_kwh,
        "timestamp": r.timestamp.isoformat() if r.timestamp else None,
    }


def _alert_to_dict(a: Alert) -> dict:
    return {
        "id": a.id,
        "building_id": a.building_id,
        "circuit_id": a.circuit_id,
        "alert_type": a.alert_type,
        "severity": a.severity,
        "description": a.description,
        "timestamp": a.timestamp.isoformat() if a.timestamp else None,
        "resolution_status": a.resolution_status,
        "value": a.value,
        "threshold": a.threshold,
        "is_simulated": a.is_simulated,
    }
