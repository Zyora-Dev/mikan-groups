from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://mikan:mikan@localhost:5432/mikan"

    jwt_secret: str = "dev-only-change-me"
    # Reset links and email buttons point here. Must be the real origin in
    # production, or people are sent to localhost.
    web_base_url: str = "http://localhost:5188"
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 21600  # 15 days
    refresh_token_days: int = 30

    cors_origins: str = "http://localhost:5188"
    environment: str = "development"

    @property
    def origins(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    # Login attempts allowed per IP per window, across all accounts. The
    # per-account lockout stops guessing one password; this stops one
    # attacker trying one guess against thousands of accounts.
    login_rate_limit: int = 20
    login_rate_window_seconds: int = 300
    reset_token_minutes: int = 60

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


@lru_cache
def get_settings() -> Settings:
    config = Settings()
    # A forgeable signing key is unrecoverable, so refuse to start rather
    # than run production on the development default.
    if config.is_production:
        if config.jwt_secret == "dev-only-change-me":
            raise RuntimeError(
                "JWT_SECRET must be set to a real secret in production"
            )
        if "localhost" in config.web_base_url:
            raise RuntimeError(
                "WEB_BASE_URL must be the public site URL in production"
            )
    return config
