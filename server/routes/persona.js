import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get persona
router.get('/', authenticate, async (req, res) => {
  try {
    let persona = await req.prisma.persona.findUnique({
      where: { userId: req.user.id },
      include: {
        lifeStories: {
          orderBy: { createdAt: 'desc' }
        },
        avatarImages: {
          orderBy: { createdAt: 'asc' }
        },
        voiceSamples: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!persona) {
      persona = await req.prisma.persona.create({
        data: {
          userId: req.user.id,
        },
        include: {
          lifeStories: true,
          avatarImages: true,
          voiceSamples: true,
        }
      });
    }

    res.json(persona);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch persona' });
  }
});

// Get legacy journey progress
router.get('/legacy-progress', authenticate, async (req, res) => {
  try {
    const progress = await calculateLegacyProgress(req.user.id, req.prisma);
    res.json(progress);
  } catch (error) {
    console.error('Failed to calculate legacy progress:', error);
    res.status(500).json({ error: 'Failed to calculate legacy progress' });
  }
});

// Update values
router.put('/values', authenticate, async (req, res) => {
  try {
    const { humor, empathy, tradition, adventure, wisdom, creativity, patience, optimism, coreValues, lifePhilosophy } = req.body;

    const clamp = (val) => Math.max(0, Math.min(100, val));

    const persona = await req.prisma.persona.update({
      where: { userId: req.user.id },
      data: {
        ...(humor !== undefined && { humor: clamp(humor) }),
        ...(empathy !== undefined && { empathy: clamp(empathy) }),
        ...(tradition !== undefined && { tradition: clamp(tradition) }),
        ...(adventure !== undefined && { adventure: clamp(adventure) }),
        ...(wisdom !== undefined && { wisdom: clamp(wisdom) }),
        ...(creativity !== undefined && { creativity: clamp(creativity) }),
        ...(patience !== undefined && { patience: clamp(patience) }),
        ...(optimism !== undefined && { optimism: clamp(optimism) }),
        ...(coreValues !== undefined && { coreValues }),
        ...(lifePhilosophy !== undefined && { lifePhilosophy }),
      }
    });

    res.json(persona);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update values' });
  }
});

// Update echo vibe
router.put('/vibe', authenticate, async (req, res) => {
  try {
    const { echoVibe } = req.body;

    const validVibes = ['compassionate', 'strict', 'storyteller', 'wise', 'playful', 'adventurous'];
    if (!validVibes.includes(echoVibe)) {
      return res.status(400).json({ error: 'Invalid vibe' });
    }

    const persona = await req.prisma.persona.update({
      where: { userId: req.user.id },
      data: { echoVibe }
    });

    res.json(persona);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update vibe' });
  }
});

// Add life story
router.post('/stories', authenticate, async (req, res) => {
  try {
    const { category, content, questionId, chapterId, chapterTitle, question } = req.body;

    const persona = await req.prisma.persona.findUnique({
      where: { userId: req.user.id }
    });

    const story = await req.prisma.lifeStory.create({
      data: {
        personaId: persona.id,
        category,
        content,
        questionId,
        chapterId,
        chapterTitle,
        question,
      }
    });

    // Update legacy score
    await updateLegacyScore(req.prisma, req.user.id);

    res.status(201).json(story);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add story' });
  }
});

// Delete life story
router.delete('/stories/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const persona = await req.prisma.persona.findUnique({
      where: { userId: req.user.id }
    });

    await req.prisma.lifeStory.deleteMany({
      where: {
        id,
        personaId: persona.id,
      }
    });

    await updateLegacyScore(req.prisma, req.user.id);

    res.json({ message: 'Story deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete story' });
  }
});

// Update life story
router.put('/stories/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const persona = await req.prisma.persona.findUnique({
      where: { userId: req.user.id }
    });

    // Verify story belongs to user's persona
    const existingStory = await req.prisma.lifeStory.findFirst({
      where: { id, personaId: persona.id }
    });

    if (!existingStory) {
      return res.status(404).json({ error: 'Story not found' });
    }

    const story = await req.prisma.lifeStory.update({
      where: { id },
      data: { content }
    });

    res.json(story);
  } catch (error) {
    console.error('Update story error:', error);
    res.status(500).json({ error: 'Failed to update story' });
  }
});

