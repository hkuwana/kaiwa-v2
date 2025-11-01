# Kaiwa Bug Fix Implementation Plan

## Bug #1: Language/Scenario Persistence NOT Saving

**Status**: Ready to fix
**Priority**: CRITICAL (blocks all other functionality)
**Time Estimate**: 20 minutes

### The Problem
- User selects language/scenario
- Page reloads
- Selection is lost

### Root Cause Analysis
**File**: `src/lib/stores/settings.store.svelte.ts`

```
Current flow:
1. Component calls settingsStore.setLanguage()
2. Store updates selectedLanguage state
3. Setter method calls persistLanguage() immediately
4. persistLanguage() writes to localStorage

BUT:
- setupPersistence() uses setTimeout(..., 0) deferral (line 145)
- No reactive $effect() watchers to auto-persist when state changes
- If component directly mutates state instead of calling setter, nothing persists
- Home page reads store ONCE at mount into local state, never re-binds
```

**Specific Issue at Lines**:
- Line 145-147: `setTimeout(() => this.setupPersistence(), 0)` - deferred setup
- Line 90-158: `initializeFromStorage()` sets up persistence but it's incomplete
- `src/routes/+page.svelte:26`: Home page reads `selectedLanguage` once, never updates

### The Fix (Detailed Steps)

**Step 1**: Add reactive watchers to settings.store.svelte.ts
```ts
// After state definitions, add:
$effect(() => {
  // Watch selectedLanguage and persist immediately
  const language = this.selectedLanguage;
  if (language) {
    this.persistLanguage();
  }
});

$effect(() => {
  // Watch selectedSpeaker and persist immediately
  const speaker = this.selectedSpeaker;
  if (speaker) {
    this.persistSpeaker();
  }
});

$effect(() => {
  // Watch selectedScenario and persist immediately
  const scenario = this.selectedScenario;
  if (scenario) {
    this.persistScenario();
  }
});
```

**Step 2**: Fix home page binding
- Remove: `let selectedLanguage = $state(settingsStore.selectedLanguage);`
- Replace with: `const selectedLanguage = $derived(settingsStore.selectedLanguage);`
- This makes it reactive instead of a stale copy

### Files to Modify
1. `src/lib/stores/settings.store.svelte.ts` - Add $effect watchers
2. `src/routes/+page.svelte` - Use $derived instead of $state copy

### Testing
- [ ] Select language → reload page → language persists
- [ ] Select scenario → reload page → scenario persists
- [ ] Select speaker → reload page → speaker persists
- [ ] Check localStorage in DevTools confirms values saved

---

## Bug #2: Language Switch Bug (Russian shows as Spanish)

**Status**: Ready to fix
**Priority**: CRITICAL
**Time Estimate**: 15 minutes
**Depends On**: Bug #1 fix (persistence must work first)

### The Problem
- User selects Russian
- UI briefly shows Spanish
- Wrong language in conversation

### Root Cause Analysis
**File**: `src/routes/+page.svelte`

```
Race condition:
1. LanguageSelector.svelte calls onLanguageChange() callback
2. Callback calls settingsStore.setLanguageObject()
3. settingsStore updates state AND calls persistLanguage()
4. BUT home page has local copy: let selectedLanguage = $state(settingsStore.selectedLanguage)
5. Local copy doesn't automatically update (only set once at mount)
6. Speaker auto-selection happens AFTER language update (line 113)
7. User sees old language until next render
```

**Specific Issues at Lines**:
- Line 26: Home page creates local state copy (not reactive)
- Line 91-94: handleLanguageChange doesn't coordinate state updates
- Line 113-115: Speaker auto-selection happens asynchronously after language

### The Fix
**Same as Bug #1 - Once persistence is fixed, language switch will auto-sync**

Change:
```ts
// BEFORE
let selectedLanguage = $state(settingsStore.selectedLanguage);

// AFTER
const selectedLanguage = $derived(settingsStore.selectedLanguage);
```

The $derived binding means when store updates, component automatically re-renders with new value.

### Files to Modify
1. `src/routes/+page.svelte` - Use $derived instead of $state

### Testing
- [ ] Select Russian language
- [ ] Immediately see Russian in UI (no Spanish flash)
- [ ] Switch to Japanese
- [ ] No delay in UI update

---

## Bug #3: Scenario Lost When Language Changes

