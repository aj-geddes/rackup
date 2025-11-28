---
layout: default
title: Set Up Google Drive Backups
description: Automatically back up your league data to Google Drive. Free, takes about 15 minutes.
---

# Setting Up Google Drive Backups

Your league data is valuable. Player records, historical standings, match results - you don't want to lose any of it. This guide sets up automatic backups to your Google Drive.

---

## What This Costs

**Completely free.**

Google Drive gives you 15 GB of storage for free. Your league backups are tiny (usually under 1 MB each), so you'll never come close to that limit.

---

## Do I Really Need This?

**No, but it's a good idea.**

Without Google Drive:
- You can download backups manually anytime from the Admin panel
- Your data is backed up to files you save on your computer

With Google Drive:
- Backups are saved automatically to your Google Drive
- You can access them from anywhere
- You have a history of backups over time
- If your computer dies, your backups are safe in the cloud

**We recommend setting this up.** It's free and gives you peace of mind.

---

## Part 1: Set Up Google Cloud

This is the most complicated part, but we'll go step by step. Google Cloud is Google's platform for developers - we need to use it to connect Rackup to your Google Drive.

### Why Is This So Complicated?

Google requires apps to go through an authorization process before they can access your Google Drive. This protects you - random apps can't just read your files. The downside is we need to set this up manually.

**It takes about 15 minutes, and you only do it once.**

---

### Step 1: Go to Google Cloud Console

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Sign in with your Google account (the one whose Drive you want to use)
3. If this is your first time, you'll see a welcome screen. Click **Agree and Continue**

### Step 2: Create a Project

A "project" is just a container for your settings. Think of it as a folder.

1. At the top of the page, click the project dropdown (it might say "Select a project" or show a project name)
2. In the popup window, click **New Project**
3. For "Project name", enter something like `My Pool League`
4. Leave "Organization" as is (probably "No organization")
5. Click **Create**
6. Wait a moment for it to create

### Step 3: Select Your Project

1. Click the project dropdown at the top again
2. Click on your new project name ("My Pool League")

You should now see your project name at the top of the page.

---

## Part 2: Enable Google Drive Access

We need to turn on the Google Drive feature for your project.

### Step 4: Enable the Drive API

1. In the left sidebar, click **APIs & Services** (you might need to click the hamburger menu ☰ first)
2. Click **Library**
3. In the search box, type `Google Drive`
4. Click on **Google Drive API** in the results
5. Click the big blue **Enable** button

Wait a moment. You'll be taken to the Drive API dashboard. That's good!

---

## Part 3: Set Up the Consent Screen

Before Google lets your app access Drive, it needs to know some basic info. This is called the "OAuth consent screen."

### Step 5: Configure the Consent Screen

1. In the left sidebar, click **APIs & Services**
2. Click **OAuth consent screen**
3. You'll be asked to choose a user type:
   - Select **External**
   - Click **Create**

Now fill in the form. Only a few fields are required:

**App Information:**
- **App name**: `My Pool League Backups` (or similar)
- **User support email**: Select your email from the dropdown

**App logo**: Skip this (not required)

**App domain**: Skip all of these (not required)

**Developer contact information:**
- Enter your email address

4. Click **Save and Continue**

### Step 6: Skip the Scopes Screen

You'll see a "Scopes" screen. We don't need to add anything here.

1. Just click **Save and Continue**

### Step 7: Add Yourself as a Test User

Since we're not publishing this app publicly, we need to add ourselves as a test user.

