import express from 'express';
import { authenticate, requireSubscription } from '../middleware/auth.js';

const router = express.Router();

// =====================
// LLM API - Text Generation (Claude/Groq)
// =====================
router.post('/generate', authenticate, requireSubscription('STANDARD'), async (req, res) => {
  try {
    const { prompt, context } = req.body;

    // Try 'llm' category first (new format), fall back to 'claude' (legacy)
    let config = await req.prisma.apiConfig.findUnique({
      where: { service: 'llm' }
    });
    if (!config?.apiKey) {
      config = await req.prisma.apiConfig.findUnique({
        where: { service: 'claude' }
      });
    }

    if (!config?.isActive || !config?.apiKey) {
      return res.status(503).json({ error: 'LLM API not configured. Please add API key in Admin Dashboard → APIs → AI Brain.' });
    }

    const persona = await req.prisma.persona.findUnique({
      where: { userId: req.user.id },
      include: { lifeStories: true }
    });

    // Determine provider from settings (default to claude)
    const provider = config.settings?.provider || 'claude';
    let responseText = '';

    if (provider === 'groq') {
      // Groq API (OpenAI-compatible)
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 350,
          messages: [
            { role: 'system', content: buildEchoPrompt(persona, req.user, context) },
            { role: 'user', content: prompt + '\n\nIMPORTANT: Keep your response concise - about 3-5 sentences maximum. Be warm and personal but brief.' }
          ]
        })
      });

      const data = await response.json();
      if (data.choices && data.choices[0]?.message?.content) {
        responseText = data.choices[0].message.content;
      } else {
        console.error('Groq response:', data);
        return res.status(500).json({ error: 'Invalid response from Groq' });
      }
    } else {
      // Claude API (default)
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 350,
          system: buildEchoPrompt(persona, req.user, context),
          messages: [{ role: 'user', content: prompt + '\n\nIMPORTANT: Keep your response concise - about 3-5 sentences maximum. Be warm and personal but brief.' }]
        })
      });

      const data = await response.json();
      if (data.content && data.content[0]) {
        responseText = data.content[0].text;
      } else {
        console.error('Claude response:', data);
        return res.status(500).json({ error: 'Invalid response from Claude' });
      }
    }

    res.json({ response: responseText });
  } catch (error) {
    console.error('LLM generation error:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

// =====================
// ELEVENLABS API - Voice Synthesis
// =====================
router.post('/voice/synthesize', authenticate, requireSubscription('PREMIUM'), async (req, res) => {
  try {
    const { text, voiceId, useClonedVoice = true } = req.body;

    // Try 'voice' category first (new format), fall back to 'elevenlabs' (legacy)
    let config = await req.prisma.apiConfig.findUnique({
      where: { service: 'voice' }
    });
    if (!config?.apiKey) {
      config = await req.prisma.apiConfig.findUnique({
        where: { service: 'elevenlabs' }
      });
    }

    if (!config?.isActive || !config?.apiKey) {
      return res.status(503).json({ error: 'ElevenLabs API not configured. Please add API key in Admin Dashboard → APIs → Voice.' });
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

    // Try 'voice' category first (new format), fall back to 'elevenlabs' (legacy)
    let config = await req.prisma.apiConfig.findUnique({
      where: { service: 'voice' }
    });
    if (!config?.apiKey) {
      config = await req.prisma.apiConfig.findUnique({
        where: { service: 'elevenlabs' }
      });
    }

    if (!config?.isActive || !config?.apiKey) {
      return res.status(503).json({ error: 'Voice service not configured. Please add API key in Admin Dashboard → APIs → Voice.' });
    }

    // Get user's cloned voice if available
    const persona = await req.prisma.persona.findUnique({
      where: { userId: req.user.id },
      select: { elevenlabsVoiceId: true }
    });

    // Use cloned voice or default (Adam voice)
    const voiceId = persona?.elevenlabsVoiceId || 'pNInz6obpgDQGcFmaJgB';
    console.log(`TTS using voice: ${voiceId} (cloned: ${!!persona?.elevenlabsVoiceId})`);

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

    // Try 'voice' category first (new format), fall back to 'elevenlabs' (legacy)
    let config = await req.prisma.apiConfig.findUnique({
      where: { service: 'voice' }
    });
    if (!config?.apiKey) {
      config = await req.prisma.apiConfig.findUnique({
        where: { service: 'elevenlabs' }
      });
    }

    if (!config?.isActive || !config?.apiKey) {
      return res.status(503).json({ error: 'ElevenLabs API not configured. Please add API key in Admin Dashboard → APIs → Voice.' });
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

      // Detect the audio format from the data URL
      const formatMatch = sample.audioData.match(/^data:audio\/(\w+);base64,/);
      const audioFormat = formatMatch ? formatMatch[1] : 'webm';

      // Map format to content type and extension
      const formatMap = {
        'webm': { contentType: 'audio/webm', extension: 'webm' },
        'mp3': { contentType: 'audio/mpeg', extension: 'mp3' },
        'mpeg': { contentType: 'audio/mpeg', extension: 'mp3' },
        'wav': { contentType: 'audio/wav', extension: 'wav' },
        'ogg': { contentType: 'audio/ogg', extension: 'ogg' },
        'mp4': { contentType: 'audio/mp4', extension: 'm4a' }
      };

      const format = formatMap[audioFormat] || { contentType: 'audio/webm', extension: 'webm' };

      // Remove data URL prefix if present
      const base64Data = sample.audioData.replace(/^data:audio\/\w+;base64,/, '');
      const audioBuffer = Buffer.from(base64Data, 'base64');

      console.log(`Voice sample ${i + 1}: format=${audioFormat}, size=${audioBuffer.length} bytes`);

      formData.append('files', audioBuffer, {
        filename: `sample_${i + 1}.${format.extension}`,
        contentType: format.contentType
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
      const responseText = await response.text();
      let errorData = null;
      let errorMessage = 'Voice cloning failed';

      try {
        errorData = JSON.parse(responseText);
        console.error('ElevenLabs clone error:', errorData);
        errorMessage = errorData.detail?.message || errorData.detail || errorData.message || responseText;
      } catch (parseError) {
        console.error('ElevenLabs clone error (text):', responseText);
        errorMessage = responseText || `HTTP ${response.status}`;
      }

      // Return full debug info to frontend
      return res.status(response.status).json({
        error: errorMessage,
        debug: {
          status: response.status,
          statusText: response.statusText,
          apiResponse: errorData || responseText,
          samplesCount: persona.voiceSamples.length,
          sampleFormats: persona.voiceSamples.map((s, i) => {
            const match = s.audioData.match(/^data:audio\/(\w+);base64,/);
            return { sample: i + 1, format: match ? match[1] : 'unknown' };
          })
        }
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
    res.status(500).json({ error: error.message || 'Failed to create voice clone' });
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
    // Try 'voice' category first (new format), fall back to 'elevenlabs' (legacy)
    let config = await req.prisma.apiConfig.findUnique({
      where: { service: 'voice' }
    });
    if (!config?.apiKey) {
      config = await req.prisma.apiConfig.findUnique({
        where: { service: 'elevenlabs' }
      });
    }

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
    // Try 'voice' category first (new format), fall back to 'elevenlabs' (legacy)
    let config = await req.prisma.apiConfig.findUnique({
      where: { service: 'voice' }
    });
    if (!config?.apiKey) {
      config = await req.prisma.apiConfig.findUnique({
        where: { service: 'elevenlabs' }
      });
    }

    if (!config?.isActive || !config?.apiKey) {
      return res.status(503).json({ error: 'ElevenLabs API not configured. Please add API key in Admin Dashboard → APIs → Voice.' });
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
// HEYGEN API - Photo Avatar Creation
// =====================

// Upload image to HeyGen and create a Photo Avatar
router.post('/avatar/create-photo-avatar', authenticate, requireSubscription('STANDARD'), async (req, res) => {
  try {
    const { imageData, name } = req.body;

    // Try 'avatar' category first (new format), fall back to 'heygen' (legacy)
    let config = await req.prisma.apiConfig.findUnique({
      where: { service: 'avatar' }
    });
    if (!config?.apiKey) {
      config = await req.prisma.apiConfig.findUnique({
        where: { service: 'heygen' }
      });
    }

    if (!config?.isActive || !config?.apiKey) {
      return res.status(503).json({ error: 'HeyGen API not configured. Please add API key in Admin Dashboard → APIs → Avatar.' });
    }

    // Step 1: Upload the image to HeyGen
    // Convert base64 to buffer and determine content type
    const base64Match = imageData.match(/^data:image\/(\w+);base64,/);
    const imageFormat = base64Match ? base64Match[1] : 'jpeg';
    const contentType = imageFormat === 'png' ? 'image/png' : 'image/jpeg';

    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // HeyGen Upload Asset API requires raw binary data (not multipart form)
    // Endpoint: https://upload.heygen.com/v1/asset
    console.log('Uploading image to HeyGen (raw binary)...');
    const uploadResponse = await fetch('https://upload.heygen.com/v1/asset', {
      method: 'POST',
      headers: {
        'X-API-KEY': config.apiKey,
        'Content-Type': contentType
      },
      body: imageBuffer
    });

    if (!uploadResponse.ok) {
      const responseText = await uploadResponse.text();
      let errorData = null;
      let errorMessage = 'Failed to upload image to HeyGen';

      try {
        errorData = JSON.parse(responseText);
        console.error('HeyGen upload error:', errorData);
        errorMessage = errorData.message || errorData.error?.message || responseText;
      } catch (parseError) {
        console.error('HeyGen upload error (text):', responseText);
        errorMessage = responseText || `HTTP ${uploadResponse.status}`;
      }

      // Return full debug info to frontend
      return res.status(uploadResponse.status).json({
        error: errorMessage,
        debug: {
          step: 'upload',
          status: uploadResponse.status,
          statusText: uploadResponse.statusText,
          apiResponse: errorData || responseText,
          imageFormat,
          contentType,
          imageSizeBytes: imageBuffer.length
        }
      });
    }

    const uploadData = await uploadResponse.json();
    // HeyGen returns image_key for photo avatars
    const imageKey = uploadData.data?.image_key || uploadData.data?.id;
    console.log('Image uploaded successfully:', { imageKey, fullResponse: uploadData });

    // Step 2: Create Photo Avatar Group
    const persona = await req.prisma.persona.findUnique({
      where: { userId: req.user.id }
    });

    const avatarName = name || `${req.user.firstName}'s Avatar`;

    const createResponse = await fetch('https://api.heygen.com/v2/photo_avatar/avatar_group/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
      },
      body: JSON.stringify({
        name: avatarName,
        image_key: imageKey
      })
    });

    if (!createResponse.ok) {
      const responseText = await createResponse.text();
      let errorData = null;
      let errorMessage = 'Failed to create photo avatar';

      try {
        errorData = JSON.parse(responseText);
        console.error('HeyGen create avatar error:', errorData);
        errorMessage = errorData.message || errorData.error?.message || responseText;
      } catch (parseError) {
        console.error('HeyGen create avatar error (text):', responseText);
        errorMessage = responseText || `HTTP ${createResponse.status}`;
      }

      // Return full debug info to frontend
      return res.status(createResponse.status).json({
        error: errorMessage,
        debug: {
          step: 'create_avatar_group',
          status: createResponse.status,
          statusText: createResponse.statusText,
          apiResponse: errorData || responseText,
          imageKey,
          avatarName,
          uploadResponse: uploadData
        }
      });
    }

    const avatarData = await createResponse.json();
    console.log('Photo avatar created:', avatarData);

    const groupId = avatarData.data?.group_id || avatarData.data?.avatar_group_id;

    // Save the HeyGen avatar ID to persona
    await req.prisma.persona.update({
      where: { id: persona.id },
      data: {
        heygenAvatarId: groupId,
        heygenAvatarName: avatarName
      }
    });

    res.json({
      success: true,
      avatarId: groupId,
      avatarName,
      message: 'Photo avatar created successfully! It may take a few minutes to be ready for video generation.'
    });
  } catch (error) {
    console.error('Photo avatar creation error:', error);
    res.status(500).json({ error: error.message || 'Failed to create photo avatar' });
  }
});

// Check if user has a HeyGen photo avatar
router.get('/avatar/photo-status', authenticate, async (req, res) => {
  try {
    const persona = await req.prisma.persona.findUnique({
      where: { userId: req.user.id },
      select: {
        heygenAvatarId: true,
        heygenAvatarName: true
      }
    });

    res.json({
      hasPhotoAvatar: !!persona?.heygenAvatarId,
      avatarId: persona?.heygenAvatarId,
      avatarName: persona?.heygenAvatarName
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get photo avatar status' });
  }
});

// =====================
// HEYGEN API - Avatar Video
// =====================
router.post('/avatar/generate', authenticate, requireSubscription('PREMIUM'), async (req, res) => {
  try {
    const { text } = req.body;

    // Try 'avatar' category first (new format), fall back to 'heygen' (legacy)
    let config = await req.prisma.apiConfig.findUnique({
      where: { service: 'avatar' }
    });
    if (!config?.apiKey) {
      config = await req.prisma.apiConfig.findUnique({
        where: { service: 'heygen' }
      });
    }

    if (!config?.isActive || !config?.apiKey) {
      return res.status(503).json({ error: 'HeyGen API not configured. Please add API key in Admin Dashboard → APIs → Avatar.' });
    }

    // Get user's persona to find their photo avatar and voice clone
    const persona = await req.prisma.persona.findUnique({
      where: { userId: req.user.id },
      select: {
        heygenAvatarId: true,
        elevenlabsVoiceId: true
      }
    });

    if (!persona?.heygenAvatarId) {
      return res.status(400).json({
        error: 'No photo avatar found. Please create a photo avatar first on the Persona page.'
      });
    }

    // Build video request - use photo avatar type for user's custom avatar
    const videoInput = {
      character: {
        type: 'talking_photo',
        talking_photo_id: persona.heygenAvatarId,
      },
      voice: persona.elevenlabsVoiceId ? {
        // Use user's cloned ElevenLabs voice
        type: 'audio',
        audio_url: null, // We'll need to generate audio first
      } : {
        // Fallback to HeyGen's built-in voice
        type: 'text',
        input_text: text,
        voice_id: 'en-US-JennyNeural',
      }
    };

    // If user has cloned voice, we need to use text input with their voice
    // HeyGen can use ElevenLabs voices directly if configured
    if (persona.elevenlabsVoiceId) {
      videoInput.voice = {
        type: 'text',
        input_text: text,
        voice_id: persona.elevenlabsVoiceId, // ElevenLabs voice ID
      };
    }

    // Start video generation
    const response = await fetch('https://api.heygen.com/v2/video/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
      },
      body: JSON.stringify({
        video_inputs: [videoInput],
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

    // Try 'avatar' category first (new format), fall back to 'heygen' (legacy)
    let config = await req.prisma.apiConfig.findUnique({
      where: { service: 'avatar' }
    });
    if (!config?.apiKey) {
      config = await req.prisma.apiConfig.findUnique({
        where: { service: 'heygen' }
      });
    }

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
    // Try 'avatar' category first (new format), fall back to 'heygen' (legacy)
    let config = await req.prisma.apiConfig.findUnique({
      where: { service: 'avatar' }
    });
    if (!config?.apiKey) {
      config = await req.prisma.apiConfig.findUnique({
        where: { service: 'heygen' }
      });
    }

    if (!config?.isActive || !config?.apiKey) {
      return res.status(503).json({ error: 'HeyGen API not configured. Please add API key in Admin Dashboard → APIs → Avatar.' });
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
