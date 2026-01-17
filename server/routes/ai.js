import express from 'express';
import { authenticate, requireSubscription } from '../middleware/auth.js';
import { spawn } from 'child_process';
import { writeFile, readFile, unlink, mkdtemp, mkdir } from 'fs/promises';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Helper function to convert audio from webm to mp3 using ffmpeg
async function convertAudioToMp3(inputBuffer, inputFormat = 'webm') {
  // Create temp directory
  const tempDir = await mkdtemp(join(tmpdir(), 'echotrail-audio-'));
  const inputPath = join(tempDir, `input.${inputFormat}`);
  const outputPath = join(tempDir, 'output.mp3');

  try {
    // Write input buffer to temp file
    await writeFile(inputPath, inputBuffer);

    // Convert using ffmpeg
    await new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i', inputPath,
        '-vn',                    // No video
        '-acodec', 'libmp3lame',  // MP3 codec
        '-ab', '128k',            // 128kbps bitrate
        '-ar', '44100',           // 44.1kHz sample rate
        '-y',                     // Overwrite output
        outputPath
      ]);

      let stderr = '';
      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg exited with code ${code}: ${stderr}`));
        }
      });

      ffmpeg.on('error', (err) => {
        reject(new Error(`FFmpeg spawn error: ${err.message}`));
      });
    });

    // Read the converted file
    const outputBuffer = await readFile(outputPath);
    return outputBuffer;
  } finally {
    // Cleanup temp files
    try {
      await unlink(inputPath).catch(() => {});
      await unlink(outputPath).catch(() => {});
      // Note: temp directory cleanup is optional, OS will handle it
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

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

    // Use turbo model for cloned voices (better quality and language detection)
    // Use multilingual for default voice
    const modelId = persona?.elevenlabsVoiceId
      ? 'eleven_turbo_v2_5'  // Better for cloned voices
      : 'eleven_multilingual_v2';  // Default for pre-made voices

    console.log(`TTS model: ${modelId}`);

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
          model_id: modelId,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.85,  // Increased for better voice matching
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('TTS error:', error);
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
    // ElevenLabs supports: mp3, wav, m4a - webm needs conversion
    for (let i = 0; i < persona.voiceSamples.length; i++) {
      const sample = persona.voiceSamples[i];

      // Detect the audio format from the data URL
      const formatMatch = sample.audioData.match(/^data:audio\/(\w+);base64,/);
      const audioFormat = formatMatch ? formatMatch[1] : 'webm';

      // Remove data URL prefix if present
      const base64Data = sample.audioData.replace(/^data:audio\/\w+;base64,/, '');
      let audioBuffer = Buffer.from(base64Data, 'base64');

      console.log(`Voice sample ${i + 1}: original format=${audioFormat}, size=${audioBuffer.length} bytes`);

      // Convert webm/ogg to mp3 (ElevenLabs doesn't support webm well)
      let finalFormat = audioFormat;
      let contentType = 'audio/mpeg';
      let extension = 'mp3';

      if (audioFormat === 'webm' || audioFormat === 'ogg') {
        try {
          console.log(`Converting sample ${i + 1} from ${audioFormat} to mp3...`);
          audioBuffer = await convertAudioToMp3(audioBuffer, audioFormat);
          finalFormat = 'mp3';
          console.log(`Sample ${i + 1} converted successfully, new size=${audioBuffer.length} bytes`);
        } catch (conversionError) {
          console.error(`Failed to convert sample ${i + 1}:`, conversionError.message);
          // Return error with conversion details
          return res.status(500).json({
            error: `Failed to convert audio sample ${i + 1} to MP3 format`,
            debug: {
              originalFormat: audioFormat,
              conversionError: conversionError.message,
              hint: 'Make sure ffmpeg is installed on the server'
            }
          });
        }
      } else if (audioFormat === 'wav') {
        contentType = 'audio/wav';
        extension = 'wav';
      } else if (audioFormat === 'mp4' || audioFormat === 'm4a') {
        contentType = 'audio/mp4';
        extension = 'm4a';
      }

      formData.append('files', audioBuffer, {
        filename: `sample_${i + 1}.${extension}`,
        contentType: contentType
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
    console.log('Photo avatar group created:', avatarData);

    const groupId = avatarData.data?.group_id || avatarData.data?.avatar_group_id;

    // Step 3: Get the talking_photo_id from the group
    // The avatar group contains multiple "looks", we need the talking_photo_id for video generation
    console.log('Fetching talking_photo_id from avatar group:', groupId);

    let talkingPhotoId = null;

    // Wait a moment for the avatar to be processed
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Try to get the avatar details from the group
    const listResponse = await fetch(`https://api.heygen.com/v2/photo_avatar/${groupId}`, {
      method: 'GET',
      headers: {
        'x-api-key': config.apiKey,
      }
    });

    if (listResponse.ok) {
      const listData = await listResponse.json();
      console.log('Avatar group details:', JSON.stringify(listData, null, 2));

      // The response should contain looks with talking_photo_id
      const looks = listData.data?.looks || listData.data?.avatar_looks || [];
      if (looks.length > 0) {
        // Use the first look's talking_photo_id
        talkingPhotoId = looks[0].talking_photo_id || looks[0].id;
        console.log('Found talking_photo_id:', talkingPhotoId);
      }
    } else {
      const listError = await listResponse.text();
      console.log('Could not fetch avatar group details:', listError);
    }

    // If we couldn't get talking_photo_id directly, try the list all avatars endpoint
    // HeyGen returns talking_photos separately from avatar groups
    if (!talkingPhotoId) {
      const allAvatarsResponse = await fetch('https://api.heygen.com/v2/avatars', {
        method: 'GET',
        headers: {
          'x-api-key': config.apiKey,
        }
      });

      if (allAvatarsResponse.ok) {
        const allData = await allAvatarsResponse.json();
        console.log('All avatars response:', JSON.stringify(allData, null, 2));

        // talking_photos is a separate array in the response
        const talkingPhotos = allData.data?.talking_photos || [];
        console.log('Found talking_photos:', talkingPhotos.length);

        // Find our talking photo by name (since we just created it)
        const ourPhoto = talkingPhotos.find(tp =>
          tp.talking_photo_name === avatarName ||
          tp.talking_photo_name?.includes(req.user.firstName)
        );

        if (ourPhoto) {
          talkingPhotoId = ourPhoto.talking_photo_id;
          console.log('Found talking_photo_id from list:', talkingPhotoId);
        } else if (talkingPhotos.length > 0) {
          // Use the most recent one (last in array) as fallback
          talkingPhotoId = talkingPhotos[talkingPhotos.length - 1].talking_photo_id;
          console.log('Using most recent talking_photo_id:', talkingPhotoId);
        }
      }
    }

    // Store either the talking_photo_id (preferred) or fall back to group_id
    const avatarIdToStore = talkingPhotoId || groupId;
    console.log('Storing avatar ID:', avatarIdToStore, '(is talking_photo_id:', !!talkingPhotoId, ')');

    // Save the HeyGen avatar ID to persona
    await req.prisma.persona.update({
      where: { id: persona.id },
      data: {
        heygenAvatarId: avatarIdToStore,
        heygenAvatarName: avatarName
      }
    });

    res.json({
      success: true,
      avatarId: avatarIdToStore,
      groupId: groupId,
      talkingPhotoId: talkingPhotoId,
      avatarName,
      message: talkingPhotoId
        ? 'Photo avatar created successfully and ready for video generation!'
        : 'Photo avatar group created! The avatar is being processed. Please wait a few minutes and try generating a video.'
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
        heygenAvatarName: true,
        elevenlabsVoiceId: true,
        elevenlabsVoiceName: true
      }
    });

    console.log('Photo status for user', req.user.id, ':', {
      heygenAvatarId: persona?.heygenAvatarId,
      heygenAvatarName: persona?.heygenAvatarName,
      elevenlabsVoiceId: persona?.elevenlabsVoiceId
    });

    res.json({
      hasPhotoAvatar: !!persona?.heygenAvatarId,
      avatarId: persona?.heygenAvatarId,
      avatarName: persona?.heygenAvatarName,
      hasVoiceClone: !!persona?.elevenlabsVoiceId,
      debug: {
        userId: req.user.id,
        personaFound: !!persona
      }
    });
  } catch (error) {
    console.error('Photo status error:', error);
    res.status(500).json({ error: 'Failed to get photo avatar status' });
  }
});

