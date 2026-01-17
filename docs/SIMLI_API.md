# Simli API Documentation

> **Legacy Subscription** - EchoTrail nutzt Simli mit Legacy-Tarif für Real-Time Avatar Features

## Overview

Simli bietet **"The API devs use to add faces to realtime AI agents"** - ermöglicht lip-sync AI Avatar Interaktionen für Real-Time Konversationen.

**Verwendung in EchoTrail:**
- **Echo Sim - Option 2: Live Conversation** (WebRTC-basiertes Real-Time Streaming)
- Unterstützt **ElevenLabs Voice Clone** für personalisierte Stimmen
- Niedrige Latenz (~300ms)
- Keine eigenes Avatar-Training erforderlich (nutzt Simli Standard-Avatare)

---

## Integration Paths

Simli bietet drei Implementierungswege:

1. **LiveKit Integration** - Empfohlen für Echtzeit-Kommunikation
2. **Pipecat Framework** - Open-Source Python Framework für Voice & Multimodal AI Bots
3. **Simli SDKs** - Direkte Kontrolle via JavaScript und Python Libraries

**EchoTrail nutzt:** Simli JavaScript SDK mit WebRTC

---

## Core Capabilities

### Audio Input Requirements
- **Format:** PCM Int16
- **Sample Rate:** 16,000 Hz
- **Channels:** Mono (single channel)
- **Chunk Size:** 6,000 bytes (bevorzugt, flexibel 1-65,536 bytes)

### Avatar Features
- **Avatar Creation:** Custom Avatars oder pre-made Default Faces
- **Lip-Sync Technology:** Speech-to-Video Synchronisation
- **Face Management:** `/generateFaceID` Endpoint für Avatar-Erstellung
- **Session Handling:** WebRTC Sessions und Streaming

---

## API Endpoints

### 1. Start Audio-to-Video Session
**POST** `/startAudioToVideoSession`

Initiiert Session und gibt Session Token zurück.

**Request:**
```json
{
  "faceId": "string",      // Avatar Identifier
  "apiKey": "string",      // Simli API Key
  "syncAudio": boolean     // Optional: Audio Sync aktivieren
}
```

**Response:**
```json
{
  "sessionToken": "string",
  "sessionId": "string"
}
```

---

### 2. Get ICE Servers
**POST** `/getIceServers`

Ruft TURN Servers für NAT Traversal ab (wenn direkte Verbindung fehlschlägt).

**Request:**
```json
{
  "apiKey": "string"
}
```

**Response:**
```json
{
  "iceServers": [
    {
      "urls": ["turn:server.example.com:3478"],
      "username": "string",
      "credential": "string"
    }
  ]
}
```

---

### 3. WebRTC Session
**WebSocket:** `wss://api.simli.ai/startWebRTCSession`

Verwaltet SDP Offer/Answer Exchange und empfängt "START"/"STOP" Protocol Messages.

**Messages:**
- `START` - Session beginnt
- `STOP` - Session endet

---

### 4. Generate Face ID
**POST** `/generateFaceID`

Erstellt einen Custom Avatar aus Bildern oder Videos.

**Request:**
```json
{
  "apiKey": "string",
  "imageUrl": "string" // oder videoUrl
}
```

**Response:**
```json
{
  "faceId": "string",
  "status": "processing" // oder "ready"
}
```

---

## WebRTC Connection Workflow

### Implementation Files

1. **HTML Interface** - Video/Audio Elements für Playback und Connection State Monitoring
2. **JavaScript Client** - Peer Connection Management, ICE Candidate Gathering, Audio Stream Transmission via WebSocket
3. **Python Server** (optional) - Dekodiert komprimierte Audio (z.B. MP3) zu PCM Int16 mit FFmpeg

### Connection Flow

```
1. Client initiiert Peer Connection mit STUN Server Config
   ↓
2. Offer/Answer Exchange via WebSocket (wss://api.simli.ai/startWebRTCSession)
   ↓
3. Session Token von /startAudioToVideoSession Endpoint
   ↓
4. Audio Stream via WebSocket zu Simli Servers
   ↓
5. Video und Audio Tracks empfangen und im Browser rendern
```

---

## Authentication

**API Key** in Metadata Payload senden an `/startAudioToVideoSession`.
Returned Session Token validiert nachfolgende Kommunikation.

