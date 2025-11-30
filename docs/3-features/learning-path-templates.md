# 📚 Learning Path Templates & SEO Loop

> **Quick Summary**: End-to-end plan to turn user scenarios into 4-week learning paths, generate anonymous templates, and ship SEO-friendly public pages — all aligned with the 3-layer architecture and Feature-Sliced Design (FSD).

---

## 🎯 End Goal & Success Criteria

### Product Outcomes

- **SEO Loop**
  - End state: Thousands of indexed, high-quality, anonymous **Learning Path Templates** for long-tail queries.
  - MVP: **100 public templates** indexed, with at least one fully generated 4-week path available for public viewing.
- **Customization**
  - End state: Paths adapt based on **real-time user performance**.
  - MVP: Custom path generation driven **only** by `userPreferences` (level, goals, occupation, relationship context).
- **Monetization**
  - End state: Personalized paths drive upgrades and recurring usage.
  - MVP: Strong CTA on public templates → sign-up/paywall page for full access.

### Architectural Constraints

- Respect the existing **UI → Store → Service** layering.
- Implement new logic inside a **feature slice**: `src/lib/features/learning-path/`.
- Use the existing **Drizzle** setup in `src/lib/server/db/schema` and repositories in `src/lib/server/repositories`.
- Reuse the existing **cron job architecture** described in `docs/1-core/cron-jobs.md`.

---

## 🏗 High-Level Architecture

### Core Concepts

- **Learning Path**: 4-week plan (e.g., 20–28 days) with a daily scenario, theme, and difficulty progression.
- **Template**: An anonymized, public version of a user’s learning path; no PII, no conversation logs.
- **Scenario Generation Queue**: Background jobs for generating and refreshing scenarios associated with each path.

### FSD Placement

```text
src/lib/
├── features/
│   └── learning-path/
│       ├── components/           # UI for dashboards & public templates
│       ├── stores/               # LearningPathStore (user-facing orchestration)
│       └── services/
│           ├── PromptEngineeringService.ts
│           ├── PathGeneratorService.server.ts
│           └── TemplatePublishingService.server.ts
│
└── server/
    ├── db/
    │   ├── schema/               # learning-paths, scenario-generation-queue
    │   └── types.ts
    └── repositories/
        ├── learning-path.repository.ts
        └── scenario-generation-queue.repository.ts
```

---

## Phase 1: Data Model & Customization Core (1–2 pushes)

### 1A. Data Model — Learning Paths & Queue

**Goal**: Represent learning paths and queue background generation without touching existing scenario logic.

**Tables (Drizzle, new files under `src/lib/server/db/schema/`):**

1. **`learning_paths`**
   - Purpose: Store a 4-week path definition plus metadata.
   - Suggested schema (conceptual):
     - `id`: `text` — slug/ID, primary key (e.g. `jp-meet-parents-four-week-path`).
     - `userId`: `uuid` (nullable) — FK to `users.id`. `NULL` when template is public/anonymous.
     - `title`: `text` — human-readable title, scrubbed when template.
     - `description`: `text` — summary, scrubbed when template.
     - `schedule`: `jsonb` — ordered array of day entries:
       - `dayIndex`: number (1–28)
       - `scenarioId` (optional): string, once generated
       - `theme`: string
       - `difficulty`: string / CEFR label
     - `isTemplate`: `boolean` — whether this is a template (copied/scrubbed).
     - `isPublic`: `boolean` — eligible for SEO indexing.
     - `shareSlug`: `text` (optional) — public slug for `/program/[slug]`.
     - `createdAt`, `updatedAt`: timestamps.

2. **`scenario_generation_queue`**
   - Purpose: Schedule per-day scenario generation so we can pre-generate or JIT generate content.
   - Suggested schema:
     - `id`: `uuid` — primary key.
     - `pathId`: `text` — FK to `learning_paths.id`.
     - `dayIndex`: `integer` — 1..N, aligns with `schedule` array.
     - `targetGenerationDate`: `timestamp` — when we want content ready (user timezone-aware at application layer).
     - `status`: enum as `text` — `PENDING | PROCESSING | READY | FAILED`.
     - `lastError`: `text` (nullable) — last failure description for debugging.
     - `createdAt`, `updatedAt`: timestamps.

