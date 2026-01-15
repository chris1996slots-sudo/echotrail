import express from 'express';
import { authenticate } from '../middleware/auth.js';
import crypto from 'crypto';

const router = express.Router();

// Generate a unique referral code
function generateReferralCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

// Get referral settings (public)
async function getReferralSettings(prisma) {
  const setting = await prisma.systemSettings.findUnique({
    where: { key: 'referral_settings' }
  });

  return setting?.value ? JSON.parse(setting.value) : {
    enabled: true,
    referrerReward: 5.00,
    refereeReward: 5.00,
    minPurchaseAmount: 20.00,
    rewardType: 'tokens',
    expirationDays: 30,
    maxReferralsPerUser: 0,
  };
}

// Get user's referral info
router.get('/my-referral', authenticate, async (req, res) => {
  try {
    const settings = await getReferralSettings(req.prisma);

    if (!settings.enabled) {
      return res.json({
        enabled: false,
        message: 'Referral program is currently disabled'
      });
    }

    let user = await req.prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        referralCode: true,
        tokenBalance: true,
        referredBy: true
      }
    });

    // Generate referral code if user doesn't have one
    if (!user.referralCode) {
      let code = generateReferralCode();
      // Ensure uniqueness
      let exists = await req.prisma.user.findUnique({ where: { referralCode: code } });
      while (exists) {
        code = generateReferralCode();
        exists = await req.prisma.user.findUnique({ where: { referralCode: code } });
      }

      user = await req.prisma.user.update({
        where: { id: req.user.id },
        data: { referralCode: code },
        select: {
          id: true,
          referralCode: true,
          tokenBalance: true,
          referredBy: true
        }
      });
    }

    // Get user's referral stats
    const [totalReferrals, successfulReferrals, pendingReferrals] = await Promise.all([
      req.prisma.referral.count({ where: { referrerId: req.user.id } }),
      req.prisma.referral.count({ where: { referrerId: req.user.id, status: 'completed' } }),
      req.prisma.referral.count({ where: { referrerId: req.user.id, status: 'pending' } }),
    ]);

    // Calculate total earnings from referrals
    const completedReferrals = await req.prisma.referral.findMany({
      where: { referrerId: req.user.id, status: 'completed' },
      select: { referrerReward: true }
    });
    const totalEarned = completedReferrals.reduce((sum, r) => sum + (r.referrerReward || 0), 0);

    // Check max referrals limit
    const canRefer = settings.maxReferralsPerUser === 0 ||
      totalReferrals < settings.maxReferralsPerUser;

    res.json({
      enabled: true,
      referralCode: user.referralCode,
      referralLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/register?ref=${user.referralCode}`,
      tokenBalance: user.tokenBalance,
      stats: {
        totalReferrals,
        successfulReferrals,
        pendingReferrals,
        totalEarned
      },
      rewards: {
        referrerReward: settings.referrerReward,
        refereeReward: settings.refereeReward,
        minPurchaseAmount: settings.minPurchaseAmount
      },
      canRefer,
      maxReferrals: settings.maxReferralsPerUser
    });
  } catch (error) {
    console.error('Referral info error:', error);
    res.status(500).json({ error: 'Failed to get referral info' });
  }
});

// Get user's referral history
router.get('/my-referrals', authenticate, async (req, res) => {
  try {
    const referrals = await req.prisma.referral.findMany({
      where: { referrerId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    // Get referee info for completed referrals
    const refereeIds = referrals.filter(r => r.refereeId).map(r => r.refereeId);
    const referees = await req.prisma.user.findMany({
      where: { id: { in: refereeIds } },
      select: { id: true, firstName: true, lastName: true }
    });

    const refereeMap = referees.reduce((acc, u) => {
      acc[u.id] = `${u.firstName} ${u.lastName?.charAt(0) || ''}.`;
      return acc;
    }, {});

    const enrichedReferrals = referrals.map(r => ({
      id: r.id,
      status: r.status,
      refereeEmail: r.refereeEmail ? r.refereeEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3') : null,
      refereeName: r.refereeId ? refereeMap[r.refereeId] : null,
      reward: r.referrerReward,
      createdAt: r.createdAt,
      completedAt: r.completedAt,
      expiresAt: r.expiresAt
    }));

    res.json(enrichedReferrals);
  } catch (error) {
    console.error('Referral history error:', error);
    res.status(500).json({ error: 'Failed to get referral history' });
  }
});

// Validate a referral code (used during registration)
router.get('/validate/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const settings = await getReferralSettings(req.prisma);

    if (!settings.enabled) {
      return res.json({ valid: false, message: 'Referral program is disabled' });
    }

    const referrer = await req.prisma.user.findUnique({
      where: { referralCode: code.toUpperCase() },
      select: { id: true, firstName: true }
    });

    if (!referrer) {
      return res.json({ valid: false, message: 'Invalid referral code' });
    }

    res.json({
      valid: true,
      referrerName: referrer.firstName,
      refereeReward: settings.refereeReward,
      message: `You'll receive €${settings.refereeReward} after your first qualifying purchase!`
    });
  } catch (error) {
    console.error('Validate referral error:', error);
    res.status(500).json({ valid: false, message: 'Failed to validate code' });
  }
});

// Apply referral during registration (called internally by auth routes)
export async function applyReferralCode(prisma, referralCode, newUserId, newUserEmail) {
  try {
    const settings = await getReferralSettings(prisma);

    if (!settings.enabled || !referralCode) {
      return null;
    }

    const referrer = await prisma.user.findUnique({
      where: { referralCode: referralCode.toUpperCase() }
    });

    if (!referrer) {
      return null;
    }

    // Check max referrals limit
    if (settings.maxReferralsPerUser > 0) {
      const count = await prisma.referral.count({
        where: { referrerId: referrer.id }
      });
      if (count >= settings.maxReferralsPerUser) {
        return null;
      }
    }

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + settings.expirationDays);

    // Create referral record
    const referral = await prisma.referral.create({
      data: {
        referrerId: referrer.id,
        refereeId: newUserId,
        refereeEmail: newUserEmail,
        code: `${referralCode}-${Date.now()}`,
        status: 'pending',
        referrerReward: settings.referrerReward,
        refereeReward: settings.refereeReward,
        expiresAt
      }
    });

    // Update new user with referredBy
    await prisma.user.update({
      where: { id: newUserId },
      data: { referredBy: referrer.id }
    });

    return referral;
  } catch (error) {
    console.error('Apply referral error:', error);
    return null;
  }
}

// Complete referral (called when user makes qualifying purchase)
export async function completeReferral(prisma, userId) {
  try {
    const settings = await getReferralSettings(prisma);

    // Find pending referral for this user
    const referral = await prisma.referral.findFirst({
      where: {
        refereeId: userId,
        status: 'pending',
        expiresAt: { gt: new Date() }
      }
    });

    if (!referral) {
      return null;
    }

    // Update referral status
    await prisma.referral.update({
      where: { id: referral.id },
      data: {
        status: 'completed',
        completedAt: new Date()
      }
    });

    // Credit both users
    await Promise.all([
      // Credit referrer
      prisma.user.update({
        where: { id: referral.referrerId },
        data: {
          tokenBalance: { increment: referral.referrerReward }
        }
      }),
      // Credit referee
      prisma.user.update({
        where: { id: userId },
        data: {
          tokenBalance: { increment: referral.refereeReward }
        }
      })
    ]);

    return {
      referrerReward: referral.referrerReward,
      refereeReward: referral.refereeReward
    };
  } catch (error) {
    console.error('Complete referral error:', error);
    return null;
  }
}

export default router;
