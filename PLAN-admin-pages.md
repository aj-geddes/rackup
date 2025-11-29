# Admin Pages Implementation Plan

## Executive Summary

The backend API is **fully complete** with all CRUD operations for users, teams, seasons, venues, and matches. The frontend API service (`api.js`) has **all methods wired up**. However, the Admin UI only exposes 4 of 9 required sections.

---

## Current State Analysis

### Backend API Endpoints (ALL EXIST)

| Resource | Endpoints | Status |
|----------|-----------|--------|
| Users | GET, GET/:id, PATCH, PATCH/role, PATCH/activate, PATCH/deactivate | Complete |
| Teams | GET, GET/:id, POST, PATCH, DELETE, POST/members, DELETE/members | Complete |
| Seasons | GET, GET/active, GET/:id, POST, PATCH, POST/activate, DELETE | Complete |
| Venues | GET, GET/:id, POST, PATCH, DELETE | Complete |
| Matches | GET, GET/:id, POST, PATCH, DELETE, PATCH/score, POST/results | Complete |
| Admin | dashboard, audit-logs, create-admin, import-users, reset-password, generate-schedule | Complete |

### Frontend API Service (`api.js`) - ALL WIRED UP

```
Users:     getUsers, getUser, updateUser, updateUserRole, deactivateUser, activateUser
Teams:     getTeams, getTeam, createTeam, updateTeam, addTeamMember, removeTeamMember
Seasons:   getSeasons, getSeason, createSeason, updateSeason, activateSeason
Venues:    getVenues, getVenue, createVenue, updateVenue
Matches:   getMatches, getMatch, createMatch, updateMatch, updateMatchScore
Admin:     getDashboard, getAuditLogs, createAdmin, importUsers, resetPassword, generateSchedule
```

### Frontend Admin UI (PARTIAL)

| Section | Status | Notes |
|---------|--------|-------|
| Dashboard | DONE | Shows stats, active season, recent activity |
| Invites | DONE | Send, resend, cancel invites |
| Announcements | DONE | Create, delete announcements |
| Backups | DONE | Download, Google Drive integration |
| **Users** | MISSING | No UI to manage users |
| **Teams** | MISSING | No UI to manage teams |
| **Seasons** | MISSING | No UI to manage seasons |
| **Venues** | MISSING | No UI to manage venues |
| **Schedule** | MISSING | No UI to create/manage matches |

---

## Backend Gap: Create User Endpoint

**Issue:** The current `POST /admin/create-admin` endpoint only accepts `LEAGUE_OFFICIAL` or `ADMIN` roles. We need to create users with `PLAYER` or `CAPTAIN` roles directly.

**Solution:** Modify the endpoint to accept all roles, OR create a new `POST /admin/create-user` endpoint.

```javascript
// New endpoint: POST /api/admin/create-user
{
  email: string (required),
  password: string (required),
  firstName: string (required),
  lastName: string (required),
  role: "PLAYER" | "CAPTAIN" | "LEAGUE_OFFICIAL" | "ADMIN",
  teamId: string (optional),
  handicap: number (optional, default 3)
}
```

---

## Implementation Plan

### Phase 1: Backend - Create User Endpoint
**File:** `backend/src/routes/admin.js`

Add new endpoint that allows creating any user role:
- `POST /api/admin/create-user`
- Accepts all 4 roles
- Optional team assignment
- Optional handicap

### Phase 2: Admin Navigation Update
**File:** `frontend/src/pages/AdminPage.jsx`

Update `AdminNav` to include all sections:
```javascript
const navItems = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/teams', label: 'Teams' },
  { to: '/admin/seasons', label: 'Seasons' },
  { to: '/admin/venues', label: 'Venues' },
  { to: '/admin/schedule', label: 'Schedule' },
  { to: '/admin/invites', label: 'Invites' },
  { to: '/admin/announcements', label: 'Announcements' },
  { to: '/admin/backups', label: 'Backups' },
];
```

### Phase 3: Users Management Component
**Location:** Inside `AdminPage.jsx` (new component)

**Features:**
1. **User List**
   - Paginated table with search
   - Columns: Name, Email, Role, Team, Status, Actions
   - Filter by: role, team, active/inactive

2. **Create User Button** (modal form)
   - Email (required)
   - Password (required, with generator option)
   - First Name, Last Name (required)
   - Role dropdown (PLAYER, CAPTAIN, LEAGUE_OFFICIAL, ADMIN)
   - Team dropdown (optional)
   - Handicap input (optional)

3. **User Actions**
   - Edit role (dropdown)
   - Reset password (modal)
   - Activate/Deactivate toggle
   - View details

### Phase 4: Teams Management Component
**Location:** Inside `AdminPage.jsx`

**Features:**
1. **Team List**
   - Cards or table showing all teams
   - Shows: Name, Captain, Member count, W-L record

