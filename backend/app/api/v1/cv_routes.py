"""Images, Enhancement, Harris, SIFT, PCA, Recognition routes"""
import os, uuid, shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
from PIL import Image as PILImage

from app.core.database import get_db
from app.core.security import get_current_user_payload
from app.core.config import settings
from app.models.models import Image, EnhancedImage, HarrisResult, SIFTResult, PCAResult, RecognitionResult
from app.schemas.schemas import (
    ApiResponse, EnhancementRequest, HarrisRequest, SIFTRequest,
    PCARequest, RecognitionRequest, EnhancementResultOut,
    HarrisResultOut, SIFTResultOut, PCAResultOut, RecognitionResultOut,
)
from app.cv_modules.processor import (
    ImageEnhancer, HarrisDetector, SIFTExtractor, PCAOptimizer, ObjectRecognizer,
)

# ─── Images Router ─────────────────────────────────────────────────────────────
images_router = APIRouter(prefix="/images", tags=["Images"])

@images_router.post("/upload", response_model=ApiResponse)
async def upload_image(
    file: UploadFile = File(...),
    payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db),
):
    if file.content_type not in settings.ALLOWED_IMAGE_TYPES:
        raise HTTPException(400, "Invalid image type")
    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(400, f"File too large. Max {settings.MAX_UPLOAD_SIZE_MB}MB")

    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename or "img.jpg")[1] or ".jpg"
    filename = f"{file_id}{ext}"
    upload_path = os.path.join(settings.UPLOAD_DIR, filename)
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    with open(upload_path, "wb") as f:
        f.write(content)

    # Get image dimensions
    try:
        with PILImage.open(upload_path) as img:
            w, h = img.size
    except Exception:
        w, h = 0, 0

    record = Image(
        id=file_id, user_id=payload["sub"],
        filename=filename, original_filename=file.filename or filename,
        file_path=filename, file_size=len(content),
        file_type=file.content_type or "image/jpeg",
        width=w, height=h, status="uploaded",
    )
    db.add(record)
    await db.flush()

    return ApiResponse(success=True, message="Image uploaded", data={
        "id": record.id, "filename": record.filename,
        "original_filename": record.original_filename,
        "file_path": record.file_path, "file_size": record.file_size,
        "file_type": record.file_type, "width": w, "height": h,
        "status": record.status,
        "upload_date": record.upload_date.isoformat(),
        "updated_at": record.updated_at.isoformat(),
        "thumbnail_path": None, "metadata": None,
    })

@images_router.get("/{image_id}/download")
async def download_image(image_id: str, payload: dict = Depends(get_current_user_payload), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Image).where(Image.id == image_id))
    img = result.scalar_one_or_none()
    if not img:
        raise HTTPException(404, "Image not found")
    path = os.path.join(settings.UPLOAD_DIR, img.file_path)
    if not os.path.exists(path):
        raise HTTPException(404, "File not found on disk")
    return FileResponse(path, filename=img.original_filename)

@images_router.get("/{image_id}/thumbnail")
async def get_thumbnail(image_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Image).where(Image.id == image_id))
    img = result.scalar_one_or_none()
    if not img:
        raise HTTPException(404, "Image not found")
    path = os.path.join(settings.UPLOAD_DIR, img.file_path)
    if os.path.exists(path):
        return FileResponse(path)
    raise HTTPException(404, "File not found")

@images_router.delete("/{image_id}", response_model=ApiResponse)
async def delete_image(image_id: str, payload: dict = Depends(get_current_user_payload), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Image).where(Image.id == image_id, Image.user_id == payload["sub"]))
    img = result.scalar_one_or_none()
    if not img:
        raise HTTPException(404, "Image not found")
    path = os.path.join(settings.UPLOAD_DIR, img.file_path)
    if os.path.exists(path):
        os.remove(path)
    await db.delete(img)
    return ApiResponse(success=True, message="Image deleted")


# ─── Enhancement Router ────────────────────────────────────────────────────────
enhance_router = APIRouter(prefix="/enhancement", tags=["Enhancement"])

