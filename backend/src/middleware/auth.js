const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Verify JWT token
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch user from database to ensure they still exist and are active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          teamId: true,
          team: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      if (!user) {
        return res.status(401).json({ error: 'User not found.' });
      }

      if (!user.isActive) {
        return res.status(401).json({ error: 'Account has been deactivated.' });
      }

      req.user = user;
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired.', code: 'TOKEN_EXPIRED' });
      }
      return res.status(401).json({ error: 'Invalid token.' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication error.' });
  }
};

// Check for specific roles
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }

    next();
  };
};

// Check if user is a captain of a specific team
const isCaptainOf = (teamIdParam = 'teamId') => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }

    // Admins and League Officials bypass this check
    if (['ADMIN', 'LEAGUE_OFFICIAL'].includes(req.user.role)) {
      return next();
    }

    const teamId = req.params[teamIdParam] || req.body.teamId;

    if (!teamId) {
      return res.status(400).json({ error: 'Team ID required.' });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { captainId: true, coCaptainId: true }
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found.' });
    }

    if (team.captainId !== req.user.id && team.coCaptainId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. You are not a captain of this team.' });
    }

    next();
  };
};

// Check if user owns the resource or is admin
const isOwnerOrAdmin = (userIdParam = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }

    // Admins and League Officials bypass this check
    if (['ADMIN', 'LEAGUE_OFFICIAL'].includes(req.user.role)) {
      return next();
    }

    const userId = req.params[userIdParam];

    if (userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. You can only modify your own data.' });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
  isCaptainOf,
  isOwnerOrAdmin
};
