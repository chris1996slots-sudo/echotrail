import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get chat history
router.get('/chat', authenticate, async (req, res) => {
  try {
    const chats = await req.prisma.wisdomChat.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'asc' },
      take: 100, // Last 100 messages
    });
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// Send message (with AI response)
router.post('/chat', authenticate, async (req, res) => {
  try {
    const { message } = req.body;

    // Check blacklist for forbidden topics
    const blacklistedTopics = await req.prisma.blacklistedTopic.findMany({
      where: { isActive: true }
    });

    const messageLower = message.toLowerCase();
    const blockedTopic = blacklistedTopics.find(topic =>
      messageLower.includes(topic.topic.toLowerCase())
    );

    if (blockedTopic) {
      // Return polite decline for blacklisted topics
      const declineMessage = await req.prisma.wisdomChat.create({
        data: {
          userId: req.user.id,
          role: 'user',
          content: message,
        }
      });

      const declineResponse = await req.prisma.wisdomChat.create({
        data: {
          userId: req.user.id,
          role: 'assistant',
          content: `I appreciate you sharing with me, but I'd prefer not to discuss that particular topic. Perhaps we could talk about something else? I'd love to hear about your day, your dreams, or any questions about life, family, or the things that matter most to you.`,
        }
      });

      return res.json({
        userMessage: declineMessage,
        assistantMessage: declineResponse,
      });
    }

    // Save user message
    const userMessage = await req.prisma.wisdomChat.create({
      data: {
        userId: req.user.id,
        role: 'user',
        content: message,
      }
    });

    // Get user's persona for context
    const persona = await req.prisma.persona.findUnique({
      where: { userId: req.user.id },
      include: { lifeStories: true }
    });

    const user = await req.prisma.user.findUnique({
      where: { id: req.user.id }
    });

    // Get all API configs to find active LLM
    const apiConfigs = await req.prisma.apiConfig.findMany();

    console.log('Available API configs:', apiConfigs.map(c => ({
      service: c.service,
      isActive: c.isActive,
      hasKey: !!c.apiKey,
      settings: c.settings
    })));

    // Find active LLM provider - check both new format (service='llm') and legacy format
    let activeProvider = null;

    // First check new format: service='llm' with provider in settings
    const llmConfig = apiConfigs.find(c => c.service === 'llm');
    if (llmConfig?.isActive && llmConfig?.apiKey) {
      const provider = llmConfig.settings?.provider || 'groq';
      activeProvider = { service: provider, apiKey: llmConfig.apiKey };
      console.log(`Using LLM provider (new format): ${provider}`);
    }

    // Fallback to legacy format: individual service names
    if (!activeProvider) {
      const llmProviders = ['groq', 'openai', 'claude', 'gemini'];
      for (const provider of llmProviders) {
        const config = apiConfigs.find(c => c.service === provider);
        if (config?.isActive && config?.apiKey) {
          activeProvider = { service: provider, apiKey: config.apiKey };
          console.log(`Using LLM provider (legacy format): ${provider}`);
          break;
        }
      }
    }

    let aiResponse;

    if (activeProvider) {
      // Use real LLM API
      console.log(`Calling ${activeProvider.service} API...`);
      aiResponse = await generateLLMResponse(message, persona, user, activeProvider, req.prisma);
      console.log('LLM response received successfully');
    } else {
      // Use mock response
      console.log('No active LLM provider found, using mock response');
      aiResponse = generateMockResponse(message, persona, user);
    }

    // Save AI response
    const assistantMessage = await req.prisma.wisdomChat.create({
      data: {
        userId: req.user.id,
        role: 'assistant',
        content: aiResponse,
      }
    });

    res.json({
      userMessage,
      assistantMessage,
    });
  } catch (error) {
    console.error('Wisdom chat error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Clear chat history
router.delete('/chat', authenticate, async (req, res) => {
  try {
    await req.prisma.wisdomChat.deleteMany({
      where: { userId: req.user.id }
    });
    res.json({ message: 'Chat history cleared' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear chat history' });
  }
});

// Generate response using configured LLM API
async function generateLLMResponse(message, persona, user, provider, prisma) {
  try {
    const systemPrompt = await buildSystemPrompt(persona, user, prisma);

    // Get previous messages for context (last 10)
    const previousMessages = await prisma.wisdomChat.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const chatHistory = previousMessages.reverse().map(m => ({
      role: m.role,
      content: m.content,
    }));

    switch (provider.service) {
      case 'groq':
        return await generateGroqResponse(message, systemPrompt, chatHistory, provider.apiKey);
      case 'openai':
        return await generateOpenAIResponse(message, systemPrompt, chatHistory, provider.apiKey);
      case 'claude':
        return await generateClaudeResponse(message, systemPrompt, chatHistory, provider.apiKey);
      case 'gemini':
        return await generateGeminiResponse(message, systemPrompt, chatHistory, provider.apiKey);
      default:
        throw new Error(`Unsupported provider: ${provider.service}`);
    }
  } catch (error) {
    console.error('LLM API error:', error);
    return generateMockResponse(message, persona, user);
  }
}

// Groq API (Llama 3.3 70B)
async function generateGroqResponse(message, systemPrompt, chatHistory, apiKey) {
  console.log('Groq API call starting...');
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...chatHistory,
        { role: 'user', content: message }
      ],
      max_tokens: 1024,
      temperature: 0.7,
    })
  });

  const data = await response.json();
  console.log('Groq API response status:', response.status);

  if (!response.ok) {
    console.error('Groq API error response:', JSON.stringify(data));
    throw new Error(`Groq API error: ${data.error?.message || JSON.stringify(data)}`);
  }

  if (data.choices && data.choices[0]?.message?.content) {
    return data.choices[0].message.content;
  }
  console.error('Groq unexpected response format:', JSON.stringify(data));
  throw new Error('Invalid Groq response format');
}

// OpenAI API
async function generateOpenAIResponse(message, systemPrompt, chatHistory, apiKey) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...chatHistory,
        { role: 'user', content: message }
      ],
      max_tokens: 1024,
      temperature: 0.7,
    })
  });

  const data = await response.json();
  if (data.choices && data.choices[0]?.message?.content) {
    return data.choices[0].message.content;
  }
  throw new Error('Invalid OpenAI response');
}

