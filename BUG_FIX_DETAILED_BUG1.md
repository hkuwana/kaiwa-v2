# Bug #1: Language/Scenario Persistence Not Saving - Detailed Fix

## Actual Problem Found

After analyzing the code, the issue is **NOT** about saving to localStorage - the save logic is actually correct.

The real issue is: **Home page uses stale local state that doesn't sync with store**

### Current Code (Broken)
```ts
// Line 26 in src/routes/+page.svelte
let selectedLanguage = $state<DataLanguage | null>(settingsStore.selectedLanguage);
let selectedSpeaker = $state<string | null>(settingsStore.selectedSpeaker);
```

**Problem**:
1. Page loads, local state copies store value ONCE
2. User selects language → settingsStore updates AND local state updates
3. Page reloads → settingsStore loads from localStorage (works!)
4. BUT: Home page local state still copies STALE store value
5. If there's ANY async issue or race condition, local state shows old value

### Why It Fails on Reload
```
On first load:
- localStorage has: "ja" (Japanese)
- store reads from localStorage → selectedLanguage = Japanese
- page copies it → local selectedLanguage = Japanese ✓

User selects Spanish:
- store updates → selectedLanguage = Spanish
- local copies it → selectedLanguage = Spanish
- persistLanguage() writes to localStorage → "es"

User RELOADS page:
- localStorage still has: "es" (Spanish) ✓
- store should read from localStorage → selectedLanguage = Spanish
- page copies it → local selectedLanguage = Spanish ✓

BUT... if there's ANY timing issue where:
- Page renders BEFORE store finishes loading from localStorage
- Local state gets null/undefined value
- Then store loads but page doesn't update
```

## Proper Fix

### Fix 1: Use $derived instead of $state
Change home page to use reactive binding instead of stale copy:

```ts
// BEFORE (Line 26-28)
let selectedLanguage = $state<DataLanguage | null>(settingsStore.selectedLanguage);
let selectedSpeaker = $state<string | null>(settingsStore.selectedSpeaker);
let selectedScenario = $state<Scenario | null>(scenarioStore.getSelectedScenario());

// AFTER
const selectedLanguage = $derived(settingsStore.selectedLanguage);
const selectedSpeaker = $derived(settingsStore.selectedSpeaker);
const selectedScenario = $derived(scenarioStore.getSelectedScenario());
```

**Why This Works**:
- `$derived` always reflects the CURRENT store value
- When store updates, component automatically re-renders
- No stale values, no race conditions

### Fix 2: Handlers still need to update store
Since $derived values are read-only, handlers must update the store:

```ts
// These already do this! Just keep them as-is:
function handleLanguageChange(language: DataLanguage) {
  settingsStore.setLanguageObject(language);  // ← Updates store
  // Don't set local selectedLanguage, let $derived do it
}

function handleSpeakerChange(speakerId: string) {
  settingsStore.setSpeaker(speakerId);  // ← Updates store
  // Don't set local selectedSpeaker, let $derived do it
}

function handleScenarioChange(scenario: Scenario) {
  scenarioStore.setScenarioById(scenario.id);  // ← Updates store
  // Don't set local selectedScenario, let $derived do it
}
```

### Fix 3: Remove redundant local updates
Update the handlers to NOT update local state (since $derived does it):

```ts
// BEFORE
function handleLanguageChange(language: DataLanguage) {
  selectedLanguage = language;  // ← Redundant!
  settingsStore.setLanguageObject(language);
}

// AFTER
function handleLanguageChange(language: DataLanguage) {
  settingsStore.setLanguageObject(language);  // Only this needed
}
```

## Files to Modify

### 1. src/routes/+page.svelte (Lines 26-28 and 91-109)

Change:
```ts
// Line 26-28: Use $derived instead of $state
const selectedLanguage = $derived(settingsStore.selectedLanguage);
const selectedSpeaker = $derived(settingsStore.selectedSpeaker);
const selectedScenario = $derived(scenarioStore.getSelectedScenario());

// Line 91-109: Simplify handlers - only update store
function handleLanguageChange(language: DataLanguage) {
  settingsStore.setLanguageObject(language);
}

function handleSpeakerChange(speakerId: string) {
  settingsStore.setSpeaker(speakerId);
}

function handleScenarioChange(scenario: Scenario) {
  scenarioStore.setScenarioById(scenario.id);
}

function handleDynamicLanguageSelect(language: DataLanguage) {
  settingsStore.setLanguageObject(language);
}
```

## Why This Actually Fixes The Bug

**Before Fix**:
1. User selects language
2. Local state updates: `selectedLanguage = Spanish`
3. Store updates: `settingsStore.selectedLanguage = Spanish`
4. Persistence works: localStorage["kaiwa_language_code"] = "es"
5. User reloads page
6. Store loads from localStorage: `settingsStore.selectedLanguage = Spanish` ✓
7. BUT Home page reads local state which was RESET to null ✗
8. Home page shows no language selected!

**After Fix**:
1. User selects language
2. Store updates: `settingsStore.selectedLanguage = Spanish`
3. Persistence works: localStorage["kaiwa_language_code"] = "es"
4. Home page's $derived binding detects store changed
5. Component automatically re-renders with `selectedLanguage = Spanish` ✓
6. User reloads page
7. Store loads from localStorage: `settingsStore.selectedLanguage = Spanish` ✓
8. Home page's $derived binding already has correct value ✓
9. Home page shows Spanish! ✓

## Validation

After fix, verify:
- [ ] Select language → see it selected in UI
- [ ] Reload page → language still selected
- [ ] Select different language → switches correctly
- [ ] Reload again → new language persisted
- [ ] Same for speaker and scenario
- [ ] Browser DevTools → localStorage has correct keys/values
- [ ] No console errors or race conditions

## Impact
- **Risk Level**: Very Low - just changes how we read store values
- **Performance**: Slightly better (fewer redundant updates)
- **Backward Compat**: Fully compatible
- **Lines Changed**: ~15 lines total

## Related Files
- Settings store: `src/lib/stores/settings.store.svelte.ts` (persistence logic)
- Scenario store: `src/lib/stores/scenario.store.svelte.ts` (scenario persistence)
- Conversation page: `src/routes/conversation/+page.svelte` (uses these stores)
