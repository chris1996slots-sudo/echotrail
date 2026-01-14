import express from 'express';
import { authenticate, requireSubscription } from '../middleware/auth.js';

const router = express.Router();

// =====================
// CLAUDE API - Text Generation
// =====================
router.post('/generate', authenticate, requireSubscription('STANDARD'), async (req, res) => {
  try {
    const { prompt, context } = req.body;

    const config = await req.prisma.apiConfig.findUnique({
      where: { service: 'claude' }
    });

    if (!config?.isActive || !config?.apiKey) {
      return res.status(503).json({ error: 'Claude API not configured' });
    }

    const persona = await req.prisma.persona.findUnique({
      where: { userId: req.user.id },
      include: { lifeStories: true }
    });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        system: buildEchoPrompt(persona, req.user, context),
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();

    if (data.content && data.content[0]) {
      res.json({ response: data.content[0].text });
    } else {
      res.status(500).json({ error: 'Invalid response from Claude' });
    }
  } catch (error) {
    console.error('Claude generation error:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

// =====================
// ELEVENLABS API - Voice Synthesis
// =====================
router.post('/voice/synthesize', authenticate, requireSubscription('PREMIUM'), async (req, res) => {
  try {
    const { text, voiceId } = req.body;

    const config = await req.prisma.apiConfig.findUnique({
      where: { service: 'elevenlabs' }
    });

    if (!config?.isActive || !config?.apiKey) {
      return res.status(503).json({ error: 'ElevenLabs API not configured' });
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId || 'pNInz6obpgDQGcFmaJgB'}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': config.apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({ error: error.detail?.message || 'Voice synthesis failed' });
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    res.json({
      audio: `data:audio/mpeg;base64,${base64Audio}`,
      format: 'mp3'
    });
  } catch (error) {
    console.error('ElevenLabs error:', error);
    res.status(500).json({ error: 'Failed to synthesize voice' });
  }
});

// Get available voices
router.get('/voice/list', authenticate, async (req, res) => {
  try {
    const config = await req.prisma.apiConfig.findUnique({
      where: { service: 'elevenlabs' }
    });

    if (!config?.isActive || !config?.apiKey) {
      return res.status(503).json({ error: 'ElevenLabs API not configured' });
    }

    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': config.apiKey }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch voices' });
    }

    const data = await response.json();
    res.json(data.voices);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch voices' });
  }
});

// =====================
// HEYGEN API - Avatar Video
// =====================
router.post('/avatar/generate', authenticate, requireSubscription('PREMIUM'), async (req, res) => {
  try {
    const { text, avatarId } = req.body;

    const config = await req.prisma.apiConfig.findUnique({
      where: { service: 'heygen' }
    });

    if (!config?.isActive || !config?.apiKey) {
      return res.status(503).json({ error: 'HeyGen API not configured' });
    }

    // Start video generation
    const response = await fetch('https://api.heygen.com/v2/video/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
      },
      body: JSON.stringify({
        video_inputs: [{
          character: {
            type: 'avatar',
            avatar_id: avatarId || 'default',
            avatar_style: 'normal',
          },
          voice: {
            type: 'text',
            input_text: text,
            voice_id: 'en-US-JennyNeural',
          }
        }],
        dimension: {
          width: 1280,
          height: 720
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({ error: error.message || 'Avatar generation failed' });
    }

    const data = await response.json();
    res.json({
      videoId: data.data?.video_id,
      status: 'processing',
      message: 'Video is being generated. Use /avatar/status to check progress.'
    });
  } catch (error) {
    console.error('HeyGen error:', error);
    res.status(500).json({ error: 'Failed to generate avatar video' });
  }
});

// Check video status
router.get('/avatar/status/:videoId', authenticate, async (req, res) => {
  try {
    const { videoId } = req.params;

    const config = await req.prisma.apiConfig.findUnique({
      where: { service: 'heygen' }
    });

    if (!config?.apiKey) {
      return res.status(503).json({ error: 'HeyGen API not configured' });
    }

    const response = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
      headers: { 'x-api-key': config.apiKey }
    });

    const data = await response.json();
    res.json(data.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check video status' });
  }
});

// Get available avatars
router.get('/avatar/list', authenticate, async (req, res) => {
  try {
    const config = await req.prisma.apiConfig.findUnique({
      where: { service: 'heygen' }
    });

    if (!config?.isActive || !config?.apiKey) {
      return res.status(503).json({ error: 'HeyGen API not configured' });
    }

    const response = await fetch('https://api.heygen.com/v1/avatar.list', {
      headers: { 'x-api-key': config.apiKey }
    });

    const data = await response.json();
    res.json(data.data?.avatars || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch avatars' });
  }
});

// =====================
// Helper Functions
// =====================
function buildEchoPrompt(persona, user, context) {
  const vibeDescriptions = {
    compassionate: 'warm, nurturing, and deeply caring',
    strict: 'firm, principled, and focused on growth',
    storyteller: 'narrative-driven and wise',
    wise: 'thoughtful and philosophical',
    playful: 'light-hearted and fun',
    adventurous: 'bold and encouraging',
  };

  const stories = persona?.lifeStories?.map(s => s.content).join('\n\n') || '';

  return `You are the digital echo of ${user.firstName} ${user.lastName}. You embody their personality, values, and wisdom.

PERSONALITY TRAITS (scale 0-100):
- Humor: ${persona?.humor || 50}/100
- Empathy: ${persona?.empathy || 50}/100
- Tradition: ${persona?.tradition || 50}/100
- Adventure: ${persona?.adventure || 50}/100

COMMUNICATION STYLE: ${vibeDescriptions[persona?.echoVibe || 'compassionate']}

${context ? `CONTEXT: ${context}` : ''}

LIFE STORIES:
${stories || 'No specific stories recorded.'}

Respond as ${user.firstName} would, drawing from their personality and stories. Be authentic, warm, and helpful.`;
}

export default router;
