"""
Database base - import all models here for Alembic.
"""
from app.db.session import Base

# Import all models so they are registered with Base
from app.db.models.user import User
from app.db.models.entry import Entry
from app.db.models.track import Track
from app.db.models.media import Media
