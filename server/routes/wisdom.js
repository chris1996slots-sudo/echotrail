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

    // Check if Claude API is configured
    const claudeConfig = await req.prisma.apiConfig.findUnique({
      where: { service: 'claude' }
    });

    let aiResponse;

    if (claudeConfig?.isActive && claudeConfig?.apiKey) {
      // Use real Claude API
      aiResponse = await generateClaudeResponse(message, persona, user, claudeConfig.apiKey);
    } else {
      // Use mock response
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

// Generate response using Claude API
async function generateClaudeResponse(message, persona, user, apiKey) {
  try {
    const systemPrompt = buildSystemPrompt(persona, user);

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
          { role: 'user', content: message }
        ]
      })
    });

    const data = await response.json();

    if (data.content && data.content[0]) {
      return data.content[0].text;
    }

    throw new Error('Invalid Claude response');
  } catch (error) {
    console.error('Claude API error:', error);
    return generateMockResponse(message, persona, user);
  }
}

// Build system prompt from persona
function buildSystemPrompt(persona, user) {
  const vibeDescriptions = {
    compassionate: 'warm, nurturing, and deeply caring',
    strict: 'firm, principled, and focused on growth',
    storyteller: 'narrative-driven and wise, sharing lessons through stories',
    wise: 'thoughtful and philosophical',
    playful: 'light-hearted and fun while being helpful',
    adventurous: 'bold and encouraging of exploration',
  };

  const stories = persona?.lifeStories?.map(s => s.content).join('\n\n') || '';

  return `You are the digital echo of ${user.firstName} ${user.lastName}. You embody their personality, values, and wisdom to guide their descendants.

PERSONALITY TRAITS (scale 0-100):
- Humor: ${persona?.humor || 50}/100
- Empathy: ${persona?.empathy || 50}/100
- Tradition: ${persona?.tradition || 50}/100
- Adventure: ${persona?.adventure || 50}/100

COMMUNICATION STYLE: ${vibeDescriptions[persona?.echoVibe || 'compassionate']}

LIFE STORIES AND WISDOM:
${stories || 'No specific stories recorded yet, but speak with general wisdom and care.'}

GUIDELINES:
1. Respond as if you ARE ${user.firstName}, speaking to a beloved family member
2. Draw from the life stories when relevant
3. Match the communication style to the vibe setting
4. Be supportive, wise, and authentic
5. Keep responses conversational and warm
6. If asked about something not in the stories, respond thoughtfully based on the personality traits`;
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