1. On the "Test users" screen, click **+ Add Users**
2. Enter your Google email address (the one you're logged in with)
3. Click **Add**
4. Click **Save and Continue**

### Step 8: Review and Finish

1. You'll see a summary screen
2. Scroll down and click **Back to Dashboard**

---

## Part 4: Create Credentials

Now we need to create the actual "keys" that let Rackup access your Drive.

### Step 9: Create OAuth Credentials

1. In the left sidebar, click **APIs & Services**
2. Click **Credentials**
3. Click **+ Create Credentials** at the top
4. Select **OAuth client ID**

### Step 10: Configure the OAuth Client

Fill in:

1. **Application type**: Select **Web application**
2. **Name**: Enter `Rackup` (or anything you'll recognize)

Now the important part:

3. Under **Authorized redirect URIs**, click **+ Add URI**
4. Enter your Rackup URL followed by `/admin/backups`

For example, if your site is `https://rackup-production-abc123.up.railway.app`, enter:
```
https://rackup-production-abc123.up.railway.app/admin/backups
```

**This must be exact!** Copy your Railway URL carefully.

5. Click **Create**

### Step 11: Save Your Credentials

A popup will appear with your credentials:

- **Client ID** - A long string ending in `.apps.googleusercontent.com`
- **Client Secret** - A shorter secret string

**Copy both of these and save them somewhere safe!**

You can also click **Download JSON** to save a file with these credentials.

Click **OK** to close the popup.

---

## Part 5: Add to Railway

Now let's connect everything.

### Step 12: Open Railway Variables

1. Go to [railway.app](https://railway.app)
2. Click on your project
3. Click on your application (the purple box)
4. Click the **Variables** tab

### Step 13: Add Google Drive Variables

Click **+ New Variable** three times to add:

| Variable Name | What to Enter |
|---------------|---------------|
| `GOOGLE_CLIENT_ID` | Your Client ID (the long one ending in .apps.googleusercontent.com) |
| `GOOGLE_CLIENT_SECRET` | Your Client Secret |
| `GOOGLE_REDIRECT_URI` | Your full redirect URI (like `https://your-app.railway.app/admin/backups`) |

**Triple-check the redirect URI!** It must match exactly what you entered in Google Cloud.

### Step 14: Redeploy

Railway should automatically redeploy. If not:

1. Click on **Deployments**
2. Click **Redeploy** on the most recent deployment

Wait for the deployment to complete.

---

## Part 6: Connect Your Google Account

Now we connect Rackup to your actual Google Drive.

### Step 15: Connect in the Admin Panel

1. Log into your league website as an admin
2. Go to **Admin** → **Backups**
3. You should see a "Connect Google Drive" button
4. Click **Connect Google Drive**

### Step 16: Authorize the App

You'll be taken to a Google sign-in page.

1. Select your Google account
2. You might see a warning: "Google hasn't verified this app"
   - This is normal for personal apps like this
   - Click **Continue** (you might need to click "Advanced" first)
3. Review the permissions (Rackup is asking to access your Drive files)
4. Click **Continue** or **Allow**

You'll be redirected back to your Rackup admin page.

### Step 17: Verify It Worked

Back on the Backups page, you should see:

- A green "Connected" status
- Your Google account email
- A "Disconnect" button

**You're connected!**

---

## Part 7: Using Google Drive Backups

### How Backups Work

Now that you're connected:

- You can click "Backup to Drive" to manually create a backup
- Backups are saved to a folder called "Rackup Backups" in your Drive
- Each backup is timestamped

### Viewing Your Backups

1. Go to [drive.google.com](https://drive.google.com)
2. Look for a folder called "Rackup Backups"
3. Inside, you'll see backup files with dates

### Restoring From a Backup

If you ever need to restore data, the backup files contain all your league data in JSON format. Contact us through GitHub issues if you need help restoring.

---

## Troubleshooting

### "The redirect URI doesn't match"

This is the most common error. It means the URL in Google Cloud doesn't exactly match the URL in Railway.

Check:
- Did you include `https://` in both places?
- Is there a trailing slash difference? (`/admin/backups` vs `/admin/backups/`)
- Did you copy the exact Railway URL?

Fix it by updating the redirect URI in Google Cloud Console (Credentials → Click your OAuth client → Edit the redirect URI).

### "Access blocked: This app's request is invalid"

Usually means:
- You haven't added yourself as a test user
- Go back to OAuth consent screen → Test users → Add your email

### "Google hasn't verified this app" warning

This is normal and expected. Click "Advanced" then "Continue" to proceed. This warning appears because the app is for your personal use and isn't published publicly.

### "I can't find my backups in Google Drive"

- Look for a folder called "Rackup Backups"
- Try searching for "rackup" in Drive
- Make sure you're looking at the Drive for the Google account you connected

### "I want to use a different Google account"

1. Go to Admin → Backups
2. Click **Disconnect**
3. Click **Connect Google Drive** again
4. Sign in with the different account

---

## Why We Use Google Drive

You might wonder why we specifically use Google Drive instead of other backup options.

**We chose Google Drive because:**

- Most people already have a Google account
- It's free (15 GB is plenty for league backups)
- Files are accessible from anywhere
- You can easily share the folder with co-organizers
- It's reliable and won't disappear

**Your backups go directly from Railway to your Google Drive.** We (the Rackup developers) never see your data. The backup happens directly between your league's server and your personal Google account.

---

## That's It!

Your league now has automatic cloud backups. Your data is safe, accessible, and under your control.

<div class="quick-links">
  <a href="security">Learn About Security</a>
  <a href="get-started">Back to Setup Guide</a>
</div>
