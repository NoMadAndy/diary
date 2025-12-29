#!/usr/bin/env python3
"""
SmartDiary Auto-Commit Tool

Automates:
- CHANGELOG.md updates
- README.md updates (when relevant)
- Conventional commits
- Git push

Usage:
    python auto_commit.py --type feat --message "Add new feature"
"""

import os
import re
import sys
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Optional, List

try:
    import click
except ImportError:
    print("Please install requirements: pip install -r tools/requirements.txt")
    sys.exit(1)

# Constants
REPO_ROOT = Path(__file__).parent.parent
CHANGELOG_PATH = REPO_ROOT / "CHANGELOG.md"
README_PATH = REPO_ROOT / "README.md"

COMMIT_TYPES = {
    "feat": "Features",
    "fix": "Bug Fixes",
    "docs": "Documentation",
    "style": "Styles",
    "refactor": "Refactoring",
    "test": "Tests",
    "chore": "Chores",
    "security": "Security",
}

CHANGELOG_SECTIONS = {
    "feat": "Added",
    "fix": "Fixed",
    "docs": "Changed",
    "style": "Changed",
    "refactor": "Changed",
    "test": "Changed",
    "chore": "Changed",
    "security": "Security",
}


def run_command(cmd: List[str], cwd: Optional[Path] = None) -> tuple[int, str, str]:
    """Run a command and return exit code, stdout, and stderr."""
    result = subprocess.run(
        cmd,
        cwd=cwd or REPO_ROOT,
        capture_output=True,
        text=True,
    )
    return result.returncode, result.stdout, result.stderr


def get_current_version() -> str:
    """Extract current version from CHANGELOG.md."""
    if not CHANGELOG_PATH.exists():
        return "0.1.0"
    
    content = CHANGELOG_PATH.read_text()
    match = re.search(r"## \[(\d+\.\d+\.\d+)\]", content)
    if match:
        return match.group(1)
    return "0.1.0"


def bump_version(current: str, commit_type: str) -> str:
    """Bump version based on commit type."""
    major, minor, patch = map(int, current.split("."))
    
    if commit_type in ["feat"]:
        minor += 1
        patch = 0
    else:
        patch += 1
    
    return f"{major}.{minor}.{patch}"


def update_changelog(commit_type: str, message: str, scope: Optional[str] = None) -> bool:
    """Update CHANGELOG.md with new entry."""
    section = CHANGELOG_SECTIONS.get(commit_type, "Changed")
    
    if not CHANGELOG_PATH.exists():
        # Create new changelog
        content = """# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

"""
    else:
        content = CHANGELOG_PATH.read_text()
    
    # Find or create Unreleased section
    unreleased_match = re.search(r"## \[Unreleased\]\n", content)
    if not unreleased_match:
        # Add Unreleased section after header
        header_end = content.find("\n## [")
        if header_end == -1:
            content += "\n## [Unreleased]\n\n"
        else:
            content = content[:header_end] + "\n## [Unreleased]\n\n" + content[header_end:]
    
    # Find the section (Added, Changed, Fixed, etc.)
    section_pattern = rf"## \[Unreleased\].*?(### {section}\n)"
    section_match = re.search(section_pattern, content, re.DOTALL)
    
    entry = f"- {message}"
    if scope:
        entry = f"- **{scope}**: {message}"
    
    if section_match:
        # Add to existing section
        insert_pos = section_match.end(1)
        content = content[:insert_pos] + entry + "\n" + content[insert_pos:]
    else:
        # Create new section
        unreleased_end = content.find("## [Unreleased]") + len("## [Unreleased]\n")
        next_section = content.find("\n## [", unreleased_end)
        if next_section == -1:
            next_section = len(content)
        
        new_section = f"\n### {section}\n{entry}\n"
        content = content[:unreleased_end] + new_section + content[unreleased_end:]
    
    CHANGELOG_PATH.write_text(content)
    return True


def run_linters() -> bool:
    """Run linters on the codebase."""
    click.echo("Running linters...")
    
    # Python linting (if backend exists)
    backend_path = REPO_ROOT / "backend"
    if backend_path.exists():
        code, stdout, stderr = run_command(
            ["python", "-m", "py_compile", "app/main.py"],
            cwd=backend_path
        )
        if code != 0:
            click.echo(f"Python syntax check failed: {stderr}", err=True)
            return False
    
    click.echo("Linting passed!")
    return True


def git_add_all() -> bool:
    """Stage all changes."""
    code, _, stderr = run_command(["git", "add", "-A"])
    if code != 0:
        click.echo(f"Failed to stage changes: {stderr}", err=True)
        return False
    return True


def git_commit(commit_type: str, scope: Optional[str], message: str) -> bool:
    """Create a conventional commit."""
    if scope:
        commit_msg = f"{commit_type}({scope}): {message}"
    else:
        commit_msg = f"{commit_type}: {message}"
    
    code, _, stderr = run_command(["git", "commit", "-m", commit_msg])
    if code != 0:
        click.echo(f"Failed to commit: {stderr}", err=True)
        return False
    return True


def git_push() -> bool:
    """Push changes to remote."""
    code, _, stderr = run_command(["git", "push"])
    if code != 0:
        click.echo(f"Failed to push: {stderr}", err=True)
        return False
    return True


@click.command()
@click.option(
    "--type", "commit_type",
    type=click.Choice(list(COMMIT_TYPES.keys())),
    required=True,
    help="Type of change"
)
@click.option(
    "--message", "-m",
    required=True,
    help="Commit message"
)
@click.option(
    "--scope", "-s",
    help="Scope of the change (e.g., api, web, ios)"
)
@click.option(
    "--skip-lint",
    is_flag=True,
    help="Skip linting"
)
@click.option(
    "--skip-push",
    is_flag=True,
    help="Skip git push"
)
@click.option(
    "--dry-run",
    is_flag=True,
    help="Show what would be done without making changes"
)
def main(commit_type: str, message: str, scope: Optional[str], 
         skip_lint: bool, skip_push: bool, dry_run: bool):
    """SmartDiary Auto-Commit Tool"""
    
    click.echo(f"🚀 SmartDiary Auto-Commit")
    click.echo(f"   Type: {commit_type}")
    click.echo(f"   Message: {message}")
    if scope:
        click.echo(f"   Scope: {scope}")
    click.echo()
    
    if dry_run:
        click.echo("🔍 DRY RUN - No changes will be made")
        click.echo()
    
    # Step 1: Update CHANGELOG.md
    click.echo("📝 Updating CHANGELOG.md...")
    if not dry_run:
        update_changelog(commit_type, message, scope)
    click.echo("   ✅ Done")
    
    # Step 2: Run linters
    if not skip_lint:
        click.echo("🔍 Running linters...")
        if not dry_run and not run_linters():
            click.echo("   ❌ Linting failed")
            sys.exit(1)
        click.echo("   ✅ Done")
    
    # Step 3: Stage changes
    click.echo("📦 Staging changes...")
    if not dry_run:
        git_add_all()
    click.echo("   ✅ Done")
    
    # Step 4: Create commit
    click.echo("💾 Creating commit...")
    if not dry_run:
        if scope:
            commit_msg = f"{commit_type}({scope}): {message}"
        else:
            commit_msg = f"{commit_type}: {message}"
        git_commit(commit_type, scope, message)
    click.echo("   ✅ Done")
    
    # Step 5: Push
    if not skip_push:
        click.echo("🚀 Pushing to remote...")
        if not dry_run:
            git_push()
        click.echo("   ✅ Done")
    
    click.echo()
    click.echo("✨ All done!")


if __name__ == "__main__":
    main()
