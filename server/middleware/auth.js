import jwt from 'jsonwebtoken';

// Track last activity update times to avoid too frequent DB writes
const lastActivityUpdates = new Map();
const ACTIVITY_UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes

export const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await req.prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        subscription: true,
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;

    // Update lastActiveAt in background (non-blocking)
    // Only update if more than 5 minutes have passed since last update
    const now = Date.now();
    const lastUpdate = lastActivityUpdates.get(user.id);

    if (!lastUpdate || (now - lastUpdate) > ACTIVITY_UPDATE_INTERVAL) {
      lastActivityUpdates.set(user.id, now);

      // Update in background without blocking the request
      req.prisma.user.update({
        where: { id: user.id },
        data: { lastActiveAt: new Date() }
      }).catch(err => {
        console.error('Failed to update lastActiveAt:', err);
      });
    }

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export const requireSubscription = (minPlan = 'STANDARD') => {
  const planLevels = { FREE: 0, STANDARD: 1, PREMIUM: 2 };

  return (req, res, next) => {
    const userPlan = req.user?.subscription || 'FREE';
    if (planLevels[userPlan] < planLevels[minPlan]) {
      return res.status(403).json({
        error: 'Subscription required',
        requiredPlan: minPlan,
        currentPlan: userPlan,
      });
    }
    next();
  };
};
