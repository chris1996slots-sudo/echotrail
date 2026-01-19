import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get game progress for authenticated user
router.get('/progress', authenticate, async (req, res) => {
  try {
    let progress = await req.prisma.gameProgress.findUnique({
      where: { userId: req.userId },
    });

    // Create progress if doesn't exist
    if (!progress) {
      progress = await req.prisma.gameProgress.create({
        data: { userId: req.userId },
      });
    }

    res.json(progress);
  } catch (error) {
    console.error('Error fetching game progress:', error);
    res.status(500).json({ error: 'Failed to fetch game progress' });
  }
});

// Update game progress
router.patch('/progress', authenticate, async (req, res) => {
  try {
    const progress = await req.prisma.gameProgress.upsert({
      where: { userId: req.userId },
      update: req.body,
      create: {
        userId: req.userId,
        ...req.body,
      },
    });

    res.json(progress);
  } catch (error) {
    console.error('Error updating game progress:', error);
    res.status(500).json({ error: 'Failed to update game progress' });
  }
});

// Get game sessions
router.get('/sessions', authenticate, async (req, res) => {
  try {
    const { gameType, limit = 20 } = req.query;

    const where = { userId: req.userId };
    if (gameType) {
      where.gameType = gameType;
    }

    const sessions = await req.prisma.gameSession.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
    });

    res.json(sessions);
  } catch (error) {
    console.error('Error fetching game sessions:', error);
    res.status(500).json({ error: 'Failed to fetch game sessions' });
  }
});

// Create game session
router.post('/sessions', authenticate, async (req, res) => {
  try {
    const {
      gameType,
      difficulty,
      questionsAsked,
      correctAnswers,
      hintsUsed,
      timeSpent,
      completed,
      won,
      pointsEarned,
      gameData,
    } = req.body;

    if (!gameType) {
      return res.status(400).json({ error: 'Game type is required' });
    }

    const session = await req.prisma.gameSession.create({
      data: {
        userId: req.userId,
        gameType,
        difficulty: difficulty || 'medium',
        questionsAsked: questionsAsked || 0,
        correctAnswers: correctAnswers || 0,
        hintsUsed: hintsUsed || 0,
        timeSpent,
        completed: completed || false,
        won: won || false,
        pointsEarned: pointsEarned || 0,
        gameData: gameData ? JSON.stringify(gameData) : null,
        completedAt: completed ? new Date() : null,
      },
    });

    // Update game progress if session is completed
    if (completed) {
      const progress = await req.prisma.gameProgress.findUnique({
        where: { userId: req.userId },
      });

      if (progress) {
        const updates = {
          totalPoints: progress.totalPoints + (pointsEarned || 0),
        };

        // Update game-specific stats
        if (gameType === 'twenty_questions') {
          updates.twentyQuestionsPlayed = progress.twentyQuestionsPlayed + 1;
          if (won) {
            updates.twentyQuestionsWon = progress.twentyQuestionsWon + 1;
          }
        } else if (gameType === 'treasure_hunt') {
          if (won) {
            updates.treasureHuntsCompleted = progress.treasureHuntsCompleted + 1;
          }
        } else if (gameType === 'guess_year') {
          updates.guessTheYearPlayed = progress.guessTheYearPlayed + 1;
          if (won) {
            updates.guessTheYearCorrect = progress.guessTheYearCorrect + 1;
          }
        }

        await req.prisma.gameProgress.update({
          where: { userId: req.userId },
          data: updates,
        });
      }
    }

    res.status(201).json(session);
  } catch (error) {
    console.error('Error creating game session:', error);
    res.status(500).json({ error: 'Failed to create game session' });
  }
});

// Update game session
router.patch('/sessions/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const session = await req.prisma.gameSession.findUnique({
      where: { id },
    });

    if (!session || session.userId !== req.userId) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const updated = await req.prisma.gameSession.update({
      where: { id },
      data: {
        ...req.body,
        completedAt: req.body.completed ? new Date() : session.completedAt,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating game session:', error);
    res.status(500).json({ error: 'Failed to update game session' });
  }
});

// Get all achievements
router.get('/achievements', authenticate, async (req, res) => {
  try {
    const achievements = await req.prisma.achievement.findMany({
      orderBy: { requirementValue: 'asc' },
    });

    // Get user's progress to check which achievements are unlocked
    const progress = await req.prisma.gameProgress.findUnique({
      where: { userId: req.userId },
    });

    const achievementsWithStatus = achievements.map(achievement => ({
      ...achievement,
      unlocked: progress?.achievements.includes(achievement.key) || false,
    }));

    res.json(achievementsWithStatus);
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

// Unlock achievement
router.post('/achievements/:key/unlock', authenticate, async (req, res) => {
  try {
    const { key } = req.params;

    const achievement = await req.prisma.achievement.findUnique({
      where: { key },
    });

    if (!achievement) {
      return res.status(404).json({ error: 'Achievement not found' });
    }

    const progress = await req.prisma.gameProgress.findUnique({
      where: { userId: req.userId },
    });

    if (!progress) {
      return res.status(404).json({ error: 'Game progress not found' });
    }

    // Check if already unlocked
    if (progress.achievements.includes(key)) {
      return res.status(400).json({ error: 'Achievement already unlocked' });
    }

    // Add achievement and reward points
    const updated = await req.prisma.gameProgress.update({
      where: { userId: req.userId },
      data: {
        achievements: [...progress.achievements, key],
        totalPoints: progress.totalPoints + achievement.pointsReward,
        badgesEarned: progress.badgesEarned + 1,
      },
    });

    res.json({
      achievement,
      progress: updated,
    });
  } catch (error) {
    console.error('Error unlocking achievement:', error);
    res.status(500).json({ error: 'Failed to unlock achievement' });
  }
});

export default router;
