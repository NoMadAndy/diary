"""
Track endpoints for GPS track operations.
"""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.session import get_db
from app.db.models.user import User
from app.db.models.track import Track
from app.schemas.track import TrackCreate, TrackUpdate, TrackResponse, TrackListResponse, TrackStats
from app.api.deps import get_current_user
from app.services.track_service import calculate_track_stats

router = APIRouter()


@router.post("/", response_model=TrackResponse, status_code=status.HTTP_201_CREATED)
async def create_track(
    track_in: TrackCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a new GPS track."""
    # Convert track points to list of dicts
    track_data = [point.model_dump() for point in track_in.track_data]
    
    # Calculate statistics
    stats = calculate_track_stats(track_data)
    
    track = Track(
        user_id=current_user.id,
        name=track_in.name,
        description=track_in.description,
        entry_id=track_in.entry_id,
        track_data=track_data,
        started_at=track_in.started_at,
        ended_at=track_in.ended_at,
        **stats,
    )
    db.add(track)
    await db.commit()
    await db.refresh(track)
    return track


@router.get("/", response_model=TrackListResponse)
async def list_tracks(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List GPS tracks for the current user."""
    query = select(Track).where(Track.user_id == current_user.id)
    
    if start_date:
        query = query.where(Track.started_at >= start_date)
    if end_date:
        query = query.where(Track.ended_at <= end_date)
    
    query = query.order_by(Track.started_at.desc())
    
    # Count total
    count_query = select(func.count()).select_from(Track).where(Track.user_id == current_user.id)
    result = await db.execute(count_query)
    total = result.scalar()
    
    # Pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    
    result = await db.execute(query)
    tracks = result.scalars().all()
    
    return TrackListResponse(
        items=tracks,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{track_id}", response_model=TrackResponse)
async def get_track(
    track_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific GPS track."""
    result = await db.execute(
        select(Track).where(Track.id == track_id, Track.user_id == current_user.id)
    )
    track = result.scalar_one_or_none()
    
    if not track:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Track not found",
        )
    
    return track


@router.get("/{track_id}/stats", response_model=TrackStats)
async def get_track_stats(
    track_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get statistics for a specific track."""
    result = await db.execute(
        select(Track).where(Track.id == track_id, Track.user_id == current_user.id)
    )
    track = result.scalar_one_or_none()
    
    if not track:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Track not found",
        )
    
    return TrackStats(
        distance_meters=track.distance_meters,
        duration_seconds=track.duration_seconds,
        elevation_gain=track.elevation_gain,
        elevation_loss=track.elevation_loss,
        max_elevation=track.max_elevation,
        min_elevation=track.min_elevation,
        avg_speed=track.avg_speed,
    )


@router.put("/{track_id}", response_model=TrackResponse)
async def update_track(
    track_id: int,
    track_in: TrackUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a GPS track."""
    result = await db.execute(
        select(Track).where(Track.id == track_id, Track.user_id == current_user.id)
    )
    track = result.scalar_one_or_none()
    
    if not track:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Track not found",
        )
    
    update_data = track_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(track, field, value)
    
    await db.commit()
    await db.refresh(track)
    return track


@router.delete("/{track_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_track(
    track_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a GPS track."""
    result = await db.execute(
        select(Track).where(Track.id == track_id, Track.user_id == current_user.id)
    )
    track = result.scalar_one_or_none()
    
    if not track:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Track not found",
        )
    
    await db.delete(track)
    await db.commit()
