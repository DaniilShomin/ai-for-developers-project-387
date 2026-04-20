"""Application configuration using pydantic-settings.

All settings can be overridden via environment variables or .env file.
Environment variables take precedence over defaults.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with validation."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",  # Allow extra env vars without error
    )

    # Database
    database_url: str = "sqlite:///./bookings.db"

    # Server
    backend_port: int = 8000
    backend_host: str = "0.0.0.0"

    # CORS - comma-separated list of origins, or "*" for all
    # Example: "https://example.com,https://app.example.com"
    allowed_origins: str = "*"

    # API
    api_version: str = "1.0.0"
    api_prefix: str = "/api/v1"
    api_title: str = "Booking API"
    api_description: str = "API для записи на звонок"

    @property
    def cors_origins(self) -> list[str]:
        """Parse allowed_origins string into list.

        Returns:
            List of allowed origins. ["*"] means all origins.
        """
        if self.allowed_origins == "*":
            return ["*"]
        return [origin.strip() for origin in self.allowed_origins.split(",")]


# Global settings instance
settings = Settings()
