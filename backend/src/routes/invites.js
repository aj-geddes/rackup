const express = require('express');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const { createAuditLog, getClientIp } = require('../middleware/logger');

const router = express.Router();
const prisma = new PrismaClient();

// SMS sending function (abstracted for different providers)
async function sendSms(phone, message) {
  const config = await prisma.smsConfig.findFirst({
    where: { isConfigured: true }
  });

  if (!config) {
    // Log for development, don't fail
    console.log(`[DEV SMS] To: ${phone}, Message: ${message}`);
    return { success: true, dev: true };
  }

  if (config.provider === 'twilio') {
    const accountSid = config.accountSid || process.env.TWILIO_ACCOUNT_SID;
    const authToken = config.authToken || process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = config.fromNumber || process.env.TWILIO_FROM_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      console.log(`[DEV SMS] To: ${phone}, Message: ${message}`);
      return { success: true, dev: true };
    }

    try {
      const twilio = require('twilio')(accountSid, authToken);
      await twilio.messages.create({
        body: message,
        from: fromNumber,
        to: phone
      });
      return { success: true };
    } catch (error) {
      console.error('Twilio error:', error);
      throw new Error('Failed to send SMS');
    }
  }

  throw new Error('SMS provider not configured');
}

// Generate secure invite token
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Normalize phone number (basic US format)
function normalizePhone(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  if (digits.startsWith('+')) {
    return digits;
  }
  return `+${digits}`;
}

