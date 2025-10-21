# Cron Execution Architecture (Unified Overview)

This document summarizes the current cron-job setup, highlights the gaps observed during recent deployments, and proposes an architecture that is easier to reason about and operate. It merges the practical guidance from the existing cron documentation into a single reference.

---

## 1. Current State
- **Main application**  
  - SvelteKit app deployed as Fly.io app `kaiwa`.  
  - Docker image defined in `Dockerfile`; `CMD ["pnpm", "run", "start"]` should expose `0.0.0.0:3000`.
- **Cron jobs**  
  - Schedules are created by `scripts/deploy-cron-jobs.sh` using Fly Machines with the main app image.  
  - Jobs run `pnpm tsx scripts/send-*.ts` and exit.  
  - Local dry-run scripts (`pnpm cron:reminders`, `pnpm cron:founder-emails`, etc.) use the same code paths.
- **Documentation**  
  - Multiple markdown files detail architecture, setup, debugging, and testing (e.g. `architecture-cron-jobs.md`, `HOW_TO_TEST_CRONS.md`, `CRON_DEBUGGING_GUIDE.md`, `CRON_SETUP_SUMMARY.md`).

---

## 2. Issues Observed
1. **Fly warning: app not listening on expected port**  
   - Deployment logs show `"WARNING The app is not listening on the expected address"`.  
   - This usually means the container never executed the `pnpm run start` process (for example, a boot-time crash or missing build). Confirm the container binds to `0.0.0.0:3000` and check logs with `fly logs --app kaiwa`.

2. **Non-idempotent cron deployment script**  
   - `fly machine run` with `--name` creates a new Machine each time. Re-running the script prints a warning and leaves the old schedule untouched.  
   - Schedule or command changes therefore require manual `fly machine update`, which is easy to forget.

3. **Incorrect “weekly” schedule**  
   - Weekly digest job uses `--schedule daily` instead of `weekly`. It currently runs every day and then fails, leaving red entries in Fly logs.

4. **Hard failure exit codes**  
   - `send-reminders.ts` and `send-founder-emails.ts` call `process.exit(1)` when any user sends fail. Fly marks the run as failed even if the script handled individual errors. This creates noisy alerts.

5. **Documentation sprawl**  
   - Operators must read several markdown files to reconstruct the workflow. Maintaining consistent instructions is error-prone.

---

## 3. Recommended Architecture Changes

### 3.1 Make cron deployment predictable
- Replace the `fly machine run ... || echo "already exists"` pattern with an idempotent flow:
  1. `fly machine list --app kaiwa --json` to check for the machine name.
  2. If present, `fly machine update <id> ...`.
  3. Otherwise, create it.
- Alternatively, adopt Fly’s [Cron Manager](https://fly.io/docs/blueprints/task-scheduling-guide/) as a companion app:
  - Deploy Cron Manager once (tiny Fly app).
  - Store schedules in version-controlled `schedules.json`.
  - Each cron run spins up a one-off Machine with the latest image.  
  - Benefit: no per-machine drift, simpler rollbacks, centralized logs.
- If you stay with raw scheduled Machines, consider a dedicated cron Dockerfile that installs only runtime dependencies and sets `ENTRYPOINT ["pnpm", "tsx"]`. This keeps cron images slim and avoids surprises when the web app Dockerfile changes.

### 3.2 Fix scheduling granularity
- For weekly jobs use:
  ```bash
  --schedule weekly \
  --schedule-weekday monday \
  --schedule-time "10:00"
  ```
- For monthly or hourly frequencies leverage the corresponding Fly schedule types. Document each schedule next to the deploy command to keep intent clear.

### 3.3 Improve exit semantics & logging
- Let scripts exit with `0` when only per-user failures happen. Collect failures into the log output and, if needed, trigger notifications elsewhere (PostHog, email, Slack webhook).  
- Reserve non-zero exits for unrecoverable situations (missing secrets, database offline, etc.).
- Ship structured logs for Fly’s log search (e.g. `console.log(JSON.stringify({ level: "error", job: "reminders", ... }))`).

### 3.4 Verify main app boot
- Use `fly logs --app kaiwa --instance <id>` after each deploy to confirm the Node server starts and binds to `0.0.0.0:3000`.  
- Add health checks in `fly.toml` once the server is stable:
  ```toml
  [http_service.checks]
    grace_period = "30s"
    interval = "15s"
    method = "GET"
    timeout = "5s"
    path = "/health"
  ```
- Implement `/health` endpoint in the app so Fly restarts the Machine if boot fails.

### 3.5 Consolidate documentation
- Keep this unified doc as the canonical operator guide.  
- Strip redundant sections from `CRON_SETUP_SUMMARY.md` and `CRON_DEBUGGING_GUIDE.md`, leaving them as short changelog entries or archive them under `archive-*`.  
- Link here from `scripts/README.md` and `architecture-cron-jobs.md`.

---

## 4. Implementation Checklist

1. **Main app**
   - [ ] Confirm `pnpm run start` listens on `0.0.0.0:3000`.  
   - [ ] Add HTTP health check in `fly.toml`.

2. **Cron jobs (short term)**
   - [ ] Update `scripts/deploy-cron-jobs.sh` to detect existing Machines and use `fly machine update`.  
   - [ ] Fix weekly digest schedule flags.  
   - [ ] Adjust scripts to exit `0` unless fatal.

3. **Cron jobs (medium term)**
   - [ ] Evaluate Cron Manager adoption (separate app + `schedules.json`).  
   - [ ] If adopted, retire per-machine deployment script and track schedules in Git.  
   - [ ] Create a minimal cron Dockerfile / builder pipeline if image size or dependencies become an issue.

4. **Operational hygiene**
   - [ ] Add a runbook snippet for inspecting cron logs (`fly machines list`, `fly machine status`, `fly logs`).  
   - [ ] Automate dry-run checks in CI (`pnpm cron:test:local`).  
   - [ ] Set up alerting for repeated cron failures (e.g. Fly’s metrics or PostHog).

---

## 5. Frequently Referenced Commands
```bash
# Deploy/update cron machines
pnpm cron:deploy

# Inspect machines
fly machines list --app kaiwa
fly machine status <machine-id>

# View logs (replace <machine-id> as needed)
fly logs --app kaiwa --instance <machine-id>

# Manual dry run
pnpm cron:reminders -- --dryRun

# Remote dry run via HTTPS
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://trykaiwa.com/api/cron/send-reminders?dryRun=true"
```

---

## 6. Document Map
- **This file** – authoritative overview & checklist.
- `scripts/README.md` – quick commands (link back here for details).
- `architecture-cron-jobs.md` – keep for historical deep-dive; add a banner pointing to this summary.
- Archive remaining cron-related markdowns once their content is merged here.

---

Maintaining the cron subsystem as a first-class service (versioned schedules, predictable deploys, clean docs) will save you time each time a job changes or fails. Adopt the incremental fixes now, and schedule a follow-up to migrate to Cron Manager if job count or complexity grows.
