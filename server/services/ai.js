/**
 * AI Service - Centralized AI API calls
 *
 * This service provides a unified interface for calling various AI providers:
 * - LLM (Groq, Claude) for text generation
 * - ElevenLabs for voice synthesis
 * - HeyGen for avatar video generation
 */

/**
 * Call AI service with unified interface
 *
 * @param {Object} options
 * @param {Object} options.prisma - Prisma client instance
 * @param {string} options.category - Service category: 'llm', 'voice', 'avatar'
 * @param {string} options.prompt - Text prompt for generation
 * @param {string} [options.action] - Action for avatar: 'generate', 'status'
 * @param {string} [options.avatarId] - HeyGen avatar ID
 * @param {string} [options.voiceId] - Voice ID (ElevenLabs or HeyGen)
 * @param {string} [options.videoId] - Video ID for status check
 * @param {number} [options.maxTokens] - Max tokens for LLM generation
 * @returns {Promise<Object>} AI response
 */
export async function callAI(options) {
  const {
    prisma,
    category,
    prompt,
    action,
    avatarId,
    voiceId,
    videoId,
    maxTokens = 350,
  } = options;

  // Get API configuration from database
  let config = await prisma.apiConfig.findUnique({
    where: { service: category }
  });

  // Fallback for legacy service names
  if (!config?.apiKey) {
    const legacyMap = {
      'llm': 'claude',
      'voice': 'elevenlabs',
      'avatar': 'heygen',
    };
    if (legacyMap[category]) {
      config = await prisma.apiConfig.findUnique({
        where: { service: legacyMap[category] }
      });
    }
  }

  if (!config?.isActive || !config?.apiKey) {
    throw new Error(`${category} API not configured`);
  }

  // Route to appropriate service
  switch (category) {
    case 'llm':
      return await callLLM(config, prompt, maxTokens);
    case 'voice':
      return await callVoice(config, prompt, voiceId);
    case 'avatar':
      return await callAvatar(config, action, prompt, avatarId, voiceId, videoId);
    default:
      throw new Error(`Unknown AI category: ${category}`);
  }
}

/**
 * Call LLM (Groq or Claude) for text generation
 */
async function callLLM(config, prompt, maxTokens) {
  const provider = config.settings?.provider || 'claude';

  if (provider === 'groq') {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: maxTokens,
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    });

    const data = await response.json();
    if (data.choices && data.choices[0]?.message?.content) {
      return { text: data.choices[0].message.content };
    } else {
      throw new Error('Invalid response from Groq: ' + JSON.stringify(data));
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
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    if (data.content && data.content[0]) {
      return { text: data.content[0].text };
    } else {
      throw new Error('Invalid response from Claude: ' + JSON.stringify(data));
    }
  }
}

/**
 * Call ElevenLabs for voice synthesis
 */
async function callVoice(config, text, voiceId) {
  const finalVoiceId = voiceId || 'pNInz6obpgDQGcFmaJgB'; // Default voice

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
    throw new Error(error.detail?.message || 'Voice synthesis failed');
  }

  const audioBuffer = await response.arrayBuffer();
  const base64Audio = Buffer.from(audioBuffer).toString('base64');

  return { audio: base64Audio };
}

/**
 * Call HeyGen for avatar video generation
 */
async function callAvatar(config, action, prompt, avatarId, voiceId, videoId) {
  if (action === 'generate') {
    // Generate video with HeyGen
    const response = await fetch('https://api.heygen.com/v2/video/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': config.apiKey,
      },
      body: JSON.stringify({
        video_inputs: [{
          character: {
            type: 'avatar',
            avatar_id: avatarId,
          },
          voice: {
            type: 'text',
            input_text: prompt,
            voice_id: voiceId,
          },
        }],
        dimension: {
          width: 1280,
          height: 720,
        },
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'HeyGen video generation failed');
    }

    const data = await response.json();
    return {
      video_id: data.data?.video_id,
      status: 'processing',
    };
  } else if (action === 'status') {
    // Check video status
    const response = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
      method: 'GET',
      headers: {
        'X-Api-Key': config.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get video status');
    }

    const data = await response.json();
    return {
      status: data.data?.status || 'unknown',
      video_url: data.data?.video_url,
    };
  } else {
    throw new Error(`Unknown avatar action: ${action}`);
  }
}
