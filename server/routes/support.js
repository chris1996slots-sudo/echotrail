import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Helper to check if typing is still active (within 3 seconds)
const isTypingActive = (typingAt) => {
  if (!typingAt) return false;
  return (Date.now() - new Date(typingAt).getTime()) < 3000;
};

// =====================
// PUBLIC ENDPOINTS
// =====================

// Get support avatar (public, no auth required)
router.get('/avatar', async (req, res) => {
  try {
    const setting = await req.prisma.systemSettings.findUnique({
      where: { key: 'support_avatar' }
    });

    if (setting) {
      const avatar = JSON.parse(setting.value);
      res.json(avatar);
    } else {
      res.json({ name: 'Support Team', imageUrl: null });
    }
  } catch (error) {
    console.error('Failed to get support avatar:', error);
    res.json({ name: 'Support Team', imageUrl: null });
  }
});

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

    // Mark as read by user
    await req.prisma.supportChat.update({
      where: { id: chat.id },
      data: { userLastRead: new Date() }
    });

    // Add computed typing status
    chat.isAdminTyping = isTypingActive(chat.adminTypingAt);

    res.json(chat);
  } catch (error) {
    console.error('Support chat error:', error);
    res.status(500).json({ error: 'Failed to get support chat' });
  }
});

// Poll for new messages (lightweight)
router.get('/chat/poll', authenticate, async (req, res) => {
  try {
    const { lastMessageId, lastCheck } = req.query;

    const chat = await req.prisma.supportChat.findFirst({
      where: {
        userId: req.user.id,
        status: 'open'
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          ...(lastCheck && {
            where: {
              createdAt: { gt: new Date(lastCheck) }
            }
          })
        }
      }
    });

    if (!chat) {
      return res.json({ messages: [], isAdminTyping: false });
    }

    res.json({
      messages: chat.messages,
      isAdminTyping: isTypingActive(chat.adminTypingAt),
      chatId: chat.id
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to poll messages' });
  }
});

// Set typing status
router.post('/chat/typing', authenticate, async (req, res) => {
  try {
    const chat = await req.prisma.supportChat.findFirst({
      where: {
        userId: req.user.id,
        status: 'open'
      }
    });

    if (chat) {
      await req.prisma.supportChat.update({
        where: { id: chat.id },
        data: {
          userTyping: true,
          userTypingAt: new Date()
        }
      });
    }

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update typing status' });
  }
});

// Send message as user
router.post('/chat/message', authenticate, async (req, res) => {
  try {
    const { content, imageUrl } = req.body;

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
        content: content || '',
        imageUrl: imageUrl || null,
      }
    });

    // Update chat timestamp and clear typing
    await req.prisma.supportChat.update({
      where: { id: chat.id },
      data: {
        updatedAt: new Date(),
        userTyping: false,
        userTypingAt: null
      }
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

// Get all open support chats with unread count
router.get('/admin/chats', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status = 'open' } = req.query;

    const chats = await req.prisma.supportChat.findMany({
      where: status === 'all' ? {} : { status },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: { messages: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Calculate unread count for each chat
    const chatsWithUnread = await Promise.all(chats.map(async (chat) => {
      let unreadCount = 0;
      if (chat.adminLastRead) {
        unreadCount = await req.prisma.supportMessage.count({
          where: {
            chatId: chat.id,
            sender: 'user',
            createdAt: { gt: chat.adminLastRead }
          }
        });
      } else {
        unreadCount = await req.prisma.supportMessage.count({
          where: {
            chatId: chat.id,
            sender: 'user'
          }
        });
      }
      return {
        ...chat,
        unreadCount,
        isUserTyping: isTypingActive(chat.userTypingAt)
      };
    }));

    res.json(chatsWithUnread);
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ error: 'Failed to get chats' });
  }
});

// Poll for admin overview (new chats, unread counts)
router.get('/admin/chats/poll', authenticate, requireAdmin, async (req, res) => {
  try {
    const { lastCheck } = req.query;

    // Get open chats with unread
    const openChats = await req.prisma.supportChat.findMany({
      where: { status: 'open' },
      select: {
        id: true,
        userName: true,
        userTypingAt: true,
        adminLastRead: true,
        updatedAt: true,
        _count: {
          select: { messages: true }
        }
      }
    });

    // Calculate total unread
    let totalUnread = 0;
    const chatStatuses = await Promise.all(openChats.map(async (chat) => {
      let unread = 0;
      if (chat.adminLastRead) {
        unread = await req.prisma.supportMessage.count({
          where: {
            chatId: chat.id,
            sender: 'user',
            createdAt: { gt: chat.adminLastRead }
          }
        });
      } else {
        unread = await req.prisma.supportMessage.count({
          where: { chatId: chat.id, sender: 'user' }
        });
      }
      totalUnread += unread;
      return {
        id: chat.id,
        userName: chat.userName,
        unreadCount: unread,
        isUserTyping: isTypingActive(chat.userTypingAt),
        updatedAt: chat.updatedAt
      };
    }));

    res.json({
      totalUnread,
      openChats: chatStatuses.length,
      chats: chatStatuses
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to poll' });
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

    // Mark as read by admin
    await req.prisma.supportChat.update({
      where: { id },
      data: { adminLastRead: new Date() }
    });

    chat.isUserTyping = isTypingActive(chat.userTypingAt);

    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get chat' });
  }
});

// Poll specific chat for new messages
router.get('/admin/chats/:id/poll', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { lastCheck } = req.query;

    const chat = await req.prisma.supportChat.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          ...(lastCheck && {
            where: {
              createdAt: { gt: new Date(lastCheck) }
            }
          })
        }
      }
    });

    if (!chat) {
      return res.json({ messages: [], isUserTyping: false });
    }

    // Mark as read
    await req.prisma.supportChat.update({
      where: { id },
      data: { adminLastRead: new Date() }
    });

    res.json({
      messages: chat.messages,
      isUserTyping: isTypingActive(chat.userTypingAt),
      status: chat.status
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to poll chat' });
  }
});

// Set admin typing status
router.post('/admin/chats/:id/typing', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await req.prisma.supportChat.update({
      where: { id },
      data: {
        adminTyping: true,
        adminTypingAt: new Date()
      }
    });

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update typing status' });
  }
});

// Send message as admin
router.post('/admin/chats/:id/message', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { content, imageUrl } = req.body;

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
        content: content || '',
        imageUrl: imageUrl || null,
      }
    });

    // Update chat timestamp and clear typing
    await req.prisma.supportChat.update({
      where: { id },
      data: {
        updatedAt: new Date(),
        adminTyping: false,
        adminTypingAt: null
      }
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