// Refresh/update the talking_photo_id for an existing avatar group
router.post('/avatar/refresh-talking-photo', authenticate, async (req, res) => {
  try {
    // Get API config
    let config = await req.prisma.apiConfig.findUnique({
      where: { service: 'avatar' }
    });
    if (!config?.apiKey) {
      config = await req.prisma.apiConfig.findUnique({
        where: { service: 'heygen' }
      });
    }

    if (!config?.isActive || !config?.apiKey) {
      return res.status(503).json({ error: 'HeyGen API not configured' });
    }

    const persona = await req.prisma.persona.findUnique({
      where: { userId: req.user.id },
      select: {
        id: true,
        heygenAvatarId: true,
        heygenAvatarName: true
      }
    });

    if (!persona?.heygenAvatarId) {
      return res.status(404).json({ error: 'No photo avatar found' });
    }

    // Try to get all avatars including talking_photos
    // HeyGen returns talking_photos as a separate array in /v2/avatars response
    const allAvatarsResponse = await fetch('https://api.heygen.com/v2/avatars', {
      method: 'GET',
      headers: {
        'x-api-key': config.apiKey,
      }
    });

    if (!allAvatarsResponse.ok) {
      const errorText = await allAvatarsResponse.text();
      return res.status(allAvatarsResponse.status).json({
        error: 'Failed to fetch avatars from HeyGen',
        debug: errorText
      });
    }

    const allData = await allAvatarsResponse.json();
    console.log('All avatars for refresh:', JSON.stringify(allData, null, 2));

    // talking_photos is a separate array in the response
    const talkingPhotos = allData.data?.talking_photos || [];
    let talkingPhotoId = null;

    // Check if current heygenAvatarId is already a valid talking_photo_id
    const existingPhoto = talkingPhotos.find(tp => tp.talking_photo_id === persona.heygenAvatarId);
    if (existingPhoto) {
      // Already have correct talking_photo_id
      return res.json({
        success: true,
        updated: false,
        avatarId: persona.heygenAvatarId,
        message: 'Avatar ID is already a valid talking_photo_id'
      });
    }

    // Search for a matching talking photo by name
    const matchingPhoto = talkingPhotos.find(tp =>
      tp.talking_photo_name === persona.heygenAvatarName ||
      tp.talking_photo_name?.toLowerCase().includes(persona.heygenAvatarName?.toLowerCase() || '')
    );

    if (matchingPhoto) {
      talkingPhotoId = matchingPhoto.talking_photo_id;
    } else if (talkingPhotos.length > 0) {
      // If no name match, offer the most recent talking photo
      talkingPhotoId = talkingPhotos[talkingPhotos.length - 1].talking_photo_id;
    }

    if (talkingPhotoId && talkingPhotoId !== persona.heygenAvatarId) {
      // Update the persona with the correct talking_photo_id
      await req.prisma.persona.update({
        where: { id: persona.id },
        data: {
          heygenAvatarId: talkingPhotoId
        }
      });

      res.json({
        success: true,
        updated: true,
        oldAvatarId: persona.heygenAvatarId,
        newAvatarId: talkingPhotoId,
        message: 'Updated to use correct talking_photo_id'
      });
    } else if (talkingPhotoId) {
      res.json({
        success: true,
        updated: false,
        avatarId: talkingPhotoId,
        message: 'Avatar ID is already correct'
      });
    } else {
      res.json({
        success: false,
        availableTalkingPhotos: talkingPhotos.map(tp => ({
          talkingPhotoId: tp.talking_photo_id,
          name: tp.talking_photo_name,
          previewUrl: tp.preview_image_url
        })),
        currentAvatarId: persona.heygenAvatarId,
        currentAvatarName: persona.heygenAvatarName,
        message: talkingPhotos.length === 0
          ? 'No talking photos found in your HeyGen account. Please create a talking photo first.'
          : 'Could not match your avatar. Available talking photos are listed below.'
      });
    }
  } catch (error) {
    console.error('Refresh talking photo error:', error);
    res.status(500).json({ error: error.message || 'Failed to refresh avatar' });
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

    console.log('Generating video with avatar:', persona.heygenAvatarId);
    console.log('Text length:', text?.length);

    // First, verify the talking_photo_id exists
    const avatarsResponse = await fetch('https://api.heygen.com/v2/avatars', {
      method: 'GET',
      headers: { 'x-api-key': config.apiKey }
    });

    if (avatarsResponse.ok) {
      const avatarsData = await avatarsResponse.json();
      const talkingPhotos = avatarsData.data?.talking_photos || [];
      console.log('Available talking photos:', talkingPhotos.map(tp => ({ id: tp.talking_photo_id, name: tp.talking_photo_name })));

      const matchingPhoto = talkingPhotos.find(tp => tp.talking_photo_id === persona.heygenAvatarId);
      if (!matchingPhoto) {
        console.log('WARNING: talking_photo_id not found in HeyGen account!');
        console.log('Stored ID:', persona.heygenAvatarId);
        console.log('Available IDs:', talkingPhotos.map(tp => tp.talking_photo_id));

        // If we have any talking photos, use the first one as fallback
        if (talkingPhotos.length > 0) {
          const fallbackId = talkingPhotos[0].talking_photo_id;
          console.log('Using fallback talking_photo_id:', fallbackId);
          // Update persona with correct ID
          await req.prisma.persona.update({
            where: { userId: req.user.id },
            data: { heygenAvatarId: fallbackId }
          });
          persona.heygenAvatarId = fallbackId;
        } else {
          return res.status(400).json({
            error: 'No talking photos found in your HeyGen account. Please create one first.',
            debug: { storedId: persona.heygenAvatarId, availableIds: [] }
          });
        }
      }
    }

    // Get available voices from HeyGen
    let voiceId = null;
    const voicesResponse = await fetch('https://api.heygen.com/v2/voices', {
      method: 'GET',
      headers: { 'x-api-key': config.apiKey }
    });

    if (voicesResponse.ok) {
      const voicesData = await voicesResponse.json();
      const voices = voicesData.data?.voices || [];
      console.log('Available voices count:', voices.length);

      // Try to find an English male voice, or fall back to any voice
      const englishMaleVoice = voices.find(v =>
        v.language?.toLowerCase().includes('english') &&
        v.gender?.toLowerCase() === 'male'
      );
      const anyEnglishVoice = voices.find(v => v.language?.toLowerCase().includes('english'));
      const anyVoice = voices[0];

      const selectedVoice = englishMaleVoice || anyEnglishVoice || anyVoice;
      if (selectedVoice) {
        voiceId = selectedVoice.voice_id;
        console.log('Selected voice:', { id: voiceId, name: selectedVoice.name, language: selectedVoice.language });
      }
    }

    if (!voiceId) {
      // Fallback to a known HeyGen voice ID
      voiceId = '1bd001e7e50f421d891986aad5158bc8'; // Common HeyGen voice
      console.log('Using fallback voice ID:', voiceId);
    }

    // Build video request for talking photo
    const videoInput = {
      character: {
        type: 'talking_photo',
        talking_photo_id: persona.heygenAvatarId
      },
      voice: {
        type: 'text',
        input_text: text,
        voice_id: voiceId,
        speed: 1.0
      }
    };

    // Start video generation
    const requestBody = {
      video_inputs: [videoInput],
      dimension: {
        width: 1280,
        height: 720
      }
    };

    console.log('HeyGen request:', JSON.stringify(requestBody, null, 2));

    const response = await fetch('https://api.heygen.com/v2/video/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
      },
      body: JSON.stringify(requestBody)
    });

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error('HeyGen response not JSON:', responseText);
      return res.status(response.status).json({ error: 'Invalid response from HeyGen' });
    }

    if (!response.ok) {
      console.error('HeyGen generate error:', responseData);
      return res.status(response.status).json({
        error: responseData.message || responseData.error?.message || 'Avatar generation failed',
        debug: responseData
      });
    }

    console.log('HeyGen generate success:', responseData);
    res.json({
      videoId: responseData.data?.video_id,
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
// HEYGEN STREAMING AVATAR API
// =====================

// Get streaming session token for HeyGen Interactive Avatar
router.post('/avatar/streaming/token', authenticate, requireSubscription('PREMIUM'), async (req, res) => {
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

    // Create streaming session token from HeyGen
    const response = await fetch('https://api.heygen.com/v1/streaming.create_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText };
      }
      console.error('HeyGen streaming token error:', errorData);
      return res.status(response.status).json({
        error: errorData.message || 'Failed to create streaming token',
        debug: errorData
      });
    }

    const data = await response.json();
    console.log('HeyGen streaming token created:', { hasToken: !!data.data?.token });

    res.json({
      token: data.data?.token,
      message: 'Streaming session token created successfully'
    });
  } catch (error) {
    console.error('Streaming token error:', error);
    res.status(500).json({ error: 'Failed to create streaming session token' });
  }
});