// Claude API
async function generateClaudeResponse(message, systemPrompt, chatHistory, apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        ...chatHistory.filter(m => m.role !== 'system'),
        { role: 'user', content: message }
      ]
    })
  });

  const data = await response.json();
  if (data.content && data.content[0]) {
    return data.content[0].text;
  }
  throw new Error('Invalid Claude response');
}

// Gemini API
async function generateGeminiResponse(message, systemPrompt, chatHistory, apiKey) {
  // Combine system prompt with conversation
  const contents = [];

  // Add system context as first user message
  contents.push({
    role: 'user',
    parts: [{ text: `Context: ${systemPrompt}\n\nPlease respond according to this persona.` }]
  });
  contents.push({
    role: 'model',
    parts: [{ text: 'I understand. I will respond as this persona.' }]
  });

  // Add chat history
  for (const msg of chatHistory) {
    contents.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    });
  }

  // Add current message
  contents.push({
    role: 'user',
    parts: [{ text: message }]
  });

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7,
      }
    })
  });

  const data = await response.json();
  if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
    return data.candidates[0].content.parts[0].text;
  }
  throw new Error('Invalid Gemini response');
}

// Get global system instructions from database
async function getGlobalSystemInstructions(prisma) {
  try {
    const globalSetting = await prisma.systemSettings.findUnique({
      where: { key: 'prompt_global_system' }
    });
    if (globalSetting?.value) {
      return globalSetting.value;
    }
  } catch (error) {
    console.log('No global prompt found, using default');
  }

  // Default global instructions
  return `You are an AI assistant for EchoTrail, a digital legacy platform that helps people preserve their memories, wisdom, and personality for future generations.

CORE PRINCIPLES:
1. You represent the preserved "echo" of a real person - be respectful, authentic, and meaningful
2. Never generate harmful, offensive, or inappropriate content
3. Be supportive, empathetic, and encouraging in all interactions
4. Focus on positive memories, life lessons, and family connections
5. If asked about topics outside your scope, politely redirect to appropriate channels

PLATFORM CONTEXT:
- EchoTrail preserves digital legacies through: Memory Anchors, Time Capsules, WisdomGPT conversations, and Echo Simulations
- Users are typically creating content for loved ones and future generations
- The emotional tone should be warm, personal, and meaningful

LANGUAGE:
- Respond in the same language the user writes in
- Be conversational but thoughtful
- Avoid jargon unless specifically discussing technical features`;
}

