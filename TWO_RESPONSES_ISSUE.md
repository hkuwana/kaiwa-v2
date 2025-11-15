# Issue: Getting TWO Responses Per User Input

## 🔴 Current Problem

User speaks once → AI responds TWICE

### Example from Logs:
**User:** "Wait, but I thought you were joining me."

**AI Response 1:** "Sorry voor de verwarring! Ik ben hier om gezellig mee te praten..."

**AI Response 2:** "Wat zijn jouw favoriete drankjes om hier in de bar te bestellen?"

## 🔍 Root Cause

The commit cleanup code is **NOT executing**. We added this code:

```typescript
setTimeout(() => {
    this.sendResponse();

    // Cleanup code here
    setTimeout(() => {
        const commitIndex = this.pendingCommits.indexOf(commit);
        if (commitIndex !== -1) {
            this.pendingCommits.splice(commitIndex, 1);
            console.warn('🧹 CLEANED UP COMMIT...');
        }
    }, 1000);
}, 200);
```

**But the 🧹 cleanup log NEVER appears!**

### Evidence:
```
⏳ totalPendingCommits: 1
⏳ totalPendingCommits: 2  ← Growing
⏳ totalPendingCommits: 2  ← Not shrinking
```

Expected:
```
⏳ totalPendingCommits: 1
🧹 CLEANED UP COMMIT
⏳ totalPendingCommits: 1  ← Should stay at 1
🧹 CLEANED UP COMMIT
⏳ totalPendingCommits: 1
```

## 🐛 Why Cleanup Fails

### Possible Reasons:

1. **Nested setTimeout loses context**
   - The inner setTimeout might not execute
   - The `commit` variable might be out of scope

2. **Commit object changes**
   - The commit object might be modified between creation and cleanup
   - `indexOf()` might not find it

3. **Code path bypass**
   - Cleanup code might be in a branch that never executes
   - Some error might be silently failing

## ✅ THE FIX (APPLIED)

**Status:** ✅ Implemented immediate cleanup approach

We simplified the commit cleanup by removing the nested `setTimeout` and cleaning up immediately after sending the response.

### ✅ Applied Fix: Clean Up Immediately After Response

```typescript
setTimeout(() => {
    console.warn('⏱️ DELAYED RESPONSE - Sending response.create NOW', {
        commitNumber: commit.commitNumber,
        delayMs: 200
    });
    this.sendResponse();

    // 🔧 FIX: Clean up IMMEDIATELY instead of waiting
    const commitIndex = this.pendingCommits.indexOf(commit);
    if (commitIndex !== -1) {
        this.pendingCommits.splice(commitIndex, 1);
        console.warn('🧹 CLEANED UP COMMIT immediately after response', {
            commitNumber: commit.commitNumber,
            remainingPendingCommits: this.pendingCommits.length
        });
    } else {
        console.error('❌ Could not find commit to clean up', {
            commitNumber: commit.commitNumber,
            allCommitNumbers: this.pendingCommits.map(c => c.commitNumber)
        });
    }
}, 200);
```

**Why this is better:**
- No nested setTimeout
- Cleanup happens right after response
- Easier to debug
- More predictable

### Option 2: Clean Up by Commit Number (More Robust)

Find commits by their number instead of object reference:

```typescript
setTimeout(() => {
    this.sendResponse();

    // Find by commit number instead of object reference
    const commitIndex = this.pendingCommits.findIndex(c => c.commitNumber === commit.commitNumber);
    if (commitIndex !== -1) {
        this.pendingCommits.splice(commitIndex, 1);
        console.warn('🧹 CLEANED UP COMMIT...');
    }
}, 200);
```

**Why this is better:**
- Doesn't rely on object reference equality
- More reliable with Svelte's reactivity
- Won't fail if object is reassigned

### Option 3: Mark Commits as "Used" Instead of Removing

Instead of removing, just mark them as used:

```typescript
// In the commit type:
type PendingCommitEntry = {
    // ... existing fields
    isUsed: boolean;  // New field
};

// When creating commit:
const commitEntry: PendingCommitEntry = {
    // ... existing fields
    isUsed: false
};

// After sending response:
commit.isUsed = true;  // Mark as used

// When finding commits, skip used ones:
const activeCommit = this.pendingCommits.find(
    c => !c.isUsed && !c.hasReceivedCommitAck
);
```

**Why this is better:**
- No array manipulation
- Commits stay in memory for debugging
- Can periodically clean up old commits
- Easier to track history

## 🧪 Testing the Fix

After applying the fix, you should see:

```
✅ CONDITIONS MET - SENDING response.create
⏱️ DELAYED RESPONSE - Sending response.create NOW
🧹 CLEANED UP COMMIT immediately after response {commitNumber: 1, remainingPendingCommits: 0}

[User speaks again]

✅ CONDITIONS MET - SENDING response.create
⏱️ DELAYED RESPONSE - Sending response.create NOW
🧹 CLEANED UP COMMIT immediately after response {commitNumber: 2, remainingPendingCommits: 0}
```

And **only ONE assistant response** per user input!

## 📊 Expected Results

### Before Fix:
- User speaks
- TWO assistant responses
- `totalPendingCommits` keeps growing
- NO cleanup logs

### After Fix:
- User speaks
- ONE assistant response
- `totalPendingCommits` stays at 0-1
- See cleanup logs after each response

## 🚨 Immediate Action Required

The nested `setTimeout` cleanup is NOT working. We need to implement Option 1 (clean up immediately) or Option 3 (mark as used) ASAP.

**Recommended:** Use Option 1 (immediate cleanup) as it's the simplest and most predictable.
