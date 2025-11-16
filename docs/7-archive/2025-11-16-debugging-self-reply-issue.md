# Debugging: Agent Replying to Itself Issue

## Problem Statement
The agent (Minami) appears to be replying to its own messages instead of responding to user input.

**Example:**
- Minami: "それなら、ちょっと特別とくべつなカクテルを選えらんでみようか..."
- Minami: "いいね！モヒートにしよう！..." ← **Should be from Hiro (user), not Minami**

## Current Hypotheses (Ordered by Likelihood)

### Hypothesis 1: Race Condition - Response Created Before User Item Committed ⭐ MOST LIKELY
**Theory:** The `response.create` event is sent before the server has fully committed the user's conversation item to its internal conversation history.

**Evidence from Code:**
- `maybeSendResponseForCommit()` sends `response.create` immediately when BOTH conditions are met:
  - `hasReceivedCommitAck` (from `input_audio_buffer.committed`)
  - `hasReceivedUserTranscript` (from `conversation.item.input_audio_transcription.completed`)
- However, there's no guarantee the server has finished adding the user item to the conversation
- The server might still be processing the item when `response.create` arrives

**How to Test:**
1. Add 150-300ms delay between receiving transcript and sending `response.create`
2. Check if delay fixes the issue
3. Monitor server event timing in logs

**Log Evidence to Look For:**
```
✅ SENDING response.create at: [timestamp1]
📨 conversation.item.created (role=user) at: [timestamp2]
```
If timestamp1 < timestamp2, this confirms the race condition.

---

### Hypothesis 2: User Conversation Items Not Being Created
**Theory:** The server is not creating conversation items for user audio inputs, so the conversation history only contains assistant messages.

**Evidence from Code:**
- Client IGNORES `conversation.item.created` events with `role='user'` (realtime-openai.store.svelte.ts:682-703)
- Local `conversationItems` array might not match server state

**How to Test:**
1. Add logging for ALL `conversation.item.created` events (including user role)
2. Verify server is sending these events after `input_audio_buffer.commit`
3. Check event sequence: commit → committed → item.created → transcript.completed

**Log Evidence to Look For:**
```
📤 CLIENT: input_audio_buffer.commit sent
📥 SERVER: input_audio_buffer.committed received
📥 SERVER: conversation.item.created (role=user, item_id=XXX) ← Look for this
📥 SERVER: conversation.item.input_audio_transcription.completed
```

---

### Hypothesis 3: Multiple Response.create Calls
**Theory:** Multiple `response.create` events are being sent, causing the assistant to generate multiple responses in quick succession.

**Evidence from Code:**
- `maybeSendResponseForCommit()` is called from TWO places:
  - When `input_audio_buffer.committed` is received (line 1074)
  - When user transcript is finalized (line 537)
- Guards should prevent duplicates, but might have edge cases

**How to Test:**
1. Count `response.create` events sent per user input
2. Add unique IDs to each commit to track duplicates
3. Check if `hasSentResponse` flag is working correctly

**Log Evidence to Look For:**
```
⚠️ ✅ CONDITIONS MET - SENDING response.create (commitNumber: 1)
⚠️ ✅ CONDITIONS MET - SENDING response.create (commitNumber: 1) ← DUPLICATE!
```

---

### Hypothesis 4: Session Instructions Incorrect
**Theory:** The session instructions or agent configuration is causing role confusion.

**Evidence:**
- Less likely based on code review
- Would need to review agent persona/instructions

**How to Test:**
1. Review session instructions sent in `session.update`
2. Check if instructions mention responding to own messages
3. Verify agent persona configuration

---

### Hypothesis 5: Suppress Transcript Logic Interfering
**Theory:** The `suppressNextUserTranscript` flag is preventing user messages from being added to conversation.

**Evidence from Logs:**
```
🧹 ConversationStore: SETTING suppressNextUserTranscript = TRUE
{durationMs: 1171, turnMaxInputLevel: 0, hadTranscriptDelta: false, hadAudioEnergy: false}
```

**How to Test:**
1. Temporarily disable silence detection logic
2. Check if issue persists with real user speech
3. Verify suppression only affects UI, not server-side conversation

**Log Evidence to Look For:**
```
🧹 suppressNextUserTranscript is TRUE → Transcript was: "何でもなんでもいいよ。"
```
If transcript is suppressed but still committed to server, this might not be the issue.

---

### Hypothesis 6: Conversation Item Role Attribution Bug
**Theory:** User conversation items are being created with `role='assistant'` instead of `role='user'`.

**Evidence:**
- Would be a server-side bug
- Less likely but possible

**How to Test:**
1. Log the `role` field from ALL `conversation.item.created` events
2. Verify user audio commits create items with `role='user'`

---

## Debugging Logging Plan

### Phase 1: Add Comprehensive Conversation Item Logging ✅
**File:** `src/lib/stores/realtime-openai.store.svelte.ts`