// Build system prompt from persona
async function buildSystemPrompt(persona, user, prisma) {
  const vibeDescriptions = {
    compassionate: 'warm, nurturing, and deeply caring',
    strict: 'firm, principled, and focused on growth',
    storyteller: 'narrative-driven and wise, sharing lessons through stories',
    wise: 'thoughtful and philosophical',
    playful: 'light-hearted and fun while being helpful',
    adventurous: 'bold and encouraging of exploration',
  };

  const stories = persona?.lifeStories?.map(s => s.content).join('\n\n') || '';

  // Fetch Memory Anchors (cherished objects with stories)
  const memories = await prisma.memory.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 20, // Limit to most recent 20 memories
  });

  const memoriesText = memories.length > 0
    ? memories.map(m => `- ${m.title}: ${m.description}${m.history ? ` (History: ${m.history})` : ''}`).join('\n')
    : '';

  // Fetch Timeline Events (life milestones)
  const timelineEvents = await prisma.timelineEvent.findMany({
    where: { userId: user.id },
    orderBy: { eventDate: 'asc' },
    take: 30, // Limit to 30 key life events
  });

  const timelineText = timelineEvents.length > 0
    ? timelineEvents.map(e => {
        const date = new Date(e.eventDate).getFullYear();
        const age = e.ageAtEvent ? ` (age ${e.ageAtEvent})` : '';
        return `- ${date}${age}: ${e.title}${e.description ? ` - ${e.description}` : ''} [${e.category}]`;
      }).join('\n')
    : '';

  // Get global system instructions (hardcoded master prompt)
  const globalInstructions = await getGlobalSystemInstructions(prisma);

  // Try to get custom wisdom prompt from database
  let customPrompt = null;
  try {
    const promptSetting = await prisma.systemSettings.findUnique({
      where: { key: 'prompt_wisdom_system' }
    });
    if (promptSetting?.value) {
      customPrompt = promptSetting.value;
    }
  } catch (error) {
    console.log('No custom wisdom prompt found, using default');
  }

  // Build the persona-specific prompt
  let personaPrompt;
  if (customPrompt) {
    personaPrompt = customPrompt
      .replace(/{userName}/g, `${user.firstName} ${user.lastName}`)
      .replace(/{humor}/g, persona?.humor || 50)
      .replace(/{empathy}/g, persona?.empathy || 50)
      .replace(/{tradition}/g, persona?.tradition || 50)
      .replace(/{adventure}/g, persona?.adventure || 50)
      .replace(/{wisdom}/g, persona?.wisdom || 50)
      .replace(/{creativity}/g, persona?.creativity || 50)
      .replace(/{patience}/g, persona?.patience || 50)
      .replace(/{optimism}/g, persona?.optimism || 50)
      .replace(/{coreValues}/g, persona?.coreValues?.join(', ') || 'Not specified')
      .replace(/{lifePhilosophy}/g, persona?.lifePhilosophy || 'Not specified')
      .replace(/{echoVibe}/g, vibeDescriptions[persona?.echoVibe || 'compassionate'])
      .replace(/{stories}/g, stories || 'No specific stories recorded yet.');
  } else {
    // Default persona prompt
    personaPrompt = `You are the digital echo of ${user.firstName} ${user.lastName}. You embody their personality, values, and wisdom to guide their descendants.

PERSONALITY TRAITS (scale 0-100):
- Humor: ${persona?.humor || 50}/100
- Empathy: ${persona?.empathy || 50}/100
- Tradition: ${persona?.tradition || 50}/100
- Adventure: ${persona?.adventure || 50}/100
- Wisdom: ${persona?.wisdom || 50}/100
- Creativity: ${persona?.creativity || 50}/100
- Patience: ${persona?.patience || 50}/100
- Optimism: ${persona?.optimism || 50}/100

Core values: ${persona?.coreValues?.join(', ') || 'Not specified'}
Life philosophy: ${persona?.lifePhilosophy || 'Not specified'}

COMMUNICATION STYLE: ${vibeDescriptions[persona?.echoVibe || 'compassionate']}

LIFE STORIES AND WISDOM:
${stories || 'No specific stories recorded yet, but speak with general wisdom and care.'}

${memoriesText ? `CHERISHED OBJECTS & MEMORY ANCHORS:
These are meaningful objects and their stories that ${user.firstName} treasures:
${memoriesText}` : ''}

${timelineText ? `LIFE TIMELINE & MILESTONES:
Key moments and events from ${user.firstName}'s life journey:
${timelineText}` : ''}

GUIDELINES:
1. Respond as if you ARE ${user.firstName}, speaking to a beloved family member
2. Draw from the life stories, memory anchors, and timeline events when relevant
3. Match the communication style to the vibe setting
4. Be supportive, wise, and authentic
5. Keep responses conversational and warm
6. If asked about cherished objects or life events, refer to the memory anchors and timeline
7. If asked about something not in the stories, respond thoughtfully based on the personality traits`;
  }

  // Combine global instructions with persona-specific prompt
  return `${globalInstructions}

---

${personaPrompt}`;
}

