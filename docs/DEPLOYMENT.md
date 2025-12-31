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

## Fehlerbehebung

### Password Authentication Failed

Wenn beim Start folgende Fehlermeldung erscheint:

```
FATAL: password authentication failed for user "smartdiary"
asyncpg.exceptions.InvalidPasswordError: password authentication failed for user "smartdiary"
```

Dies tritt auf, wenn die Datenbank-Volumes bereits mit anderen Credentials initialisiert wurden.

**Lösung 1: Volumes zurücksetzen (Datenverlust!)**

```bash
# Container stoppen
docker compose down

# Datenbank-Volume entfernen (ACHTUNG: Löscht alle Datenbank-Daten!)
docker volume rm diary_postgres-data

# Neu starten
docker compose up -d
```

**Lösung 2: Credentials anpassen**

Falls die Datenbank bereits wichtige Daten enthält, passe die `.env` Datei an die bestehenden Credentials an:

```bash
# Prüfe welche Credentials ursprünglich verwendet wurden
# und passe .env entsprechend an:
POSTGRES_USER=smartdiary
POSTGRES_PASSWORD=<original-password>
```

**Lösung 3: Datenbank-Passwort manuell ändern**

```bash
# Container starten
docker compose up -d db

# In Datenbank-Container einloggen
docker exec -it smartdiary-db psql -U postgres

# Passwort ändern (SQL)
ALTER USER smartdiary WITH PASSWORD 'smartdiary';
\q

# Container neu starten
docker compose down
docker compose up -d
```
