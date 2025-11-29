const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, validations } = require('../middleware/validation');
const { createAuditLog, getClientIp } = require('../middleware/logger');

const router = express.Router();
const prisma = new PrismaClient();

// Get all venues
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { active } = req.query;

    const where = {};
    if (active === 'true') {
      where.isActive = true;
    }

    const venues = await prisma.venue.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    res.json(venues);
  } catch (error) {
    next(error);
  }
});

// Get venue by ID
router.get('/:id', authenticate, validations.uuidParam('id'), validate, async (req, res, next) => {
  try {
    const venue = await prisma.venue.findUnique({
      where: { id: req.params.id },
      include: {
        matches: {
          where: {
            date: { gte: new Date() },
            status: 'SCHEDULED'
          },
          include: {
            homeTeam: { select: { id: true, name: true } },
            awayTeam: { select: { id: true, name: true } }
          },
          orderBy: { date: 'asc' },
          take: 10
        }
      }
    });

    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    res.json(venue);
  } catch (error) {
    next(error);
  }
});

// Create venue (admin/league official only)
router.post('/', authenticate, authorize('ADMIN', 'LEAGUE_OFFICIAL'), validations.createVenue, validate, async (req, res, next) => {
  try {
    const { name, address, city, phone } = req.body;

    const venue = await prisma.venue.create({
      data: {
        name,
        address,
        city,
        phone
      }
    });

    await createAuditLog(req.user.id, 'VENUE_CREATED', 'Venue', venue.id, { name }, getClientIp(req));

    res.status(201).json(venue);
  } catch (error) {
    next(error);
  }
});

// Update venue
router.patch('/:id', authenticate, authorize('ADMIN', 'LEAGUE_OFFICIAL'), async (req, res, next) => {
  try {
    const { name, address, city, phone, isActive } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (phone !== undefined) updateData.phone = phone;
    if (isActive !== undefined) updateData.isActive = isActive;

    const venue = await prisma.venue.update({
      where: { id: req.params.id },
      data: updateData
    });

    await createAuditLog(req.user.id, 'VENUE_UPDATED', 'Venue', req.params.id, updateData, getClientIp(req));

    res.json(venue);
  } catch (error) {
    next(error);
  }
});

// Delete venue (admin only)
router.delete('/:id', authenticate, authorize('ADMIN'), validations.uuidParam('id'), validate, async (req, res, next) => {
  try {
    const venueId = req.params.id;

    // Remove venue reference from any matches
    await prisma.match.updateMany({
      where: { venueId },
      data: { venueId: null }
    });

    await prisma.venue.delete({
      where: { id: venueId }
    });

    await createAuditLog(req.user.id, 'VENUE_DELETED', 'Venue', venueId, null, getClientIp(req));

    res.json({ message: 'Venue deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
