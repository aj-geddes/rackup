---
layout: default
title: Why Rackup?
description: The philosophy behind building a league management system that's affordable, simple, and yours.
---

# Why We Built Rackup

## The Short Version

We wanted a league management system that:
- Costs less than a pizza per month
- Works great on phones
- Doesn't hold your data hostage
- Doesn't require an IT department to set up

Nothing like that existed, so we built it.

---

## The Longer Story

### The Problem With Existing Options

If you've ever tried to find software to manage a pool league, you've probably run into:

**The Expensive Services**

Companies that charge $5-10 per team, or $1-2 per player, per season. For a 12-team league with 60 players, you're looking at $60-120+ per season just to keep standings online. And if you ever want to leave? Good luck getting your historical data out.

**The Ugly Spreadsheets**

Google Sheets works... until it doesn't. Someone accidentally deletes a formula. Someone else sorts only one column. Suddenly your standings are chaos and you're spending your Sunday trying to figure out what went wrong.

**The Desktop-Only Dinosaurs**

Old software that only runs on Windows, requires installation, and looks like it was designed in 1998. Your players can't check standings on their phones. Your captains can't enter scores from the bar.

**The DIY Nightmare**

"I'll just build something myself!" Six months later you're still debugging PHP and your league is still using paper score sheets.

---

## Our Philosophy

### You Should Own Your League Data

When you use Rackup, your data lives in your database, on your Railway account. You can:

- Download a complete backup anytime
- Export to spreadsheets whenever you want
- Move to different hosting if you ever want to
- Delete everything if you're done

No vendor lock-in. No "contact support to export your data." It's yours.

### Simple Beats Complicated

We deliberately left out features that add complexity:

- No live scoring (because wifi at bars is terrible)
- No tournament brackets (that's a different kind of software)
- No team fees and payment processing (use Venmo like everyone else)

Every feature we add has to pass the test: "Will this make league organizers' lives easier, or just add buttons they'll never click?"

### Mobile Comes First

Every screen in Rackup was designed for phones first. Because that's where your players will use it:

- Checking standings while waiting for their match
- Looking up the schedule to remember which bar they're playing at
- Seeing league announcements

Desktop works great too, but we never sacrifice mobile experience for desktop convenience.

### Affordable Means Actually Affordable

We didn't want "affordable" to mean "cheaper than the expensive thing." We wanted it to mean "this costs less than your Netflix subscription."

At $5/month for hosting, running your league costs less than:
- One drink at league night
- One roll of quarters for the pool table
- Half a sleeve of chalk

---

## Why Railway Specifically?

You might wonder why we recommend Railway instead of other hosting options.

### It's The Simplest Path

Railway lets you go from "I have code on GitHub" to "I have a working website" in about 10 minutes. No server configuration. No command line. No SSH keys. Just click, connect, done.

### The Price Is Right

Railway's Hobby plan is $5/month. That includes:
- Your application running 24/7
- A PostgreSQL database
- Automatic HTTPS (the padlock in the browser)
- Automatic deployments when you update

For a small league, you'll never exceed this. For a large league, you might hit $10-15/month during busy periods.

### They Handle The Hard Stuff

Railway automatically:
- Keeps your app running if it crashes
- Backs up your database
- Handles traffic spikes
- Updates security patches

This is stuff that used to require a dedicated IT person. Now it's just... handled.

### You're Not Locked In

Railway is convenient, but you're not trapped. Rackup runs in a standard Docker container, which means it can run on:
- Any cloud provider (AWS, Google Cloud, DigitalOcean)
- Your own server if you have one
- Any computer running Docker

We recommend Railway because it's the easiest. But the choice is always yours.

---

## Why The Invite System Works The Way It Does

You might notice Rackup uses "invite-only" registration. Players can't just sign up - they have to be invited. Here's why:

### Keeps Out Strangers

A league website should be for league members. The invite system means random people on the internet can't create accounts and poke around your data.

### Connects Players to Teams

When you invite someone, they're automatically connected to the right team. No "I signed up but I don't see my team" confusion.

### Works Without Email

We use phone numbers for invites because:
- Everyone has a phone at league night
- Text messages get read (unlike email)
- It's faster than "check your email and click the link"

You can send invites via text message (requires Twilio setup) or just copy the invite link and share it however you want - text, Facebook, carrier pigeon.

---

## Why We Handle Backups This Way

Rackup gives you two ways to back up your data:

### Manual Downloads

Anytime you want, you can download:
- A complete backup of all your data (JSON format)
- Standings as a spreadsheet (CSV)
- Player stats as a spreadsheet (CSV)

This is always available, no setup required.

### Google Drive Sync

If you connect Google Drive, your backups automatically save to your Drive. Why Google Drive?

- Most people already have a Google account
- It's free
- Files are accessible from anywhere
- You can share them with co-organizers

We don't back up to "the cloud" (our servers). Your data goes directly from your Railway database to your Google Drive. We never see it.

---

## The Security Philosophy

We take security seriously, but we also believe in being honest about what we do and don't protect against.

### What We Protect Against

- **Random hackers** - Passwords are encrypted, sessions expire, rate limits prevent brute force attacks
- **Accidents** - Regular backups mean you can recover from mistakes
- **Snooping** - HTTPS encrypts everything between the player's phone and your server

### What You're Responsible For

- **Choosing a good admin password** - Please don't use "password123"
- **Keeping your Railway account secure** - Use a strong password there too
- **Deciding who gets admin access** - Don't make everyone an admin

### What We Can't Protect Against

- **You losing access to your accounts** - Keep your passwords somewhere safe
- **Railway having an outage** - This is rare, but it happens to every hosting provider occasionally
- **Someone stealing your phone with the app logged in** - This is a physical security problem, not a software one

We've written more about this on the [Security page](security).

---

## Open Source Means You Can See Everything

Rackup is completely open source. Every line of code is visible on GitHub. This means:

- You can verify we're not doing anything sketchy
- Security researchers can find and report problems
- You can customize it if you want to (or hire someone to)
- It can't disappear if we stop working on it

We believe league management software shouldn't be a black box.

---

## Ready to Try It?

If this philosophy resonates with you, give Rackup a shot:

<div class="quick-links">
  <a href="get-started" class="primary">Get Started</a>
</div>

The setup takes about 15-20 minutes, and you can always delete everything and start over if you don't like it. No commitment, no contract, no hassle.
