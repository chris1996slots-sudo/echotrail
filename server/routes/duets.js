import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all duets for authenticated user
router.get('/', authenticate, async (req, res) => {
  try {
    const duets = await req.prisma.echoDuet.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(duets);
  } catch (error) {
    console.error('Error fetching duets:', error);
    res.status(500).json({ error: 'Failed to fetch duets' });
  }
});

// Create new duet
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      userVideoUrl,
      userTranscript,
      userQuestion,
      title,
      topic,
    } = req.body;

    if (!userVideoUrl) {
      return res.status(400).json({ error: 'User video URL is required' });
    }

    const duet = await req.prisma.echoDuet.create({
      data: {
        userId: req.userId,
        userVideoUrl,
        userTranscript,
        userQuestion,
        title,
        topic,
        status: 'processing',
      },
    });

    // TODO: Trigger avatar video generation here
    // This would call HeyGen or similar service to generate response

    res.status(201).json(duet);
  } catch (error) {
    console.error('Error creating duet:', error);
    res.status(500).json({ error: 'Failed to create duet' });
  }
});

// Update duet (for processing completion)
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const duet = await req.prisma.echoDuet.findUnique({
      where: { id },
    });

    if (!duet || duet.userId !== req.userId) {
      return res.status(404).json({ error: 'Duet not found' });
    }

    const updated = await req.prisma.echoDuet.update({
      where: { id },
      data: req.body,
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating duet:', error);
    res.status(500).json({ error: 'Failed to update duet' });
  }
});

// Delete duet
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const duet = await req.prisma.echoDuet.findUnique({
      where: { id },
    });

    if (!duet || duet.userId !== req.userId) {
      return res.status(404).json({ error: 'Duet not found' });
    }

    await req.prisma.echoDuet.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting duet:', error);
    res.status(500).json({ error: 'Failed to delete duet' });
  }
});

// Increment view count
router.post('/:id/view', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const duet = await req.prisma.echoDuet.update({
      where: { id },
      data: {
        viewCount: { increment: 1 },
      },
    });
    res.json(duet);
  } catch (error) {
    console.error('Error incrementing view count:', error);
    res.status(500).json({ error: 'Failed to update view count' });
  }
});

export default router;
