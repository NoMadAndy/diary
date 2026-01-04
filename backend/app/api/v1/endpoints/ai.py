"""
AI endpoints for summarization, tagging, and trip suggestions.
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.db.models.user import User
from app.db.models.entry import Entry
from app.db.models.track import Track
from app.schemas.ai import (
    DaySummaryRequest,
    DaySummaryResponse,
    MultiDaySummaryRequest,
    MultiDaySummaryResponse,
    TagSuggestionRequest,
    TagSuggestionResponse,
    TripSuggestionRequest,
    TripSuggestionResponse,
    GuidePOIRequest,
    GuidePOIResponse,
    ActivitySuggestionsRequest,
    ActivitySuggestionsResponse,
)
from app.api.deps import get_current_user
from app.services.ai_service import ai_service

router = APIRouter()


@router.post("/summarize_day", response_model=DaySummaryResponse)
async def summarize_day(
    request: DaySummaryRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate a summary for a specific day."""
    # Get entries for the day
    start_of_day = request.date.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = request.date.replace(hour=23, minute=59, second=59, microsecond=999999)
    
    result = await db.execute(
        select(Entry)
        .where(Entry.user_id == current_user.id)
        .where(Entry.entry_date >= start_of_day)
        .where(Entry.entry_date <= end_of_day)
    )
    entries = result.scalars().all()
    
    # Get tracks for the day if requested
    tracks = []
    if request.include_tracks:
        result = await db.execute(
            select(Track)
            .where(Track.user_id == current_user.id)
            .where(Track.started_at >= start_of_day)
            .where(Track.started_at <= end_of_day)
        )
        tracks = result.scalars().all()
    
    if not entries and not tracks:
        return DaySummaryResponse(
            date=request.date.strftime("%Y-%m-%d"),
            summary="Keine Einträge für diesen Tag.",
            highlights=[],
            statistics={"entries": 0},
        )
    
    # Generate summary using AI service
    summary = await ai_service.generate_day_summary(entries, tracks)
    
    return summary


@router.post("/summarize_period", response_model=MultiDaySummaryResponse)
async def summarize_period(
    request: MultiDaySummaryRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate a summary for multiple days."""
    # Get entries for the period
    result = await db.execute(
        select(Entry)
        .where(Entry.user_id == current_user.id)
        .where(Entry.entry_date >= request.start_date)
        .where(Entry.entry_date <= request.end_date)
        .order_by(Entry.entry_date)
    )
    entries = result.scalars().all()
    
    # Get tracks for the period if requested
    tracks = []
    if request.include_tracks:
        result = await db.execute(
            select(Track)
            .where(Track.user_id == current_user.id)
            .where(Track.started_at >= request.start_date)
            .where(Track.started_at <= request.end_date)
            .order_by(Track.started_at)
        )
        tracks = result.scalars().all()
    
    # Generate multi-day summary using AI service
    summary = await ai_service.generate_multi_day_summary(
        entries,
        tracks,
        request.start_date,
        request.end_date,
    )
    
    return summary


@router.post("/suggest_tags", response_model=TagSuggestionResponse)
async def suggest_tags(
    request: TagSuggestionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Suggest tags for an entry."""
    content = request.content
    
    # If entry_id is provided, get the entry content
    if request.entry_id:
        result = await db.execute(
            select(Entry).where(
                Entry.id == request.entry_id,
                Entry.user_id == current_user.id
            )
        )
        entry = result.scalar_one_or_none()
        if entry:
            content = entry.content
    
    if not content:
        return TagSuggestionResponse(
            tags=[],
            categories=[],
            confidence=0.0,
        )
    
    # Generate tag suggestions using AI
    suggestions = await ai_service.suggest_tags(
        content=content,
        location=request.location,
        activity=request.activity,
    )
    
    return suggestions


@router.post("/trips/suggest", response_model=TripSuggestionResponse)
async def suggest_trip(
    request: TripSuggestionRequest,
):
    """Generate a trip suggestion with route and POIs (public endpoint for demo)."""
    suggestion = await ai_service.suggest_trip(
        start_location=request.start_location,
        end_location=request.end_location,
        interests=request.interests,
        time_budget_hours=request.time_budget_hours,
        transport_mode=request.transport_mode,
    )
    
    return suggestion


@router.post("/guide/next", response_model=GuidePOIResponse)
async def get_next_guide_poi(
    request: GuidePOIRequest,
    current_user: User = Depends(get_current_user),
):
    """Get information about nearby POI for the guide mode."""
    if request.mode == "off":
        return GuidePOIResponse(
            poi_name=None,
            text="Reiseführer ist deaktiviert.",
            has_more=False,
        )
    
    poi_info = await ai_service.get_guide_poi(
        latitude=request.latitude,
        longitude=request.longitude,
        mode=request.mode,
    )
    
    return poi_info


@router.post("/suggest_activities", response_model=ActivitySuggestionsResponse)
async def suggest_activities(
    request: ActivitySuggestionsRequest,
    current_user: User = Depends(get_current_user),
):
    """Suggest activities at a destination with detailed research and guided tour."""
    suggestions = await ai_service.suggest_activities(
        latitude=request.latitude,
        longitude=request.longitude,
        interests=request.interests,
    )
    
    return suggestions