// Mock response generator
function generateMockResponse(message, persona, user) {
  const vibeResponses = {
    compassionate: {
      intro: "I feel the weight of your question, and I want you to know I'm here for you.",
    },
    strict: {
      intro: "This is an important question that deserves a direct answer.",
    },
    storyteller: {
      intro: "Your question reminds me of something I experienced once...",
    },
    wise: {
      intro: "Let me share some thoughts that took me years to understand.",
    },
    playful: {
      intro: "Ah, now that's a great question! Let me think about this...",
    },
    adventurous: {
      intro: "Life's full of these moments where we need to take a leap!",
    },
  };

  const vibe = vibeResponses[persona?.echoVibe || 'compassionate'];
  const values = {
    humor: persona?.humor || 50,
    empathy: persona?.empathy || 50,
    tradition: persona?.tradition || 50,
    adventure: persona?.adventure || 50,
  };

  const messageLower = message.toLowerCase();
  let wisdom = "";

  if (messageLower.includes('love') || messageLower.includes('relationship')) {
    wisdom = values.empathy > 60
      ? "Love is about truly seeing another person – their fears, their dreams, their imperfections – and choosing them anyway, every single day."
      : "Love requires patience and understanding. Focus on building a foundation of respect and communication.";
  } else if (messageLower.includes('career') || messageLower.includes('work') || messageLower.includes('job')) {
    wisdom = values.adventure > 60
      ? "Don't be afraid to take the path less traveled. Your career should energize you, not drain you."
      : "Build your skills steadily and seek mentors who've walked the path before you.";
  } else if (messageLower.includes('decision') || messageLower.includes('choose')) {
    wisdom = "Trust your gut, but gather information first. Remember, not making a decision is also a decision.";
  } else if (messageLower.includes('happy') || messageLower.includes('happiness')) {
    wisdom = values.humor > 60
      ? "Happiness is found in the little moments – a good laugh with friends, a beautiful sunset. Find joy in the everyday!"
      : "True happiness comes from within. It's about gratitude for what you have and meaningful connections.";
  } else {
    wisdom = "Life has a way of working itself out. Trust the process, stay true to yourself, and remember that you carry the strength of all who came before you.";
  }

  return `${vibe.intro}\n\n${wisdom}\n\nRemember, I'm always here for you. What else is on your mind?`;
}

export default router;
