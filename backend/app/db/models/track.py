"""
Track model for GPS tracks.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship

from app.db.session import Base


class Track(Base):
    """GPS track model."""
    
    __tablename__ = "tracks"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    entry_id = Column(Integer, ForeignKey("entries.id"), nullable=True)
    
    # Track info
    name = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    
    # Track data (GeoJSON or array of coordinates)
    track_data = Column(JSON, nullable=False)
    
    # Statistics
    distance_meters = Column(Float, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    elevation_gain = Column(Float, nullable=True)
    elevation_loss = Column(Float, nullable=True)
    max_elevation = Column(Float, nullable=True)
    min_elevation = Column(Float, nullable=True)
    avg_speed = Column(Float, nullable=True)
    
    # Bounding box
    min_lat = Column(Float, nullable=True)
    max_lat = Column(Float, nullable=True)
    min_lon = Column(Float, nullable=True)
    max_lon = Column(Float, nullable=True)
    
    # Timestamps
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="tracks")
    entry = relationship("Entry", back_populates="track")
