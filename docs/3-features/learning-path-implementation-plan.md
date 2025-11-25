# 🚀 Learning Path Templates - Implementation Plan

> **Status**: Planning Phase
> **Based on**: [learning-path-templates.md](./learning-path-templates.md)
> **Branch**: `claude/setup-learning-path-templates-017fCMMFr58Bgss9sNgWBHJ3`

---

## 📋 Overview

This document breaks down the learning path templates feature into **9 small, manageable pull requests**. Each PR is designed to be:

- ✅ **Independent** where possible
- ✅ **Testable** on its own
- ✅ **Reviewable** in under 30 minutes
- ✅ **Deployable** without breaking existing functionality

---

## 🎯 Pull Request Breakdown

### PR #1: Database Schema & Migrations (Foundation)

**Branch**: `feature/learning-paths-schema`
**Estimated Size**: ~200 lines
**Dependencies**: None

**What it includes**:
- Create `learning_paths` table schema
- Create `scenario_generation_queue` table schema
- Create `learning_path_assignments` table schema
- Database migration files
- TypeScript types for new tables

**Files to create**:
- `src/lib/server/db/schema/learning-paths.ts`
- `src/lib/server/db/schema/scenario-generation-queue.ts`
- `src/lib/server/db/schema/learning-path-assignments.ts`
- Update `src/lib/server/db/schema/index.ts`
- Update `src/lib/server/db/types.ts`
- Migration files in `migrations/`

**Acceptance criteria**:
- [ ] All three tables created with proper indexes
- [ ] Foreign key relationships defined
- [ ] Migration runs successfully
- [ ] Types exported and available

**Testing**:
- Run migration against local DB
- Verify tables exist with correct columns
- Test rollback scenario

---

### PR #2: Repository Layer (Data Access)

**Branch**: `feature/learning-paths-repositories`
**Estimated Size**: ~400 lines
**Dependencies**: PR #1 (schema must exist)

**What it includes**:
- Learning path repository with CRUD operations
- Scenario generation queue repository
- Learning path assignments repository
- Export from repository index

**Files to create**:
- `src/lib/server/repositories/learning-path.repository.ts`
- `src/lib/server/repositories/scenario-generation-queue.repository.ts`
- `src/lib/server/repositories/learning-path-assignment.repository.ts`
- Update `src/lib/server/repositories/index.ts`

**Acceptance criteria**:
- [ ] All repository methods implemented
- [ ] Follows existing repository patterns (e.g., `scenario.repository.ts`)
- [ ] Type-safe with proper return types
- [ ] Exports added to index

**Testing**:
- Create simple test script in `scripts/` to verify CRUD operations
- Test each repository method manually

---

### PR #3: Prompt Engineering Service (Pure Logic)

**Branch**: `feature/learning-paths-prompt-service`
**Estimated Size**: ~250 lines
**Dependencies**: None (pure TypeScript)

**What it includes**:
- PromptEngineeringService for syllabus generation
- Support for user preferences-based prompts
- Support for creator brief-based prompts
- Unit tests (optional but recommended)

**Files to create**:
- `src/lib/features/learning-path/` (create directory)
- `src/lib/features/learning-path/services/PromptEngineeringService.ts`
- `src/lib/features/learning-path/types.ts` (for DTOs and interfaces)

**Acceptance criteria**:
- [ ] `buildSyllabusPrompt(userPreferences, preset)` implemented
- [ ] `buildCreatorPathPrompt(brief, options)` implemented
- [ ] Returns well-structured prompt with JSON schema
- [ ] No dependencies on DB or UI (pure function)
- [ ] Comprehensive JSDoc comments

**Testing**:
- Create test script that generates prompts for sample inputs
- Verify prompt quality manually

---

### PR #4: Path Generator Service & API (Core Generation)

**Branch**: `feature/learning-paths-generator`
**Estimated Size**: ~350 lines
**Dependencies**: PR #2 (repositories), PR #3 (prompt service)

