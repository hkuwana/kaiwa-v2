# 📊 Clean Usage Service Documentation

## Overview

Clean, pure function-based usage tracking service that wraps your existing `UserUsageRepository` with tier-aware business logic.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌──────────────────┐
│   Your App      │───▶│  usage.service  │───▶│ userUsageRepo    │
│                 │    │  (Pure Functions)│    │ (Database)       │
└─────────────────┘    └─────────────────┘    └──────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │  serverTierConfigs│
                       │  (Limits)        │
                       └─────────────────┘
```

## Usage Patterns

### 1. Check Before Use

```typescript
import { usageService } from '$lib/server/services/usage.service';

// Check if user can start conversation
const check = await usageService.canUseFeature(userId, { type: 'conversation' });
if (!check.canUse) {
	return { error: check.reason };
}

// Check if user can use 10 minutes
const timeCheck = await usageService.canUseFeature(userId, {
	type: 'seconds',
	amount: 600
});
```

### 2. Record After Use

```typescript
// Record single usage
await usageService.recordConversation(userId);
await usageService.recordSeconds(userId, 600);
await usageService.recordRealtimeSession(userId);

// Record multiple at once
await usageService.recordUsage(userId, {
	conversations: 1,
	seconds: 600,
	realtimeSessions: 1
});
```

### 3. Get Summary for UI

```typescript
const summary = await usageService.getUsageSummary(userId);

// Returns comprehensive data:
// - Current usage vs limits
// - Available time/conversations/sessions
// - Feature access based on tier
// - Status indicators (near limits, at limits)
```

## API Endpoints

### Production API: `/api/usage`

**GET** - Check usage

```bash
# Get full summary
GET /api/usage?action=summary

# Check specific feature
GET /api/usage?action=check&type=conversation
GET /api/usage?action=check&type=seconds&amount=600
GET /api/usage?action=check&type=realtime_session
```

**POST** - Record usage

```json
POST /api/users/[id]/usage
{
  "action": "record",
  "data": {
    "conversations": 1,
    "seconds": 600,
    "realtimeSessions": 1
  }
}

// Record single
POST /api/usage
{
  "action": "record_conversation"
}
```

### Debug API: `/api/dev/usage-debug` (dev only)

Includes additional test actions like simulate heavy usage, reset usage, etc.

## Debug Page

Visit `/dev-usage` for interactive testing:

- ✅ **Real-time usage display** - See current usage vs tier limits
- ✅ **Feature checks** - Test if user can use specific features
- ✅ **Record actions** - Add test usage data
- ✅ **Usage history** - View past months
- ✅ **Status indicators** - Visual feedback on limits

## Integration Examples

### In Conversation Service

```typescript
// Before starting conversation
const canStart = await usageService.canUseFeature(userId, { type: 'conversation' });
if (!canStart.canUse) {
	throw new Error(canStart.reason);
}

// After conversation ends
await usageService.recordUsage(userId, {
	conversations: 1,
	seconds: conversationDurationSeconds
});
```

### In Realtime Service

```typescript
// Before starting realtime session
const [canStart, canUseTime] = await Promise.all([
	usageService.canUseFeature(userId, { type: 'realtime_session' }),
	usageService.canUseFeature(userId, { type: 'seconds', amount: 600 })
]);

if (!canStart.canUse || !canUseTime.canUse) {
	throw new Error('Usage limits reached');
}

// After session
await usageService.recordUsage(userId, {
	realtimeSessions: 1,
	seconds: actualDurationSeconds
});
```

### In UI Components

```typescript
// Get usage data for dashboard
const summary = await usageService.getUsageSummary(userId);

// Show user their limits
console.log(`You have ${summary.conversations.available} conversations left`);
console.log(`You have ${summary.seconds.availableMinutes} minutes left`);

// Show warnings
if (summary.status.nearLimits) {
	showWarning('You are approaching your monthly limits');
}
```

## Benefits

✅ **Pure Functions** - No side effects, easy to test
✅ **Tier-Aware** - Automatically enforces limits from `serverTierConfigs`
✅ **Wraps Existing Code** - Uses your `UserUsageRepository`
✅ **Banking Support** - Handles Plus/Premium rollover seconds
✅ **Clean API** - Simple check → use → record pattern
✅ **Debug Tools** - Interactive testing page
✅ **Production Ready** - Clean `/api/usage` endpoint

## Testing

1. **Start dev server**: `pnpm dev`
2. **Visit debug page**: http://localhost:5174/dev-usage
3. **Log in** and test the usage tracking
4. **Try the API**: `curl http://localhost:5174/api/usage?action=summary`

The system is **completely modular** and works with your existing repository pattern! 🎯