2. **Create Team Button** (modal form)
   - Team name (required)
   - Captain selection (dropdown of users)
   - Co-Captain selection (optional)
   - Season (defaults to active season)

3. **Team Details/Edit**
   - Edit name, captain, co-captain
   - Roster management (add/remove members)
   - Delete team (with confirmation)

### Phase 5: Seasons Management Component
**Location:** Inside `AdminPage.jsx`

**Features:**
1. **Season List**
   - Shows all seasons with status indicator (active/inactive)
   - Columns: Name, Start Date, End Date, Teams, Matches, Status

2. **Create Season Button** (modal form)
   - Season name (required)
   - Start date (date picker)
   - End date (date picker)
   - Playoff date (optional date picker)

3. **Season Actions**
   - Activate (makes this the current season)
   - Edit dates/name
   - View statistics
   - Delete (only if no teams/matches)

### Phase 6: Venues Management Component
**Location:** Inside `AdminPage.jsx`

**Features:**
1. **Venue List**
   - Simple list of venues
   - Columns: Name, Address, City, Phone, Status

2. **Create Venue Button** (modal form)
   - Name (required)
   - Address
   - City
   - Phone

3. **Venue Actions**
   - Edit details
   - Activate/Deactivate
   - Delete (only if no matches)

### Phase 7: Schedule Management Component
**Location:** Inside `AdminPage.jsx`

**Features:**
1. **Match List**
   - Grouped by week or flat list
   - Columns: Date, Time, Home vs Away, Venue, Status

2. **Create Match Button** (modal form)
   - Date (date picker)
   - Time (time picker or text)
   - Home Team (dropdown)
   - Away Team (dropdown)
   - Venue (dropdown)
   - Week number

3. **Generate Schedule Button** (modal form)
   - Start date
   - Number of weeks
   - Default match time
   - Venue rotation toggle
   - Preview before creating

4. **Match Actions**
   - Edit match
   - Delete match
   - Clear all matches (with confirmation)

---

## File Changes Summary

### Backend Changes
1. `backend/src/routes/admin.js` - Add `POST /create-user` endpoint

### Frontend Changes
1. `frontend/src/pages/AdminPage.jsx` - Add 5 new components:
   - `Users` component
   - `Teams` component
   - `Seasons` component
   - `Venues` component
   - `Schedule` component
   - Update `AdminNav` with all sections
   - Update Routes to include new paths

2. `frontend/src/services/api.js` - Add `createUser` method (if not using import-users)

---

## Component Structure in AdminPage.jsx

```jsx
// AdminPage.jsx structure after implementation

// Existing components
function Dashboard() { ... }      // DONE
function Invites() { ... }        // DONE
function Announcements() { ... }  // DONE
function Backups() { ... }        // DONE

// New components to add
function Users() { ... }          // NEW - List, create, edit, activate/deactivate
function Teams() { ... }          // NEW - List, create, edit roster
function Seasons() { ... }        // NEW - List, create, activate
function Venues() { ... }         // NEW - List, create, edit
function Schedule() { ... }       // NEW - List, create, generate

function AdminNav() {
  const navItems = [
    { to: '/admin', label: 'Dashboard', end: true },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/teams', label: 'Teams' },
    { to: '/admin/seasons', label: 'Seasons' },
    { to: '/admin/venues', label: 'Venues' },
    { to: '/admin/schedule', label: 'Schedule' },
    { to: '/admin/invites', label: 'Invites' },
    { to: '/admin/announcements', label: 'Announcements' },
    { to: '/admin/backups', label: 'Backups' },
  ];
  // ... render
}

export default function AdminPage() {
  return (
    <div>
      <AdminNav />
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="teams" element={<Teams />} />
        <Route path="seasons" element={<Seasons />} />
        <Route path="venues" element={<Venues />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="invites" element={<Invites />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="backups" element={<Backups />} />
      </Routes>
    </div>
  );
}
```

---

## Priority Order

1. **Users** (HIGH) - User specifically requested manual user creation
2. **Teams** (HIGH) - Needed to assign users to teams
3. **Schedule** (MEDIUM) - Shows "no matches" currently
4. **Seasons** (MEDIUM) - Need to create new seasons
5. **Venues** (LOW) - Sample venues already seeded

---

## Estimated Scope

- Backend: ~30 lines (one new endpoint)
- Frontend: ~800-1000 lines (5 new components)
- Testing: Playwright verification of each section

---

## Validation Checklist

After implementation, verify:
- [ ] Can create user with PLAYER role
- [ ] Can create user with CAPTAIN role and assign to team
- [ ] Can create team with captain
- [ ] Can add/remove team members
- [ ] Can create new season
- [ ] Can activate/deactivate seasons
- [ ] Can create venue
- [ ] Can create individual match
- [ ] Can generate full schedule
- [ ] Can view and filter all entities
- [ ] All existing functionality still works