**What it includes**:
- PathGeneratorService for orchestrating path creation
- API endpoint for creating paths from user preferences
- API endpoint for creating paths from creator briefs
- Integration with existing OpenAI service

**Files to create**:
- `src/lib/features/learning-path/services/PathGeneratorService.server.ts`
- `src/routes/api/learning-paths/+server.ts` (POST endpoint)
- `src/routes/api/learning-paths/creator/+server.ts` (POST endpoint)

**Acceptance criteria**:
- [ ] `createPathFromPreferences(userId, preferences)` works
- [ ] `createPathFromCreatorBrief(brief, options)` works
- [ ] Paths saved to database with correct structure
- [ ] Queue entries created for scenario generation
- [ ] Proper error handling and logging
- [ ] Auth protection on endpoints

**Testing**:
- Test endpoint with curl/Postman
- Verify database entries created correctly
- Test with various user preference combinations

---

### PR #5: Background Job Infrastructure (Async Generation)

**Branch**: `feature/learning-paths-queue-processor`
**Estimated Size**: ~300 lines
**Dependencies**: PR #2 (repositories), PR #4 (path generator)

**What it includes**:
- Queue processing script for scenario generation
- Cron endpoint for triggering queue processor
- GitHub Actions workflow update
- Integration with existing scenario generation

**Files to create**:
- `scripts/generate-learning-path-scenarios.ts`
- `src/routes/api/cron/generate-scenarios/+server.ts`
- Update `.github/workflows/cron-jobs.yml`
- Add npm script to `package.json`

**Acceptance criteria**:
- [ ] Script processes pending queue items
- [ ] Generates scenarios and links to path
- [ ] Updates queue status (PROCESSING → READY/FAILED)
- [ ] Cron endpoint protected with CRON_SECRET
- [ ] GitHub Action configured to run periodically
- [ ] Proper error handling and retry logic

**Testing**:
- Manually run script locally: `pnpm cron:generate-scenarios`
- Test cron endpoint with curl
- Verify queue items processed correctly

---

### PR #6: Template Publishing Service (PII Protection)

**Branch**: `feature/learning-paths-templates`
**Estimated Size**: ~250 lines
**Dependencies**: PR #2 (repositories)

**What it includes**:
- TemplatePublishingService for creating anonymous templates
- PII scrubbing logic
- API endpoint for sharing/publishing paths
- Share slug generation

**Files to create**:
- `src/lib/features/learning-path/services/TemplatePublishingService.server.ts`
- `src/routes/api/learning-paths/[pathId]/share/+server.ts` (POST endpoint)

**Acceptance criteria**:
- [ ] `createAnonymousTemplate(pathId, userId)` works
- [ ] PII removed from title and description
- [ ] Unique share slug generated
- [ ] Template marked with userId=NULL, isTemplate=TRUE
- [ ] Auth check ensures user owns original path
- [ ] Returns template with share URL

**Testing**:
- Create test path with PII
- Generate template and verify PII removed
- Test share endpoint with various scenarios

---

### PR #7: Public Template Pages & SEO (Frontend)

**Branch**: `feature/learning-paths-public-pages`
**Estimated Size**: ~400 lines
**Dependencies**: PR #2 (repositories), PR #6 (templates)

**What it includes**:
- Public template page route `/program/[slug]`
- JSON-LD helper for Course schema
- SEO-optimized template display
- CTA components for conversion

**Files to create**:
- `src/routes/program/[slug]/+page.server.ts`
- `src/routes/program/[slug]/+page.svelte`
- `src/lib/seo/jsonld.ts` - add `createLearningPathJsonLd`
- `src/lib/features/learning-path/components/PathSyllabus.svelte`
- `src/lib/features/learning-path/components/EnrollCTA.svelte`

**Acceptance criteria**:
- [ ] Public template pages render correctly
- [ ] Shows 4-week syllabus (no private data)
- [ ] JSON-LD Course schema included
- [ ] Strong CTA to sign up/enroll
- [ ] Mobile-responsive design
- [ ] SEO meta tags (title, description, OG tags)

