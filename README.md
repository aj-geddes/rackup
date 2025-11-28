# Pool League Management Application

A full-stack pool/billiards league management application built with React, Node.js/Express, PostgreSQL, and designed for Railway deployment.

## Features

- **Invite-Only Registration**: Secure SMS-based invite system using phone numbers
- **Team Management**: Create and manage teams, rosters, and captains
- **Match Scheduling**: Full schedule management with venue support
- **Standings & Rankings**: Automatic standings calculation and player rankings
- **Admin Dashboard**: League officials can manage all aspects of the league
- **Backup System**: Local JSON/CSV downloads and Google Drive integration
- **Role-Based Access**: Players, Captains, League Officials, and Admins
- **Mobile-First Design**: Responsive UI optimized for mobile devices

## Tech Stack

- **Frontend**: React 18, React Router, Tailwind CSS, Vite
- **Backend**: Node.js, Express.js, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: JWT with refresh tokens
- **SMS**: Twilio (optional)
- **Cloud Storage**: Google Drive API (optional)

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Local Development

1. Clone the repository:
```bash
git clone <repository-url>
cd rackup
```

2. Set up the backend:
```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials
npm install
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

3. Set up the frontend:
```bash
cd frontend
npm install
npm run dev
```

4. Open http://localhost:5173 in your browser

### Default Admin Credentials

After seeding the database:
- **Email**: admin@poolleague.com
- **Password**: Admin123!

## Docker Development

```bash
docker-compose up --build
```

This starts PostgreSQL, the backend API, and the frontend.

## Railway Deployment

See the [Deployment Guide](docs/deployment.md) for detailed Railway setup instructions.

## Documentation

- [Application Overview](docs/index.md)
- [Deployment Guide](docs/deployment.md)
- [API Reference](docs/api.md)
- [Configuration](docs/configuration.md)

## Project Structure

```
rackup/
├── backend/           # Express.js API server
│   ├── prisma/       # Database schema and migrations
│   ├── src/
│   │   ├── routes/   # API route handlers
│   │   ├── middleware/ # Auth, validation, logging
│   │   └── index.js  # Main entry point
│   └── Dockerfile
├── frontend/          # React application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── services/
│   │   └── styles/
│   └── Dockerfile
├── docs/             # GitHub Pages documentation
├── docker-compose.yml
└── railway.toml
```

## Security Features

- Password hashing with bcrypt (12 rounds)
- JWT access tokens (15min) + refresh tokens (7 days)
- Rate limiting on API endpoints
- Stricter limits on auth endpoints
- Helmet.js security headers
- CORS protection
- Input validation with express-validator
- SQL injection prevention via Prisma ORM

## License

MIT
