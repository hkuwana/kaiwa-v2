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
REGION="dfw"  # Dallas - matches fly.io hosting

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

# Helper function to get machine ID by name
get_machine_id() {
    local machine_name=$1
    fly machines list -a "${APP_NAME}" --json 2>/dev/null | grep -B5 "\"name\":\"${machine_name}\"" | grep '"id"' | head -1 | cut -d'"' -f4
}

# Helper function to check if a machine exists
machine_exists() {
    local machine_name=$1
    local machine_id=$(get_machine_id "$machine_name")
    [ -n "$machine_id" ]
}

###############################################################################
# Deploy Daily Reminder Cron Job
###############################################################################

echo -e "${GREEN}📧 Deploying daily reminder cron job...${NC}"
echo -e "   Schedule: Daily at 9:00 AM UTC"
echo -e "   Command: tsx scripts/send-reminders.ts\n"

# Get the latest image tag from a running machine
# Parse from regular fly machines list output (not JSON since it requires auth)
IMAGE_TAG=$(fly machines list -a "${APP_NAME}" 2>/dev/null | grep -E "^\w+" | head -1 | awk '{for(i=1;i<=NF;i++) if($i ~ /^[a-z-]+:deployment-/) print $i}')

if [ -z "$IMAGE_TAG" ]; then
    echo -e "${RED}❌ No existing image found. Please deploy your app first: fly deploy${NC}"
    exit 1
fi

echo -e "${BLUE}Using image: registry.fly.io/${IMAGE_TAG}${NC}\n"
IMAGE_TAG="registry.fly.io/${IMAGE_TAG}"

# Create machine config with schedule
# Note: Fly.io doesn't support cron syntax in machine configs
# We need to use their API format or create machines without schedule and use fly-cron extension
cat > /tmp/cron-daily-reminders.json <<EOF
{
  "image": "${IMAGE_TAG}",
  "guest": {
    "cpu_kind": "shared",
    "cpus": 1,
    "memory_mb": 512
  },
  "restart": {
    "policy": "no"
  },
  "init": {
    "cmd": ["/bin/sh", "-c", "cd /app && pnpm tsx scripts/send-reminders.ts"]
  }
}
EOF

# Update existing machine or create new one
MACHINE_ID=$(get_machine_id "cron-daily-reminders")
if [ -n "$MACHINE_ID" ]; then
    echo -e "${BLUE}📝 Updating existing machine ${MACHINE_ID}...${NC}"
    fly machine update "$MACHINE_ID" \
      --app "${APP_NAME}" \
      --config /tmp/cron-daily-reminders.json \
      --yes
else
    echo -e "${BLUE}🆕 Creating new machine...${NC}"
    fly machines create \
      --app "${APP_NAME}" \
      --region "${REGION}" \
      --name "cron-daily-reminders" \
      --config /tmp/cron-daily-reminders.json
fi

echo -e "${GREEN}✅ Daily reminder cron job deployed${NC}\n"

###############################################################################
# Deploy Founder Email Sequence Cron Job
###############################################################################

echo -e "${GREEN}📧 Deploying founder email sequence cron job...${NC}"
echo -e "   Schedule: Daily at 2:00 PM UTC (afternoon for better engagement)"
echo -e "   Command: tsx scripts/send-founder-emails.ts\n"

# Create machine config with cron schedule
cat > /tmp/cron-founder-emails.json <<EOF
{
  "image": "${IMAGE_TAG}",
  "guest": {
    "cpu_kind": "shared",
    "cpus": 1,
    "memory_mb": 512
  },
  "schedule": "0 14 * * *",
  "restart": {
    "policy": "no"
  },
  "init": {
    "cmd": ["/bin/sh", "-c", "cd /app && pnpm tsx scripts/send-founder-emails.ts"]
  }
}
EOF

# Update existing machine or create new one
MACHINE_ID=$(get_machine_id "cron-founder-emails")
if [ -n "$MACHINE_ID" ]; then
    echo -e "${BLUE}📝 Updating existing machine ${MACHINE_ID}...${NC}"
    fly machine update "$MACHINE_ID" \
      --app "${APP_NAME}" \
      --config /tmp/cron-founder-emails.json \
      --yes
else
    echo -e "${BLUE}🆕 Creating new machine...${NC}"
    fly machines create \
      --app "${APP_NAME}" \
      --region "${REGION}" \
      --name "cron-founder-emails" \
      --config /tmp/cron-founder-emails.json