**Status**: Ready to fix (after Bug #1)
**Priority**: CRITICAL
**Time Estimate**: 20 minutes
**Depends On**: Bug #1 fix

### The Problem
- User picks "Meeting parent" scenario for Japanese
- User switches to Spanish
- Scenario resets to default/blank

### Root Cause Analysis
**Files**:
- `src/lib/stores/settings.store.svelte.ts` - Language updates
- `src/lib/stores/scenario.store.svelte.ts` - Scenario storage (independent)
- `src/routes/+page.svelte` - No coordination

```
The two stores are completely independent:
- Language store knows nothing about scenario
- Scenario store knows nothing about language
- When language changes, no hook validates/resets scenario
- Scenario ID persists in localStorage even if invalid for new language
```

### The Fix (Two Options)

**Option A: Reset scenario on language change (Simple)**
```ts
// In settings.store.svelte.ts, add watcher:
$effect(() => {
  // When language changes, reset scenario
  const language = this.selectedLanguage;
  if (language && scenarioStore.selectedScenario) {
    scenarioStore.resetToDefault(); // or similar
  }
});
```

**Option B: Validate scenario for language (Better UX)**
```ts
// In scenario.store.svelte.ts, add watcher:
$effect(() => {
  // When language changes, validate current scenario
  const language = settingsStore.selectedLanguage;
  if (language) {
    const isValid = this.isScenarioValidForLanguage(
      this.selectedScenario.id,
      language.code
    );
    if (!isValid) {
      this.resetToDefault();
    }
  }
});
```

### Files to Modify
1. `src/lib/stores/scenario.store.svelte.ts` - Add language validation
2. `src/lib/stores/settings.store.svelte.ts` - Link to scenario store (import)

### Testing
- [ ] Select scenario for language A
- [ ] Switch to language B
- [ ] Scenario either resets OR validates correctly
- [ ] Scenario persists if valid for both languages

---

## Bug #4: Multiple Responses Generated (3 instead of 1)

**Status**: INVESTIGATING
**Priority**: CRITICAL (blocks core functionality)
**Time Estimate**: 30-45 minutes
**Depends On**: None

### The Problem
- Agent generates 3 duplicate responses
- User sees 3 identical messages
- Conversation flow broken

### Root Cause Investigation

**Suspicious Points**:
1. **Line 876 (conversation.store.svelte.ts)**: Message listener
   - Called once per connection, unsubscribed properly
   - Cleanup at line 863: `this.messageUnsub?.()` before registering new one
   - Uses Set for listeners, so duplicates should be impossible

2. **Line 1503-1510 (realtime-openai.store.svelte.ts)**: emitMessage
   - Iterates through messageListeners Set
   - Calls each listener once per event
   - Should be only 1 listener registered

3. **Line 885-895 (conversation.store.svelte.ts)**: Message mirroring
   - Copies ALL messages from realtimeOpenAI.messages
   - Uses removeDuplicateMessages() to deduplicate
   - **HYPOTHESIS**: Maybe removeDuplicateMessages is broken?

### Next Steps to Diagnose
Need to check:
1. Is message listener registered 3 times?
2. Is emitMessage called 3 times per event?
3. Is removeDuplicateMessages working correctly?
4. Are delta and final events both firing?

### The Probable Fix
Most likely cause: **Listener registered multiple times** OR **emitMessage called multiple times**

```ts
// Add guard to prevent duplicate listener registration:
if (this.messageUnsub) {
  this.messageUnsub(); // Clean up old listener
}

this.messageUnsub = realtimeOpenAI.onMessageStream(async (ev) => {
  // ... handler code
});
```

Alternative: Check if `setupRealtimeEventHandlers()` is being called multiple times without cleanup.

### Files to Investigate
1. `src/lib/stores/realtime-openai.store.svelte.ts` - emitMessage logic
2. `src/lib/stores/conversation.store.svelte.ts` - setupRealtimeEventHandlers calls
3. `src/lib/services/message.service.ts` - removeDuplicateMessages implementation

### Testing
- [ ] Check browser console for emitMessage calls per event
- [ ] Count actual messages in array vs displayed messages
- [ ] Check if problem occurs on every response or intermittently

---

## Bug #5: Create Scenario Feature Buggy

**Status**: READY TO FIX
**Priority**: MEDIUM
**Time Estimate**: 15 minutes

### The Problem
- User creates custom scenario
- JSON editor accepts edits
- User saves but edits are lost

### Root Cause
**File**: `src/lib/features/scenarios/components/ScenarioCreatorModal.svelte`

```
The `draftText` (textarea) is updated locally by user
But `draft.result` (actual data) is only updated on blur event
When user saves immediately after editing, saves old draft.result
```

**Lines**:
- Line 72-93: `saveScenario()` uses `draft.result`
- Line 212-219: `draftText` only syncs to `draft.result` on blur
- No validation before save

### The Fix
```ts
// In saveScenario(), add sync before save:
async function saveScenario() {
  // BEFORE SAVING, sync edited text back to draft
  if (draftText.trim()) {
    try {
      draft.result = JSON.parse(draftText);
    } catch (e) {
      showError('Invalid JSON - please fix and try again');
      return;
    }
  }

  // Now save the synced draft
  // ... rest of save logic
}
```

### Files to Modify
1. `src/lib/features/scenarios/components/ScenarioCreatorModal.svelte` - Add sync + validation

### Testing
- [ ] Edit scenario JSON
- [ ] Don't blur field
- [ ] Save immediately
- [ ] Edits are preserved

---

## Bug #6: Role-Play Glitch (Shows Analysis from Previous)

**Status**: READY TO FIX
**Priority**: CRITICAL
**Time Estimate**: 20 minutes

### The Problem
- User in middle of conversation
- Suddenly analysis modal appears
- It's from a PREVIOUS conversation

### Root Cause
**Files**:
- `src/lib/stores/conversation.store.svelte.ts` - End conversation logic
- `src/lib/stores/user-preferences.store.svelte.ts` - Analysis state
- `src/routes/conversation/+page.svelte` - Displays modal

```
When conversation ends:
1. Analysis triggered
2. messagesForAnalysis set from current conversation
3. But userPreferencesStore.hasCurrentAnalysisResults might be TRUE from PREVIOUS session
4. Page checks hasAnalysisResults and shows old analysis modal
5. States get out of sync:
   - conversationStore.status = "streaming"
   - userPreferencesStore.hasCurrentAnalysisResults = true (from old session)
```

### The Fix
```ts
// In conversation.store.svelte.ts, startNewConversation():
startNewConversation() {
  // Clear previous analysis state BEFORE starting new conversation
  userPreferencesStore.clearAnalysisResults();

  // Reset conversation state
  this.messages = [];
  this.messagesForAnalysis = [];
  this.status = 'idle';

  // ... rest of start logic
}
```

**AND**:
```ts
// In page, add guard:
{#if conversationStore.status === 'analyzing' && conversationStore.hasAnalysisResults}
  <!-- Show analysis modal -->
{/if}
```

### Files to Modify
1. `src/lib/stores/conversation.store.svelte.ts` - Clear analysis state on new conversation
2. `src/lib/stores/user-preferences.store.svelte.ts` - Add clearAnalysisResults method
3. `src/routes/conversation/+page.svelte` - Add guard to prevent showing stale analysis

### Testing
- [ ] Complete a conversation (see analysis)
- [ ] Start new conversation
- [ ] No old analysis appears mid-conversation
- [ ] New analysis shows correctly after new conversation ends

---

## Bug #7: App Resets to Conversation Screen on Glitch

**Status**: NEEDS INVESTIGATION
**Priority**: HIGH
**Time Estimate**: 25 minutes (+ investigation)

### The Problem
- In middle of conversation or analysis
- UI suddenly resets/glitches to conversation screen
- User loses navigation context

### Root Cause
Likely related to Bug #6, or:
- Error in async handler resets status to default
- Navigation logic broken

### Next Steps
Need to audit:
1. Where conversation status triggers navigation
2. Error handlers that might reset state
3. Component lifecycle hooks

### Files to Investigate
1. `src/routes/conversation/+page.svelte` - Navigation logic
2. `src/lib/stores/conversation.store.svelte.ts` - Error handlers

---

## Implementation Order

1. **Bug #1 (Persistence)** - 20 min - Foundation for others
2. **Bug #2 (Language Switch)** - 15 min - Depends on #1
3. **Bug #3 (Scenario Lost)** - 20 min - Depends on #1
4. **Bug #4 (Multiple Responses)** - 30-45 min - Highest priority, independent
5. **Bug #5 (Create Scenario)** - 15 min - Independent
6. **Bug #6 (Role-Play Glitch)** - 20 min - Medium priority
7. **Bug #7 (UI Reset)** - 25 min - Needs investigation

**Total Estimated Time**: 145-160 minutes (2.5-2.7 hours)

### Each Fix Will:
1. Create isolated PR with single bug fix
2. Test thoroughly
3. Auto-deploy via CI/CD
4. Move to next bug
