# Deployment

## Voraussetzungen

- Ubuntu Server 22.04+
- Docker Engine 20.10+
- **Docker Compose V2** (als Docker Plugin)

> ⚠️ **Wichtig**: Das alte `docker-compose` (Python-Version 1.x) ist **nicht kompatibel** mit Python 3.12+.
> Verwende stattdessen `docker compose` (V2).

### Docker Compose V2 installieren

Docker Compose V2 ist in Docker Desktop integriert. Auf Linux-Servern:

```bash
# Docker Plugin installieren
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Version prüfen
docker compose version
```

Falls bereits `docker-compose` installiert ist und Fehler auftreten:
```bash
# Alte Version entfernen (optional)
sudo apt-get remove docker-compose

# Compose V2 verwenden
docker compose up -d  # Beachte: Leerzeichen statt Bindestrich
```

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