**Testing**:
- Visit `/program/[slug]` for test template
- Verify JSON-LD in page source
- Test on mobile
- Validate with Google Rich Results Test

---

### PR #8: Dashboard Integration & Progress Widget (UX)

**Branch**: `feature/learning-paths-dashboard`
**Estimated Size**: ~350 lines
**Dependencies**: PR #2 (repositories), PR #4 (generator), PR #6 (templates)

**What it includes**:
- LearningPathStore (Svelte 5 runes)
- Dashboard widget showing active paths
- Progress indicators
- "Share this Course" CTA
- Integration with existing user dashboard

**Files to create**:
- `src/lib/features/learning-path/stores/learning-path.store.svelte.ts`
- `src/lib/features/learning-path/components/LearningPathProgress.svelte`
- `src/lib/features/learning-path/components/SharePathButton.svelte`
- Update existing dashboard route to include widget

**Acceptance criteria**:
- [ ] Store fetches user's active paths
- [ ] Shows next scenario status (READY/Generating)
- [ ] Weekly progress visualization
- [ ] Share button creates template
- [ ] Real-time updates when scenarios ready
- [ ] Mobile-responsive

**Testing**:
- Create test path for logged-in user
- Verify widget displays correctly
- Test share button flow
- Verify state updates

---

### PR #9: Assignment & Email Automation (Creator Flow)

**Branch**: `feature/learning-paths-assignments`
**Estimated Size**: ~400 lines
**Dependencies**: PR #2 (repositories), PR #5 (queue processor)

**What it includes**:
- Assignment creation and management
- Daily email automation for assigned paths
- Creator UI for assigning to testers
- Email templates for learning path reminders
- Cron job for daily path emails

**Files to create**:
- `scripts/send-learning-path-emails.ts`
- `src/routes/api/cron/learning-path-emails/+server.ts`
- `src/lib/server/email/learning-path-email.service.ts`
- `src/routes/dev/learning-paths/assign/+page.svelte` (creator UI)
- `src/routes/api/learning-paths/[pathId]/assign/+server.ts`
- Update `.github/workflows/cron-jobs.yml`

**Acceptance criteria**:
- [ ] Creators can assign paths to testers
- [ ] Daily emails sent to assigned users
- [ ] Emails include today's topic and deep link
- [ ] Assignment status tracked
- [ ] Progress updated (currentDayIndex)
- [ ] Public users can enroll in templates
- [ ] Cron job runs daily

**Testing**:
- Assign path to test user
- Run email script manually
- Verify email content and links
- Test enrollment flow for public users

---

## 🔄 Development Workflow

### For Each PR:

1. **Create branch** from main
2. **Implement** the features listed
3. **Test** locally according to acceptance criteria
4. **Commit** with clear message
5. **Push** to GitHub
6. **Create PR** with description linking to this plan
7. **Review** (self-review or team)
8. **Merge** to main
9. **Deploy** to staging/production
10. **Verify** in production

### Branch Naming Convention:

```
feature/learning-paths-[component]
```

### Commit Message Format:

```
feat(learning-paths): [component] - [description]

- Detail 1
- Detail 2

Part of learning path templates implementation (#[issue-number])
```

---

## 🧪 Testing Strategy

### Per PR Testing:

- **Unit tests** for pure functions (PromptEngineeringService)
- **Integration tests** for repositories (CRUD operations)
- **Manual testing** for API endpoints (curl/Postman)
- **UI testing** for components (visual inspection)

### End-to-End Testing (After All PRs):

1. **Creator Flow**:
   - Create path from brief → Review → Publish → Assign to tester
2. **User Flow**:
   - Browse public templates → Enroll → Receive emails → Complete path
3. **SEO Flow**:
   - Public page indexed → JSON-LD validated → Rich results appear

---

## 📊 Progress Tracking

