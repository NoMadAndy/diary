# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project structure with `/backend`, `/web`, `/ios`, `/deploy`, `/tools` directories
- Environment configuration template (`.env.example`)
- Docker Compose setup for all services
- FastAPI backend skeleton with JWT authentication
- Database models for users, entries, tracks, and media
- API endpoints for authentication, entries, tracks, media, and AI features
- Changelog API endpoint (`/api/v1/meta/changelog`)
- Web dashboard skeleton (Next.js)
- Deployer container for automatic git-based deployment
- Auto-commit tooling in `/tools`

### Security
- JWT-based authentication with refresh tokens
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Input validation on all endpoints
- CORS configuration via environment variables

## [0.1.0] - 2024-01-01

### Added
- Project inception
- Documentation structure in `/docs`
- Vision, Requirements, Architecture, and Compliance documentation
