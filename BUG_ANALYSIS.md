# Kaiwa High-Priority Bugs - Root Cause Analysis

## Overview
7 critical bugs identified, all stemming from state management issues. Fixing them requires proper reactive state binding and inter-store coordination.

---

## Bug #1: Language/Scenario Persistence ⚠️ CRITICAL

**Impact**: User loses language/scenario selection on page reload

**Root Cause**:
- Settings store setup defers persistence with `setTimeout()` but never sets up reactive watchers
- Components read store state once at mount, never re-bind when store changes
- Manual setter methods must be called for persistence, but components sometimes mutate state directly

**Files**:
- `src/lib/stores/settings.store.svelte.ts:90-158` (broken setup)
- `src/routes/+page.svelte:26` (one-time read, no reactive binding)
- `src/routes/conversation/+page.svelte:39,86-89` (checks language but no sync)

**Fix Approach**:
1. Remove deferred `setTimeout()` from persistence setup
2. Add `$effect()` watchers in settings store for `selectedLanguage`, `selectedSpeaker`, `selectedScenario`
3. Each watcher calls the persist method immediately
4. Home page should use derived state, not local state copy

**Effort**: 20 minutes

---

## Bug #2: Language Switch Bug (Russian → Spanish) ⚠️ CRITICAL

**Impact**: Wrong language appears after switching

**Root Cause**:
- Race condition: Home page reads `selectedLanguage` once at mount into local state
- When language selector calls `setLanguage()`, store updates but home page local state is stale
- Speaker auto-selection happens AFTER language update, causing timing mismatch
- No `$effect()` to keep home page local state synced with store

**Files**:
- `src/lib/components/LanguageSelector.svelte:109-126` (triggers update)
- `src/lib/stores/settings.store.svelte.ts:232-252` (updates store)
- `src/routes/+page.svelte:26,91-115` (stale local state)

**Fix Approach**:
1. Remove local `selectedLanguage` state from home page
2. Use `$derived()` to bind directly to `settingsStore.selectedLanguage`
3. Same for speaker auto-selection - use `$derived()` instead of separate effect
4. Ensure all updates go through store setter methods in correct order

**Effort**: 15 minutes

---

## Bug #3: Scenario Lost on Language Switch ⚠️ CRITICAL

**Impact**: User selects scenario, changes language, scenario disappears

**Root Cause**:
- Settings store and Scenario store are completely independent (zero coordination)
- No `$effect()` hook to validate/reset scenario when language changes
- Scenario ID persists in localStorage even though it may not be valid for new language
- No language-aware filtering of available scenarios

**Files**:
- `src/lib/stores/settings.store.svelte.ts:232-252` (language change)
- `src/lib/stores/scenario.store.svelte.ts:53-316` (no dependency on language)
- `src/routes/+page.svelte:91-104` (no coordination)

**Fix Approach**:
1. Add `$effect()` in scenario store that watches `settingsStore.selectedLanguage`
2. When language changes, validate scenario is still available for that language
3. If scenario unavailable, reset to default ("onboarding-welcome" or first available)
4. OR: Reset scenario on language change (simpler but less ideal UX)

**Effort**: 20 minutes

---

## Bug #4: Multiple Responses Generated (3 instead of 1) 🔴 CRITICAL

**Impact**: Agent generates 3 duplicate responses, confusing user flow

**Root Cause**:
- RealtimeOpenAI store has message listeners registered multiple times (duplicate subscriptions)
- `onMessageStream()` callback fires 3 times per event instead of 1
- Each callback re-mirrors ALL messages from `realtimeOpenAI.messages` array
- Deduplication only works within single array, not across multiple listener invocations
- Both delta and final message events may trigger the same handler

**Files**:
- `src/lib/stores/realtime-openai.store.svelte.ts:1466-1510` (message listeners)
- `src/lib/stores/conversation.store.svelte.ts:876-895` (mirroring with dedup)
- Message subscription setup (need to find where listeners are registered)