// =====================
// AVATAR IMAGES
// =====================

// Upload avatar image
router.post('/avatar', authenticate, async (req, res) => {
  try {
    const { imageData, label, setActive } = req.body;

    const persona = await req.prisma.persona.findUnique({
      where: { userId: req.user.id }
    });

    // Count existing images
    const count = await req.prisma.avatarImage.count({
      where: { personaId: persona.id }
    });

    if (count >= 10) {
      return res.status(400).json({ error: 'Maximum 10 avatar images allowed' });
    }

    // If setActive or first image, deactivate others
    if (setActive || count === 0) {
      await req.prisma.avatarImage.updateMany({
        where: { personaId: persona.id },
        data: { isActive: false }
      });
    }

    const { echoVibe } = req.body;

    const avatarImage = await req.prisma.avatarImage.create({
      data: {
        personaId: persona.id,
        imageData,
        label: label || `Photo ${count + 1}`,
        isActive: setActive || count === 0,
        echoVibe: echoVibe || 'compassionate',
      }
    });

    res.status(201).json(avatarImage);
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

// Update avatar image
router.put('/avatar/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { label, isActive, echoVibe } = req.body;

    const persona = await req.prisma.persona.findUnique({
      where: { userId: req.user.id }
    });

    // If setting active, deactivate others first
    if (isActive) {
      await req.prisma.avatarImage.updateMany({
        where: { personaId: persona.id },
        data: { isActive: false }
      });
    }

    const avatarImage = await req.prisma.avatarImage.update({
      where: { id },
      data: {
        ...(label !== undefined && { label }),
        ...(isActive !== undefined && { isActive }),
        ...(echoVibe !== undefined && { echoVibe }),
      }
    });

    res.json(avatarImage);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update avatar' });
  }
});

// Delete avatar image
router.delete('/avatar/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const persona = await req.prisma.persona.findUnique({
      where: { userId: req.user.id }
    });

    const image = await req.prisma.avatarImage.findUnique({
      where: { id }
    });

    if (!image || image.personaId !== persona.id) {
      return res.status(404).json({ error: 'Avatar not found' });
    }

    await req.prisma.avatarImage.delete({
      where: { id }
    });

    // If deleted was active, make another one active
    if (image.isActive) {
      const firstRemaining = await req.prisma.avatarImage.findFirst({
        where: { personaId: persona.id }
      });
      if (firstRemaining) {
        await req.prisma.avatarImage.update({
          where: { id: firstRemaining.id },
          data: { isActive: true }
        });
      }
    }

    res.json({ message: 'Avatar deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete avatar' });
  }
});

// Update avatar settings (style, background, setup complete flag)
router.put('/avatar-settings', authenticate, async (req, res) => {
  try {
    const { avatarStyle, backgroundType, avatarSetupComplete } = req.body;

    const persona = await req.prisma.persona.update({
      where: { userId: req.user.id },
      data: {
        ...(avatarStyle && { avatarStyle }),
        ...(backgroundType && { backgroundType }),
        ...(avatarSetupComplete !== undefined && { avatarSetupComplete }),
      }
    });

    res.json(persona);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update avatar settings' });
  }
});

// =====================
// VOICE SAMPLES
// =====================

