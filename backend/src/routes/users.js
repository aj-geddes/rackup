const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize, isOwnerOrAdmin } = require('../middleware/auth');
const { validate, validations } = require('../middleware/validation');
const { createAuditLog, getClientIp } = require('../middleware/logger');

const router = express.Router();
const prisma = new PrismaClient();

// Get all users (admin/league official only)
router.get('/', authenticate, authorize('ADMIN', 'LEAGUE_OFFICIAL'), async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, teamId, role } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (teamId) {
      where.teamId = teamId;
    }

    if (role) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          avatar: true,
          handicap: true,
          isActive: true,
          createdAt: true,
          team: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { lastName: 'asc' }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get user by ID
router.get('/:id', authenticate, validations.uuidParam('id'), validate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        handicap: true,
        isActive: true,
        createdAt: true,
        team: {
          select: {
            id: true,
            name: true
          }
        },
        playerStats: {
          include: {
            season: {
              select: {
                id: true,
                name: true,
                isActive: true
              }
            }
          },
          orderBy: {
            season: { startDate: 'desc' }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Update user
router.patch('/:id', authenticate, isOwnerOrAdmin('id'), validations.updateUser, validate, async (req, res, next) => {
  try {
    const { firstName, lastName, avatar, handicap } = req.body;

    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (handicap !== undefined) updateData.handicap = handicap;

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        handicap: true,
        team: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    await createAuditLog(req.user.id, 'USER_UPDATED', 'User', req.params.id, updateData, getClientIp(req));

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Update user role (admin only)
router.patch('/:id/role', authenticate, authorize('ADMIN'), validations.uuidParam('id'), validate, async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!['PLAYER', 'CAPTAIN', 'LEAGUE_OFFICIAL', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });

    await createAuditLog(req.user.id, 'ROLE_CHANGED', 'User', req.params.id, { role }, getClientIp(req));

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Deactivate user (admin only)
router.patch('/:id/deactivate', authenticate, authorize('ADMIN'), validations.uuidParam('id'), validate, async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true
      }
    });

    // Invalidate all refresh tokens for this user
    await prisma.refreshToken.deleteMany({
      where: { userId: req.params.id }
    });

    await createAuditLog(req.user.id, 'USER_DEACTIVATED', 'User', req.params.id, null, getClientIp(req));

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Reactivate user (admin only)
router.patch('/:id/activate', authenticate, authorize('ADMIN'), validations.uuidParam('id'), validate, async (req, res, next) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: true },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true
      }
    });

    await createAuditLog(req.user.id, 'USER_ACTIVATED', 'User', req.params.id, null, getClientIp(req));

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Delete user (admin only)
router.delete('/:id', authenticate, authorize('ADMIN'), validations.uuidParam('id'), validate, async (req, res, next) => {
  try {
    const userId = req.params.id;

    // Prevent deleting yourself
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete related records first
    await prisma.refreshToken.deleteMany({ where: { userId } });
    await prisma.playerStats.deleteMany({ where: { playerId: userId } });

    // Remove as captain/co-captain from teams
    await prisma.team.updateMany({
      where: { captainId: userId },
      data: { captainId: null }
    });
    await prisma.team.updateMany({
      where: { coCaptainId: userId },
      data: { coCaptainId: null }
    });

    // Delete the user
    await prisma.user.delete({ where: { id: userId } });

    await createAuditLog(req.user.id, 'USER_DELETED', 'User', userId, { email: user.email }, getClientIp(req));

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get player rankings
router.get('/rankings/:seasonId', authenticate, async (req, res, next) => {
  try {
    const { seasonId } = req.params;
    const { limit = 50 } = req.query;

    const stats = await prisma.playerStats.findMany({
      where: { seasonId },
      include: {
        player: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            team: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: [
        { wins: 'desc' },
        { runouts: 'desc' }
      ],
      take: parseInt(limit)
    });

    // Add ranking
    const rankings = stats.map((stat, index) => ({
      rank: index + 1,
      ...stat,
      winPercentage: stat.wins + stat.losses > 0
        ? (stat.wins / (stat.wins + stat.losses)).toFixed(3)
        : '.000'
    }));

    res.json(rankings);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
