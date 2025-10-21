# 🐛 Cron Jobs Debugging Guide

## Problem Identified ✅

**Your cron jobs are not working because the Fly.io app "kaiwa" does not exist or you don't have access to it.**

Running `fly apps list` shows no apps, and `fly status --app kaiwa` returns "App not found".

## Root Cause

The cron jobs were **configured** but never **deployed** to Fly.io. Your local setup is complete, but the production deployment step was missed.

---

## Solution: Deploy to Fly.io

### Step 1: Check if the app exists under a different name

```bash
fly apps list
```

If you see an app with a different name, update [fly.toml](fly.toml) line 14:
```toml
app = 'your-actual-app-name'
```

### Step 2: Create the Fly.io app (if it doesn't exist)

```bash
# Initialize a new Fly.io app
fly launch --no-deploy

# This will:
# - Create a new app (or use existing name from fly.toml)
# - Set up your app in Fly.io's infrastructure
# - NOT deploy yet (we'll do that next)
```

### Step 3: Set required secrets

```bash
# Set environment variables in Fly.io
fly secrets set CRON_SECRET=$(openssl rand -hex 32)
fly secrets set RESEND_API_KEY=your_resend_api_key
fly secrets set DATABASE_URL=your_database_url
fly secrets set PUBLIC_BASE_URL=https://trykaiwa.com

# Verify secrets are set
fly secrets list
```

### Step 4: Deploy the main application

```bash
fly deploy
```

This deploys your SvelteKit application to Fly.io.

### Step 5: Deploy cron jobs

```bash
# Option 1: Using npm script
pnpm cron:deploy

# Option 2: Direct script
./scripts/deploy-cron-jobs.sh
```

This creates separate Fly.io machines for each cron job:
- `cron-daily-reminders` (runs at 9:00 AM UTC)
- `cron-founder-emails` (runs at 2:00 PM UTC)
- `cron-weekly-digest` (runs at 10:00 AM UTC on Mondays)

### Step 6: Verify deployment

```bash
# List all machines (should see web + 3 cron machines)
fly machines list

# Check logs
fly logs

# Follow logs in real-time
fly logs -f
```

Expected output:
```
ID        NAME                   STATE    REGION
abc123    kaiwa                  started  den      (main web app)
def456    cron-daily-reminders   stopped  den      (runs on schedule)
ghi789    cron-founder-emails    stopped  den      (runs on schedule)
jkl012    cron-weekly-digest     stopped  den      (runs on schedule)
```

**Note**: Cron machines show as "stopped" when not actively running. They automatically start at their scheduled time.

---

## Alternative: Test Locally First

If you're not ready to deploy to Fly.io yet, you can test the cron jobs locally:

### Test Reminders

```bash
pnpm cron:reminders
```

### Test Founder Emails

```bash
pnpm cron:founder-emails
```

### Test Weekly Digest

```bash
pnpm cron:weekly-digest
```

### Run All Tests

```bash
pnpm tsx scripts/test-cron-jobs.ts local-all
```

---

## Common Issues & Solutions

### Issue 1: "App not found"

**Symptom**: `fly status --app kaiwa` returns "App not found"

**Solution**: The app was never created. Follow Step 2 above.

---

### Issue 2: "Unauthorized"

**Symptom**: `fly machines list` returns "unauthorized"

**Solution**:
```bash
fly auth login
```
Then re-run your command.

---

### Issue 3: Cron jobs deployed but not running

**Symptom**: Machines exist but logs show no activity

**Checklist**:
1. Check machine schedule:
   ```bash
   fly machines list
   fly machine status <machine-id>
   ```

2. Manually trigger a cron job:
   ```bash
   fly ssh console
   pnpm tsx scripts/send-reminders.ts
   exit
   ```

3. Check for errors in logs:
   ```bash
   fly logs | grep -i error
   ```

4. Verify secrets are set:
   ```bash
   fly secrets list
   ```