@enhance_router.post("/enhance", response_model=ApiResponse)
async def enhance_image(
    data: EnhancementRequest,
    payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Image).where(Image.id == data.image_id))
    img = result.scalar_one_or_none()
    if not img:
        raise HTTPException(404, "Image not found")

    src = os.path.join(settings.UPLOAD_DIR, img.file_path)
    out_id = str(uuid.uuid4())
    out_path = os.path.join(settings.RESULTS_DIR, "enhanced", f"{out_id}.jpg")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)

    stats = ImageEnhancer.enhance(src, out_path, data.params.model_dump())

    record = EnhancedImage(
        image_id=data.image_id,
        enhanced_path=out_path.replace("\\", "/"),
        processing_time_ms=stats["processing_time_ms"],
        params=data.params.model_dump(),
        before_stats=stats["before_stats"],
        after_stats=stats["after_stats"],
    )
    db.add(record)
    await db.flush()

    return ApiResponse(success=True, message="Enhancement applied", data={
        "id": record.id, "image_id": data.image_id,
        "enhanced_path": record.enhanced_path,
        "thumbnail_path": None,
        "processing_time_ms": stats["processing_time_ms"],
        "params": data.params.model_dump(),
        "before_stats": stats["before_stats"],
        "after_stats": stats["after_stats"],
        "created_at": record.created_at.isoformat(),
    })


# ─── Harris Router ─────────────────────────────────────────────────────────────
harris_router = APIRouter(prefix="/harris", tags=["Harris Corner"])

@harris_router.post("/detect", response_model=ApiResponse)
async def harris_detect(
    data: HarrisRequest,
    payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Image).where(Image.id == data.image_id))
    img = result.scalar_one_or_none()
    if not img:
        raise HTTPException(404, "Image not found")

    src = os.path.join(settings.UPLOAD_DIR, img.file_path)
    rid = str(uuid.uuid4())
    corner_path = os.path.join(settings.RESULTS_DIR, "harris", f"{rid}_corners.jpg")
    heatmap_path = os.path.join(settings.RESULTS_DIR, "harris", f"{rid}_heatmap.jpg")
    os.makedirs(os.path.dirname(corner_path), exist_ok=True)

    p = data.params
    res = HarrisDetector.detect(src, corner_path, heatmap_path, p.block_size, p.ksize, p.k, p.threshold)

    record = HarrisResult(
        image_id=data.image_id,
        corner_image_path=corner_path.replace("\\", "/"),
        heatmap_path=heatmap_path.replace("\\", "/"),
        corner_count=res["corner_count"],
        corner_coordinates=res["corner_coordinates"],
        processing_time_ms=res["processing_time_ms"],
        params=p.model_dump(),
    )
    db.add(record)
    await db.flush()

    return ApiResponse(success=True, message=f"{res['corner_count']} corners detected", data={
        "id": record.id, "image_id": data.image_id,
        "corner_image_path": record.corner_image_path,
        "heatmap_path": record.heatmap_path,
        "corner_count": res["corner_count"],
        "corner_coordinates": res["corner_coordinates"][:20],
        "processing_time_ms": res["processing_time_ms"],
        "params": p.model_dump(),
        "created_at": record.created_at.isoformat(),
    })


# ─── SIFT Router ───────────────────────────────────────────────────────────────
sift_router = APIRouter(prefix="/sift", tags=["SIFT"])

@sift_router.post("/extract", response_model=ApiResponse)
async def sift_extract(
    data: SIFTRequest,
    payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Image).where(Image.id == data.image_id))
    img = result.scalar_one_or_none()
    if not img:
        raise HTTPException(404, "Image not found")

    src = os.path.join(settings.UPLOAD_DIR, img.file_path)
    rid = str(uuid.uuid4())
    kp_path = os.path.join(settings.RESULTS_DIR, "sift", f"{rid}_keypoints.jpg")
    os.makedirs(os.path.dirname(kp_path), exist_ok=True)

    p = data.params
    res = SIFTExtractor.extract(src, kp_path, p.n_features, p.n_octave_layers, p.contrast_threshold, p.edge_threshold, p.sigma)

    record = SIFTResult(
        image_id=data.image_id,
        keypoint_image_path=kp_path.replace("\\", "/"),
        keypoint_count=res["keypoint_count"],
        descriptor_shape=res["descriptor_shape"],
        processing_time_ms=res["processing_time_ms"],
        params=p.model_dump(),
        keypoints=res["keypoints"],
    )
    db.add(record)
    await db.flush()

    return ApiResponse(success=True, message=f"{res['keypoint_count']} keypoints extracted", data={
        "id": record.id, "image_id": data.image_id,
        "keypoint_image_path": record.keypoint_image_path,
        "keypoint_count": res["keypoint_count"],
        "descriptor_shape": res["descriptor_shape"],
        "processing_time_ms": res["processing_time_ms"],
        "params": p.model_dump(),
        "keypoints": res["keypoints"][:20],
        "created_at": record.created_at.isoformat(),
    })


