# 🧪 How to Test Your Cron Jobs

Since you can see the app on fly.io but the CLI shows authorization errors, here are **3 ways to test your cron jobs**:

---

## Method 1: Test via HTTP Endpoints (Recommended) ⭐

Your cron job endpoints are already deployed as part of your app. You can test them directly using curl or the script I created.

### Quick Test

```bash
# Set your CRON_SECRET (get this from Fly.io dashboard secrets)
export CRON_SECRET=your_secret_here

# Test using the convenient script
pnpm cron:test:remote
```

### Manual Test with curl

```bash
# Test daily reminders (dry run - won't send emails)
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://trykaiwa.com/api/cron/send-reminders?dryRun=true"

# Test founder emails
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://trykaiwa.com/api/cron/founder-emails"
```

### Expected Response

**Success (200 OK):**
```json
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

**Failure (401 Unauthorized):**
```json
{
  "error": "Unauthorized"
}
```
→ This means your CRON_SECRET is wrong. Check the Fly.io dashboard.

---

## Method 2: Test Locally (Safe - No Real Emails)

If you want to test the logic without hitting production:

```bash
# Test reminders locally
pnpm cron:reminders

# Test founder emails locally
pnpm cron:founder-emails

# Test weekly digest locally
pnpm cron:weekly-digest
```

**Note:** These might fail with module errors because they import SvelteKit-specific modules. If that happens, use Method 1 or Method 3 instead.

---

## Method 3: Check Fly.io Dashboard Directly

Since you can see the app on fly.io's web interface:

### Step 1: Go to Fly.io Dashboard
Visit: https://fly.io/dashboard

### Step 2: Find Your App
Look for "kaiwa" or your app name

### Step 3: Check Machines
Click on "Machines" tab to see if cron machines exist:
- `cron-daily-reminders`
- `cron-founder-emails`
- `cron-weekly-digest`

### Step 4: Check Logs
Click on "Logs" or "Monitoring" to see recent activity:
- Look for entries with "cron" in them
- Check for any error messages

### Step 5: Check Secrets
Go to "Secrets" tab and verify:
- ✅ `CRON_SECRET` is set
- ✅ `RESEND_API_KEY` is set
- ✅ `DATABASE_URL` is set

---

## Troubleshooting

### Problem: "Unauthorized" error when testing

**Solution:**
1. Go to Fly.io dashboard → Your app → Secrets
2. Find `CRON_SECRET` value
3. Copy it exactly (no extra spaces)
4. Use it in your test:
   ```bash
   export CRON_SECRET="paste_here"
   pnpm cron:test:remote
   ```

### Problem: "Could not connect" error

**Solution:**
1. Verify your app URL: https://trykaiwa.com (or your custom domain)
2. Visit the URL in a browser - does it load?
3. If not, your app might not be deployed
4. Check Fly.io dashboard → Status

### Problem: Cron jobs not running automatically

**Possible causes:**

1. **Cron machines not deployed**
   - Check Fly.io dashboard → Machines
   - Should see 3 cron machines (stopped when not running)
   - If missing, deploy them: `pnpm cron:deploy` (but you need CLI access)

2. **Wrong schedule**
   - Cron machines might be scheduled for the wrong time
   - Check machine config in Fly.io dashboard

3. **App not responding**
   - Check app logs in Fly.io dashboard
   - Look for errors

---

## How to Fix CLI Authorization Issues

Since `fly` CLI gives you "unauthorized" errors:

### Option 1: Get Admin Access
Ask whoever deployed the app to:
1. Add you as a collaborator in Fly.io dashboard
2. Or give you a new access token with proper permissions

### Option 2: Create New Deploy Token
In Fly.io dashboard:
1. Go to Account Settings → Access Tokens
2. Create a new token with app deployment permissions
3. Use it locally:
   ```bash
   fly auth token <your-new-token>
   ```

### Option 3: Use the Dashboard Instead
You don't need CLI access if:
- ✅ You can test via HTTP endpoints (Method 1)
- ✅ You can check logs in dashboard
- ✅ Someone else can deploy cron machines for you

---

## Verifying Cron Jobs Are Working

### Check 1: Test the Endpoint
```bash
export CRON_SECRET=your_secret
pnpm cron:test:remote
```
**Expected:** Status 200 OK with stats

### Check 2: Check App Logs
In Fly.io dashboard → Logs, look for:
```
[cron-daily-reminders] 🚀 Starting automated email reminder process...
[cron-daily-reminders] 📊 Found 10 verified users
[cron-daily-reminders] ✅ Reminder sent to user@example.com
```

### Check 3: Check Resend Dashboard
1. Go to https://resend.com/emails
2. Look for emails sent from your domain
3. Check delivery status

### Check 4: Check Machines Exist
In Fly.io dashboard → Machines:
```
cron-daily-reminders    stopped    (runs at 9:00 UTC)
cron-founder-emails     stopped    (runs at 14:00 UTC)
cron-weekly-digest      stopped    (runs at 10:00 UTC Mondays)
```

---

## Quick Reference

| What                | Command                                          |
|---------------------|--------------------------------------------------|
| Test remotely       | `CRON_SECRET=xxx pnpm cron:test:remote`         |
| Test locally        | `pnpm cron:reminders`                           |
| Check Fly dashboard | https://fly.io/dashboard                        |
| Check email logs    | https://resend.com/emails                       |
| Manual curl test    | `curl -H "Authorization: Bearer $CRON_SECRET" https://trykaiwa.com/api/cron/send-reminders?dryRun=true` |

---

## Next Steps

1. **Get your CRON_SECRET** from Fly.io dashboard
2. **Test the endpoints** using Method 1
3. **Check if cron machines exist** in Fly.io dashboard
4. **If no cron machines**, ask whoever has admin access to deploy them

If the endpoints work (Method 1), but cron machines don't exist, you have two options:
- **Option A:** Deploy cron machines (requires CLI access): `pnpm cron:deploy`
- **Option B:** Use GitHub Actions or external scheduler to call the HTTP endpoints

---

**Need help?** Check [CRON_DEBUGGING_GUIDE.md](CRON_DEBUGGING_GUIDE.md) for detailed troubleshooting.