// Get streaming avatar configuration for user
router.get('/avatar/streaming/config', authenticate, async (req, res) => {
  try {
    // Get user's persona with avatar and voice info
    const persona = await req.prisma.persona.findUnique({
      where: { userId: req.user.id },
      select: {
        heygenAvatarId: true,
        heygenAvatarName: true,
        elevenlabsVoiceId: true,
        elevenlabsVoiceName: true
      }
    });

    // Get ElevenLabs API key for voice integration
    let voiceConfig = await req.prisma.apiConfig.findUnique({
      where: { service: 'voice' }
    });
    if (!voiceConfig?.apiKey) {
      voiceConfig = await req.prisma.apiConfig.findUnique({
        where: { service: 'elevenlabs' }
      });
    }

    if (!persona?.heygenAvatarId) {
      return res.status(400).json({
        error: 'No photo avatar found. Please create a photo avatar first on the Persona page.',
        hasAvatar: false
      });
    }

    // Return config for streaming SDK
    res.json({
      hasAvatar: true,
      avatarId: persona.heygenAvatarId,
      avatarName: persona.heygenAvatarName,
      hasVoiceClone: !!persona.elevenlabsVoiceId,
      voiceClone: persona.elevenlabsVoiceId ? {
        voiceId: persona.elevenlabsVoiceId,
        voiceName: persona.elevenlabsVoiceName,
        // Include ElevenLabs API key for SDK voice integration
        apiKey: voiceConfig?.apiKey || null
      } : null
    });
  } catch (error) {
    console.error('Streaming config error:', error);
    res.status(500).json({ error: 'Failed to get streaming configuration' });
  }
});

// =====================
// HEYGEN AVATAR IV API - Photorealistic Video from Photo
// =====================

