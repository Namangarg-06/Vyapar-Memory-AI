"""FastAPI application entry point for Vyapar Memory AI."""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.core.database import Base, engine
import app.models  # noqa: F401 — ensure all 16 tables are registered


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Ensure all database tables exist on startup."""
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "An evidence-based AI business operations and commitment intelligence platform "
        "for Indian wholesalers, distributors, and small manufacturers."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_PREFIX)


from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

frontend_dist = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if not frontend_dist.exists():
    frontend_dist = Path(__file__).resolve().parent.parent / "frontend" / "dist"

if frontend_dist.exists():
    assets_dir = frontend_dist / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}", tags=["Frontend"])
    async def serve_frontend(full_path: str):
        # Do not intercept /api or /docs
        if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            return FileResponse(frontend_dist / "index.html")
        file_path = frontend_dist / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(frontend_dist / "index.html")
else:
    @app.get("/", tags=["Root"])
    def root():
        return {
            "application": settings.APP_NAME,
            "docs_url": "/docs",
            "health_url": f"{settings.API_V1_PREFIX}/health",
        }
