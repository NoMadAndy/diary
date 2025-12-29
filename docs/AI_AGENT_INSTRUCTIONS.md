# Auftrag: Produktionsreife iOS Tagebuch-App (Auto-Logging) + Backend (Ubuntu selfhosted) + Responsive Web-Dashboard + KI-Funktionen + Docker Compose + In-Container Git Auto-Deploy + Auto-Commit/Push + Live Changelog

Du bist ein senior iOS + Backend + Web + DevOps Engineer. Du lieferst ein **produktionsreifes**, wartbares Gesamtsystem:
1) iOS App (Swift/SwiftUI) als Tagebuch-App mit Auto- und Manuallogging
2) Backend auf meinem **selbstgehosteten Ubuntu-Server** (Docker Compose). Reverse Proxy richte ich selbst ein.
3) Responsive Web-Dashboard pro User (sehr schön gestaltet) für Tageszusammenfassungen, Übersicht, Karte, Medien, Stats.
4) KI-Funktionen (OpenAI API Key vorhanden, konfigurierbar über `.env`) für Zusammenfassungen, Tagging, Trip-Vorschläge, Reiseführer-Modus.
5) Ein **Deployer-Container**, der innerhalb Docker das Repo überwacht, bei neuen Commits deployt (build + restart + healthcheck).
6) Ein **Repo-Automations-Mechanismus**, der bei jeder abgeschlossenen Änderungseinheit automatisch:
   - CHANGELOG.md aktualisiert (kompakt, aber aussagekräftig)
   - README.md aktualisiert (Setup, Konfiguration, Architekturänderungen)
   - commit + push ausführt
   - Changelog live in App + Web anzeigt

---

## Zwei verbindliche Zusatzregeln (kritisch)
- **Wenn etwas nicht AppStore-konform ist, musst du es ablehnen und eine Alternative implementieren.**
- **Jede neue Permission braucht einen konkreten Nutzen-Satz für Info.plist + einen Text für den Privacy Screen.**

---

## Plattform-Realitäten / Constraints (unbedingt beachten)
- Kein Auslesen beliebiger Nachrichten-Apps (WhatsApp/iMessage/Telegram etc.) möglich.
- Zulässig sind nur Apple-/öffentliche APIs + User Consent:
  - CoreLocation (GPS), Photos (Mediathek), CoreMotion (Aktivität), HealthKit (optional, Opt-in),
  - Calendar (optional), Share Extension (User teilt Inhalte aktiv), App Intents/Shortcuts.
- Hintergrund läuft nur begrenzt: BGTasks korrekt nutzen + Fallbacks implementieren.
- Datenschutz: Datenminimierung, klare Opt-ins, Lösch-/Exportmöglichkeit (mind. geplant, ideal implementiert).

---

## Hosting / Netzwerk / Konfiguration
- Server: Ubuntu selfhosted, Docker installiert.
- Reverse Proxy mache ich selbst. Du stellst nur “plain HTTP” Services bereit.
- Alle Ports, URLs, Secrets, API-Keys müssen ausschließlich via `.env` konfigurierbar sein.
- Kein Hardcoding von Base-URLs, Ports oder Secrets.
- `.env.example` muss enthalten sein.

---

## Kernfunktionen (MVP + produktionsreif)
### iOS App (SwiftUI) – Logging
**Auto-Logging**
- Ausflug Start/Stop + optional Auto-Erkennung (Significant Location / Activity)
- Track Recording (GPS) + MapKit + Stats (Distanz, Dauer, Höhenprofil soweit möglich)
- Foto-Zuordnung: PHAssets im Zeitraum + Umkreis (konfigurierbar)
- Sync: Upload Track + Medien + Metadaten zum Backend (robust: retries, offline queue)

**Manuelles Logging (NEU, verpflichtend)**
- “Moment festhalten” Button:
  - optional Foto aufnehmen/aus Mediathek wählen
  - kurzer Text/Sprachnotiz (Speech-to-Text optional)
  - automatische Metadaten: Ort, Zeit, Wetter, Aktivität (wenn erlaubt)
  - Tags/Mood/Rating
