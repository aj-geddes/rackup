const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Request logger middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logMessage = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;

    if (res.statusCode >= 400) {
      console.error(logMessage);
    } else if (process.env.NODE_ENV !== 'production') {
      console.log(logMessage);
    }
  });

  next();
};

// Audit log function for important actions
const createAuditLog = async (userId, action, entity, entityId, details, ipAddress) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details: details ? JSON.stringify(details) : null,
        ipAddress
      }
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};

// Get client IP address
const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || req.ip;
};

module.exports = {
  requestLogger,
  createAuditLog,
  getClientIp
};
