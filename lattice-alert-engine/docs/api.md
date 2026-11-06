# Lattice Alert Engine — API Reference

Base URL (dev): `http://127.0.0.1:8010`. All endpoints return JSON. Swagger UI: `/docs`.

## Endpoints

### GET /health
```json
{ "status": "ok", "service": "lattice-alert-engine", "timestamp": "2026-11-06T00:00:00+00:00" }
```

### GET /api/alerts
Query params: `building`, `circuit`, `severity` (Low|Medium|High), `status` (open|acknowledged|resolved), `limit` (1-500, default 50), `offset` (default 0).
```json
{ "data": [{ "id": "...", "building_id": "b1", "circuit_id": "c1", "alert_type": "fixed_threshold",
  "severity": "High", "description": "...", "timestamp": "...", "resolution_status": "open",
  "value": 5.0, "threshold": 1.0, "is_simulated": true }],
  "meta": { "serverTime": "...", "total": 1, "limit": 50, "offset": 0, "hasMore": false } }
```

### GET /api/alerts/{alert_id}
Returns `{ data: {...}, meta: {...} }` or 404 `{ "detail": "Alert not found" }`.

### POST /api/alerts
Request:
```json
{ "building_id": "b1", "circuit_id": "c1", "consumption_kwh": 5.0,
  "history": [0.5,0.5,0.5], "previous_kwh": 0.5, "is_simulated": true }
```
Response 201:
```json
{ "data": { "reading_id": "...", "alert_generated": true,
            "detections": [{ "detection_type": "fixed_threshold", ... }],
            "alerts": [{ "id": "...", "severity": "High", ... }] },
  "meta": { "serverTime": "..." } }
```
Validation: `consumption_kwh` must be >= 0 (422 otherwise); required fields enforced.

### PATCH /api/alerts/{alert_id}/resolve
Marks resolved. Returns updated alert or 404.

### PATCH /api/alerts/{alert_id}/acknowledge
Marks acknowledged. Returns updated alert or 404.

## Error handling
- 400: invalid severity filter.
- 404: alert not found.
- 422: validation failure (missing fields, negative consumption).
- 500: database error (rollback, generic message, no secrets/paths).