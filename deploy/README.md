# SmartDiary Deployer

Automated git-based deployment container for SmartDiary.

## Features

- Git repository polling
- Automatic build and deploy on new commits
- Health check verification
- Deploy locking to prevent parallel deployments
- Production mode ohne Development-Volumes

## Wie es funktioniert

1. Der Deployer pollt das Git-Repository auf neue Commits
2. Bei einem neuen Commit wird der Code geholt
3. `docker compose build --no-cache` baut neue Images
4. `docker compose up -d --force-recreate` startet die Container neu
5. Die `docker-compose.prod.yml` Override entfernt Development-Volumes,
   damit der Code aus dem Image verwendet wird (nicht gemountet)

## Configuration

All configuration is done via environment variables:

- `GIT_REPO_URL` - Repository URL to clone
- `GIT_BRANCH` - Branch to track (default: main)
- `GIT_TOKEN` - Personal access token for private repos
- `POLL_INTERVAL` - Seconds between polls (default: 60)
- `HEALTHCHECK_URL` - URL to verify service health
- `DEPLOY_LOCK_TIMEOUT` - Max seconds for a deploy (default: 300)
