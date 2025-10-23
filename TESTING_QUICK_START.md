# ⚡ Cron Jobs - Quick Start Testing Guide

## 🎯 You Want To: Test if cron jobs are working

Since you can see the app on fly.io but the CLI gives authorization errors, here's the **fastest way to test**:

---

## Step 1: Get Your CRON_SECRET

**Option A - From Fly.io Dashboard:**

1. Go to https://fly.io/dashboard
2. Find your app (probably "kaiwa")
3. Click "Secrets" tab
4. Find `CRON_SECRET` and copy the value

**Option B - Ask Someone:**
Ask whoever deployed the app for the CRON_SECRET value

---

## Step 2: Test the Cron Job Endpoints

```bash
# Set your CRON_SECRET
export CRON_SECRET="paste_your_secret_here"

# Run the test
pnpm cron:test:remote
```

### What You Should See

**✅ If Working:**

```
1. Testing Daily Reminders Endpoint
   ✅ Status: 200 OK

   Response:
   {
     "success": true,
     "stats": {
       "total": 10,
       "sent": 8,
       "skipped": 2,
       "failed": 0
     }
   }
```

**❌ If Not Working:**

```
   ❌ Status: 401

   Response:
   {"error": "Unauthorized"}

   💡 This means CRON_SECRET is incorrect
```

---

## Step 3: Check If Cron Machines Exist

**Via Fly.io Dashboard:**

1. Go to https://fly.io/dashboard
2. Find your app
3. Click "Machines" tab
4. Look for:
   - `cron-daily-reminders` (should show "stopped" when not running)
   - `cron-founder-emails` (should show "stopped" when not running)
   - `cron-weekly-digest` (should show "stopped" when not running)

**Via CLI (if you can get access):**

```bash
fly machines list --app kaiwa
```

---

## 📊 Results

### ✅ Endpoints Work (200 OK) + Cron Machines Exist

**Great!** Your cron jobs are set up and should be running on schedule:

- Daily reminders: 9:00 AM UTC
- Founder emails: 2:00 PM UTC
- Weekly digest: 10:00 AM UTC on Mondays

**Next:** Monitor logs to confirm they run:

- Fly.io dashboard → Logs tab
- Or: https://resend.com/emails to see sent emails

---

### ✅ Endpoints Work (200 OK) + Cron Machines DON'T Exist

**Partial setup!** The code works but automatic scheduling isn't configured.

**Fix Options:**

**Option A - Deploy Cron Machines (need CLI access):**

```bash
pnpm cron:deploy
```

**Option B - Use GitHub Actions (no CLI needed):**
Create `.github/workflows/cron.yml`:

```yaml
name: Cron Jobs
on:
  schedule:
    - cron: '0 9 * * *' # 9 AM UTC daily
    - cron: '0 14 * * *' # 2 PM UTC daily

jobs:
  send-reminders:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            "https://trykaiwa.com/api/cron/send-reminders"
```

**Option C - Use External Service:**
Use cron-job.org or similar to call:

- https://trykaiwa.com/api/cron/send-reminders
- https://trykaiwa.com/api/cron/founder-emails

---

### ❌ Endpoints Don't Work (401 or 404)

**Fix needed!**

**If 401 Unauthorized:**

- Check CRON_SECRET is correct
- Get it from Fly.io dashboard → Secrets

**If 404 Not Found:**

- App might not be deployed
- Check https://trykaiwa.com loads in browser
- Check Fly.io dashboard → Status

**If Connection Error:**

- App is down or wrong URL
- Verify URL in Fly.io dashboard

---

## 🔧 Additional Commands

```bash
# Test reminders endpoint only
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://trykaiwa.com/api/cron/send-reminders?dryRun=true"

# Test founder emails endpoint
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://trykaiwa.com/api/cron/founder-emails"

# Test locally (if environment is set up)
pnpm cron:reminders
pnpm cron:founder-emails
```

---

## 📚 More Help

- **Detailed testing:** [HOW_TO_TEST_CRONS.md](HOW_TO_TEST_CRONS.md)
- **Troubleshooting:** [CRON_DEBUGGING_GUIDE.md](CRON_DEBUGGING_GUIDE.md)
- **Architecture:** [CRON_SETUP_SUMMARY.md](CRON_SETUP_SUMMARY.md)

---

## TL;DR

```bash
# 1. Get CRON_SECRET from Fly.io dashboard
export CRON_SECRET="your_secret"

# 2. Test
pnpm cron:test:remote

# 3. Check Fly.io dashboard → Machines
# Look for cron-daily-reminders, cron-founder-emails, cron-weekly-digest

# 4. If working, check logs tomorrow to confirm automatic runs
```

Done! 🎉
