"""
SmartVision AI - Core Configuration
"""
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl, field_validator
from typing import List, Optional
import json
import os


class Settings(BaseSettings):
    # ─── App ──────────────────────────────────────────────────────────────────
    APP_NAME: str = "SmartVision AI"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "Smart Object Recognition using Image Enhancement and Feature Intelligence"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # ─── Server ───────────────────────────────────────────────────────────────
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # ─── Security ─────────────────────────────────────────────────────────────
    SECRET_KEY: str = "smartvision-super-secret-key-change-in-production-minimum-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ─── Database ─────────────────────────────────────────────────────────────
    DATABASE_URL: str = "sqlite+aiosqlite:///./smartvision.db"

    # ─── CORS ─────────────────────────────────────────────────────────────────
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

    # ─── File Storage ─────────────────────────────────────────────────────────
    UPLOAD_DIR: str = "uploads"
    RESULTS_DIR: str = "results"
    REPORTS_DIR: str = "reports"
    LOGS_DIR: str = "logs"
    MAX_UPLOAD_SIZE_MB: int = 50
    ALLOWED_IMAGE_TYPES: List[str] = [
        "image/jpeg", "image/png", "image/bmp", "image/tiff", "image/webp",
    ]

    # ─── Rate Limiting ────────────────────────────────────────────────────────
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW_MINUTES: int = 1

    # Redis (optional, for caching/tasks)
    REDIS_URL: Optional[str] = "redis://localhost:6379"

    # ─── Admin ────────────────────────────────────────────────────────────────
    ADMIN_EMAIL: str = "admin@smartvision.ai"
    ADMIN_PASSWORD: str = "Admin@123"
    ADMIN_FULL_NAME: str = "System Administrator"
    ADMIN_USERNAME: str = "admin"

    # ─── Demo User ────────────────────────────────────────────────────────────
    DEMO_USER_EMAIL: str = "user@smartvision.ai"
    DEMO_USER_PASSWORD: str = "User@123"
    DEMO_USER_FULL_NAME: str = "Demo User"
    DEMO_USER_USERNAME: str = "demo_user"

    model_config = {"env_file": ".env", "case_sensitive": True}


settings = Settings()
