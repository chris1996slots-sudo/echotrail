import express from 'express';
import { authenticate } from '../middleware/auth.js';

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

    // If no card for today, generate one
    if (!card) {
      // TODO: Use AI to generate personalized wisdom based on user's persona
      // For now, create a simple motivational card
      card = await req.prisma.wisdomCard.create({
        data: {
          userId: req.userId,
          title: 'Daily Wisdom',
          message: 'Every moment is a chance to create a lasting legacy. What will you share today?',
          category: 'inspiration',
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