Add logging for ALL conversation items (user + assistant):
```typescript
case 'conversation.item.created':
case 'conversation.item.added': {
    const createdEvent = serverEvent as any;
    console.log('🔍 CONVERSATION ITEM CREATED/ADDED:', {
        eventType: serverEvent.type,
        itemId: createdEvent.item?.id,
        role: createdEvent.item?.role,
        type: createdEvent.item?.type,
        hasContent: !!createdEvent.item?.content,
        timestamp: new Date().toISOString()
    });
    // ... existing code
}
```

### Phase 2: Add Response Timing Validation ✅
**File:** `src/lib/stores/realtime-openai.store.svelte.ts`

Before sending `response.create`, log conversation state:
```typescript
private maybeSendResponseForCommit(commit: PendingCommitEntry, reason: string) {
    // ... existing guards ...

    console.warn('⏰ ABOUT TO SEND response.create:', {
        commitNumber: commit.commitNumber,
        reason,
        expectedUserItemId: commit.allItemIdsForThisCommit,
        currentConversationItems: this.conversationItems.map(item => ({
            id: item.itemId,
            role: item.role,
            textPreview: item.text.substring(0, 50)
        })),
        timeSinceCommitAck: Date.now() - commit.commitAckTimestamp,
        timeSinceTranscript: Date.now() - commit.transcriptTimestamp
    });

    // ... send response ...
}
```

### Phase 3: Track Full Event Sequence ✅
Create a sequence tracker that logs all events in order:

```typescript
// Add to realtime-openai.store.svelte.ts
private eventSequence: Array<{timestamp: number, event: string, data: any}> = [];

private logSequence(event: string, data: any) {
    this.eventSequence.push({
        timestamp: Date.now(),
        event,
        data
    });

    // Keep last 50 events
    if (this.eventSequence.length > 50) {
        this.eventSequence.shift();
    }

    console.log('📊 EVENT SEQUENCE:', this.eventSequence.slice(-10));
}
```

### Phase 4: Add Conversation State Snapshot ✅
Before each `response.create`, dump the FULL server conversation state:

```typescript
private dumpConversationState() {
    console.group('💬 CONVERSATION STATE SNAPSHOT');
    console.log('Total Items:', this.conversationItems.length);
    this.conversationItems.forEach((item, idx) => {
        console.log(`${idx + 1}. [${item.role}] ${item.text}`);
    });
    console.groupEnd();
}
```

---

## Testing Protocol

### Test 1: Verify Event Sequence
1. Start a conversation
2. User speaks: "Hello"
3. Check logs for sequence:
   ```
   input_audio_buffer.commit
   → input_audio_buffer.committed (note item_id)
   → conversation.item.created (role=user, item_id matches)
   → conversation.item.input_audio_transcription.completed
   → response.create
   ```

### Test 2: Check Conversation State Before Response
1. Before each `response.create`, check conversation snapshot
2. Verify LAST item has `role=user`
3. Verify user's actual message is present

### Test 3: Timing Analysis
1. Record timestamps for:
   - `input_audio_buffer.committed` received
   - `conversation.item.created` received
   - `conversation.item.input_audio_transcription.completed` received
   - `response.create` sent
2. Calculate delays between each
3. If `response.create` sent before `conversation.item.created`, that's the bug!

---

## Quick Fixes to Try

### Fix 1: Add Delay Before Response (Hypothesis 1)
```typescript
// In maybeSendResponseForCommit()
commit.hasSentResponse = true;
commit.awaitingResponseCreate = false;

setTimeout(() => {
    console.log('⏱️ DELAYED RESPONSE - Sending response.create now');
    this.sendResponse();
}, 200); // 200ms delay
```

### Fix 2: Track User Items (Hypothesis 2)
```typescript
case 'conversation.item.created':
case 'conversation.item.added': {
    const createdEvent = serverEvent as any;
    if (createdEvent.item?.type === 'message') {
        const role = createdEvent.item?.role || 'unknown';
        const textParts = createdEvent.item.content?.filter((part: any) => part.type === 'text') || [];
        const content = textParts.map((part: any) => part.text).join(' ');

        // Track BOTH user and assistant items
        if (content && role !== 'unknown') {
            this.trackConversationItem(createdEvent.item.id, role, content);
            return { type: 'message', data: { role, content, timestamp: new Date() }};
        }
    }
    return { type: 'ignore', data: null };
}
```

### Fix 3: Explicit Response Context (Hypothesis 4)
```typescript
sendResponse(): void {
    // Instead of relying on implicit conversation state,
    // explicitly pass conversation items
    const responsePayload: Record<string, any> = {
        // Include last N conversation items explicitly
        input: this.conversationItems.slice(-10).map(item => ({
            type: 'item_reference',
            id: item.itemId
        }))
    };

    // ... rest of code
}
```

---

## Success Criteria
- [ ] User speaks → Agent responds to user's message (not its own)
- [ ] Logs show conversation.item.created (role=user) BEFORE response.create
- [ ] Conversation state snapshot shows alternating user/assistant messages
- [ ] No duplicate response.create events per user input

---

## Next Steps
1. Implement Phase 1 logging (conversation items)
2. Test with real conversation
3. Analyze logs to confirm/reject hypotheses
4. Try Fix 1 (add delay) if Hypothesis 1 confirmed
5. Iterate based on findings
