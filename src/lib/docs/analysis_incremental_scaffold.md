# 🔁 Analysis Growth Playbook Scaffold

> **Purpose**: Ship the Growth Playbook experience incrementally while keeping each change testable, observable, and easy to surface to learners.

---

## 1. Foundation (Week 0)

- ✅ `GrowthPlaybookService` scaffolding turns raw `AnalysisRunResult` data into persona-aware celebration copy and a single scenario recommendation stub.
- ✅ `analysis.store` now tracks `persona` + `playbook` state and exposes `generatePlaybook()` for UI components.
- ✅ `GrowthPlaybookCard` component renders a friendly celebration, next scenario CTA, and share prompt placeholder.
- ✅ Placeholder `ScenarioMasteryService` provides seed data so we can wire UI before real metrics land.

**Test**: `analysisStore.runAnalysis(..., { autoGeneratePlaybook: true })` should populate `analysisStore.playbook`; render `<GrowthPlaybookCard playbook={$derived(analysisStore.playbook)} />` in dev routes to verify copy flows.

---

## 2. Signals & Instrumentation (Week 1)

1. **Scenario Mastery API**
   - Implement `/api/analysis/mastery` backed by `scenario_outcomes` + `scenario_attempts` aggregates.
   - Replace placeholder service call; add unit test covering score blending.
   - Log PostHog event `analysis_mastery_generated` with scenario IDs + scores.
2. **Usage Cadence Signals**
   - Extend `userUsage` repo to expose conversations/week and last activity.
   - Pass into `growthPlaybookService.buildCustom` for more precise reminder hooks.
3. **Component QA**
   - Snapshot test the Svelte card (e.g., Playwright component test) to lock layout and copy placeholders.

---

## 3. Persona Dial & Copy (Week 2)

- Add persona selector in analysis UI (default relationship navigator) writing to `analysisStore.setPersona`.
- Refine copy templates in `GrowthPlaybookService.formatCelebrationHeadline` using creative brief.
- A/B test share prompt phrasing via PostHog flag; track CTA click-through.

**UI**: Show persona pill + ability to toggle before running analysis.

---

## 4. Scenario Launch Loop (Week 3)

- Wire Growth Playbook CTA to launch next scenario (prefill conversation route with `scenarioId`).
- Persist selected recommendations and outcomes to `scenarioAttempts` for retro loops.
- Add success toast in UI once the new conversation starts.

**Test**: E2E Playwright flow — run analysis → accept CTA → confirm new conversation route receives scenario param.

---

## 5. Reminders & Share Nudges (Week 4)

- Connect `ReminderScheduler` to use latest playbook data (scenario + persona) when composing 5-minute nudges.
- Trigger Resend template with snippet from `playbook.sharePrompt`; include deep link to scenario.
- Capture share metrics via API to power roadmap share goal.

---

## 6. Production Readiness Checklist

- [ ] API + services covered by unit tests (analysis summariser, mastery fetch, reminder composer).
- [ ] UI snapshot/E2E tests pass in CI.
- [ ] Observability dashboards: conversations/week, playbook CTA clicks, share sends.
- [ ] Feature flag guard to disable Growth Playbook in case of regressions.
- [ ] Documentation updated (`analysis_incremental_scaffold.md`, roadmap, changelog).

---

## Suggested Jira/GitHub Issue Breakdown

1. `analysis-001` — Wire Growth Playbook scaffolding (`growthPlaybookService`, store state, component shell).
2. `analysis-002` — Implement Scenario Mastery API + service (include tests).
3. `analysis-003` — Persona selector + copy polish.
4. `analysis-004` — Scenario CTA deep link + analytics instrumentation.
5. `analysis-005` — Reminder integration + share prompt delivery.

Each issue should land with a demo clip (Loom or screenshot) showing the updated Growth Playbook card in `/dev/analysis` or the real learner flow.

---

_This scaffold keeps changes thin, observable, and learner-first while building toward the confidence-driven analysis vision._
