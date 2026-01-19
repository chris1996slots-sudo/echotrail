import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { callAI } from '../services/ai.js';

const router = express.Router();

// Get all wisdom cards for authenticated user
router.get('/', authenticate, async (req, res) => {
  try {
    const cards = await req.prisma.wisdomCard.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(cards);
  } catch (error) {
    console.error('Error fetching wisdom cards:', error);
    res.status(500).json({ error: 'Failed to fetch wisdom cards' });
  }
});

// Get today's wisdom card (or create one)
router.get('/today', authenticate, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if there's a card for today
    let card = await req.prisma.wisdomCard.findFirst({
      where: {
        userId: req.userId,
        shownAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // If no card for today, generate one with AI
    if (!card) {
      // Get user's persona and stories for context
      const persona = await req.prisma.persona.findUnique({
        where: { userId: req.userId },
        include: {
          lifeStories: {
            orderBy: { createdAt: 'desc' },
            take: 5, // Latest 5 stories for context
          },
        },
      });

      let title = 'Daily Wisdom';
      let message = 'Every moment is a chance to create a lasting legacy. What will you share today?';
      let quote = null;
      let wisdom = null;
      let cardStyle = 'default';
      let accentColor = 'gold';
      let category = 'inspiration';

      if (persona) {
        try {
          // Build persona context
          const personaContext = `
Name: ${persona.firstName} ${persona.lastName}
Echo Vibe: ${persona.echoVibe || 'wise and compassionate'}
Personality Traits:
- Humor: ${persona.humor}/10
- Empathy: ${persona.empathy}/10
- Tradition: ${persona.tradition}/10
- Adventure: ${persona.adventure}/10
- Wisdom: ${persona.wisdom}/10
- Creativity: ${persona.creativity}/10
- Patience: ${persona.patience}/10
- Optimism: ${persona.optimism}/10

Life Stories:
${persona.lifeStories.map(s => `- ${s.title}: ${s.content?.substring(0, 200)}`).join('\n')}
          `.trim();

          // Generate personalized wisdom with AI
          const aiResponse = await callAI({
            prisma: req.prisma,
            prompt: `You are creating a daily wisdom card for someone based on their life story and personality.

${personaContext}

Create a personalized daily wisdom card with the following components:
1. TITLE: A short, inspiring title (2-5 words)
2. MESSAGE: A meaningful message that reflects their personality and life experiences (1-3 sentences)
3. QUOTE: An optional inspiring quote or saying that fits their vibe
4. WISDOM: Additional wisdom or reflection (1-2 sentences)
5. CATEGORY: One of (inspiration, reflection, gratitude, motivation, legacy, family, growth)
6. STYLE: One of (default, vintage, modern, minimalist)
7. COLOR: One of (gold, blue, purple, green)

Format your response exactly like this:
TITLE: [title text]
MESSAGE: [message text]
QUOTE: [quote text or "none"]
WISDOM: [wisdom text or "none"]
CATEGORY: [category]
STYLE: [style]
COLOR: [color]

Make it personal, warm, and reflective of their unique journey.`,
            category: 'llm',
            maxTokens: 400,
          });

          // Parse AI response
          const text = aiResponse.text;
          const titleMatch = text.match(/TITLE:\s*(.+?)(?=\n|$)/);
          const messageMatch = text.match(/MESSAGE:\s*(.+?)(?=QUOTE:|$)/s);
          const quoteMatch = text.match(/QUOTE:\s*(.+?)(?=WISDOM:|$)/s);
          const wisdomMatch = text.match(/WISDOM:\s*(.+?)(?=CATEGORY:|$)/s);
          const categoryMatch = text.match(/CATEGORY:\s*(.+?)(?=\n|$)/);
          const styleMatch = text.match(/STYLE:\s*(.+?)(?=\n|$)/);
          const colorMatch = text.match(/COLOR:\s*(.+?)(?=\n|$)/);

          if (titleMatch) title = titleMatch[1].trim();
          if (messageMatch) message = messageMatch[1].trim();
          if (quoteMatch && !quoteMatch[1].toLowerCase().includes('none')) {
            quote = quoteMatch[1].trim();
          }
          if (wisdomMatch && !wisdomMatch[1].toLowerCase().includes('none')) {
            wisdom = wisdomMatch[1].trim();
          }
          if (categoryMatch) category = categoryMatch[1].trim().toLowerCase();
          if (styleMatch) cardStyle = styleMatch[1].trim().toLowerCase();
          if (colorMatch) accentColor = colorMatch[1].trim().toLowerCase();
        } catch (aiError) {
          console.error('AI generation failed, using fallback:', aiError);
          // If AI fails, use default values already set above
        }
      }

      // Create the card (either with AI-generated content or default values)
      card = await req.prisma.wisdomCard.create({
        data: {
          userId: req.userId,
          title,
          message,
          quote,
          wisdom,
          cardStyle,
          accentColor,
          category,
          shownAt: new Date(),
        },
      });
    }

    res.json(card);
  } catch (error) {
    console.error('Error fetching today\'s wisdom card:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s wisdom card' });
  }
});

