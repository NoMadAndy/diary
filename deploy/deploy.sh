#!/bin/bash
# SmartDiary Auto-Deploy Script
# Monitors git repository and deploys on new commits

set -e

# Configuration
GIT_REPO_URL="${GIT_REPO_URL:-}"
GIT_BRANCH="${GIT_BRANCH:-main}"
GIT_TOKEN="${GIT_TOKEN:-}"
POLL_INTERVAL="${POLL_INTERVAL:-60}"
HEALTHCHECK_URL="${HEALTHCHECK_URL:-http://api:8000/health}"
DEPLOY_LOCK_TIMEOUT="${DEPLOY_LOCK_TIMEOUT:-300}"
REPO_DIR="/deploy/repo"
LOCK_FILE="/deploy/.deploy.lock"
LAST_SHA_FILE="/deploy/.last_sha"

# Logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >&2
}

# Acquire deploy lock
acquire_lock() {
    local timeout=$DEPLOY_LOCK_TIMEOUT
    local start_time=$(date +%s)
    
    while [ -f "$LOCK_FILE" ]; do
        local lock_age=$(($(date +%s) - $(stat -c %Y "$LOCK_FILE" 2>/dev/null || echo $start_time)))
        
        if [ $lock_age -gt $timeout ]; then
            log "Lock file is stale (${lock_age}s old), removing..."
            rm -f "$LOCK_FILE"
            break
        fi
        
        local elapsed=$(($(date +%s) - start_time))
        if [ $elapsed -gt $timeout ]; then
            error "Timeout waiting for lock"
            return 1
        fi
        
        log "Waiting for lock... (${elapsed}s)"
        sleep 5
    done
    
    echo $$ > "$LOCK_FILE"
    return 0
}

# Release deploy lock
release_lock() {
    rm -f "$LOCK_FILE"
}

# Clone or update repository
update_repo() {
    local repo_url="$GIT_REPO_URL"
    
    # Add token to URL if provided
    if [ -n "$GIT_TOKEN" ]; then
        repo_url=$(echo "$repo_url" | sed "s|https://|https://${GIT_TOKEN}@|")
    fi
    
    if [ ! -d "$REPO_DIR/.git" ]; then
        log "Cloning repository..."
        git clone --branch "$GIT_BRANCH" --single-branch "$repo_url" "$REPO_DIR"
    else
        log "Fetching updates..."
        cd "$REPO_DIR"
        git fetch origin "$GIT_BRANCH" --force
        log "Local HEAD before reset: $(git rev-parse HEAD)"
        log "Remote HEAD: $(git rev-parse origin/$GIT_BRANCH)"
    fi
}

# Get current remote SHA
get_remote_sha() {
    cd "$REPO_DIR"
    git rev-parse "origin/$GIT_BRANCH"
}

# Get last deployed SHA
get_last_sha() {
    if [ -f "$LAST_SHA_FILE" ]; then
        cat "$LAST_SHA_FILE"
    else
        echo ""
    fi
}

# Save deployed SHA
save_sha() {
    echo "$1" > "$LAST_SHA_FILE"
}

# Check health endpoint
check_health() {
    local retries=30
    local wait_time=10
    
    log "Waiting for service to become healthy..."
    
    for i in $(seq 1 $retries); do
        if curl -sf "$HEALTHCHECK_URL" > /dev/null 2>&1; then
            log "Service is healthy!"
            return 0
        fi
        log "Health check attempt $i/$retries failed, waiting ${wait_time}s..."
        sleep $wait_time
    done
    
    error "Service failed to become healthy after $((retries * wait_time))s"
    return 1
}

# Deploy new version
deploy() {
    local new_sha="$1"
    
    log "Deploying commit: $new_sha"
    
    cd "$REPO_DIR"
    
    # Ensure we have a clean state and the latest code
    git fetch origin "$GIT_BRANCH" --force
    git checkout "$GIT_BRANCH" --force
    git reset --hard "origin/$GIT_BRANCH"
    git clean -fd
    
    log "Current directory: $(pwd)"
    log "Current HEAD after reset: $(git rev-parse HEAD)"
    log "Expected SHA: $new_sha"
    
    # Verify we have the right commit
    local current_sha=$(git rev-parse HEAD)
    if [ "$current_sha" != "$new_sha" ]; then
        error "SHA mismatch! Expected $new_sha but got $current_sha"
        return 1
    fi
    
    log "Rebuilding and restarting api and web services..."
    # Build and restart only api and web (not deployer, db, minio)
    # Use --no-cache to ensure fresh build with new code
    # Use production compose file to avoid dev volume mounts
    docker compose -f "$REPO_DIR/docker-compose.yml" -f "$REPO_DIR/docker-compose.prod.yml" build --no-cache api web
    docker compose -f "$REPO_DIR/docker-compose.yml" -f "$REPO_DIR/docker-compose.prod.yml" up -d --force-recreate --no-deps api web
    
    # Wait for health check
    if check_health; then
        save_sha "$new_sha"
        log "Deployment successful! SHA: $new_sha"
        return 0
    else
        error "Deployment verification failed!"
        return 1
    fi
}

# Main loop
main() {
    if [ -z "$GIT_REPO_URL" ]; then
        error "GIT_REPO_URL is required"
        exit 1
    fi
    
    log "SmartDiary Deployer starting..."
    log "Repository: $GIT_REPO_URL"
    log "Branch: $GIT_BRANCH"
    log "Poll interval: ${POLL_INTERVAL}s"
    
    # Initial clone
    update_repo
    
    while true; do
        log "Checking for updates..."
        
        update_repo
        
        local remote_sha=$(get_remote_sha)
        local last_sha=$(get_last_sha)
        
        if [ "$remote_sha" != "$last_sha" ]; then
            log "New commit detected: $remote_sha (last: $last_sha)"
            
            if acquire_lock; then
                deploy "$remote_sha" || true
                release_lock
            else
                error "Could not acquire lock, skipping deploy"
            fi
        else
            log "No new commits"
        fi
        
        log "Sleeping for ${POLL_INTERVAL}s..."
        sleep "$POLL_INTERVAL"
    done
}

# Handle signals
trap 'release_lock; exit 0' SIGTERM SIGINT

main
