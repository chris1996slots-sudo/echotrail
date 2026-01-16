# EchoTrail - Projekt-Dokumentation für Claude

## Projekt-Übersicht

**EchoTrail** ist eine Digital Legacy Platform, die es Nutzern ermöglicht, ihre Persönlichkeit, Geschichten und Weisheit für zukünftige Generationen zu bewahren. Die App erstellt einen "digitalen Zwilling" der mit Nachkommen interagieren kann.

---

## HERZSTÜCK: Talking Avatar mit Lip-Sync

Das zentrale Feature von EchoTrail ist der **sprechende Avatar mit Lippensynchronisation** und der eigenen geklonten Stimme des Users.

### Der Complete Flow:

1. **User lädt Foto hoch** (My Persona → Avatar Tab)
   - Foto wird als `AvatarImage` in DB gespeichert
   - User wählt dieses als aktiven Avatar
   - **Button: "Create Talking Avatar (Lip Sync)"** → Sendet an HeyGen API
   - HeyGen erstellt Photo Avatar mit `heygenAvatarId`

2. **User nimmt Stimme auf** (My Persona → Voice Tab)
   - 5 Voice Samples (~30 Sekunden je)
   - Gespeichert als `VoiceSample` in DB
   - **Button: "Create Voice Clone"** → Sendet an ElevenLabs API
   - ElevenLabs erstellt Voice Clone mit `elevenlabsVoiceId`

3. **User wählt Background** (My Persona → Background Tab)
   - Beach, Office, Nature, etc.
   - Gespeichert als `backgroundType` in Persona

4. **User wählt Style** (My Persona → Style Tab)
   - Realistic, Cartoon, Pixar, Anime, etc.
   - Gespeichert als `avatarStyle` in Persona

5. **User wählt Vibe** (Echo Vibe Selection)
   - Compassionate, Wise, Playful, Adventurous, etc.
   - Beeinflusst wie das LLM antwortet
   - Gespeichert als `echoVibe` in Persona

### Echo Sim - Der sprechende Avatar

Wenn User zu **Echo Sim** geht:

1. **Event auswählen** (Christmas, Birthday, Graduation, etc.)
2. **AI generiert Text**:
   - Groq LLM erstellt personalisierte Nachricht
   - Verwendet User's Persönlichkeit, Life Stories, und Vibe
   - Max 3-5 Sätze für TTS
3. **Voice Synthesis**:
   - Text → ElevenLabs TTS
   - Verwendet geklonte Stimme (`elevenlabsVoiceId`)
   - Audio wird abgespielt
4. **Avatar Video** (Premium Feature):
   - Text + Avatar → HeyGen API
   - HeyGen generiert Video mit Lip-Sync
   - Verwendet `heygenAvatarId` für User's Photo Avatar

---

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

## AI API Integration

### LLM - Text Generation
- **Provider**: Groq (Primary), Claude (Fallback)
- **Endpoint**: `/api/ai/generate`
- **Config Key**: `llm` (fallback: `claude`)
- **Purpose**: Generiert personalisierte Nachrichten basierend auf Persona

### Voice - ElevenLabs
- **Provider**: ElevenLabs
- **Endpoints**:
  - `/api/ai/voice/clone` - Voice Clone erstellen
  - `/api/ai/voice/tts` - Text-to-Speech mit geklonter Stimme
  - `/api/ai/voice/clone/status` - Status prüfen
- **Config Key**: `voice` (fallback: `elevenlabs`)

### Avatar - HeyGen
- **Provider**: HeyGen
- **Endpoints**:
  - `/api/ai/avatar/create-photo-avatar` - Photo Avatar erstellen
  - `/api/ai/avatar/generate` - Video mit Lip-Sync generieren
  - `/api/ai/avatar/status/:videoId` - Video Status prüfen
  - `/api/ai/avatar/photo-status` - Photo Avatar Status
- **Config Key**: `avatar` (fallback: `heygen`)

## Persona Schema (Wichtige Felder)

```prisma
model Persona {
  // Persönlichkeit
  humor, empathy, tradition, adventure, wisdom, creativity, patience, optimism
  echoVibe          String   // compassionate, wise, playful, etc.

  // Avatar Einstellungen
  avatarStyle       String   // realistic, cartoon, pixar, etc.
  backgroundType    String   // office, beach, nature, etc.

  // Voice Clone (ElevenLabs)
  elevenlabsVoiceId    String?  // Geklonte Voice ID
  elevenlabsVoiceName  String?

  // Photo Avatar (HeyGen)
  heygenAvatarId       String?  // Photo Avatar Group ID
  heygenAvatarName     String?

  // Relationen
  avatarImages      AvatarImage[]   // Hochgeladene Fotos
  voiceSamples      VoiceSample[]   // Aufgenommene Stimmen
  lifeStories       LifeStory[]     // Stories für LLM Kontext
}
```

## Offene Features / TODOs

- [x] ElevenLabs Voice Integration
- [x] HeyGen Avatar Video Generation (Photo Avatar)
- [ ] HeyGen Video Playback in Echo Sim
- [ ] Stripe Payment Integration
- [ ] Email Verification
- [ ] Password Reset

## Admin Dashboard - API Konfiguration

API Keys werden in der Datenbank gespeichert via Admin Dashboard → APIs:
- **AI Brain**: Groq API Key (category: `llm`)
- **Voice**: ElevenLabs API Key (category: `voice`)
- **Avatar**: HeyGen API Key (category: `avatar`)

"Test Connection" Buttons verifizieren ob jede API funktioniert.

