---
layout: default
title: Features
description: Everything Rackup can do for your pool league.
---

# What Rackup Can Do

A complete tour of Rackup's features, organized by who uses them.

---

## For Everyone

These features are available to all logged-in users.

### Mobile-First Design

Every screen is designed for phones first. Pull out your phone at the bar and everything just works:
- Large, tappable buttons
- Easy-to-read text
- Fast loading on spotty bar wifi
- No pinching or zooming needed

Works on Android, iPhone, tablets, and desktop computers.

### Home Dashboard

When you log in, you see:
- **Your next match** - Date, time, opponent, and venue
- **Your stats** - Personal ranking and win/loss record
- **Team standing** - Where your team ranks
- **Announcements** - Important league news

Everything you need at a glance.

### League Standings

See how all teams stack up:
- Current rankings by wins/losses
- Win streaks and losing streaks
- Points if your league uses a points system
- Easy to find your team (it's highlighted)

### Player Rankings

See individual player performance:
- Who's winning the most?
- Win percentages
- Your own ranking in the league
- Stats are automatically updated after each match

### Schedule

View the full season schedule:
- Filter by your team to see just your matches
- See venue locations
- Match dates and times
- Past results for completed matches

### Profile

Manage your own account:
- Update your name or contact info
- Change your password
- See your personal statistics
- View your team assignment

---

## For Team Captains

Captains get extra powers to manage their team.

### Team Roster Management

See and manage your team:
- View all team members
- See each player's stats
- Contact information for coordinating

### Enter Match Scores

After a match, captains enter the results:
- Select the match from the schedule
- Enter the final score
- Individual game results (optional)
- Standings update automatically

### Invite New Players

Need to add someone to your team?
- Enter their phone number
- They get a text with a signup link
- They're automatically added to your team
- No admin intervention needed

---

## For League Officials

League officials can manage the whole league.

### Season Management

Create and manage seasons:
- Set start and end dates
- Name your seasons (Spring 2025, Fall League, etc.)
- Set playoff dates
- Activate/deactivate seasons

### Team Management

Full control over teams:
- Create new teams
- Edit team names
- Assign captains and co-captains
- Move players between teams
- Deactivate teams that drop out

### Match Scheduling

Build your season schedule:
- Create individual matches
- Assign home/away teams
- Set venues and times
- Generate a full schedule automatically
- Reschedule matches as needed

### Venue Management

Keep track of where matches happen:
- Add venues with addresses
- Include phone numbers
- Mark venues as active/inactive
- Assign venues to matches

### Announcements

Communicate with the whole league:
- Post announcements everyone sees
- Mark important news as "urgent"
- Edit or remove old announcements
- Announcements appear on everyone's home screen

### Player Invites

Invite anyone to join the league:
- Send invites via text message (with Twilio)
- Or get shareable links to send yourself
- Assign invitees to specific teams
- Track which invites are pending

### Backups

Protect your data:
- Download complete league backups anytime
- Export standings as spreadsheets (CSV)
- Export player stats as spreadsheets
- Connect to Google Drive for automatic backups

---

## For Administrators

Admins have full system access.

### User Management

Complete control over accounts:
- View all users in the system
- Change user roles (Player → Captain → Official → Admin)
- Deactivate accounts (they can't log in but data is preserved)
- Reset passwords for users who forgot theirs

### Audit Logs

See what's happening in your system:
- Who logged in and when
- What changes were made
- Who made them
- Useful for troubleshooting issues

### System Dashboard

Overview of your league:
- Total players, teams, and matches
- Active season stats
- Recent activity

---

## Automatic Features

Things that happen without you doing anything.

### Standings Calculation

After every score entry:
- Team standings recalculate automatically
- Player rankings update
- Win percentages adjust
- No spreadsheet formulas to maintain

### Session Security

- Sessions expire after periods of inactivity
- Users are logged out after 7 days
- Rate limiting prevents password attacks
- No action needed from you

### Database Initialization

When you first deploy:
- Database tables create themselves
- Initial admin account is ready
- A sample season is created
- No manual database setup required

---

## What's NOT Included

We believe in being honest about what Rackup doesn't do.

### Tournament Brackets

Rackup is designed for regular season play with a schedule. It doesn't have:
- Single or double elimination brackets
- Tournament seeding
- Bracket visualization

If you need tournaments, you might need a separate tool for playoff brackets.

### Live Scoring

Scores are entered after matches, not during:
- No real-time score updates during games
- No ball-by-ball tracking
- Captains enter final results after the match

This is intentional - bar wifi is unreliable, and entering scores mid-match adds stress.

### Payment Processing

We don't handle money:
- No team dues collection
- No payment tracking
- No invoicing

Use Venmo, PayPal, or cash like most leagues do.

### Integration with APA/BCA

Rackup is independent:
- No automatic sync with sanctioning bodies
- No handicap calculations from external systems
- You manage handicaps manually if you use them

### Multi-Sport Support

Rackup is specifically for pool/billiards:
- Terminology assumes 8-ball or 9-ball
- No customization for other sports
- Designed around pool league structures

---

## Feature Requests

Want something we don't have? Let us know!

- **[Open an issue on GitHub](https://github.com/aj-geddes/rackup/issues)**
- Describe what you're trying to do
- We'll consider it for future updates

We can't promise every feature, but we listen to what leagues need.

---

## Ready to Start?

<div class="quick-links">
  <a href="get-started" class="primary">Set Up Your League</a>
  <a href="why-rackup">Why Rackup?</a>
</div>
