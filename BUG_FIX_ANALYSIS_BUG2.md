# Bug #2: Language Switch Bug - Detailed Analysis

## Problem Statement
When user switches language (e.g., Russian → Spanish), the wrong language briefly appears, or conversation starts with the wrong language.

## Analysis After Bug #1 Fix

Bug #1 fix (using $derived for reactive bindings) should have **mostly resolved** this issue on the home page.

However, we need to verify:

### 1. Home Page Language Display (✓ SHOULD BE FIXED)
**Before**: Local state was stale, didn't sync with store → showed wrong language
**After**: $derived binding always reflects store → shows correct language
**Status**: Likely fixed by Bug #1 change

### 2. Conversation Page Initialization
**File**: `src/routes/conversation/+page.svelte`

**Current Flow**:
```ts
// Line 39
const selectedLanguage = $derived(settingsStore.selectedLanguage);

// Line 53-63: Auto-connection effect
$effect(() => {
  if (browser && !autoConnectAttempted && !isStaticView &&
      status === 'idle' && selectedLanguage) {
    attemptAutoConnection();
  }
});

// Line 140-171: attemptAutoConnection
async function attemptAutoConnection() {
  autoConnectAttempted = true;
  const speaker = settingsStore.selectedSpeaker;
  await conversationStore.startConversation(selectedLanguage, speaker, ...);
}
```

**Potential Issue**:
- Line 39: `selectedLanguage` is derived from store ✓
- Line 53-63: Effect watches `selectedLanguage`
- **BUT**: When user navigates to conversation page with new language:
  1. Route loads
  2. Effect runs immediately
  3. If store hasn't finished loading language from localStorage yet...
  4. selectedLanguage might be old/default value
  5. Conversation starts with wrong language

**Root Cause**: Race condition between:
- Route load and store initialization
- Store loading from localStorage
- Effect triggering before store is ready

### 3. Settings Store Initialization
**File**: `src/lib/stores/settings.store.svelte.ts`

**Current Flow** (Lines 90-158):
```ts
private initializeFromStorage = () => {
  if (browser) {
    // Load from localStorage synchronously
    const storedLanguageCode = localStorage.getItem(STORAGE_KEYS.LANGUAGE_CODE);

    // Set selectedLanguage immediately
    if (storedLanguageCode) {
      const language = allLanguages.find(lang => lang.code === storedLanguageCode);
      this.selectedLanguage = language;
    }

    // But setup persistence is deferred!
    setTimeout(() => {
      this.setupPersistence();
    }, 0);
  }
};
```

**Issue**: `initializeFromStorage` is called in constructor, which is:
- In server-side: Doesn't load from browser storage ✓
- In browser during hydration: Called before route-specific effects
- But if conversation page loads immediately...
- Store might not have finished initialization

## Real Issue: Route Transitions

The actual bug likely happens during **route navigation**:

```
Scenario:
1. User on home page, selects Spanish
2. settingsStore.selectedLanguage = Spanish
3. persistLanguage() saves to localStorage
4. User clicks "Start speaking"
5. Navigates to /conversation

What could go wrong:
1. /conversation route loads
2. selectedLanguage derived from settingsStore.selectedLanguage
3. Effect runs: $effect(() => { attemptAutoConnection() })
4. If state hydration is incomplete, selectedLanguage might be null/default
5. startConversation() starts with wrong language
```

## The Fix(s)

### Fix 1: Already Applied (Bug #1)
✓ Use $derived in both home page AND conversation page
✓ Ensures always reading current store value

### Fix 2: Ensure Store Initialization Completes
**Current**: `initializeFromStorage()` called in constructor

**Verify**: Is it called early enough?
- Constructor runs when store is instantiated
- Should be before any page loads
- **Likely OK**, but worth verifying

### Fix 3: Guard Against Null Language
**Location**: `src/routes/conversation/+page.svelte:140-171`

Add check to prevent starting conversation without language:

```ts
async function attemptAutoConnection() {
  if (!selectedLanguage) {
    console.warn('⚠️ attemptAutoConnection: No language selected, aborting');
    return;
  }

  autoConnectAttempted = true;
  const speaker = settingsStore.selectedSpeaker;
  await conversationStore.startConversation(selectedLanguage, speaker, ...);
}
```

### Fix 4: Add Debug Logging
Track state values at critical points to diagnose race conditions:

```ts
// In conversation page $effect
$effect(() => {
  console.log('🌍 Conversation page language updated:', {
    selectedLanguage: selectedLanguage?.code,
    storageLang: settingsStore.selectedLanguage?.code,
    timestamp: new Date().toISOString()
  });

  if (browser && !autoConnectAttempted && !isStaticView &&
      status === 'idle' && selectedLanguage) {
    console.log('🚀 Triggering auto-connection with language:', selectedLanguage.code);
    attemptAutoConnection();
  }
});
```

## Testing Hypothesis

**Test 1: Quick Language Switch**
1. Open home page
2. Select Language A
3. Immediately click "Start speaking"
4. Does conversation use Language A? ✓ or ✗

**Test 2: Wait for Save**
1. Open home page
2. Select Language B
3. Wait 1 second (allow localStorage save)
4. Click "Start speaking"
5. Does conversation use Language B? ✓ (should always work)

**Test 3: Reload and Check**
1. Home page, select Language C
2. Reload page
3. Language still C on home? ✓ (Bug #1 fix should handle)
4. Click "Start speaking"
5. Conversation uses Language C? ✓ (Bug #2 fix should handle)

## Implementation Plan

1. ✓ Bug #1 fix applied (reactive bindings)
2. Add null-check guard in attemptAutoConnection
3. Add debug logging to track language flow
4. Test all 3 scenarios above
5. Deploy and monitor

## Files to Modify

1. `src/routes/conversation/+page.svelte` (Lines 140-171)
   - Add null check in attemptAutoConnection
   - Add debug logging in effect

## Expected Outcome

After these fixes, language switches should:
- Display correctly on home page ✓ (from Bug #1)
- Start conversation with correct language ✓ (from this fix)
- Persist across reloads ✓ (from Bug #1)
