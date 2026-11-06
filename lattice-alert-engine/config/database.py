"""Database connection helpers for the Lattice Alert Engine."""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from config.settings import get_settings


def _connect_args(url: str) -> dict:
    # SQLite requires check_same_thread=False when used with FastAPI threads.
    if url.startswith("sqlite"):
        return {"check_same_thread": False}
    return {}


_settings = get_settings()
engine = create_engine(_settings.database_url, connect_args=_connect_args(_settings.database_url))
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency yielding a DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
