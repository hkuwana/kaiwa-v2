# 🚀 Kaiwa - 3-Day MVP Architecture

## Overview

This is a simplified, maintainable architecture for the Kaiwa language learning platform. The goal is to have a working MVP in 3 days with a clean, easy-to-understand codebase.

## 🏗️ Architecture

### Three Clear Layers

1. **Services** (`/lib/services`) - The "doers"
   - Plain TypeScript classes with no Svelte dependencies
   - Contain all business logic
   - Manage WebRTC connections, audio processing, conversation logic

2. **Stores** (`/lib/stores`) - The "state holders"
   - Use Svelte 5 runes (`.svelte.ts`)
   - Single source of truth for UI state
   - Call services to perform actions and update their own state

3. **Components** (`/routes` & `/lib/components`) - The "viewers"
   - `.svelte` files that display data from stores
   - Call actions on stores when users interact with UI

### Data Flow

```
Component (UI) → calls action on → Store (State) → calls method on → Service (Logic) → updates → Store (State) → which updates → Component (UI)
```

## 📁 File Structure

```
src/
├── lib/
│   ├── services/           # Business logic (no Svelte)
│   │   ├── index.ts
│   │   ├── realtime.service.ts    # WebRTC connections
│   │   ├── audio.service.ts        # Audio device management
│   │   └── conversation.service.ts # Conversation logic
│   ├── stores/             # State management (Svelte 5 runes)
│   │   └── conversation.store.svelte.ts
│   └── components/         # UI components
├── routes/
│   ├── +page.svelte        # Home page
│   ├── +page.server.ts
│   ├── conversation/
│   │   ├── +page.svelte    # Conversation UI
│   │   └── +page.server.ts
│   └── ...
```

## 🎯 Key Services

### RealtimeService

- Manages WebRTC connections
- Handles data channels
- Processes incoming/outgoing messages
- No event bus dependency - uses callbacks

### AudioService

- Manages audio device selection
- Handles getUserMedia
- Monitors audio levels
- Device change detection

### ConversationService

- Manages conversation state
- Handles message flow
- Error management
- Session tracking

## 🔄 State Management

The conversation store uses Svelte 5 runes for reactive state:

```typescript
let status = $state<'idle' | 'connecting' | 'connected' | 'streaming' | 'error'>('idle');
let messages = $state<Message[]>([]);
let userId = $state<string | null>(null);
```

## 🚫 What Was Removed

- Complex event bus system (`/lib/shared/events/`)
- Multiple orchestrator files
- Complex kernel architecture
- Feature folders for non-MVP features (gamification, scenarios)

## ✅ What's Working

- Clean service architecture
- Simple state management
- Basic WebRTC connection
- Audio device management
- Conversation flow
- User/guest handling

## 🚧 What Needs Work

- WebRTC audio track integration
- OpenAI API integration
- Error handling improvements
- UI polish
- Testing

## 🚀 Getting Started

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Start development server:**

   ```bash
   pnpm dev
   ```

3. **Visit the app:**
   - Home page: `/`
   - Conversation: `/conversation`

## 🎯 Next Steps

### Day 2: Build Core UI & User Flow

- Wire up audio input to WebRTC
- Implement user/guest tracking
- Add conversation persistence

### Day 3: Polish & Deploy

- Cut non-essential features
- Add user feedback
- Test and deploy

## 💡 Benefits of This Architecture

1. **Simple Mental Model** - Three clear layers
2. **Easy to Change** - Modify one layer without breaking others
3. **Easy to Debug** - Clear data flow
4. **Fast Development** - No complex abstractions
5. **Testable** - Services can be unit tested independently
6. **Maintainable** - Clear separation of concerns

## 🔍 Code Examples

### Starting a Conversation

```typescript
// In a component
const { startConversation } = conversationStore;
await startConversation(userId, 'en', 'alloy');
```

### Service Callback Pattern

```typescript
// Service takes callbacks instead of emitting events
await realtimeService.connect(
	url,
	(message) => {
		/* handle message */
	},
	(state) => {
		/* handle connection state */
	}
);
```

### Store State Access

```typescript
// Reactive state in components
const { status, messages, error } = conversationStore;
```

This architecture eliminates the complexity that was slowing development and provides a solid foundation for building the MVP quickly and confidently.
