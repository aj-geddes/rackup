const express = require('express');
const router = express.Router();

// Public endpoint - returns league configuration for the frontend
router.get('/', (req, res) => {
  res.json({
    league: {
      name: process.env.LEAGUE_NAME || 'Pool League',
      shortName: process.env.LEAGUE_SHORT_NAME || 'League',
      description: process.env.LEAGUE_DESCRIPTION || 'Pool/Billiards League Management',
      contactEmail: process.env.LEAGUE_CONTACT_EMAIL || null,
      contactPhone: process.env.LEAGUE_CONTACT_PHONE || null,
      location: process.env.LEAGUE_LOCATION || null,
      website: process.env.LEAGUE_WEBSITE || null,
      rules: process.env.LEAGUE_RULES_URL || null
    },
    features: {
      smsEnabled: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
      googleDriveEnabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
    }
  });
});

module.exports = router;
