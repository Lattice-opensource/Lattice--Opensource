"""Lattice Alert Engine - FastAPI application entry point."""

from fastapi import FastAPI

from config.database import init_db
from api.routes import router

init_db()

app = FastAPI(title="Lattice Alert Engine", version="0.1.0")
app.include_router(router)


@app.get("/health")
def health() -> dict:
    from datetime import datetime, timezone

    return {"status": "ok", "service": "lattice-alert-engine", "timestamp": datetime.now(timezone.utc).isoformat()}