// Generate new AI wisdom card
router.post('/generate', authenticate, async (req, res) => {
  try {
    // Get user's persona and stories for context
    const persona = await req.prisma.persona.findUnique({
      where: { userId: req.userId },
      include: {
        lifeStories: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    let title = 'Wisdom Card';
    let message = 'Every day is a new opportunity to make memories that last forever.';
    let quote = null;
    let wisdom = null;
    let cardStyle = 'default';
    let accentColor = 'gold';
    let category = 'inspiration';

    if (persona) {
      try {
        // Build persona context
        const personaContext = `
Name: ${persona.firstName} ${persona.lastName}
Echo Vibe: ${persona.echoVibe || 'wise and compassionate'}
Personality Traits:
- Humor: ${persona.humor}/10
- Empathy: ${persona.empathy}/10
- Tradition: ${persona.tradition}/10
- Adventure: ${persona.adventure}/10
- Wisdom: ${persona.wisdom}/10
- Creativity: ${persona.creativity}/10
- Patience: ${persona.patience}/10
- Optimism: ${persona.optimism}/10

Life Stories:
${persona.lifeStories.map(s => `- ${s.title}: ${s.content?.substring(0, 200)}`).join('\n')}
        `.trim();

        // Generate personalized wisdom with AI
        const aiResponse = await callAI({
        prisma: req.prisma,
        prompt: `You are creating a wisdom card for someone based on their life story and personality.

${personaContext}

Create a personalized wisdom card with the following components:
1. TITLE: A short, inspiring title (2-5 words)
2. MESSAGE: A meaningful message that reflects their personality and life experiences (1-3 sentences)
3. QUOTE: An optional inspiring quote or saying that fits their vibe
4. WISDOM: Additional wisdom or reflection (1-2 sentences)
5. CATEGORY: One of (inspiration, reflection, gratitude, motivation, legacy, family, growth)
6. STYLE: One of (default, vintage, modern, minimalist)
7. COLOR: One of (gold, blue, purple, green)

Format your response exactly like this:
TITLE: [title text]
MESSAGE: [message text]
QUOTE: [quote text or "none"]
WISDOM: [wisdom text or "none"]
CATEGORY: [category]
STYLE: [style]
COLOR: [color]

Make it personal, warm, and reflective of their unique journey.`,
        category: 'llm',
        maxTokens: 400,
      });

      // Parse AI response
      const text = aiResponse.text;
      const titleMatch = text.match(/TITLE:\s*(.+?)(?=\n|$)/);
      const messageMatch = text.match(/MESSAGE:\s*(.+?)(?=QUOTE:|$)/s);
      const quoteMatch = text.match(/QUOTE:\s*(.+?)(?=WISDOM:|$)/s);
      const wisdomMatch = text.match(/WISDOM:\s*(.+?)(?=CATEGORY:|$)/s);
      const categoryMatch = text.match(/CATEGORY:\s*(.+?)(?=\n|$)/);
      const styleMatch = text.match(/STYLE:\s*(.+?)(?=\n|$)/);
      const colorMatch = text.match(/COLOR:\s*(.+?)(?=\n|$)/);

      if (titleMatch) title = titleMatch[1].trim();
      if (messageMatch) message = messageMatch[1].trim();
      if (quoteMatch && !quoteMatch[1].toLowerCase().includes('none')) {
        quote = quoteMatch[1].trim();
      }
      if (wisdomMatch && !wisdomMatch[1].toLowerCase().includes('none')) {
        wisdom = wisdomMatch[1].trim();
      }
        if (categoryMatch) category = categoryMatch[1].trim().toLowerCase();
        if (styleMatch) cardStyle = styleMatch[1].trim().toLowerCase();
        if (colorMatch) accentColor = colorMatch[1].trim().toLowerCase();
      } catch (aiError) {
        console.error('AI generation failed in /generate, using fallback:', aiError);
        // If AI fails, use default values already set above
      }
    }

    // Create the card (either with AI-generated content or default values)
    const card = await req.prisma.wisdomCard.create({
      data: {
        userId: req.userId,
        title,
        message,
        quote,
        wisdom,
        cardStyle,
        accentColor,
        category,
        shownAt: new Date(),
      },
    });

    res.status(201).json(card);
  } catch (error) {
    console.error('Error generating wisdom card:', error);
    res.status(500).json({ error: 'Failed to generate wisdom card' });
  }
});

// Create new wisdom card
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      title,
      message,
      quote,
      wisdom,
      cardStyle,
      imageUrl,
      accentColor,
      scheduledFor,
      category,
      tags,
      triggerEvent,
      triggerDate,
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }

    const card = await req.prisma.wisdomCard.create({
      data: {
        userId: req.userId,
        title,
        message,
        quote,
        wisdom,
        cardStyle: cardStyle || 'default',
        imageUrl,
        accentColor: accentColor || 'gold',
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        category,
        tags: tags || [],
        triggerEvent,
        triggerDate: triggerDate ? new Date(triggerDate) : null,
      },
    });

    res.status(201).json(card);
  } catch (error) {
    console.error('Error creating wisdom card:', error);
    res.status(500).json({ error: 'Failed to create wisdom card' });
  }
});

// Mark card as read
router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const card = await req.prisma.wisdomCard.findUnique({
      where: { id },
    });

    if (!card || card.userId !== req.userId) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const updated = await req.prisma.wisdomCard.update({
      where: { id },
      data: {
        isRead: true,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Error marking card as read:', error);
    res.status(500).json({ error: 'Failed to mark card as read' });
  }
});

// Toggle favorite
router.patch('/:id/favorite', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const card = await req.prisma.wisdomCard.findUnique({
      where: { id },
    });

    if (!card || card.userId !== req.userId) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const updated = await req.prisma.wisdomCard.update({
      where: { id },
      data: {
        isFavorite: !card.isFavorite,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
});

// Delete wisdom card
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const card = await req.prisma.wisdomCard.findUnique({
      where: { id },
    });

    if (!card || card.userId !== req.userId) {
      return res.status(404).json({ error: 'Card not found' });
    }

    await req.prisma.wisdomCard.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting wisdom card:', error);
    res.status(500).json({ error: 'Failed to delete wisdom card' });
  }
});

export default router;
