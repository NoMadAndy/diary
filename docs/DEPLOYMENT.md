# Deployment

## Umgebung
- Ubuntu Server
- Docker + Docker Compose
- Self-Hosting

## Services
- api
- db
- minio
- web
- deployer

## Update-Strategie
- Git Polling im Deployer-Container
- Automatisches Build & Restart
- Healthcheck vor Abschluss

## Backup
- DB Dump
- Object Storage Snapshot
