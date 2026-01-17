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

### WICHTIG: Immer API-Dokumentation lesen!

**Bei jeder Arbeit mit externen APIs (Simli, HeyGen, ElevenLabs, etc.):**

1. **ZUERST** die offizielle API-Dokumentation lesen
2. **NIEMALS** Annahmen über Format, Chunk Size, Datentypen etc. machen
3. **IMMER** nach Code-Beispielen in der Dokumentation suchen
4. **PRÜFEN** welche spezifischen Requirements (PCM16, 16kHz, 6000 bytes, etc.) existieren

**Beispiel: Simli Audio Static Problem**
- Problem: Starkes Rauschen/Crackling im Audio
- Lösung war in `/docs/SIMLI_API.md` dokumentiert:
  - Format: PCM Int16 (nicht μ-law!)
  - Sample Rate: 16,000 Hz
  - Chunk Size: 6,000 bytes (nicht 1024, nicht single buffer!)
  - WAV Header: Muss entfernt werden (erste 44 bytes)
  - Datentyp: Int16Array (nicht Uint8Array!)

**→ Erspart viele Debugging-Runden und falsche Lösungsversuche!**

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
  - `/api/ai/avatar/iv/generate` - Avatar IV Video (Photo → Video mit Voice Clone)
  - `/api/ai/avatar/iv/status/:videoId` - Avatar IV Status
- **Config Key**: `avatar` (fallback: `heygen`)

### LiveAvatar - Real-Time Interactive Avatar
- **Provider**: LiveAvatar (via LiveKit WebRTC)
- **Endpoints**:
  - `/api/ai/liveavatar/session` - Session Token erstellen
  - `/api/ai/liveavatar/start` - Session starten (gibt LiveKit Room Details)
  - `/api/ai/liveavatar/stop` - Session beenden
  - `/api/ai/liveavatar/avatars` - Öffentliche Avatare auflisten
  - `/api/ai/liveavatar/status` - Aktuellen Avatar Status prüfen
  - `/api/ai/liveavatar/upload-video` - Training Video hochladen
  - `/api/ai/liveavatar/create-avatar` - Custom Avatar Training starten
- **Config Key**: `liveavatar`
- **Training**: 2-minütiges Video (15s zuhören, 90s reden, 15s idle) → Training dauert 2-5 Tage

### Simli - Real-Time Avatar mit Voice Clone (EMPFOHLEN für Live Chat)
- **Provider**: Simli (simli-client SDK + WebRTC)
- **Subscription**: **Legacy Tier** - Voller Zugang zu Real-Time Avatar Streaming
- **Verwendung**: Echo Sim → Option 2: Live Conversation
- **Endpoints**:
  - `/api/ai/simli/session` - API Keys und Voice Clone Config holen
  - `/api/ai/simli/start` - WebRTC Session starten (NICHT VERWENDET - simli-client SDK macht das direkt)
  - `/api/ai/simli/faces` - Verfügbare Avatare auflisten
  - `/api/ai/simli/tts` - TTS mit ElevenLabs Voice Clone (PCM16, 16kHz)
  - `/api/ai/simli/status` - Konfigurationsstatus prüfen
  - `/api/ai/simli/create-face` - Custom Face erstellen (POST mit imageData + faceName)
  - `/api/ai/simli/face-status` - Custom Face Status prüfen
- **Config Key**: `simli`
- **Vorteile**:
  - ✅ Unterstützt ElevenLabs Voice Clone für Echtzeit-Streaming!
  - ✅ Niedrige Latenz (~300ms)
  - ✅ Kein eigenes Avatar-Training nötig (nutzt Simli Standard-Avatare)
  - ✅ WebRTC-basiert mit STUN/TURN Fallback
  - ✅ Bis zu 20 Minuten Sessions
  - ✅ Custom Faces via Photo Upload möglich
- **Frontend**:
  - `SimliAvatar.jsx` - Live Conversation Komponente mit simli-client SDK
  - `SimliChatConfig.jsx` - Face & Voice Selection vor Session Start
- **Dokumentation**: `/docs/SIMLI_API.md`

#### Simli Audio Format Requirements (KRITISCH!)
**WICHTIG:** Simli benötigt exakt folgendes Audio-Format, sonst kommt es zu Rauschen/Crackling:

1. **Format**: PCM Int16 (signed 16-bit integers)
2. **Sample Rate**: 16,000 Hz (16kHz)
3. **Channels**: Mono (single channel)
4. **Chunk Size**: 6,000 bytes = 3,000 Int16 samples
5. **WAV Header**: MUSS entfernt werden (erste 44 bytes)!
6. **Datentyp**: Int16Array (NICHT Uint8Array!)

