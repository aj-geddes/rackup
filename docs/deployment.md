---
layout: default
title: Deployment Guide
description: Step-by-step guide to deploying Pool League Management on Railway
---

# Deploying to Railway

This guide walks you through deploying the Pool League application to Railway.

## Prerequisites

- A [Railway](https://railway.app) account (free tier works)
- A GitHub account with this repository forked
- (Optional) Twilio account for SMS invites
- (Optional) Google Cloud project for Drive backups

## Step 1: Create a New Project

1. Log in to [Railway](https://railway.app)
2. Click **New Project**
3. Select **Deploy from GitHub repo**
4. Connect your GitHub account if needed
5. Select your forked repository

## Step 2: Add PostgreSQL Database

1. In your project, click **New Service**
2. Select **Database** → **PostgreSQL**
3. Railway will automatically provision the database
4. The `DATABASE_URL` will be available as an environment variable

## Step 3: Deploy the Backend

1. Click **New Service** → **GitHub Repo**
2. Select the same repository
3. In the service settings:
   - Set **Root Directory** to `backend`
   - Railway will detect the Dockerfile automatically

4. Add these environment variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Auto-linked from Postgres |
| `JWT_SECRET` | Generate a secure random string | Main auth secret |
| `JWT_REFRESH_SECRET` | Generate a secure random string | Refresh token secret |
| `JWT_EXPIRES_IN` | `15m` | Access token lifetime |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token lifetime |
| `PORT` | `3001` | Server port |
| `NODE_ENV` | `production` | Environment |
| `FRONTEND_URL` | Your frontend URL | For CORS |
| `ADMIN_EMAIL` | Your email | Initial admin account |
| `ADMIN_PASSWORD` | Secure password | Initial admin password |

5. Deploy the service

### Generate Secure Secrets

Run this command to generate secure secrets:

```bash
openssl rand -base64 64
```

Use different values for `JWT_SECRET` and `JWT_REFRESH_SECRET`.

## Step 4: Deploy the Frontend

1. Click **New Service** → **GitHub Repo**
2. Select the same repository
3. In service settings:
   - Set **Root Directory** to `frontend`

4. Add this environment variable:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | Your backend URL + `/api` (e.g., `https://your-backend.railway.app/api`) |

5. Deploy the service

## Step 5: Initialize the Database

The backend will automatically run migrations on startup. To seed initial data:

1. Open the backend service in Railway
2. Go to **Settings** → **Deployment**
3. In the Deploy Command, add:
   ```
   npx prisma migrate deploy && npx prisma db seed && npm start
   ```
4. Redeploy the service

This only needs to run once. After seeding, change the command back to just:
```
npx prisma migrate deploy && npm start
```

## Step 6: Verify Deployment

1. Visit your frontend URL
2. Log in with your admin credentials
3. Check the Admin panel works correctly

## Optional: Configure SMS (Twilio)

To enable SMS invites:

1. Create a [Twilio](https://twilio.com) account
2. Get your Account SID and Auth Token
3. Purchase a phone number

4. Add these environment variables to the backend:

| Variable | Value |
|----------|-------|
| `TWILIO_ACCOUNT_SID` | Your Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Your Twilio Auth Token |
| `TWILIO_FROM_NUMBER` | Your Twilio phone number |

5. Redeploy the backend

Without Twilio configured, invite links will be logged to the console (visible in Railway logs) and returned in the API response.

## Optional: Configure Google Drive Backup

To enable Google Drive backups:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable the Google Drive API
4. Create OAuth 2.0 credentials (Web application)
5. Set the redirect URI to: `https://your-frontend.railway.app/admin/backups`

6. Add these environment variables to the backend:

| Variable | Value |
|----------|-------|
| `GOOGLE_CLIENT_ID` | Your OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Your OAuth Client Secret |
| `GOOGLE_REDIRECT_URI` | Your redirect URI |

7. Redeploy the backend
8. Connect Google Drive from Admin → Backups

## Custom Domain (Optional)

To use a custom domain:

1. Go to your Railway service settings
2. Click **Settings** → **Networking**
3. Add your custom domain
4. Update DNS records as instructed

Remember to update `FRONTEND_URL` and `VITE_API_URL` environment variables if you change domains.

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correctly linked
- Check if PostgreSQL service is running
- View logs for connection errors

### Frontend Can't Connect to API
- Verify `VITE_API_URL` is correct
- Check CORS settings in `FRONTEND_URL`
- Ensure backend is deployed and running

### SMS Not Working
- Verify Twilio credentials are correct
- Check Twilio account has credit
- View backend logs for errors

### Migrations Failing
- Check for database connection
- Run `npx prisma migrate status` locally to debug
- Reset database if needed (caution: data loss)

## Costs

Railway's free tier includes:
- 500 hours of compute
- $5 of resource usage

For a small league, this should be sufficient. Larger leagues may need the paid plan.

## Next Steps

- [Configure additional settings](configuration.md)
- [Review the API documentation](api.md)
- Set up your first season and teams!
