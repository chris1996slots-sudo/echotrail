import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all timeline events for authenticated user
router.get('/', authenticate, async (req, res) => {
  try {
    const events = await req.prisma.timelineEvent.findMany({
      where: { userId: req.userId },
      orderBy: { eventDate: 'asc' },
    });
    res.json(events);
  } catch (error) {
    console.error('Error fetching timeline events:', error);
    res.status(500).json({ error: 'Failed to fetch timeline events' });
  }
});

// Create new timeline event
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      title,
      description,
      eventDate,
      ageAtEvent,
      category,
      importance,
      imageUrl,
      avatarMessage,
    } = req.body;

    if (!title || !eventDate || !category) {
      return res.status(400).json({ error: 'Title, date, and category are required' });
    }

    const event = await req.prisma.timelineEvent.create({
      data: {
        userId: req.userId,
        title,
        description,
        eventDate: new Date(eventDate),
        ageAtEvent: ageAtEvent ? parseInt(ageAtEvent) : null,
        category,
        importance: importance || 3,
        imageUrl,
        avatarMessage,
      },
    });

    res.status(201).json(event);
  } catch (error) {
    console.error('Error creating timeline event:', error);
    res.status(500).json({ error: 'Failed to create timeline event' });
  }
});

// Update timeline event
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const event = await req.prisma.timelineEvent.findUnique({
      where: { id },
    });

    if (!event || event.userId !== req.userId) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const updated = await req.prisma.timelineEvent.update({
      where: { id },
      data: req.body,
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating timeline event:', error);
    res.status(500).json({ error: 'Failed to update timeline event' });
  }
});

// Delete timeline event
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const event = await req.prisma.timelineEvent.findUnique({
      where: { id },
    });

    if (!event || event.userId !== req.userId) {
      return res.status(404).json({ error: 'Event not found' });
    }

    await req.prisma.timelineEvent.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting timeline event:', error);
    res.status(500).json({ error: 'Failed to delete timeline event' });
  }
});

export default router;
