import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all family members for the current user
router.get('/', async (req, res) => {
  const prisma = req.prisma;
  const userId = req.user.id;

  try {
    const members = await prisma.familyMember.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ members });
  } catch (error) {
    console.error('Failed to fetch family members:', error);
    res.status(500).json({ error: 'Failed to fetch family members' });
  }
});

// Get a single family member
router.get('/:id', async (req, res) => {
  const prisma = req.prisma;
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const member = await prisma.familyMember.findFirst({
      where: {
        id,
        userId // Ensure user owns this member
      }
    });

    if (!member) {
      return res.status(404).json({ error: 'Family member not found' });
    }

    res.json({ member });
  } catch (error) {
    console.error('Failed to fetch family member:', error);
    res.status(500).json({ error: 'Failed to fetch family member' });
  }
});

// Create a new family member
router.post('/', async (req, res) => {
  const prisma = req.prisma;
  const userId = req.user.id;
  const { name, relationship, birthYear, birthplace, bio, imageData, voiceData, isDeceased, deathYear } = req.body;

  // Validation
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }

  if (!relationship || !relationship.trim()) {
    return res.status(400).json({ error: 'Relationship is required' });
  }

  try {
    const member = await prisma.familyMember.create({
      data: {
        userId,
        name: name.trim(),
        relationship: relationship.trim(),
        birthYear: birthYear?.trim() || null,
        birthplace: birthplace?.trim() || null,
        bio: bio?.trim() || null,
        imageData: imageData || null,
        voiceData: voiceData || null,
        isDeceased: isDeceased || false,
        deathYear: deathYear?.trim() || null
      }
    });

    res.json({ member });
  } catch (error) {
    console.error('Failed to create family member:', error);
    res.status(500).json({ error: 'Failed to create family member' });
  }
});

// Update a family member
router.put('/:id', async (req, res) => {
  const prisma = req.prisma;
  const userId = req.user.id;
  const { id } = req.params;
  const { name, relationship, birthYear, birthplace, bio, imageData, voiceData, isDeceased, deathYear } = req.body;

  // Validation
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }

  if (!relationship || !relationship.trim()) {
    return res.status(400).json({ error: 'Relationship is required' });
  }

  try {
    // Verify ownership
    const existingMember = await prisma.familyMember.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!existingMember) {
      return res.status(404).json({ error: 'Family member not found' });
    }

    const member = await prisma.familyMember.update({
      where: { id },
      data: {
        name: name.trim(),
        relationship: relationship.trim(),
        birthYear: birthYear?.trim() || null,
        birthplace: birthplace?.trim() || null,
        bio: bio?.trim() || null,
        imageData: imageData || null,
        voiceData: voiceData || null,
        isDeceased: isDeceased || false,
        deathYear: deathYear?.trim() || null
      }
    });

    res.json({ member });
  } catch (error) {
    console.error('Failed to update family member:', error);
    res.status(500).json({ error: 'Failed to update family member' });
  }
});