3. **`learning_path_assignments`** (for testers & future cohorts)
   - Purpose: Track which users are following which path, without copying the path itself.
   - Suggested schema:
     - `id`: `uuid` — primary key.
     - `pathId`: `text` — FK to `learning_paths.id` (template or user-specific).
     - `userId`: `uuid` — FK to `users.id` (tester or regular user).
     - `role`: `text` — e.g. `tester | learner`.
     - `status`: `text` — `INVITED | ACTIVE | COMPLETED | ARCHIVED`.
     - `startsAt`: `timestamp` — when the course should start for this user.
     - `currentDayIndex`: `integer` — optional denormalized progress.
     - `createdAt`, `updatedAt`: timestamps.

**Repositories (`src/lib/server/repositories`):**

- `learning-path.repository.ts`
  - `createPathForUser(userId, input): Promise<LearningPath>`
  - `findPathById(pathId): Promise<LearningPath | undefined>`
  - `findPublicTemplateBySlug(slug): Promise<LearningPath | undefined>`
  - `listPublicTemplates(pagination): Promise<LearningPath[]>`
  - `updatePathSchedule(pathId, schedule)`
  - `markPathAsTemplate(pathId)`
  - `publishTemplate(pathId, slug)`

- `scenario-generation-queue.repository.ts`
  - `enqueueDay(pathId, dayIndex, targetDate)`
  - `enqueuePathRange(pathId, days: number[])`
  - `getPendingJobs(limit, windowStart, windowEnd)`
  - `markJobProcessing(jobId)`
  - `markJobReady(jobId, scenarioId)`
  - `markJobFailed(jobId, error)`

- `learning-path-assignment.repository.ts`
  - `createAssignment(pathId, userId, role, startsAt)`
  - `listAssignmentsForUser(userId)`
  - `getActiveAssignmentsForPath(pathId)`
  - `updateAssignmentStatus(assignmentId, status)`

> **Note**: Keep these repositories thin wrappers around Drizzle queries to stay consistent with existing patterns (e.g., `scenario.repository.ts`).

---

### 1B. `PromptEngineeringService` (FSD Service Layer)

**Location**: `src/lib/features/learning-path/services/PromptEngineeringService.ts`

**Responsibility**: Given `userPreferences` and any path metadata, output a **single, high-quality prompt** to generate:

- A 4-week syllabus (list of days, themes, difficulty ladder).
- Optional additional metadata (emotional stakes, persona, etc.).

**Inputs**:

- `userPreferences` from existing table (`user-preferences.ts` and repository).
  - Level (CEFR), target language, goals, relationship/heritage context.
- Optional `pathPreset` (e.g. “Meet the Parents (JP) 4-week”).

**Outputs**:

- `buildSyllabusPrompt(userPreferences, preset): PromptPayload`
  - String + structured instructions for the LLM.
  - Possibly a `targetSchema` definition for structured JSON output.

**Design Notes**:

- Treat this as **core IP** — pure TypeScript, no DB or network.
- Unit-testable: given inputs → prompt string + expected format.
- No Svelte imports; no direct coupling to UI or stores.

---

### 1C. `PathGeneratorService.server.ts` (Synchronous Orchestration)

**Location**: `src/lib/features/learning-path/services/PathGeneratorService.server.ts`

**Responsibility**: Orchestrate the initial path creation when user clicks “Create 4-week plan”.

**Flow (server-side)**:

1. **Read context**
   - Fetch `userPreferences` via repository.
2. **Generate syllabus**
   - Call `PromptEngineeringService.buildSyllabusPrompt(...)`.
   - Call LLM once (existing OpenAI integration) to generate syllabus JSON.
3. **Persist learning path**
   - Insert into `learning_paths` with `userId`, `title`, `description`, and `schedule` (day objects, no scenarios yet).
4. **Enqueue daily generation**
   - For each day (1..N), insert `PENDING` rows into `scenario_generation_queue` with appropriate `targetGenerationDate`.
5. **Return DTO to Store**
   - Lightweight DTO with path ID, high-level syllabus, and first-day status.

**UI/Store Integration (high level)**:

- **Store**: `LearningPathStore` in `src/lib/features/learning-path/stores/learning-path.store.svelte`.
  - Exposes `createPathFromPreferences()` which calls a server endpoint.
- **Endpoint**: e.g. `src/routes/api/learning-paths/+server.ts`.
  - Calls `PathGeneratorService.server.ts`.

---

### 1D. Creator-Authored Custom Paths (Manual Scenario → 30-Day Course)

In addition to auto-generating paths from `userPreferences`, support a **creator workflow**:

1. You (as creator) type a **custom scenario brief**:
   - Example: “30-day course for Japanese partner’s parents who are skeptical of the relationship; focus on dinner conversation, small talk, and respectful disagreement.”
2. GPT generates the structure of a **30-day course** (titles, themes, progression).
3. You review and edit the syllabus before it’s assigned or made public.

