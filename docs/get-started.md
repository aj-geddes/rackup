---
layout: default
title: Get Started
description: Set up your league in about 15 minutes. No coding required.
---

# Setting Up Your League

This guide walks you through every step. You'll have your league website running in about 15-20 minutes.

**Don't worry if you're not technical.** We'll explain everything in plain English.

---

## Before You Start

You'll need:

- **A computer** - Just for this setup process. After that, everything works on your phone.
- **A credit card** - Railway charges $5/month for hosting.
- **About 20 minutes** - Grab a coffee, we'll take it slow.

Have these ready:

- Your league's name (e.g., "Kansas City Women's Pool League")
- An email address you check regularly
- A password you'll remember (or a password manager)

---

## Part 1: Create Your Accounts

You'll need accounts on two websites: GitHub (where the code lives) and Railway (where your league runs).

### Step 1: Create a GitHub Account

GitHub is where Rackup's code is stored. You need an account to copy it.

1. Go to [github.com](https://github.com)
2. Click **Sign up** in the top right
3. Enter your email address
4. Create a password
5. Choose a username (this can be anything, like "marys-pool-league")
6. Complete the verification puzzle
7. Check your email and enter the verification code

**Done!** You now have a GitHub account. You won't need to do much here after setup.

### Step 2: Create a Railway Account

Railway is the service that runs your league website.

1. Go to [railway.app](https://railway.app)
2. Click **Login** in the top right
3. Click **Login with GitHub**
4. Click **Authorize Railway** when GitHub asks
5. Railway will send a verification email - click the link in it

**About Railway's Pricing:**

When you first sign up, you're on a free trial. The trial has limits that won't work well for a league, so we'll upgrade to the Hobby plan ($5/month) in Part 3.

---

## Part 2: Copy Rackup to Your Account

Now we'll make your own copy of Rackup that you control.

### Step 3: Fork the Repository

"Forking" means making your own copy of the code.

1. Make sure you're logged into GitHub
2. Go to [github.com/aj-geddes/rackup](https://github.com/aj-geddes/rackup)
3. Click the **Fork** button in the top right (it's near a "Star" button)
4. On the next screen, you can change the name if you want, or leave it as "rackup"
5. Click **Create fork**

You'll be taken to your own copy. Notice the URL now says `github.com/YOUR-USERNAME/rackup`.

**This copy is yours.** You can customize it, and you'll get updates when we improve Rackup.

---

## Part 3: Set Up Railway

Now we'll create your league on Railway.

### Step 4: Create a New Project

1. Go to [railway.app](https://railway.app) and make sure you're logged in
2. Click the **New Project** button (big button, hard to miss)
3. Click **Deploy from GitHub repo**
4. You'll see a list of your GitHub repositories
5. Click on **rackup** (or whatever you named it)

Railway will start doing some stuff automatically. You'll see a purple box appear - that's your application starting up. **It won't work yet** because we haven't given it a database.

### Step 5: Add a Database

Your league needs a database to store teams, players, and scores.

1. In your Railway project, click **+ New** (top right area)
2. Click **Database**
3. Click **Add PostgreSQL**

A new box will appear representing your database. Railway is now setting up a PostgreSQL database for you. This takes about 30 seconds.

### Step 6: Upgrade to Hobby Plan

The free trial won't have enough resources. Let's upgrade.

1. Click on **Settings** in the left sidebar (gear icon)
2. Click on **Billing**
3. Click **Upgrade to Hobby**
4. Enter your credit card information
5. Confirm the $5/month subscription

**You won't be charged for usage beyond $5/month** unless your league gets extremely busy (like thousands of users). For most leagues, $5/month covers everything.

### Step 7: Connect the Database to Your App

Now we need to tell your app how to find the database.

1. Click on your application box (the purple one, not the database)
2. Click the **Variables** tab
3. Click **+ New Variable**
4. In the name field, type: `DATABASE_URL`
5. Click the **Add Reference** button (it looks like a link icon)
6. Select your PostgreSQL database
7. Click **Add**

You'll see DATABASE_URL appear with a value that starts with `postgresql://`. Perfect!

---

## Part 4: Configure Your League

Now we'll set up the settings that make this YOUR league.

### Step 8: Add Required Settings

Still in the Variables tab, we need to add several more settings. Click **+ New Variable** for each one:

**Security Keys** (these protect your users' accounts):

| Variable Name | What to Enter |
|---------------|---------------|
| `JWT_SECRET` | Go to [randomkeygen.com](https://randomkeygen.com/), scroll to "CodeIgniter Encryption Keys", and copy one of those long random strings |
| `JWT_REFRESH_SECRET` | Go back to randomkeygen.com and copy a DIFFERENT random string |

**Important:** These two must be different! They're like two different keys to two different locks.

**Basic Settings:**

| Variable Name | What to Enter |
|---------------|---------------|
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | Leave this blank for now - we'll come back to it |

**Your Admin Account** (how you'll log in):

| Variable Name | What to Enter |
|---------------|---------------|
| `ADMIN_EMAIL` | Your email address |
| `ADMIN_PASSWORD` | A strong password (8+ characters, mix of letters and numbers) |

**Important:** Write down this email and password! You'll need them to log in.

### Step 9: Personalize Your League

These settings control how your league appears:

| Variable Name | What to Enter | Example |
|---------------|---------------|---------|
| `LEAGUE_NAME` | Your league's full name | `Kansas City Women's Pool League` |
| `LEAGUE_SHORT_NAME` | An abbreviation (for mobile) | `KCWPL` |
| `LEAGUE_DESCRIPTION` | A tagline or description | `The premier women's pool league in KC` |
| `LEAGUE_LOCATION` | Your city/area | `Kansas City, MO` |

Optional (leave blank if you don't need them):

| Variable Name | What to Enter |
|---------------|---------------|
| `LEAGUE_CONTACT_EMAIL` | Email for players to contact you |
| `LEAGUE_CONTACT_PHONE` | Phone number for the league |

### Step 10: Get Your Website URL

1. Click on your application box (the purple one)
2. Click the **Settings** tab
3. Scroll down to **Networking**
4. Click **Generate Domain**

Railway will create a URL like `rackup-production-abc123.up.railway.app`.

**Copy this URL** - this is your league's website address!

### Step 11: Finish Configuration

Go back to the **Variables** tab and:

1. Find `FRONTEND_URL`
2. Set it to your new URL (the one Railway just generated)
3. Make sure to include `https://` at the beginning

Example: `https://rackup-production-abc123.up.railway.app`

---

## Part 5: Launch!

### Step 12: Deploy Your League

Railway should automatically deploy when you add variables. If you see a "Deploy" button anywhere, click it.

Look for the **Deployments** section. You'll see:
- "Building..." - Railway is preparing your app
- "Deploying..." - Railway is starting your app
- "Active" with a green dot - Success! Your league is live!

This usually takes 2-3 minutes.

### Step 13: Log In

1. Click on your URL in Railway (or type it into your browser)
2. You should see a login screen with your league's name!
3. Enter the email and password you set in `ADMIN_EMAIL` and `ADMIN_PASSWORD`
4. Click **Sign In**

**Congratulations!** You're now logged into your league management system.

---

## Part 6: First Steps in Your League

Now that you're in, here's what to do first:

### Change Your Password

1. Click **Profile** at the bottom of the screen
2. Look for a "Change Password" option
3. Set a new secure password

### Create Your First Season

1. Click **Admin** at the bottom (you'll see this because you're an admin)
2. Click **Seasons**
3. Click **Create Season**
4. Fill in:
   - Season name (e.g., "Spring 2025")
   - Start date
   - End date
   - Make it "Active"

### Add Your Venues

1. In Admin, click **Venues**
2. Add each bar/location where matches are played
3. Include the address so players know where to go

### Create Your Teams

1. In Admin, click **Teams**
2. Create each team
3. Assign team captains (you might need to invite them first - see below)

### Start Inviting Players

1. In Admin, click **Invites**
2. Enter a player's phone number
3. Choose their team
4. Click **Send Invite**

The player will get a link to create their account. (If you haven't set up Twilio yet, you'll see the link on screen instead of it being texted. You can copy and send it manually.)

---

## What's Next?

Your basic league is now running! Here are some optional enhancements:

### [Set Up Text Message Invites](twilio-setup)

Instead of copying and pasting invite links, let the system text them directly to players. Takes about 10 minutes and costs roughly a penny per text.

### [Set Up Google Drive Backups](google-drive-setup)

Automatically save your league data to your Google Drive. Free, takes about 15 minutes to set up.

### [Learn About Security](security)

Understand how your league data is protected and what you should do to keep it safe.

---

## Troubleshooting

### "I can't log in"

- Double-check your ADMIN_EMAIL and ADMIN_PASSWORD variables in Railway
- Make sure there are no extra spaces before or after the values
- Try redeploying (in Railway, click on Deployments and click "Redeploy" on the most recent one)

### "The site shows an error"

- Check that DATABASE_URL is connected properly
- Look at the **Logs** in Railway (click on your app, then click "View Logs")
- Make sure all required variables are set

### "The site is really slow"

- The first load after the app has been idle can be slow (Railway "wakes up" the app)
- Subsequent loads should be fast
- If it's always slow, check the Logs for errors

### "I set up everything but the database is empty"

The database sets itself up automatically on first launch. If you're seeing an empty database:
1. Check the Logs for any errors
2. Try redeploying the app

### "I need more help"

- Check the other guides on this site
- [Open an issue on GitHub](https://github.com/aj-geddes/rackup/issues) - we're happy to help!

---

## You Did It!

Your league now has:

- A professional website that works on any phone
- Automatic standings and player rankings
- A way to schedule matches and track scores
- Tools to manage teams and players

All for $5 a month.

**Welcome to Rackup!**
