# Custom Scenario Mode - Product & Engineering Notes

## Why

- Learners want to rehearse very specific conversations beyond the curated scenario catalog.
- A constrained "sandbox" keeps fast iteration without building a full tutor authoring suite.
- Paid tier differentiation: free users can pin up to 3 custom scenarios, paid users get unlimited saved scenarios.

## MVP Experience

1. **Entry point**: Scenario selector gains `Create your own` tile pinned to the bottom (available for both roleplay and tutor modes).
2. **Authoring sheet**:
   - Learner describes the situation in free text and picks desired mode (roleplay or tutor).
   - Lightweight GPT call returns a pre-filled JSON payload (title, description, persona, instructions, goals, parameter hints).
   - Learner can edit any generated field before saving.
3. **Preview & test**: Generate a sample opener using existing instructions composer; let the learner iterate before saving.
4. **Save / Pin limits**:
   - Free tier: up to 3 total saved scenarios regardless of privacy; only 3 private slots become available after upgrade.
   - Paid tier: unlimited saved scenarios, but private scenarios beyond the first 3 require the paid plan.
5. **Re-entry**: Custom scenarios show alongside curated ones with `Custom` badge; drag-sort preferred order.
6. **Upgrade CTA**: Hitting the free limit opens an upgrade modal; optional follow-up email can come later.

## Core Architecture Alignment

- **UI layer**: Extend `ScenarioSelector.svelte` with a `CreateCustomScenario` tile and modal (`src/lib/features/scenarios/components`). Add a lightweight editor component that binds to the generated JSON fields.
- **Store layer**: Enhance `scenario.store.svelte.ts` to load user-authored scenarios, track limits, and persist selections. Introduce a dedicated `$lib/stores/custom-scenarios.store.svelte.ts` for list management and API coordination.
- **Service layer**:
  - Client: new `user-scenarios.service.ts` under `src/lib/services/scenarios/` handling REST calls, GPT authoring request, and schema validation.
  - Server: extend `scenario.repository.ts` plus a coordinating `user-scenarios.server.ts` service that owns CRUD logic and tier enforcement.
- **Instruction pipeline**: `composer.ts` already accepts full `Scenario` records; ensure GPT output conforms so existing composition logic continues to work without branching.
- **Data access**: Reuse Drizzle patterns from `_lib/server/db/schema/scenarios.ts`; extend the existing table with ownership + visibility fields and wire new enums/types in `db/types.ts`.

## Data Model

- Extend `Scenario` table with ownership metadata:
  ```
  id (text) | created_by_user_id (uuid nullable) | title | description | role |
  difficulty | difficulty_rating (int) | cefr_recommendation | cefr_level |
  learning_goal | instructions | context | expected_outcome |
  learning_objectives (json) | comfort_indicators (json) | persona (json) |
  visibility (public/private) | usage_count | is_active | created_at | updated_at
  ```
- Add `tier_max_custom_scenarios` to pricing metadata (reuse `tiers.ts`).
- Cache rendered instruction payload for faster session start (optional).

## Enforcement

- On save: check current count vs allowed limit (falls back to 3).
- On downgrade: flag over-limit scenarios but keep them soft-disabled until user deletes or re-upgrades.
- Scenario selector store filters by ownership and active flag.

## Instruction Composer Integration

- GPT authoring response already matches the existing instruction schema; feed directly into `composer.ts`.
- Allow overriding: persona prompt + CEFR recommendation (difficulty auto-derives from CEFR band).
- Validate lengths and sanitize user-provided text (strip HTML, limit markdown).

## API Surface

- `POST /api/user-scenarios/author` → body: `{ description, mode, languageId? }`; returns draft JSON from GPT plus validation errors if any.
- `POST /api/user-scenarios` → create scenario (enforces tier limits, visibility defaults to public).
- `GET /api/user-scenarios` → list scenarios for current user (supports `visibility` filter, pagination for future growth).
- `PATCH /api/user-scenarios/:id` → update fields or toggle visibility (ensures privacy quota for free tier).
- `DELETE /api/user-scenarios/:id` → soft delete (marks `is_active = false`).
- `POST /api/user-scenarios/:id/duplicate` (optional stretch) → duplicate template quickly.
- All endpoints emit PostHog events (`custom_scenario_created`, `custom_scenario_launched`, `custom_scenario_privacy_toggled`).

## Analytics & Safety

- Track scenario creation count and launch count via PostHog (event naming TBD).
- Track completion rate, hint usage, conversation sentiment for user-authored content.
- Add abuse guardrails: rely on GPT prompt instructions to filter obvious policy violations, rate-limit creation, basic forbidden prompt list, and report button inside session header.

## Future Enhancements

- Templates library (start from “Doctor visit”, “Interview”, etc.).
- Collaborative scenarios shared with friends or tutors.
- Auto-suggest vocabulary from scenario drafts using call to terminology service.

## Suggested Git Checkpoints

1. **db-scenarios-ownership**: extend scenarios schema + tier config, update repository/service plumbing.
2. **api-user-scenarios**: expose REST endpoints with validation, tier enforcement, PostHog hooks.
3. **client-authoring-flow**: introduce services, store updates, GPT author modal, and selector integration.
4. **analytics-and-polish**: wire usage tracking, upgrade CTAs, and documentation refresh.
