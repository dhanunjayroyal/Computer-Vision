"""
SmartVision AI - SQLAlchemy Database Models
"""
import uuid
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import (
    String, Boolean, Float, Integer, DateTime, Text, JSON,
    ForeignKey, Enum as SAEnum, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


def gen_uuid():
    return str(uuid.uuid4())


# ─── Users ────────────────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id:             Mapped[str]  = mapped_column(String(36), primary_key=True, default=gen_uuid)
    username:       Mapped[str]  = mapped_column(String(50), unique=True, nullable=False, index=True)
    email:          Mapped[str]  = mapped_column(String(255), unique=True, nullable=False, index=True)
    full_name:      Mapped[str]  = mapped_column(String(200), nullable=False)
    hashed_password:Mapped[str]  = mapped_column(String(255), nullable=False)
    role:           Mapped[str]  = mapped_column(String(20), default="user", nullable=False)
    avatar:         Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_active:      Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified:    Mapped[bool] = mapped_column(Boolean, default=False)
    last_login:     Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at:     Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at:     Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    # Relationships
    images:             Mapped[List["Image"]]             = relationship("Image", back_populates="user", cascade="all, delete-orphan")
    recognition_results:Mapped[List["RecognitionResult"]] = relationship("RecognitionResult", back_populates="user")
    notifications:      Mapped[List["Notification"]]      = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    activity_logs:      Mapped[List["ActivityLog"]]       = relationship("ActivityLog", back_populates="user")
    reports:            Mapped[List["Report"]]            = relationship("Report", back_populates="user")

    @property
    def total_uploads(self) -> int:
        return len(self.images) if self.images else 0

    @property
    def total_recognitions(self) -> int:
        return len(self.recognition_results) if self.recognition_results else 0


# ─── Images ───────────────────────────────────────────────────────────────────
class Image(Base):
    __tablename__ = "images"

    id:                Mapped[str]  = mapped_column(String(36), primary_key=True, default=gen_uuid)
    user_id:           Mapped[str]  = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    filename:          Mapped[str]  = mapped_column(String(500), nullable=False)
    original_filename: Mapped[str]  = mapped_column(String(500), nullable=False)
    file_path:         Mapped[str]  = mapped_column(String(1000), nullable=False)
    thumbnail_path:    Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    file_size:         Mapped[int]  = mapped_column(Integer, nullable=False)
    file_type:         Mapped[str]  = mapped_column(String(50), nullable=False)
    width:             Mapped[int]  = mapped_column(Integer, default=0)
    height:            Mapped[int]  = mapped_column(Integer, default=0)
    status:            Mapped[str]  = mapped_column(String(20), default="uploaded")
    image_metadata:    Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    upload_date:       Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at:        Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    # Relationships
    user:               Mapped["User"]                    = relationship("User", back_populates="images")
    enhanced_images:    Mapped[List["EnhancedImage"]]     = relationship("EnhancedImage", back_populates="image", cascade="all, delete-orphan")
    harris_results:     Mapped[List["HarrisResult"]]      = relationship("HarrisResult", back_populates="image", cascade="all, delete-orphan")
    sift_results:       Mapped[List["SIFTResult"]]        = relationship("SIFTResult", back_populates="image", cascade="all, delete-orphan")
    pca_results:        Mapped[List["PCAResult"]]         = relationship("PCAResult", back_populates="image", cascade="all, delete-orphan")
    recognition_results:Mapped[List["RecognitionResult"]] = relationship("RecognitionResult", back_populates="image")


# ─── Enhanced Images ──────────────────────────────────────────────────────────
class EnhancedImage(Base):
    __tablename__ = "enhanced_images"

    id:                Mapped[str]  = mapped_column(String(36), primary_key=True, default=gen_uuid)
    image_id:          Mapped[str]  = mapped_column(String(36), ForeignKey("images.id"), nullable=False, index=True)
    enhanced_path:     Mapped[str]  = mapped_column(String(1000), nullable=False)
    thumbnail_path:    Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    processing_time_ms:Mapped[int]  = mapped_column(Integer, default=0)
    params:            Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    before_stats:      Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    after_stats:       Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at:        Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    image: Mapped["Image"] = relationship("Image", back_populates="enhanced_images")


# ─── Harris Corner Results ────────────────────────────────────────────────────
class HarrisResult(Base):
    __tablename__ = "harris_results"

    id:                  Mapped[str]  = mapped_column(String(36), primary_key=True, default=gen_uuid)
    image_id:            Mapped[str]  = mapped_column(String(36), ForeignKey("images.id"), nullable=False, index=True)
    corner_image_path:   Mapped[str]  = mapped_column(String(1000), nullable=False)
    heatmap_path:        Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    corner_count:        Mapped[int]  = mapped_column(Integer, default=0)
    corner_coordinates:  Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    processing_time_ms:  Mapped[int]  = mapped_column(Integer, default=0)
    params:              Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at:          Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    image: Mapped["Image"] = relationship("Image", back_populates="harris_results")


# ─── SIFT Results ─────────────────────────────────────────────────────────────
class SIFTResult(Base):
    __tablename__ = "sift_results"

    id:                 Mapped[str]  = mapped_column(String(36), primary_key=True, default=gen_uuid)
    image_id:           Mapped[str]  = mapped_column(String(36), ForeignKey("images.id"), nullable=False, index=True)
    keypoint_image_path:Mapped[str]  = mapped_column(String(1000), nullable=False)
    keypoint_count:     Mapped[int]  = mapped_column(Integer, default=0)
    descriptor_shape:   Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    processing_time_ms: Mapped[int]  = mapped_column(Integer, default=0)
    params:             Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    keypoints:          Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    created_at:         Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    image: Mapped["Image"] = relationship("Image", back_populates="sift_results")


# ─── PCA Results ──────────────────────────────────────────────────────────────
class PCAResult(Base):
    __tablename__ = "pca_results"

    id:                      Mapped[str]   = mapped_column(String(36), primary_key=True, default=gen_uuid)
    image_id:                Mapped[str]   = mapped_column(String(36), ForeignKey("images.id"), nullable=False, index=True)
    n_components:            Mapped[int]   = mapped_column(Integer, default=50)
    explained_variance_ratio:Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    cumulative_variance:     Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    original_dims:           Mapped[int]   = mapped_column(Integer, default=0)
    reduced_dims:            Mapped[int]   = mapped_column(Integer, default=0)
    compression_ratio:       Mapped[float] = mapped_column(Float, default=0.0)
    processing_time_ms:      Mapped[int]   = mapped_column(Integer, default=0)
    created_at:              Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    image: Mapped["Image"] = relationship("Image", back_populates="pca_results")


# ─── Recognition Results ──────────────────────────────────────────────────────
class RecognitionResult(Base):
    __tablename__ = "recognition_results"

    id:                     Mapped[str]   = mapped_column(String(36), primary_key=True, default=gen_uuid)
    image_id:               Mapped[str]   = mapped_column(String(36), ForeignKey("images.id"), nullable=False, index=True)
    user_id:                Mapped[str]   = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    predicted_class:        Mapped[str]   = mapped_column(String(200), nullable=False)
    confidence_score:       Mapped[float] = mapped_column(Float, nullable=False)
    all_predictions:        Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    top_k_predictions:      Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    processing_pipeline:    Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    total_processing_time_ms:Mapped[int]  = mapped_column(Integer, default=0)
    enhancement_result_id:  Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    harris_result_id:       Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    sift_result_id:         Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    pca_result_id:          Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    created_at:             Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    image: Mapped["Image"] = relationship("Image", back_populates="recognition_results")
    user:  Mapped["User"]  = relationship("User",  back_populates="recognition_results")


# ─── Object Categories ────────────────────────────────────────────────────────
class ObjectCategory(Base):
    __tablename__ = "object_categories"

    id:          Mapped[str]  = mapped_column(String(36), primary_key=True, default=gen_uuid)
    name:        Mapped[str]  = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    color:       Mapped[str]  = mapped_column(String(20), default="#6366f1")
    icon:        Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    parent_id:   Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("object_categories.id"), nullable=True)
    image_count: Mapped[int]  = mapped_column(Integer, default=0)
    is_active:   Mapped[bool] = mapped_column(Boolean, default=True)
    created_at:  Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


