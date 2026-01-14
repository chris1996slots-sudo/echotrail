import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await req.prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        persona: true,
        _count: {
          select: {
            memories: true,
            timeCapsules: true,
            wisdomChats: true,
          }
        }
      }
    });

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { firstName, lastName, purpose, avatarUrl } = req.body;

    const user = await req.prisma.user.update({
      where: { id: req.user.id },
      data: {
        firstName,
        lastName,
        purpose,
        avatarUrl,
      },
      include: {
        persona: true,
      }
    });

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Update subscription
router.put('/subscription', authenticate, async (req, res) => {
  try {
    const { plan } = req.body;

    if (!['FREE', 'STANDARD', 'PREMIUM'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const user = await req.prisma.user.update({
      where: { id: req.user.id },
      data: {
        subscription: plan,
        subscribedAt: new Date(),
      }
    });

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

export default router;
