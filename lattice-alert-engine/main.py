"""Lattice Alert Engine - FastAPI application entry point."""

from config.database import Base, engine
from api.routes import router

# Create tables on startup (dev convenience).
Base.metadata.create_all(bind=engine)

from fastapi import FastAPI

app = FastAPI(title="Lattice Alert Engine", version="0.1.0")
app.include_router(router)


@app.get("/health")
def health() -> dict:
    from datetime import datetime, timezone

    return {"status": "ok", "service": "lattice-alert-engine", "timestamp": datetime.now(timezone.utc).isoformat()}
