# Lattice Alert Engine

Independent, deployable service that detects unusual electricity consumption patterns for
the Lattice smart energy monitoring platform.

> **Important:** This engine identifies *unusual consumption patterns* in simulated or
> real readings. It does **not** detect or diagnose real electrical faults.

## 1. Project overview
The Lattice Alert Engine is a standalone FastAPI service backed by SQLite. It accepts
electricity consumption readings, runs three independent detection methods, and
generates persisted, deduplicated alerts. It is intentionally isolated from the main
Lattice OS application and communicates only over HTTP REST.

## 2. Architecture and module responsibilities
```
lattice-alert-engine/
  main.py                 # FastAPI app entry point
  config/                 # Settings (env) + DB connection
  models/                 # SQLAlchemy models (Reading, Alert)
  services/               # Detection logic + alert management
  repositories/           # Persistence helpers (deduplication)
  api/                    # REST routes (thin, delegate to services)
  tests/                  # Pytest suite
  sample-data/            # Simulated readings + idempotent loader
  docs/                   # Documentation
```
- `services/detection.py` — pure detection functions (no DB/API).
- `services/alert_service.py` — orchestrates detection + persistence.
- `models/` — SQLAlchemy models.
- `repositories/alerts.py` — dedup + create helpers.
- `api/routes.py` — HTTP layer.

## 3. Technology stack
- Python 3.11+
- FastAPI (REST + auto OpenAPI/Swagger at `/docs`)
- SQLAlchemy 2.x + SQLite
- Pydantic v2 / pydantic-settings
- pytest + httpx (testing)

## 4. Installation
```bash
cd lattice-alert-engine
python -m venv .venv
# Windows: .venv\Scripts\activate   |   macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

## 5. Dependency installation
```bash
pip install -r requirements.txt
```
Dependencies: `fastapi`, `uvicorn[standard]`, `sqlalchemy`, `pydantic-settings`, `python-dotenv`, `httpx`.

## 6. Environment configuration
See `.env.example` and `docs/configuration.md`. All thresholds are env-configurable
(`ALERT_` prefix). Never commit `.env`.

## 7. Database initialization
Tables are created automatically on startup via `Base.metadata.create_all`. The SQLite
file is configured by `ALERT_DATABASE_URL` (default `sqlite:///./alert_engine.db`).
Data persists across restarts.

## 8. Start the application
```bash
uvicorn main:app --reload --port 8010
```
Health: `GET http://127.0.0.1:8010/health`
Swagger: `http://127.0.0.1:8010/docs`

## 9. Load sample data
```bash
python sample-data/load_sample_data.py
```
Idempotent. See `docs/sample-data.md`.

## 10. Run automated tests
```bash
python -m pytest tests/ -v
```

## 11. API endpoint documentation
See `docs/api.md`.

## 12–13. Example requests/responses
See `docs/api.md`.

## 14. Alert severity explanations
- **High**: measured value >= `ALERT_CRITICAL_THRESHOLD_W` (default 5000 W equivalent) or fixed-threshold breach at critical level.
- **Medium**: >= `ALERT_WARNING_THRESHOLD_W` (default 3000).
- **Low**: >= `ALERT_INFO_THRESHOLD_W` (default 1500) or baseline/sudden-change detections below warning.
Severity is configurable via environment variables.

## 15. Detection algorithm explanations
- **Fixed threshold**: fires when `consumption_kwh > max_consumption_threshold_kwh`.
- **Historical baseline**: computes average of prior readings (excluding the current one); fires when current > `baseline * historical_baseline_multiplier`. Requires `min_history_readings` (default 3). Handles missing/insufficient history and zero baseline safely.
- **Sudden change**: percentage change vs previous reading; fires when increase exceeds `sudden_change_percent`. Handles missing/zero previous safely.

## 16. SQLite database schema
See `docs/configuration.md` and models. Tables: `readings` (id, building_id, circuit_id, consumption_kwh, timestamp) and `alerts` (id, building_id, circuit_id, alert_type, severity, description, timestamp, resolution_status, value, threshold, is_simulated, acknowledged_at, resolved_at). Indexes on building_id, circuit_id, timestamp, alert_type, severity, resolution_status.

## 17. Error handling
- 400 `INVALID...` for bad severity; 404 for missing alerts; 422 for validation failures (negative consumption, missing fields); 500 for DB errors (rollback + message). No secrets or stack traces exposed.

## 18. Known limitations
- Python 3.11+ required; not verified in this environment.
- Cost estimates (if added) would be estimates, not utility bills.
- Does not detect real electrical faults.
- Single SQLite file; not for high-concurrency production.
- Tuya/hardware integration not implemented.

## Integration
See `docs/integration.md`.