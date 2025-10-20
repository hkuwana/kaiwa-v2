#!/bin/bash

###############################################################################
# Deploy Cron Jobs to Fly.io
#
# This script creates or updates scheduled Fly.io machines that run cron jobs
# as separate processes from the main app.
#
# Usage:
#   ./scripts/deploy-cron-jobs.sh
#
# Prerequisites:
#   - Fly CLI installed: https://fly.io/docs/hands-on/install-flyctl/
#   - Logged in: fly auth login
#   - CRON_SECRET set in Fly.io: fly secrets set CRON_SECRET=your_secret
#
###############################################################################

set -e  # Exit on error

# Configuration
APP_NAME="kaiwa"
REGION="den"  # Denver - change to your preferred region

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Deploying cron jobs to Fly.io${NC}\n"

# Check if fly CLI is installed
if ! command -v fly &> /dev/null; then
    echo -e "${YELLOW}⚠️  Fly CLI not found. Install it from: https://fly.io/docs/hands-on/install-flyctl/${NC}"
    exit 1
fi

# Check if logged in
if ! fly auth whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged into Fly.io. Run: fly auth login${NC}"
    exit 1
fi

echo -e "${BLUE}📋 App: ${APP_NAME}${NC}"
echo -e "${BLUE}📍 Region: ${REGION}${NC}\n"

###############################################################################
# Deploy Daily Reminder Cron Job
###############################################################################

echo -e "${GREEN}📧 Deploying daily reminder cron job...${NC}"
echo -e "   Schedule: Daily at 9:00 AM UTC"
echo -e "   Command: tsx scripts/send-reminders.ts\n"

fly machine run \
  --app "${APP_NAME}" \
  --region "${REGION}" \
  --schedule daily \
  --schedule-time "09:00" \
  --name "cron-daily-reminders" \
  --dockerfile Dockerfile \
  --entrypoint "pnpm" \
  --cmd "tsx" \
  --cmd "scripts/send-reminders.ts" \
  --vm-size shared-cpu-1x \
  --vm-memory 512 \
  || echo -e "${YELLOW}⚠️  Machine might already exist. Use 'fly machine update' to modify.${NC}"

echo -e "${GREEN}✅ Daily reminder cron job deployed${NC}\n"

###############################################################################
# Deploy Founder Email Sequence Cron Job
###############################################################################

echo -e "${GREEN}📧 Deploying founder email sequence cron job...${NC}"
echo -e "   Schedule: Daily at 2:00 PM UTC (afternoon for better engagement)"
echo -e "   Command: tsx scripts/send-founder-emails.ts\n"

fly machine run \
  --app "${APP_NAME}" \
  --region "${REGION}" \
  --schedule daily \
  --schedule-time "14:00" \
  --name "cron-founder-emails" \
  --dockerfile Dockerfile \
  --entrypoint "pnpm" \
  --cmd "tsx" \
  --cmd "scripts/send-founder-emails.ts" \
  --vm-size shared-cpu-1x \
  --vm-memory 512 \
  || echo -e "${YELLOW}⚠️  Machine might already exist. Use 'fly machine update' to modify.${NC}"

echo -e "${GREEN}✅ Founder email cron job deployed${NC}\n"

###############################################################################
# Deploy Weekly Digest Cron Job
###############################################################################

echo -e "${GREEN}📊 Deploying weekly digest cron job...${NC}"
echo -e "   Schedule: Every Monday at 10:00 AM UTC"
echo -e "   Command: tsx scripts/send-weekly-digest.ts\n"

fly machine run \
  --app "${APP_NAME}" \
  --region "${REGION}" \
  --schedule daily \
  --schedule-time "10:00" \
  --name "cron-weekly-digest" \
  --dockerfile Dockerfile \
  --entrypoint "pnpm" \
  --cmd "tsx" \
  --cmd "scripts/send-weekly-digest.ts" \
  --vm-size shared-cpu-1x \
  --vm-memory 512 \
  || echo -e "${YELLOW}⚠️  Machine might already exist. Use 'fly machine update' to modify.${NC}"

echo -e "${GREEN}✅ Weekly digest cron job deployed${NC}\n"

###############################################################################
# Summary
###############################################################################

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 Cron jobs deployed successfully!${NC}\n"

echo -e "View machines:"
echo -e "  ${YELLOW}fly machines list --app ${APP_NAME}${NC}\n"

echo -e "View logs for a specific machine:"
echo -e "  ${YELLOW}fly logs --app ${APP_NAME}${NC}\n"

echo -e "Manually trigger a cron job (for testing):"
echo -e "  ${YELLOW}fly ssh console --app ${APP_NAME} --machine <machine-id>${NC}"
echo -e "  ${YELLOW}pnpm tsx scripts/send-reminders.ts${NC}\n"

echo -e "Update a cron job schedule:"
echo -e "  ${YELLOW}fly machine update <machine-id> --schedule daily --schedule-time \"09:00\"${NC}\n"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
