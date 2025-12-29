"""
Media schemas for API request/response validation.
"""
from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel


class MediaBase(BaseModel):
    """Base media schema."""
    entry_id: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    captured_at: Optional[datetime] = None


class MediaCreate(MediaBase):
    """Schema for creating media metadata."""
    filename: str
    original_filename: Optional[str] = None
    mime_type: str
    file_size: Optional[int] = None
    storage_key: str
    thumbnail_key: Optional[str] = None
    metadata: Optional[dict] = None


class MediaUpdate(BaseModel):
    """Schema for updating media."""
    entry_id: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    captured_at: Optional[datetime] = None


class MediaResponse(BaseModel):
    """Schema for media response."""
    id: int
    user_id: int
    entry_id: Optional[int] = None
    filename: str
    original_filename: Optional[str] = None
    mime_type: str
    file_size: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    metadata: Optional[dict] = None
    captured_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class MediaListResponse(BaseModel):
    """Schema for paginated media list."""
    items: List[MediaResponse]
    total: int
    page: int
    page_size: int


class PresignedUrlResponse(BaseModel):
    """Schema for presigned URL response."""
    upload_url: str
    storage_key: str
    expires_in: int