// Generate Avatar IV video from user's photo with their cloned voice
router.post('/avatar/iv/generate', authenticate, requireSubscription('PREMIUM'), async (req, res) => {
  try {
    const { text, videoTitle } = req.body;

    if (!text || text.length > 1500) {
      return res.status(400).json({ error: 'Text is required and must be under 1500 characters' });
    }

    // Get HeyGen config
    let avatarConfig = await req.prisma.apiConfig.findUnique({
      where: { service: 'avatar' }
    });
    if (!avatarConfig?.apiKey) {
      avatarConfig = await req.prisma.apiConfig.findUnique({
        where: { service: 'heygen' }
      });
    }

    if (!avatarConfig?.isActive || !avatarConfig?.apiKey) {
      return res.status(503).json({ error: 'HeyGen API not configured. Please add API key in Admin Dashboard → APIs → Avatar.' });
    }

    // Get ElevenLabs config for voice clone audio
    let voiceConfig = await req.prisma.apiConfig.findUnique({
      where: { service: 'voice' }
    });
    if (!voiceConfig?.apiKey) {
      voiceConfig = await req.prisma.apiConfig.findUnique({
        where: { service: 'elevenlabs' }
      });
    }

    // Get user's persona with avatar image and voice clone
    const persona = await req.prisma.persona.findUnique({
      where: { userId: req.user.id },
      include: {
        avatarImages: {
          where: { isActive: true },
          take: 1
        }
      }
    });

    if (!persona) {
      return res.status(404).json({ error: 'Persona not found. Please create your persona first.' });
    }

    // Get the active avatar image
    const activeAvatar = persona.avatarImages[0];
    if (!activeAvatar?.imageData) {
      return res.status(400).json({
        error: 'No avatar photo found. Please upload a photo in My Persona → Avatar tab.'
      });
    }

    console.log('Avatar IV: Generating video for user', req.user.id);
    console.log('Avatar IV: Has voice clone:', !!persona.elevenlabsVoiceId);

    // Step 1: Upload the image to HeyGen for Avatar IV
    const base64Match = activeAvatar.imageData.match(/^data:image\/(\w+);base64,/);
    const imageFormat = base64Match ? base64Match[1] : 'jpeg';
    const contentType = imageFormat === 'png' ? 'image/png' : 'image/jpeg';
    const base64Data = activeAvatar.imageData.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    console.log('Avatar IV: Uploading image to HeyGen...');
    const uploadResponse = await fetch('https://upload.heygen.com/v1/asset', {
      method: 'POST',
      headers: {
        'X-API-KEY': avatarConfig.apiKey,
        'Content-Type': contentType
      },
      body: imageBuffer
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Avatar IV upload error:', errorText);
      return res.status(uploadResponse.status).json({
        error: 'Failed to upload image to HeyGen',
        debug: { status: uploadResponse.status, response: errorText }
      });
    }

    const uploadData = await uploadResponse.json();
    const imageKey = uploadData.data?.image_key;
    console.log('Avatar IV: Image uploaded, key:', imageKey);

    if (!imageKey) {
      return res.status(500).json({
        error: 'Failed to get image key from HeyGen',
        debug: uploadData
      });
    }

    // Step 2: Generate audio with ElevenLabs voice clone (if available)
    let audioAssetId = null;

    if (persona.elevenlabsVoiceId && voiceConfig?.apiKey) {
      console.log('Avatar IV: Generating audio with voice clone...');

      // Generate TTS audio
      const ttsResponse = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${persona.elevenlabsVoiceId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': voiceConfig.apiKey,
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_turbo_v2_5',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.85,
            }
          })
        }
      );

      if (ttsResponse.ok) {
        const audioBuffer = await ttsResponse.arrayBuffer();
        console.log('Avatar IV: Audio generated, size:', audioBuffer.byteLength);

        // Upload audio to HeyGen
        console.log('Avatar IV: Uploading audio to HeyGen...');
        const audioUploadResponse = await fetch('https://upload.heygen.com/v1/asset', {
          method: 'POST',
          headers: {
            'X-API-KEY': avatarConfig.apiKey,
            'Content-Type': 'audio/mpeg'
          },
          body: Buffer.from(audioBuffer)
        });

        if (audioUploadResponse.ok) {
          const audioUploadData = await audioUploadResponse.json();
          audioAssetId = audioUploadData.data?.id || audioUploadData.data?.audio_asset_id;
          console.log('Avatar IV: Audio uploaded, asset ID:', audioAssetId);
        } else {
          const audioError = await audioUploadResponse.text();
          console.log('Avatar IV: Audio upload failed, will use HeyGen TTS:', audioError);
        }
      } else {
        const ttsError = await ttsResponse.text();
        console.log('Avatar IV: Voice clone TTS failed, will use HeyGen TTS:', ttsError);
      }
    }

    // Step 3: Create Avatar IV video
    console.log('Avatar IV: Generating video...');

    const av4Request = {
      image_key: imageKey,
      video_title: videoTitle || `EchoTrail - ${new Date().toLocaleString()}`
    };

    // Use audio asset if we have voice clone audio, otherwise use HeyGen TTS
    if (audioAssetId) {
      av4Request.audio_asset_id = audioAssetId;
    } else {
      // Get a suitable HeyGen voice
      const voicesResponse = await fetch('https://api.heygen.com/v2/voices', {
        method: 'GET',
        headers: { 'x-api-key': avatarConfig.apiKey }
      });

      let voiceId = '1bd001e7e50f421d891986aad5158bc8'; // Fallback voice
      if (voicesResponse.ok) {
        const voicesData = await voicesResponse.json();
        const voices = voicesData.data?.voices || [];
        const englishVoice = voices.find(v => v.language?.toLowerCase().includes('english'));
        if (englishVoice) {
          voiceId = englishVoice.voice_id;
        }
      }

      av4Request.script = text;
      av4Request.voice_id = voiceId;
    }

    console.log('Avatar IV request:', JSON.stringify(av4Request, null, 2));

    const av4Response = await fetch('https://api.heygen.com/v2/video/av4/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': avatarConfig.apiKey,
      },
      body: JSON.stringify(av4Request)
    });

    const av4ResponseText = await av4Response.text();
    let av4Data;
    try {
      av4Data = JSON.parse(av4ResponseText);
    } catch (e) {
      console.error('Avatar IV response not JSON:', av4ResponseText);
      return res.status(av4Response.status).json({
        error: 'Invalid response from HeyGen Avatar IV API',
        debug: av4ResponseText
      });
    }

    if (!av4Response.ok) {
      console.error('Avatar IV generate error:', av4Data);
      return res.status(av4Response.status).json({
        error: av4Data.message || av4Data.error?.message || 'Avatar IV video generation failed',
        debug: av4Data
      });
    }

    console.log('Avatar IV: Video generation started:', av4Data);

    res.json({
      videoId: av4Data.data?.video_id,
      status: 'processing',
      usedVoiceClone: !!audioAssetId,
      message: audioAssetId
        ? 'Video is being generated with your cloned voice. This may take 1-2 minutes.'
        : 'Video is being generated. This may take 1-2 minutes.'
    });
  } catch (error) {
    console.error('Avatar IV error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate Avatar IV video' });
  }
});

// Check Avatar IV video status (uses same endpoint as regular video)
router.get('/avatar/iv/status/:videoId', authenticate, async (req, res) => {
  try {
    const { videoId } = req.params;

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

    // Log the raw response for debugging
    console.log('Avatar IV status raw response:', JSON.stringify(data, null, 2));

    // Return full status with video URL when ready
    res.json({
      videoId,
      status: data.data?.status,
      videoUrl: data.data?.video_url,
      thumbnailUrl: data.data?.thumbnail_url,
      duration: data.data?.duration,
      error: data.data?.error
    });
  } catch (error) {
    console.error('Avatar IV status error:', error);
    res.status(500).json({ error: 'Failed to check video status' });
  }
});

