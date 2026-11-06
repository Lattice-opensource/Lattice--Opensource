"""API routes for the Lattice Alert Engine."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from config.database import get_db
from models.alert import Alert, ALLOWED_SEVERITIES, STATUS_OPEN
from models.reading import Reading
from services.alert_service import generate_alerts, resolve_alert, acknowledge_alert

router = APIRouter(prefix="/api", tags=["alert-engine"])


class ReadingCreate(BaseModel):
    building_id: str
    circuit_id: str
    consumption_kwh: float = Field(ge=0)
    timestamp: datetime | None = None


class AlertCreate(BaseModel):
    building_id: str
    circuit_id: str | None = None
    alert_type: str
    severity: str
    description: str
    value: float | None = None
    threshold: float | None = None
    is_simulated: bool = False


@router.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "lattice-alert-engine", "timestamp": datetime.now(timezone.utc).isoformat()}


@router.get("/readings")
def list_readings(db: Session = Depends(get_db)) -> dict:
    rows = db.query(Reading).order_by(Reading.timestamp.desc()).limit(500).all()
    return {"data": [_reading_to_dict(r) for r in rows], "meta": {"serverTime": datetime.now(timezone.utc).isoformat(), "total": len(rows)}}


@router.post("/readings", status_code=201)
def create_reading(payload: ReadingCreate, db: Session = Depends(get_db)) -> dict:
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
    return _reading_to_dict(reading)


@router.get("/alerts")
def list_alerts(db: Session = Depends(get_db)) -> dict:
    rows = db.query(Alert).order_by(Alert.timestamp.desc()).limit(500).all()
    return {"data": [_alert_to_dict(a) for a in rows], "meta": {"serverTime": datetime.now(timezone.utc).isoformat(), "total": len(rows)}}


class ReadingInput(BaseModel):
    building_id: str
    circuit_id: str
    consumption_kwh: float = Field(ge=0)
    timestamp: datetime | None = None
    history: list[float] | None = None
    previous_kwh: float | None = None
    is_simulated: bool = False


@router.post("/alerts/generate", status_code=201)
def generate(payload: ReadingInput, db: Session = Depends(get_db)) -> dict:
    results = generate_alerts(
        db,
        building_id=payload.building_id,
        circuit_id=payload.circuit_id,
        consumption_kwh=payload.consumption_kwh,
        reading_timestamp=payload.timestamp,
        history=payload.history,
        previous_kwh=payload.previous_kwh,
        is_simulated=payload.is_simulated,
    )
    return {"data": [r.to_dict() for r in results], "meta": {"serverTime": datetime.now(timezone.utc).isoformat(), "total": len(results)}}


@router.post("/alerts/{alert_id}/resolve")
def resolve(alert_id: str, db: Session = Depends(get_db)) -> dict:
    alert = resolve_alert(db, alert_id)
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    return _alert_to_dict(alert)


@router.post("/alerts/{alert_id}/acknowledge")
def acknowledge(alert_id: str, db: Session = Depends(get_db)) -> dict:
    alert = acknowledge_alert(db, alert_id)
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    return _alert_to_dict(alert)


@router.post("/alerts", status_code=201)
def create_alert(payload: AlertCreate, db: Session = Depends(get_db)) -> dict:
    if payload.severity not in ALLOWED_SEVERITIES:
        raise HTTPException(status_code=400, detail=f"severity must be one of {ALLOWED_SEVERITIES}")
    alert = Alert(
        building_id=payload.building_id,
        circuit_id=payload.circuit_id,
        alert_type=payload.alert_type,
        severity=payload.severity,
        description=payload.description,
        value=payload.value,
        threshold=payload.threshold,
        is_simulated=payload.is_simulated,
        timestamp=datetime.now(timezone.utc),
    )
    db.add(alert)
    try:
        db.commit()
        db.refresh(alert)
    except Exception as exc:  # noqa: BLE001
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to store alert: {exc}")
    return _alert_to_dict(alert)


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
