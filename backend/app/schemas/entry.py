"""
Entry schemas for API request/response validation.
"""
from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel


class EntryBase(BaseModel):
    """Base entry schema."""
    title: Optional[str] = None
    content: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_name: Optional[str] = None
    mood: Optional[str] = None
    rating: Optional[int] = None
    tags: Optional[List[str]] = []
    weather: Optional[dict] = None
    activity: Optional[str] = None
    entry_date: Optional[datetime] = None


class EntryCreate(EntryBase):
    """Schema for creating an entry."""
    pass


class EntryUpdate(BaseModel):
    """Schema for updating an entry."""
    title: Optional[str] = None
    content: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_name: Optional[str] = None
    mood: Optional[str] = None
    rating: Optional[int] = None
    tags: Optional[List[str]] = None
    weather: Optional[dict] = None
    activity: Optional[str] = None
    entry_date: Optional[datetime] = None


class EntryResponse(EntryBase):
    """Schema for entry response."""
    id: int
    user_id: int
    ai_summary: Optional[str] = None
    ai_tags: Optional[List[str]] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class EntryListResponse(BaseModel):
    """Schema for paginated entry list."""
    items: List[EntryResponse]
    total: int
    page: int
    page_size: int
