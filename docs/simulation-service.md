# Running the Lattice simulation as an online background service

The simulator lives inside the Lattice backend process (`apps/api`). It is not a
browser or frontend concern. As long as the backend process is running, simulated
devices keep generating readings at their configured intervals, persisting each
reading to SQLite, and the dashboard simply reads history from the database.

## Why this matters

- Readings survive browser close, logout, and local machine shutdown.
- Historical data is available when the dashboard is reopened.
- No open tab is required.

## Run persistently (choose one)

### Option A — Docker (recommended)
```bash
cd backend
docker compose up -d
```
- Container restarts automatically (`restart: unless-stopped`).
- SQLite data persists in the `lattice-data` volume.
- Set env vars in `docker-compose.yml` or a `.env` file.

### Option B — PM2 on a VM
```bash
cd backend
npm run build
pm2 start ecosystem.config.cjs
pm2 save && pm2 startup
```
PM2 restarts the process on crash and on reboot.

### Option C — systemd / any process supervisor
Run `node apps/api/dist/server.js` under a supervisor with `Restart=always`.

## Preventing duplicate workers

- Run **a single instance**. SQLite requires a single writer.
- The backend writes a `lattice.lock` file (in the data directory) and refuses to
  start if another live instance holds it.
- Reading inserts use `INSERT OR IGNORE` on `(device_id, timestamp)` as a
  secondary guard.

## Verifying persistence

1. Start the service, wait a few minutes.
2. Stop your browser / close the dashboard.
3. Reopen the dashboard later — historical readings are still present and
   continue growing (the backend kept running).
4. Restart the backend — the simulator backfills 24 h of history on startup and
   resumes live writes.

## Real devices

Real-device collection (Tuya/MQTT) is independent of the simulator. Both can run
together; `SIMULATION_ENABLED=false` disables only the simulator.