const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize, isCaptainOf } = require('../middleware/auth');
const { validate, validations } = require('../middleware/validation');
const { createAuditLog, getClientIp } = require('../middleware/logger');

const router = express.Router();
const prisma = new PrismaClient();

// Get all teams
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { seasonId } = req.query;

    const where = {};
    if (seasonId) {
      where.seasonId = seasonId;
    }

    const teams = await prisma.team.findMany({
      where,
      include: {
        captain: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        coCaptain: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        season: {
          select: {
            id: true,
            name: true,
            isActive: true
          }
        },
        standings: true,
        _count: {
          select: { members: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json(teams);
  } catch (error) {
    next(error);
  }
});

// Get team by ID
router.get('/:id', authenticate, validations.uuidParam('id'), validate, async (req, res, next) => {
  try {
    const team = await prisma.team.findUnique({
      where: { id: req.params.id },
      include: {
        captain: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            handicap: true
          }
        },
        coCaptain: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            handicap: true
          }
        },
        members: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            handicap: true,
            role: true,
            playerStats: {
              where: {
                season: { isActive: true }
              }
            }
          }
        },
        season: {
          select: {
            id: true,
            name: true,
            isActive: true
          }
        },
        standings: true,
        homeMatches: {
          include: {
            awayTeam: { select: { id: true, name: true } },
            venue: { select: { id: true, name: true } }
          },
          orderBy: { date: 'desc' },
          take: 5
        },
        awayMatches: {
          include: {
            homeTeam: { select: { id: true, name: true } },
            venue: { select: { id: true, name: true } }
          },
          orderBy: { date: 'desc' },
          take: 5
        }
      }
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    res.json(team);
  } catch (error) {
    next(error);
  }
});

// Create team (admin/league official only)
router.post('/', authenticate, authorize('ADMIN', 'LEAGUE_OFFICIAL'), validations.createTeam, validate, async (req, res, next) => {
  try {
    const { name, seasonId, captainId, coCaptainId, logo } = req.body;

    // Verify season exists
    const season = await prisma.season.findUnique({ where: { id: seasonId } });
    if (!season) {
      return res.status(404).json({ error: 'Season not found' });
    }

    const team = await prisma.team.create({
      data: {
        name,
        seasonId,
        captainId,
        coCaptainId,
        logo
      },
      include: {
        captain: { select: { id: true, firstName: true, lastName: true } },
        coCaptain: { select: { id: true, firstName: true, lastName: true } },
        season: { select: { id: true, name: true } }
      }
    });

    // Create initial standing for the team
    await prisma.standing.create({
      data: {
        teamId: team.id,
        seasonId
      }
    });

    // Update captain/co-captain roles and team assignment
    if (captainId) {
      await prisma.user.update({
        where: { id: captainId },
        data: { role: 'CAPTAIN', teamId: team.id }
      });
    }

    if (coCaptainId) {
      await prisma.user.update({
        where: { id: coCaptainId },
        data: { role: 'CAPTAIN', teamId: team.id }
      });
    }

    await createAuditLog(req.user.id, 'TEAM_CREATED', 'Team', team.id, { name }, getClientIp(req));

    res.status(201).json(team);
  } catch (error) {
    next(error);
  }
});

// Update team
router.patch('/:id', authenticate, isCaptainOf('id'), validations.updateTeam, validate, async (req, res, next) => {
  try {
    const { name, logo, captainId, coCaptainId } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (logo !== undefined) updateData.logo = logo;
    if (captainId !== undefined) updateData.captainId = captainId;
    if (coCaptainId !== undefined) updateData.coCaptainId = coCaptainId;

    const team = await prisma.team.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        captain: { select: { id: true, firstName: true, lastName: true } },
        coCaptain: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    await createAuditLog(req.user.id, 'TEAM_UPDATED', 'Team', req.params.id, updateData, getClientIp(req));

    res.json(team);
  } catch (error) {
    next(error);
  }
});

// Add member to team
router.post('/:id/members', authenticate, isCaptainOf('id'), async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check user exists and isn't already on a team in this season
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            seasonId: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const team = await prisma.team.findUnique({
      where: { id: req.params.id },
      select: { seasonId: true }
    });

    if (user.team && user.team.seasonId === team.seasonId) {
      return res.status(400).json({ error: 'User is already on a team in this season' });
    }

    // Add user to team
    await prisma.user.update({
      where: { id: userId },
      data: { teamId: req.params.id }
    });

    // Create player stats for this season if not exists
    await prisma.playerStats.upsert({
      where: {
        playerId_seasonId: {
          playerId: userId,
          seasonId: team.seasonId
        }
      },
      create: {
        playerId: userId,
        seasonId: team.seasonId
      },
      update: {}
    });

    await createAuditLog(req.user.id, 'MEMBER_ADDED', 'Team', req.params.id, { userId }, getClientIp(req));

    res.json({ message: 'Member added successfully' });
  } catch (error) {
    next(error);
  }
});

// Remove member from team
router.delete('/:id/members/:userId', authenticate, isCaptainOf('id'), async (req, res, next) => {
  try {
    const { userId } = req.params;

    const team = await prisma.team.findUnique({
      where: { id: req.params.id },
      select: { captainId: true, coCaptainId: true }
    });

    if (team.captainId === userId || team.coCaptainId === userId) {
      return res.status(400).json({ error: 'Cannot remove captain or co-captain. Assign a new one first.' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { teamId: null }
    });

    await createAuditLog(req.user.id, 'MEMBER_REMOVED', 'Team', req.params.id, { userId }, getClientIp(req));

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    next(error);
  }
});

// Delete team (admin only)
router.delete('/:id', authenticate, authorize('ADMIN'), validations.uuidParam('id'), validate, async (req, res, next) => {
  try {
    // Remove team reference from all members
    await prisma.user.updateMany({
      where: { teamId: req.params.id },
      data: { teamId: null }
    });

    await prisma.team.delete({
      where: { id: req.params.id }
    });

    await createAuditLog(req.user.id, 'TEAM_DELETED', 'Team', req.params.id, null, getClientIp(req));

    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
