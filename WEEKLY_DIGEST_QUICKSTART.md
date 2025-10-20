# 📊 Weekly Digest - Quick Start Guide

## Your Sunday Routine (5-10 minutes)

### Step 1: Open the Admin Page
Visit: **https://trykaiwa.com/dev/weekly-digest**

### Step 2: Fill In Content

**What Shipped** (Required - 2-4 items):
```
Example:
Title: "New audio mode"
Summary: "Push-to-talk is live. Press and hold to speak, release to get feedback."
```

**Product Highlights** (Optional - 0-2 items):
```
Example:
Title: "Mobile improvements"
Summary: "Better touch targets and smoother animations on mobile."
```

**Coming Up Next** (Optional - 0-3 items):
```
Example:
Title: "Vocabulary tracking"
Summary: "Building a system to track words you've learned."
```

### Step 3: Copy to Script
1. Click "Copy to Script" button
2. Open `scripts/send-weekly-digest.ts`
3. Paste over the `THIS_WEEKS_CONTENT` section
4. Save file

### Step 4: Commit & Push
```bash
git add scripts/send-weekly-digest.ts
git commit -m "Update weekly digest content for [date]"
git push
```

**Done!** The cron job will send it Monday at 10am UTC.

---

## Monday Morning (2 minutes)

### Verify It Sent
```bash
# Check logs
fly logs | grep "weekly-digest"

# Should see:
# ✅ Weekly digest completed!
# 📊 Stats: X sent, Y skipped
```

### Check Resend Dashboard
Visit: **https://resend.com/emails**

Look for:
- Delivery success rate
- Any bounces or complaints

---

## Pro Tips

**Keep it conversational**: Write like you're texting a friend, not marketing copy

**Focus on "why"**: Users care why you built something, not just what it is

**Be brief**: 1-2 sentences per item is perfect

**Show progress**: Even small wins count (bug fixes, performance improvements)

**Be honest**: If you didn't ship much, say so! Users appreciate transparency

---

## Calendar Reminder

Import `kaiwa-founder-reminders.ics` to get reminded:
- **Sunday 3pm UTC**: Update weekly digest content
- **Monday 11am UTC**: Check digest sent successfully

---

## Need Help?

**Test locally first**:
```bash
pnpm cron:weekly-digest
```

**Preview before committing**:
Click "Preview Email" in the admin UI

**Send manually** (testing):
Click "Send Digest Now" in admin UI (careful - sends to all users!)

---

**Time commitment**: 5-10 minutes per week (usually closer to 5)

**Impact**: High - Regular touchpoint with users, shows momentum
