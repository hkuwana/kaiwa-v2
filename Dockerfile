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

# Build application
RUN pnpm run build

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

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

CMD [ "pnpm", "run", "start" ]