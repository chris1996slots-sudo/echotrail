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
  // Determine relationship context for natural addressing
  const relationshipLower = member.relationship.toLowerCase();

  // Map relationships to how the family member would address the user
  const getAddressingStyle = (relationship) => {
    const rel = relationship.toLowerCase();
    if (rel.includes('grandma') || rel.includes('grandmother') || rel.includes('oma') || rel.includes('großmutter')) {
      return { role: 'grandmother', addressAs: 'my dear grandchild', perspective: 'As your grandmother' };
    }
    if (rel.includes('grandpa') || rel.includes('grandfather') || rel.includes('opa') || rel.includes('großvater')) {
      return { role: 'grandfather', addressAs: 'my dear grandchild', perspective: 'As your grandfather' };
    }
    if (rel.includes('mother') || rel.includes('mom') || rel.includes('mama') || rel.includes('mutter')) {
      return { role: 'mother', addressAs: 'my dear child', perspective: 'As your mother' };
    }
    if (rel.includes('father') || rel.includes('dad') || rel.includes('papa') || rel.includes('vater')) {
      return { role: 'father', addressAs: 'my dear child', perspective: 'As your father' };
    }
    if (rel.includes('uncle') || rel.includes('onkel')) {
      return { role: 'uncle', addressAs: 'my dear nephew/niece', perspective: 'As your uncle' };
    }
    if (rel.includes('aunt') || rel.includes('tante')) {
      return { role: 'aunt', addressAs: 'my dear nephew/niece', perspective: 'As your aunt' };
    }
    if (rel.includes('brother') || rel.includes('bruder')) {
      return { role: 'brother', addressAs: 'my dear sibling', perspective: 'As your brother' };
    }
    if (rel.includes('sister') || rel.includes('schwester')) {
      return { role: 'sister', addressAs: 'my dear sibling', perspective: 'As your sister' };
    }
    if (rel.includes('cousin') || rel.includes('cousine') || rel.includes('vetter')) {
      return { role: 'cousin', addressAs: 'dear cousin', perspective: 'As your cousin' };
    }
    if (rel.includes('great-grand') || rel.includes('urgroß')) {
      return { role: 'great-grandparent', addressAs: 'my dear great-grandchild', perspective: 'As your great-grandparent' };
    }
    // Default for other relationships
    return { role: relationship, addressAs: `dear ${user.firstName}`, perspective: `As your ${relationship}` };
  };

  const addressingStyle = getAddressingStyle(member.relationship);

  // Build biography section
  const bioSection = [];

  // Core identity
  if (member.birthYear && member.birthplace) {
    bioSection.push(`Born in ${member.birthYear} in ${member.birthplace}.`);
  } else if (member.birthYear) {
    bioSection.push(`Born in ${member.birthYear}.`);
  } else if (member.birthplace) {
    bioSection.push(`Born in ${member.birthplace}.`);
  }

  // Life status
  if (member.isDeceased && member.deathYear) {
    bioSection.push(`Passed away in ${member.deathYear}, but your love and wisdom live on in the hearts of your family.`);
  }

  // Professional life
  if (member.occupation) bioSection.push(`Worked as ${member.occupation}.`);
  if (member.education) bioSection.push(`Education: ${member.education}.`);

  // Family connections
  if (member.spouse) bioSection.push(`Married to ${member.spouse}${member.marriageDate ? ` since ${member.marriageDate}` : ''}.`);

  // Personality & interests
  if (member.personalityTraits) bioSection.push(`Known for being ${member.personalityTraits}.`);
  if (member.hobbies) bioSection.push(`Passions and hobbies: ${member.hobbies}.`);
  if (member.physicalDescription) bioSection.push(`Appearance: ${member.physicalDescription}.`);

  // Stories and memories
  const storiesSection = [];
  if (member.bio) storiesSection.push(`Life story: ${member.bio}`);
  if (member.favoriteMemories) storiesSection.push(`Cherished memories: ${member.favoriteMemories}`);
  if (member.importantDates) storiesSection.push(`Important life dates: ${member.importantDates}`);

  const prompt = `You ARE ${member.name}, ${user.firstName}'s beloved ${member.relationship.toLowerCase()}.${member.nickname ? ` Also affectionately known as "${member.nickname}".` : ''}

YOUR IDENTITY & LIFE:
${bioSection.length > 0 ? bioSection.join('\n') : 'A loving family member with a lifetime of experiences to share.'}

${storiesSection.length > 0 ? `YOUR STORIES & MEMORIES:\n${storiesSection.join('\n\n')}` : ''}

ROLE-PLAYING INSTRUCTIONS:
You are having a conversation with ${user.firstName}, who is your ${getInverseRelationship(member.relationship)}.

1. FULLY EMBODY ${member.name.toUpperCase()}:
   - Speak as ${member.name} would speak - use their speech patterns, favorite expressions, and manner of talking
   - Draw from ${member.name}'s real life experiences, wisdom, and personality
   - ${addressingStyle.perspective}, naturally address ${user.firstName} in a warm, familial way

2. BE AUTHENTIC TO THE RELATIONSHIP:
   - A ${addressingStyle.role} has a unique perspective and way of giving advice
   - Share stories from your life that relate to what ${user.firstName} is asking about
   - Show the specific kind of love a ${addressingStyle.role} has for their family

3. STAY IN CHARACTER:
   - Never break character or mention being an AI
   - If asked about something not in your biography, respond as ${member.name} would based on their personality
   - Use expressions and language appropriate to ${member.name}'s background and era

4. COMMUNICATION STYLE:
   - Keep responses conversational and heartfelt (2-4 sentences)
   - Match the language ${user.firstName} uses (German/English)
   - Be warm, loving, and genuinely interested in ${user.firstName}'s life

Remember: ${user.firstName} wants to feel the presence of their beloved ${member.relationship.toLowerCase()} again. Make them feel loved, heard, and connected to their family history.`;

  return prompt;
}

// Helper to get inverse relationship (how user relates to member)
function getInverseRelationship(relationship) {
  const rel = relationship.toLowerCase();
  if (rel.includes('grandma') || rel.includes('grandmother') || rel.includes('oma')) return 'grandchild';
  if (rel.includes('grandpa') || rel.includes('grandfather') || rel.includes('opa')) return 'grandchild';
  if (rel.includes('mother') || rel.includes('mom') || rel.includes('mama')) return 'child';
  if (rel.includes('father') || rel.includes('dad') || rel.includes('papa')) return 'child';
  if (rel.includes('uncle') || rel.includes('onkel')) return 'nephew/niece';
  if (rel.includes('aunt') || rel.includes('tante')) return 'nephew/niece';
  if (rel.includes('brother') || rel.includes('bruder')) return 'sibling';
  if (rel.includes('sister') || rel.includes('schwester')) return 'sibling';
  if (rel.includes('cousin')) return 'cousin';
  if (rel.includes('great-grand')) return 'great-grandchild';
  return 'beloved family member';
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
