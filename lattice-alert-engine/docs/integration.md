# Integration with Lattice OS

The Alert Engine is an independent, deployable service. The main Lattice OS app
communicates with it over HTTP REST only.

## API base URL
- Dev: `http://127.0.0.1:8010`
- Configure via deployment environment.

## Request/response formats
JSON, UTF-8. See `docs/api.md`.

## Example integration request
```bash
curl -X POST http://127.0.0.1:8010/api/alerts \
  -H "Content-Type: application/json" \
  -d '{"building_id":"b1","circuit_id":"c1","consumption_kwh":5.0,
       "history":[0.5,0.5,0.5],"previous_kwh":0.5,"is_simulated":true}'
```

## Error handling
Standard HTTP status codes (400/404/422/500) with JSON bodies. No secrets or paths exposed.

## Service startup
```bash
cd lattice-alert-engine
python -m venv .venv && .venv/Scripts/activate  # Windows
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --port 8010
```

## Configuration requirements
All thresholds via env vars (see `docs/configuration.md`). Use a separate SQLite file
(`ALERT_DATABASE_URL`) — do not point at the main Lattice OS database.

## Authentication & network security
- No auth implemented yet; deploy behind a trusted network/reverse proxy.
- Keep `.env` out of Git.
- Do not expose device credentials or local keys.

## Integration boundaries
- Alert Engine does not modify Lattice OS business logic.
- Communication is HTTP only; no shared DB.
- Engine identifies unusual consumption patterns, not real electrical faults.