// Get all voice samples
router.get('/voice-samples', authenticate, async (req, res) => {
  try {
    const persona = await req.prisma.persona.findUnique({
      where: { userId: req.user.id }
    });

    if (!persona) {
      return res.json([]);
    }

    const samples = await req.prisma.voiceSample.findMany({
      where: { personaId: persona.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json(samples);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch voice samples' });
  }
});

// Upload voice sample
router.post('/voice-samples', authenticate, async (req, res) => {
  try {
    const { audioData, label, duration, prompt } = req.body;

    if (!audioData) {
      return res.status(400).json({ error: 'Audio data is required' });
    }

    const persona = await req.prisma.persona.findUnique({
      where: { userId: req.user.id }
    });

    if (!persona) {
      return res.status(404).json({ error: 'Persona not found' });
    }

    // Limit voice samples (max 5)
    const count = await req.prisma.voiceSample.count({
      where: { personaId: persona.id }
    });

    if (count >= 5) {
      return res.status(400).json({ error: 'Maximum 5 voice samples allowed. Delete some to add more.' });
    }

    const voiceSample = await req.prisma.voiceSample.create({
      data: {
        personaId: persona.id,
        audioData,
        label: label || `Recording ${count + 1}`,
        duration: duration || 0,
        prompt,
      }
    });

    res.status(201).json(voiceSample);
  } catch (error) {
    console.error('Failed to upload voice sample:', error);
    res.status(500).json({ error: 'Failed to upload voice sample' });
  }
});

// Update voice sample label
router.put('/voice-samples/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { label } = req.body;

    const persona = await req.prisma.persona.findUnique({
      where: { userId: req.user.id }
    });

    const sample = await req.prisma.voiceSample.findUnique({
      where: { id }
    });

    if (!sample || sample.personaId !== persona.id) {
      return res.status(404).json({ error: 'Voice sample not found' });
    }

    const updated = await req.prisma.voiceSample.update({
      where: { id },
      data: { label }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update voice sample' });
  }
});

// Delete voice sample
router.delete('/voice-samples/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const persona = await req.prisma.persona.findUnique({
      where: { userId: req.user.id }
    });

    const sample = await req.prisma.voiceSample.findUnique({
      where: { id }
    });

    if (!sample || sample.personaId !== persona.id) {
      return res.status(404).json({ error: 'Voice sample not found' });
    }

    await req.prisma.voiceSample.delete({
      where: { id }
    });

    res.json({ message: 'Voice sample deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete voice sample' });
  }
});

// Helper to update legacy score - Mission-based system
async function updateLegacyScore(prisma, userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      persona: {
        include: {
          lifeStories: true,
          avatarImages: true,
          voiceSamples: true
        }
      },
      memories: true,
      timeCapsules: true,
    }
  });

  let score = 0;
  const missions = {};

  // Mission 1: Complete Basic Profile (10%) - Auto-complete on registration
  const hasProfile = user.persona !== null;
  missions.basicProfile = hasProfile;
  if (hasProfile) score += 10;

  // Mission 2: Set Personality Values (10%) - Customize at least one value from default
  const defaultValue = 50;
  const hasCustomValues = user.persona && [
    user.persona.humor,
    user.persona.empathy,
    user.persona.tradition,
    user.persona.adventure,
    user.persona.wisdom,
    user.persona.creativity,
    user.persona.patience,
    user.persona.optimism
  ].some(v => v !== defaultValue);
  missions.personalityValues = hasCustomValues;
  if (hasCustomValues) score += 10;

  // Mission 3: Choose Echo Vibe (10%)
  const hasEchoVibe = user.persona?.echoVibe && user.persona.echoVibe !== 'compassionate';
  missions.echoVibe = hasEchoVibe;
  if (hasEchoVibe) score += 10;

  // Mission 4: Complete All Life Stories (20%) - All 5 categories
  // Categories: Childhood, Education, Career, Relationships, Life Lessons
  const lifeStoryCategories = user.persona?.lifeStories?.map(s => s.category) || [];
  const uniqueCategories = new Set(lifeStoryCategories);
  const allCategoriesComplete = uniqueCategories.size >= 5;
  missions.lifeStories = allCategoriesComplete;
  if (allCategoriesComplete) score += 20;

  // Mission 5: Upload Photo Avatar (15%)
  const hasPhotoAvatar = (user.persona?.avatarImages?.length || 0) > 0;
  missions.photoAvatar = hasPhotoAvatar;
  if (hasPhotoAvatar) score += 15;

  // Mission 6: Create Voice Clone (15%)
  const hasVoiceClone = user.persona?.elevenlabsVoiceId !== null;
  missions.voiceClone = hasVoiceClone;
  if (hasVoiceClone) score += 15;

  // Mission 7: Add Memories (10%) - At least 3 memories
  const hasMemories = (user.memories?.length || 0) >= 3;
  missions.memories = hasMemories;
  if (hasMemories) score += 10;

  // Mission 8: Create Time Capsule (10%) - At least 1 capsule
  const hasTimeCapsule = (user.timeCapsules?.length || 0) >= 1;
  missions.timeCapsule = hasTimeCapsule;
  if (hasTimeCapsule) score += 10;

  score = Math.min(score, 100);

  await prisma.persona.update({
    where: { userId },
    data: { legacyScore: score }
  });

  return { score, missions };
}

export default router;
