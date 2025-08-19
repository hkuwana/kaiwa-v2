# 🚀 Deployment Guide

> **Target Platform**: fly.io with GitHub Actions CI/CD pipeline for automated deployment and environment management.

---

## 🎯 Deployment Overview

Kaiwa v2 is deployed on fly.io with a comprehensive CI/CD pipeline that ensures reliable, automated deployments across multiple environments.

### Deployment Environments

- **Production**: `kaiwa-v2.fly.dev` (main branch)
- **Staging**: `kaiwa-v2-staging.fly.dev` (develop branch)
- **Development**: `kaiwa-v2-dev.fly.dev` (feature branches)

---

## 🏗️ Infrastructure Setup

### 1. Fly.io Configuration

#### Fly.toml Configuration

```toml
# fly.toml
app = "kaiwa-v2"
primary_region = "nrt"  # Tokyo, Japan

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"
  PORT = "3000"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 1
  processes = ["app"]

[[http_service.checks]]
  grace_period = "10s"
  interval = "30s"
  method = "GET"
  timeout = "5s"
  path = "/health"

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 1024

[[vm]]
  cpu_kind = "shared"
  cpus = 2
  memory_mb = 2048

[metrics]
  port = 9091
  path = "/metrics"
```

#### Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image, copy all the files and run the app
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### 2. Environment Configuration

#### Environment Variables

```bash
# .env.production
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://user:password@host:5432/kaiwa_v2
DIRECT_URL=postgresql://user:password@host:5432/kaiwa_v2

# Authentication
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
JWT_SECRET=your_jwt_secret

# External Services
OPENAI_API_KEY=your_openai_api_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Analytics
POSTHOG_API_KEY=your_posthog_api_key
POSTHOG_HOST=https://app.posthog.com

# Storage
S3_ACCESS_KEY=your_s3_access_key
S3_SECRET_KEY=your_s3_secret_key
S3_BUCKET=kaiwa-v2-audio
S3_REGION=us-east-1

# Monitoring
SENTRY_DSN=your_sentry_dsn
LOG_LEVEL=info
```

#### Fly.io Secrets Management

```bash
# Set production secrets
fly secrets set \
  DATABASE_URL="postgresql://user:password@host:5432/kaiwa_v2" \
  GOOGLE_CLIENT_ID="your_google_client_id" \
  GOOGLE_CLIENT_SECRET="your_google_client_secret" \
  JWT_SECRET="your_jwt_secret" \
  OPENAI_API_KEY="your_openai_api_key" \
  STRIPE_SECRET_KEY="your_stripe_secret_key" \
  STRIPE_WEBHOOK_SECRET="your_stripe_webhook_secret" \
  POSTHOG_API_KEY="your_posthog_api_key" \
  S3_ACCESS_KEY="your_s3_access_key" \
  S3_SECRET_KEY="your_s3_secret_key" \
  SENTRY_DSN="your_sentry_dsn"

# Set staging secrets
fly secrets set \
  --app kaiwa-v2-staging \
  DATABASE_URL="postgresql://user:password@host:5432/kaiwa_v2_staging" \
  GOOGLE_CLIENT_ID="your_google_client_id" \
  GOOGLE_CLIENT_SECRET="your_google_client_secret" \
  JWT_SECRET="your_jwt_secret" \
  OPENAI_API_KEY="your_openai_api_key" \
  STRIPE_SECRET_KEY="your_stripe_test_key" \
  STRIPE_WEBHOOK_SECRET="your_stripe_test_webhook_secret" \
  POSTHOG_API_KEY="your_posthog_api_key" \
  S3_ACCESS_KEY="your_s3_access_key" \
  S3_SECRET_KEY="your_s3_secret_key" \
  SENTRY_DSN="your_sentry_dsn"
```

---

## 🔄 CI/CD Pipeline

### 1. GitHub Actions Workflow

#### Main Workflow (`.github/workflows/deploy.yml`)

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}

jobs:
  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run tests
        run: pnpm test

      - name: Build application
        run: pnpm build

      - name: Deploy to fly.io
        uses: superfly/flyctl-actions/setup-flyctl@master

      - name: Deploy app
        run: flyctl deploy --remote-only

      - name: Health check
        run: |
          sleep 30
          curl -f https://kaiwa-v2.fly.dev/health || exit 1

      - name: Notify deployment
        if: always()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deployments'
          text: 'Kaiwa v2 production deployment ${{ job.status }}'
```

#### Staging Workflow (`.github/workflows/deploy-staging.yml`)

```yaml
name: Deploy to Staging

on:
  push:
    branches: [develop]
  workflow_dispatch:

env:
  FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}

