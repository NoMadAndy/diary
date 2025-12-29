# SmartDiary

**SmartDiary** ist ein KI-gestütztes Tagebuch-, Reise- und Lebenslog-System  
mit iOS App, Web-Dashboard und selbstgehostetem Backend.

Es kombiniert automatische Datenerfassung, manuelle Einträge und künstliche Intelligenz,
um Erlebnisse verständlich zu strukturieren, zusammenzufassen und in Geschichten zu verwandeln.

---

## 🧭 Projektübersicht

| Komponente | Beschreibung |
|-----------|-------------|
iOS App | SwiftUI App für automatisches & manuelles Logging |
Backend | FastAPI Service, Docker-basiert |
Web Dashboard | Responsive Web-App für Auswertungen & Planung |
KI Engine | OpenAI-gestützte Analysen, Zusammenfassungen, Reiseführer |
Deployment | Self-hosted auf Ubuntu mit automatischem Git-Deploy |

---

## 📚 Zentrale Dokumentation

Alle verbindlichen Projektregeln befinden sich im Ordner **`/docs`**:

| Datei | Inhalt |
|------|-------|
`VISION.md` | Produktvision & Zielbild |
`REQUIREMENTS.md` | Fachliche Anforderungen |
`ARCHITECTURE.md` | Technische Architektur |
`AI_AGENT_INSTRUCTIONS.md` | **Vertrag für Entwickler & KI-Agenten** |
`COMPLIANCE.md` | AppStore & DSGVO Richtlinien |
`DEPLOYMENT.md` | Hosting & Betrieb |
`ROADMAP.md` | Feature-Planung |

> **Jeder Entwickler oder KI-Agent muss vor Beginn `docs/AI_AGENT_INSTRUCTIONS.md` lesen.**

---

## 🚀 Quick Start (Development)

```bash
cp .env.example .env
docker compose up -d
