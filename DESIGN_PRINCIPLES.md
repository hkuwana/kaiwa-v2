# 🎨 Kaiwa Design Principles & Architecture Guidelines

> **Core Philosophy**: Ship the magical conversation experience first. Everything else is enhancement.

[![Architecture](https://img.shields.io/badge/Architecture-Functional%20Core-blue?style=for-the-badge)]()
[![Pattern](https://img.shields.io/badge/Pattern-Domain%20Driven-green?style=for-the-badge)]()
[![Timeline](https://img.shields.io/badge/Timeline-2%20Day%20Sprints-orange?style=for-the-badge)]()

---

## 🏗️ Architectural Principles

### 1. 🎯 Domain-Driven Design (Not Technical Features)

> **Golden Rule**: Organize by **learning domains**, not technical capabilities.

#### ✅ **GOOD: Domain Boundaries**

```
✅ GOOD: Domain boundaries
src/domains/
├── 🎯 learning/          # Core learning loop (THE KERNEL)
├── 🔐 identity/          # User & auth (OPTIONAL)
└── 🏗️ infrastructure/    # Technical adapters

❌ BAD: Technical feature boundaries
src/features/audio/    # This couples UI with technical concerns
```

### 2. ⚛️ Functional Core, Imperative Shell

> **Architecture Rule**: Pure business logic at the center, side effects at the edges.

#### ✅ **GOOD: Pure Functional Core**

```typescript
// ✅ GOOD: Pure functional core
const core = {
	// All business logic as pure functions
	nextState: (state: State, action: Action) => State,
	calculateScore: (expected: string, actual: string) => number
};

// Imperative shell (adapters only)
const shell = {
	audio: { record: () => Promise<ArrayBuffer> },
	ai: { complete: (prompt: string) => Promise<string> }
};

// ❌ BAD: Mixed concerns
class AudioService {
	state = { recording: false }; // Mutable state
	async record() {
		/* side effects mixed with logic */
	}
}
```

### 3. Single State Tree with Derived Values

**Rule**: One source of truth, derive everything else.

```typescript
// ✅ GOOD: Single state tree
type AppState = {
	conversation: ConversationState;
	user: UserState;
};

// Derive computed values
const isRecording = $derived(state.conversation.status === 'recording');
const progress = $derived(calculateProgress(state.conversation.history));

// ❌ BAD: Multiple stores with shared state
const audioStore = writable({ recording: false });
const conversationStore = writable({ messages: [] });
```

### 4. Orchestrator Pattern (Not Event Bus)

**Rule**: Use a central orchestrator for coordination, not distributed events.

```typescript
// ✅ GOOD: Orchestrator pattern
const orchestrator = {
  state: appState,
  dispatch: (action: Action) => {
    const newState = core.transition(state, action);
    const effects = core.effects(state, action);
    effects.forEach(shell.execute);
    state = newState;
  }
};

// ❌ BAD: Complex event chains
eventBus.on('audio.recorded', () =>
  eventBus.emit('transcription.start', ...));
```

## 🎯 The Kernel: Core Conversation Loop

### Day 1-2: Build ONLY This

```typescript
// The ENTIRE core in one file initially
interface ConversationKernel {
	// Start a conversation
	start(): { sessionId: string };

	// User speaks
	speak(audio: ArrayBuffer): Promise<{
		transcript: string;
		response: string;
		audioResponse: ArrayBuffer;
	}>;

	// End conversation
	end(): {
		duration: number;
		exchanges: number;
		transcript: string[];
	};
}

// Implementation
export function createConversationKernel(): ConversationKernel {
	let state = {
		sessionId: crypto.randomUUID(),
		startTime: Date.now(),
		exchanges: []
	};

	return {
		start: () => ({ sessionId: state.sessionId }),

		speak: async (audio) => {
			// 1. Transcribe
			const transcript = await adapters.whisper.transcribe(audio);

			// 2. Generate response
			const response = await adapters.ai.complete(transcript);

			// 3. Generate audio
			const audioResponse = await adapters.tts.synthesize(response);

			// 4. Update state
			state.exchanges.push({ transcript, response });

			return { transcript, response, audioResponse };
		},

		end: () => ({
			duration: Date.now() - state.startTime,
			exchanges: state.exchanges.length,
			transcript: state.exchanges
		})
	};
}
```

## 📁 Simplified Structure

```
src/
├── kernel/                    # Day 1-2: Core conversation loop
│   ├── conversation.ts        # The kernel
│   └── adapters.ts           # Audio/AI interfaces
├── app/                      # Day 3-4: Application layer
│   ├── orchestrator.ts       # State management
│   └── App.svelte            # Main UI
├── enhance/                  # Day 5-6: Enhancements
│   ├── auth/                 # Optional auth
│   ├── persist/              # Save conversations
│   └── analyze/              # Progress tracking
└── routes/                   # SvelteKit routes
    └── +page.svelte          # Single page initially
```

## 🚀 2-Day Sprint Cycles

### Days 1-2: The Kernel Sprint

**Goal**: Working conversation loop

```typescript
// Deliverable: Single file that works
// src/kernel/conversation.ts
export async function startConversation() {
	const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
	const recorder = new MediaRecorder(mic);

	// Record → Transcribe → Respond → Play
	recorder.ondataavailable = async (e) => {
		const audio = await e.data.arrayBuffer();
		const { response } = await kernel.speak(audio);
		await playAudio(response);
	};

	return { recorder };
}
```

### Days 3-4: The Experience Sprint

**Goal**: Beautiful, simple UI

```svelte
<!-- Deliverable: One perfect component -->
<script lang="ts">
	import { kernel } from './kernel';

	let state = $state('idle');
	let conversation = $state(null);

	async function toggleRecording() {
		if (state === 'idle') {
			conversation = await kernel.start();
			state = 'recording';
		} else {
			const summary = await kernel.end();
			state = 'idle';
		}
	}
</script>

<button class="record-button" class:recording={state === 'recording'} onclick={toggleRecording}>
	{state === 'recording' ? '⏹' : '🎤'}
</button>
```

### Days 5-6: The Enhancement Sprint

**Goal**: Auth & persistence (but app works without them)

```typescript
// Progressive enhancement - app still works if these fail
const enhancements = {
	auth: {
		tryAutoLogin: async () => {
			try {
				return await googleAuth.signInSilently();
			} catch {
				return null; // Continue anonymously
			}
		}
	},

	persist: {
		trySave: async (conversation) => {
			try {
				await api.save(conversation);
			} catch {
				localStorage.setItem('backup', JSON.stringify(conversation));
			}
		}
	}
};
```

### Day 7: The Polish Sprint

**Goal**: Deploy and iterate based on real usage

## 🎯 Success Metrics

- **Day 2**: Can have a conversation (even if rough)
- **Day 4**: Feels magical to use
- **Day 6**: Can save progress and return
- **Day 7**: Deployed and gathering feedback

## ✅ Quality Checklist (Simplified)

For MVP Launch:

- [ ] Conversation loop works (Day 2)
- [ ] UI is delightful (Day 4)
- [ ] Optional auth works (Day 6)
- [ ] Deployed to production (Day 7)

Post-MVP:

- [ ] Tests for kernel functions
- [ ] Performance optimization
- [ ] Error handling
- [ ] Analytics

---

_For MVP: Perfect is the enemy of shipped. Ship the magic, enhance iteratively._

```

```
