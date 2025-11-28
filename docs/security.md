---
layout: default
title: Security & Privacy
description: How Rackup keeps your league data safe, and what you can do to help.
---

# Keeping Your League Data Safe

You're trusting Rackup with your league's data - player information, match results, contact details. We take that seriously. This page explains what we do to keep it safe, what you need to do, and what risks remain.

**Plain English, no jargon.** If something isn't clear, let us know.

---

## The Big Picture

Your league data is stored in a database on Railway's servers. Here's how the security works:

```
Players' phones → HTTPS encryption → Railway servers → Your database
```

**At each step, there are protections:**

1. **In transit**: Data is encrypted as it travels over the internet
2. **At rest**: Railway encrypts data stored on their servers
3. **In the app**: Passwords are scrambled before storage
4. **Access control**: Only people you've invited can see anything

---

## What We Protect Against

### Random Attackers

The internet is full of automated attacks. Bots constantly scan for vulnerable websites. We protect against these with:

**HTTPS Everywhere**
- All data is encrypted using the same technology banks use
- The padlock icon in your browser confirms this
- Railway provides this automatically

**Rate Limiting**
- If someone tries too many passwords, they get temporarily blocked
- Prevents "brute force" attacks where attackers try thousands of passwords
- Login attempts are limited to 10 per 15 minutes

**Secure Password Storage**
- We never store actual passwords
- Passwords are run through a one-way scrambling algorithm (bcrypt)
- Even if someone stole the database, they couldn't read passwords

### Accidental Data Loss

Things go wrong. Servers crash. People make mistakes. We protect against these with:

**Database Backups**
- Railway automatically backs up your database
- You can download manual backups anytime
- Optional Google Drive sync for extra safety

**Self-Healing Database**
- If the app loses connection, it automatically reconnects
- If the server crashes, Railway restarts it automatically

### Unauthorized Access

Only people you've invited should see league data. We enforce this with:

**Invite-Only Registration**
- Random people can't create accounts
- Every account starts from an invitation you sent
- Players are automatically connected to the right team

**Role-Based Permissions**
- Players can only see their own team and public standings
- Captains can manage their team but not others
- Only admins can manage the whole league

**Automatic Session Expiration**
- Login sessions expire after 15 minutes of inactivity
- Long-term sessions expire after 7 days
- Users must log in again after expiration

---

## What You Need to Do

Security is a partnership. Here's your part:

### Choose Strong Passwords

**For your admin account:**
- Use at least 12 characters
- Mix letters, numbers, and symbols
- Don't use something guessable (league name, "pool123", etc.)
- Use a password manager if possible (like 1Password, Bitwarden, or LastPass)

**For your Railway account:**
- This is just as important as your admin password
- Someone with your Railway access could read your database directly
- Use two-factor authentication if Railway offers it

### Keep Your Secrets Secret

Remember those settings in Railway?
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- Database connection string

**Never share these.** They're like master keys to your league.

If you think they've been compromised:
1. Go to Railway
2. Generate new random values for JWT_SECRET and JWT_REFRESH_SECRET
3. Redeploy

This will log everyone out, but better safe than sorry.

### Be Careful With Admin Access

**Don't make everyone an admin.**

- Most people should be "Players"
- Team captains should be "Captains"
- Only give "League Official" or "Admin" to people who need it

Admin accounts can:
- See all player information
- Change anyone's role
- Delete data
- Reset passwords

That's a lot of power. Keep the circle small.

### Review Access Periodically

Once a season, look at your user list:
- Remove people who left the league
- Downgrade roles for people who no longer need them
- Check for any accounts you don't recognize

---

## What We Can't Protect Against

We believe in being honest about limitations.

### You Losing Access to Your Accounts

If you forget your passwords and can't recover your GitHub, Railway, or Google accounts, you could lose access to your league.

**Prevention:**
- Use a password manager
- Set up account recovery options (recovery email, phone number)
- Keep your Railway login credentials somewhere safe

### Physical Device Theft

If someone steals your phone while you're logged in, they can access whatever you have access to.

**Prevention:**
- Use a screen lock on your phone
- Log out when you're done (especially on shared computers)
- Don't stay logged in on devices you don't control

### Railway Having an Outage

Railway is reliable, but no service is 100% up. If Railway goes down, your league goes down temporarily.

**Prevention:**
- Keep manual backups on your computer
- Have Google Drive backups enabled
- Know that outages are usually brief (minutes to hours)

### Sophisticated Targeted Attacks

If a determined, skilled attacker specifically targets your league, no small system can guarantee protection.

**Reality check:** Your pool league is almost certainly not interesting enough for this. Attackers go after banks, corporations, and government systems - not small sports leagues. But we mention it for completeness.

---

## Data Privacy

### What Data We Collect

The Rackup application stores:

- **Player accounts**: Name, email, phone (if provided), team membership
- **League data**: Teams, matches, scores, standings
- **System data**: Login times, password reset requests

### Where Data Lives

Your data lives in three possible places:

1. **Railway database** - Your primary database
2. **Railway backups** - Automatic copies Railway keeps
3. **Google Drive** - If you set up Google Drive backups

**We (the Rackup developers) do not have access to any of this.** Your data goes directly from players' devices to your Railway account. We never see it.

### Who Can See What

| Role | Can See |
|------|---------|
| **Players** | Their own profile, team roster, league standings, schedule |
| **Captains** | Same as players + manage their team's roster |
| **League Officials** | All teams, all matches, all players |
| **Admins** | Everything, plus user management |

### Data Deletion

If someone wants their data deleted:
1. Go to Admin → Users
2. Find their account
3. Deactivate it (their data is preserved but they can't log in)
4. Or delete it entirely (removes all their data)

---

## Security Decisions We Made

Every system makes tradeoffs. Here are ours:

### Why Invite-Only?

We could have let anyone sign up. We chose invite-only because:
- Keeps random internet strangers out
- Automatically connects players to teams
- Reduces spam and fake accounts
- More appropriate for a private league

### Why Phone Numbers for Invites?

We use phone numbers instead of email because:
- Everyone has their phone at league night
- Text messages get read immediately
- Easier than "check your email and click the link"

Phone numbers are only used for invites. We don't send marketing texts or sell numbers.

### Why Not More Security Features?

We could add two-factor authentication, IP allowlists, and other enterprise security features. We chose not to because:
- Complexity reduces usability
- Most leagues don't need enterprise security
- The existing protections cover realistic threats

If you need bank-level security, Rackup probably isn't the right choice. For most pool leagues, it's more than enough.

---

## If Something Goes Wrong

### You Suspect a Breach

1. **Change your passwords immediately** - Admin account, Railway account, Google account
2. **Rotate your secrets** - Generate new JWT_SECRET and JWT_REFRESH_SECRET in Railway
3. **Check your user list** - Look for accounts you don't recognize
4. **Download a backup** - Preserve current data in case you need to investigate

### You Get Locked Out

1. **Try password reset** - If the app has a reset function
2. **Access Railway directly** - You can see and change database values there
3. **Contact us** - Open an issue on GitHub, we'll help

### You Think You Found a Security Bug

Please report it! We want to fix security issues quickly.

1. **Don't post it publicly** - Give us a chance to fix it first
2. **Email us** - Details on our GitHub page
3. **We'll respond quickly** - Usually within a day or two

---

## Questions?

If something about security isn't clear, ask! We'd rather over-explain than have you worry.

<div class="quick-links">
  <a href="features">See Features</a>
  <a href="get-started">Get Started</a>
</div>
