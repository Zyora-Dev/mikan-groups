from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel

from app.core.config import get_settings
from app.core.db import engine
from app.routers import (
    admin,
    auth,
    clients,
    dashboard,
    portal,
    projects,
    team,
)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Alembic owns the schema in production; this is a convenience for local dev.
    if not settings.is_production:
        SQLModel.metadata.create_all(engine)
    yield


app = FastAPI(
    title="Mikan Portal API",
    version="0.1.0",
    description="Client and team portal for Mikan Engineering & Construction.",
    lifespan=lifespan,
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=True,          # required for httpOnly auth cookies
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(team.router, prefix="/api/v1")
app.include_router(clients.router, prefix="/api/v1")
app.include_router(projects.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(portal.router, prefix="/api/v1")


@app.get("/health", tags=["meta"])
def health() -> dict[str, str]:
    return {"status": "ok", "environment": settings.environment}
