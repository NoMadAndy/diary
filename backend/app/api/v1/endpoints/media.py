"""
Media endpoints for file upload/download operations.
"""
import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.session import get_db
from app.db.models.user import User
from app.db.models.media import Media
from app.schemas.media import (
    MediaCreate,
    MediaUpdate,
    MediaResponse,
    MediaListResponse,
    PresignedUrlResponse,
)
from app.api.deps import get_current_user
from app.services.storage_service import storage_service

router = APIRouter()


@router.post("/presign", response_model=PresignedUrlResponse)
async def get_presigned_upload_url(
    filename: str,
    mime_type: str,
    current_user: User = Depends(get_current_user),
):
    """Get a presigned URL for uploading a file."""
    # Generate unique storage key
    ext = filename.split(".")[-1] if "." in filename else ""
    storage_key = f"{current_user.id}/{datetime.utcnow().strftime('%Y/%m/%d')}/{uuid.uuid4()}"
    if ext:
        storage_key += f".{ext}"
    
    # Get presigned URL
    upload_url, expires_in = storage_service.get_presigned_upload_url(
        storage_key, mime_type
    )
    
    return PresignedUrlResponse(
        upload_url=upload_url,
        storage_key=storage_key,
        expires_in=expires_in,
    )


@router.post("/", response_model=MediaResponse, status_code=status.HTTP_201_CREATED)
async def create_media(
    media_in: MediaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create media metadata after upload."""
    media = Media(
        user_id=current_user.id,
        entry_id=media_in.entry_id,
        filename=media_in.filename,
        original_filename=media_in.original_filename,
        mime_type=media_in.mime_type,
        file_size=media_in.file_size,
        storage_key=media_in.storage_key,
        thumbnail_key=media_in.thumbnail_key,
        latitude=media_in.latitude,
        longitude=media_in.longitude,
        metadata=media_in.metadata,
        captured_at=media_in.captured_at,
    )
    db.add(media)
    await db.commit()
    await db.refresh(media)
    return media


@router.get("/", response_model=MediaListResponse)
async def list_media(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    entry_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List media files for the current user."""
    query = select(Media).where(Media.user_id == current_user.id)
    
    if entry_id:
        query = query.where(Media.entry_id == entry_id)
    if start_date:
        query = query.where(Media.captured_at >= start_date)
    if end_date:
        query = query.where(Media.captured_at <= end_date)
    
    query = query.order_by(Media.captured_at.desc())
    
    # Count total
    count_query = select(func.count()).select_from(Media).where(Media.user_id == current_user.id)
    if entry_id:
        count_query = count_query.where(Media.entry_id == entry_id)
    
    result = await db.execute(count_query)
    total = result.scalar()
    
    # Pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    
    result = await db.execute(query)
    media_list = result.scalars().all()
    
    return MediaListResponse(
        items=media_list,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{media_id}", response_model=MediaResponse)
async def get_media(
    media_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific media item."""
    result = await db.execute(
        select(Media).where(Media.id == media_id, Media.user_id == current_user.id)
    )
    media = result.scalar_one_or_none()
    
    if not media:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media not found",
        )
    
    return media


@router.get("/{media_id}/download")
async def get_download_url(
    media_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a presigned download URL for a media file."""
    result = await db.execute(
        select(Media).where(Media.id == media_id, Media.user_id == current_user.id)
    )
    media = result.scalar_one_or_none()
    
    if not media:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media not found",
        )
    
    download_url = storage_service.get_presigned_download_url(media.storage_key)
    
    return {"download_url": download_url, "expires_in": 3600}


@router.put("/{media_id}", response_model=MediaResponse)
async def update_media(
    media_id: int,
    media_in: MediaUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update media metadata."""
    result = await db.execute(
        select(Media).where(Media.id == media_id, Media.user_id == current_user.id)
    )
    media = result.scalar_one_or_none()
    
    if not media:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media not found",
        )
    
    update_data = media_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(media, field, value)
    
    await db.commit()
    await db.refresh(media)
    return media


@router.delete("/{media_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_media(
    media_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a media item."""
    result = await db.execute(
        select(Media).where(Media.id == media_id, Media.user_id == current_user.id)
    )
    media = result.scalar_one_or_none()
    
    if not media:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media not found",
        )
    
    # Delete from storage
    storage_service.delete_file(media.storage_key)
    if media.thumbnail_key:
        storage_service.delete_file(media.thumbnail_key)
    
    await db.delete(media)
    await db.commit()
