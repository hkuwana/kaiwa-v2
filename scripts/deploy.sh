#!/bin/bash

# deploy.sh - Deploy Kaiwa to fly.io

set -e

ENVIRONMENT=${1:-staging}
APP_NAME="kaiwa-v2"

if [ "$ENVIRONMENT" = "production" ]; then
  APP_NAME="kaiwa-v2"
  BRANCH="main"
elif [ "$ENVIRONMENT" = "staging" ]; then
  APP_NAME="kaiwa-v2-staging"
  BRANCH="develop"
else
  echo "Invalid environment. Use 'staging' or 'production'"
  exit 1
fi

echo "🚀 Deploying to $ENVIRONMENT environment..."

# Check if we're on the correct branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
  echo "❌ You must be on the $BRANCH branch to deploy to $ENVIRONMENT"
  exit 1
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ You have uncommitted changes. Please commit or stash them first."
  exit 1
fi

# Run tests
echo "🧪 Running tests..."
pnpm test

# Build application
echo "🔨 Building application..."
pnpm build

# Deploy to fly.io
echo "🚀 Deploying to fly.io..."
flyctl deploy --remote-only --app $APP_NAME

# Health check
echo "🏥 Performing health check..."
sleep 30
HEALTH_URL="https://$APP_NAME.fly.dev/api/health"

if curl -f $HEALTH_URL > /dev/null 2>&1; then
  echo "✅ Deployment successful! Health check passed."
  echo "🌐 Your app is available at: https://$APP_NAME.fly.dev"
else
  echo "❌ Health check failed. Deployment may have issues."
  exit 1
fi
