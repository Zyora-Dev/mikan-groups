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

    # True when a proxy terminates TLS and forwards plain HTTP to this
    # app (Cloudflare "Flexible"). The browser still sees HTTPS, so
    # cookies must keep Secure — but the app must trust the proxy's
    # X-Forwarded-Proto rather than the scheme it sees itself.
    behind_tls_proxy: bool = True

    # Where uploaded files live. On Render this is the mount path of a
    # persistent disk; anywhere inside the code tree is wiped on deploy.
    storage_root: str = ""

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


@lru_cache
def get_settings() -> Settings:
    """Load configuration. Deliberately does not validate.

    Alembic imports this for `database_url` alone, so raising here would
    let an unrelated missing variable block a database migration. The
    checks live in `check_production_config`, called when the app starts.
    """
    return Settings()


def check_production_config(config: Settings | None = None) -> None:
    """Refuse to serve production on development defaults.

    A forgeable signing key is unrecoverable, and reset emails pointing
    at localhost are useless, so both are worth failing the boot over.
    """
    config = config or get_settings()
    if not config.is_production:
        return

    problems: list[str] = []
    if config.jwt_secret == "dev-only-change-me":
        problems.append("JWT_SECRET must be set to a real secret")
    if "localhost" in config.web_base_url:
        problems.append("WEB_BASE_URL must be the public site URL")
    if not config.origins:
        problems.append("CORS_ORIGINS must list the site origin")

    # Report every missing value at once — finding them one redeploy at
    # a time is needlessly slow.
    if problems:
        raise RuntimeError(
            "Invalid production configuration: " + "; ".join(problems)
        )