**Fix Approach**:
1. Audit where message listeners are registered - find duplicate subscriptions
2. Add guard to `emitMessage()` to ensure callback only fires once per event
3. Or: Use Set-based deduplication on message IDs across listener invocations
4. Ensure delta + final events don't both trigger message mirror

**Effort**: 30 minutes (needs investigation to find where duplicates register)

---

## Bug #5: Create Scenario Buggy ⚠️ MEDIUM

**Impact**: User creates custom scenario but it fails or doesn't save properly

**Root Cause**:
- Edited JSON in textarea not synced back to `draft.result` before save
- No validation of JSON before persistence
- Manual JSON parsing only on blur, not before save
- If user edits JSON but doesn't blur field, save uses stale draft

**Files**:
- `src/lib/features/scenarios/components/ScenarioCreatorModal.svelte:72-93` (save method)
- `src/lib/features/scenarios/components/ScenarioCreatorModal.svelte:212-219` (blur sync)
- No validation before save

**Fix Approach**:
1. In `saveScenario()`, sync `draftText` textarea back to `draft.result` before saving
2. Add JSON validation and error handling
3. Parse and validate JSON before passing to store
4. Show error message if JSON invalid instead of silent fail

**Effort**: 15 minutes

---

## Bug #6: Role-Play Glitch (Shows Analysis from Previous) ⚠️ CRITICAL

**Impact**: Mid-conversation, suddenly shows analysis from a previous conversation

**Root Cause**:
- Analysis state leaks across conversations
- `userPreferencesStore.hasCurrentAnalysisResults` stays true from previous session
- When new conversation starts, old analysis modal still shows
- `dismissAnalysisNotification()` only clears results, doesn't reset conversation status
- Conversation status and analysis state can get out of sync (status="streaming" but analysis results showing)

**Files**:
- `src/lib/stores/conversation.store.svelte.ts:1928-1993` (end conversation)
- `src/lib/stores/user-preferences.store.svelte.ts` (analysis state)
- `src/routes/conversation/+page.svelte:633-642` (shows analysis modal)

**Fix Approach**:
1. Add effect to clear `userPreferencesStore.analysisResults` when new conversation starts
2. Modify `startNewConversation()` to explicitly clear previous analysis state
3. Add guard in page to not show analysis modal if status != "analyzing"
4. Ensure analysis state resets whenever conversation status changes

**Effort**: 20 minutes

---

## Bug #7: App Resets to Conversation Screen on Glitch ⚠️ HIGH

**Impact**: UI state lost, user confused about navigation

**Root Cause**:
- (Likely related to Bug #6) Conversation status state managing UI routes
- When glitch occurs, status reverts to default state
- No persistence of UI state (analysis vs active vs complete)
- Hard reset likely in error handlers

**Files**:
- Need to find: Where conversation status triggers route changes
- Likely in conversation/+page.svelte

**Fix Approach**:
1. Audit navigation logic tied to conversation status
2. Add guards to prevent invalid status transitions
3. Ensure status changes are atomic with UI updates
4. Add error recovery that doesn't reset state to default

**Effort**: 25 minutes (needs more investigation)

---

## Fix Priority Order

1. **Bug #4 (Multiple Responses)** - Most critical UX impact, likely blocking other fixes
2. **Bug #1 (Persistence)** - Fundamental state management issue
3. **Bug #2 (Language Switch)** - Direct consequence of Bug #1
4. **Bug #3 (Scenario Lost)** - Requires fixing Bug #1 first, then add inter-store coordination
5. **Bug #6 (Role-Play Glitch)** - Medium effort, high impact
6. **Bug #5 (Create Scenario)** - Medium effort, lower impact
7. **Bug #7 (UI Reset)** - Requires more investigation first

---

## Implementation Plan

Each bug will be:
1. **Diagnosed** - Confirm root cause with code review
2. **Fixed** - Implement minimal fix
3. **Tested** - Manual testing on dev
4. **PR'd** - Single commit per fix with clear message
5. **Deployed** - Auto-deploy to production via CI/CD

Estimated total time: 2-3 hours for all 7 fixes
