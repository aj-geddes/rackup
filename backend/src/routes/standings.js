const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { validate, validations } = require('../middleware/validation');

const router = express.Router();
const prisma = new PrismaClient();

// Get standings for a season
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { seasonId } = req.query;

    // If no seasonId provided, get active season
    let targetSeasonId = seasonId;
    if (!targetSeasonId) {
      const activeSeason = await prisma.season.findFirst({
        where: { isActive: true }
      });
      if (!activeSeason) {
        return res.status(404).json({ error: 'No active season found' });
      }
      targetSeasonId = activeSeason.id;
    }

    const standings = await prisma.standing.findMany({
      where: { seasonId: targetSeasonId },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            logo: true,
            captain: {
              select: { firstName: true, lastName: true }
            }
          }
        }
      },
      orderBy: [
        { rank: 'asc' },
        { wins: 'desc' },
        { losses: 'asc' }
      ]
    });

    // Calculate win percentage and add to response
    const standingsWithStats = standings.map(standing => {
      const totalGames = standing.wins + standing.losses;
      const winPct = totalGames > 0
        ? (standing.wins / totalGames).toFixed(3)
        : '.000';

      return {
        ...standing,
        winPercentage: winPct,
        totalGames
      };
    });

    res.json(standingsWithStats);
  } catch (error) {
    next(error);
  }
});

// Get standings for a specific team
router.get('/team/:teamId', authenticate, validations.uuidParam('teamId'), validate, async (req, res, next) => {
  try {
    const standing = await prisma.standing.findUnique({
      where: { teamId: req.params.teamId },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            logo: true,
            season: {
              select: { id: true, name: true }
            }
          }
        },
        season: {
          select: { id: true, name: true }
        }
      }
    });

    if (!standing) {
      return res.status(404).json({ error: 'Standing not found' });
    }

    const totalGames = standing.wins + standing.losses;
    const winPct = totalGames > 0
      ? (standing.wins / totalGames).toFixed(3)
      : '.000';

    res.json({
      ...standing,
      winPercentage: winPct,
      totalGames
    });
  } catch (error) {
    next(error);
  }
});

// Get player rankings for a season
router.get('/players', authenticate, async (req, res, next) => {
  try {
    const { seasonId, limit = 50 } = req.query;

    // If no seasonId provided, get active season
    let targetSeasonId = seasonId;
    if (!targetSeasonId) {
      const activeSeason = await prisma.season.findFirst({
        where: { isActive: true }
      });
      if (!activeSeason) {
        return res.status(404).json({ error: 'No active season found' });
      }
      targetSeasonId = activeSeason.id;
    }

    const playerStats = await prisma.playerStats.findMany({
      where: { seasonId: targetSeasonId },
      include: {
        player: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            handicap: true,
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

    // Add rankings and win percentage
    const rankedPlayers = playerStats.map((stat, index) => {
      const totalGames = stat.wins + stat.losses;
      const winPct = totalGames > 0
        ? (stat.wins / totalGames).toFixed(3)
        : '.000';

      return {
        rank: index + 1,
        ...stat,
        winPercentage: winPct,
        totalGames
      };
    });

    res.json(rankedPlayers);
  } catch (error) {
    next(error);
  }
});

// Get head-to-head record between two teams
router.get('/head-to-head', authenticate, async (req, res, next) => {
  try {
    const { team1Id, team2Id, seasonId } = req.query;

    if (!team1Id || !team2Id) {
      return res.status(400).json({ error: 'Both team1Id and team2Id are required' });
    }

    const where = {
      OR: [
        { homeTeamId: team1Id, awayTeamId: team2Id },
        { homeTeamId: team2Id, awayTeamId: team1Id }
      ],
      status: 'COMPLETED'
    };

    if (seasonId) {
      where.seasonId = seasonId;
    }

    const matches = await prisma.match.findMany({
      where,
      include: {
        homeTeam: { select: { id: true, name: true } },
        awayTeam: { select: { id: true, name: true } },
        venue: { select: { name: true } }
      },
      orderBy: { date: 'desc' }
    });

    let team1Wins = 0;
    let team2Wins = 0;

    matches.forEach(match => {
      if (match.homeTeamId === team1Id) {
        if (match.homeScore > match.awayScore) team1Wins++;
        else team2Wins++;
      } else {
        if (match.awayScore > match.homeScore) team1Wins++;
        else team2Wins++;
      }
    });

    const teams = await Promise.all([
      prisma.team.findUnique({ where: { id: team1Id }, select: { id: true, name: true } }),
      prisma.team.findUnique({ where: { id: team2Id }, select: { id: true, name: true } })
    ]);

    res.json({
      team1: {
        ...teams[0],
        wins: team1Wins
      },
      team2: {
        ...teams[1],
        wins: team2Wins
      },
      totalMatches: matches.length,
      matches
    });
  } catch (error) {
    next(error);
  }
});

// Recalculate all standings for a season (admin only)
router.post('/recalculate/:seasonId', authenticate, async (req, res, next) => {
  try {
    if (!['ADMIN', 'LEAGUE_OFFICIAL'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { seasonId } = req.params;

    // Get all completed matches for the season
    const matches = await prisma.match.findMany({
      where: {
        seasonId,
        status: 'COMPLETED'
      }
    });

    // Get all teams for this season
    const teams = await prisma.team.findMany({
      where: { seasonId }
    });

    // Calculate standings for each team
    const teamStats = {};
    teams.forEach(team => {
      teamStats[team.id] = { wins: 0, losses: 0, streak: '0' };
    });

    // Sort matches by date to calculate streaks properly
    matches.sort((a, b) => new Date(a.date) - new Date(b.date));

    matches.forEach(match => {
      const homeWon = match.homeScore > match.awayScore;

      if (teamStats[match.homeTeamId]) {
        if (homeWon) {
          teamStats[match.homeTeamId].wins++;
          teamStats[match.homeTeamId].streak =
            teamStats[match.homeTeamId].streak.startsWith('W')
              ? `W${parseInt(teamStats[match.homeTeamId].streak.slice(1)) + 1}`
              : 'W1';
        } else {
          teamStats[match.homeTeamId].losses++;
          teamStats[match.homeTeamId].streak =
            teamStats[match.homeTeamId].streak.startsWith('L')
              ? `L${parseInt(teamStats[match.homeTeamId].streak.slice(1)) + 1}`
              : 'L1';
        }
      }

      if (teamStats[match.awayTeamId]) {
        if (!homeWon) {
          teamStats[match.awayTeamId].wins++;
          teamStats[match.awayTeamId].streak =
            teamStats[match.awayTeamId].streak.startsWith('W')
              ? `W${parseInt(teamStats[match.awayTeamId].streak.slice(1)) + 1}`
              : 'W1';
        } else {
          teamStats[match.awayTeamId].losses++;
          teamStats[match.awayTeamId].streak =
            teamStats[match.awayTeamId].streak.startsWith('L')
              ? `L${parseInt(teamStats[match.awayTeamId].streak.slice(1)) + 1}`
              : 'L1';
        }
      }
    });

    // Update standings in database
    for (const teamId of Object.keys(teamStats)) {
      await prisma.standing.upsert({
        where: { teamId },
        create: {
          teamId,
          seasonId,
          ...teamStats[teamId]
        },
        update: teamStats[teamId]
      });
    }

    // Recalculate rankings
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

    res.json({ message: 'Standings recalculated successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