// =====================
// LIVEAVATAR API - Real-Time Interactive Avatar
// =====================

// Get LiveAvatar session token for real-time conversation
router.post('/liveavatar/session', authenticate, requireSubscription('PREMIUM'), async (req, res) => {
  try {
    // Get LiveAvatar API config
    let config = await req.prisma.apiConfig.findUnique({
      where: { service: 'liveavatar' }
    });

    if (!config?.isActive || !config?.apiKey) {
      return res.status(503).json({ error: 'LiveAvatar API not configured. Please add API key in Admin Dashboard → APIs → LiveAvatar.' });
    }

    // Get user's persona to check for custom avatar
    const persona = await req.prisma.persona.findUnique({
      where: { userId: req.user.id },
      select: {
        liveavatarId: true,
        liveavatarName: true,
        liveavatarStatus: true,
        elevenlabsVoiceId: true
      }
    });

    // Determine which avatar to use
    let avatarId = null;

    // If user has a custom LiveAvatar that's ready, use it
    if (persona?.liveavatarId && persona?.liveavatarStatus === 'ready') {
      avatarId = persona.liveavatarId;
    } else {
      // Otherwise, fetch public avatars and use the first one
      console.log('LiveAvatar: Fetching public avatars...');
      const avatarsResponse = await fetch('https://api.liveavatar.com/v1/avatars/public', {
        method: 'GET',
        headers: {
          'X-API-KEY': config.apiKey,
        }
      });

      if (avatarsResponse.ok) {
        const avatarsData = await avatarsResponse.json();
        console.log('LiveAvatar: Raw response:', JSON.stringify(avatarsData, null, 2));

        // LiveAvatar returns: { code, data: { count, next, previous, results: [...] } }
        const avatars = avatarsData.data?.results || avatarsData.results || avatarsData.avatars || avatarsData.data?.avatars || [];
        console.log('LiveAvatar: Found', Array.isArray(avatars) ? avatars.length : 'unknown', 'public avatars');

        if (Array.isArray(avatars) && avatars.length > 0) {
          // Use the first public avatar that is ready (status check)
          const readyAvatar = avatars.find(a => a.status === 'ready' || a.status === 'completed' || !a.status) || avatars[0];
          avatarId = readyAvatar.id || readyAvatar.avatar_id;
          console.log('LiveAvatar: Using public avatar:', avatarId, 'name:', readyAvatar.name);
        } else {
          console.log('LiveAvatar: No public avatars found in response');
        }
      } else {
        const avatarsError = await avatarsResponse.text();
        console.error('LiveAvatar: Failed to fetch public avatars:', avatarsError);
      }
    }

    if (!avatarId) {
      return res.status(400).json({
        error: 'No avatars available. Please create a custom avatar or check your LiveAvatar subscription.',
        debug: 'Could not find any public avatars and no custom avatar is configured'
      });
    }

    // Create session token from LiveAvatar API
    const response = await fetch('https://api.liveavatar.com/v1/sessions/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': config.apiKey,
      },
      body: JSON.stringify({
        avatar_id: avatarId,
        mode: 'CUSTOM', // We'll handle voice ourselves with ElevenLabs
        // For CUSTOM mode, we don't need avatar_persona
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText };
      }
      console.error('LiveAvatar session error:', errorData);
      return res.status(response.status).json({
        error: errorData.message || errorData.detail || 'Failed to create LiveAvatar session',
        debug: errorData
      });
    }

    const data = await response.json();
    console.log('LiveAvatar session created - FULL RESPONSE:', JSON.stringify(data, null, 2));

    // LiveAvatar API may return data in different formats - check all possibilities
    const sessionToken = data.session_token || data.sessionToken || data.token || data.data?.session_token || data.data?.token;
    const sessionId = data.session_id || data.sessionId || data.id || data.data?.session_id || data.data?.id;

    if (!sessionToken) {
      console.error('LiveAvatar: No session token in response:', data);
      return res.status(500).json({
        error: 'LiveAvatar API did not return a session token',
        debug: { receivedData: data }
      });
    }

    res.json({
      sessionId: sessionId,
      sessionToken: sessionToken,
      hasCustomAvatar: !!persona?.liveavatarId && persona?.liveavatarStatus === 'ready',
      message: 'LiveAvatar session created successfully'
    });
  } catch (error) {
    console.error('LiveAvatar session error:', error);
    res.status(500).json({ error: 'Failed to create LiveAvatar session' });
  }
});

// Start LiveAvatar session (get LiveKit room details)
router.post('/liveavatar/start', authenticate, async (req, res) => {
  try {
    const { sessionToken } = req.body;

    if (!sessionToken) {
      return res.status(400).json({ error: 'Session token is required' });
    }

    // Start session with LiveAvatar
    const response = await fetch('https://api.liveavatar.com/v1/sessions/start', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText };
      }
      console.error('LiveAvatar start error:', errorData);
      return res.status(response.status).json({
        error: errorData.message || 'Failed to start LiveAvatar session',
        debug: errorData
      });
    }

    const responseData = await response.json();
    console.log('LiveAvatar START - FULL RESPONSE:', JSON.stringify(responseData, null, 2));

    // LiveAvatar API returns: { code: 1000, data: { ... }, message: "..." }
    // The actual connection details are nested inside the 'data' field
    const data = responseData.data || responseData;

    // LiveAvatar API returns:
    // - livekit_url: the LiveKit server URL
    // - livekit_client_token: the token for client connection (NOT livekit_token!)
    // - livekit_agent_token: optional agent token
    // - ws_url: WebSocket URL for CUSTOM mode
    // - max_session_duration: session time limit
    // - session_id: the session identifier
    const livekitUrl = data.livekit_url;
    const livekitToken = data.livekit_client_token;
    const sessionId = data.session_id;
    const wsUrl = data.ws_url;
    const maxDuration = data.max_session_duration;

    console.log('LiveAvatar extracted:', { livekitUrl, hasToken: !!livekitToken, sessionId, wsUrl });

    res.json({
      livekitUrl: livekitUrl,
      livekitToken: livekitToken,
      sessionId: sessionId,
      wsUrl: wsUrl,
      maxDuration: maxDuration,
      // Include full response for debugging
      debug: responseData
    });
  } catch (error) {
    console.error('LiveAvatar start error:', error);
    res.status(500).json({ error: 'Failed to start LiveAvatar session' });
  }
});

