# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

### Backend (Express.js API)
```bash
cd backend
npm install
npm run dev          # Development server with nodemon (port 3001)
npm start            # Production server
```

### Frontend (React/Vite)
```bash
cd frontend
npm install
npm run dev          # Development server (port 5173)
npm run build        # Production build
npm run preview      # Preview production build
```

### Database (Prisma + PostgreSQL)
The app self-initializes the database on startup. Manual commands for development:
```bash
cd backend
npx prisma generate         # Regenerate Prisma client after schema changes
npx prisma db push          # Push schema changes (development)
npx prisma db seed          # Re-seed database
npx prisma studio           # Open Prisma Studio GUI
```

### Docker (local development)
```bash
docker-compose up --build   # Start all services (PostgreSQL, backend, frontend)
```

## Deployment

This application is deployed on **Railway** with:
- Backend service using the root `Dockerfile`
- PostgreSQL database (Railway-managed)
- Frontend deployed separately

### Railway Environment Variables (production)
- `DATABASE_URL` - Injected from Railway PostgreSQL service
- `JWT_SECRET`, `JWT_REFRESH_SECRET` - Token signing keys
- `FRONTEND_URL` - `rackup-production.up.railway.com`
- `NODE_ENV` - `production`

### Railway Configuration
See `railway.toml` for build settings. Health check endpoint: `/health`

## Architecture Overview

This is a pool/billiards league management application with invite-only registration.

### Backend Structure (`backend/src/`)
- **Entry point**: `index.js` - Express server with rate limiting, CORS, Helmet security
- **Database init**: `db/init.js` - Self-initializing database module (see below)
- **Routes**: `/routes/*.js` - RESTful endpoints (auth, users, teams, matches, seasons, standings, announcements, backups, admin, venues, invites)
- **Middleware**: `/middleware/` - `auth.js` (JWT authentication + role-based authorization), `validation.js`, `errorHandler.js`, `logger.js`
- **Database**: Prisma ORM with PostgreSQL (`prisma/schema.prisma`)

### Self-Initializing Database
On startup, the backend automatically:
1. Checks database connection
2. Detects if required tables exist
3. If tables missing: pushes Prisma schema (`db push`) and runs seed
4. If tables exist but empty: runs seed only

This allows fresh Railway deployments to self-configure without manual migration steps.

### Role Hierarchy
Four roles with cascading permissions: `PLAYER` < `CAPTAIN` < `LEAGUE_OFFICIAL` < `ADMIN`

### Authentication Flow
- JWT access tokens (15min) + refresh tokens (7 days)
- Backend middleware: `authenticate` (verify token), `authorize(...roles)` (check role)
- Frontend: Tokens stored in localStorage, automatic refresh on 401 with `TOKEN_EXPIRED` code

### Database Models (key relationships)
- **User** → belongs to Team, can be captain/co-captain of Team
- **Team** → belongs to Season, has captain/co-captain/members
- **Match** → belongs to Season, has homeTeam/awayTeam/venue
- **Standing** → per team per season
- **PlayerStats** → per player per season
- **Invite** → phone-based registration system

### API Routes
All routes prefixed with `/api/`:
- `/auth` - login, register, logout, refresh, me, change-password
- `/users`, `/teams`, `/matches`, `/seasons`, `/standings`, `/announcements`, `/venues`, `/invites`
- `/admin` - dashboard, audit-logs, create-admin, import-users, reset-password, generate-schedule
- `/backups` - local download, Google Drive integration
- `/config` - public endpoint returning league branding and feature flags

### Frontend Structure (`frontend/src/`)
- **Entry point**: `App.jsx` - React Router with protected routes
- **Contexts**:
  - `context/AuthContext.jsx` - Authentication state and role helpers
  - `context/ConfigContext.jsx` - League configuration from `/api/config`
- **API**: `services/api.js` - Centralized API client with automatic token refresh
- **Pages**: `/pages/` - HomePage, StandingsPage, SchedulePage, TeamPage, ProfilePage, AdminPage, LoginPage, AcceptInvitePage

### League Customization
League branding is configured via environment variables and served via `/api/config`:
- `LEAGUE_NAME` - Full league name (e.g., "Kansas City Pool League")
- `LEAGUE_SHORT_NAME` - Abbreviated name for mobile
- `LEAGUE_DESCRIPTION` - Tagline/description
- `LEAGUE_LOCATION`, `LEAGUE_CONTACT_EMAIL`, `LEAGUE_CONTACT_PHONE` - Contact info
- `LEAGUE_WEBSITE`, `LEAGUE_RULES_URL` - External links

### Local Environment Configuration
For local development, backend requires `.env` file (copy from `.env.example`):
- `DATABASE_URL` - Local PostgreSQL connection string
- `JWT_SECRET`, `JWT_REFRESH_SECRET` - Token signing keys
- `FRONTEND_URL` - `http://localhost:5173`
- `LEAGUE_NAME`, `LEAGUE_SHORT_NAME` - League branding
- Optional: Twilio SMS, Google Drive API credentials

See `docs/configuration.md` for full variable reference.
