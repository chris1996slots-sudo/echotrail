import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// =====================
// USER NOTIFICATION ROUTES
// =====================

// Get user's notifications
router.get('/', authenticate, async (req, res) => {
  try {
    const { unreadOnly = false } = req.query;

    const where = { userId: req.userId };
    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const notifications = await req.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to last 50 notifications
    });

    // Count unread
    const unreadCount = await req.prisma.notification.count({
      where: { userId: req.userId, isRead: false }
    });

    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await req.prisma.notification.findUnique({
      where: { id }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification.userId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updated = await req.prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Mark all notifications as read
router.post('/read-all', authenticate, async (req, res) => {
  try {
    await req.prisma.notification.updateMany({
      where: {
        userId: req.userId,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to mark all as read:', error);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

// Delete notification
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await req.prisma.notification.findUnique({
      where: { id }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification.userId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await req.prisma.notification.delete({
      where: { id }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// =====================
// ADMIN NOTIFICATION ROUTES
// =====================

// Send notification to specific user(s)
router.post('/admin/send', authenticate, requireAdmin, async (req, res) => {
  try {
    const { userIds, title, message, type, category, link, actionText } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'User IDs required' });
    }

    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message required' });
    }

    // Get admin info
    const admin = await req.prisma.user.findUnique({
      where: { id: req.userId },
      select: { firstName: true, lastName: true }
    });

    // Create notifications for all users
    const notifications = await Promise.all(
      userIds.map(userId =>
        req.prisma.notification.create({
          data: {
            userId,
            title,
            message,
            type: type || 'info',
            category: category || 'admin',
            link,
            actionText,
            senderId: req.userId,
            senderName: `${admin.firstName} ${admin.lastName}`
          }
        })
      )
    );

    res.json({ success: true, count: notifications.length });
  } catch (error) {
    console.error('Failed to send notifications:', error);
    res.status(500).json({ error: 'Failed to send notifications' });
  }
});

// Send notification to all users
router.post('/admin/broadcast', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, message, type, category, link, actionText } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message required' });
    }

    // Get admin info
    const admin = await req.prisma.user.findUnique({
      where: { id: req.userId },
      select: { firstName: true, lastName: true }
    });

    // Get all user IDs
    const users = await req.prisma.user.findMany({
      where: { role: 'USER' },
      select: { id: true }
    });

    // Create notifications for all users
    const notifications = await Promise.all(
      users.map(user =>
        req.prisma.notification.create({
          data: {
            userId: user.id,
            title,
            message,
            type: type || 'announcement',
            category: category || 'admin',
            link,
            actionText,
            senderId: req.userId,
            senderName: `${admin.firstName} ${admin.lastName}`
          }
        })
      )
    );

    res.json({ success: true, count: notifications.length });
  } catch (error) {
    console.error('Failed to broadcast notifications:', error);
    res.status(500).json({ error: 'Failed to broadcast notifications' });
  }
});

// Get notification templates
router.get('/admin/templates', authenticate, requireAdmin, async (req, res) => {
  const templates = [
    {
      id: 'welcome',
      title: 'Welcome to EchoTrail!',
      message: 'Thank you for joining EchoTrail. Start building your digital legacy today by completing your persona!',
      type: 'success',
      category: 'system',
      link: '/persona',
      actionText: 'Get Started'
    },
    {
      id: 'mission_complete',
      title: 'Mission Completed! 🎉',
      message: 'Congratulations! You\'ve completed a Legacy Journey mission. Keep going to unlock more features!',
      type: 'success',
      category: 'legacy'
    },
    {
      id: 'voice_clone_ready',
      title: 'Voice Clone Ready',
      message: 'Your voice clone has been successfully created! You can now use it in Echo Simulator.',
      type: 'success',
      category: 'legacy',
      link: '/echo-sim',
      actionText: 'Try Now'
    },
    {
      id: 'avatar_ready',
      title: 'Photo Avatar Ready',
      message: 'Your photo avatar is ready! Create your first talking video now.',
      type: 'success',
      category: 'legacy',
      link: '/echo-sim',
      actionText: 'Create Video'
    },
    {
      id: 'reminder_complete_profile',
      title: 'Complete Your Legacy Journey',
      message: 'You\'re making great progress! Complete your remaining missions to reach 100% and preserve your full digital legacy.',
      type: 'info',
      category: 'legacy',
      link: '/persona',
      actionText: 'Continue'
    },
    {
      id: 'new_feature',
      title: 'New Feature Available',
      message: 'Check out our latest feature updates and improvements!',
      type: 'announcement',
      category: 'system'
    },
    {
      id: 'maintenance',
      title: 'Scheduled Maintenance',
      message: 'We will be performing scheduled maintenance on [DATE]. Some features may be temporarily unavailable.',
      type: 'warning',
      category: 'system'
    },
    {
      id: 'subscription_expiring',
      title: 'Subscription Expiring Soon',
      message: 'Your premium subscription will expire in 7 days. Renew now to keep enjoying premium features!',
      type: 'warning',
      category: 'system'
    }
  ];

  res.json(templates);
});

export default router;