**Implementation sketch:**

- Extend `PromptEngineeringService`:
  - Add `buildCreatorPathPrompt(brief, options)` that:
    - Takes a long-form text brief + target language, duration (e.g. 30 days), difficulty envelope.
    - Outputs a prompt that yields a 30-day syllabus JSON structure.
- Extend `PathGeneratorService.server.ts`:
  - Add `createPathFromCreatorBrief({ brief, options, createdByUserId })`:
    1. Call `PromptEngineeringService.buildCreatorPathPrompt`.
    2. Call LLM for a 30-day syllabus.
    3. Persist a `learning_paths` row with:
       - `schedule` pre-filled for 30 days (no `scenarioId` yet).
       - `createdByUserId` (optionally add this field) set to you.
       - `status = 'DRAFT'` (add a `status` column: `DRAFT | ACTIVE | ARCHIVED`).
    4. **Do not enqueue** scenario generation yet.
- Creator UI (admin-only, e.g. `src/routes/dev/learning-paths/+page.svelte`):
  - Simple form: `{ brief, targetLanguage, days=30 }`.
  - Shows generated syllabus and allows inline editing (titles, themes, order).
  - “Save draft” vs “Publish & generate” buttons.

Once you click **Publish & generate**:

1. Update `learning_paths.status` → `ACTIVE`.
2. Enqueue all days into `scenario_generation_queue` (or just the first N days).
3. Optionally auto-create a template slug so it’s ready to be published later.

---

## Phase 2: Async Generation & PII Protection (2–3 pushes)

### 2A. Background Job Handler

**Goal**: Reuse the existing cron + HTTP endpoint pattern to process the `scenario_generation_queue`.

**Architecture**:

- **Script**: `scripts/generate-scenarios.ts`
  - Fetches pending jobs from `scenario-generation-queue.repository.ts`.
  - For each job:
    - Marks `PROCESSING`.
    - Calls an LLM to generate a scenario based on:
      - Path context (user goals + theme for that day).
      - Previous scenarios (optional for continuity).
    - Writes a new scenario to `scenarios` table (via `scenario.repository`).
    - Updates `learning_paths.schedule[dayIndex]` with `scenarioId`.
    - Marks job `READY` or `FAILED`.

- **Endpoint**: `src/routes/api/cron/generate-scenarios/+server.ts`
  - Auth: protect with the same `CRON_SECRET` pattern as existing cron endpoints.
  - Body: optional `windowStart/windowEnd` override for debugging.
  - Calls the script function.

- **GitHub Actions**:
  - Extend `.github/workflows/cron-jobs.yml` to call `/api/cron/generate-scenarios?secret=...`.
  - See `docs/1-core/cron-jobs.md` for exact pattern.

---

### 2B. PII Gate — Anonymous Template Creation

**Goal**: Make templates public **only** when they’re scrubbed of PII and detached from any specific user.

**Service/Repository Design**:

- Add a dedicated service:
  - `TemplatePublishingService.server.ts` in `src/lib/features/learning-path/services/`.
  - Exposed server-side function: `createAnonymousTemplate(pathId, userId)`.

**Steps**:

1. Fetch `learning_paths` row for `(pathId, userId)` ensuring ownership.
2. Duplicate row with:
   - `userId = NULL`.
   - `isTemplate = TRUE`.
   - `isPublic = FALSE` (until reviewed/published).
3. Scrub PII:
   - Replace `title` and `description` with neutral, non-identifying copy.
   - Optionally scrub any PII-like data embedded in `schedule` (e.g., specific locations, names) via a small heuristic or an LLM “scrubber” call.
4. Generate `shareSlug` for SEO-friendly URLs, e.g.:
   - `jp-meet-parents-4-week-path`
5. Persist and return new path ID.

**Dashboard Trigger**:

- From the user’s internal path view, add **“Share this Course”**:
  - Calls API: `POST /api/learning-paths/{pathId}/share`.
  - API calls `TemplatePublishingService.createAnonymousTemplate`.

---

### 2C. Nightly Scheduler — Queue Prefetching

**Goal**: Always have the user’s **next day** ready and keep templates fresh.

**Flow**:

1. Daily cron endpoint: `src/routes/api/cron/schedule-path-generation/+server.ts`.
2. Script logic:
   - For each active learning path:
     - Find days whose `targetGenerationDate` is within the next **48 hours**.
     - Enqueue or re-enqueue jobs in `scenario_generation_queue` as necessary.
3. The actual heavy work is done by `generate-scenarios` endpoint in 2A.

