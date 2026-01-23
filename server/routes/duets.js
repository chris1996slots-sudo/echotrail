import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { callAI } from '../services/ai.js';

const router = express.Router();

// Get all duets for authenticated user
router.get('/', authenticate, async (req, res) => {
  try {
    const duets = await req.prisma.echoDuet.findMany({
      where: { userId: req.user.id },
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
        userId: req.user.id,
        userVideoUrl,
        userTranscript,
        userQuestion,
        title,
        topic,
        status: 'processing',
      },
    });

    // Trigger background avatar video generation
    processAvatarResponse(req.prisma, duet.id, req.user.id).catch(err => {
      console.error('Background avatar processing failed:', err);
    });

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

    if (!duet || duet.userId !== req.user.id) {
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

    if (!duet || duet.userId !== req.user.id) {
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

// Background process to generate avatar response
async function processAvatarResponse(prisma, duetId, userId) {
  try {
    // Get user's persona for context
    const persona = await prisma.persona.findUnique({
      where: { userId },
      include: {
        lifeStories: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    const duet = await prisma.echoDuet.findUnique({
      where: { id: duetId },
    });

    if (!duet) {
      console.error('Duet not found:', duetId);
      return;
    }

    // Generate avatar response text using AI
    let responseText = 'Thank you for sharing that with me. Your story means so much.';

    if (persona) {
      const vibeDescriptions = {
        compassionate: 'warm and nurturing',
        strict: 'firm but loving',
        storyteller: 'sharing through stories',
        wise: 'thoughtful and reflective',
        playful: 'light-hearted and fun',
        adventurous: 'bold and encouraging',
      };

      const context = `
Name: ${persona.firstName} ${persona.lastName}
Personality: ${vibeDescriptions[persona.echoVibe] || 'wise and compassionate'}
Life Stories:
${persona.lifeStories.map(s => `- ${s.title}: ${s.content?.substring(0, 150)}`).join('\n')}
`.trim();

      const userMessage = duet.userTranscript || duet.userQuestion || duet.title || 'a video message';

      const aiResponse = await callAI({
        prisma,
        prompt: `You ARE ${persona.firstName} ${persona.lastName}. Someone you love has just sent you a video message, and you're responding to them.

YOUR PERSONALITY & BACKGROUND:
${context}

THEIR MESSAGE TO YOU:
"${userMessage}"

RESPOND AS ${persona.firstName.toUpperCase()}:
- Speak directly to them as yourself - use YOUR voice, YOUR way of talking
- Show that you truly listened to what they shared
- Be ${vibeDescriptions[persona.echoVibe] || 'warm and loving'} in your response
- Reference your own experiences or stories if they relate
- Keep it brief (2-4 sentences) since this will be spoken aloud
- End with something loving or encouraging

Remember: This is an intimate moment between you and your loved one. Be present, be real, be YOU.`,
        category: 'llm',
        maxTokens: 150,
      });

      responseText = aiResponse.text.trim();
    }

    // Update duet with response text
    await prisma.echoDuet.update({
      where: { id: duetId },
      data: {
        avatarResponse: responseText,
      },
    });

    // Generate HeyGen video if avatar is configured
    if (persona?.heygenAvatarId && persona?.elevenlabsVoiceId) {
      try {
        const videoResponse = await callAI({
          prisma,
          prompt: responseText,
          category: 'avatar',
          action: 'generate',
          avatarId: persona.heygenAvatarId,
          voiceId: persona.elevenlabsVoiceId,
        });

        if (videoResponse.video_id) {
          // Update duet with video ID and mark as processing
          await prisma.echoDuet.update({
            where: { id: duetId },
            data: {
              heygenVideoId: videoResponse.video_id,
            },
          });

          // Poll for video completion
          pollVideoStatus(prisma, duetId, videoResponse.video_id);
        } else {
          // No video generation, mark as completed with text only
          await prisma.echoDuet.update({
            where: { id: duetId },
            data: {
              status: 'completed',
            },
          });
        }
      } catch (videoError) {
        console.error('HeyGen video generation failed:', videoError);
        // Mark as completed with text response only
        await prisma.echoDuet.update({
          where: { id: duetId },
          data: {
            status: 'completed',
          },
        });
      }
    } else {
      // No avatar configured, mark as completed with text only
      await prisma.echoDuet.update({
        where: { id: duetId },
        data: {
          status: 'completed',
        },
      });
    }
  } catch (error) {
    console.error('Error processing avatar response:', error);
    // Mark as failed
    await prisma.echoDuet.update({
      where: { id: duetId },
      data: {
        status: 'failed',
      },
    });
  }
}

// Poll HeyGen video status until complete
async function pollVideoStatus(prisma, duetId, videoId) {
  const maxAttempts = 60; // 5 minutes max (60 * 5 seconds)
  let attempts = 0;

  const poll = async () => {
    try {
      attempts++;

      const statusResponse = await callAI({
        prisma,
        category: 'avatar',
        action: 'status',
        videoId,
      });

      if (statusResponse.status === 'completed' && statusResponse.video_url) {
        // Video is ready
        await prisma.echoDuet.update({
          where: { id: duetId },
          data: {
            avatarVideoUrl: statusResponse.video_url,
            status: 'completed',
          },
        });
        console.log(`Duet ${duetId} video completed:`, statusResponse.video_url);
        return;
      } else if (statusResponse.status === 'failed' || statusResponse.status === 'error') {
        // Video generation failed
        await prisma.echoDuet.update({
          where: { id: duetId },
          data: {
            status: 'failed',
          },
        });
        console.error(`Duet ${duetId} video generation failed`);
        return;
      } else if (attempts >= maxAttempts) {
        // Timeout
        await prisma.echoDuet.update({
          where: { id: duetId },
          data: {
            status: 'failed',
          },
        });
        console.error(`Duet ${duetId} video polling timeout`);
        return;
      }

      // Still processing, poll again in 5 seconds
      setTimeout(poll, 5000);
    } catch (error) {
      console.error('Error polling video status:', error);
      if (attempts < maxAttempts) {
        setTimeout(poll, 5000);
      } else {
        await prisma.echoDuet.update({
          where: { id: duetId },
          data: {
            status: 'failed',
          },
        });
      }
    }
  };

  // Start polling after 10 seconds (give HeyGen time to start processing)
  setTimeout(poll, 10000);
}

export default router;
