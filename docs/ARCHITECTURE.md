# Architektur

## Komponenten
- iOS App → REST + WebSocket → Backend
- Backend → Postgres + Object Storage
- Backend → OpenAI API
- Web Dashboard → Backend API

## Grundprinzipien
- API Versionierung
- Keine Hardcodings
- Alles konfigurierbar über `.env`
- Strikte Trennung von Client / API / Storage
- KI immer optional, mit Fallback

## Sicherheit
- JWT + Refresh Tokens
- Hashing aller Passwörter
- Rate Limiting
- Input Validation
