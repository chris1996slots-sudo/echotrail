# EchoTrail - Projekt-Dokumentation für Claude

## Projekt-Übersicht

**EchoTrail** ist eine Digital Legacy Platform, die es Nutzern ermöglicht, ihre Persönlichkeit, Geschichten und Weisheit für zukünftige Generationen zu bewahren. Die App erstellt einen "digitalen Zwilling" der mit Nachkommen interagieren kann.

## Deployment & Umgebung

### WICHTIG: Wir arbeiten auf Render.com - NICHT localhost!

- **Frontend + Backend**: https://echotrail-qt41.onrender.com
- **GitHub Repo**: https://github.com/chris1996slots-sudo/echotrail.git
- **Auto-Deploy**: Push zu `main` Branch triggert automatisches Deployment auf Render
- **Deployment-Zeit**: Ca. 2-5 Minuten nach Push

### Niemals:
- Localhost-URLs im Code verwenden (außer für DEV_MODE check)
- Manuell Server starten - alles läuft auf Render
- Annehmen dass lokale Änderungen sofort live sind

### Immer:
- Nach Code-Änderungen: `git add . && git commit && git push`
- Warten auf Render Deployment bevor Testing
- API_URL ist leer in Production (same-origin requests)

## Tech Stack

### Frontend
- **React 18** mit Vite
- **Framer Motion** für Animationen
- **Tailwind CSS** für Styling
- **Lucide React** für Icons

### Backend
- **Express.js** Server
- **Prisma ORM** mit PostgreSQL
- **JWT** für Authentication
- **bcryptjs** für Password Hashing

### Datenbank
- **PostgreSQL** auf Render
- Schema in `/prisma/schema.prisma`

### LLM Integration (WisdomGPT)
- Multi-Provider Support: Groq, OpenAI, Claude, Gemini
- Konfiguration über Admin Dashboard (ApiConfig Tabelle)
- Fallback zu Mock-Responses wenn kein Provider aktiv

## Projekt-Struktur

```
/src
  /components      - Wiederverwendbare UI-Komponenten
  /pages           - Hauptseiten der App
  /context         - React Context (AppContext)
  /hooks           - Custom Hooks (useLocalStorage)
  /services        - API Service (api.js)

/server
  /routes          - Express API Routes
  /middleware      - Auth Middleware
  index.js         - Server Entry Point

/prisma
  schema.prisma    - Datenbank Schema
```

## Wichtige Dateien

| Datei | Beschreibung |
|-------|--------------|
| `src/App.jsx` | Haupt-App mit Page Routing |
| `src/context/AppContext.jsx` | Globaler State Provider |
| `src/hooks/useLocalStorage.js` | State Management + DB Sync |
| `src/services/api.js` | API Client für Backend |
| `src/components/Navigation.jsx` | Hauptnavigation |
| `server/routes/auth.js` | Login/Register API |
| `server/routes/wisdom.js` | WisdomGPT Chat mit LLM |

## Bekannte Patterns & Fixes

### React State Update Conflicts
Bei State-Updates die Navigation/Rendering auslösen, immer `setTimeout` verwenden:

```javascript
// RICHTIG
setTimeout(() => {
  setCurrentPage('persona');
  onNavigate('landing');
}, 0);

// FALSCH - kann React Error #300/#310 verursachen
setCurrentPage('persona');
onNavigate('landing');
```

### API URL Konfiguration
```javascript
// In src/services/api.js
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');
```
- Production: Leerer String (same-origin)
- Development: localhost:3001

## User Rollen

- **USER**: Normaler Nutzer - sieht Persona, Echo Sim, Memories, Wisdom GPT, Time Capsule, Settings
- **ADMIN**: Administrator - sieht nur Admin Dashboard, Support Chats

## Seiten-Übersicht

| Seite | Route | Auth | Beschreibung |
|-------|-------|------|--------------|
| Landing | `landing` | Nein | Homepage für Gäste |
| Login | `login` | Nein | Anmeldung |
| Onboarding | `onboarding` | Nein | Registrierung |
| Persona | `persona` | User | Profil & Stories erstellen |
| Echo Sim | `echo-sim` | User | Avatar testen |
| Memories | `memory-anchor` | User | Fotos & Erinnerungen |
| Wisdom GPT | `wisdom-gpt` | User | Chat mit digitalem Zwilling |
| Time Capsule | `time-capsule` | User | Zeitkapseln erstellen |
| Settings | `settings` | User | Einstellungen |
| Admin | `admin` | Admin | Dashboard & Support |

## Sprache

- **Code & Kommentare**: Englisch
- **UI Text**: Englisch (war vorher Deutsch, wurde übersetzt)
- **Kommunikation mit User**: Deutsch bevorzugt

## Git Workflow

```bash
# Nach Änderungen
git add -A
git commit -m "Beschreibung der Änderung"
git push origin main

# Dann warten auf Render Deployment (2-5 min)
```

## Debugging

### API testen (von extern)
```bash
curl https://echotrail-qt41.onrender.com/api/auth/me
# Sollte 401 zurückgeben wenn nicht eingeloggt
```

### Logs checken
- Render Dashboard → Service → Logs

## Offene Features / TODOs

- [ ] ElevenLabs Voice Integration
- [ ] HeyGen Avatar Video Generation
- [ ] Stripe Payment Integration
- [ ] Email Verification
- [ ] Password Reset

## Admin Credentials

Für Tests - im Admin Dashboard API Keys konfigurieren für LLM Provider.
