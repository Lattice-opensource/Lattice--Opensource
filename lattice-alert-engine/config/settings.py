"""Lattice Alert Engine configuration loaded from environment variables."""

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class AlertSettings(BaseSettings):
    """Application settings. All values are overridable via environment variables
    prefixed with ``ALERT_`` (see ``.env.example``)."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="ALERT_",
        extra="ignore",
    )

    # --- Database connection ---
    database_url: str = Field(
        default="sqlite:///./alert_engine.db",
        description="SQLAlchemy database URL (SQLite by default).",
    )

    # --- Maximum electricity consumption threshold (watts) ---
    max_consumption_threshold_w: float = Field(
        default=3000.0,
        description="Power level (W) above which a max-consumption alert fires.",
    )

    # --- Maximum consumption threshold for readings (kWh per reading) ---
    max_consumption_threshold_kwh: float = Field(
        default=1.0,
        description="Consumption (kWh) above which a fixed-threshold alert fires.",
    )

    # --- Minimum history for baseline detection ---
    min_history_readings: int = Field(
        default=3,
        description="Minimum number of historical readings required for baseline detection.",
    )

    # --- Historical baseline multiplier ---
    historical_baseline_multiplier: float = Field(
        default=1.5,
        description="Alert when current consumption exceeds baseline * multiplier.",
    )

    # --- Sudden consumption change percentage ---
    sudden_change_percent: float = Field(
        default=30.0,
        description="Percent change between consecutive readings that triggers an alert.",
    )

    # --- Alert severity rules (watts) ---
    critical_threshold_w: float = Field(default=5000.0)
    warning_threshold_w: float = Field(default=3000.0)
    info_threshold_w: float = Field(default=1500.0)

    # --- Evaluation interval ---
    evaluation_interval_seconds: int = Field(default=60)


_settings: AlertSettings | None = None


def get_settings() -> AlertSettings:
    """Return a cached settings instance."""
    global _settings
    if _settings is None:
        _settings = AlertSettings()
    return _settings


def reset_settings() -> None:
    """Clear cached settings (useful in tests)."""
    global _settings
    _settings = None
