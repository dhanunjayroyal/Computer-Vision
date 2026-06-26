"""
SmartVision AI - Pydantic Schemas
Request/Response validation schemas
"""
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime


# ─── Base ─────────────────────────────────────────────────────────────────────
class ApiResponse(BaseModel):
    success: bool = True
    message: str = "OK"
    data: Optional[Any] = None
    error: Optional[str] = None


class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    size: int
    pages: int
    has_next: bool
    has_prev: bool


# ─── Auth Schemas ─────────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, pattern=r'^[a-zA-Z0-9_]+$')
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=200)
    password: str = Field(..., min_length=8, max_length=128)
    confirm_password: str

    @field_validator('confirm_password')
    @classmethod
    def passwords_match(cls, v, info):
        if 'password' in info.data and v != info.data['password']:
            raise ValueError('Passwords do not match')
        return v

    @field_validator('password')
    @classmethod
    def password_strength(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class RefreshRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    password: str = Field(..., min_length=8)


# ─── User Schemas ─────────────────────────────────────────────────────────────
class UserOut(BaseModel):
    id: str
    username: str
    email: str
    full_name: str
    role: str
    avatar: Optional[str] = None
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None
    total_uploads: int = 0
    total_recognitions: int = 0

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=200)
    username: Optional[str] = Field(None, min_length=3, max_length=50)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)


# ─── Image Schemas ────────────────────────────────────────────────────────────
class ImageOut(BaseModel):
    id: str
    user_id: str
    filename: str
    original_filename: str
    file_path: str
    thumbnail_path: Optional[str] = None
    file_size: int
    file_type: str
    width: int
    height: int
    status: str
    upload_date: datetime
    metadata: Optional[Dict[str, Any]] = None

    model_config = {"from_attributes": True}


# ─── Enhancement Schemas ──────────────────────────────────────────────────────
class EnhancementParams(BaseModel):
    brightness: float = Field(1.0, ge=0.1, le=3.0)
    contrast: float = Field(1.0, ge=0.1, le=3.0)
    sharpness: float = Field(1.0, ge=0.0, le=5.0)
    blur_type: str = Field("none", pattern=r'^(none|gaussian|median|bilateral)$')
    blur_radius: int = Field(3, ge=1, le=31)
    equalize_histogram: bool = False
    normalize: bool = False
    denoise: bool = False
    grayscale: bool = False
    edge_enhance: bool = False
    rotation: float = Field(0.0, ge=-180.0, le=180.0)
    flip_horizontal: bool = False
    flip_vertical: bool = False


class EnhancementRequest(BaseModel):
    image_id: str
    params: EnhancementParams


class ImageStats(BaseModel):
    mean: float
    std: float
    min: float
    max: float
    entropy: float


class EnhancementResultOut(BaseModel):
    id: str
    image_id: str
    enhanced_path: str
    thumbnail_path: Optional[str] = None
    processing_time_ms: int
    params: Optional[Dict] = None
    before_stats: Optional[ImageStats] = None
    after_stats: Optional[ImageStats] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Harris Schemas ───────────────────────────────────────────────────────────
class HarrisParams(BaseModel):
    block_size: int = Field(2, ge=2, le=10)
    ksize: int = Field(3, ge=3, le=31)
    k: float = Field(0.04, ge=0.01, le=0.1)
    threshold: float = Field(0.01, ge=0.001, le=0.1)


class HarrisRequest(BaseModel):
    image_id: str
    params: HarrisParams


class HarrisResultOut(BaseModel):
    id: str
    image_id: str
    corner_image_path: str
    heatmap_path: Optional[str] = None
    corner_count: int
    corner_coordinates: Optional[List[List[int]]] = None
    processing_time_ms: int
    params: Optional[Dict] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── SIFT Schemas ─────────────────────────────────────────────────────────────
class SIFTParams(BaseModel):
    n_features: int = Field(500, ge=50, le=5000)
    n_octave_layers: int = Field(3, ge=1, le=10)
    contrast_threshold: float = Field(0.04, ge=0.01, le=0.2)
    edge_threshold: float = Field(10.0, ge=3.0, le=50.0)
    sigma: float = Field(1.6, ge=0.5, le=3.0)


class SIFTRequest(BaseModel):
    image_id: str
    params: SIFTParams


