---
layout: default
title: Set Up Text Message Invites
description: Send invite links directly to players' phones. About 10 minutes to set up.
---

# Setting Up Text Message Invites

Right now, when you invite a player, you get a link that you have to copy and send to them yourself. That works fine, but wouldn't it be nicer if Rackup could text the invite directly to their phone?

That's what this guide sets up.

---

## What This Costs

Let's be upfront about the cost:

| What | Cost |
|------|------|
| Twilio account | Free to create |
| Phone number | ~$1.15/month |
| Each text message | ~$0.0079 (less than a penny) |

**For a typical league:**
- 50 players invited = about $0.40 in texts
- Monthly phone number = $1.15
- **Total for a season: roughly $5-10**

You can try it free first - Twilio gives you trial credits.

---

## Do I Really Need This?

**No, it's completely optional.**

Without Twilio:
- You click "Send Invite" in the admin panel
- You see the invite link on screen
- You copy it and text/message it to the player yourself

With Twilio:
- You click "Send Invite" in the admin panel
- The player immediately gets a text with the link
- You're done

If you only invite players once a season, the manual way is fine. If you're frequently adding players, Twilio saves time.

---

## Part 1: Create a Twilio Account

Twilio is a company that sends text messages for apps. They're used by Uber, Airbnb, and thousands of other companies.

### Step 1: Sign Up

1. Go to [twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Fill in your information:
   - Email address
   - First and last name
   - Password (make it strong!)
   - Country
3. Check the "I'm not a robot" box
4. Click **Start your free trial**

### Step 2: Verify Your Email

1. Check your email for a message from Twilio
2. Click the verification link in the email
3. You'll be taken back to Twilio

### Step 3: Verify Your Phone Number

Twilio needs to verify you're a real person.

1. Enter your phone number
2. Choose how to receive the code (text or call)
3. Enter the code when you receive it

### Step 4: Answer Their Questions

Twilio asks some questions to customize your experience. Answer honestly:

- **Which product do you want to use?** → Select "SMS"
- **What are you building?** → Something like "League management notifications"
- **How do you want to build?** → Select "With code"
- **What's your preferred programming language?** → Select "JavaScript" (doesn't really matter)
- **What's your goal today?** → Select "Send SMS" or similar

Click through these - the answers don't affect your ability to send texts.

---

## Part 2: Get Your Twilio Credentials

Now you need to find two important pieces of information: your Account SID and Auth Token.

### Step 5: Find Your Account SID and Auth Token