| PR # | Component | Status | Branch | Est. Size | Priority |
|------|-----------|--------|--------|-----------|----------|
| 1 | Database Schema | 🔵 Todo | `feature/learning-paths-schema` | ~200 lines | P0 |
| 2 | Repositories | 🔵 Todo | `feature/learning-paths-repositories` | ~400 lines | P0 |
| 3 | Prompt Service | 🔵 Todo | `feature/learning-paths-prompt-service` | ~250 lines | P0 |
| 4 | Path Generator | 🔵 Todo | `feature/learning-paths-generator` | ~350 lines | P0 |
| 5 | Queue Processor | 🔵 Todo | `feature/learning-paths-queue-processor` | ~300 lines | P0 |
| 6 | Templates | 🔵 Todo | `feature/learning-paths-templates` | ~250 lines | P1 |
| 7 | Public Pages | 🔵 Todo | `feature/learning-paths-public-pages` | ~400 lines | P1 |
| 8 | Dashboard | 🔵 Todo | `feature/learning-paths-dashboard` | ~350 lines | P1 |
| 9 | Assignments | 🔵 Todo | `feature/learning-paths-assignments` | ~400 lines | P2 |

**Legend**:
- 🔵 Todo
- 🟡 In Progress
- 🟢 Done
- 🔴 Blocked

**Priority Levels**:
- **P0**: Core functionality (must have)
- **P1**: Enhanced features (should have)
- **P2**: Nice-to-have (could have)

---

## 🎯 Quick Start Guide

### To start implementing PR #1 (Schema):

```bash
# Create branch
git checkout -b feature/learning-paths-schema

# Create schema files
mkdir -p src/lib/server/db/schema
touch src/lib/server/db/schema/learning-paths.ts
touch src/lib/server/db/schema/scenario-generation-queue.ts
touch src/lib/server/db/schema/learning-path-assignments.ts

# Follow the schema definitions in learning-path-templates.md section 1A
```

### To test schemas locally:

```bash
# Generate migration
pnpm db:generate

# Push to local DB
pnpm db:push

# Verify tables exist
psql $DATABASE_URL -c "\dt"
```

---

## 🚨 Risk Mitigation

### Potential Risks:

1. **Schema changes affecting existing data**
   - Mitigation: New tables only, no changes to existing schemas
   - All new tables start empty

2. **LLM costs for generation**
   - Mitigation: Start with manual testing, add rate limiting
   - Monitor OpenAI usage in dashboard

3. **Email spam concerns**
   - Mitigation: Start with opt-in only
   - Add unsubscribe links
   - Respect email preferences

4. **PII leakage in templates**
   - Mitigation: Manual review of first 10 templates
   - Automated PII detection patterns
   - Template publishing requires explicit user action

---

## 📝 Notes & Decisions

### Architectural Decisions:

- **FSD Structure**: Following Feature-Sliced Design in `/src/lib/features/learning-path/`
- **Repository Pattern**: Consistent with existing `scenario.repository.ts`
- **Cron Jobs**: Using existing GitHub Actions + HTTP endpoints pattern
- **State Management**: Svelte 5 runes in stores (`.svelte.ts`)

### Deferred Features (Post-MVP):

- Real-time progress adaptation
- Advanced analytics dashboard
- Bulk template generation
- A/B testing for templates
- Community-contributed templates

---

## ✅ Definition of Done

A PR is considered "done" when:

- [ ] All acceptance criteria met
- [ ] Code follows existing patterns
- [ ] No TypeScript errors
- [ ] Tested locally (evidence provided)
- [ ] Documentation updated (if needed)
- [ ] Committed with clear messages
- [ ] Deployed to production (if applicable)
- [ ] No regressions in existing features

---

## 🔗 Related Documents

- [Learning Path Templates Spec](./learning-path-templates.md) - Full feature specification
- [Cron Job Architecture](../1-architecture/architecture-cron-jobs.md) - Background job patterns
- [FSD Principles](https://feature-sliced.design/) - Architecture guidelines
- [Database Schema Docs](../1-architecture/database-schema.md) - Schema conventions

---

**Last Updated**: 2025-11-25
**Status**: Ready for implementation
**Next Step**: Start with PR #1 (Database Schema)
