---
layout: default
title: Configuration Guide
---

# Configuration Guide

Complete reference for all environment variables and configuration options.

## Backend Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret for signing access tokens | 64+ character random string |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens | 64+ character random string |
| `FRONTEND_URL` | Frontend URL for CORS | `https://your-app.railway.app` |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `NODE_ENV` | `development` | Environment mode |
| `JWT_EXPIRES_IN` | `15m` | Access token lifetime |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token lifetime |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Max requests per window |

### Initial Admin Setup

| Variable | Description |
|----------|-------------|
| `ADMIN_EMAIL` | Email for initial admin account |
| `ADMIN_PASSWORD` | Password for initial admin (change after first login!) |

### Twilio SMS Configuration

| Variable | Description |
|----------|-------------|
| `TWILIO_ACCOUNT_SID` | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token |
| `TWILIO_FROM_NUMBER` | Twilio phone number (e.g., `+15551234567`) |

### Google Drive Configuration

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 Client Secret |
| `GOOGLE_REDIRECT_URI` | OAuth callback URL |

## Frontend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://api.example.com/api` |

## Database Configuration

### PostgreSQL Requirements

- PostgreSQL 14 or higher
- UTF-8 encoding
- SSL recommended for production

### Connection String Format

```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
```

For Railway, use the auto-generated `DATABASE_URL` from the PostgreSQL service.

## Security Configuration

### JWT Token Lifetimes

Recommended settings for production:

| Token Type | Lifetime | Purpose |
|------------|----------|---------|
| Access Token | 15 minutes | Short-lived for API calls |
| Refresh Token | 7 days | Used to get new access tokens |

Shorter access token lifetimes are more secure but require more frequent refreshes.

### Rate Limiting

The API uses rate limiting to prevent abuse:

| Endpoint | Window | Max Requests |
|----------|--------|--------------|
| All `/api/*` | 15 min | 100 |
| `/api/auth/login` | 15 min | 10 |
| `/api/auth/accept-invite` | 15 min | 10 |

### Password Requirements

User passwords must:
- Be at least 8 characters
- Contain at least one lowercase letter
- Contain at least one uppercase letter
- Contain at least one number

### CORS Configuration

The backend only accepts requests from the URL specified in `FRONTEND_URL`. Multiple origins are not supported by default.

## User Roles

| Role | Level | Description |
|------|-------|-------------|
| `PLAYER` | 1 | Basic player account |
| `CAPTAIN` | 2 | Team captain with roster management |
| `LEAGUE_OFFICIAL` | 3 | Can manage teams, schedules, announcements |
| `ADMIN` | 4 | Full system access |

### Role Permissions

| Action | Player | Captain | Official | Admin |
|--------|--------|---------|----------|-------|
| View standings | ✓ | ✓ | ✓ | ✓ |
| View schedule | ✓ | ✓ | ✓ | ✓ |
| View team | ✓ | ✓ | ✓ | ✓ |
| Edit own profile | ✓ | ✓ | ✓ | ✓ |
| Add team members | | ✓ | ✓ | ✓ |
| Enter match scores | | ✓ | ✓ | ✓ |
| Send invites | | ✓* | ✓ | ✓ |
| Create teams | | | ✓ | ✓ |
| Create seasons | | | ✓ | ✓ |
| Create announcements | | | ✓ | ✓ |
| Manage backups | | | ✓ | ✓ |
| Manage users | | | | ✓ |
| Change user roles | | | | ✓ |
| Reset passwords | | | | ✓ |

*Captains can only invite to their own team

## Backup Configuration

### Local Backups

Local backups are always available. They download as:
- **Full Backup**: JSON file with all data
- **Standings CSV**: Current team standings
- **Player Stats CSV**: Player statistics

### Google Drive Backups

To enable Google Drive:

1. Create a Google Cloud project
2. Enable the Drive API
3. Create OAuth 2.0 credentials
4. Set the correct redirect URI
5. Configure environment variables
6. Connect via Admin → Backups

Backups are stored in a single folder (configurable in the admin panel).

## Handicap System

Players have a handicap from 1-9:

| Handicap | Skill Level |
|----------|-------------|
| 1-2 | Beginner |
| 3-4 | Intermediate |
| 5-6 | Advanced |
| 7-8 | Expert |
| 9 | Professional |

Captains and admins can adjust player handicaps as needed.

## Season Configuration

A season includes:
- Name (e.g., "Fall 2024 Season")
- Start date
- End date
- Playoff date (optional)
- Active status (only one season active at a time)

The system automatically tracks:
- Week number
- Season progress percentage
- Playoff qualification

## Venue Management

Venues can include:
- Name
- Address
- City
- Phone number
- Active/inactive status

Inactive venues are hidden from match scheduling.
