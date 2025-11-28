---
layout: default
title: Pool League Management
description: Complete documentation for the Pool League Management Application
---

# Pool League Management Application

A complete, production-ready pool/billiards league management system designed for easy deployment on Railway.

<div class="quick-links">
  <a href="deployment">Get Started</a>
  <a href="api">API Docs</a>
  <a href="configuration">Configuration</a>
</div>

---

## Overview

This application provides everything you need to run a pool league:

| Feature | Description |
|---------|-------------|
| **Player Management** | Invite players via SMS, manage profiles and handicaps |
| **Team Organization** | Create teams, assign captains, manage rosters |
| **Match Scheduling** | Full schedule management with venue assignments |
| **Standings & Rankings** | Automatic calculation of team standings and player rankings |
| **League Administration** | Comprehensive admin dashboard for league officials |
| **Data Backup** | Local downloads and Google Drive integration |

---

## Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 18, Tailwind CSS, Vite |
| Backend | Node.js, Express.js |
| Database | PostgreSQL with Prisma ORM |
| Auth | JWT with refresh tokens |
| SMS | Twilio (optional) |
| Storage | Google Drive API (optional) |

---

## Key Features

### Security-First Design

- Invite-only registration via SMS
- Phone number verification
- Strong password requirements
- JWT-based authentication
- Rate limiting and security headers

### Role-Based Access Control

| Role | Permissions |
|------|-------------|
| **Player** | View standings, schedule, own team |
| **Captain** | Add/remove team members, enter scores |
| **League Official** | Create teams, schedule matches, announcements |
| **Admin** | Full system access including user management |

### Mobile-First UI

The entire application is designed mobile-first, perfect for players checking standings at the bar or captains entering scores after a match.

---

## Getting Started

Ready to set up your own league? Head to the **[Deployment Guide](deployment)** to get started in just a few minutes.

### Quick Links

- **[Deployment Guide](deployment)** - Set up on Railway
- **[Configuration Guide](configuration)** - Environment variables and settings
- **[API Reference](api)** - Backend API documentation
