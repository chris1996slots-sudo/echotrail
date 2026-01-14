import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// =====================
// USER ENDPOINTS
// =====================

// Get or create support chat for current user
router.get('/chat', authenticate, async (req, res) => {
  try {
    let chat = await req.prisma.supportChat.findFirst({
      where: {
        userId: req.user.id,
        status: 'open'
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!chat) {
      chat = await req.prisma.supportChat.create({
        data: {
          userId: req.user.id,
          userEmail: req.user.email,
          userName: `${req.user.firstName} ${req.user.lastName}`,
        },
        include: {
          messages: true
        }
      });
    }

    res.json(chat);
  } catch (error) {
    console.error('Support chat error:', error);
    res.status(500).json({ error: 'Failed to get support chat' });
  }
});

// Send message as user
router.post('/chat/message', authenticate, async (req, res) => {
  try {
    const { content } = req.body;

    // Get or create chat
    let chat = await req.prisma.supportChat.findFirst({
      where: {
        userId: req.user.id,
        status: 'open'
      }
    });

    if (!chat) {
      chat = await req.prisma.supportChat.create({
        data: {
          userId: req.user.id,
          userEmail: req.user.email,
          userName: `${req.user.firstName} ${req.user.lastName}`,
        }
      });
    }

    const message = await req.prisma.supportMessage.create({
      data: {
        chatId: chat.id,
        sender: 'user',
        content,
      }
    });

    // Update chat timestamp
    await req.prisma.supportChat.update({
      where: { id: chat.id },
      data: { updatedAt: new Date() }
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Close user's chat
router.post('/chat/close', authenticate, async (req, res) => {
  try {
    await req.prisma.supportChat.updateMany({
      where: {
        userId: req.user.id,
        status: 'open'
      },
      data: { status: 'closed' }
    });

    res.json({ message: 'Chat closed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to close chat' });
  }
});

// =====================
// ADMIN ENDPOINTS
// =====================

// Get all open support chats
router.get('/admin/chats', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status = 'open' } = req.query;

    const chats = await req.prisma.supportChat.findMany({
      where: status === 'all' ? {} : { status },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Just get last message for preview
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get chats' });
  }
});

// Get specific chat with all messages
router.get('/admin/chats/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const chat = await req.prisma.supportChat.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get chat' });
  }
});

// Send message as admin
router.post('/admin/chats/:id/message', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const chat = await req.prisma.supportChat.findUnique({
      where: { id }
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const message = await req.prisma.supportMessage.create({
      data: {
        chatId: id,
        sender: 'admin',
        content,
      }
    });

    // Update chat timestamp
    await req.prisma.supportChat.update({
      where: { id },
      data: { updatedAt: new Date() }
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Close chat as admin
router.post('/admin/chats/:id/close', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await req.prisma.supportChat.update({
      where: { id },
      data: { status: 'closed' }
    });

    res.json({ message: 'Chat closed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to close chat' });
  }
});

// Reopen chat as admin
router.post('/admin/chats/:id/reopen', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await req.prisma.supportChat.update({
      where: { id },
      data: { status: 'open' }
    });

    res.json({ message: 'Chat reopened' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reopen chat' });
  }
});

export default router;