// List all invites (admin/league official)
router.get('/', authenticate, authorize('ADMIN', 'LEAGUE_OFFICIAL'), async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) {
      where.status = status;
    }

    const [invites, total] = await Promise.all([
      prisma.invite.findMany({
        where,
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.invite.count({ where })
    ]);

    res.json({
      data: invites,
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

// Create and send invite (admin/league official/captain)
router.post('/', authenticate, authorize('ADMIN', 'LEAGUE_OFFICIAL', 'CAPTAIN'), async (req, res, next) => {
  try {
    const { phone, firstName, lastName, teamId, role } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const normalizedPhone = normalizePhone(phone);

    // Check if user already exists with this phone
    const existingUser = await prisma.user.findFirst({
      where: { phone: normalizedPhone }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'A user with this phone number already exists' });
    }

    // Check for pending invite with same phone
    const existingInvite = await prisma.invite.findFirst({
      where: {
        phone: normalizedPhone,
        status: 'PENDING',
        expiresAt: { gt: new Date() }
      }
    });

    if (existingInvite) {
      return res.status(409).json({ error: 'An active invite already exists for this phone number' });
    }

    // Captains can only invite to their own team
    if (req.user.role === 'CAPTAIN') {
      if (teamId && teamId !== req.user.teamId) {
        return res.status(403).json({ error: 'Captains can only invite to their own team' });
      }
    }

    // Only admins can create admin/league official invites
    const finalRole = role || 'PLAYER';
    if (['ADMIN', 'LEAGUE_OFFICIAL'].includes(finalRole) && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can invite league officials or admins' });
    }

    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const invite = await prisma.invite.create({
      data: {
        phone: normalizedPhone,
        token,
        firstName,
        lastName,
        teamId: teamId || req.user.teamId,
        role: finalRole,
        expiresAt,
        createdById: req.user.id
      }
    });

    // Build the invite link
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const inviteLink = `${baseUrl}/accept-invite/${token}`;

    // Send SMS
    const message = `You've been invited to join Pool League! Click here to create your account: ${inviteLink}`;

    try {
      const smsResult = await sendSms(normalizedPhone, message);

      await createAuditLog(
        req.user.id,
        'INVITE_SENT',
        'Invite',
        invite.id,
        { phone: normalizedPhone, role: finalRole, smsDev: smsResult.dev },
        getClientIp(req)
      );

      res.status(201).json({
        invite: {
          id: invite.id,
          phone: invite.phone,
          firstName: invite.firstName,
          lastName: invite.lastName,
          role: invite.role,
          expiresAt: invite.expiresAt,
          status: invite.status
        },
        inviteLink: smsResult.dev ? inviteLink : undefined, // Only return link in dev mode
        message: smsResult.dev
          ? 'Invite created (SMS in dev mode - link returned)'
          : 'Invite sent successfully'
      });
    } catch (smsError) {
      // Delete the invite if SMS fails
      await prisma.invite.delete({ where: { id: invite.id } });
      return res.status(500).json({ error: 'Failed to send SMS invitation' });
    }
  } catch (error) {
    next(error);
  }
});

// Get invite by token (public - for registration page)
router.get('/verify/:token', async (req, res, next) => {
  try {
    const { token } = req.params;

    const invite = await prisma.invite.findUnique({
      where: { token }
    });

    if (!invite) {
      return res.status(404).json({ error: 'Invite not found' });
    }

    if (invite.status !== 'PENDING') {
      return res.status(400).json({ error: `Invite has already been ${invite.status.toLowerCase()}` });
    }

    if (invite.expiresAt < new Date()) {
      await prisma.invite.update({
        where: { id: invite.id },
        data: { status: 'EXPIRED' }
      });
      return res.status(400).json({ error: 'Invite has expired' });
    }

    res.json({
      valid: true,
      phone: invite.phone,
      firstName: invite.firstName,
      lastName: invite.lastName,
      role: invite.role
    });
  } catch (error) {
    next(error);
  }
});

// Resend invite SMS
router.post('/:id/resend', authenticate, authorize('ADMIN', 'LEAGUE_OFFICIAL'), async (req, res, next) => {
  try {
    const invite = await prisma.invite.findUnique({
      where: { id: req.params.id }
    });

    if (!invite) {
      return res.status(404).json({ error: 'Invite not found' });
    }

    if (invite.status !== 'PENDING') {
      return res.status(400).json({ error: 'Can only resend pending invites' });
    }

    // Extend expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.invite.update({
      where: { id: invite.id },
      data: { expiresAt }
    });

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const inviteLink = `${baseUrl}/accept-invite/${invite.token}`;
    const message = `Reminder: You've been invited to join Pool League! Click here to create your account: ${inviteLink}`;

    const smsResult = await sendSms(invite.phone, message);

    await createAuditLog(
      req.user.id,
      'INVITE_RESENT',
      'Invite',
      invite.id,
      { phone: invite.phone },
      getClientIp(req)
    );

    res.json({
      message: 'Invite resent successfully',
      inviteLink: smsResult.dev ? inviteLink : undefined
    });
  } catch (error) {
    next(error);
  }
});

// Cancel invite
router.post('/:id/cancel', authenticate, authorize('ADMIN', 'LEAGUE_OFFICIAL'), async (req, res, next) => {
  try {
    const invite = await prisma.invite.findUnique({
      where: { id: req.params.id }
    });

    if (!invite) {
      return res.status(404).json({ error: 'Invite not found' });
    }

    if (invite.status !== 'PENDING') {
      return res.status(400).json({ error: 'Can only cancel pending invites' });
    }

    await prisma.invite.update({
      where: { id: invite.id },
      data: { status: 'CANCELLED' }
    });

    await createAuditLog(
      req.user.id,
      'INVITE_CANCELLED',
      'Invite',
      invite.id,
      { phone: invite.phone },
      getClientIp(req)
    );

    res.json({ message: 'Invite cancelled successfully' });
  } catch (error) {
    next(error);
  }
});

// Bulk invite (admin/league official)
router.post('/bulk', authenticate, authorize('ADMIN', 'LEAGUE_OFFICIAL'), async (req, res, next) => {
  try {
    const { invites } = req.body;

    if (!Array.isArray(invites) || invites.length === 0) {
      return res.status(400).json({ error: 'Invites array is required' });
    }

    if (invites.length > 50) {
      return res.status(400).json({ error: 'Maximum 50 invites per batch' });
    }

    const results = {
      sent: [],
      failed: []
    };

    for (const inviteData of invites) {
      try {
        const normalizedPhone = normalizePhone(inviteData.phone);

        // Check if user or pending invite exists
        const [existingUser, existingInvite] = await Promise.all([
          prisma.user.findFirst({ where: { phone: normalizedPhone } }),
          prisma.invite.findFirst({
            where: {
              phone: normalizedPhone,
              status: 'PENDING',
              expiresAt: { gt: new Date() }
            }
          })
        ]);

        if (existingUser) {
          results.failed.push({ phone: inviteData.phone, error: 'User already exists' });
          continue;
        }

        if (existingInvite) {
          results.failed.push({ phone: inviteData.phone, error: 'Pending invite exists' });
          continue;
        }

        const token = generateToken();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const invite = await prisma.invite.create({
          data: {
            phone: normalizedPhone,
            token,
            firstName: inviteData.firstName,
            lastName: inviteData.lastName,
            teamId: inviteData.teamId,
            role: inviteData.role || 'PLAYER',
            expiresAt,
            createdById: req.user.id
          }
        });

        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const inviteLink = `${baseUrl}/accept-invite/${token}`;
        const message = `You've been invited to join Pool League! Click here to create your account: ${inviteLink}`;

        await sendSms(normalizedPhone, message);

        results.sent.push({
          phone: inviteData.phone,
          id: invite.id
        });
      } catch (err) {
        results.failed.push({ phone: inviteData.phone, error: err.message });
      }
    }

    await createAuditLog(
      req.user.id,
      'BULK_INVITE_SENT',
      'Invite',
      null,
      { sent: results.sent.length, failed: results.failed.length },
      getClientIp(req)
    );

    res.json(results);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
