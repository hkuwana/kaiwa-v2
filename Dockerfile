# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=20.19.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="SvelteKit"

# SvelteKit app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="production"
# Configure SvelteKit to bind to all interfaces on port 8080
ENV HOST="0.0.0.0"
ENV PORT="3000"

# Install pnpm
ARG PNPM_VERSION=9.15.0
RUN npm install -g pnpm@$PNPM_VERSION

# Throw-away build stage to reduce size of final image
FROM base AS build

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential git node-gyp pkg-config python-is-python3

# Install node modules
COPY .npmrc package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod=false

# Copy application code
COPY . .

# Build application with dummy variables as fallbacks
ARG ALL_SECRETS
RUN --mount=type=secret,id=ALL_SECRETS \
  sh -c 'if [ -f /run/secrets/ALL_SECRETS ]; then eval "$(base64 -d /run/secrets/ALL_SECRETS)"; fi && \
  export DATABASE_URL="${DATABASE_URL:-postgresql://dummy:dummy@localhost:5432/dummy}" && \
  export GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID:-dummy-google-client-id}" && \
  export GOOGLE_CLIENT_SECRET="${GOOGLE_CLIENT_SECRET:-dummy-google-client-secret}" && \
  export OPENAI_API_KEY="${OPENAI_API_KEY:-sk-dummy-openai-key}" && \
  export PUBLIC_POSTHOG_KEY="${PUBLIC_POSTHOG_KEY:-phc_dummy_posthog_key}" && \
  export PUBLIC_OPEN_AI_MODEL="${PUBLIC_OPEN_AI_MODEL:-gpt-4o-realtime-preview-2024-10-01}" && \
  export STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY:-sk_test_dummy_stripe_key}" && \
  export STRIPE_WEBHOOK_SECRET="${STRIPE_WEBHOOK_SECRET:-whsec_dummy_webhook_secret}" && \
  export STRIPE_PRO_PRICE_ID="${STRIPE_PRO_PRICE_ID:-price_dummy_pro}" && \
  export STRIPE_PREMIUM_PRICE_ID="${STRIPE_PREMIUM_PRICE_ID:-price_dummy_premium}" && \
  pnpm run build'

# Final stage for app image
FROM base

# Copy the entire built application - SvelteKit needs access to all dependencies at runtime
COPY --from=build /app /app

# Clean pnpm cache to reduce image size but keep node_modules intact
RUN pnpm store prune && rm -rf /root/.pnpm-store

# Expose port 8080
EXPOSE 3000

# Add debugging to see what's happening
RUN echo "Contents of .svelte-kit/output:" && ls -la .svelte-kit/output/ || echo "No output dir"
RUN echo "Contents of build dir:" && ls -la build/ || echo "No build dir"
RUN echo "Package.json start script:" && cat package.json | grep -A1 -B1 '"start"' || true
RUN echo "Svelte config:" && cat svelte.config.js | head -10 || true

# In your Dockerfile, change the CMD to:
  CMD [ "pnpm", "run", "start" ]