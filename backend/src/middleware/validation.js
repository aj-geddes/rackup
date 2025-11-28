const { body, param, query, validationResult } = require('express-validator');

// Validation result handler
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Common validation rules
const validations = {
  // Auth validations
  register: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/[a-z]/)
      .withMessage('Password must contain a lowercase letter')
      .matches(/[A-Z]/)
      .withMessage('Password must contain an uppercase letter')
      .matches(/\d/)
      .withMessage('Password must contain a number'),
    body('firstName')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('First name is required (max 50 characters)'),
    body('lastName')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Last name is required (max 50 characters)')
  ],

  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],

  // User validations
  updateUser: [
    body('firstName')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('First name must be 1-50 characters'),
    body('lastName')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Last name must be 1-50 characters'),
    body('handicap')
      .optional()
      .isInt({ min: 1, max: 9 })
      .withMessage('Handicap must be between 1 and 9')
  ],

  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters')
      .matches(/[a-z]/)
      .withMessage('Password must contain a lowercase letter')
      .matches(/[A-Z]/)
      .withMessage('Password must contain an uppercase letter')
      .matches(/\d/)
      .withMessage('Password must contain a number')
  ],

  // Team validations
  createTeam: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Team name must be 2-50 characters'),
    body('seasonId')
      .isUUID()
      .withMessage('Valid season ID is required')
  ],

  updateTeam: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Team name must be 2-50 characters'),
    body('captainId')
      .optional()
      .isUUID()
      .withMessage('Valid captain ID is required'),
    body('coCaptainId')
      .optional()
      .isUUID()
      .withMessage('Valid co-captain ID is required')
  ],

  // Match validations
  createMatch: [
    body('date')
      .isISO8601()
      .withMessage('Valid date is required'),
    body('time')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]( (AM|PM))?$/i)
      .withMessage('Valid time is required (e.g., 7:00 PM)'),
    body('homeTeamId')
      .isUUID()
      .withMessage('Valid home team ID is required'),
    body('awayTeamId')
      .isUUID()
      .withMessage('Valid away team ID is required'),
    body('seasonId')
      .isUUID()
      .withMessage('Valid season ID is required'),
    body('week')
      .isInt({ min: 1 })
      .withMessage('Week number must be a positive integer')
  ],

  updateMatchScore: [
    body('homeScore')
      .isInt({ min: 0 })
      .withMessage('Home score must be a non-negative integer'),
    body('awayScore')
      .isInt({ min: 0 })
      .withMessage('Away score must be a non-negative integer')
  ],

  // Season validations
  createSeason: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Season name must be 2-100 characters'),
    body('startDate')
      .isISO8601()
      .withMessage('Valid start date is required'),
    body('endDate')
      .isISO8601()
      .withMessage('Valid end date is required'),
    body('playoffDate')
      .optional()
      .isISO8601()
      .withMessage('Valid playoff date is required')
  ],

  // Announcement validations
  createAnnouncement: [
    body('title')
      .trim()
      .isLength({ min: 2, max: 200 })
      .withMessage('Title must be 2-200 characters'),
    body('content')
      .trim()
      .isLength({ min: 10, max: 5000 })
      .withMessage('Content must be 10-5000 characters'),
    body('isUrgent')
      .optional()
      .isBoolean()
      .withMessage('isUrgent must be a boolean')
  ],

  // Venue validations
  createVenue: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Venue name must be 2-100 characters'),
    body('address')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Address must be less than 200 characters'),
    body('city')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('City must be less than 100 characters'),
    body('phone')
      .optional()
      .trim()
      .matches(/^[\d\s\-\+\(\)]+$/)
      .withMessage('Invalid phone number format')
  ],

  // Common param validations
  uuidParam: (paramName = 'id') => [
    param(paramName)
      .isUUID()
      .withMessage(`Valid ${paramName} is required`)
  ],

  // Pagination
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ]
};

module.exports = {
  validate,
  validations
};