# ─── Notifications ────────────────────────────────────────────────────────────
class Notification(Base):
    __tablename__ = "notifications"

    id:         Mapped[str]  = mapped_column(String(36), primary_key=True, default=gen_uuid)
    user_id:    Mapped[str]  = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    title:      Mapped[str]  = mapped_column(String(200), nullable=False)
    message:    Mapped[str]  = mapped_column(Text, nullable=False)
    type:       Mapped[str]  = mapped_column(String(20), default="info")
    is_read:    Mapped[bool] = mapped_column(Boolean, default=False)
    link:       Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    user: Mapped["User"] = relationship("User", back_populates="notifications")


# ─── Activity Logs ────────────────────────────────────────────────────────────
class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id:          Mapped[str]  = mapped_column(String(36), primary_key=True, default=gen_uuid)
    user_id:     Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    action:      Mapped[str]  = mapped_column(String(100), nullable=False)
    resource:    Mapped[str]  = mapped_column(String(100), nullable=False)
    resource_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    ip_address:  Mapped[str]  = mapped_column(String(50), default="unknown")
    user_agent:  Mapped[str]  = mapped_column(String(500), default="unknown")
    status:      Mapped[str]  = mapped_column(String(20), default="success")
    details:     Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at:  Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    user: Mapped[Optional["User"]] = relationship("User", back_populates="activity_logs")


# ─── Reports ──────────────────────────────────────────────────────────────────
class Report(Base):
    __tablename__ = "reports"

    id:         Mapped[str]  = mapped_column(String(36), primary_key=True, default=gen_uuid)
    user_id:    Mapped[str]  = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    title:      Mapped[str]  = mapped_column(String(300), nullable=False)
    type:       Mapped[str]  = mapped_column(String(50), nullable=False)
    format:     Mapped[str]  = mapped_column(String(20), nullable=False)
    status:     Mapped[str]  = mapped_column(String(20), default="pending")
    file_path:  Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="reports")


# ─── System Settings ──────────────────────────────────────────────────────────
class SystemSetting(Base):
    __tablename__ = "system_settings"

    id:    Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    key:   Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