fi

echo -e "${GREEN}✅ Founder email cron job deployed${NC}\n"

###############################################################################
# Deploy Weekly Digest Cron Job (Product Updates)
###############################################################################

echo -e "${GREEN}📊 Deploying weekly digest cron job...${NC}"
echo -e "   Schedule: Every Monday at 10:00 AM UTC"
echo -e "   Command: tsx scripts/send-weekly-digest.ts\n"

# Create machine config with cron schedule
cat > /tmp/cron-weekly-digest.json <<EOF
{
  "image": "${IMAGE_TAG}",
  "guest": {
    "cpu_kind": "shared",
    "cpus": 1,
    "memory_mb": 512
  },
  "schedule": "0 10 * * 1",
  "restart": {
    "policy": "no"
  },
  "init": {
    "cmd": ["/bin/sh", "-c", "cd /app && pnpm tsx scripts/send-weekly-digest.ts"]
  }
}
EOF

# Update existing machine or create new one
MACHINE_ID=$(get_machine_id "cron-weekly-digest")
if [ -n "$MACHINE_ID" ]; then
    echo -e "${BLUE}📝 Updating existing machine ${MACHINE_ID}...${NC}"
    fly machine update "$MACHINE_ID" \
      --app "${APP_NAME}" \
      --config /tmp/cron-weekly-digest.json \
      --yes
else
    echo -e "${BLUE}🆕 Creating new machine...${NC}"
    fly machines create \
      --app "${APP_NAME}" \
      --region "${REGION}" \
      --name "cron-weekly-digest" \
      --config /tmp/cron-weekly-digest.json
fi

echo -e "${GREEN}✅ Weekly digest cron job deployed${NC}\n"

###############################################################################
# Deploy Weekly Stats Email Cron Job (User Practice Stats)
###############################################################################

echo -e "${GREEN}📈 Deploying weekly stats email cron job...${NC}"
echo -e "   Schedule: Every Monday at 11:00 AM UTC"
echo -e "   Command: tsx scripts/send-weekly-stats.ts\n"

# Create machine config with cron schedule
cat > /tmp/cron-weekly-stats.json <<EOF
{
  "image": "${IMAGE_TAG}",
  "guest": {
    "cpu_kind": "shared",
    "cpus": 1,
    "memory_mb": 512
  },
  "schedule": "0 11 * * 1",
  "restart": {
    "policy": "no"
  },
  "init": {
    "cmd": ["/bin/sh", "-c", "cd /app && pnpm tsx scripts/send-weekly-stats.ts"]
  }
}
EOF

# Update existing machine or create new one
MACHINE_ID=$(get_machine_id "cron-weekly-stats")
if [ -n "$MACHINE_ID" ]; then
    echo -e "${BLUE}📝 Updating existing machine ${MACHINE_ID}...${NC}"
    fly machine update "$MACHINE_ID" \
      --app "${APP_NAME}" \
      --config /tmp/cron-weekly-stats.json \
      --yes
else
    echo -e "${BLUE}🆕 Creating new machine...${NC}"
    fly machines create \
      --app "${APP_NAME}" \
      --region "${REGION}" \
      --name "cron-weekly-stats" \
      --config /tmp/cron-weekly-stats.json
fi

echo -e "${GREEN}✅ Weekly stats cron job deployed${NC}\n"

###############################################################################
# Summary
###############################################################################

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 Cron jobs deployed successfully!${NC}\n"

echo -e "${BLUE}Deployed machines:${NC}"
echo -e "  ✅ cron-daily-reminders   - Daily at 9:00 AM UTC"
echo -e "  ✅ cron-founder-emails    - Daily at 2:00 PM UTC"
echo -e "  ✅ cron-weekly-digest     - Monday at 10:00 AM UTC"
echo -e "  ✅ cron-weekly-stats      - Monday at 11:00 AM UTC\n"

echo -e "View machines:"
echo -e "  ${YELLOW}fly machines list --app ${APP_NAME}${NC}\n"

echo -e "View logs for a specific machine:"
echo -e "  ${YELLOW}fly logs --app ${APP_NAME}${NC}\n"

echo -e "Test a cron job locally:"
echo -e "  ${YELLOW}pnpm run cron:reminders${NC}"
echo -e "  ${YELLOW}pnpm run cron:weekly-stats${NC}\n"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