- Manuelle Trackpunkte: “Hier war ich”-Marker, Notizen an Positionen
- Späteres Editieren: Einträge zusammenführen, Zeitfenster anpassen, Medien nachträglich hinzufügen

**Ansichten**
- Timeline + Detailansicht (Karte, Medien, Stats, Tags, Text)
- “Was ist neu?” Screen: Live Changelog aus Backend
- Settings:
  - Opt-in Schalter je Datenquelle (Fotos, Bewegung, HealthKit, Wetter, etc.)
  - Reiseführer-Stil: Aus / Minimal / Gesprächig (siehe unten)
  - KI-Funktionen an/aus + Transparenz-Info

---

## KI-Funktionen (OpenAI API)
OpenAI API ist verfügbar (Key in `.env`). Implementiere KI so, dass:
- Nutzer klar informiert werden, welche Daten zur KI gehen (Privacy Screen)
- Sensitive Daten minimiert/aggregiert werden (z.B. nur Text + grobe Orte, je nach Setting)
- Es gibt “KI deaktivieren” und “nur lokal” Fallbacks, wo sinnvoll

### KI Use-Cases (verpflichtend)
1) **Tageszusammenfassung**
   - Erzeuge pro Tag eine schöne, kurze Story + Highlights + Statistiken
   - Vorschläge für Titel/Tags
   - Optional: “Worauf stolz?” / “Was war besonders?”

2) **Automatisches Tagging & Kategorien**
   - Erkenne Themen (Wandern, Museum, Familie, Essen, Aussichtspunkt …)
   - Vorschläge, nicht automatisch ohne User-Bestätigung (konfigurierbar)

3) **Trip-Vorschläge (Route + Sehenswürdigkeiten)**
   - User gibt Start/Ziel/Interessen/Zeitbudget/Transportmodus ein
   - System erstellt eine Route + Stopps + Begründung + Dauerabschätzung
   - Sehenswürdigkeiten / Points of Interest entlang der Strecke (POIs)
   - Ergebnis speicherbar als “geplanter Trip” und später als Tagebucheintrag nutzbar

4) **KI-Reiseführer “on the go”**
   - Während des Trips: bei Annäherung an einen POI (Geofence/Distance-Trigger) liefert der Reiseführer Infos:
     - Minimal: 1–2 Sätze + “Mehr?” Button
     - Gesprächig: ausführlichere Story, Hintergründe, Fun Facts
     - Aus: keine automatische Ausgabe
   - Ausgabeform:
     - Text in App + optional Text-to-Speech (nur wenn AppStore-konform und Permission sauber)
   - Der Reiseführer nutzt nur erlaubte Datenquellen und muss auch ohne KI (Fallback: POI-Kurztext) funktionieren.

---

## Web-Dashboard (sehr schön, responsive, pro User)
Du baust eine responsive Web-App (Backend-served oder separater Container), die:
- Login (gleiches Auth-System)
- “Heute / Diese Woche / Dieser Monat” Übersicht:
  - Karte mit Tracks/Spots
  - Tageszusammenfassung (KI)
  - Medien-Galerie
  - Statistiken (Strecke, Zeit, Orte, häufige Tags)
- Einträge durchsuchen/filtern (Datum, Tags, Ort)
- “Trip planen” UI:
  - Form (Start/Ziel/Interessen)
  - Vorschläge anzeigen, Route + POIs auf Karte
  - Trip speichern / ans iOS pushen
- Changelog Seite (“Was ist neu?”) – live aus `CHANGELOG.md` via API

Technikvorgabe:
- Frontend: z.B. Next.js oder SvelteKit (Dockerisiert), oder eine schlanke SPA (React/Vue) – aber **produktionsreif**, schöne UI, responsive.
- Keine Abhängigkeit von meinem Reverse Proxy Setup.
- Alles konfigurierbar via `.env`.

---

