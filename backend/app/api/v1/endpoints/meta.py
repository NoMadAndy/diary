"""
Meta endpoints for changelog and other metadata.
"""
import re
from pathlib import Path
from fastapi import APIRouter, HTTPException

from app.schemas.changelog import ChangelogResponse, ChangelogVersion

router = APIRouter()


def parse_changelog(content: str) -> list[ChangelogVersion]:
    """Parse CHANGELOG.md content into structured versions."""
    versions = []
    current_version = None
    current_section = None
    
    lines = content.split("\n")
    
    for line in lines:
        # Match version header: ## [0.1.0] - 2024-01-01 or ## [Unreleased]
        version_match = re.match(r"^## \[([^\]]+)\](?:\s*-\s*(.+))?", line)
        if version_match:
            if current_version:
                versions.append(current_version)
            current_version = ChangelogVersion(
                version=version_match.group(1),
                date=version_match.group(2) if version_match.group(2) else None,
            )
            current_section = None
            continue
        
        # Match section header: ### Added, ### Changed, etc.
        section_match = re.match(r"^### (Added|Changed|Fixed|Security|Deprecated|Removed)", line, re.IGNORECASE)
        if section_match and current_version:
            current_section = section_match.group(1).lower()
            continue
        
        # Match list item: - Some change
        item_match = re.match(r"^- (.+)$", line)
        if item_match and current_version and current_section:
            item_text = item_match.group(1)
            if current_section == "added":
                current_version.added.append(item_text)
            elif current_section == "changed":
                current_version.changed.append(item_text)
            elif current_section == "fixed":
                current_version.fixed.append(item_text)
            elif current_section == "security":
                current_version.security.append(item_text)
    
    # Add last version
    if current_version:
        versions.append(current_version)
    
    return versions


@router.get("/changelog", response_model=ChangelogResponse)
async def get_changelog():
    """Get the changelog in markdown and parsed JSON format."""
    # Try to read CHANGELOG.md from mounted path or app directory
    changelog_paths = [
        Path("/app/CHANGELOG.md"),
        Path(__file__).parent.parent.parent.parent.parent.parent / "CHANGELOG.md",
    ]
    
    content = None
    for path in changelog_paths:
        if path.exists():
            content = path.read_text(encoding="utf-8")
            break
    
    if content is None:
        raise HTTPException(
            status_code=404,
            detail="CHANGELOG.md not found",
        )
    
    versions = parse_changelog(content)
    
    return ChangelogResponse(
        markdown=content,
        versions=versions,
    )


@router.get("/version")
async def get_version():
    """Get the current API version."""
    return {
        "version": "0.1.0",
        "api_version": "v1",
    }
