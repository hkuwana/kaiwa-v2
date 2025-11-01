# Bug #3: Scenario Lost on Language Switch - Fix Plan

## Problem Statement
When user switches language, the previously selected scenario is lost and resets to default.

Example:
1. User selects "Meeting parent" scenario for Japanese
2. User switches to Spanish
3. Scenario resets to "Onboarding" (default)

## Root Cause Analysis
**Files Involved**:
- `src/lib/stores/settings.store.svelte.ts` - Language management
- `src/lib/stores/scenario.store.svelte.ts` - Scenario management (independent)
- `src/routes/+page.svelte` - Language/scenario change handlers

**Issue**: Zero coordination between stores
- When language changes, scenario store is not notified
- Scenario persists in localStorage even if invalid for new language
- No validation or reset logic

## Solution

### Approach: Simple Reset on Language Change

**Rationale**:
- Most scenarios are language-specific
- When language changes, user likely wants new scenario for that language
- Prevents invalid scenario/language combinations
- Simple and predictable behavior

### Implementation Steps

#### Step 1: Add Reset Method to Scenario Store
**File**: `src/lib/stores/scenario.store.svelte.ts`

```ts
// Already has reset() method at line 260, but make it public and used by other stores
resetToDefault = () => {
  console.log('🎯 Resetting scenario to onboarding (language change)');
  this.selectedScenario = scenariosData[0];

  if (browser) {
    try {
      localStorage.removeItem(STORAGE_KEYS.SCENARIO);
      scenarioCookieUtils.deleteCookie(STORAGE_KEYS.SCENARIO);
    } catch (error) {
      console.warn('⚠️ Failed to clear scenario storage on language change:', error);
    }
  }
};
```

#### Step 2: Update Home Page Handler
**File**: `src/routes/+page.svelte`

```ts
function handleLanguageChange(language: DataLanguage) {
  settingsStore.setLanguageObject(language);
  // Bug #3 fix: Reset scenario when language changes
  scenarioStore.resetToDefault();
  console.log('🌍 Language changed to:', language.code, '- Scenario reset to default');
}
```

## Expected Behavior

**Before Fix**:
```
User selects language A + scenario X
→ localStorage stores both
User switches to language B
→ Scenario X persists (invalid for language B)
→ Conversation tries to use scenario X with language B (broken)
```

**After Fix**:
```
User selects language A + scenario X
→ localStorage stores both
User switches to language B
→ Scenario reset to default (Onboarding)
→ User sees default scenario for language B
→ User can select appropriate scenario for language B
```

## Testing Plan

1. **Basic Test**:
   - Select Japanese
   - Select "Meeting Parent" scenario
   - Switch to Spanish
   - Verify scenario reset to "Onboarding"

2. **Verification Test**:
   - Select Russian
   - Select custom scenario
   - Switch language
   - Check localStorage - scenario entry cleared

3. **Persistence Test**:
   - Select language + scenario
   - Reload page
   - Language + default scenario visible
   - Switch language again
   - Verify scenario resets

## Files to Modify

1. `src/routes/+page.svelte` - Call scenarioStore.resetToDefault() on language change
2. `BUG_FIX_ANALYSIS_BUG3.md` - This document

## Why This Fix Works

- **Simple**: One method call, one line change
- **Predictable**: Users always get default scenario for new language
- **Safe**: Prevents invalid scenario/language combinations
- **Observable**: Clear console logging shows what happened

## Alternative Approaches Considered

**Option A: Keep scenario if valid for language** - Requires language-aware scenario filtering (complex, not implemented in current codebase)

**Option B: Prompt user to choose** - Better UX but more complex (deferred for future)

**Option C: Reset on language change** - ✓ Simple, safe, current approach
