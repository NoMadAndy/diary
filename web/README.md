# SmartDiary Web Dashboard

Responsive web dashboard for the SmartDiary application built with Next.js.

## PWA

Die Web-App ist als PWA installierbar ("Zum Home-Bildschirm" / "Installieren").
Offline-Unterstützung ist bewusst schlank (Cache von Kernseiten/Assets).

## Sensoren & Gerätefunktionen

Unter `/sensors` gibt es eine Capability-Seite, die nur Features anzeigt, die der aktuelle Browser wirklich unterstützt.
Wichtig:
- Viele APIs funktionieren nur in einem **Secure Context** (HTTPS oder `localhost`).
- Auf iOS/WebKit müssen Motion/Orientation-Zugriffe explizit per Tap bestätigt werden.
- Es werden keine Permissions automatisch beim Laden der Seite angefragt (Opt-in per Button).

## Development

```bash
npm install
npm run dev
```

## Production

```bash
npm run build
npm start
```
