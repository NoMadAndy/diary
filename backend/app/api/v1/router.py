"""
API v1 Router - aggregates all endpoint routers.
"""
from fastapi import APIRouter

from app.api.v1.endpoints import auth, entries, tracks, media, ai, meta

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(entries.router, prefix="/entries", tags=["entries"])
api_router.include_router(tracks.router, prefix="/tracks", tags=["tracks"])
api_router.include_router(media.router, prefix="/media", tags=["media"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(meta.router, prefix="/meta", tags=["meta"])
