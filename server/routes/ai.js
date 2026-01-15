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
    const { text, voiceId, useClonedVoice = true } = req.body;

    const config = await req.prisma.apiConfig.findUnique({
      where: { service: 'elevenlabs' }
    });

    if (!config?.isActive || !config?.apiKey) {
      return res.status(503).json({ error: 'ElevenLabs API not configured' });
    }

    // Determine which voice to use
    let selectedVoiceId = voiceId;

    // If no voiceId provided and useClonedVoice is true, try to use user's cloned voice
    if (!voiceId && useClonedVoice) {
      const persona = await req.prisma.persona.findUnique({
        where: { userId: req.user.id },
        select: { elevenlabsVoiceId: true }
      });

      if (persona?.elevenlabsVoiceId) {
        selectedVoiceId = persona.elevenlabsVoiceId;
      }
    }

    // Fall back to default voice if no cloned voice available
    const finalVoiceId = selectedVoiceId || 'pNInz6obpgDQGcFmaJgB';

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${finalVoiceId}`,
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
      format: 'mp3',
      voiceId: finalVoiceId,
      isClonedVoice: finalVoiceId !== 'pNInz6obpgDQGcFmaJgB'
    });
  } catch (error) {
    console.error('ElevenLabs error:', error);
    res.status(500).json({ error: 'Failed to synthesize voice' });
  }
});

// =====================
// TEXT-TO-SPEECH (Simplified endpoint for Wisdom GPT)
// =====================
router.post('/voice/tts', authenticate, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.length > 5000) {
      return res.status(400).json({ error: 'Text is required and must be under 5000 characters' });
    }

    const config = await req.prisma.apiConfig.findUnique({
      where: { service: 'elevenlabs' }
    });

    if (!config?.isActive || !config?.apiKey) {
      return res.status(503).json({ error: 'Voice service not configured' });
    }

    // Get user's cloned voice if available
    const persona = await req.prisma.persona.findUnique({
      where: { userId: req.user.id },
      select: { elevenlabsVoiceId: true }
    });

    // Use cloned voice or default
    const voiceId = persona?.elevenlabsVoiceId || 'pNInz6obpgDQGcFmaJgB';

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
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
      return res.status(response.status).json({ error: error.detail?.message || 'TTS failed' });
    }

    // Stream audio directly back to client
    const audioBuffer = await response.arrayBuffer();
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.byteLength,
    });
    res.send(Buffer.from(audioBuffer));
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ error: 'Failed to generate speech' });
  }
});

// =====================
// ELEVENLABS VOICE CLONING
// =====================

// Create a voice clone from user's voice samples
router.post('/voice/clone', authenticate, requireSubscription('STANDARD'), async (req, res) => {
  try {
    const { name, description } = req.body;

    const config = await req.prisma.apiConfig.findUnique({
      where: { service: 'elevenlabs' }
    });

    if (!config?.isActive || !config?.apiKey) {
      return res.status(503).json({ error: 'ElevenLabs API not configured' });
    }

    // Get user's persona with voice samples
    const persona = await req.prisma.persona.findUnique({
      where: { userId: req.user.id },
      include: { voiceSamples: true }
    });

    if (!persona) {
      return res.status(404).json({ error: 'Persona not found' });
    }

    if (!persona.voiceSamples || persona.voiceSamples.length === 0) {
      return res.status(400).json({ error: 'No voice samples found. Please upload at least one voice sample.' });
    }

    // ElevenLabs requires at least 1 sample, recommends 3+
    if (persona.voiceSamples.length < 1) {
      return res.status(400).json({ error: 'Please upload at least 1 voice sample for cloning.' });
    }

    // If user already has a cloned voice, delete it first
    if (persona.elevenlabsVoiceId) {
      try {
        await fetch(`https://api.elevenlabs.io/v1/voices/${persona.elevenlabsVoiceId}`, {
          method: 'DELETE',
          headers: { 'xi-api-key': config.apiKey }
        });
      } catch (deleteError) {
        console.log('Could not delete old voice clone:', deleteError.message);
      }
    }

    // Prepare form data for ElevenLabs
    const FormData = (await import('form-data')).default;
    const formData = new FormData();

    formData.append('name', name || `${req.user.firstName}'s Voice`);
    formData.append('description', description || `Voice clone for ${req.user.firstName} ${req.user.lastName}`);

    // Convert base64 voice samples to files
    for (let i = 0; i < persona.voiceSamples.length; i++) {
      const sample = persona.voiceSamples[i];
      // Remove data URL prefix if present
      const base64Data = sample.audioData.replace(/^data:audio\/\w+;base64,/, '');
      const audioBuffer = Buffer.from(base64Data, 'base64');

      formData.append('files', audioBuffer, {
        filename: `sample_${i + 1}.mp3`,
        contentType: 'audio/mpeg'
      });
    }

    // Create voice clone at ElevenLabs
    const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: {
        'xi-api-key': config.apiKey,
        ...formData.getHeaders()
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('ElevenLabs clone error:', error);
      return res.status(response.status).json({
        error: error.detail?.message || error.detail || 'Voice cloning failed'
      });
    }

    const data = await response.json();

    // Save the voice ID to persona
    await req.prisma.persona.update({
      where: { id: persona.id },
      data: {
        elevenlabsVoiceId: data.voice_id,
        elevenlabsVoiceName: name || `${req.user.firstName}'s Voice`
      }
    });

    res.json({
      success: true,
      voiceId: data.voice_id,
      voiceName: name || `${req.user.firstName}'s Voice`,
      message: 'Voice clone created successfully!'
    });
  } catch (error) {
    console.error('Voice clone error:', error);
    res.status(500).json({ error: 'Failed to create voice clone' });
  }
});

// Get user's cloned voice status
router.get('/voice/clone/status', authenticate, async (req, res) => {
  try {
    const persona = await req.prisma.persona.findUnique({
      where: { userId: req.user.id },
      select: {
        elevenlabsVoiceId: true,
        elevenlabsVoiceName: true,
        voiceSamples: {
          select: { id: true, label: true, duration: true, createdAt: true }
        }
      }
    });

    if (!persona) {
      return res.json({
        hasClonedVoice: false,
        samplesCount: 0,
        samples: []
      });
    }

    res.json({
      hasClonedVoice: !!persona.elevenlabsVoiceId,
      voiceId: persona.elevenlabsVoiceId,
      voiceName: persona.elevenlabsVoiceName,
      samplesCount: persona.voiceSamples?.length || 0,
      samples: persona.voiceSamples || []
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get voice clone status' });
  }
});

// Delete user's cloned voice
router.delete('/voice/clone', authenticate, async (req, res) => {
  try {
    const config = await req.prisma.apiConfig.findUnique({
      where: { service: 'elevenlabs' }
    });

    const persona = await req.prisma.persona.findUnique({
      where: { userId: req.user.id }
    });

    if (!persona?.elevenlabsVoiceId) {
      return res.status(404).json({ error: 'No cloned voice found' });
    }

    // Delete from ElevenLabs
    if (config?.apiKey) {
      try {
        await fetch(`https://api.elevenlabs.io/v1/voices/${persona.elevenlabsVoiceId}`, {
          method: 'DELETE',
          headers: { 'xi-api-key': config.apiKey }
        });
      } catch (deleteError) {
        console.log('Could not delete from ElevenLabs:', deleteError.message);
      }
    }

    // Clear from persona
    await req.prisma.persona.update({
      where: { id: persona.id },
      data: {
        elevenlabsVoiceId: null,
        elevenlabsVoiceName: null
      }
    });

    res.json({ success: true, message: 'Voice clone deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete voice clone' });
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
