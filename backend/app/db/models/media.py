"""
Media model for photos and other media files.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.db.session import Base


class Media(Base):
    """Media file model."""
    
    __tablename__ = "media"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    entry_id = Column(Integer, ForeignKey("entries.id"), nullable=True)
    
    # File info
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=True)
    mime_type = Column(String(100), nullable=False)
    file_size = Column(Integer, nullable=True)
    
    # Storage
    storage_key = Column(String(512), nullable=False, unique=True)
    thumbnail_key = Column(String(512), nullable=True)
    
    # Location (from EXIF or manual)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    # Metadata (EXIF, etc.)
    metadata = Column(JSON, nullable=True)
    
    # Timestamps
    captured_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="media")
    entry = relationship("Entry", back_populates="media")
