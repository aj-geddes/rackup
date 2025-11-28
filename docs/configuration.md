---
layout: default
title: Settings Reference
description: Complete reference for all settings and options. Most users won't need this.
---

# Settings Reference

**Most users don't need this page.** The [Get Started guide](get-started) covers everything you need for a standard setup.

This page is for:
- Troubleshooting when something isn't working
- Understanding what each setting does
- Advanced customization

---

## Quick Reference

All settings are configured as environment variables in Railway.

| Category | Settings |
|----------|----------|
| [Required](#required-settings) | DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, FRONTEND_URL, NODE_ENV |
| [League Info](#league-information) | LEAGUE_NAME, LEAGUE_SHORT_NAME, LEAGUE_DESCRIPTION, etc. |
| [Admin Account](#admin-account) | ADMIN_EMAIL, ADMIN_PASSWORD |
| [Text Messages](#text-messages-twilio) | TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER |
| [Cloud Backups](#cloud-backups-google-drive) | GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI |
| [Advanced](#advanced-settings) | JWT expiry, rate limiting |

---

## Required Settings

These must be set for the app to work.

### DATABASE_URL

**What it is:** The connection string to your PostgreSQL database.

**How to set it:** In Railway, use "Add Reference" to connect to your PostgreSQL service. Don't type this manually.

**Example:** `postgresql://user:password@host:5432/database?schema=public`

### JWT_SECRET

**What it is:** A secret key used to create secure login sessions.

**How to set it:** Generate a random string at [randomkeygen.com](https://randomkeygen.com/) (use a "CodeIgniter Encryption Key").

**Important:** Must be different from JWT_REFRESH_SECRET.

### JWT_REFRESH_SECRET

**What it is:** A second secret key for long-term login sessions.

**How to set it:** Generate another random string (different from JWT_SECRET).

### FRONTEND_URL

**What it is:** Your app's URL, used for security settings.

**How to set it:** Copy your Railway URL exactly, including `https://`.

**Example:** `https://my-league-production.up.railway.app`

### NODE_ENV

**What it is:** Tells the app to run in production mode.

**How to set it:** Always set to `production` for Railway deployments.

---

## League Information

These customize how your league appears.

| Setting | What it does | Example |
|---------|--------------|---------|
| `LEAGUE_NAME` | Full name shown on login screen and titles | `Kansas City Women's Pool League` |
| `LEAGUE_SHORT_NAME` | Abbreviation for mobile headers | `KCWPL` |
| `LEAGUE_DESCRIPTION` | Tagline shown on home page | `The premier women's pool league in KC` |
| `LEAGUE_LOCATION` | City/region | `Kansas City, MO` |
| `LEAGUE_CONTACT_EMAIL` | Contact email (optional) | `info@kcwpl.com` |
| `LEAGUE_CONTACT_PHONE` | Contact phone (optional) | `+1-555-123-4567` |
| `LEAGUE_WEBSITE` | External website link (optional) | `https://kcwpl.com` |
| `LEAGUE_RULES_URL` | Link to rules document (optional) | `https://kcwpl.com/rules` |

All league info settings have defaults if not specified.

---

## Admin Account

These create your initial administrator account.

### ADMIN_EMAIL

**What it is:** Email address for the first admin account.

**Important:** This is the email you'll use to log in. Make sure you have access to it.

### ADMIN_PASSWORD

**What it is:** Initial password for the admin account.

**Important:**
- Use a strong password (8+ characters, mix of letters/numbers)
- Change this password after your first login
- Don't use simple passwords like "password123"

---

## Text Messages (Twilio)

These settings enable automatic SMS invites. See the [full Twilio setup guide](twilio-setup) for instructions.

| Setting | What it is |
|---------|------------|
| `TWILIO_ACCOUNT_SID` | Your Account SID from Twilio (starts with "AC") |
| `TWILIO_AUTH_TOKEN` | Your Auth Token from Twilio |
| `TWILIO_FROM_NUMBER` | Your Twilio phone number (format: `+15551234567`) |

**If not set:** Invite links will appear in the admin panel for manual sharing instead of being texted.

---

## Cloud Backups (Google Drive)

These settings enable automatic backups to Google Drive. See the [full Google Drive setup guide](google-drive-setup) for instructions.

| Setting | What it is |
|---------|------------|
| `GOOGLE_CLIENT_ID` | Your OAuth Client ID (ends with `.apps.googleusercontent.com`) |
| `GOOGLE_CLIENT_SECRET` | Your OAuth Client Secret |
| `GOOGLE_REDIRECT_URI` | Must be exactly `https://YOUR-APP.railway.app/admin/backups` |

**If not set:** You can still download backups manually from the admin panel.

---

## Advanced Settings

These have sensible defaults. Only change them if you have a specific reason.

### JWT_EXPIRES_IN

**Default:** `15m` (15 minutes)

**What it does:** How long a login session lasts before requiring re-authentication.

**Why you might change it:**
- Shorter = more secure, but users log in more often
- Longer = more convenient, but sessions stay active longer

### JWT_REFRESH_EXPIRES_IN

**Default:** `7d` (7 days)

**What it does:** How long before a user must fully log in again (vs. automatic session refresh).

### RATE_LIMIT_WINDOW_MS

**Default:** `900000` (15 minutes in milliseconds)

**What it does:** Time window for rate limiting.

### RATE_LIMIT_MAX_REQUESTS

**Default:** `100`

**What it does:** Maximum requests per window. Prevents abuse.

### PORT

**Default:** `3001`

**What it does:** Which port the server listens on.

**Note:** Railway sets this automatically. Don't change it unless you know what you're doing.

---

## User Roles Explained

Rackup has four permission levels:

| Role | What they can do |
|------|------------------|
| **Player** | View standings, schedule, their team, their own profile |
| **Captain** | Everything a Player can do, plus manage their team's roster and enter scores |
| **League Official** | Everything a Captain can do, plus manage all teams, create seasons, post announcements |
| **Admin** | Everything, including managing users and resetting passwords |

### Changing Roles

Admins can change user roles:
1. Go to Admin → Users
2. Click on a user
3. Change their role
4. Save

Be careful with Admin access - they can do anything in the system.

---

## Troubleshooting Common Issues

### "Database connection failed"

- Check that DATABASE_URL is set via "Add Reference" to your PostgreSQL service
- Make sure your PostgreSQL service is running (check for a green dot in Railway)
- Try redeploying

### "Invalid token" errors

- Your JWT_SECRET or JWT_REFRESH_SECRET might have been changed
- Users will need to log in again
- If the problem persists, generate new secrets

### "CORS error" in browser

- FRONTEND_URL doesn't match your actual URL
- Check for missing `https://` or trailing slashes
- Must match exactly

### "Redirect URI mismatch" (Google Drive)

- GOOGLE_REDIRECT_URI doesn't exactly match what's in Google Cloud Console
- Check for trailing slashes
- Both must be exactly the same

### App is slow to start

- Railway "sleeps" apps that haven't been used recently
- First request wakes it up (can take 10-30 seconds)
- Subsequent requests are fast
- This is normal for Hobby plan

---

## Getting Help

If something isn't working:

1. **Check the logs** - In Railway, click your app and view logs
2. **Review this page** - Make sure all required settings are present
3. **Try redeploying** - Sometimes a fresh deploy fixes issues
4. **Ask for help** - [Open an issue on GitHub](https://github.com/aj-geddes/rackup/issues)

<div class="quick-links">
  <a href="get-started">Back to Setup Guide</a>
</div>
