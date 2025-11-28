const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize, isCaptainOf } = require('../middleware/auth');
const { validate, validations } = require('../middleware/validation');
const { createAuditLog, getClientIp } = require('../middleware/logger');

const router = express.Router();
const prisma = new PrismaClient();

// Get all matches
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { seasonId, teamId, status, week, upcoming, limit = 50 } = req.query;

    const where = {};

    if (seasonId) where.seasonId = seasonId;
    if (status) where.status = status;
    if (week) where.week = parseInt(week);

    if (teamId) {
      where.OR = [
        { homeTeamId: teamId },
        { awayTeamId: teamId }
      ];
    }

    if (upcoming === 'true') {
      where.date = { gte: new Date() };
      where.status = { in: ['SCHEDULED', 'IN_PROGRESS'] };
    }

    const matches = await prisma.match.findMany({
      where,
      include: {
        homeTeam: { select: { id: true, name: true } },
        awayTeam: { select: { id: true, name: true } },
        venue: { select: { id: true, name: true, address: true } },
        season: { select: { id: true, name: true } }
      },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
      take: parseInt(limit)
    });

    res.json(matches);
  } catch (error) {
    next(error);
  }
});

// Get match by ID
router.get('/:id', authenticate, validations.uuidParam('id'), validate, async (req, res, next) => {
  try {
    const match = await prisma.match.findUnique({
      where: { id: req.params.id },
      include: {
        homeTeam: {
          include: {
            members: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                handicap: true
              }
            }
          }
        },
        awayTeam: {
          include: {
            members: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                handicap: true
              }
            }
          }
        },
        venue: true,
        season: { select: { id: true, name: true } },
        results: {
          include: {
            player: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { gameNumber: 'asc' }
        }
      }
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    res.json(match);
  } catch (error) {
    next(error);
  }
});

// Create match (admin/league official only)
router.post('/', authenticate, authorize('ADMIN', 'LEAGUE_OFFICIAL'), validations.createMatch, validate, async (req, res, next) => {
  try {
    const { date, time, homeTeamId, awayTeamId, venueId, seasonId, week } = req.body;

    // Verify teams exist and are different
    if (homeTeamId === awayTeamId) {
      return res.status(400).json({ error: 'Home and away teams must be different' });
    }

    const [homeTeam, awayTeam, season] = await Promise.all([
      prisma.team.findUnique({ where: { id: homeTeamId } }),
      prisma.team.findUnique({ where: { id: awayTeamId } }),
      prisma.season.findUnique({ where: { id: seasonId } })
    ]);

    if (!homeTeam) return res.status(404).json({ error: 'Home team not found' });
    if (!awayTeam) return res.status(404).json({ error: 'Away team not found' });
    if (!season) return res.status(404).json({ error: 'Season not found' });

    const match = await prisma.match.create({
      data: {
        date: new Date(date),
        time,
        homeTeamId,
        awayTeamId,
        venueId,
        seasonId,
        week
      },
      include: {
        homeTeam: { select: { id: true, name: true } },
        awayTeam: { select: { id: true, name: true } },
        venue: { select: { id: true, name: true } }
      }
    });

    await createAuditLog(req.user.id, 'MATCH_CREATED', 'Match', match.id, { homeTeamId, awayTeamId, date }, getClientIp(req));

    res.status(201).json(match);
  } catch (error) {
    next(error);
  }
});

// Update match
router.patch('/:id', authenticate, authorize('ADMIN', 'LEAGUE_OFFICIAL'), async (req, res, next) => {
  try {
    const { date, time, venueId, status, week } = req.body;

    const updateData = {};
    if (date !== undefined) updateData.date = new Date(date);
    if (time !== undefined) updateData.time = time;
    if (venueId !== undefined) updateData.venueId = venueId;
    if (status !== undefined) updateData.status = status;
    if (week !== undefined) updateData.week = week;

    const match = await prisma.match.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        homeTeam: { select: { id: true, name: true } },
        awayTeam: { select: { id: true, name: true } },
        venue: { select: { id: true, name: true } }
      }
    });

    await createAuditLog(req.user.id, 'MATCH_UPDATED', 'Match', req.params.id, updateData, getClientIp(req));

    res.json(match);
  } catch (error) {
    next(error);
  }
});

// Update match score
router.patch('/:id/score', authenticate, authorize('ADMIN', 'LEAGUE_OFFICIAL', 'CAPTAIN'), validations.updateMatchScore, validate, async (req, res, next) => {
  try {
    const { homeScore, awayScore } = req.body;

    // If captain, verify they're captain of one of the teams
    if (req.user.role === 'CAPTAIN') {
      const match = await prisma.match.findUnique({
        where: { id: req.params.id },
        include: {
          homeTeam: { select: { captainId: true, coCaptainId: true } },
          awayTeam: { select: { captainId: true, coCaptainId: true } }
        }
      });

      const isCaptain =
        match.homeTeam.captainId === req.user.id ||
        match.homeTeam.coCaptainId === req.user.id ||
        match.awayTeam.captainId === req.user.id ||
        match.awayTeam.coCaptainId === req.user.id;

      if (!isCaptain) {
        return res.status(403).json({ error: 'You are not a captain of either team' });
      }
    }

    const updatedMatch = await prisma.match.update({
      where: { id: req.params.id },
      data: {
        homeScore,
        awayScore,
        status: 'COMPLETED'
      },
      include: {
        homeTeam: { select: { id: true, name: true } },
        awayTeam: { select: { id: true, name: true } }
      }
    });

    // Update standings
    await updateStandings(updatedMatch);

    await createAuditLog(req.user.id, 'MATCH_SCORED', 'Match', req.params.id, { homeScore, awayScore }, getClientIp(req));

    res.json(updatedMatch);
  } catch (error) {
    next(error);
  }
});

