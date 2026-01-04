"""
AI-related schemas for API request/response validation.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class DaySummaryRequest(BaseModel):
    """Request for daily summary generation."""
    date: datetime
    include_entries: bool = True
    include_tracks: bool = True
    include_media: bool = True


class DaySummaryResponse(BaseModel):
    """Response for daily summary."""
    date: str
    summary: str
    highlights: List[str]
    statistics: dict
    suggested_title: Optional[str] = None
    suggested_tags: Optional[List[str]] = None


class MultiDaySummaryRequest(BaseModel):
    """Request for multi-day summary generation."""
    start_date: datetime
    end_date: datetime
    include_photos: bool = True
    include_tracks: bool = True
    include_sensors: bool = True


class TrackSummary(BaseModel):
    """Summary information for a track."""
    id: int
    name: Optional[str] = None
    date: str
    distance_meters: Optional[float] = None
    elevation_gain: Optional[float] = None


class MultiDayStatistics(BaseModel):
    """Statistics for multiple days."""
    total_entries: int
    total_distance: Optional[float] = None
    total_elevation_gain: Optional[float] = None
    total_duration: Optional[int] = None
    days_count: int


class MultiDaySummaryResponse(BaseModel):
    """Response for multi-day summary."""
    start_date: str
    end_date: str
    summary: str
    daily_summaries: List[DaySummaryResponse]
    total_statistics: MultiDayStatistics
    highlights: List[str]
    photos: Optional[List[str]] = None
    tracks: Optional[List[TrackSummary]] = None


class TagSuggestionRequest(BaseModel):
    """Request for tag suggestions."""
    entry_id: Optional[int] = None
    content: Optional[str] = None
    location: Optional[str] = None
    activity: Optional[str] = None


class TagSuggestionResponse(BaseModel):
    """Response for tag suggestions."""
    tags: List[str]
    categories: List[str]
    confidence: float


class TripSuggestionRequest(BaseModel):
    """Request for trip suggestions."""
    start_location: str
    end_location: Optional[str] = None
    interests: List[str] = []
    time_budget_hours: Optional[float] = None
    transport_mode: str = "driving"


class POI(BaseModel):
    """Point of Interest."""
    name: str
    description: str
    latitude: float
    longitude: float
    category: str
    estimated_duration_minutes: Optional[int] = None
    rating: Optional[float] = None


class TripSuggestionResponse(BaseModel):
    """Response for trip suggestions."""
    route_description: str
    total_distance_km: Optional[float] = None
    total_duration_hours: Optional[float] = None
    pois: List[POI]
    reasoning: str


class GuidePOIRequest(BaseModel):
    """Request for guide POI information."""
    latitude: float
    longitude: float
    mode: str = "minimal"  # minimal, verbose, off


class GuidePOIResponse(BaseModel):
    """Response for guide POI."""
    poi_name: Optional[str] = None
    text: str
    has_more: bool = False
    distance_meters: Optional[float] = None


class ActivitySuggestionsRequest(BaseModel):
    """Request for activity suggestions at a location."""
    latitude: float
    longitude: float
    interests: Optional[List[str]] = None


class ActivitySuggestion(BaseModel):
    """A single activity suggestion."""
    name: str
    description: str
    category: str
    estimated_duration: Optional[int] = None
    recommendation_reason: str


class TourStop(BaseModel):
    """A stop in a guided tour."""
    name: str
    description: str
    latitude: float
    longitude: float
    order: int


class GuidedTour(BaseModel):
    """A guided tour suggestion."""
    name: str
    description: str
    duration: int
    stops: List[TourStop]


class ActivitySuggestionsResponse(BaseModel):
    """Response with activity suggestions."""
    location: str
    activities: List[ActivitySuggestion]
    guided_tour: Optional[GuidedTour] = None
