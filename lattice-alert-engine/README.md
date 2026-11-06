# Lattice Alert Engine

Independent module for the Lattice smart energy monitoring platform.

## Status
Placeholder — structure only. No functionality implemented yet. Awaiting approval before implementing.

## Purpose
Detect and manage energy-related alerts (e.g. threshold breaches, spikes, offline devices) based on Lattice energy readings, in isolation from the core Lattice OS modules.

## Planned contents
- `api/` — API routes
- `services/` — business logic and detection services
- `models/` — database models
- `config/` — configuration
- `tests/` — tests
- `sample-data/` — sample data
- `docs/` — documentation

## Setup (Python 3.11+)
```bash
cd lattice-alert-engine
python -m venv .venv
# Windows: .venv\\Scripts\\activate   |   macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --port 8010
```

## Configuration
See `docs/configuration.md` and `.env.example`. All thresholds are env-configurable.

## Status
Structure + configuration only. No detection functionality implemented yet. Awaiting approval.

## Rules
- Isolated from existing Lattice OS modules.
- FastAPI + SQLAlchemy + SQLite (independent Python service).
- No modifications to the main application without approval.