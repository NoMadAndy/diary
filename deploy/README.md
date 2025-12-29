# SmartDiary Deployer

Automated git-based deployment container for SmartDiary.

## Features

- Git repository polling
- Automatic build and deploy on new commits
- Health check verification
- Deploy locking to prevent parallel deployments

## Configuration

All configuration is done via environment variables:

- `GIT_REPO_URL` - Repository URL to clone
- `GIT_BRANCH` - Branch to track (default: main)
- `GIT_TOKEN` - Personal access token for private repos
- `POLL_INTERVAL` - Seconds between polls (default: 60)
- `HEALTHCHECK_URL` - URL to verify service health
- `DEPLOY_LOCK_TIMEOUT` - Max seconds for a deploy (default: 300)
