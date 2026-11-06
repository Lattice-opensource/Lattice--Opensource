"""Database connection helpers for the Lattice Alert Engine."""

import logging
from sqlalchemy import create_engine
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import sessionmaker, declarative_base

from config.settings import get_settings

logger = logging.getLogger(__name__)


def _connect_args(url: str) -> dict:
    # SQLite requires check_same_thread=False when used with FastAPI threads.
    if url.startswith("sqlite"):
        return {"check_same_thread": False}
    return {}


_settings = get_settings()
engine = create_engine(_settings.database_url, connect_args=_connect_args(_settings.database_url))
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def init_db() -> None:
    """Create all tables if they do not exist (idempotent)."""
    try:
        # Import models so their tables are registered on Base.metadata.
        import models.alert  # noqa: F401
        import models.reading  # noqa: F401

        Base.metadata.create_all(bind=engine)
        logger.info("Database initialized: %s", _settings.database_url)
    except SQLAlchemyError as exc:
        logger.error("Database initialization failed: %s", exc)
        raise


def get_db():
    """FastAPI dependency yielding a DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
