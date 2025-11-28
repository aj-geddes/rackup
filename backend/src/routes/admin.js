const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const { createAuditLog, getClientIp } = require('../middleware/logger');

const router = express.Router();
const prisma = new PrismaClient();

// All routes require admin or league official role
router.use(authenticate, authorize('ADMIN', 'LEAGUE_OFFICIAL'));

// Dashboard stats
router.get('/dashboard', async (req, res, next) => {
  try {
    const activeSeason = await prisma.season.findFirst({
      where: { isActive: true }
    });

    const [
      totalUsers,
      activeUsers,
      totalTeams,
      totalMatches,
      completedMatches,
      upcomingMatches,
      recentAuditLogs
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      activeSeason ? prisma.team.count({ where: { seasonId: activeSeason.id } }) : 0,
      activeSeason ? prisma.match.count({ where: { seasonId: activeSeason.id } }) : 0,
      activeSeason ? prisma.match.count({ where: { seasonId: activeSeason.id, status: 'COMPLETED' } }) : 0,
      activeSeason ? prisma.match.count({
        where: {
          seasonId: activeSeason.id,
          status: 'SCHEDULED',
          date: { gte: new Date() }
        }
      }) : 0,
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { firstName: true, lastName: true }
          }
        }
      })
    ]);

    res.json({
      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        totalTeams,
        totalMatches,
        completedMatches,
        upcomingMatches,
        matchCompletionRate: totalMatches > 0
          ? ((completedMatches / totalMatches) * 100).toFixed(1)
          : 0
      },
      activeSeason: activeSeason ? {
        id: activeSeason.id,
        name: activeSeason.name,
        startDate: activeSeason.startDate,
        endDate: activeSeason.endDate,
        playoffDate: activeSeason.playoffDate
      } : null,
      recentActivity: recentAuditLogs.map(log => ({
        id: log.id,
        action: log.action,
        entity: log.entity,
        user: log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System',
        createdAt: log.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Get audit logs
router.get('/audit-logs', authorize('ADMIN'), async (req, res, next) => {
  try {
    const { page = 1, limit = 50, userId, action, entity, startDate, endDate } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};

    if (userId) where.userId = userId;
    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (entity) where.entity = entity;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.auditLog.count({ where })
    ]);

    res.json({
      data: logs,
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

// Create admin user (admin only)
router.post('/create-admin', authorize('ADMIN'), async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!['LEAGUE_OFFICIAL', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Role must be LEAGUE_OFFICIAL or ADMIN' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });

    await createAuditLog(req.user.id, 'ADMIN_CREATED', 'User', user.id, { email, role }, getClientIp(req));

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
});

// Bulk import users (CSV format)
router.post('/import-users', async (req, res, next) => {
  try {
    const { users } = req.body;

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ error: 'Users array is required' });
    }

    const results = {
      created: [],
      skipped: [],
      errors: []
    };

    for (const userData of users) {
      try {
        const { email, firstName, lastName, handicap = 3, teamName } = userData;

        if (!email || !firstName || !lastName) {
          results.errors.push({ email, error: 'Missing required fields' });
          continue;
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
          results.skipped.push({ email, reason: 'Already exists' });
          continue;
        }

        // Generate temporary password
        const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
        const passwordHash = await bcrypt.hash(tempPassword, 12);

        // Find team if specified
        let teamId = null;
        if (teamName) {
          const team = await prisma.team.findFirst({
            where: { name: { equals: teamName, mode: 'insensitive' } }
          });
          if (team) teamId = team.id;
        }

        const user = await prisma.user.create({
          data: {
            email,
            passwordHash,
            firstName,
            lastName,
            handicap: parseInt(handicap) || 3,
            teamId,
            role: 'PLAYER'
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        });

        results.created.push({ ...user, tempPassword });
      } catch (err) {
        results.errors.push({ email: userData.email, error: err.message });
      }
    }

    await createAuditLog(
      req.user.id,
      'BULK_IMPORT_USERS',
      'User',
      null,
      {
        created: results.created.length,
        skipped: results.skipped.length,
        errors: results.errors.length
      },
      getClientIp(req)
    );

    res.json(results);
  } catch (error) {
    next(error);
  }
});

// Reset user password (admin only)
router.post('/reset-password/:userId', authorize('ADMIN'), async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash }
    });

    // Invalidate all refresh tokens
    await prisma.refreshToken.deleteMany({
      where: { userId }
    });

    await createAuditLog(req.user.id, 'PASSWORD_RESET_ADMIN', 'User', userId, null, getClientIp(req));

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
});

