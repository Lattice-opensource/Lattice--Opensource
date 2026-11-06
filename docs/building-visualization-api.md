# Lattice Building Visualization — Backend API

Base URL: `http://localhost:8000/api`. All responses: `{ data, meta: { serverTime, ... } }`. Errors: `{ error: { code, message, details?, requestId } }`.

## Buildings
- `GET /buildings?siteId=&limit=&offset=` — list
- `POST /buildings` — `{ siteId, name, address?, description?, floorCount? }`
- `GET /buildings/:id`
- `PUT /buildings/:id`
- `DELETE /buildings/:id`

## Floors
- `GET /buildings/:buildingId/floors`
- `POST /buildings/:buildingId/floors` — `{ level, name, blueprintRef? }`
- `GET /floors/:id`
- `PUT /floors/:id`
- `DELETE /floors/:id`

## Rooms
- `GET /floors/:floorId/rooms`
- `GET /rooms/:id`
- `PUT /rooms/:id` — `{ name?, roomType?, areaSqm?, x?, y?, width?, height?, boundary?, buildingId?, floorId?, circuitId? }`
- `DELETE /rooms/:id`

## Blueprints
- `POST /floors/:floorId/blueprint` (multipart, field `file`: PDF/PNG/JPEG, ≤10MB)
- `GET /floors/:floorId/blueprints`
- `GET /blueprints/:id/file` (serves original)
- `DELETE /blueprints/:id`

## Appliances
- `GET /rooms/:roomId/appliances`
- `GET /appliances/:id`
- `POST /appliances` — `{ name, type, roomId?, circuitId?, deviceId?, manufacturer?, model?, ratedPowerW?, monitoringMethod?, status?, positionX?, positionY? }`
- `PUT /appliances/:id`
- `DELETE /appliances/:id`

## Meters
- `GET /meters?siteId=&limit=&offset=`
- `POST /meters` — `{ siteId, name, type?, unit?, dataSource? }`
- `GET /meters/:id`
- `DELETE /meters/:id`

## Circuits
- `GET /circuits`
- `POST /circuits` — `{ name, floorId?, meterId? }`
- `GET /circuits/:id`
- `DELETE /circuits/:id`

## Energy
- `POST /energy-readings` — `{ entityType, entityId, timestamp?, powerW?, energyKwh?, measurementSource?, isSimulated? }`
- `GET /energy-readings?entityType=&entityId=&from=&to=&limit=`
- `GET /buildings/:id/energy?from=&to=`
- `GET /rooms/:id/energy?from=&to=`
- `GET /appliances/:id/energy?from=&to=`

## Alerts (proxy to Alert Engine)
- `GET /buildings/:id/alerts` — associated alerts (room/circuit/building level).

## Authorization
Relies on the existing optional `API_KEY` guard (`x-api-key` header). Building-level access restrictions are not yet enforced beyond site scoping (future work).