**Backend Implementation** ([server/routes/ai.js:2600-2620](server/routes/ai.js#L2600-L2620)):
```javascript
// ElevenLabs TTS → PCM16 16kHz
const response = await axios.post('https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream',
  { text },
  {
    params: { output_format: 'pcm_16000' }, // PCM 16kHz
    responseType: 'arraybuffer'
  }
);

// WAV Header entfernen (erste 44 bytes)
const audioBuffer = await response.arrayBuffer();
const rawPCM = audioBuffer.byteLength > 44 ? audioBuffer.slice(44) : audioBuffer;

// Als Base64 zum Frontend senden
const base64Audio = Buffer.from(rawPCM).toString('base64');
```

**Frontend Implementation** ([src/components/SimliAvatar.jsx:174-207](src/components/SimliAvatar.jsx#L174-L207)):
```javascript
// Base64 → Uint8Array → Int16Array
const binaryString = atob(ttsResponse.audio);
const uint8Array = new Uint8Array(binaryString.length);
for (let i = 0; i < binaryString.length; i++) {
  uint8Array[i] = binaryString.charCodeAt(i);
}
const int16Array = new Int16Array(uint8Array.buffer);

// Send in 6000-byte chunks (3000 Int16 samples)
const CHUNK_SIZE = 6000;
const samplesPerChunk = CHUNK_SIZE / 2; // 2 bytes per Int16 sample

for (let i = 0; i < int16Array.length; i += samplesPerChunk) {
  const chunk = int16Array.slice(i, Math.min(i + samplesPerChunk, int16Array.length));
  simliClientRef.current.sendAudioData(chunk);
}
```

#### Simli Face Selection Flow

1. **Custom Faces (Priorität 1)**:
   - `persona.simliFaceId` - Face aus Real-Time Chat Face Upload (My Persona → Avatar)
   - `avatarImages[].simliFaceId` - Faces aus Avatar Image Uploads mit Simli ID
   - Werden als "Your custom face" angezeigt

2. **Standard Faces (Fallback)**:
   - Von `/api/ai/simli/faces` geladen
   - Simli's vorgefertigte Avatare
   - Werden als "Standard avatar" angezeigt

3. **Face Upload**:
   - User geht zu My Persona → Avatar
   - Lädt Foto hoch
   - Button "Upload as Simli Face" → Backend ruft Simli API
   - Simli erstellt Face ID (dauert 1-2 Minuten)
   - Face wird als `simliFaceId` in Persona gespeichert

#### Simli Voice Selection Flow

1. **Voice Clone (Priorität 1)**:
   - `persona.elevenlabsVoiceId` - Geklonte Stimme von ElevenLabs
   - Wird als "Your cloned voice" angezeigt mit grünem Badge
   - FUNKTIONIERT mit Simli Echtzeit-Streaming! ✅

2. **Standard Voices (Fallback)**:
   - ElevenLabs Pre-Made Voices:
     - Sarah (Female, Soft) - EXAVITQu4vr4xnSDxMaL
     - Adam (Male, Deep) - pNInz6obpgDQGcFmaJgB
     - Antoni (Male, Well-rounded) - ErXwobaYiN019PkySvjV
     - Arnold (Male, Crisp) - VR6AewLTigWG4xSOukaG

3. **Voice Clone erstellen**:
   - User geht zu My Persona → Voice
   - Nimmt 5 Voice Samples auf (~30 Sekunden je)
   - Button "Create Voice Clone" → ElevenLabs API
   - Voice ID wird als `elevenlabsVoiceId` gespeichert

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

  // LiveAvatar (Real-Time Interactive)
  liveavatarId         String?  // Custom Avatar ID
  liveavatarName       String?
  liveavatarStatus     String?  // pending, training, ready, failed

  // Relationen
  avatarImages      AvatarImage[]   // Hochgeladene Fotos
  voiceSamples      VoiceSample[]   // Aufgenommene Stimmen
  lifeStories       LifeStory[]     // Stories für LLM Kontext
}
```

## Offene Features / TODOs

- [x] ElevenLabs Voice Integration
- [x] HeyGen Avatar Video Generation (Photo Avatar)
- [x] HeyGen Video Playback in Echo Sim
- [x] LiveAvatar Real-Time Streaming (LiveKit WebRTC)
- [x] LiveAvatar Custom Avatar Training (Video Upload)
- [x] Simli Real-Time Avatar mit Voice Clone Support
- [x] Video Archive für generierte Videos
- [ ] Stripe Payment Integration
- [ ] Email Verification
- [ ] Password Reset

## Admin Dashboard - API Konfiguration

API Keys werden in der Datenbank gespeichert via Admin Dashboard → APIs:

### Aktive Services (In Verwendung)
- **AI Brain (LLM)**: Groq API Key (category: `llm`)
  - Provider: Groq (Free) - Llama 3.3 70B
  - Purpose: Text Generation für WisdomGPT, Echo Sim Messages

- **Voice (TTS)**: ElevenLabs API Key (category: `voice`)
  - Provider: ElevenLabs
  - Purpose: Voice Cloning & Text-to-Speech

- **Avatar (Video)**: HeyGen API Key (category: `avatar`)
  - Provider: HeyGen
  - Purpose: Photo Avatars & Video Generation (Option 1)

- **Real-Time Avatar (Simli)**: Simli API Key (category: `simli`) - **EMPFOHLEN für Live Chat!**
  - Provider: Simli (Legacy Subscription)
  - Purpose: Live Conversation in Echo Sim (Option 2)
  - Features: WebRTC Streaming mit ElevenLabs Voice Clone Support

### Legacy Services (Nicht mehr in Verwendung)
- **LiveAvatar**: LiveAvatar API Key (category: `liveavatar`)
  - Status: Ersetzt durch Simli
  - Grund: Simli bietet bessere Voice Clone Integration

**Test Connection Buttons** verifizieren ob jede API funktioniert.