jobs:
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run tests
        run: pnpm test

      - name: Build application
        run: pnpm build

      - name: Deploy to fly.io staging
        uses: superfly/flyctl-actions/setup-flyctl@master

      - name: Deploy staging app
        run: flyctl deploy --remote-only --app kaiwa-v2-staging

      - name: Health check staging
        run: |
          sleep 30
          curl -f https://kaiwa-v2-staging.fly.dev/health || exit 1
```

#### Feature Branch Workflow (`.github/workflows/deploy-feature.yml`)

```yaml
name: Deploy Feature Branch

on:
  pull_request:
    types: [opened, synchronize, reopened]
  workflow_dispatch:

env:
  FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}

jobs:
  deploy-feature:
    name: Deploy Feature Branch
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run tests
        run: pnpm test

      - name: Build application
        run: pnpm build

      - name: Generate app name
        id: app-name
        run: |
          BRANCH_NAME=${GITHUB_HEAD_REF//[^a-zA-Z0-9]/-}
          APP_NAME="kaiwa-v2-${BRANCH_NAME}"
          echo "app-name=${APP_NAME}" >> $GITHUB_OUTPUT

      - name: Deploy feature app
        uses: superfly/flyctl-actions/setup-flyctl@master

      - name: Deploy to fly.io
        run: |
          flyctl deploy --remote-only --app ${{ steps.app-name.outputs.app-name }}

      - name: Comment PR
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `🚀 Feature branch deployed to: https://${{ steps.app-name.outputs.app-name }}.fly.dev`
            })
```

### 2. Database Migrations

#### Migration Workflow (`.github/workflows/migrate.yml`)

```yaml
name: Database Migration

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to migrate'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production

jobs:
  migrate:
    name: Run Database Migration
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run migration
        run: |
          if [ "${{ github.event.inputs.environment }}" = "production" ]; then
            pnpm db:migrate:prod
          else
            pnpm db:migrate:staging
          fi
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

---

## 🚀 Deployment Process

### 1. Production Deployment

#### Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Code review completed
- [ ] Performance benchmarks met
- [ ] Security scan passed
- [ ] Database migrations tested
- [ ] Rollback plan ready

#### Deployment Steps

```bash
# 1. Merge to main branch (triggers deployment)
git checkout main
git merge develop
git push origin main

# 2. Monitor deployment
flyctl status --app kaiwa-v2

# 3. Check health endpoint
curl https://kaiwa-v2.fly.dev/health

# 4. Verify database migration
flyctl ssh console --app kaiwa-v2
pnpm db:migrate:status
```

#### Post-Deployment Verification

- [ ] Health endpoint responding
- [ ] Database connections working
- [ ] External service integrations functional
- [ ] Performance metrics normal
- [ ] Error rates acceptable
- [ ] User feedback positive

### 2. Staging Deployment

#### Staging Process

```bash
# 1. Merge to develop branch
git checkout develop
git merge feature/new-feature
git push origin develop

# 2. Monitor staging deployment
flyctl status --app kaiwa-v2-staging

# 3. Test on staging environment
open https://kaiwa-v2-staging.fly.dev
```

### 3. Feature Branch Deployment

#### Feature Deployment Process

```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Make changes and commit
git add .
git commit -m "feat: add new feature"

# 3. Push and create PR
git push origin feature/new-feature

# 4. PR automatically deploys to feature environment
# 5. Test on feature environment
# 6. Merge to develop when ready
```

---

## 🔧 Environment Management

### 1. Environment-Specific Configurations

#### Production Environment

```typescript
// src/lib/config/environment.ts
export const environment = {
	nodeEnv: process.env.NODE_ENV || 'development',
	port: parseInt(process.env.PORT || '3000'),
	host: process.env.HOST || '0.0.0.0',

	database: {
		url: process.env.DATABASE_URL!,
		directUrl: process.env.DIRECT_URL!
	},

	auth: {
		googleClientId: process.env.GOOGLE_CLIENT_ID!,
		googleClientSecret: process.env.GOOGLE_CLIENT_SECRET!,
		jwtSecret: process.env.JWT_SECRET!
	},

	external: {
		openai: {
			apiKey: process.env.OPENAI_API_KEY!
		},
		stripe: {
			secretKey: process.env.STRIPE_SECRET_KEY!,
			webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!
		}
	},

	monitoring: {
		sentryDsn: process.env.SENTRY_DSN,
		logLevel: process.env.LOG_LEVEL || 'info'
	}
};
```

#### Environment Validation

