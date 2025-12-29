"""
Entry endpoints for diary entries CRUD operations.
"""
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.session import get_db
from app.db.models.user import User
from app.db.models.entry import Entry
from app.schemas.entry import EntryCreate, EntryUpdate, EntryResponse, EntryListResponse
from app.api.deps import get_current_user

router = APIRouter()


@router.post("/", response_model=EntryResponse, status_code=status.HTTP_201_CREATED)
async def create_entry(
    entry_in: EntryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new diary entry."""
    entry = Entry(
        user_id=current_user.id,
        title=entry_in.title,
        content=entry_in.content,
        latitude=entry_in.latitude,
        longitude=entry_in.longitude,
        location_name=entry_in.location_name,
        mood=entry_in.mood,
        rating=entry_in.rating,
        tags=entry_in.tags or [],
        weather=entry_in.weather,
        activity=entry_in.activity,
        entry_date=entry_in.entry_date or datetime.utcnow(),
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


@router.get("/", response_model=EntryListResponse)
async def list_entries(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    tags: Optional[List[str]] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List diary entries for the current user."""
    # Build query
    query = select(Entry).where(Entry.user_id == current_user.id)
    
    if start_date:
        query = query.where(Entry.entry_date >= start_date)
    if end_date:
        query = query.where(Entry.entry_date <= end_date)
    
    # Order by entry date descending
    query = query.order_by(Entry.entry_date.desc())
    
    # Count total
    count_query = select(func.count()).select_from(Entry).where(Entry.user_id == current_user.id)
    if start_date:
        count_query = count_query.where(Entry.entry_date >= start_date)
    if end_date:
        count_query = count_query.where(Entry.entry_date <= end_date)
    
    result = await db.execute(count_query)
    total = result.scalar()
    
    # Pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    
    result = await db.execute(query)
    entries = result.scalars().all()
    
    return EntryListResponse(
        items=entries,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{entry_id}", response_model=EntryResponse)
async def get_entry(
    entry_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific diary entry."""
    result = await db.execute(
        select(Entry).where(Entry.id == entry_id, Entry.user_id == current_user.id)
    )
    entry = result.scalar_one_or_none()
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found",
        )
    
    return entry


@router.put("/{entry_id}", response_model=EntryResponse)
async def update_entry(
    entry_id: int,
    entry_in: EntryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a diary entry."""
    result = await db.execute(
        select(Entry).where(Entry.id == entry_id, Entry.user_id == current_user.id)
    )
    entry = result.scalar_one_or_none()
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found",
        )
    
    # Update fields
    update_data = entry_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(entry, field, value)
    
    await db.commit()
    await db.refresh(entry)
    return entry


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_entry(
    entry_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a diary entry."""
    result = await db.execute(
        select(Entry).where(Entry.id == entry_id, Entry.user_id == current_user.id)
    )
    entry = result.scalar_one_or_none()
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found",
        )
    
    await db.delete(entry)
    await db.commit()
