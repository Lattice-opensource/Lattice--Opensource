"""Alert database model."""

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, func

from config.database import Base


class Alert(Base):
    """Persisted alert record."""

    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(String, index=True, nullable=True)
    device_id = Column(String, index=True, nullable=True)
    alert_type = Column(String, nullable=False)
    severity = Column(String, nullable=False)  # info | warning | critical
    message = Column(String, nullable=False)
    value = Column(Float, nullable=True)
    threshold = Column(Float, nullable=True)
    is_simulated = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
