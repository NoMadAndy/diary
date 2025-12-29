"""
Track schemas for API request/response validation.
"""
from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel


class TrackPoint(BaseModel):
    """Single track point."""
    latitude: float
    longitude: float
    elevation: Optional[float] = None
    timestamp: Optional[datetime] = None


class TrackBase(BaseModel):
    """Base track schema."""
    name: Optional[str] = None
    description: Optional[str] = None
    entry_id: Optional[int] = None


class TrackCreate(TrackBase):
    """Schema for creating a track."""
    track_data: List[TrackPoint]
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None


class TrackUpdate(BaseModel):
    """Schema for updating a track."""
    name: Optional[str] = None
    description: Optional[str] = None
    entry_id: Optional[int] = None


class TrackStats(BaseModel):
    """Track statistics."""
    distance_meters: Optional[float] = None
    duration_seconds: Optional[int] = None
    elevation_gain: Optional[float] = None
    elevation_loss: Optional[float] = None
    max_elevation: Optional[float] = None
    min_elevation: Optional[float] = None
    avg_speed: Optional[float] = None


class TrackResponse(TrackBase):
    """Schema for track response."""
    id: int
    user_id: int
    track_data: Any
    distance_meters: Optional[float] = None
    duration_seconds: Optional[int] = None
    elevation_gain: Optional[float] = None
    elevation_loss: Optional[float] = None
    max_elevation: Optional[float] = None
    min_elevation: Optional[float] = None
    avg_speed: Optional[float] = None
    min_lat: Optional[float] = None
    max_lat: Optional[float] = None
    min_lon: Optional[float] = None
    max_lon: Optional[float] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class TrackListResponse(BaseModel):
    """Schema for paginated track list."""
    items: List[TrackResponse]
    total: int
    page: int
    page_size: int