---

### Issue 4: Scripts fail with "Cannot find package '$env'"

**Symptom**: Running `pnpm cron:reminders` locally fails with module errors

**Solution**: This is a SvelteKit-specific issue. The scripts import SvelteKit environment modules that don't work outside the dev server.

**Temporary workaround**: Use the HTTP endpoints for testing:
```bash
# Set CRON_SECRET locally
export CRON_SECRET=your_secret

# Test via development server
pnpm dev

# In another terminal, call the endpoint
curl -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:5173/api/cron/send-reminders?dryRun=true
```

**Proper fix**: Update scripts to load environment variables directly instead of using `$env`:
```typescript
// Instead of:
import { env } from '$env/dynamic/private';

// Use:
import { config } from 'dotenv';
config();
const env = process.env;
```

---

### Issue 5: Wrong Fly.io account

**Symptom**: You deployed to a different account/organization

**Solution**:
```bash
# Check current account
fly auth whoami

# List organizations
fly orgs list

# Switch organization (if needed)
fly auth logout
fly auth login
```

---

## Monitoring & Maintenance

### Check if cron jobs ran today

```bash
fly logs | grep "cron-" | tail -50
```

### Manually trigger a cron job (for testing)

```bash
# SSH into the Fly.io machine
fly ssh console

# Run the script
pnpm tsx scripts/send-reminders.ts

# Exit
exit
```

### Update cron schedule

```bash
# Get machine ID
fly machines list

# Update schedule
fly machine update <machine-id> \
  --schedule daily \
  --schedule-time "10:00"
```

### View detailed machine config

```bash
fly machines list
fly machine status <machine-id>
```

---

## Testing Checklist

Before marking cron jobs as "working":

- [ ] Main app deployed to Fly.io (`fly deploy`)
- [ ] Secrets configured (`fly secrets list`)
- [ ] Cron machines created (`fly machines list` shows 3 cron machines)
- [ ] Logs show cron activity (`fly logs | grep cron`)
- [ ] Test email received (wait for scheduled time or trigger manually)
- [ ] No errors in logs (`fly logs | grep -i error`)

---

## Quick Reference Commands

```bash
# Deploy everything
fly deploy                    # Deploy main app
pnpm cron:deploy             # Deploy cron jobs
fly machines list            # Verify machines exist

# Monitor
fly logs                     # View all logs
fly logs -f                  # Follow logs in real-time
fly logs | grep "cron-"     # Filter cron logs

# Troubleshoot
fly ssh console              # SSH into machine
fly secrets list             # Check environment variables
fly machine status <id>      # Check machine details

# Test locally
pnpm cron:reminders          # Test reminders
pnpm cron:founder-emails     # Test founder emails
pnpm cron:weekly-digest      # Test weekly digest
```

---

## Next Steps

1. **Deploy to Fly.io** (if you haven't already)
   - Create app: `fly launch --no-deploy`
   - Set secrets: `fly secrets set ...`
   - Deploy main app: `fly deploy`
   - Deploy cron jobs: `pnpm cron:deploy`

2. **Verify deployment**
   - Check machines: `fly machines list`
   - Check logs: `fly logs`

3. **Wait for scheduled run**
   - Daily reminders: 9:00 AM UTC
   - Founder emails: 2:00 PM UTC
   - Weekly digest: 10:00 AM UTC on Mondays

4. **Monitor first run**
   - `fly logs -f` (follow logs in real-time)
   - Check email delivery in Resend dashboard

---

## Additional Resources

- [Fly.io Scheduled Machines](https://fly.io/docs/machines/guides-examples/scheduling-machines/)
- [Architecture Documentation](src/lib/docs/architecture-cron-jobs.md)
- [Cron Setup Summary](CRON_SETUP_SUMMARY.md)
- [Deploy Script](scripts/deploy-cron-jobs.sh)

---

**Last Updated**: January 2025
