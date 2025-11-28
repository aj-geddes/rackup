const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { google } = require('googleapis');
const { authenticate, authorize } = require('../middleware/auth');
const { createAuditLog, getClientIp } = require('../middleware/logger');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const prisma = new PrismaClient();

// Get backup data (complete league export)
async function generateBackupData() {
  const [
    users,
    teams,
    seasons,
    matches,
    matchResults,
    standings,
    playerStats,
    announcements,
    venues
  ] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        handicap: true,
        isActive: true,
        teamId: true,
        createdAt: true
      }
    }),
    prisma.team.findMany({
      include: {
        standings: true
      }
    }),
    prisma.season.findMany(),
    prisma.match.findMany({
      include: {
        results: true
      }
    }),
    prisma.matchResult.findMany(),
    prisma.standing.findMany(),
    prisma.playerStats.findMany(),
    prisma.announcement.findMany(),
    prisma.venue.findMany()
  ]);

  return {
    exportDate: new Date().toISOString(),
    version: '1.0',
    data: {
      users,
      teams,
      seasons,
      matches,
      matchResults,
      standings,
      playerStats,
      announcements,
      venues
    }
  };
}

// List all backups
router.get('/', authenticate, authorize('ADMIN', 'LEAGUE_OFFICIAL'), async (req, res, next) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [backups, total] = await Promise.all([
      prisma.backup.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.backup.count()
    ]);

    res.json({
      data: backups,
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

// Create and download backup (JSON format)
router.get('/download', authenticate, authorize('ADMIN', 'LEAGUE_OFFICIAL'), async (req, res, next) => {
  try {
    const backupData = await generateBackupData();
    const jsonString = JSON.stringify(backupData, null, 2);
    const filename = `pool-league-backup-${new Date().toISOString().split('T')[0]}.json`;

    // Record backup in database
    await prisma.backup.create({
      data: {
        filename,
        size: Buffer.byteLength(jsonString, 'utf8'),
        type: 'local',
        createdBy: req.user.id
      }
    });

    await createAuditLog(
      req.user.id,
      'BACKUP_CREATED',
      'Backup',
      null,
      { filename, type: 'local' },
      getClientIp(req)
    );

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(jsonString);
  } catch (error) {
    next(error);
  }
});

// Download CSV backup (standings only)
router.get('/download/csv/standings', authenticate, authorize('ADMIN', 'LEAGUE_OFFICIAL'), async (req, res, next) => {
  try {
    const { seasonId } = req.query;

    let targetSeasonId = seasonId;
    if (!targetSeasonId) {
      const activeSeason = await prisma.season.findFirst({ where: { isActive: true } });
      if (!activeSeason) {
        return res.status(404).json({ error: 'No active season found' });
      }
      targetSeasonId = activeSeason.id;
    }

    const standings = await prisma.standing.findMany({
      where: { seasonId: targetSeasonId },
      include: {
        team: { select: { name: true } },
        season: { select: { name: true } }
      },
      orderBy: { rank: 'asc' }
    });

    // Generate CSV
    const headers = ['Rank', 'Team', 'Wins', 'Losses', 'Win %', 'Streak', 'Season'];
    const rows = standings.map(s => {
      const totalGames = s.wins + s.losses;
      const winPct = totalGames > 0 ? ((s.wins / totalGames) * 100).toFixed(1) : '0.0';
      return [s.rank, s.team.name, s.wins, s.losses, winPct, s.streak, s.season.name];
    });

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const filename = `standings-${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

// Download CSV backup (player stats)
router.get('/download/csv/players', authenticate, authorize('ADMIN', 'LEAGUE_OFFICIAL'), async (req, res, next) => {
  try {
    const { seasonId } = req.query;

    let targetSeasonId = seasonId;
    if (!targetSeasonId) {
      const activeSeason = await prisma.season.findFirst({ where: { isActive: true } });
      if (!activeSeason) {
        return res.status(404).json({ error: 'No active season found' });
      }
      targetSeasonId = activeSeason.id;
    }

    const stats = await prisma.playerStats.findMany({
      where: { seasonId: targetSeasonId },
      include: {
        player: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            handicap: true,
            team: { select: { name: true } }
          }
        },
        season: { select: { name: true } }
      },
      orderBy: { wins: 'desc' }
    });

    // Generate CSV
    const headers = ['Rank', 'Player', 'Email', 'Team', 'Handicap', 'Wins', 'Losses', 'Win %', 'Run Outs', 'Season'];
    const rows = stats.map((s, i) => {
      const totalGames = s.wins + s.losses;
      const winPct = totalGames > 0 ? ((s.wins / totalGames) * 100).toFixed(1) : '0.0';
      return [
        i + 1,
        `${s.player.firstName} ${s.player.lastName}`,
        s.player.email,
        s.player.team?.name || 'No Team',
        s.player.handicap,
        s.wins,
        s.losses,
        winPct,
        s.runouts,
        s.season.name
      ];
    });

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const filename = `player-stats-${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

// Google Drive OAuth setup
router.get('/google/auth-url', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return res.status(400).json({
        error: 'Google Drive integration not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI environment variables.'
      });
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/drive.file'],
      prompt: 'consent'
    });

    res.json({ authUrl });
  } catch (error) {
    next(error);
  }
});

// Google Drive OAuth callback
router.post('/google/callback', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    const { tokens } = await oauth2Client.getToken(code);

    // Store tokens in database
    await prisma.googleDriveConfig.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        isConfigured: true
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || undefined,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        isConfigured: true
      }
    });

    await createAuditLog(
      req.user.id,
      'GOOGLE_DRIVE_CONNECTED',
      'GoogleDriveConfig',
      null,
      null,
      getClientIp(req)
    );

    res.json({ message: 'Google Drive connected successfully' });
  } catch (error) {
    next(error);
  }
});