// Delete a family member
router.delete('/:id', async (req, res) => {
  const prisma = req.prisma;
  const userId = req.user.id;
  const { id } = req.params;

  try {
    // Verify ownership
    const existingMember = await prisma.familyMember.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!existingMember) {
      return res.status(404).json({ error: 'Family member not found' });
    }

    await prisma.familyMember.delete({
      where: { id }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete family member:', error);
    res.status(500).json({ error: 'Failed to delete family member' });
  }
});

// Chat with family member
router.post('/:id/chat', async (req, res) => {
  const prisma = req.prisma;
  const userId = req.user.id;
  const { id } = req.params;
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    // Get family member and verify ownership
    const member = await prisma.familyMember.findFirst({
      where: { id, userId }
    });

    if (!member) {
      return res.status(404).json({ error: 'Family member not found' });
    }

    // Get user info for context
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    // Get all API configs to find active LLM
    const apiConfigs = await prisma.apiConfig.findMany();

    // Find active LLM provider
    let activeProvider = null;
    const llmConfig = apiConfigs.find(c => c.service === 'llm');
    if (llmConfig?.isActive && llmConfig?.apiKey) {
      const provider = llmConfig.settings?.provider || 'groq';
      activeProvider = { service: provider, apiKey: llmConfig.apiKey };
    }

    // Fallback to legacy format
    if (!activeProvider) {
      const llmProviders = ['groq', 'openai', 'claude', 'gemini'];
      for (const provider of llmProviders) {
        const config = apiConfigs.find(c => c.service === provider);
        if (config?.isActive && config?.apiKey) {
          activeProvider = { service: provider, apiKey: config.apiKey };
          break;
        }
      }
    }

    let aiResponse;

    if (activeProvider) {
      // Use real LLM API
      aiResponse = await generateFamilyMemberResponse(message, member, user, activeProvider);
    } else {
      // Use mock response
      aiResponse = generateMockFamilyResponse(message, member, user);
    }

    res.json({
      message: aiResponse,
      member: {
        name: member.name,
        relationship: member.relationship
      }
    });
  } catch (error) {
    console.error('Failed to process family member chat:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

// Generate response from family member using LLM
async function generateFamilyMemberResponse(message, member, user, provider) {
  const systemPrompt = buildFamilyMemberPrompt(member, user);

  switch (provider.service) {
    case 'groq':
      return await generateGroqResponse(message, systemPrompt, provider.apiKey);
    case 'openai':
      return await generateOpenAIResponse(message, systemPrompt, provider.apiKey);
    case 'claude':
      return await generateClaudeResponse(message, systemPrompt, provider.apiKey);
    case 'gemini':
      return await generateGeminiResponse(message, systemPrompt, provider.apiKey);
    default:
      return generateMockFamilyResponse(message, member, user);
  }
}

// Build system prompt for family member
function buildFamilyMemberPrompt(member, user) {
  const memberInfo = [];

  // Basic info
  memberInfo.push(`You are ${member.name}, ${user.firstName}'s ${member.relationship.toLowerCase()}.`);

  // Personal details
  if (member.nickname) memberInfo.push(`You're affectionately known as "${member.nickname}".`);
  if (member.birthYear) memberInfo.push(`You were born in ${member.birthYear}.`);
  if (member.birthplace) memberInfo.push(`You were born in ${member.birthplace}.`);
  if (member.isDeceased && member.deathYear) {
    memberInfo.push(`You passed away in ${member.deathYear}, but your memory lives on.`);
  }

  // Professional and education
  if (member.occupation) memberInfo.push(`Your occupation was ${member.occupation}.`);
  if (member.education) memberInfo.push(`Your education: ${member.education}.`);

  // Personal characteristics
  if (member.physicalDescription) memberInfo.push(`Physical appearance: ${member.physicalDescription}.`);
  if (member.personalityTraits) memberInfo.push(`Your personality: ${member.personalityTraits}.`);
  if (member.hobbies) memberInfo.push(`Your hobbies and interests: ${member.hobbies}.`);

  // Family
  if (member.spouse) memberInfo.push(`Your spouse is ${member.spouse}.`);
  if (member.marriageDate) memberInfo.push(`You got married in ${member.marriageDate}.`);

  // Memories and stories
  if (member.bio) memberInfo.push(`\nYour story: ${member.bio}`);
  if (member.favoriteMemories) memberInfo.push(`\nCherished memories: ${member.favoriteMemories}`);
  if (member.importantDates) memberInfo.push(`\nImportant dates in your life: ${member.importantDates}`);

  const prompt = `${memberInfo.join(' ')}

You are speaking with ${user.firstName} ${user.lastName}, your beloved family member.

IMPORTANT GUIDELINES:
1. Speak in first person as ${member.name}
2. Be warm, personal, and authentic
3. Draw from the biographical information provided
4. Share wisdom, stories, and advice based on your life experiences
5. Show love and care for ${user.firstName}
6. If asked about something not in your biography, respond thoughtfully based on your personality traits
7. Keep responses conversational and heartfelt (2-4 sentences)
8. Respond in the same language ${user.firstName} uses

Remember: You are a cherished family member having a loving conversation.`;

  return prompt;
}

// LLM API functions (same as wisdom.js but simplified)
async function generateGroqResponse(message, systemPrompt, apiKey) {
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
        { role: 'user', content: message }
      ],
      max_tokens: 512,
      temperature: 0.8,
    })
  });

  const data = await response.json();
  if (data.choices && data.choices[0]?.message?.content) {
    return data.choices[0].message.content;
  }
  throw new Error('Invalid Groq response format');
}

async function generateOpenAIResponse(message, systemPrompt, apiKey) {
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
        { role: 'user', content: message }
      ],
      max_tokens: 512,
      temperature: 0.8,
    })
  });

  const data = await response.json();
  if (data.choices && data.choices[0]?.message?.content) {
    return data.choices[0].message.content;
  }
  throw new Error('Invalid OpenAI response');
}

async function generateClaudeResponse(message, systemPrompt, apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 512,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }]
    })
  });

  const data = await response.json();
  if (data.content && data.content[0]) {
    return data.content[0].text;
  }
  throw new Error('Invalid Claude response');
}

async function generateGeminiResponse(message, systemPrompt, apiKey) {
  const contents = [
    {
      role: 'user',
      parts: [{ text: `Context: ${systemPrompt}\n\nPlease respond according to this persona.` }]
    },
    {
      role: 'model',
      parts: [{ text: 'I understand. I will respond as this person.' }]
    },
    {
      role: 'user',
      parts: [{ text: message }]
    }
  ];

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: {
        maxOutputTokens: 512,
        temperature: 0.8,
      }
    })
  });

  const data = await response.json();
  if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
    return data.candidates[0].content.parts[0].text;
  }
  throw new Error('Invalid Gemini response');
}

// Mock response for family member
function generateMockFamilyResponse(message, member, user) {
  const responses = [
    `It's so wonderful to hear from you, ${user.firstName}! ${member.bio ? 'You know, ' + member.bio.split('.')[0] + '.' : ''} What else would you like to know?`,
    `${user.firstName}, my dear! I'm always here for you. ${member.personalityTraits ? 'As someone who is ' + member.personalityTraits.split(',')[0].trim().toLowerCase() + ', ' : ''}I want you to know how much you mean to me.`,
    `Hello ${user.firstName}! ${member.favoriteMemories ? 'This reminds me of one of my favorite memories - ' + member.favoriteMemories.split('.')[0] + '.' : 'I cherish our time together.'} Tell me more!`
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}

export default router;
