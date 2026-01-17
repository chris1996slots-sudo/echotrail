import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all family members for the current user
router.get('/', async (req, res) => {
  const prisma = req.prisma;
  const userId = req.user.id;

  try {
    const members = await prisma.familyMember.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ members });
  } catch (error) {
    console.error('Failed to fetch family members:', error);
    res.status(500).json({ error: 'Failed to fetch family members' });
  }
});

// Get a single family member
router.get('/:id', async (req, res) => {
  const prisma = req.prisma;
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const member = await prisma.familyMember.findFirst({
      where: {
        id,
        userId // Ensure user owns this member
      }
    });

    if (!member) {
      return res.status(404).json({ error: 'Family member not found' });
    }

    res.json({ member });
  } catch (error) {
    console.error('Failed to fetch family member:', error);
    res.status(500).json({ error: 'Failed to fetch family member' });
  }
});

// Create a new family member
router.post('/', async (req, res) => {
  const prisma = req.prisma;
  const userId = req.user.id;
  const { name, relationship, birthYear, birthplace, bio, imageData, voiceData, isDeceased, deathYear } = req.body;

  // Validation
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }

  if (!relationship || !relationship.trim()) {
    return res.status(400).json({ error: 'Relationship is required' });
  }

  try {
    const member = await prisma.familyMember.create({
      data: {
        userId,
        name: name.trim(),
        relationship: relationship.trim(),
        birthYear: birthYear?.trim() || null,
        birthplace: birthplace?.trim() || null,
        bio: bio?.trim() || null,
        imageData: imageData || null,
        voiceData: voiceData || null,
        isDeceased: isDeceased || false,
        deathYear: deathYear?.trim() || null
      }
    });

    res.json({ member });
  } catch (error) {
    console.error('Failed to create family member:', error);
    res.status(500).json({ error: 'Failed to create family member' });
  }
});

// Update a family member
router.put('/:id', async (req, res) => {
  const prisma = req.prisma;
  const userId = req.user.id;
  const { id } = req.params;
  const { name, relationship, birthYear, birthplace, bio, imageData, voiceData, isDeceased, deathYear } = req.body;

  // Validation
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }

  if (!relationship || !relationship.trim()) {
    return res.status(400).json({ error: 'Relationship is required' });
  }

  try {
    // Verify ownership
    const existingMember = await prisma.familyMember.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!existingMember) {
      return res.status(404).json({ error: 'Family member not found' });
    }

    const member = await prisma.familyMember.update({
      where: { id },
      data: {
        name: name.trim(),
        relationship: relationship.trim(),
        birthYear: birthYear?.trim() || null,
        birthplace: birthplace?.trim() || null,
        bio: bio?.trim() || null,
        imageData: imageData || null,
        voiceData: voiceData || null,
        isDeceased: isDeceased || false,
        deathYear: deathYear?.trim() || null
      }
    });

    res.json({ member });
  } catch (error) {
    console.error('Failed to update family member:', error);
    res.status(500).json({ error: 'Failed to update family member' });
  }
});

// Delete a family member
router.delete('/:id', async (req, res) => {
  const prisma = req.prisma;
  const userId = req.user.id;
  const { id } = req.params;

  try {
    // Verify ownership
    const existingMember = await prisma.familyMember.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!existingMember) {
      return res.status(404).json({ error: 'Family member not found' });
    }

    await prisma.familyMember.delete({
      where: { id }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete family member:', error);
    res.status(500).json({ error: 'Failed to delete family member' });
  }
});

export default router;
