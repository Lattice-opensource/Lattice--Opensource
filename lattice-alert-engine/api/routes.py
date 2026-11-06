"""API routes for the Lattice Alert Engine (placeholder)."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from config.database import get_db
from models.alert import Alert

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "lattice-alert-engine", "timestamp": datetime.now(timezone.utc).isoformat()}


@router.get("/")
def list_alerts(db: Session = Depends(get_db)) -> dict:
    alerts = db.query(Alert).order_by(Alert.created_at.desc()).limit(100).all()
    return {"data": alerts, "meta": {"serverTime": datetime.now(timezone.utc).isoformat(), "total": len(alerts)}}