class KeypointOut(BaseModel):
    x: float
    y: float
    size: float
    angle: float
    response: float
    octave: int


class SIFTResultOut(BaseModel):
    id: str
    image_id: str
    keypoint_image_path: str
    keypoint_count: int
    descriptor_shape: Optional[List[int]] = None
    processing_time_ms: int
    params: Optional[Dict] = None
    keypoints: Optional[List[KeypointOut]] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class SIFTMatchRequest(BaseModel):
    image1_id: str
    image2_id: str


# ─── PCA Schemas ──────────────────────────────────────────────────────────────
class PCAParams(BaseModel):
    n_components: int = Field(50, ge=2, le=500)
    whiten: bool = False


class PCARequest(BaseModel):
    image_id: str
    params: PCAParams


class PCAResultOut(BaseModel):
    id: str
    image_id: str
    n_components: int
    explained_variance_ratio: Optional[List[float]] = None
    cumulative_variance: Optional[List[float]] = None
    original_dims: int
    reduced_dims: int
    compression_ratio: float
    processing_time_ms: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Recognition Schemas ──────────────────────────────────────────────────────
class PredictionOut(BaseModel):
    class_name: str
    confidence: float
    rank: int


class PipelineStepOut(BaseModel):
    step: str
    status: str
    duration_ms: Optional[int] = None
    result: Optional[str] = None


class RecognitionRequest(BaseModel):
    image_id: str


class RecognitionResultOut(BaseModel):
    id: str
    image_id: str
    user_id: str
    predicted_class: str
    confidence_score: float
    all_predictions: Optional[List[PredictionOut]] = None
    top_k_predictions: Optional[List[PredictionOut]] = None
    processing_pipeline: Optional[List[PipelineStepOut]] = None
    total_processing_time_ms: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Analytics Schemas ────────────────────────────────────────────────────────
class DashboardStats(BaseModel):
    total_images: int = 0
    total_recognitions: int = 0
    avg_accuracy: float = 0.0
    avg_processing_time_ms: float = 0.0
    images_today: int = 0
    recognitions_today: int = 0
    success_rate: float = 0.0
    active_users: int = 0


class AdminStats(DashboardStats):
    total_users: int = 0
    new_users_today: int = 0
    storage_used_gb: float = 0.0
    storage_limit_gb: float = 100.0
    api_calls_today: int = 0
    failed_api_calls: int = 0


class RecognitionTrend(BaseModel):
    date: str
    count: int
    avg_confidence: float


class ObjectDistribution(BaseModel):
    category: str
    count: int
    percentage: float


class RecentActivity(BaseModel):
    id: str
    type: str
    description: str
    user: str
    timestamp: str
    status: str


# ─── Report Schemas ───────────────────────────────────────────────────────────
class ReportRequest(BaseModel):
    type: str = Field(..., pattern=r'^(recognition|enhancement|analytics|system)$')
    format: str = Field(..., pattern=r'^(pdf|excel|csv)$')
    params: Optional[Dict[str, Any]] = None


class ReportOut(BaseModel):
    id: str
    user_id: str
    title: str
    type: str
    format: str
    status: str
    file_path: Optional[str] = None
    created_at: datetime
    expires_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ─── Notification Schemas ─────────────────────────────────────────────────────
class NotificationOut(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    type: str
    is_read: bool
    link: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Activity Log Schemas ─────────────────────────────────────────────────────
class ActivityLogOut(BaseModel):
    id: str
    user_id: Optional[str] = None
    action: str
    resource: str
    resource_id: Optional[str] = None
    ip_address: str
    user_agent: str
    status: str
    details: Optional[Dict] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Category Schemas ─────────────────────────────────────────────────────────
class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    color: str = Field("#6366f1", pattern=r'^#[0-9a-fA-F]{6}$')
    icon: Optional[str] = None
    parent_id: Optional[str] = None


class CategoryOut(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    color: str
    icon: Optional[str] = None
    parent_id: Optional[str] = None
    image_count: int
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── System Settings ──────────────────────────────────────────────────────────
class SystemSettingsOut(BaseModel):
    max_upload_size_mb: int = 50
    allowed_image_types: List[str] = []
    max_images_per_user: int = 1000
    enable_rate_limiting: bool = True
    rate_limit_requests: int = 100
    maintenance_mode: bool = False
    app_name: str = "SmartVision AI"