// Check Google Drive connection status
router.get('/google/status', authenticate, authorize('ADMIN', 'LEAGUE_OFFICIAL'), async (req, res, next) => {
  try {
    const config = await prisma.googleDriveConfig.findUnique({
      where: { id: 'default' }
    });

    res.json({
      isConfigured: config?.isConfigured || false,
      folderId: config?.folderId || null
    });
  } catch (error) {
    next(error);
  }
});

// Set Google Drive folder for backups
router.post('/google/folder', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { folderId } = req.body;

    await prisma.googleDriveConfig.update({
      where: { id: 'default' },
      data: { folderId }
    });

    res.json({ message: 'Backup folder set successfully' });
  } catch (error) {
    next(error);
  }
});

// Helper to get authenticated Google Drive client
async function getGoogleDriveClient() {
  const config = await prisma.googleDriveConfig.findUnique({
    where: { id: 'default' }
  });

  if (!config || !config.isConfigured) {
    throw new Error('Google Drive not configured');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: config.accessToken,
    refresh_token: config.refreshToken,
    expiry_date: config.tokenExpiry?.getTime()
  });

  // Handle token refresh
  oauth2Client.on('tokens', async (tokens) => {
    await prisma.googleDriveConfig.update({
      where: { id: 'default' },
      data: {
        accessToken: tokens.access_token,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null
      }
    });
  });

  return google.drive({ version: 'v3', auth: oauth2Client });
}

// Upload backup to Google Drive
router.post('/google/upload', authenticate, authorize('ADMIN', 'LEAGUE_OFFICIAL'), async (req, res, next) => {
  try {
    const drive = await getGoogleDriveClient();
    const config = await prisma.googleDriveConfig.findUnique({
      where: { id: 'default' }
    });

    const backupData = await generateBackupData();
    const jsonString = JSON.stringify(backupData, null, 2);
    const filename = `pool-league-backup-${new Date().toISOString().split('T')[0]}-${uuidv4().slice(0, 8)}.json`;

    const fileMetadata = {
      name: filename,
      mimeType: 'application/json'
    };

    if (config.folderId) {
      fileMetadata.parents = [config.folderId];
    }

    const { Readable } = require('stream');
    const stream = Readable.from([jsonString]);

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: {
        mimeType: 'application/json',
        body: stream
      },
      fields: 'id,name,webViewLink'
    });

    // Record backup in database
    await prisma.backup.create({
      data: {
        filename,
        size: Buffer.byteLength(jsonString, 'utf8'),
        type: 'google_drive',
        driveFileId: response.data.id,
        createdBy: req.user.id
      }
    });

    await createAuditLog(
      req.user.id,
      'BACKUP_UPLOADED_GDRIVE',
      'Backup',
      null,
      { filename, driveFileId: response.data.id },
      getClientIp(req)
    );

    res.json({
      message: 'Backup uploaded to Google Drive successfully',
      file: {
        id: response.data.id,
        name: response.data.name,
        webViewLink: response.data.webViewLink
      }
    });
  } catch (error) {
    if (error.message === 'Google Drive not configured') {
      return res.status(400).json({ error: 'Google Drive not configured. Please connect your account first.' });
    }
    next(error);
  }
});

// List backups from Google Drive
router.get('/google/list', authenticate, authorize('ADMIN', 'LEAGUE_OFFICIAL'), async (req, res, next) => {
  try {
    const drive = await getGoogleDriveClient();
    const config = await prisma.googleDriveConfig.findUnique({
      where: { id: 'default' }
    });

    let query = "name contains 'pool-league-backup' and mimeType='application/json'";
    if (config.folderId) {
      query += ` and '${config.folderId}' in parents`;
    }

    const response = await drive.files.list({
      q: query,
      fields: 'files(id, name, createdTime, size, webViewLink)',
      orderBy: 'createdTime desc',
      pageSize: 20
    });

    res.json(response.data.files || []);
  } catch (error) {
    if (error.message === 'Google Drive not configured') {
      return res.status(400).json({ error: 'Google Drive not configured' });
    }
    next(error);
  }
});

// Disconnect Google Drive
router.post('/google/disconnect', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    await prisma.googleDriveConfig.update({
      where: { id: 'default' },
      data: {
        accessToken: null,
        refreshToken: null,
        tokenExpiry: null,
        isConfigured: false
      }
    });

    await createAuditLog(
      req.user.id,
      'GOOGLE_DRIVE_DISCONNECTED',
      'GoogleDriveConfig',
      null,
      null,
      getClientIp(req)
    );

    res.json({ message: 'Google Drive disconnected successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
