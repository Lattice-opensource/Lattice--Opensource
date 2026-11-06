"""Reading database model (electricity consumption sample)."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, Integer, String, func

from config.database import Base


class Reading(Base):
    """A single electricity consumption reading for a building/circuit."""

    __tablename__ = "readings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    building_id = Column(String, nullable=False, index=True)
    circuit_id = Column(String, nullable=False, index=True)
    consumption_kwh = Column(Float, nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True, default=lambda: datetime.now(timezone.utc))
