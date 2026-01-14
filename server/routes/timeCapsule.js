import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all time capsules
router.get('/', authenticate, async (req, res) => {
  try {
    const capsules = await req.prisma.timeCapsule.findMany({
      where: { userId: req.user.id },
      orderBy: { deliveryDate: 'asc' }
    });

    // Update status for past-due capsules
    const now = new Date();
    for (const capsule of capsules) {
      if (capsule.status === 'sealed' && new Date(capsule.deliveryDate) <= now) {
        await req.prisma.timeCapsule.update({
          where: { id: capsule.id },
          data: { status: 'delivered' }
        });
        capsule.status = 'delivered';
      }
    }

    res.json(capsules);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch time capsules' });
  }
});

// Create time capsule
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, occasion, recipient, message, deliveryDate } = req.body;

    // Check limit for non-premium users
    if (req.user.subscription !== 'PREMIUM') {
      const count = await req.prisma.timeCapsule.count({
        where: { userId: req.user.id }
      });
      const limit = req.user.subscription === 'STANDARD' ? 1 : 0;
      if (count >= limit) {
        return res.status(403).json({
          error: 'Time capsule limit reached',
          limit,
          upgrade: 'Upgrade to Premium for unlimited time capsules'
        });
      }
    }

    const capsule = await req.prisma.timeCapsule.create({
      data: {
        userId: req.user.id,
        title,
        occasion,
        recipient,
        message,
        deliveryDate: new Date(deliveryDate),
        status: new Date(deliveryDate) > new Date() ? 'sealed' : 'delivered',
      }
    });

    res.status(201).json(capsule);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create time capsule' });
  }
});

// Update time capsule
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, occasion, recipient, message, deliveryDate } = req.body;

    const capsule = await req.prisma.timeCapsule.updateMany({
      where: {
        id,
        userId: req.user.id,
      },
      data: {
        title,
        occasion,
        recipient,
        message,
        deliveryDate: new Date(deliveryDate),
        status: new Date(deliveryDate) > new Date() ? 'sealed' : 'delivered',
      }
    });

    if (capsule.count === 0) {
      return res.status(404).json({ error: 'Time capsule not found' });
    }

    const updated = await req.prisma.timeCapsule.findUnique({
      where: { id }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update time capsule' });
  }
});

// Delete time capsule
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    await req.prisma.timeCapsule.deleteMany({
      where: {
        id,
        userId: req.user.id,
      }
    });

    res.json({ message: 'Time capsule deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete time capsule' });
  }
});

export default router;