After signup, you should be on the Twilio Console. If not, go to [console.twilio.com](https://console.twilio.com).

Right on the main dashboard, you'll see a section called **Account Info** with:

- **Account SID** - A long string starting with "AC"
- **Auth Token** - Click the "Show" or eye icon to reveal it

**Keep these secret!** Anyone with these could send texts using your account.

### Step 6: Write Them Down

Copy both values somewhere safe. You'll need them soon.

---

## Part 3: Get a Phone Number

Your text messages need to come from a phone number. Twilio gives you one.

### Step 7: Claim Your Trial Number

Still in the Twilio Console:

1. Look for a section about "Get a Phone Number" or a big button saying "Get a Trial Number"
2. Click it
3. Twilio will show you a phone number
4. Click **Choose this number** (or similar)

Alternatively:

1. Click **Phone Numbers** in the left sidebar
2. Click **Manage** → **Buy a Number**
3. Leave the filters as default
4. Click **Search**
5. Pick any number from the list
6. Click **Buy** (it's free with trial credits)

### Step 8: Write Down Your Number

Note the phone number you got. It'll look something like `+1 555 123 4567`.

When you enter it in Rackup, format it with no spaces: `+15551234567`

---

## Part 4: Add to Railway

Now let's connect Twilio to your league.

### Step 9: Open Railway Variables

1. Go to [railway.app](https://railway.app)
2. Click on your project
3. Click on your application (the purple box, not the database)
4. Click the **Variables** tab

### Step 10: Add Twilio Variables

Click **+ New Variable** three times to add:

| Variable Name | What to Enter |
|---------------|---------------|
| `TWILIO_ACCOUNT_SID` | Your Account SID (starts with AC) |
| `TWILIO_AUTH_TOKEN` | Your Auth Token |
| `TWILIO_FROM_NUMBER` | Your phone number with no spaces (like `+15551234567`) |

### Step 11: Redeploy

Railway should automatically redeploy when you add variables. If not:

1. Click on **Deployments**
2. Click **Redeploy** on the most recent deployment

Wait for the deployment to complete (green "Active" status).

---

## Part 5: Test It Out

### Step 12: Send a Test Invite

1. Log into your league website as an admin
2. Go to **Admin** → **Invites**
3. Enter a phone number you can check (maybe your own?)
4. Fill in the other details
5. Click **Send Invite**

If everything is set up correctly, that phone should receive a text message with the invite link!

---

## Understanding Trial Limitations

With a Twilio trial account, there are some limitations:

### You Can Only Text Verified Numbers

During trial, you can only send texts to phone numbers you've verified with Twilio. This is to prevent spam.

To verify a number:
1. Go to [console.twilio.com/us1/develop/phone-numbers/manage/verified](https://console.twilio.com/us1/develop/phone-numbers/manage/verified)
2. Click **Add a new Caller ID**
3. Enter the phone number
4. Verify it with a code

**This is fine for testing**, but annoying for a real league where you want to text anyone.

### Messages Say "Sent from a Twilio trial account"

Trial messages have a prefix added. It doesn't affect the link, just looks a bit spammy.

---

## Upgrading to a Paid Account

When you're ready to text any phone number without restrictions:

### Step 13: Upgrade Your Twilio Account

1. Go to [console.twilio.com](https://console.twilio.com)
2. Look for an "Upgrade" button (usually top of the page or in the sidebar)
3. Click **Upgrade**
4. Enter your payment information
5. Add some credit (start with $20 - it lasts a long time)

After upgrading:
- You can text any phone number
- The trial message prefix goes away
- You pay as you go (~$0.0079 per text)

Your existing settings in Railway don't change - everything keeps working, just without the trial limitations.

---

## Troubleshooting

### "Texts aren't being sent"

1. Check your Railway logs for error messages
2. Verify all three Twilio variables are set correctly
3. Make sure the phone number format is correct (`+15551234567`, not `555-123-4567`)
4. On trial accounts, make sure the recipient number is verified

### "I get an error about the phone number"

- Make sure to include the `+1` country code
- Don't include any spaces, dashes, or parentheses
- Correct: `+15551234567`
- Wrong: `555-123-4567`, `(555) 123-4567`, `5551234567`

### "Twilio says my account is suspended"

This can happen if:
- Your payment method failed
- Twilio suspected unusual activity
- Your trial credits ran out

Contact Twilio support through their website.

### "I want to change my phone number"

1. Go to Twilio Console → Phone Numbers → Manage → Active Numbers
2. Buy a new number
3. Update `TWILIO_FROM_NUMBER` in Railway
4. Release the old number if you don't want to pay for it

---

## How Much Will I Actually Pay?

Here's a real example:

**Spring Season**
- 48 players invited: $0.38
- 6 new players mid-season: $0.05
- Phone number: $1.15/month × 4 months = $4.60
- **Season total: about $5**

**Fall Season**
- Only 12 new players (rest already have accounts): $0.09
- Phone number: $4.60
- **Season total: about $5**

Most leagues spend less than $15/year on texts.

---

## That's It!

You've set up automatic text message invites. When you invite a player, they'll get a text within seconds with a link to join your league.

<div class="quick-links">
  <a href="google-drive-setup">Set Up Google Drive Backups</a>
  <a href="get-started">Back to Setup Guide</a>
</div>
