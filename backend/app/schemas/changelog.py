"""
Changelog schemas for API response.
"""
from typing import List, Optional
from pydantic import BaseModel


class ChangelogVersion(BaseModel):
    """Single changelog version entry."""
    version: str
    date: Optional[str] = None
    added: List[str] = []
    changed: List[str] = []
    fixed: List[str] = []
    security: List[str] = []


class ChangelogResponse(BaseModel):
    """Changelog response schema."""
    markdown: str
    versions: List[ChangelogVersion]