> This mirrors the existing pattern for email reminders: GitHub Action → HTTP endpoint → script → services.

---

## Phase 3: SEO Hook & UX (2 pushes)

### 3A. Public Learning Path Template Page (`/program/[slug]`)

**Goal**: SEO-first landing page that exposes the syllabus, not the private conversation history.

**Routing**:

- New directory: `src/routes/program/[slug]/+page.svelte` (+ optional `+page.server.ts`).
- Data source: `learning-path.repository.findPublicTemplateBySlug(slug)`.

**Rules**:

- Show:
  - Title and description (scrubbed).
  - 4-week syllabus: day-by-day topics, difficulty, approximate time.
  - Benefits and emotional outcomes (copy aligned with `marketing.md`).
  - Strong CTA: “Practice this course in Kaiwa” → auth/paywall.
- Do **not** show:
  - Any conversation transcripts.
  - User-specific notes or ratings.

**FSD Alignment**:

- `program/[slug]/+page.server.ts` → calls repository + Template DTO mapper.
- `program/[slug]/+page.svelte` → purely presentational (syllabus, CTAs, JSON-LD block).

---

### 3B. Internal Progress View & Conversion CTA

**Dashboard Integration**:

- Add a learning path widget (e.g. `LearningPathProgress` component) to the user’s dashboard, using:
  - `learning_paths` + `scenario_generation_queue` to show:
    - Next scenario status: **READY** / _Generating…_.
    - Overall weekly progress.
  - CTA: **“Share this Course”** → kicks off the PII-safe template creation.

**Store & Service**:

- `LearningPathStore` should:
  - Fetch active paths and queue statuses for the current user.
  - Expose `sharePath(pathId)` → calls template publishing API.
  - Expose derived fields: `nextScenarioStatus`, `isTemplateAvailable`, etc.

---

### 3C. Assigning Paths to Early Testers & Email Automation

To support your workflow of designing a custom course, assigning it to an early tester, and automatically guiding them by email:

**Assignment Flow (Creator → Tester):**

1. You finish reviewing a draft path and click **“Assign to tester”**.
2. The app:
   - Creates a `learning_path_assignments` row with:
     - `pathId` = the curated path (draft or template).
     - `userId` = tester’s ID.
     - `role = 'tester'`.
     - `startsAt` = now or a chosen date.
     - `status = 'ACTIVE'`.
   - Optionally generates a **unique invite link** for the tester (e.g. `/program/[slug]?assignmentId=…`).
3. Tester visits their dashboard or the invite link and sees:
   - “You’re enrolled in: [Course Name]”
   - Next scenario status from `scenario_generation_queue`.

**Email Automation for Paths (built on existing cron/email architecture):**

- New script: `scripts/send-learning-path-emails.ts`
  - For each `learning_path_assignments` row where:
    - `status = 'ACTIVE'`.
    - Today’s date >= `startsAt`.
  - Look up:
    - Current `dayIndex` for the assignment.
    - Corresponding `schedule` entry in `learning_paths`.
    - Matching scenario (if `scenarioId` already generated).
  - Send a daily email (via existing email service) with:
    - Today’s topic and why it matters.
    - Deep link: `/conversation?scenario=<scenarioId>&pathId=<pathId>&day=<dayIndex>`.
  - Update `currentDayIndex` or mark the day as “emailed”.
- Trigger:
  - Add a new cron entry (Fly IO machine or existing pattern) that runs once per day.
  - Optional: reuse/remix existing reminder logic from `feature-email-reminder-setup.md`.

**Public vs Assigned Access:**

- **Assigned testers**:
  - Use `learning_path_assignments` and the daily email flow.
  - Have a personalized view on their dashboard with progress.
- **Public visitors**:
  - `/program/[slug]` uses the **template** path (`isTemplate = TRUE`, `isPublic = TRUE`).
  - From this page:
    - Guests can “Try this as a one-off” (guest session, no saved progress).
    - Logged-in users can “Enroll in this course”:
      - Creates a `learning_path_assignments` row with `role = 'learner'`.
      - Optionally asks them to opt in to emails, then plugs them into the same daily email flow as testers.

---

## 🧩 JSON-LD for SEO, AEO, and GEO

This feature is a **natural candidate** for structured data that helps:

- **SEO**: Rich snippets and better ranking for “4-week Japanese conversation course”, etc.
- **AEO** (Answer Engine Optimization): Clear, machine-readable summaries of what each path teaches.
- **GEO** (Generative Engine Optimization): Better grounding for AI assistants that index your content.