```typescript
// src/lib/config/validation.ts
import { z } from 'zod';

const environmentSchema = z.object({
	NODE_ENV: z.enum(['development', 'staging', 'production']),
	PORT: z.string().transform(Number),
	DATABASE_URL: z.string().url(),
	DIRECT_URL: z.string().url(),
	GOOGLE_CLIENT_ID: z.string().min(1),
	GOOGLE_CLIENT_SECRET: z.string().min(1),
	JWT_SECRET: z.string().min(32),
	OPENAI_API_KEY: z.string().min(1),
	STRIPE_SECRET_KEY: z.string().min(1),
	STRIPE_WEBHOOK_SECRET: z.string().min(1),
	POSTHOG_API_KEY: z.string().min(1),
	S3_ACCESS_KEY: z.string().min(1),
	S3_SECRET_KEY: z.string().min(1),
	SENTRY_DSN: z.string().url().optional(),
	LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional()
});

export function validateEnvironment() {
	try {
		return environmentSchema.parse(process.env);
	} catch (error) {
		console.error('Environment validation failed:', error);
		process.exit(1);
	}
}
```

### 2. Feature Flags

#### Feature Flag Configuration

```typescript
// src/lib/config/feature-flags.ts
export interface FeatureFlags {
	newConversationUI: boolean;
	advancedAnalytics: boolean;
	realtimeAudio: boolean;
	vocabularyTracking: boolean;
}

export const featureFlags: Record<string, FeatureFlags> = {
	development: {
		newConversationUI: true,
		advancedAnalytics: true,
		realtimeAudio: true,
		vocabularyTracking: true
	},
	staging: {
		newConversationUI: true,
		advancedAnalytics: true,
		realtimeAudio: false,
		vocabularyTracking: true
	},
	production: {
		newConversationUI: false,
		advancedAnalytics: false,
		realtimeAudio: false,
		vocabularyTracking: false
	}
};

export function getFeatureFlags(): FeatureFlags {
	const env = process.env.NODE_ENV || 'development';
	return featureFlags[env] || featureFlags.development;
}
```

---

## 📊 Monitoring & Observability

### 1. Health Checks

#### Health Endpoint

```typescript
// src/routes/api/health/+server.ts
import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';

export async function GET() {
	try {
		// Check database connection
		await db.execute(sql`SELECT 1`);

		// Check external services
		const openaiHealth = await checkOpenAIHealth();
		const stripeHealth = await checkStripeHealth();

		const health = {
			status: 'healthy',
			timestamp: new Date().toISOString(),
			services: {
				database: 'healthy',
				openai: openaiHealth ? 'healthy' : 'unhealthy',
				stripe: stripeHealth ? 'healthy' : 'unhealthy'
			},
			version: process.env.npm_package_version || 'unknown',
			environment: process.env.NODE_ENV || 'development'
		};

		const isHealthy =
			health.services.database === 'healthy' &&
			health.services.openai === 'healthy' &&
			health.services.stripe === 'healthy';

		return json(health, { status: isHealthy ? 200 : 503 });
	} catch (error) {
		return json(
			{
				status: 'unhealthy',
				timestamp: new Date().toISOString(),
				error: error.message
			},
			{ status: 503 }
		);
	}
}
```

### 2. Metrics & Logging

#### Prometheus Metrics

```typescript
// src/lib/monitoring/metrics.ts
import { register, Counter, Histogram, Gauge } from 'prom-client';

// Request metrics
export const httpRequestsTotal = new Counter({
	name: 'http_requests_total',
	help: 'Total number of HTTP requests',
	labelNames: ['method', 'route', 'status']
});

export const httpRequestDuration = new Histogram({
	name: 'http_request_duration_seconds',
	help: 'HTTP request duration in seconds',
	labelNames: ['method', 'route']
});

// Business metrics
export const conversationsStarted = new Counter({
	name: 'conversations_started_total',
	help: 'Total number of conversations started',
	labelNames: ['language', 'mode']
});

export const activeUsers = new Gauge({
	name: 'active_users',
	help: 'Number of currently active users'
});

// Register metrics
register.registerMetric(httpRequestsTotal);
register.registerMetric(httpRequestDuration);
register.registerMetric(conversationsStarted);
register.registerMetric(activeUsers);
```

#### Structured Logging

```typescript
// src/lib/monitoring/logger.ts
import pino from 'pino';

export const logger = pino({
	level: process.env.LOG_LEVEL || 'info',
	formatters: {
		level: (label) => ({ level: label })
	},
	timestamp: pino.stdTimeFunctions.isoTime,
	base: {
		env: process.env.NODE_ENV,
		version: process.env.npm_package_version
	}
});

export function logRequest(req: Request, res: Response, duration: number) {
	logger.info({
		type: 'request',
		method: req.method,
		url: req.url,
		status: res.status,
		duration,
		userAgent: req.headers.get('user-agent'),
		ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip')
	});
}
```

---

## 🚨 Rollback Procedures

### 1. Automatic Rollback

#### Health Check Failure Rollback