# ─── PCA Router ────────────────────────────────────────────────────────────────
pca_router = APIRouter(prefix="/pca", tags=["PCA"])

@pca_router.post("/optimize", response_model=ApiResponse)
async def pca_optimize(
    data: PCARequest,
    payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Image).where(Image.id == data.image_id))
    img = result.scalar_one_or_none()
    if not img:
        raise HTTPException(404, "Image not found")

    src = os.path.join(settings.UPLOAD_DIR, img.file_path)
    res = PCAOptimizer.optimize(src, data.params.n_components, data.params.whiten)

    record = PCAResult(
        image_id=data.image_id,
        n_components=res["n_components"],
        explained_variance_ratio=res["explained_variance_ratio"],
        cumulative_variance=res["cumulative_variance"],
        original_dims=res["original_dims"],
        reduced_dims=res["reduced_dims"],
        compression_ratio=res["compression_ratio"],
        processing_time_ms=res["processing_time_ms"],
    )
    db.add(record)
    await db.flush()

    return ApiResponse(success=True, message="PCA optimization complete", data={
        "id": record.id, "image_id": data.image_id,
        **{k: res[k] for k in ["n_components","explained_variance_ratio","cumulative_variance","original_dims","reduced_dims","compression_ratio","processing_time_ms"]},
        "created_at": record.created_at.isoformat(),
    })


# ─── Recognition Router ────────────────────────────────────────────────────────
recognition_router = APIRouter(prefix="/recognition", tags=["Recognition"])

@recognition_router.post("/recognize", response_model=ApiResponse)
async def recognize(
    data: RecognitionRequest,
    payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Image).where(Image.id == data.image_id))
    img = result.scalar_one_or_none()
    if not img:
        raise HTTPException(404, "Image not found")

    src = os.path.join(settings.UPLOAD_DIR, img.file_path)
    res = ObjectRecognizer.recognize(src)

    record = RecognitionResult(
        image_id=data.image_id, user_id=payload["sub"],
        predicted_class=res["predicted_class"],
        confidence_score=res["confidence_score"],
        all_predictions=res["all_predictions"],
        top_k_predictions=res["top_k_predictions"],
        processing_pipeline=[{"step": "Recognition", "status": "completed", "duration_ms": res["processing_time_ms"]}],
        total_processing_time_ms=res["processing_time_ms"],
    )
    db.add(record)
    img.status = "analyzed"
    await db.flush()

    return ApiResponse(success=True, message="Recognition complete", data={
        "id": record.id, "image_id": data.image_id, "user_id": payload["sub"],
        **{k: res[k] for k in ["predicted_class","confidence_score","all_predictions","top_k_predictions"]},
        "processing_pipeline": record.processing_pipeline,
        "total_processing_time_ms": record.total_processing_time_ms,
        "created_at": record.created_at.isoformat(),
    })

@recognition_router.post("/recognize-full-pipeline", response_model=ApiResponse)
async def recognize_full(
    data: RecognitionRequest,
    payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Image).where(Image.id == data.image_id))
    img = result.scalar_one_or_none()
    if not img:
        raise HTTPException(404, "Image not found")

    src = os.path.join(settings.UPLOAD_DIR, img.file_path)
    res = ObjectRecognizer.recognize_full_pipeline(src, settings.RESULTS_DIR, data.image_id)

    record = RecognitionResult(
        image_id=data.image_id, user_id=payload["sub"],
        predicted_class=res["predicted_class"],
        confidence_score=res["confidence_score"],
        all_predictions=res.get("all_predictions", []),
        top_k_predictions=res.get("top_k_predictions", []),
        processing_pipeline=res.get("processing_pipeline", []),
        total_processing_time_ms=res["total_processing_time_ms"],
    )
    db.add(record)
    img.status = "analyzed"
    await db.flush()

    return ApiResponse(success=True, message="Full pipeline recognition complete", data={
        "id": record.id, "image_id": data.image_id, "user_id": payload["sub"],
        **{k: res[k] for k in ["predicted_class","confidence_score","all_predictions","top_k_predictions","processing_pipeline","total_processing_time_ms"]},
        "created_at": record.created_at.isoformat(),
    })
