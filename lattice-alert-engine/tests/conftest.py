"""Pytest configuration and shared fixtures for Lattice Alert Engine tests."""

import os
import tempfile
from pathlib import Path

_TMP_DIR = Path(tempfile.mkdtemp())
_TMP_DB = _TMP_DIR / "alert_test.db"
os.environ["ALERT_DATABASE_URL"] = f"sqlite:///{_TMP_DB}"
os.environ.setdefault("ALERT_MAX_CONSUMPTION_THRESHOLD_KWH", "1.0")
os.environ.setdefault("ALERT_MIN_HISTORY_READINGS", "3")

import pytest  # noqa: E402

from config import settings  # noqa: E402
from config.database import Base, SessionLocal, engine, init_db  # noqa: E402
from models.alert import Alert  # noqa: E402
from models.reading import Reading  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def _init_db():
    settings.reset_settings()
    init_db()
    yield
    # cleanup file
    try:
        engine.dispose()
    except Exception:  # noqa: BLE001
        pass


@pytest.fixture()
def db_session():
    db = SessionLocal()
    try:
        db.query(Alert).delete()
        db.query(Reading).delete()
        db.commit()
        yield db
    finally:
        db.rollback()
        db.query(Alert).delete()
        db.query(Reading).delete()
        db.commit()
        db.close()


@pytest.fixture()
def client():
    from fastapi.testclient import TestClient
    from main import app

    # clean db
    db = SessionLocal()
    db.query(Alert).delete()
    db.query(Reading).delete()
    db.commit()
    db.close()

    with TestClient(app) as c:
        yield c

    db = SessionLocal()
    db.query(Alert).delete()
    db.query(Reading).delete()
    db.commit()
    db.close()
