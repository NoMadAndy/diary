# SmartDiary

**SmartDiary** ist ein KI-gestütztes Tagebuch-, Reise- und Lebenslog-System  
mit iOS App, Web-Dashboard und selbstgehostetem Backend.

Es kombiniert automatische Datenerfassung, manuelle Einträge und künstliche Intelligenz,
um Erlebnisse verständlich zu strukturieren, zusammenzufassen und in Geschichten zu verwandeln.

---

## 🧭 Projektübersicht

| Komponente | Beschreibung |
|-----------|-------------|
| iOS App | SwiftUI App für automatisches & manuelles Logging |
| Backend | FastAPI Service, Docker-basiert |
| Web Dashboard | Responsive Web-App für Auswertungen & Planung |
| KI Engine | OpenAI-gestützte Analysen, Zusammenfassungen, Reiseführer |
| Deployment | Self-hosted auf Ubuntu mit automatischem Git-Deploy |

---

## 📚 Zentrale Dokumentation

Alle verbindlichen Projektregeln befinden sich im Ordner **`/docs`**:

| Datei | Inhalt |
|------|-------|
| `VISION.md` | Produktvision & Zielbild |
| `REQUIREMENTS.md` | Fachliche Anforderungen |
| `ARCHITECTURE.md` | Technische Architektur |
| `AI_AGENT_INSTRUCTIONS.md` | **Vertrag für Entwickler & KI-Agenten** |
| `COMPLIANCE.md` | AppStore & DSGVO Richtlinien |
| `DEPLOYMENT.md` | Hosting & Betrieb |
| `ROADMAP.md` | Feature-Planung |

> **Jeder Entwickler oder KI-Agent muss vor Beginn `docs/AI_AGENT_INSTRUCTIONS.md` lesen.**

---

## 📁 Repository-Struktur

```
/backend        # FastAPI Backend (Python)
  /app          # Application code
  /alembic      # Database migrations
/web            # Next.js Web Dashboard
  /src/app      # App router pages
  /src/lib      # Shared utilities
/ios            # iOS App (Swift/SwiftUI)
  /SmartDiary   # Xcode project
/deploy         # Deployer container
/tools          # Development tools & automation
/docs           # Documentation
```

---

## 🚀 Quick Start (Development)

### Voraussetzungen

- Docker Engine 20.10+
- Docker Compose V2 (integriert in Docker Desktop oder separat installiert)

> ⚠️ **Wichtig**: Das Projekt erfordert **Docker Compose V2** (`docker compose` Befehl).
> Die alte Python-basierte Version `docker-compose` (v1.x) ist nicht kompatibel mit Python 3.12+.

### 1. Konfiguration

```bash
cp .env.example .env
# Bearbeite .env mit deinen Werten (API Keys, Passwörter, etc.)
```

### 2. Docker Compose starten

```bash
docker compose up -d
```

Dies startet alle Services:
- **api** (Port 8000): FastAPI Backend
- **db**: PostgreSQL Datenbank
- **minio** (Port 9000/9001): S3-kompatibler Object Storage
- **web** (Port 3000): Next.js Web Dashboard
- **deployer**: Automatischer Git-Deployment

> ⚠️ **Bei Datenbank-Fehlern**: Falls "password authentication failed" erscheint, wurden die
> Volumes mit anderen Credentials initialisiert. Lösung: `docker compose down && docker volume rm diary_postgres-data && docker compose up -d`
> Weitere Details unter [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#fehlerbehebung).

### 3. Zugriff

- API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Web Dashboard: http://localhost:3000
- MinIO Console: http://localhost:9001

---

## 🔑 Umgebungsvariablen

Alle Konfiguration erfolgt über `.env` (siehe `.env.example`):

| Variable | Beschreibung |
|----------|-------------|
| `SECRET_KEY` | Anwendungs-Geheimschlüssel |
| `DATABASE_URL` | PostgreSQL Verbindungs-URL |
| `JWT_SECRET_KEY` | JWT Token Signatur |
| `OPENAI_API_KEY` | OpenAI API Key für KI-Funktionen |
| `S3_*` | MinIO/S3 Konfiguration |
| `GIT_*` | Auto-Deployer Konfiguration |

---

## 📱 iOS App

Die iOS App befindet sich in `/ios/SmartDiary`.

### Voraussetzungen
- Xcode 15.0+
- iOS 16.0+

### Setup
1. Öffne `SmartDiary.xcodeproj` in Xcode
2. Konfiguriere dein Development Team
3. Setze die API Base URL in den Settings
4. Build & Run

### Berechtigungen
Die App fordert folgende Berechtigungen an (alle mit klaren Nutzen-Erklärungen):
- **Standort (Immer)**: Für Track-Aufzeichnung und Auto-Logging
- **Fotos**: Für Zuordnung von Fotos zu Einträgen
- **Bewegung**: Für Aktivitätserkennung
- **HealthKit** (optional): Für erweiterte Aktivitätsdaten

---

## 🔧 API-Endpunkte

### Auth
- `POST /api/v1/auth/register` - Registrierung
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Token erneuern

### Entries
- `GET /api/v1/entries` - Einträge auflisten
- `POST /api/v1/entries` - Eintrag erstellen
- `GET /api/v1/entries/{id}` - Eintrag abrufen
- `PUT /api/v1/entries/{id}` - Eintrag aktualisieren
- `DELETE /api/v1/entries/{id}` - Eintrag löschen

### Tracks
- `GET /api/v1/tracks` - Tracks auflisten
- `POST /api/v1/tracks` - Track hochladen
- `GET /api/v1/tracks/{id}` - Track abrufen
- `GET /api/v1/tracks/{id}/stats` - Track-Statistiken

### Media
- `POST /api/v1/media/presign` - Upload-URL erhalten
- `POST /api/v1/media` - Media-Metadaten erstellen
- `GET /api/v1/media/{id}/download` - Download-URL erhalten

### AI
- `POST /api/v1/ai/summarize_day` - Tageszusammenfassung
- `POST /api/v1/ai/suggest_tags` - Tag-Vorschläge
- `POST /api/v1/ai/trips/suggest` - Trip-Vorschlag
- `POST /api/v1/ai/guide/next` - Reiseführer-POI

### Meta
- `GET /api/v1/meta/changelog` - Changelog abrufen
- `GET /api/v1/meta/version` - Version abrufen

---

## 🚢 Deployment

### Automatisches Deployment

Der Deployer-Container überwacht das Git-Repository und deployt automatisch bei neuen Commits:

1. Git fetch alle N Sekunden
2. Bei neuem Commit: Build → Restart → Healthcheck
3. Locking gegen parallele Deployments

Konfiguration in `.env`:
```
GIT_REPO_URL=https://github.com/your-org/diary.git
GIT_BRANCH=main
GIT_TOKEN=your-readonly-token
POLL_INTERVAL=60
```

### Manuelle Updates

```bash
git pull
docker compose build
docker compose up -d
```

---

## 🛡️ Sicherheit

- JWT-basierte Authentifizierung mit Refresh Tokens
- Password Hashing mit bcrypt
- Rate Limiting auf API-Endpunkten
- Input Validation
- CORS via Umgebungsvariablen konfigurierbar

---

## 📄 Lizenz

Dieses Projekt ist privat und nicht für die öffentliche Nutzung bestimmt
