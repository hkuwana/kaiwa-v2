# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=20.9.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="SvelteKit"

# SvelteKit app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="production"
# Configure SvelteKit to bind to all interfaces on port 8080
ENV HOST="0.0.0.0"
ENV PORT="8080"

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
  export GOOGLE_CLOUD_PROJECT_ID="${GOOGLE_CLOUD_PROJECT_ID:-dummy-project-id}" && \
  export GOOGLE_CREDENTIALS_JSON="${GOOGLE_CREDENTIALS_JSON:-{\"type\":\"service_account\",\"project_id\":\"dummy\"}}" && \
  export OPENAI_API_KEY="${OPENAI_API_KEY:-sk-dummy-openai-key}" && \
  export PUBLIC_POSTHOG_KEY="${PUBLIC_POSTHOG_KEY:-phc_dummy_posthog_key}" && \
  export PUBLIC_SUPABASE_ANON_KEY="${PUBLIC_SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy}" && \
  export PUBLIC_SUPABASE_URL="${PUBLIC_SUPABASE_URL:-https://dummy.supabase.co}" && \
  export RESEND_API_KEY="${RESEND_API_KEY:-re_dummy_resend_key}" && \
  export STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY:-sk_test_dummy_stripe_key}" && \
  export SUPABASE_SERVICE_ROLE="${SUPABASE_SERVICE_ROLE:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_service_role}" && \
  pnpm run build'

# Remove development dependencies
RUN pnpm prune --prod


# Final stage for app image
FROM base

# Copy built application
COPY --from=build /app/build /app/build
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/package.json /app

# Expose port 8080
EXPOSE 8080
CMD [ "pnpm", "run", "start" ]