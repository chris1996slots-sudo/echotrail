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
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Hello' }] }]
      })
    });

    if (response.ok) {
      return { success: true, message: 'Google Gemini API connected successfully' };
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
    const response = await fetch('https://api.heygen.com/v1/user/remaining_quota', {
      headers: { 'x-api-key': apiKey }
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: `Connected. Remaining quota: ${data.data?.remaining_quota || 'unknown'}`,
        data: data.data
      };
    }

    return { success: false, message: 'Invalid API key' };
  } catch (error) {
    return { success: false, message: error.message };
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

export default router;
