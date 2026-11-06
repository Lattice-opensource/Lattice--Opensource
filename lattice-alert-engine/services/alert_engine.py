"""Backward-compatible alias for the alert management service."""

from services.alert_service import (  # noqa: F401
    generate_alerts,
    get_alerts,
    resolve_alert,
    acknowledge_alert,
    process_reading,
)

__all__ = ["generate_alerts", "get_alerts", "resolve_alert", "acknowledge_alert", "process_reading"]
