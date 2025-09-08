# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm start` - Start production server

### Code Quality

- `pnpm check` - TypeScript type checking
- `pnpm check:watch` - Watch mode type checking
- `pnpm lint` - Run ESLint and Prettier checks
- `pnpm format` - Format code with Prettier

### Testing

- `pnpm test:unit` - Run unit tests with Vitest
- `pnpm test:unit:watch` - Watch mode unit tests
- `pnpm test:e2e` - Run Playwright e2e tests
- `pnpm test:e2e:headed` - Run e2e tests with browser UI
- `pnpm test:e2e:debug` - Debug e2e tests
- `pnpm test` - Run all tests (unit + e2e)
- `pnpm smoke:test` - Run smoke tests
- `pnpm ci` - Full CI pipeline (lint + check + test + build)

### Database Management

- `pnpm db:start` - Start PostgreSQL with Docker Compose
- `pnpm db:push` - Push schema changes to database
- `pnpm db:generate` - Generate Drizzle migrations
- `pnpm db:migrate` - Run migrations
- `pnpm db:studio` - Open Drizzle Studio
- `pnpm db:seed:dev` - Seed development database
- `pnpm db:nuke:dev` - Clear development database

## Architecture Overview

### Framework & Core Technologies

- **SvelteKit** with TypeScript for full-stack web application
- **Drizzle ORM** with PostgreSQL for database management
- **Tailwind CSS** + **DaisyUI** for styling
- **Playwright** for e2e testing, **Vitest** for unit tests
- **Paraglide** for internationalization

### Key Application Structure

#### Database Layer (`src/lib/server/`)

- **Schema**: Database schema definitions in `db/schema/` (with v2 migration structure)
- **Repositories**: Data access layer following repository pattern
- **Auth**: OAuth integration with Google, session management
- **Services**: Business logic services (analytics, user management)

#### API Layer (`src/routes/api/`)

- **Audio Processing**: `/api/audio/transcribe`, `/api/audio/tts`
- **Chat**: `/api/chat` for AI conversation responses
- **Realtime**: `/api/realtime-session/` for WebSocket-like real-time features
- **Stripe**: Payment processing endpoints

#### Frontend Architecture (`src/lib/`)

- **Services**: Client-side services for audio, conversation, real-time communication
- **Components**: Reusable Svelte components for conversation UI
- **Stores**: Svelte 5 runes-based state management
- **Utils**: Utility functions and type definitions

#### Core Features

- **Conversation Practice**: AI-powered language learning conversations
- **Audio Processing**: Speech-to-text, text-to-speech, real-time audio
- **Scenarios**: Structured learning scenarios with progress tracking
- **User Management**: Authentication, preferences, usage tracking
- **Payment System**: Stripe integration for subscriptions

### Environment Requirements

- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - For AI chat and audio processing
- Google OAuth credentials for authentication
- Stripe keys for payment processing

### Development Patterns

- Repository pattern for data access
- Service layer for business logic
- TypeScript throughout with strict type checking
- Functional programming utilities in `utils/functional.ts`
- Security utilities in `utils/security.ts`

### Testing Strategy

- Unit tests for services and utilities
- E2E tests for user flows with Playwright
- Smoke tests for production monitoring
- Authentication-specific test commands available
