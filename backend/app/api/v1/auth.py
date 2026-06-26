"""
SmartVision AI - Auth API Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.security import (
    hash_password, verify_password, create_access_token,
    create_refresh_token, decode_token, get_current_user_payload,
)
from app.models.models import User, ActivityLog
from app.schemas.schemas import (
    RegisterRequest, LoginRequest, TokenResponse,
    RefreshRequest, ForgotPasswordRequest, UserOut, ApiResponse,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    return forwarded.split(",")[0] if forwarded else request.client.host


@router.post("/register", response_model=ApiResponse)
async def register(data: RegisterRequest, request: Request, db: AsyncSession = Depends(get_db)):
    # Check duplicate email/username
    existing = await db.execute(select(User).where(
        (User.email == data.email) | (User.username == data.username)
    ))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email or username already registered")

    user = User(
        username=data.username, email=data.email,
        full_name=data.full_name,
        hashed_password=hash_password(data.password),
        role="user", is_active=True, is_verified=True,
    )
    db.add(user)
    db.add(ActivityLog(
        user_id=None, action="register", resource="auth",
        ip_address=get_client_ip(request), user_agent=request.headers.get("user-agent", ""),
    ))
    await db.flush()
    return ApiResponse(success=True, message="Account created successfully", data=None)


@router.post("/login", response_model=ApiResponse)
async def login(data: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user: User = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    # Update last login
    user.last_login = datetime.now(timezone.utc)
    db.add(ActivityLog(
        user_id=user.id, action="login", resource="auth", status="success",
        ip_address=get_client_ip(request), user_agent=request.headers.get("user-agent", ""),
    ))

    access_token = create_access_token(user.id, role=user.role)
    refresh_token = create_refresh_token(user.id)

    user_data = {
        "id": user.id, "username": user.username, "email": user.email,
        "full_name": user.full_name, "role": user.role, "avatar": user.avatar,
        "is_active": user.is_active, "is_verified": user.is_verified,
        "created_at": user.created_at.isoformat(), "updated_at": user.updated_at.isoformat(),
        "last_login": user.last_login.isoformat() if user.last_login else None,
        "total_uploads": 0, "total_recognitions": 0,
    }

    return ApiResponse(success=True, message="Login successful", data={
        "user": user_data,
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": 1800,
    })


@router.post("/logout", response_model=ApiResponse)
async def logout(payload: dict = Depends(get_current_user_payload)):
    return ApiResponse(success=True, message="Logged out successfully")


@router.post("/refresh", response_model=ApiResponse)
async def refresh_token(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_token(data.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    result = await db.execute(select(User).where(User.id == payload["sub"]))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found")

    new_access = create_access_token(user.id, role=user.role)
    return ApiResponse(success=True, message="Token refreshed", data={
        "access_token": new_access, "token_type": "bearer", "expires_in": 1800,
    })


@router.get("/me", response_model=ApiResponse)
async def me(payload: dict = Depends(get_current_user_payload), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == payload["sub"]))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return ApiResponse(success=True, data=UserOut.model_validate(user).model_dump())


@router.post("/forgot-password", response_model=ApiResponse)
async def forgot_password(data: ForgotPasswordRequest):
    # In production: send email with reset token
    return ApiResponse(success=True, message="If the email exists, a reset link has been sent.")
