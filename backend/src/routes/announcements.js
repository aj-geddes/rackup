const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, validations } = require('../middleware/validation');
const { createAuditLog, getClientIp } = require('../middleware/logger');

const router = express.Router();
const prisma = new PrismaClient();

// Get all announcements
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { active = 'true', limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (active === 'true') {
      where.isActive = true;
    }

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: [
          { isUrgent: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: parseInt(limit)
      }),
      prisma.announcement.count({ where })
    ]);

    res.json({
      data: announcements,
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

// Get announcement by ID
router.get('/:id', authenticate, validations.uuidParam('id'), validate, async (req, res, next) => {
  try {
    const announcement = await prisma.announcement.findUnique({
      where: { id: req.params.id },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    res.json(announcement);
  } catch (error) {
    next(error);
  }
});

// Create announcement (admin/league official only)
router.post('/', authenticate, authorize('ADMIN', 'LEAGUE_OFFICIAL'), validations.createAnnouncement, validate, async (req, res, next) => {
  try {
    const { title, content, isUrgent } = req.body;

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        isUrgent: isUrgent || false,
        creatorId: req.user.id
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    await createAuditLog(
      req.user.id,
      'ANNOUNCEMENT_CREATED',
      'Announcement',
      announcement.id,
      { title, isUrgent },
      getClientIp(req)
    );

    res.status(201).json(announcement);
  } catch (error) {
    next(error);
  }
});

// Update announcement
router.patch('/:id', authenticate, authorize('ADMIN', 'LEAGUE_OFFICIAL'), async (req, res, next) => {
  try {
    const { title, content, isUrgent, isActive } = req.body;

    // Verify creator or admin
    const existing = await prisma.announcement.findUnique({
      where: { id: req.params.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    // Only creator or admin can edit
    if (existing.creatorId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'You can only edit your own announcements' });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (isUrgent !== undefined) updateData.isUrgent = isUrgent;
    if (isActive !== undefined) updateData.isActive = isActive;

    const announcement = await prisma.announcement.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    await createAuditLog(
      req.user.id,
      'ANNOUNCEMENT_UPDATED',
      'Announcement',
      req.params.id,
      updateData,
      getClientIp(req)
    );

    res.json(announcement);
  } catch (error) {
    next(error);
  }
});

// Delete announcement
router.delete('/:id', authenticate, authorize('ADMIN', 'LEAGUE_OFFICIAL'), validations.uuidParam('id'), validate, async (req, res, next) => {
  try {
    const existing = await prisma.announcement.findUnique({
      where: { id: req.params.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    // Only creator or admin can delete
    if (existing.creatorId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'You can only delete your own announcements' });
    }

    await prisma.announcement.delete({
      where: { id: req.params.id }
    });

    await createAuditLog(
      req.user.id,
      'ANNOUNCEMENT_DELETED',
      'Announcement',
      req.params.id,
      null,
      getClientIp(req)
    );

    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
