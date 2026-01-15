import express from 'express';
import bcrypt from 'bcryptjs';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// All routes require admin
router.use(authenticate, requireAdmin);

// =====================
// DASHBOARD STATS
// =====================
router.get('/stats', async (req, res) => {
  try {
    const { period = 'all' } = req.query;

    // Calculate date filter based on period
    let dateFilter = {};
    const now = new Date();

    if (period === 'day') {
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      dateFilter = { gte: dayAgo };
    } else if (period === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = { gte: weekAgo };
    } else if (period === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFilter = { gte: monthAgo };
    }

    const periodWhere = period !== 'all' ? { createdAt: dateFilter } : {};
    const subscriptionWhere = period !== 'all'
      ? { subscribedAt: dateFilter }
      : {};

    const [
      totalUsers,
      newUsers,
      premiumUsers,
      newPremiumSubscriptions,
      standardUsers,
      newStandardSubscriptions,
      totalMemories,
      newMemories,
      totalCapsules,
      newCapsules,
      totalStories,
      newStories,
      totalAvatarImages,
      newAvatarImages,
      totalWisdomChats,
      newWisdomChats,
      openSupportChats,
      recentUsers,
      recentActivity
    ] = await Promise.all([
      // Total counts
      req.prisma.user.count(),
      req.prisma.user.count({ where: periodWhere }),
      req.prisma.user.count({ where: { subscription: 'PREMIUM' } }),
      req.prisma.user.count({ where: { subscription: 'PREMIUM', ...subscriptionWhere } }),
      req.prisma.user.count({ where: { subscription: 'STANDARD' } }),
      req.prisma.user.count({ where: { subscription: 'STANDARD', ...subscriptionWhere } }),
      req.prisma.memory.count(),
      req.prisma.memory.count({ where: periodWhere }),
      req.prisma.timeCapsule.count(),
      req.prisma.timeCapsule.count({ where: periodWhere }),
      req.prisma.lifeStory.count(),
      req.prisma.lifeStory.count({ where: periodWhere }),
      req.prisma.avatarImage.count(),
      req.prisma.avatarImage.count({ where: periodWhere }),
      req.prisma.wisdomChat.count(),
      req.prisma.wisdomChat.count({ where: periodWhere }),
      req.prisma.supportChat.count({ where: { status: 'open' } }),
      // Recent users
      req.prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          subscription: true,
          createdAt: true,
        }
      }),
      // Recent activity summary
      req.prisma.user.findMany({
        take: 10,
        where: periodWhere,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          subscription: true,
          createdAt: true,
          _count: {
            select: {
              memories: true,
              timeCapsules: true,
              wisdomChats: true,
            }
          }
        }
      })
    ]);

    res.json({
      period,
      // Totals
      totalUsers,
      premiumUsers,
      standardUsers,
      totalMemories,
      totalCapsules,
      totalStories,
      totalAvatarImages,
      totalWisdomChats,
      openSupportChats,
      // Period-specific
      newUsers,
      newPremiumSubscriptions,
      newStandardSubscriptions,
      newMemories,
      newCapsules,
      newStories,
      newAvatarImages,
      newWisdomChats,
      // Lists
      recentUsers,
      recentActivity,
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// =====================
// USER MANAGEMENT
// =====================
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (page - 1) * limit;

    const where = search ? {
      OR: [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ]
    } : {};

    const [users, total] = await Promise.all([
      req.prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          subscription: true,
          createdAt: true,
          _count: {
            select: {
              memories: true,
              timeCapsules: true,
            }
          }
        }
      }),
      req.prisma.user.count({ where })
    ]);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { role, subscription } = req.body;

    const user = await req.prisma.user.update({
      where: { id },
      data: {
        ...(role && { role }),
        ...(subscription && { subscription }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        subscription: true,
      }
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await req.prisma.user.delete({
      where: { id }
    });

    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get detailed user profile with all their data
router.get('/users/:id/details', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await req.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        subscription: true,
        purpose: true,
        createdAt: true,
        updatedAt: true,
        persona: {
          include: {
            lifeStories: {
              orderBy: { createdAt: 'desc' }
            },
            avatarImages: {
              orderBy: { createdAt: 'asc' }
            }
          }
        },
        memories: {
          orderBy: { createdAt: 'desc' }
        },
        timeCapsules: {
          orderBy: { createdAt: 'desc' }
        },
        wisdomChats: {
          orderBy: { createdAt: 'desc' },
          take: 50
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('User details error:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

// =====================
// API CONFIGURATION
// =====================
router.get('/api-config', async (req, res) => {
  try {
    const configs = await req.prisma.apiConfig.findMany({
      orderBy: { service: 'asc' }
    });

    // Mask API keys for display
    const masked = configs.map(c => ({
      ...c,
      apiKey: c.apiKey ? `${c.apiKey.substring(0, 8)}...${c.apiKey.substring(c.apiKey.length - 4)}` : '',
      hasKey: !!c.apiKey,
    }));

    res.json(masked);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch API config' });
  }
});

router.put('/api-config/:service', async (req, res) => {
  try {
    const { service } = req.params;
    const { apiKey, isActive, settings } = req.body;

    const config = await req.prisma.apiConfig.upsert({
      where: { service },
      update: {
        ...(apiKey !== undefined && { apiKey }),
        ...(isActive !== undefined && { isActive }),
        ...(settings !== undefined && { settings }),
      },
      create: {
        service,
        apiKey: apiKey || '',
        isActive: isActive || false,
        settings: settings || {},
      }
    });

    res.json({
      ...config,
      apiKey: config.apiKey ? `${config.apiKey.substring(0, 8)}...` : '',
      hasKey: !!config.apiKey,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update API config' });
  }
});

// Test API connection
router.post('/api-config/:service/test', async (req, res) => {
  try {
    const { service } = req.params;

    const config = await req.prisma.apiConfig.findUnique({
      where: { service }
    });

    const provider = config?.settings?.provider;

    // Check if provider needs API key
    const freeProviders = ['edge-tts', 'sadtalker', 'none', 'ollama'];
    const needsApiKey = !freeProviders.includes(provider);

    if (needsApiKey && (!config || !config.apiKey)) {
      return res.status(400).json({ error: 'API key not configured' });
    }

    let testResult = { success: false, message: '' };

    // Route to correct test function based on service category and provider
    switch (service) {
      case 'llm':
        testResult = await testLLMProvider(provider || 'claude', config?.apiKey);
        break;
      case 'voice':
        testResult = await testVoiceProvider(provider || 'elevenlabs', config?.apiKey);
        break;
      case 'avatar':
        testResult = await testAvatarProvider(provider || 'heygen', config?.apiKey);
        break;
      // Legacy service names
      case 'claude':
        testResult = await testClaudeApi(config.apiKey);
        break;
      case 'elevenlabs':
        testResult = await testElevenLabsApi(config.apiKey);
        break;
      case 'heygen':
        testResult = await testHeyGenApi(config.apiKey);
        break;
      default:
        return res.status(400).json({ error: 'Unknown service' });
    }

    res.json(testResult);
  } catch (error) {
    console.error('API test error:', error);
    res.status(500).json({ error: 'Failed to test API' });
  }
});

// =====================
// LLM PROVIDER TESTS
// =====================
async function testLLMProvider(provider, apiKey) {
  switch (provider) {
    case 'claude':
      return testClaudeApi(apiKey);
    case 'groq':
      return testGroqApi(apiKey);
    case 'gemini':
      return testGeminiApi(apiKey);
    case 'openrouter':
      return testOpenRouterApi(apiKey);
    case 'ollama':
      return testOllamaApi();
    default:
      return { success: false, message: `Unknown LLM provider: ${provider}` };
  }
}

async function testOllamaApi() {
  try {
    const response = await fetch('http://localhost:11434/api/tags');

    if (response.ok) {
      const data = await response.json();
      const models = data.models?.map(m => m.name).join(', ') || 'none';
      return {
        success: true,
        message: `Ollama running locally! Models: ${models || 'No models installed yet'}`
      };
    }

    return { success: false, message: 'Ollama not running. Start with: ollama serve' };
  } catch (error) {
    return { success: false, message: 'Ollama not running. Install from ollama.com and run: ollama serve' };
  }
}

async function testGroqApi(apiKey) {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hello' }]
      })
    });

    if (response.ok) {
      return { success: true, message: 'Groq API connected successfully (Llama 3.3 70B)' };
    }

    const error = await response.json();
    return { success: false, message: error.error?.message || 'Connection failed' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function testGeminiApi(apiKey) {
  try {
    // First, list available models to find the right one
    const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

    if (!listResponse.ok) {
      const error = await listResponse.json();
      return { success: false, message: error.error?.message || 'Invalid API key' };
    }

    const listData = await listResponse.json();
    const models = listData.models || [];

    // Find a suitable model (prefer gemini-2.0-flash, then gemini-pro)
    const preferredModels = ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-pro'];
    let modelToUse = null;

    for (const preferred of preferredModels) {
      const found = models.find(m => m.name.includes(preferred) && m.supportedGenerationMethods?.includes('generateContent'));
      if (found) {
        modelToUse = found.name;
        break;
      }
    }

    if (!modelToUse && models.length > 0) {
      // Use first available model that supports generateContent
      const fallback = models.find(m => m.supportedGenerationMethods?.includes('generateContent'));
      modelToUse = fallback?.name;
    }

    if (!modelToUse) {
      return { success: false, message: 'No compatible Gemini models found' };
    }

    // Test the model
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${modelToUse}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Hello' }] }]
      })
    });

    if (response.ok) {
      const modelName = modelToUse.split('/').pop();
      return { success: true, message: `Gemini connected! Using ${modelName}` };
    }

    const error = await response.json();
    return { success: false, message: error.error?.message || 'Connection failed' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function testOpenRouterApi(apiKey) {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: `OpenRouter connected. Credits: $${(data.data?.limit_remaining / 100).toFixed(2) || 'unknown'}`
      };
    }

    return { success: false, message: 'Invalid API key' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// =====================
// VOICE PROVIDER TESTS
// =====================
async function testVoiceProvider(provider, apiKey) {
  switch (provider) {
    case 'elevenlabs':
      return testElevenLabsApi(apiKey);
    case 'edge-tts':
      return { success: true, message: 'Edge TTS is free and always available!' };
    case 'openai-tts':
      return testOpenAITTSApi(apiKey);
    case 'google-tts':
      return testGoogleTTSApi(apiKey);
    default:
      return { success: false, message: `Unknown voice provider: ${provider}` };
  }
}

async function testOpenAITTSApi(apiKey) {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    if (response.ok) {
      return { success: true, message: 'OpenAI TTS API connected successfully' };
    }

    return { success: false, message: 'Invalid API key' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function testGoogleTTSApi(apiKey) {
  try {
    const response = await fetch(`https://texttospeech.googleapis.com/v1/voices?key=${apiKey}`);

    if (response.ok) {
      return { success: true, message: 'Google Cloud TTS connected successfully' };
    }

    return { success: false, message: 'Invalid API key or TTS API not enabled' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// =====================
// AVATAR PROVIDER TESTS
// =====================
async function testAvatarProvider(provider, apiKey) {
  switch (provider) {
    case 'heygen':
      return testHeyGenApi(apiKey);
    case 'd-id':
      return testDIDApi(apiKey);
    case 'sadtalker':
      return { success: true, message: 'SadTalker runs locally - no API needed!' };
    case 'none':
      return { success: true, message: 'Audio-only mode - no video API needed!' };
    default:
      return { success: false, message: `Unknown avatar provider: ${provider}` };
  }
}

async function testDIDApi(apiKey) {
  try {
    const response = await fetch('https://api.d-id.com/credits', {
      headers: {
        'Authorization': `Basic ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: `D-ID connected. Remaining credits: ${data.remaining || 'unknown'}`
      };
    }

    return { success: false, message: 'Invalid API key' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// API Test Functions
async function testClaudeApi(apiKey) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hello' }]
      })
    });

    if (response.ok) {
      return { success: true, message: 'Claude API connected successfully' };
    }

    const error = await response.json();
    return { success: false, message: error.error?.message || 'Connection failed' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function testElevenLabsApi(apiKey) {
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/user', {
      headers: { 'xi-api-key': apiKey }
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: `Connected as ${data.subscription?.tier || 'user'}`,
        data: { tier: data.subscription?.tier }
      };
    }

    return { success: false, message: 'Invalid API key' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function testHeyGenApi(apiKey) {
  try {
    // Try v2 avatars endpoint first (more reliable)
    const response = await fetch('https://api.heygen.com/v2/avatars', {
      headers: { 'X-Api-Key': apiKey }
    });

    if (response.ok) {
      const data = await response.json();
      const avatarCount = data.data?.avatars?.length || 0;
      return {
        success: true,
        message: `Connected! ${avatarCount} avatars available.`,
        data: { avatarCount }
      };
    }

    // Try v1 endpoint as fallback
    const v1Response = await fetch('https://api.heygen.com/v1/avatar.list', {
      headers: { 'X-Api-Key': apiKey }
    });

    if (v1Response.ok) {
      const data = await v1Response.json();
      return {
        success: true,
        message: `Connected via v1 API.`,
        data: data.data
      };
    }

    // Check the error response
    const errorData = await response.json().catch(() => ({}));
    return {
      success: false,
      message: errorData.message || errorData.error || 'Invalid API key or insufficient permissions'
    };
  } catch (error) {
    return { success: false, message: `Connection error: ${error.message}` };
  }
}

// =====================
// SYSTEM SETTINGS
// =====================
router.get('/settings', async (req, res) => {
  try {
    const settings = await req.prisma.systemSettings.findMany();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.put('/settings/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;

    const setting = await req.prisma.systemSettings.upsert({
      where: { key },
      update: { value, description },
      create: { key, value, description }
    });

    res.json(setting);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

// =====================
// AI PROMPTS MANAGEMENT
// =====================

// Get all AI prompts
router.get('/prompts', async (req, res) => {
  try {
    // Get all prompts from system settings
    const prompts = await req.prisma.systemSettings.findMany({
      where: {
        key: { startsWith: 'prompt_' }
      }
    });
    res.json(prompts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch prompts' });
  }
});

// Update or create AI prompt
router.put('/prompts/:promptKey', async (req, res) => {
  try {
    const { promptKey } = req.params;
    const { value, description } = req.body;
    const key = `prompt_${promptKey}`;

    const prompt = await req.prisma.systemSettings.upsert({
      where: { key },
      update: { value, description },
      create: { key, value, description }
    });

    res.json(prompt);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update prompt' });
  }
});

// Delete AI prompt (reset to default)
router.delete('/prompts/:promptKey', async (req, res) => {
  try {
    const { promptKey } = req.params;
    const key = `prompt_${promptKey}`;

    await req.prisma.systemSettings.delete({
      where: { key }
    });

    res.json({ message: 'Prompt deleted (will use default)' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete prompt' });
  }
});

// =====================
// BLACKLIST MANAGEMENT
// =====================

// Get all blacklisted topics
router.get('/blacklist', async (req, res) => {
  try {
    const topics = await req.prisma.blacklistedTopic.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(topics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch blacklist' });
  }
});

// Add blacklisted topic
router.post('/blacklist', async (req, res) => {
  try {
    const { topic, description } = req.body;

    if (!topic || topic.trim().length === 0) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const entry = await req.prisma.blacklistedTopic.create({
      data: {
        topic: topic.trim().toLowerCase(),
        description: description || null
      }
    });

    res.status(201).json(entry);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Topic already exists' });
    }
    res.status(500).json({ error: 'Failed to add topic' });
  }
});

// Update blacklisted topic
router.put('/blacklist/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { topic, description, isActive } = req.body;

    const entry = await req.prisma.blacklistedTopic.update({
      where: { id },
      data: {
        ...(topic && { topic: topic.trim().toLowerCase() }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive })
      }
    });

    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update topic' });
  }
});

// Delete blacklisted topic
router.delete('/blacklist/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await req.prisma.blacklistedTopic.delete({
      where: { id }
    });

    res.json({ message: 'Topic deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete topic' });
  }
});

// =====================
// SUBSCRIPTION PRICING
// =====================

// Get subscription pricing
router.get('/pricing', async (req, res) => {
  try {
    const pricing = await req.prisma.systemSettings.findUnique({
      where: { key: 'subscription_pricing' }
    });

    // Default pricing if not set
    const defaultPricing = {
      standard: { monthly: 9.99, yearly: 99.99 },
      premium: { monthly: 19.99, yearly: 199.99 }
    };

    res.json(pricing?.value ? JSON.parse(pricing.value) : defaultPricing);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pricing' });
  }
});

// Update subscription pricing
router.put('/pricing', async (req, res) => {
  try {
    const { standard, premium } = req.body;

    const pricing = await req.prisma.systemSettings.upsert({
      where: { key: 'subscription_pricing' },
      update: { value: JSON.stringify({ standard, premium }) },
      create: { key: 'subscription_pricing', value: JSON.stringify({ standard, premium }), description: 'Subscription pricing configuration' }
    });

    res.json(JSON.parse(pricing.value));
  } catch (error) {
    res.status(500).json({ error: 'Failed to update pricing' });
  }
});

// =====================
// USER VOICE SAMPLES VIEW
// =====================

// Get user's voice samples (for admin viewing)
router.get('/users/:id/voice-samples', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await req.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        persona: {
          select: {
            voiceSamples: {
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      voiceSamples: user.persona?.voiceSamples || []
    });
  } catch (error) {
    console.error('Voice samples error:', error);
    res.status(500).json({ error: 'Failed to fetch voice samples' });
  }
});

export default router;
