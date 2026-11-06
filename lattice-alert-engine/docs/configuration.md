# Configuration

All settings are loaded from environment variables prefixed with `ALERT_`
(see `.env.example`). Defaults are sensible for local development.

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `ALERT_DATABASE_URL` | `sqlite:///./alert_engine.db` | SQLAlchemy database URL |
| `ALERT_MAX_CONSUMPTION_THRESHOLD_W` | `3000.0` | Max power (W) before a max-consumption alert |
| `ALERT_HISTORICAL_BASELINE_MULTIPLIER` | `1.5` | Alert when consumption exceeds baseline * multiplier |
| `ALERT_SUDDEN_CHANGE_PERCENT` | `30.0` | Percent change between readings triggering an alert |
| `ALERT_CRITICAL_THRESHOLD_W` | `5000.0` | Critical severity threshold (W) |
| `ALERT_WARNING_THRESHOLD_W` | `3000.0` | Warning severity threshold (W) |
| `ALERT_INFO_THRESHOLD_W` | `1500.0` | Info severity threshold (W) |
| `ALERT_EVALUATION_INTERVAL_SECONDS` | `60` | Evaluation loop interval |

## Secrets
Never commit `.env` or production credentials. `.env` is gitignored.