// Record individual game result
router.post('/:id/results', authenticate, authorize('ADMIN', 'LEAGUE_OFFICIAL', 'CAPTAIN'), async (req, res, next) => {
  try {
    const { playerId, gameNumber, won, isRunout } = req.body;

    if (!playerId || gameNumber === undefined || won === undefined) {
      return res.status(400).json({ error: 'playerId, gameNumber, and won are required' });
    }

    const match = await prisma.match.findUnique({
      where: { id: req.params.id },
      include: {
        homeTeam: { select: { captainId: true, coCaptainId: true } },
        awayTeam: { select: { captainId: true, coCaptainId: true } }
      }
    });

    // Verify captain if not admin/official
    if (req.user.role === 'CAPTAIN') {
      const isCaptain =
        match.homeTeam.captainId === req.user.id ||
        match.homeTeam.coCaptainId === req.user.id ||
        match.awayTeam.captainId === req.user.id ||
        match.awayTeam.coCaptainId === req.user.id;

      if (!isCaptain) {
        return res.status(403).json({ error: 'You are not a captain of either team' });
      }
    }

    const result = await prisma.matchResult.upsert({
      where: {
        matchId_playerId_gameNumber: {
          matchId: req.params.id,
          playerId,
          gameNumber
        }
      },
      create: {
        matchId: req.params.id,
        playerId,
        gameNumber,
        won,
        isRunout: isRunout || false
      },
      update: {
        won,
        isRunout: isRunout || false
      },
      include: {
        player: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Update player stats
    await updatePlayerStats(playerId, match.seasonId, won, isRunout);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Delete match (admin only)
router.delete('/:id', authenticate, authorize('ADMIN'), validations.uuidParam('id'), validate, async (req, res, next) => {
  try {
    await prisma.match.delete({
      where: { id: req.params.id }
    });

    await createAuditLog(req.user.id, 'MATCH_DELETED', 'Match', req.params.id, null, getClientIp(req));

    res.json({ message: 'Match deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Helper function to update standings
async function updateStandings(match) {
  const homeWon = match.homeScore > match.awayScore;

  // Update home team standing
  await prisma.standing.upsert({
    where: { teamId: match.homeTeamId },
    create: {
      teamId: match.homeTeamId,
      seasonId: match.seasonId,
      wins: homeWon ? 1 : 0,
      losses: homeWon ? 0 : 1,
      streak: homeWon ? 'W1' : 'L1'
    },
    update: {
      wins: { increment: homeWon ? 1 : 0 },
      losses: { increment: homeWon ? 0 : 1 },
      streak: homeWon ? updateStreak(true) : updateStreak(false)
    }
  });

  // Update away team standing
  await prisma.standing.upsert({
    where: { teamId: match.awayTeamId },
    create: {
      teamId: match.awayTeamId,
      seasonId: match.seasonId,
      wins: homeWon ? 0 : 1,
      losses: homeWon ? 1 : 0,
      streak: homeWon ? 'L1' : 'W1'
    },
    update: {
      wins: { increment: homeWon ? 0 : 1 },
      losses: { increment: homeWon ? 1 : 0 },
      streak: homeWon ? updateStreak(false) : updateStreak(true)
    }
  });

  // Recalculate rankings
  await recalculateRankings(match.seasonId);
}

// Helper function to update streak (simplified - in production, fetch current streak)
function updateStreak(won) {
  // This is a simplified version - in production, you'd need to fetch the current streak
  // and increment/reset appropriately
  return won ? 'W1' : 'L1';
}

// Helper function to update player stats
async function updatePlayerStats(playerId, seasonId, won, isRunout) {
  await prisma.playerStats.upsert({
    where: {
      playerId_seasonId: { playerId, seasonId }
    },
    create: {
      playerId,
      seasonId,
      wins: won ? 1 : 0,
      losses: won ? 0 : 1,
      runouts: isRunout ? 1 : 0
    },
    update: {
      wins: { increment: won ? 1 : 0 },
      losses: { increment: won ? 0 : 1 },
      runouts: { increment: isRunout ? 1 : 0 }
    }
  });
}

// Helper function to recalculate rankings
async function recalculateRankings(seasonId) {
  const standings = await prisma.standing.findMany({
    where: { seasonId },
    orderBy: [
      { wins: 'desc' },
      { losses: 'asc' }
    ]
  });

  for (let i = 0; i < standings.length; i++) {
    await prisma.standing.update({
      where: { id: standings[i].id },
      data: { rank: i + 1 }
    });
  }
}

module.exports = router;
