"""Load simulated sample readings into SQLite and run detection.

Usage (from the module root):
    python sample-data/load_sample_data.py

The script is idempotent: re-running it will not insert duplicate readings or alerts.
"""

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

# Ensure module root is on sys.path
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from sqlalchemy.orm import Session  # noqa: E402

from config.database import SessionLocal, init_db  # noqa: E402
from models.reading import Reading  # noqa: E402
from services.alert_service import generate_alerts  # noqa: E402


def _parse_ts(value: str) -> datetime:
    # Accept ISO-8601 UTC with trailing Z.
    if value.endswith("Z"):
        value = value[:-1] + "+00:00"
    dt = datetime.fromisoformat(value)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def _reading_exists(db: Session, building_id: str, circuit_id: str, timestamp: datetime) -> bool:
    from models.reading import Reading

    existing = db.query(Reading).filter(
        Reading.building_id == building_id,
        Reading.circuit_id == circuit_id,
        Reading.timestamp == timestamp,
    ).first()
    return existing is not None


def main() -> None:
    init_db()
    db: Session = SessionLocal()

    sample_path = ROOT / "sample-data" / "sample_readings.json"
    with sample_path.open("r", encoding="utf-8") as f:
        readings = json.load(f)

    # Preserve historical order: sort by timestamp, then building/circuit.
    readings.sort(key=lambda r: (r["timestamp"], r["building_id"], r["circuit_id"]))

    inserted = 0
    skipped = 0
    alerts_created = 0

    # Track per-circuit history to feed baseline detection.
    history_map: dict[tuple[str, str], list[float]] = {}
    previous_map: dict[tuple[str, str], float | None] = {}

    for entry in readings:
        building_id = entry["building_id"]
        circuit_id = entry["circuit_id"]
        consumption = float(entry["consumption_kwh"])
        ts = _parse_ts(entry["timestamp"])
        key = (building_id, circuit_id)

        if _reading_exists(db, building_id, circuit_id, ts):
            skipped += 1
            # Still update history tracking for subsequent readings.
            history_map.setdefault(key, []).append(consumption)
            previous_map[key] = consumption
            continue

        # Persist reading.
        reading = Reading(
            building_id=building_id,
            circuit_id=circuit_id,
            consumption_kwh=consumption,
            timestamp=ts,
        )
        db.add(reading)
        db.commit()

        history = list(history_map.get(key, []))
        previous = previous_map.get(key)

        results, persisted = generate_alerts(
            db,
            building_id=building_id,
            circuit_id=circuit_id,
            consumption_kwh=consumption,
            reading_timestamp=ts,
            history=history,
            previous_kwh=previous,
            is_simulated=True,
        )
        alerts_created += len(persisted)

        history_map.setdefault(key, []).append(consumption)
        previous_map[key] = consumption
        inserted += 1

        print(f"[{ts.isoformat()}] {building_id}/{circuit_id}: {consumption} kWh -> {len(results)} detection(s), {len(persisted)} alert(s)")

    db.close()
    print(f"\nDone. Inserted={inserted}, skipped(duplicate)={skipped}, alerts_created={alerts_created}")


if __name__ == "__main__":
    main()
