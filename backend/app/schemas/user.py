"""
User schemas for API request/response validation.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    """Schema for user registration."""
    password: str


class UserUpdate(BaseModel):
    """Schema for user updates."""
    full_name: Optional[str] = None
    password: Optional[str] = None


class UserInDB(UserBase):
    """Schema for user in database."""
    id: int
    is_active: bool
    is_superuser: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class UserResponse(UserBase):
    """Schema for user response."""
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True
