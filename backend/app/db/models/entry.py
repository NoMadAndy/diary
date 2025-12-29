"""
Entry model for diary entries.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.db.session import Base


class Entry(Base):
    """Diary entry model."""
    
    __tablename__ = "entries"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Content
    title = Column(String(255), nullable=True)
    content = Column(Text, nullable=True)
    
    # Location
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location_name = Column(String(255), nullable=True)
    
    # Metadata
    mood = Column(String(50), nullable=True)
    rating = Column(Integer, nullable=True)
    tags = Column(JSON, default=list)
    weather = Column(JSON, nullable=True)
    activity = Column(String(100), nullable=True)
    
    # AI-generated content
    ai_summary = Column(Text, nullable=True)
    ai_tags = Column(JSON, nullable=True)
    
    # Timestamps
    entry_date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="entries")
    media = relationship("Media", back_populates="entry", cascade="all, delete-orphan")
    track = relationship("Track", back_populates="entry", uselist=False)