// Stop LiveAvatar session (free up concurrency)
router.post('/liveavatar/stop', authenticate, async (req, res) => {
  try {
    const { sessionToken, sessionId } = req.body;

    if (!sessionToken) {
      return res.status(400).json({ error: 'Session token is required' });
    }

    console.log('LiveAvatar: Stopping session', sessionId || '(unknown)');

    // Stop the session with LiveAvatar API
    const response = await fetch('https://api.liveavatar.com/v1/sessions/stop', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText };
      }
      console.error('LiveAvatar stop error:', errorData);
      // Even if stop fails, we return success as the session may have already ended
      return res.json({
        stopped: false,
        message: errorData.message || 'Session may have already ended',
        debug: errorData
      });
    }

    const data = await response.json();
    console.log('LiveAvatar session stopped:', data);

    res.json({
      stopped: true,
      message: 'LiveAvatar session stopped successfully',
      debug: data
    });
  } catch (error) {
    console.error('LiveAvatar stop error:', error);
    // Return success anyway - session might have timed out
    res.json({
      stopped: false,
      message: 'Error stopping session, it may have already ended'
    });
  }
});

// List available public avatars from LiveAvatar
router.get('/liveavatar/avatars', authenticate, async (req, res) => {
  try {
    let config = await req.prisma.apiConfig.findUnique({
      where: { service: 'liveavatar' }
    });

    if (!config?.isActive || !config?.apiKey) {
      return res.status(503).json({ error: 'LiveAvatar API not configured' });
    }

    const response = await fetch('https://api.liveavatar.com/v1/avatars/public', {
      method: 'GET',
      headers: {
        'X-API-KEY': config.apiKey,
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: 'Failed to fetch avatars', debug: errorText });
    }

    const data = await response.json();
    // LiveAvatar returns: { code, data: { count, next, previous, results: [...] } }
    const avatars = data.data?.results || data.results || data.avatars || data.data?.avatars || [];
    res.json({
      avatars,
      count: data.data?.count || avatars.length
    });
  } catch (error) {
    console.error('LiveAvatar avatars error:', error);
    res.status(500).json({ error: 'Failed to fetch avatars' });
  }
});

// Get LiveAvatar configuration status for user
router.get('/liveavatar/status', authenticate, async (req, res) => {
  try {
    // Check if LiveAvatar API is configured
    let config = await req.prisma.apiConfig.findUnique({
      where: { service: 'liveavatar' }
    });

    const isConfigured = !!(config?.isActive && config?.apiKey);

    // Get user's LiveAvatar status
    const persona = await req.prisma.persona.findUnique({
      where: { userId: req.user.id },
      select: {
        liveavatarId: true,
        liveavatarName: true,
        liveavatarStatus: true,
        elevenlabsVoiceId: true,
        elevenlabsVoiceName: true
      }
    });

    res.json({
      apiConfigured: isConfigured,
      hasCustomAvatar: !!persona?.liveavatarId,
      customAvatarStatus: persona?.liveavatarStatus,
      customAvatarName: persona?.liveavatarName,
      hasVoiceClone: !!persona?.elevenlabsVoiceId,
      voiceCloneName: persona?.elevenlabsVoiceName
    });
  } catch (error) {
    console.error('LiveAvatar status error:', error);
    res.status(500).json({ error: 'Failed to get LiveAvatar status' });
  }
});

// Upload training video to HeyGen's CDN (base64 encoded)
router.post('/liveavatar/upload-video', authenticate, requireSubscription('PREMIUM'), async (req, res) => {
  try {
    const { videoData, videoType } = req.body;

    if (!videoData) {
      return res.status(400).json({ error: 'Video data is required' });
    }

    // Get HeyGen API key
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

    // Parse base64 video
    const base64Match = videoData.match(/^data:video\/(\w+);base64,/);
    const videoFormat = base64Match ? base64Match[1] : 'mp4';
    const base64Video = videoData.replace(/^data:video\/\w+;base64,/, '');
    const videoBuffer = Buffer.from(base64Video, 'base64');

    // Check file size (max 200MB)
    const maxSize = 200 * 1024 * 1024;
    if (videoBuffer.length > maxSize) {
      return res.status(400).json({ error: 'Video file too large. Maximum size is 200MB.' });
    }

    // Determine content type
    const contentType = videoFormat === 'webm' ? 'video/webm' : 'video/mp4';

    console.log(`LiveAvatar: Uploading ${videoType || 'training'} video to HeyGen (${(videoBuffer.length / 1024 / 1024).toFixed(2)}MB)...`);

    // Upload to HeyGen's CDN
    const uploadResponse = await fetch('https://upload.heygen.com/v1/asset', {
      method: 'POST',
      headers: {
        'X-API-KEY': config.apiKey,
        'Content-Type': contentType
      },
      body: videoBuffer
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('HeyGen video upload error:', errorText);
      return res.status(uploadResponse.status).json({
        error: 'Failed to upload video to HeyGen',
        debug: errorText
      });
    }

    const uploadData = await uploadResponse.json();
    console.log('HeyGen video upload response:', uploadData);

    const assetId = uploadData.data?.id;
    const videoUrl = uploadData.data?.url;

    if (!videoUrl) {
      return res.status(500).json({
        error: 'HeyGen did not return a video URL',
        debug: uploadData
      });
    }

    res.json({
      success: true,
      assetId,
      videoUrl,
      size: videoBuffer.length,
      videoType: videoType || 'training'
    });
  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({ error: 'Failed to upload video' });
  }
});

// Create custom Video Avatar via HeyGen V2 API
// Requires: training footage URL + consent video URL
router.post('/liveavatar/create-avatar', authenticate, requireSubscription('PREMIUM'), async (req, res) => {
  try {
    const { trainingVideoUrl, consentVideoUrl, name } = req.body;

    if (!trainingVideoUrl) {
      return res.status(400).json({ error: 'Training video URL is required. Please upload a 2-minute video following the guidelines.' });
    }

    if (!consentVideoUrl) {
      return res.status(400).json({ error: 'Consent video URL is required. Please record a consent statement.' });
    }

    // Get HeyGen API key
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

    const avatarName = name || `${req.user.firstName}'s Avatar`;

    console.log('Creating HeyGen Video Avatar:', { avatarName, trainingVideoUrl, consentVideoUrl });

    // Create custom avatar via HeyGen V2 Video Avatar API
    const response = await fetch('https://api.heygen.com/v2/video_avatar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
      },
      body: JSON.stringify({
        avatar_name: avatarName,
        training_footage_url: trainingVideoUrl,
        video_consent_url: consentVideoUrl,
      })
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = { message: responseText };
    }

    if (!response.ok) {
      console.error('HeyGen create avatar error:', data);
      return res.status(response.status).json({
        error: data.message || data.error?.message || 'Failed to create custom avatar. This may require an Enterprise HeyGen plan.',
        debug: data
      });
    }

    console.log('HeyGen Video Avatar creation response:', data);

    const avatarId = data.data?.avatar_id;
    const avatarGroupId = data.data?.avatar_group_id;

    // Save to persona
    const persona = await req.prisma.persona.findUnique({
      where: { userId: req.user.id }
    });

    if (persona) {
      await req.prisma.persona.update({
        where: { id: persona.id },
        data: {
          liveavatarId: avatarId,
          liveavatarName: avatarName,
          liveavatarStatus: 'in_progress', // HeyGen status: in_progress -> complete
          // Store avatar group ID in settings if needed
        }
      });
    }

    res.json({
      success: true,
      avatarId,
      avatarGroupId,
      avatarName,
      status: 'in_progress',
      message: 'Video Avatar creation started. Training typically takes a few hours. You can check status in the Live Avatar tab.'
    });
  } catch (error) {
    console.error('HeyGen create avatar error:', error);
    res.status(500).json({ error: 'Failed to create custom avatar' });
  }
});

