#!/bin/bash
# SmartDiary Deployer Bootstrap
# Klont das Repo und führt dann das deploy.sh aus dem Repo aus
# So werden Änderungen am deploy.sh automatisch übernommen

set -e

GIT_REPO_URL="${GIT_REPO_URL:-}"
GIT_BRANCH="${GIT_BRANCH:-main}"
GIT_TOKEN="${GIT_TOKEN:-}"
REPO_DIR="/deploy/repo"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] BOOTSTRAP: $1"
}

error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] BOOTSTRAP ERROR: $1" >&2
}

if [ -z "$GIT_REPO_URL" ]; then
    error "GIT_REPO_URL is required"
    exit 1
fi

# Build repo URL with token
repo_url="$GIT_REPO_URL"
if [ -n "$GIT_TOKEN" ]; then
    repo_url=$(echo "$repo_url" | sed "s|https://|https://${GIT_TOKEN}@|")
fi

# Clone repository if not exists
if [ ! -d "$REPO_DIR/.git" ]; then
    log "Initial clone of repository..."
    git clone --branch "$GIT_BRANCH" --single-branch "$repo_url" "$REPO_DIR"
else
    log "Updating repository..."
    cd "$REPO_DIR"
    git fetch origin "$GIT_BRANCH" --force
    git reset --hard "origin/$GIT_BRANCH"
    git clean -fd
fi

# Make deploy script executable
chmod +x "$REPO_DIR/deploy/deploy.sh"

log "Starting deploy.sh from repository..."
log "Deploy script version: $(cd $REPO_DIR && git log -1 --format='%h %s' -- deploy/deploy.sh)"

# Execute deploy script from repo (exec replaces this process)
exec "$REPO_DIR/deploy/deploy.sh"