```yaml
# .github/workflows/rollback.yml
name: Automatic Rollback

on:
  workflow_run:
    workflows: ['Deploy to Production']
    types: [completed]

jobs:
  rollback-check:
    if: ${{ github.event.workflow_run.conclusion == 'failure' }}
    runs-on: ubuntu-latest

    steps:
      - name: Rollback to previous version
        uses: superfly/flyctl-actions/setup-flyctl@master

      - name: Rollback deployment
        run: flyctl deploy --remote-only --image-label previous

      - name: Notify rollback
        uses: 8398a7/action-slack@v3
        with:
          status: 'rolled_back'
          channel: '#deployments'
          text: 'Production deployment rolled back due to health check failure'
```

### 2. Manual Rollback

#### Manual Rollback Commands

```bash
# List deployment history
flyctl releases list --app kaiwa-v2

# Rollback to specific version
flyctl deploy --remote-only --image-label v1.2.3 --app kaiwa-v2

# Rollback to previous version
flyctl deploy --remote-only --image-label previous --app kaiwa-v2

# Check rollback status
flyctl status --app kaiwa-v2
```

---

## 🔒 Security & Compliance

### 1. Security Headers

#### Security Middleware

```typescript
// src/hooks.server.ts
import { sequence } from '@sveltejs/kit/hooks';

async function securityHeaders({ event, resolve }) {
	const response = await resolve(event);

	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-XSS-Protection', '1; mode=block');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Content-Security-Policy', "default-src 'self'");

	return response;
}

export const handle = sequence(securityHeaders);
```

### 2. Environment Security

#### Secret Rotation

```bash
# Rotate JWT secret
flyctl secrets set JWT_SECRET="new_jwt_secret_$(date +%s)"

# Rotate database credentials
flyctl secrets set DATABASE_URL="new_database_url"

# Rotate API keys
flyctl secrets set OPENAI_API_KEY="new_openai_key"
flyctl secrets set STRIPE_SECRET_KEY="new_stripe_key"
```

---

## 📚 Deployment Scripts

### 1. Deployment Utilities

#### Deploy Script (`scripts/deploy.sh`)

```bash
#!/bin/bash

# deploy.sh - Deploy Kaiwa v2 to specified environment

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
HEALTH_URL="https://$APP_NAME.fly.dev/health"

if curl -f $HEALTH_URL > /dev/null 2>&1; then
  echo "✅ Deployment successful! Health check passed."
  echo "🌐 Your app is available at: https://$APP_NAME.fly.dev"
else
  echo "❌ Health check failed. Deployment may have issues."
  exit 1
fi
```

#### Database Migration Script (`scripts/migrate.sh`)

```bash
#!/bin/bash

# migrate.sh - Run database migrations

set -e

ENVIRONMENT=${1:-staging}

echo "🗄️ Running database migrations for $ENVIRONMENT..."

if [ "$ENVIRONMENT" = "production" ]; then
  echo "⚠️  Running migrations on PRODUCTION database"
  read -p "Are you sure? Type 'yes' to continue: " -r
  if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Migration cancelled."
    exit 1
  fi

  pnpm db:migrate:prod
else
  pnpm db:migrate:staging
fi

echo "✅ Database migrations completed successfully!"
```

---

## 📊 Deployment Metrics

### 1. Key Performance Indicators

#### Deployment Success Rate

- **Target**: &gt; 95%
- **Measurement**: Successful deployments / Total deployments
- **Monitoring**: GitHub Actions workflow success rate

#### Deployment Time

- **Target**: &lt; 10 minutes
- **Measurement**: Time from push to production availability
- **Monitoring**: GitHub Actions workflow duration

#### Rollback Frequency

- **Target**: &lt; 5% of deployments
- **Measurement**: Rollbacks / Total deployments
- **Monitoring**: Automatic and manual rollback events

### 2. Monitoring Dashboard

#### Grafana Dashboard

```yaml
# grafana/dashboards/kaiwa-v2-deployment.json
{
  'dashboard':
    {
      'title': 'Kaiwa v2 Deployment Metrics',
      'panels':
        [
          {
            'title': 'Deployment Success Rate',
            'type': 'stat',
            'targets':
              [
                {
                  'expr': 'rate(github_actions_workflow_success_total[24h])',
                  'legendFormat': 'Success Rate'
                }
              ]
          },
          {
            'title': 'Deployment Duration',
            'type': 'graph',
            'targets':
              [
                {
                  'expr': 'histogram_quantile(0.95, rate(github_actions_workflow_duration_seconds_bucket[24h]))',
                  'legendFormat': '95th Percentile'
                }
              ]
          }
        ]
    }
}
```

---

_This deployment guide ensures reliable, automated deployments with comprehensive monitoring and rollback capabilities for Kaiwa v2._