## Backend (FastAPI) – prod-ready
- Auth: JWT + Refresh, Password hashing
- DB: Postgres, Migrations: Alembic
- Objektstorage: S3-kompatibel (MinIO im Compose für dev; prod möglich)
- Endpoints (Minimum):
  - /api/v1/auth/*
  - /api/v1/entries (CRUD)
  - /api/v1/tracks (upload/download, stats)
  - /api/v1/media (presigned/multipart)
  - /api/v1/meta/changelog (Markdown + parsed JSON)
  - /api/v1/ai/summarize_day
  - /api/v1/ai/suggest_tags
  - /api/v1/trips/suggest (Route + POIs)
  - /api/v1/guide/next (liefert “nächster POI + Text” je nach Modus)
- Observability: strukturierte Logs, /health, optionale metrics
- Sicherheit: rate limiting, input validation, CORS via env, secrets via env/secret files

---

## Live Changelog (kritisch)
- Quelle: `CHANGELOG.md` im Repo wird bei jeder Änderungseinheit aktualisiert.
- Backend:
  - `GET /api/v1/meta/changelog` liefert Markdown + parsed JSON (Versionen, Datum, Highlights)
- iOS + Web:
  - “Was ist neu?” Screen/Seite rendert das.

---

## Repo-Automation: Auto-Commit/Push + Changelog + README Update (kritisch)
Du implementierst Tooling im Repo (z.B. `/tools/auto_commit.*`), das nach jeder abgeschlossenen Änderungseinheit:
1) CHANGELOG.md aktualisiert (Added/Changed/Fixed/Security; semver; Unreleased)
2) README.md aktualisiert, wenn Setup/Env/API/Architektur betroffen ist
3) Tests/Lint ausführt
4) Conventional Commits Commit erzeugt
5) Push ausführt

Credentials:
- Git Credentials als Secret (nicht im Repo), via `.env` oder gemountetem Secret-File.

⚠️ Hinweis:
- “Bei jeder Änderung” bedeutet “bei jeder von dir implementierten Arbeitseinheit”, nicht bei jedem Speichern.

---

## Docker / Compose (Ubuntu selfhosted)
- docker-compose.yml enthält:
  - api
  - db
  - minio (optional)
  - web (Dashboard)
  - deployer (git watcher)
- Healthchecks für alle Services
- Volumes: Persistenz
- Keine Reverse Proxy Konfiguration im Compose

---

## In-Container Git Auto-Deploy (kritisch)
Deployer Container:
- Repo klonen (readonly token)
- Polling: `git fetch` alle N Sekunden
- Bei neuem Commit:
  - `git pull`
  - `docker compose build` (betroffene Services)
  - `docker compose up -d --remove-orphans`
  - Healthcheck abwarten
  - Logging + deployed commit SHA speichern
- Locking gegen parallele Deploys
- Konfigurierbar via `.env`:
  - GIT_REPO_URL, GIT_BRANCH, POLL_INTERVAL, HEALTHCHECK_URL, etc.

---

## AppStore Release / Compliance
- Apple Guidelines beachten (Permissions, Privacy, Background)
- Privacy Policy Platzhalter + Datenübersicht (in App + README)
- Keine nicht-konformen Features: wenn nicht möglich -> Alternative implementieren (z.B. Share Extension statt “Nachrichten auslesen”)
- Jede Permission bekommt:
  - Info.plist Zwecktext
  - Privacy Screen Erklärung

---

## Repo-Struktur (verpflichtend)
- /backend
- /deploy
- /web
- /ios
- /tools
- README.md
- CHANGELOG.md
- .env.example

---

## Deliverables
1) `docker compose up -d` startet Backend + Web auf Ubuntu
2) API + Web erreichbar auf Ports aus `.env`
3) Deployer zieht neue Commits und deployt automatisch (innerhalb Docker)
4) iOS App verbindet sich über konfigurierbare Base URL, Logging + Sync laufen
5) Live Changelog sichtbar in iOS + Web
6) Trip-Vorschläge + KI-Reiseführer Modus funktionieren (mit Fallback ohne KI)

---

## Erste Umsetzungsschritte (du startest sofort)
1) Repo-Struktur + `.env.example` + Compose + API Skeleton + Web Skeleton
2) Auth + Kernmodelle + Medien/Tracks + Changelog Endpoint
3) KI-Endpunkte (Summaries/Tags/Trips/Guide)
4) Deployer Container
5) iOS MVP (Auto + manuell, Sync, Timeline, Changelog, Guide-Modus)
6) Hardening (tests, lint, migrations, docs, privacy texts)
