# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Daily Commands (Most Used)

- `pnpm dev` - Start development server
- `pnpm check` - TypeScript type checking
- `pnpm lint` - Run ESLint and Prettier checks
- `fly deploy` - Deploy to production

## Code Style Guidelines

- **IMPORTANT**: Use camelCase for all variables, functions, and file names
- **IMPORTANT**: Use Svelte 5 runes syntax (`$state`, `$derived`, `$effect`)
- Use ES modules (import/export) syntax
- Destructure imports when possible
- Follow existing patterns in components and services

## Critical Gotchas

- **IMPORTANT**: For Fly.io deployment, ALL environment variables must be imported via `env` dynamic imports. Direct variable access doesn't work with SSR setup on Fly.
- Always run `pnpm check` after code changes
- Database schema changes require `pnpm db:generate` before `pnpm db:push`

## Key Files & Utilities

### Core Files
- `src/lib/utils/functional.ts` - Result types, error handling, functional utilities
- `src/lib/utils/security.ts` - Security utilities and validation
- `src/lib/server/db/schema/index.ts` - Database schema definitions
- `src/lib/services/index.ts` - Client-side service exports

### Services Architecture
- **Server Services**: `src/lib/server/services/` - Business logic (auth, payments, OpenAI)
- **Client Services**: `src/lib/services/` - Frontend services (audio, conversation, analytics)
- **Repositories**: `src/lib/server/repositories/` - Data access layer

### Data & Configuration
- `src/lib/data/scenarios.ts` - Learning scenarios
- `src/lib/data/languages.ts` - Language definitions
- `src/lib/enums.ts` - Application enums

## All Available Commands

### Development
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm start` - Start production server
- `pnpm check:watch` - Watch mode type checking
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

## Repository Etiquette (Future Team Guidelines)

### Code Reviews

- Test changes locally with `pnpm check && pnpm lint && pnpm test:unit`
- Ensure TypeScript has no errors before submitting PRs
- Test database migrations in development environment

### Commit Standards

- Use conventional commits (feat:, fix:, docs:, refactor:)
- Include affected areas in commit messages (e.g., "feat(auth): add OAuth flow")
- Test deployment-critical changes with `fly deploy` in staging first

### Branch Strategy

- Use feature branches for new development
- Keep PRs focused and small when possible
- Always ensure CI passes before merging

### Documentation Standards

- **All new markdown files** should be created in `src/lib/docs/`
- **File naming**: Follow the convention in `src/lib/docs/DOCUMENTATION_STATUS.md`
  - Core documents: `core_*.md`
  - Feature documents: `feature_*.md`
  - Development guides: `*_guide.md` or `*_strategy.md`
  - Status documents: `*_status.md`
- **Content standards**: Use clear headings with emojis, include working code examples, keep concise
- **Markdown formatting**: Use consistent formatting, include table of contents for long documents
- **Update `DOCUMENTATION_STATUS.md`** when adding new documentation files
