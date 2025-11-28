---
layout: default
title: API Reference
description: Complete API documentation for the Pool League backend
---

# API Reference

Complete API documentation for the Pool League backend.

## Base URL

```
https://your-backend.railway.app/api
```

## Authentication

Most endpoints require a valid JWT access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Token Refresh

Access tokens expire after 15 minutes. Use the refresh token to get a new one:

```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "<refresh_token>"
}
```

## Endpoints

### Authentication

#### Accept Invite (Register)

```http
POST /auth/accept-invite
Content-Type: application/json

{
  "token": "invite-token-from-sms",
  "email": "player@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe"
}
```

Returns user data and tokens.

#### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "player@example.com",
  "password": "SecurePass123"
}
```

#### Get Current User

```http
GET /auth/me
Authorization: Bearer <token>
```

#### Change Password

```http
POST /auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "OldPass123",
  "newPassword": "NewPass456"
}
```

#### Logout

```http
POST /auth/logout
Authorization: Bearer <token>
Content-Type: application/json

{
  "refreshToken": "<refresh_token>"
}
```

---

### Invites

*Requires: CAPTAIN, LEAGUE_OFFICIAL, or ADMIN role*

#### List Invites

```http
GET /invites?status=PENDING&page=1&limit=20
Authorization: Bearer <token>
```

#### Send Invite

```http
POST /invites
Authorization: Bearer <token>
Content-Type: application/json

{
  "phone": "+15551234567",
  "firstName": "Jane",
  "lastName": "Smith",
  "teamId": "team-uuid",
  "role": "PLAYER"
}
```

#### Verify Invite Token (Public)

```http
GET /invites/verify/<token>
```

#### Resend Invite

```http
POST /invites/<id>/resend
Authorization: Bearer <token>
```

#### Cancel Invite

```http
POST /invites/<id>/cancel
Authorization: Bearer <token>
```

---

### Users

#### List Users

*Requires: LEAGUE_OFFICIAL or ADMIN*

```http
GET /users?page=1&limit=20&search=john&teamId=uuid&role=PLAYER
Authorization: Bearer <token>
```

#### Get User

```http
GET /users/<id>
Authorization: Bearer <token>
```

#### Update User

```http
PATCH /users/<id>
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Smith",
  "handicap": 5
}
```

#### Change User Role

*Requires: ADMIN*

```http
PATCH /users/<id>/role
Authorization: Bearer <token>
Content-Type: application/json

{
  "role": "CAPTAIN"
}
```

---

### Teams

#### List Teams

```http
GET /teams?seasonId=uuid
Authorization: Bearer <token>
```

#### Get Team

```http
GET /teams/<id>
Authorization: Bearer <token>
```

#### Create Team

*Requires: LEAGUE_OFFICIAL or ADMIN*

```http
POST /teams
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Rack Attack",
  "seasonId": "season-uuid",
  "captainId": "user-uuid"
}
```

#### Add Team Member

*Requires: Captain of team, LEAGUE_OFFICIAL, or ADMIN*

```http
POST /teams/<id>/members
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "user-uuid"
}
```

#### Remove Team Member

```http
DELETE /teams/<id>/members/<userId>
Authorization: Bearer <token>
```

---

### Matches

#### List Matches

```http
GET /matches?seasonId=uuid&teamId=uuid&status=SCHEDULED&upcoming=true&limit=50
Authorization: Bearer <token>
```

#### Get Match

```http
GET /matches/<id>
Authorization: Bearer <token>
```

#### Create Match

*Requires: LEAGUE_OFFICIAL or ADMIN*

```http
POST /matches
Authorization: Bearer <token>
Content-Type: application/json

{
  "date": "2024-12-05",
  "time": "7:00 PM",
  "homeTeamId": "team-uuid",
  "awayTeamId": "team-uuid",
  "venueId": "venue-uuid",
  "seasonId": "season-uuid",
  "week": 14
}
```

#### Update Match Score

*Requires: Captain of either team, LEAGUE_OFFICIAL, or ADMIN*

```http
PATCH /matches/<id>/score
Authorization: Bearer <token>
Content-Type: application/json

{
  "homeScore": 5,
  "awayScore": 3
}
```

---

### Seasons

#### List Seasons

```http
GET /seasons?active=true
Authorization: Bearer <token>
```

#### Get Active Season

```http
GET /seasons/active
Authorization: Bearer <token>
```

#### Create Season

*Requires: LEAGUE_OFFICIAL or ADMIN*

```http
POST /seasons
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Spring 2025 Season",
  "startDate": "2025-01-15",
  "endDate": "2025-05-15",
  "playoffDate": "2025-05-22"
}
```

#### Activate Season

```http
POST /seasons/<id>/activate
Authorization: Bearer <token>
```

---

### Standings

#### Get Team Standings

```http
GET /standings?seasonId=uuid
Authorization: Bearer <token>
```

#### Get Player Rankings

```http
GET /standings/players?seasonId=uuid&limit=50
Authorization: Bearer <token>
```

---

### Announcements

#### List Announcements

```http
GET /announcements?active=true&limit=20&page=1
Authorization: Bearer <token>
```

#### Create Announcement

*Requires: LEAGUE_OFFICIAL or ADMIN*

```http
POST /announcements
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Playoffs Start Next Week!",
  "content": "Top 4 teams will compete...",
  "isUrgent": true
}
```

---

### Backups

*Requires: LEAGUE_OFFICIAL or ADMIN*

#### Download Full Backup

```http
GET /backups/download
Authorization: Bearer <token>
```

Returns JSON file.

#### Download Standings CSV

```http
GET /backups/download/csv/standings?seasonId=uuid
Authorization: Bearer <token>
```

#### Download Player Stats CSV

```http
GET /backups/download/csv/players?seasonId=uuid
Authorization: Bearer <token>
```

#### Upload to Google Drive

```http
POST /backups/google/upload
Authorization: Bearer <token>
```

---

### Admin

*Requires: LEAGUE_OFFICIAL or ADMIN*

#### Get Dashboard Stats

```http
GET /admin/dashboard
Authorization: Bearer <token>
```

#### Get Audit Logs

*Requires: ADMIN*

```http
GET /admin/audit-logs?page=1&limit=50&action=LOGIN
Authorization: Bearer <token>
```

#### Generate Schedule

```http
POST /admin/generate-schedule
Authorization: Bearer <token>
Content-Type: application/json

{
  "seasonId": "season-uuid",
  "startDate": "2025-01-15",
  "weeksCount": 18,
  "matchTime": "7:00 PM",
  "venueRotation": true
}
```

---

## Error Responses

All errors return JSON with an `error` field:

```json
{
  "error": "Error message here"
}
```

### Common Status Codes

| Code | Meaning |
|------|---------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid or expired token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Duplicate resource |
| 429 | Too Many Requests - Rate limited |
| 500 | Server Error - Something went wrong |

### Token Expired Response

```json
{
  "error": "Token expired.",
  "code": "TOKEN_EXPIRED"
}
```

Use the refresh token to get a new access token.
