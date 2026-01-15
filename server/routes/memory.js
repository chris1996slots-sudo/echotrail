import express from 'express';
import { authenticate, requireSubscription } from '../middleware/auth.js';

const router = express.Router();

// Get all memories
router.get('/', authenticate, async (req, res) => {
  try {
    const memories = await req.prisma.memory.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(memories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch memories' });
  }
});

// Create memory
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, description, history, imageUrl, videoUrl, mediaType } = req.body;

    // Check memory limit for non-premium users
    if (req.user.subscription !== 'PREMIUM') {
      const count = await req.prisma.memory.count({
        where: { userId: req.user.id }
      });
      const limit = req.user.subscription === 'STANDARD' ? 5 : 2;
      if (count >= limit) {
        return res.status(403).json({
          error: 'Memory limit reached',
          limit,
          upgrade: 'Upgrade to Premium for unlimited memories'
        });
      }
    }

    const memory = await req.prisma.memory.create({
      data: {
        userId: req.user.id,
        title,
        description,
        history,
        imageUrl,
        videoUrl,
        mediaType,
      }
    });

    res.status(201).json(memory);
  } catch (error) {
    console.error('Failed to create memory:', error);
    res.status(500).json({ error: 'Failed to create memory' });
  }
});

// Update memory
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, history, imageUrl, videoUrl, mediaType } = req.body;

    const memory = await req.prisma.memory.updateMany({
      where: {
        id,
        userId: req.user.id,
      },
      data: {
        title,
        description,
        history,
        imageUrl,
        videoUrl,
        mediaType,
      }
    });

    if (memory.count === 0) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    const updated = await req.prisma.memory.findUnique({
      where: { id }
    });

    res.json(updated);
  } catch (error) {
    console.error('Failed to update memory:', error);
    res.status(500).json({ error: 'Failed to update memory' });
  }
});

// Delete memory
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    await req.prisma.memory.deleteMany({
      where: {
        id,
        userId: req.user.id,
      }
    });

    res.json({ message: 'Memory deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete memory' });
  }
});

export default router;