### Helper Placement & Pattern

To stay consistent with the rest of the app:

- Keep all JSON-LD builders in `src/lib/seo/jsonld.ts`.
- Follow the same pattern already used for:
  - Home: `createHomePageJsonLd(baseUrl)`
  - Docs: `createDocsIndexJsonLd(...)`, `createDocsArticleJsonLd(...)`
  - Blog: `createBlogIndexJsonLd(baseUrl)`

For learning paths, add a dedicated helper:

- `createLearningPathJsonLd(path: LearningPath, baseUrl: string)`
  - Returns a `Course`-shaped JSON-LD object for `/program/[slug]`.
  - Uses `path.title`, `path.description`, `path.shareSlug`, `path.schedule`, and `targetLanguage` to derive fields like `name`, `description`, `url`, `inLanguage`, `about`, and `courseWorkload`.

**Route integration pattern (mirrors docs/blog):**

1. In `src/routes/program/[slug]/+page.server.ts`:
   - Load the template via the repository.
   - Build JSON-LD: `const jsonLd = createLearningPathJsonLd(path, url.origin);`
   - Return it from `load`: `return { path, jsonLd, ... }`.
2. In `src/routes/program/[slug]/+page.svelte`:
   - Read `const { data } = $props();`.
   - In `<svelte:head>`, inject:

     ```svelte
     {#if data.jsonLd}
     	<script type="application/ld+json">
       {@html JSON.stringify(data.jsonLd)}
     	</script>
     {/if}
     ```

This keeps all structured data logic centralized while giving `/program/[slug]` the same ergonomics as `/docs` and `/blog`.

### JSON-LD Shape for Learning Path Templates

Use `Course` or `HowTo` depending on tone; **Course** usually fits better:

```html
<script type="application/ld+json">
	{
		"@context": "https://schema.org",
		"@type": "Course",
		"name": "4-Week Japanese 'Meet the Parents' Path",
		"description": "A 4-week curriculum to prepare for meeting your partner's Japanese parents, focusing on dinner conversation, small talk, and polite compliments.",
		"provider": {
			"@type": "Organization",
			"name": "Kaiwa",
			"url": "https://trykaiwa.com"
		},
		"hasCourseInstance": {
			"@type": "CourseInstance",
			"courseMode": "online",
			"courseWorkload": "PT20M",
			"url": "https://trykaiwa.com/program/jp-meet-parents-four-week-path"
		},
		"inLanguage": "ja",
		"about": [
			"meeting partner's parents",
			"family dinner in Japanese",
			"Japanese relationship conversations"
		]
	}
</script>
```

> Generate this server-side (in `+page.server.ts`) so it’s tailored per template: use `title`, `description`, `language`, and structured `schedule` to derive `about` and `courseWorkload`.

### JSON-LD in Docs & Blog (for context)

The JSON-LD pattern for learning paths should mirror what already exists elsewhere:

- `/docs` index and articles:
  - Use `createDocsIndexJsonLd` and `createDocsArticleJsonLd` in `src/lib/seo/jsonld.ts`.
  - Inject via a `jsonLd` field returned from `+page.ts` into `<svelte:head>` in `+page.svelte`.
- `/blog` index and posts:
  - Use `createBlogIndexJsonLd` and `createBlogJsonLd` (blog utils).
  - Inject via `jsonLd` in the same way.

**AEO & GEO Impact**:

- Clear `@type`, `about`, and `inLanguage` help:
  - Voice assistants and AI search (AEO) select your template as a direct answer for “4-week Japanese meet the parents course”.
  - Generative engines (GEO) ground responses in your real syllabus instead of hallucinating curricula.

---

## ✅ Implementation Checklist

**Phase 1**

- [ ] Add `learning_paths` + `scenario_generation_queue` schema and repositories.
- [ ] Implement `PromptEngineeringService` (pure TS).
- [ ] Implement `PathGeneratorService.server.ts` and API endpoint.

**Phase 2**

- [ ] Add queue processing script + cron endpoint for scenario generation.
- [ ] Implement `TemplatePublishingService` with PII scrubbing.
- [ ] Add nightly scheduler endpoint to warm upcoming days.

**Phase 3**

- [ ] Create `program/[slug]` route for public templates (syllabus-only).
- [ ] Add dashboard learning path widget + “Share this Course” CTA.
- [ ] Inject JSON-LD on public template pages and, optionally, key docs/blog posts.

Once these are in place, you’ll have a **closed loop**: real user behavior → anonymized learning paths → SEO content → new users → more paths — all with PII safety and a clean FSD-aligned architecture.