// Check Video Avatar training status
router.get('/liveavatar/avatar-status/:avatarId', authenticate, async (req, res) => {
  try {
    const { avatarId } = req.params;

    // Get HeyGen API key
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

    const response = await fetch(`https://api.heygen.com/v2/video_avatar/${avatarId}/status`, {
      method: 'GET',
      headers: {
        'x-api-key': config.apiKey,
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.message || 'Failed to check avatar status',
        debug: data
      });
    }

    const status = data.data?.status; // 'in_progress' or 'complete'

    // Update persona if status changed to complete
    if (status === 'complete') {
      const persona = await req.prisma.persona.findUnique({
        where: { userId: req.user.id }
      });

      if (persona && persona.liveavatarId === avatarId && persona.liveavatarStatus !== 'ready') {
        await req.prisma.persona.update({
          where: { id: persona.id },
          data: {
            liveavatarStatus: 'ready'
          }
        });
      }
    }

    res.json({
      avatarId,
      status: status === 'complete' ? 'ready' : status,
      rawStatus: status
    });
  } catch (error) {
    console.error('Avatar status check error:', error);
    res.status(500).json({ error: 'Failed to check avatar status' });
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

// =====================
// VIDEO ARCHIVE API
// =====================

// Get all videos for current user
router.get('/videos', authenticate, async (req, res) => {
  try {
    const videos = await req.prisma.generatedVideo.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(videos);
  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// Create a new video entry (when generation starts)
router.post('/videos', authenticate, async (req, res) => {
  try {
    const { title, text, videoId, provider = 'heygen' } = req.body;

    if (!title || !text || !videoId) {
      return res.status(400).json({ error: 'title, text, and videoId are required' });
    }

    const video = await req.prisma.generatedVideo.create({
      data: {
        userId: req.user.id,
        title,
        text,
        videoId,
        provider,
        status: 'pending',
      },
    });

    res.json(video);
  } catch (error) {
    console.error('Create video error:', error);
    res.status(500).json({ error: 'Failed to create video entry' });
  }
});

// Update video status (called when polling finds completion)
router.put('/videos/:videoId', authenticate, async (req, res) => {
  try {
    const { videoId } = req.params;
    const { status, videoUrl, thumbnailUrl, duration, error } = req.body;

    const video = await req.prisma.generatedVideo.update({
      where: { videoId },
      data: {
        ...(status && { status }),
        ...(videoUrl && { videoUrl }),
        ...(thumbnailUrl && { thumbnailUrl }),
        ...(duration && { duration }),
        ...(error && { error }),
      },
    });

    res.json(video);
  } catch (error) {
    console.error('Update video error:', error);
    res.status(500).json({ error: 'Failed to update video' });
  }
});

// Delete a video from archive
router.delete('/videos/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Make sure video belongs to user
    const video = await req.prisma.generatedVideo.findUnique({
      where: { id },
    });

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (video.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await req.prisma.generatedVideo.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

// Refresh status for pending videos
router.post('/videos/:id/refresh', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const video = await req.prisma.generatedVideo.findUnique({
      where: { id },
    });

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (video.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Only refresh if still pending or processing
    if (video.status === 'completed' || video.status === 'failed') {
      return res.json(video);
    }

    // Get HeyGen API key
    const config = await req.prisma.apiConfig.findFirst({
      where: {
        OR: [{ service: 'avatar' }, { service: 'heygen' }]
      }
    });

    if (!config?.apiKey) {
      return res.status(500).json({ error: 'Avatar API not configured' });
    }

    // Check status with HeyGen
    const statusResponse = await fetch(`https://api.heygen.com/v2/video_status.get?video_id=${video.videoId}`, {
      headers: {
        'X-Api-Key': config.apiKey,
      },
    });

    if (!statusResponse.ok) {
      throw new Error('Failed to fetch video status from HeyGen');
    }

    const statusData = await statusResponse.json();
    const heygenStatus = statusData.data?.status;

    // Map HeyGen status to our status
    let newStatus = video.status;
    let newVideoUrl = video.videoUrl;
    let newError = video.error;

    if (heygenStatus === 'completed') {
      newStatus = 'completed';
      newVideoUrl = statusData.data?.video_url;
    } else if (heygenStatus === 'failed') {
      newStatus = 'failed';
      newError = statusData.data?.error?.message || 'Video generation failed';
    } else if (heygenStatus === 'processing') {
      newStatus = 'processing';
    }

    // Update in database
    const updatedVideo = await req.prisma.generatedVideo.update({
      where: { id },
      data: {
        status: newStatus,
        ...(newVideoUrl && { videoUrl: newVideoUrl }),
        ...(newError && { error: newError }),
      },
    });

    res.json(updatedVideo);
  } catch (error) {
    console.error('Refresh video status error:', error);
    res.status(500).json({ error: 'Failed to refresh video status' });
  }
});

// =====================
// SIMLI API - Real-Time Avatar with ElevenLabs Voice Clone
// =====================

// Get Simli session for real-time avatar streaming
router.post('/simli/session', authenticate, async (req, res) => {
  try {
    // Get Simli API config
    const simliConfig = await req.prisma.apiConfig.findUnique({
      where: { service: 'simli' }
    });

    if (!simliConfig?.isActive || !simliConfig?.apiKey) {
      return res.status(503).json({
        error: 'Simli API not configured. Please add API key in Admin Dashboard → APIs → Simli.'
      });
    }

    // Get ElevenLabs config for voice clone
    let voiceConfig = await req.prisma.apiConfig.findUnique({
      where: { service: 'voice' }
    });
    if (!voiceConfig?.apiKey) {
      voiceConfig = await req.prisma.apiConfig.findUnique({
        where: { service: 'elevenlabs' }
      });
    }

    // Get user's persona for voice clone ID and avatar settings
    const persona = await req.prisma.persona.findUnique({
      where: { userId: req.user.id },
      select: {
        elevenlabsVoiceId: true,
        elevenlabsVoiceName: true,
        heygenAvatarId: true,
        avatarImages: {
          where: { isActive: true },
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    // Return configuration for frontend
    res.json({
      simliApiKey: simliConfig.apiKey,
      elevenlabsApiKey: voiceConfig?.apiKey || null,
      voiceId: persona?.elevenlabsVoiceId || null,
      voiceName: persona?.elevenlabsVoiceName || null,
      hasVoiceClone: !!persona?.elevenlabsVoiceId,
      // Simli face IDs - can be customized or use defaults
      defaultFaceId: simliConfig.settings?.defaultFaceId || '5514e24d-6086-46a3-ace4-6a7264e5cb7c',
      message: 'Simli configuration ready'
    });
  } catch (error) {
    console.error('Simli session error:', error);
    res.status(500).json({ error: 'Failed to get Simli configuration' });
  }
});

// Start Simli WebRTC session (creates session token)
router.post('/simli/start', authenticate, async (req, res) => {
  try {
    const { faceId } = req.body;

    // Get Simli API config
    const simliConfig = await req.prisma.apiConfig.findUnique({
      where: { service: 'simli' }
    });

    if (!simliConfig?.isActive || !simliConfig?.apiKey) {
      return res.status(503).json({ error: 'Simli API not configured' });
    }

    const selectedFaceId = faceId || simliConfig.settings?.defaultFaceId || '5514e24d-6086-46a3-ace4-6a7264e5cb7c';

    // Call Simli API to start audio-to-video session
    const response = await fetch('https://api.simli.ai/startAudioToVideoSession', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        faceId: selectedFaceId,
        apiKey: simliConfig.apiKey,
        apiVersion: 'v1',
        audioInputFormat: 'pcm16',
        handleSilence: true,
        maxSessionLength: 3600,
        maxIdleTime: 300,
        syncAudio: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Simli start error:', errorText);
      return res.status(response.status).json({
        error: 'Failed to start Simli session',
        debug: errorText
      });
    }

    const data = await response.json();
    console.log('Simli session started:', data);

    res.json({
      sessionToken: data.session_token || data.sessionToken,
      sessionId: data.session_id || data.sessionId,
      iceServers: data.iceServers,
      faceId: selectedFaceId,
      message: 'Simli session started successfully'
    });
  } catch (error) {
    console.error('Simli start error:', error);
    res.status(500).json({ error: 'Failed to start Simli session' });
  }
});

// Get available Simli faces
router.get('/simli/faces', authenticate, async (req, res) => {
  try {
    // Return some default Simli faces
    // These are publicly available face IDs from Simli
    const defaultFaces = [
      { id: '5514e24d-6086-46a3-ace4-6a7264e5cb7c', name: 'Default Avatar', thumbnail: null },
      { id: 'tmp9i8bbq7c', name: 'Professional Male', thumbnail: null },
      { id: 'tmp3ub1smil', name: 'Professional Female', thumbnail: null },
    ];

    // Check if user has custom Simli face ID in settings
    const simliConfig = await req.prisma.apiConfig.findUnique({
      where: { service: 'simli' }
    });

    const customFaces = simliConfig?.settings?.customFaces || [];

    res.json({
      faces: [...defaultFaces, ...customFaces],
      defaultFaceId: simliConfig?.settings?.defaultFaceId || defaultFaces[0].id
    });
  } catch (error) {
    console.error('Simli faces error:', error);
    res.status(500).json({ error: 'Failed to fetch Simli faces' });
  }
});

// Generate TTS audio for Simli (uses ElevenLabs with voice clone)
router.post('/simli/tts', authenticate, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Get ElevenLabs config
    let voiceConfig = await req.prisma.apiConfig.findUnique({
      where: { service: 'voice' }
    });
    if (!voiceConfig?.apiKey) {
      voiceConfig = await req.prisma.apiConfig.findUnique({
        where: { service: 'elevenlabs' }
      });
    }

    if (!voiceConfig?.isActive || !voiceConfig?.apiKey) {
      return res.status(503).json({ error: 'Voice API not configured' });
    }

    // Get user's voice clone ID
    const persona = await req.prisma.persona.findUnique({
      where: { userId: req.user.id },
      select: { elevenlabsVoiceId: true }
    });

    // Use cloned voice or default
    const voiceId = persona?.elevenlabsVoiceId || '21m00Tcm4TlvDq8ikWAM'; // Default: Rachel

    // Call ElevenLabs TTS API with PCM16 format for Simli
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': voiceConfig.apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5', // Fast model for real-time
        output_format: 'pcm_16000', // PCM16 at 16kHz for Simli
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs TTS error:', errorText);
      return res.status(response.status).json({ error: 'TTS generation failed' });
    }

    // Get audio as buffer
    const audioBuffer = await response.arrayBuffer();

    // Return as base64 for easy transmission to frontend
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    res.json({
      audio: base64Audio,
      format: 'pcm16',
      sampleRate: 16000,
      voiceId,
      hasVoiceClone: !!persona?.elevenlabsVoiceId
    });
  } catch (error) {
    console.error('Simli TTS error:', error);
    res.status(500).json({ error: 'Failed to generate TTS audio' });
  }
});

// Get Simli configuration status
router.get('/simli/status', authenticate, async (req, res) => {
  try {
    const simliConfig = await req.prisma.apiConfig.findUnique({
      where: { service: 'simli' }
    });

    let voiceConfig = await req.prisma.apiConfig.findUnique({
      where: { service: 'voice' }
    });
    if (!voiceConfig?.apiKey) {
      voiceConfig = await req.prisma.apiConfig.findUnique({
        where: { service: 'elevenlabs' }
      });
    }

    const persona = await req.prisma.persona.findUnique({
      where: { userId: req.user.id },
      select: {
        elevenlabsVoiceId: true,
        elevenlabsVoiceName: true
      }
    });

    res.json({
      simliConfigured: !!simliConfig?.isActive && !!simliConfig?.apiKey,
      voiceConfigured: !!voiceConfig?.isActive && !!voiceConfig?.apiKey,
      hasVoiceClone: !!persona?.elevenlabsVoiceId,
      voiceCloneName: persona?.elevenlabsVoiceName || null,
      defaultFaceId: simliConfig?.settings?.defaultFaceId || '5514e24d-6086-46a3-ace4-6a7264e5cb7c'
    });
  } catch (error) {
    console.error('Simli status error:', error);
    res.status(500).json({ error: 'Failed to get Simli status' });
  }
});

export default router;