---

## State Monitoring

### RTCPeerConnection States

- **ICE Gathering State:**
  - `new` → `checking` → `completed`

- **ICE Connection State:**
  - `new` → `connected` → `completed`

- **Signaling State:**
  - `stable` → `have-local-offer` → `stable`

---

## Code Example Structure

### RTCPeerConnection Initialization
```javascript
const pc = new RTCPeerConnection({
  sdpSemantics: 'unified-plan',
  iceServers: [...] // von /getIceServers
});

// ICE Candidate Collection mit 250ms Polling
setInterval(() => {
  if (pc.iceGatheringState === 'complete') {
    // Send offer to server
  }
}, 250);

// Data Channel für Protocol Messages
const dataChannel = pc.createDataChannel('simli-protocol');
dataChannel.onmessage = (event) => {
  if (event.data === 'START') {
    // Session started
  }
};

// Remote Description nach Answer
pc.setRemoteDescription(answer);
```

---

## Available SDKs

- **JavaScript SDK** mit Authentication Support
- **Python SDK**
- **WebRTC Client** Implementation

---

## EchoTrail Implementation

### Frontend Component
- **File:** `src/components/SimliAvatar.jsx`
- **SDK:** `simli-client` (npm package)
- **Features:**
  - WebRTC Connection Management
  - Audio Streaming via ElevenLabs TTS
  - Real-Time Lip-Sync Video
  - Session State Management

### Backend API Routes
- **File:** `server/routes/ai.js`
- **Endpoints:**
  - `/api/ai/simli/session` - Get API Keys und Voice Clone Config
  - `/api/ai/simli/start` - Start WebRTC Session
  - `/api/ai/simli/faces` - List Available Avatars
  - `/api/ai/simli/tts` - TTS with ElevenLabs Voice Clone (PCM16, 16kHz)
  - `/api/ai/simli/status` - Check Configuration Status

### Admin Dashboard
- **File:** `src/pages/AdminDashboard.jsx`
- **Config:** Simli API Key Management (category: `simli`)
- **Provider:** Tier `premium`, Description: "Powers Option 2: Live Conversation with ElevenLabs voice clone"

---

## Subscription Details

**EchoTrail Subscription:**
- **Tier:** Legacy
- **Features:** Full access zu Real-Time Avatar Streaming
- **Session Limits:** Bis zu 20 Minuten pro Session

---

## Use Cases

- **Mock Interviews** - KI-gestützte Interview-Praxis
- **Sales Assistants** - Virtuelle Verkaufsberater
- **Language Learning** - Interaktive Sprachlern-Bots
- **Digital Legacy** (EchoTrail) - Real-Time Konversation mit digitalen Echos

---

## Resources

- **Documentation:** https://docs.simli.com/
- **Dashboard:** https://app.simli.com/
- **Discord Community:** Technical Support & Project Sharing
- **Video Tutorials:** Use Cases und Implementation Guides

---

## Vorteile für EchoTrail

✅ **Unterstützt ElevenLabs Voice Clone** für Echtzeit-Streaming
✅ **Niedrige Latenz** (~300ms)
✅ **Kein eigenes Avatar-Training** nötig (nutzt Simli Standard-Avatare)
✅ **WebRTC-basiert** - Stabile Verbindungen mit Fallback auf TURN Servers
✅ **Legacy Subscription** - Bewährter Zugang zu Premium Features

---

## Troubleshooting

### Connection Issues
- Prüfe ICE Servers Config
- Verifiziere TURN Server Fallback
- Check Firewall/NAT Settings

### Audio Issues
- Ensure PCM Int16 Format @ 16kHz
- Verify Chunk Size (6,000 bytes optimal)
- Check Audio Stream Continuity

### Video Issues
- Monitor WebRTC Connection State
- Verify Session Token Validity
- Check Data Channel Messages (START/STOP)

---

## Notes

- **Real-Time Performance:** Optimiert für niedrige Latenz und flüssige Lip-Sync
- **Compatibility:** Funktioniert in allen modernen Browsern mit WebRTC Support
- **Scalability:** Session Management für Multiple Concurrent Users

---

**Last Updated:** 2026-01-17
**Version:** 1.0.0
**Maintained by:** EchoTrail Development Team
