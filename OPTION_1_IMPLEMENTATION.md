# Option 1: Drop-in Replacement Implementation

This is the EXACT code you need to change in your conversation store to use the OpenAI Agents package.

## Step 1: Update Your Conversation Store Import

**Find this line in your `conversation.store.svelte.ts`:**
```typescript
// Old import (remove this):
import * as realtimeService from '../services/realtime.service';
```

**Replace with:**
```typescript
// New import:
import { realtimeCompatibilityService } from '../services/realtime-agents.service';
```

## Step 2: Update Your Connection Creation

**Find your connection creation code (something like this):**
```typescript
// Old way (remove this):
const connection = await realtimeService.createConnection(sessionData, audioStream);
```

**Replace with:**
```typescript
// New way:
const connection = await realtimeCompatibilityService.createConnection(
  sessionData,
  audioStream,
  scenario,           // Your scenario object
  userManager.user,   // Your user object  
  this.language,      // Your language object
  preferences,        // Your preferences object
  speaker             // Your speaker object (optional)
);
```

## Step 3: Remove Manual Session Configuration (Optional)

**You can remove these lines (the new service handles this automatically):**
```typescript
// Remove these lines:
const sessionUpdate = realtimeService.createSessionUpdate({
  instructions: scenarioConfig.instructions,
  voice: scenarioConfig.voice,
  // ... other config
});
realtimeService.sendEvent(connection, sessionUpdate);
```

## Step 4: Remove Manual Response Creation (Optional)

**You can also remove manual response.create events:**
```typescript
// Remove these manual event creations:
const event: any = {
  type: 'response.create',
  response: {
    modalities,
    input: [],
    instructions
  }
};
```

## What This Fixes:
- ✅ Eliminates "Unknown parameter: 'session.modalities'" errors
- ✅ Eliminates "Unknown parameter: 'response.modalities'" errors  
- ✅ Eliminates "Missing required parameter: 'session.type'" errors
- ✅ AI automatically starts conversation with scenario-appropriate message
- ✅ Proper session configuration using official OpenAI package

## Expected Result:
After these changes, your conversation should start automatically with the AI speaking the correct greeting for your scenario, without any API errors.

## Testing:
1. Make the above changes
2. Start a conversation
3. The AI should immediately speak without manual triggers
4. No more error messages in the console
5. Smooth conversation flow

## Troubleshooting:
If you get TypeScript errors, make sure:
- `scenario` is your current scenario object (can be undefined)
- `userManager.user` is your user object
- `this.language` is your language object
- `preferences` is your user preferences object
- `speaker` is your speaker object (can be undefined)

The compatibility service will handle all the configuration automatically!