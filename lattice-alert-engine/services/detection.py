"""Detection services (placeholder - no functionality yet)."""

from config.settings import get_settings


def evaluate_threshold(power_w: float) -> str | None:
    """Return a severity string if the power exceeds configured thresholds, else None."""
    settings = get_settings()
    if power_w >= settings.critical_threshold_w:
        return "critical"
    if power_w >= settings.warning_threshold_w:
        return "warning"
    if power_w >= settings.info_threshold_w:
        return "info"
    return None