// Generate schedule for a season
router.post('/generate-schedule', async (req, res, next) => {
  try {
    const { seasonId, startDate, weeksCount, matchTime, venueRotation } = req.body;

    if (!seasonId) {
      return res.status(400).json({ error: 'Season ID is required' });
    }

    const teams = await prisma.team.findMany({
      where: { seasonId },
      select: { id: true, name: true }
    });

    if (teams.length < 2) {
      return res.status(400).json({ error: 'Need at least 2 teams to generate schedule' });
    }

    const venues = await prisma.venue.findMany({
      where: { isActive: true },
      select: { id: true }
    });

    // Round-robin scheduling
    const matches = [];
    const n = teams.length;
    const isOdd = n % 2 === 1;
    const teamList = [...teams];

    if (isOdd) {
      teamList.push({ id: null, name: 'BYE' }); // Add bye week
    }

    const numTeams = teamList.length;
    const numRounds = numTeams - 1;
    const matchesPerRound = numTeams / 2;

    let currentDate = new Date(startDate || new Date());
    let venueIndex = 0;
    let weekNum = 1;

    for (let round = 0; round < numRounds && weekNum <= (weeksCount || numRounds); round++) {
      for (let match = 0; match < matchesPerRound; match++) {
        const home = (round + match) % (numTeams - 1);
        let away = (numTeams - 1 - match + round) % (numTeams - 1);

        if (match === 0) {
          away = numTeams - 1;
        }

        const homeTeam = teamList[home];
        const awayTeam = teamList[away];

        // Skip bye matches
        if (homeTeam.id && awayTeam.id) {
          matches.push({
            date: new Date(currentDate),
            time: matchTime || '7:00 PM',
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            seasonId,
            week: weekNum,
            venueId: venues.length > 0 ? venues[venueIndex % venues.length].id : null,
            status: 'SCHEDULED'
          });

          if (venueRotation) {
            venueIndex++;
          }
        }
      }

      // Move to next week
      currentDate.setDate(currentDate.getDate() + 7);
      weekNum++;
    }

    // Create matches in database
    const createdMatches = await prisma.match.createMany({
      data: matches
    });

    await createAuditLog(
      req.user.id,
      'SCHEDULE_GENERATED',
      'Match',
      seasonId,
      { matchesCreated: createdMatches.count },
      getClientIp(req)
    );

    res.json({
      message: 'Schedule generated successfully',
      matchesCreated: createdMatches.count
    });
  } catch (error) {
    next(error);
  }
});

// Clear all matches for a season (admin only)
router.delete('/clear-schedule/:seasonId', authorize('ADMIN'), async (req, res, next) => {
  try {
    const { seasonId } = req.params;
    const { confirm } = req.body;

    if (confirm !== 'DELETE_ALL_MATCHES') {
      return res.status(400).json({
        error: 'Confirmation required. Send { confirm: "DELETE_ALL_MATCHES" } to proceed.'
      });
    }

    const deleted = await prisma.match.deleteMany({
      where: { seasonId }
    });

    await createAuditLog(
      req.user.id,
      'SCHEDULE_CLEARED',
      'Match',
      seasonId,
      { matchesDeleted: deleted.count },
      getClientIp(req)
    );

    res.json({
      message: 'Schedule cleared successfully',
      matchesDeleted: deleted.count
    });
  } catch (error) {
    next(error);
  }
});

// System settings
router.get('/settings', authorize('ADMIN'), async (req, res, next) => {
  try {
    // Return system configuration
    res.json({
      googleDriveConfigured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      maxUploadSize: '10mb',
      rateLimitWindow: process.env.RATE_LIMIT_WINDOW_MS || 900000,
      rateLimitMax: process.env.RATE_LIMIT_MAX_REQUESTS || 100
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
