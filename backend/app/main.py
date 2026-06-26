"""
SmartVision AI - FastAPI Main Application
Production-ready with CORS, rate limiting, logging, static files
"""
import os
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from loguru import logger

from app.core.config import settings
from app.core.database import init_db, AsyncSessionLocal
from app.core.security import hash_password
from app.models.models import User, ObjectCategory, Notification
from app.api.v1.auth import router as auth_router
from app.api.v1.cv_routes import (
    images_router, enhance_router, harris_router,
    sift_router, pca_router, recognition_router,
)
from app.api.v1.other_routes import (
    analytics_router, notif_router, reports_router,
    users_router, admin_router,
)


# ─── Logging Setup ─────────────────────────────────────────────────────────────
os.makedirs(settings.LOGS_DIR, exist_ok=True)
logger.add(
    os.path.join(settings.LOGS_DIR, "smartvision_{time:YYYY-MM-DD}.log"),
    rotation="1 day", retention="30 days", level="INFO", enqueue=True,
)


async def seed_database():
    """Create admin user and demo data on first run."""
    async with AsyncSessionLocal() as db:
        from sqlalchemy import select
        # Admin user
        existing = await db.execute(select(User).where(User.email == settings.ADMIN_EMAIL))
        if not existing.scalar_one_or_none():
            admin = User(
                username=settings.ADMIN_USERNAME,
                email=settings.ADMIN_EMAIL,
                full_name=settings.ADMIN_FULL_NAME,
                hashed_password=hash_password(settings.ADMIN_PASSWORD),
                role="admin", is_active=True, is_verified=True,
            )
            db.add(admin)
            logger.info(f"Admin user created: {settings.ADMIN_EMAIL}")

        # Demo user
        demo_existing = await db.execute(select(User).where(User.email == settings.DEMO_USER_EMAIL))
        if not demo_existing.scalar_one_or_none():
            demo = User(
                username=settings.DEMO_USER_USERNAME,
                email=settings.DEMO_USER_EMAIL,
                full_name=settings.DEMO_USER_FULL_NAME,
                hashed_password=hash_password(settings.DEMO_USER_PASSWORD),
                role="user", is_active=True, is_verified=True,
            )
            db.add(demo)

        # Default object categories
        cats_result = await db.execute(select(ObjectCategory))
        if not cats_result.scalars().first():
            categories = [
                ("Vehicle", "#6366f1"), ("Animal", "#d946ef"), ("Building", "#06b6d4"),
                ("Person", "#22c55e"), ("Furniture", "#eab308"), ("Plant", "#f97316"),
                ("Electronic", "#a78bfa"), ("Food", "#34d399"), ("Tool", "#f87171"), ("Sports Equipment", "#60a5fa"),
            ]
            for name, color in categories:
                db.add(ObjectCategory(name=name, color=color))

        await db.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info("🚀 SmartVision AI starting up...")
    # Create directories
    for d in [settings.UPLOAD_DIR, settings.RESULTS_DIR, settings.REPORTS_DIR, settings.LOGS_DIR]:
        os.makedirs(d, exist_ok=True)
    # Initialize database
    await init_db()
    await seed_database()
    logger.info("✅ SmartVision AI ready!")
    yield
    logger.info("👋 SmartVision AI shutting down...")


# ─── App Instance ──────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    description=settings.APP_DESCRIPTION,
    version=settings.APP_VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)


# ─── CORS Middleware ───────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)


# ─── Request Timing Middleware ─────────────────────────────────────────────────
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    response.headers["X-Process-Time"] = str(round(time.time() - start, 4))
    response.headers["X-App-Name"] = settings.APP_NAME
    return response


# ─── Global Exception Handler ──────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"success": False, "message": "Internal server error", "error": str(exc)},
    )


# ─── Static Files (uploaded images) ───────────────────────────────────────────
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.RESULTS_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
app.mount("/results", StaticFiles(directory=settings.RESULTS_DIR), name="results")


# ─── Health Check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
    }

@app.get("/", tags=["Root"])
async def root():
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "docs": "/api/docs",
        "version": settings.APP_VERSION,
    }


# ─── Register All Routers ──────────────────────────────────────────────────────
API_PREFIX = "/api/v1"

app.include_router(auth_router,         prefix=API_PREFIX)
app.include_router(images_router,       prefix=API_PREFIX)
app.include_router(enhance_router,      prefix=API_PREFIX)
app.include_router(harris_router,       prefix=API_PREFIX)
app.include_router(sift_router,         prefix=API_PREFIX)
app.include_router(pca_router,          prefix=API_PREFIX)
app.include_router(recognition_router,  prefix=API_PREFIX)
app.include_router(analytics_router,    prefix=API_PREFIX)
app.include_router(notif_router,        prefix=API_PREFIX)
app.include_router(reports_router,      prefix=API_PREFIX)
app.include_router(users_router,        prefix=API_PREFIX)
app.include_router(admin_router,        prefix=API_PREFIX)
