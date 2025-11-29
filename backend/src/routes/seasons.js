const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, validations } = require('../middleware/validation');
const { createAuditLog, getClientIp } = require('../middleware/logger');

const router = express.Router();
const prisma = new PrismaClient();

// Get all seasons
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { active } = req.query;

    const where = {};
    if (active === 'true') {
      where.isActive = true;
    }

    const seasons = await prisma.season.findMany({
      where,
      include: {
        _count: {
          select: {
            teams: true,
            matches: true
          }
        }
      },
      orderBy: { startDate: 'desc' }
    });

    res.json(seasons);
  } catch (error) {
    next(error);
  }
});

// Get active season
router.get('/active', authenticate, async (req, res, next) => {
  try {
    const season = await prisma.season.findFirst({
      where: { isActive: true },
      include: {
        teams: {
          include: {
            standings: true,
            _count: { select: { members: true } }
          }
        },
        _count: {
          select: {
            matches: true
          }
        }
      }
    });

    if (!season) {
      return res.status(404).json({ error: 'No active season found' });
    }

    res.json(season);
  } catch (error) {
    next(error);
  }
});

// Get season by ID
router.get('/:id', authenticate, validations.uuidParam('id'), validate, async (req, res, next) => {
  try {
    const season = await prisma.season.findUnique({
      where: { id: req.params.id },
      include: {
        teams: {
          include: {
            standings: true,
            captain: {
              select: { id: true, firstName: true, lastName: true }
            },
            _count: { select: { members: true } }
          }
        },
        matches: {
          include: {
            homeTeam: { select: { id: true, name: true } },
            awayTeam: { select: { id: true, name: true } },
            venue: { select: { id: true, name: true } }
          },
          orderBy: [{ date: 'asc' }, { time: 'asc' }]
        }
      }
    });

    if (!season) {
      return res.status(404).json({ error: 'Season not found' });
    }

    res.json(season);
  } catch (error) {
    next(error);
  }
});

// Create season (admin/league official only)
router.post('/', authenticate, authorize('ADMIN', 'LEAGUE_OFFICIAL'), validations.createSeason, validate, async (req, res, next) => {
  try {
    const { name, startDate, endDate, playoffDate } = req.body;

    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    const season = await prisma.season.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        playoffDate: playoffDate ? new Date(playoffDate) : null,
        isActive: false
      }
    });

    await createAuditLog(req.user.id, 'SEASON_CREATED', 'Season', season.id, { name }, getClientIp(req));

    res.status(201).json(season);
  } catch (error) {
    next(error);
  }
});

// Update season
router.patch('/:id', authenticate, authorize('ADMIN', 'LEAGUE_OFFICIAL'), async (req, res, next) => {
  try {
    const { name, startDate, endDate, playoffDate } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (playoffDate !== undefined) updateData.playoffDate = playoffDate ? new Date(playoffDate) : null;

    const season = await prisma.season.update({
      where: { id: req.params.id },
      data: updateData
    });

    await createAuditLog(req.user.id, 'SEASON_UPDATED', 'Season', req.params.id, updateData, getClientIp(req));

    res.json(season);
  } catch (error) {
    next(error);
  }
});

// Activate season
router.post('/:id/activate', authenticate, authorize('ADMIN', 'LEAGUE_OFFICIAL'), async (req, res, next) => {
  try {
    // Deactivate all other seasons
    await prisma.season.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    });

    // Activate this season
    const season = await prisma.season.update({
      where: { id: req.params.id },
      data: { isActive: true }
    });

    await createAuditLog(req.user.id, 'SEASON_ACTIVATED', 'Season', req.params.id, null, getClientIp(req));

    res.json(season);
  } catch (error) {
    next(error);
  }
});

// Deactivate season
router.post('/:id/deactivate', authenticate, authorize('ADMIN', 'LEAGUE_OFFICIAL'), async (req, res, next) => {
  try {
    const season = await prisma.season.update({
      where: { id: req.params.id },
      data: { isActive: false }
    });

    await createAuditLog(req.user.id, 'SEASON_DEACTIVATED', 'Season', req.params.id, null, getClientIp(req));

    res.json(season);
  } catch (error) {
    next(error);
  }
});

// Delete season (admin only)
router.delete('/:id', authenticate, authorize('ADMIN'), validations.uuidParam('id'), validate, async (req, res, next) => {
  try {
    const seasonId = req.params.id;

    // Check if this is the active season
    const season = await prisma.season.findUnique({
      where: { id: seasonId }
    });

    if (!season) {
      return res.status(404).json({ error: 'Season not found' });
    }

    if (season.isActive) {
      return res.status(400).json({ error: 'Cannot delete active season. Activate another season first.' });
    }

    // Delete all matches for this season
    await prisma.match.deleteMany({
      where: { seasonId }
    });

    // Delete standings for this season
    await prisma.standing.deleteMany({
      where: { seasonId }
    });

    // Delete player stats for this season
    await prisma.playerStats.deleteMany({
      where: { seasonId }
    });

    // Get teams in this season and remove team references from users
    const teams = await prisma.team.findMany({
      where: { seasonId },
      select: { id: true }
    });

    for (const team of teams) {
      await prisma.user.updateMany({
        where: { teamId: team.id },
        data: { teamId: null }
      });
    }

    // Delete teams for this season
    await prisma.team.deleteMany({
      where: { seasonId }
    });

    // Delete the season
    await prisma.season.delete({
      where: { id: seasonId }
    });

    await createAuditLog(req.user.id, 'SEASON_DELETED', 'Season', seasonId, null, getClientIp(req));

    res.json({ message: 'Season deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get season statistics
router.get('/:id/stats', authenticate, async (req, res, next) => {
  try {
    const seasonId = req.params.id;

    const [
      season,
      teamCount,
      matchCount,
      completedMatches,
      playerCount,
      topScorers
    ] = await Promise.all([
      prisma.season.findUnique({ where: { id: seasonId } }),
      prisma.team.count({ where: { seasonId } }),
      prisma.match.count({ where: { seasonId } }),
      prisma.match.count({ where: { seasonId, status: 'COMPLETED' } }),
      prisma.playerStats.count({ where: { seasonId } }),
      prisma.playerStats.findMany({
        where: { seasonId },
        include: {
          player: {
            select: {
              firstName: true,
              lastName: true,
              team: { select: { name: true } }
            }
          }
        },
        orderBy: { wins: 'desc' },
        take: 5
      })
    ]);

    if (!season) {
      return res.status(404).json({ error: 'Season not found' });
    }

    const totalWeeks = Math.ceil(
      (new Date(season.endDate) - new Date(season.startDate)) / (7 * 24 * 60 * 60 * 1000)
    );

    const currentWeek = Math.ceil(
      (new Date() - new Date(season.startDate)) / (7 * 24 * 60 * 60 * 1000)
    );

    res.json({
      season: {
        id: season.id,
        name: season.name,
        startDate: season.startDate,
        endDate: season.endDate,
        playoffDate: season.playoffDate,
        isActive: season.isActive
      },
      stats: {
        totalTeams: teamCount,
        totalMatches: matchCount,
        completedMatches,
        remainingMatches: matchCount - completedMatches,
        completionRate: matchCount > 0 ? ((completedMatches / matchCount) * 100).toFixed(1) : 0,
        totalPlayers: playerCount,
        totalWeeks,
        currentWeek: Math.min(currentWeek, totalWeeks)
      },
      topScorers
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
