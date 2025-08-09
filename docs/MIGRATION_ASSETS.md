# 📦 Migration Assets & File Inventory

> **Purpose**: Comprehensive inventory of existing files and strategic recommendations for v2 migration.

[![Migration Strategy](https://img.shields.io/badge/Strategy-Selective%20Migration-blue?style=for-the-badge)]()
[![File Analysis](https://img.shields.io/badge/Analysis-Complete-green?style=for-the-badge)]()
[![Recommendation](https://img.shields.io/badge/Recommendation-Fresh%20Start-orange?style=for-the-badge)]()

---

## 📊 Current Codebase Analysis

> **🔍 Analysis Result**: 60% of codebase has high technical debt. Selective migration recommended.

### 🎯 Files to Keep & Migrate

#### ✅ **UI Components (High Value)**

> **💰 Value Proposition**: Clean, reusable components that save development time.

| Component                              | Status      | Migration Strategy   | Value                     |
| -------------------------------------- | ----------- | -------------------- | ------------------------- |
| 🏷️ `Banner.svelte`                     | ✅ Keep     | Direct copy          | Marketing component       |
| 🔍 `ConversationDebug.svelte`          | ✅ Keep     | Direct copy          | Debug utility             |
| 🔄 `DevTierSwitcher.svelte`            | ✅ Keep     | Direct copy          | Development tool          |
| 🌍 `LanguageSelector.svelte`           | ✅ Keep     | Direct copy          | Core UI component         |
| 💬 `MessageBubble.svelte`              | 🔄 Refactor | Remove cross-imports | High value, needs cleanup |
| ⏳ `PracticeLoader.svelte`             | 🔄 Refactor | Event-driven version | Good UX, bad coupling     |
| 🎭 `Scenarios.svelte`                  | ✅ Keep     | Direct copy          | Clean UI component        |
| 📱 `SimpleMessageDisplay.svelte`       | ✅ Keep     | Direct copy          | Perfect component         |
| 🎮 `SimpleConversationControls.svelte` | ✅ Keep     | Direct copy          | Clean architecture        |

#### ✅ **Database & Server Logic (High Value)**

> **💪 Server-side Strength**: Much cleaner than frontend, high migration value.

| Component             | Status    | Migration Value | Notes                       |
| --------------------- | --------- | --------------- | --------------------------- |
| 🗄️ `db/`              | ✅ Keep   | 🔥 Critical     | Database schema is solid    |
| 🏦 `repositories/`    | ✅ Keep   | 💰 High         | Clean data access layer     |
| ⚙️ `services/`        | 🔄 Review | 🟡 Medium       | Some cleanup needed         |
| 🔐 `auth.ts`          | ✅ Keep   | 💰 High         | Authentication logic works  |
| 🖥️ Other server files | ✅ Keep   | 💰 High         | Server-side is much cleaner |

#### ✅ **Static Assets & Configuration (High Value)**

```
static/                             # ✅ Keep - All static assets
messages/                           # ✅ Keep - Internationalization
project.inlang/                     # ✅ Keep - i18n configuration
package.json                        # 🔄 Update - Dependencies review
tailwind.config.js                  # ✅ Keep - Styling configuration
tsconfig.json                       # 🔄 Update - Stricter settings
```

### 🔄 Files to Refactor & Modernize

#### **Core Services (Rebuild with New Architecture)**

```
src/lib/features/
├── audio/
│   ├── services/audioService.ts         # 🔄 Rebuild - Use new architecture
│   ├── components/Microphone.svelte     # 🔄 Refactor - Props-based
│   └── stores/recordingStore.svelte     # 🔄 Rebuild - Functional store
├── conversation/
│   ├── services/conversationService.ts  # ✅ Keep - Already migrated
│   ├── services/messageHandler.svelte.ts # 🔄 Refactor - Remove cross-imports
│   └── stores/practice.svelte.ts        # ✅ Keep - Already migrated
├── realtime/
│   ├── services/realtimeService.ts      # ✅ Keep - Already migrated
│   └── services/webrtcService.svelte.ts # 🔄 Refactor - Event-driven
└── [Other features]                     # 🔄 Systematic refactor needed
```

### ❌ Files to Discard or Replace

#### **Legacy Code (High Technical Debt)**

```
src/lib/features/conversation/services/
├── managerRecordingState.svelte.ts     # ❌ Discard - Replaced by events
├── conversationManager.svelte.ts       # ❌ Discard - Monolithic service
└── messageService.svelte.ts            # ❌ Discard - Tight coupling

src/lib/features/analysis/stores/
└── conversationStats.svelte.ts         # ✅ Keep - Already migrated

Legacy patterns throughout codebase:
├── Class-based services                # ❌ Replace with functional
├── Direct cross-feature imports        # ❌ Replace with events
├── Mutable global state               # ❌ Replace with immutable stores
└── Mixed architectural patterns        # ❌ Standardize on functional
```

## **MIGRATION_ASSETS.md** (Updated)

````markdown
# 📦 MVP Assets: What to Take, What to Leave

> **Purpose**: Quick reference for 7-day MVP sprint - only take what helps ship faster.

## ✅ Copy These (Save Time)

### From Current Codebase

```typescript
// 1. API Keys & Environment
.env.local                    // API keys
src/lib/server/auth.ts       // Auth logic (if simple)

// 2. Utility Functions (if pure)
convertAudioFormat()         // If you have it
processTranscription()       // If it works
generatePrompt()            // Core logic

// 3. UI Components (if clean)
Button.svelte               // If no dependencies
AudioVisualizer.svelte      // If standalone
MessageBubble.svelte        // If props-based

// 4. Tailwind Config
tailwind.config.js          // Saves setup time
app.css                     // Base styles
```
````

### From External Sources

```bash
# Quick setup commands
npm create svelte@latest kaiwa-mvp -- --template skeleton --types typescript
npm install
npm install -D tailwindcss autoprefixer
```

## ❌ Leave These (Start Fresh)

```typescript
// Complex service layers
ConversationManager.ts      // Too coupled
AudioService.ts            // Rebuild simpler
MessageHandler.ts          // Over-engineered

// State management
stores/*                   // Use Svelte 5 $state
eventBus.ts               // Simpler orchestrator
Redux/Zustand             // Not needed

// Complex features
gamification/*            // Week 2+
analytics/*               // Week 2+
payments/*                // Week 3+
```

## 🎯 Day 1 Starting Template

### Project Structure (Minimal)

```
kaiwa-mvp/
├── src/
│   ├── lib/
│   │   ├── kernel.ts          # Core logic (create this)
│   │   └── adapters.ts        # External services
│   ├── routes/
│   │   └── +page.svelte       # Entire UI
│   └── app.html               # HTML template
├── static/
│   └── favicon.png
├── package.json
└── README.md                  # Document decisions
```

### kernel.ts (Starting Point)

```typescript
// This is your ENTIRE backend for Day 1
export type State = {
	status: 'idle' | 'recording' | 'processing';
	messages: Array<{ role: string; content: string }>;
};

export function createKernel() {
	let state: State = { status: 'idle', messages: [] };

	return {
		getState: () => state,

		startRecording: () => {
			state = { ...state, status: 'recording' };
			return state;
		},

		stopRecording: async (audio: ArrayBuffer) => {
			state = { ...state, status: 'processing' };

			// Fake it till you make it
			const transcript = 'Hello, how are you?'; // TODO: Real transcription
			const response = "I'm doing well!"; // TODO: Real AI

			state = {
				status: 'idle',
				messages: [
					...state.messages,
					{ role: 'user', content: transcript },
					{ role: 'assistant', content: response }
				]
			};

			return { transcript, response };
		}
	};
}
```

### +page.svelte (Complete UI)

```svelte
<script lang="ts">
	import { createKernel } from '$lib/kernel';

	const kernel = createKernel();
	let state = $state(kernel.getState());
	let mediaRecorder: MediaRecorder | null = null;

	async function toggleRecording() {
		if (state.status === 'idle') {
			// Start recording
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			mediaRecorder = new MediaRecorder(stream);

			const chunks: BlobPart[] = [];
			mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

			mediaRecorder.onstop = async () => {
				const blob = new Blob(chunks);
				const audio = await blob.arrayBuffer();

				// Process with kernel
				const result = await kernel.stopRecording(audio);
				state = kernel.getState();

				// Simple TTS for now
				const utterance = new SpeechSynthesisUtterance(result.response);
				speechSynthesis.speak(utterance);
			};

			mediaRecorder.start();
			state = kernel.startRecording();
		} else if (state.status === 'recording' && mediaRecorder) {
			// Stop recording
			mediaRecorder.stop();
			mediaRecorder.stream.getTracks().forEach((t) => t.stop());
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50">
	<div class="space-y-8 text-center">
		<h1 class="text-4xl font-bold">Kaiwa MVP</h1>

		<!-- Messages -->
		{#if state.messages.length > 0}
			<div class="mx-auto max-w-md space-y-2">
				{#each state.messages as msg}
					<div class="rounded p-3 {msg.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'}">
						{msg.content}
					</div>
				{/each}
			</div>
		{/if}

		<!-- Single button -->
		<button
			onclick={toggleRecording}
			class="rounded-full px-8 py-4 text-xl font-semibold transition
             {state.status === 'recording' ? 'animate-pulse bg-red-500' : 'bg-blue-500'}
             text-white hover:scale-105"
		>
			{state.status === 'recording' ? '⏹ Stop' : '🎤 Start'}
		</button>

		<p class="text-gray-600">
			{state.status === 'processing' ? 'Processing...' : 'Click to start speaking'}
		</p>
	</div>
</div>
```

## 🚀 Quick Wins for Each Day

### Day 1 Quick Wins

- [ ] Use Web Speech API as backup
- [ ] Hardcode responses initially
- [ ] Single file architecture
- [ ] No build optimization

### Day 2 Quick Wins

- [ ] Use Vercel AI SDK
- [ ] Simple prompt templates
- [ ] Browser TTS initially
- [ ] LocalStorage for state

### Day 3 Quick Wins

- [ ] Tailwind CDN first
- [ ] Simple animations only
- [ ] Mobile-first design
- [ ] No custom fonts yet

### Day 4 Quick Wins

- [ ] Keep UI minimal
- [ ] No dark mode yet
- [ ] Basic error toasts
- [ ] Simple loading states

### Day 5 Quick Wins

- [ ] Google One-Tap signin
- [ ] Skip email/password
- [ ] No user profiles yet
- [ ] Anonymous by default

### Day 6 Quick Wins

- [ ] Deploy to Vercel (easiest)
- [ ] Basic error tracking only
- [ ] No analytics yet
- [ ] Simple health check

### Day 7 Quick Wins

- [ ] Twitter/X announcement
- [ ] HackerNews Show post
- [ ] Friends & family beta
- [ ] Single landing page

## 📝 Copy-Paste Resources

### API Integration (Day 2)

```typescript
// OpenAI Whisper
async function transcribe(audio: ArrayBuffer): Promise<string> {
	const formData = new FormData();
	formData.append('file', new Blob([audio], { type: 'audio/webm' }));
	formData.append('model', 'whisper-1');

	const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
		method: 'POST',
		headers: { Authorization: `Bearer ${OPENAI_KEY}` },
		body: formData
	});

	const { text } = await response.json();
	return text;
}

// Quick AI response
async function getResponse(prompt: string): Promise<string> {
	const response = await fetch('https://api.openai.com/v1/chat/completions', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${OPENAI_KEY}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			model: 'gpt-3.5-turbo',
			messages: [
				{ role: 'system', content: 'You are a helpful language tutor.' },
				{ role: 'user', content: prompt }
			],
			max_tokens: 100
		})
	});

	const data = await response.json();
	return data.choices[0].message.content;
}
```

### Deploy Commands (Day 6)

```bash
# Vercel (easiest)
npm i -g vercel
vercel

# Netlify (alternative)
npm i -g netlify-cli
netlify deploy

# Quick fixes
echo "node_modules" > .gitignore
git init && git add . && git commit -m "MVP"
```

## ✅ Definition of Done (Per Day)

### Day 1-2 Done

- [ ] Can record audio
- [ ] Can play response
- [ ] No crashes
- [ ] Works locally

### Day 3-4 Done

- [ ] Looks good on mobile
- [ ] Clear UI states
- [ ] Smooth interactions
- [ ] Friend says "cool"

### Day 5-6 Done

- [ ] Deployed online
- [ ] Works on phones
- [ ] Can sign in (optional)
- [ ] Data persists

### Day 7 Done

- [ ] 10 people tried it
- [ ] 5 full conversations
- [ ] Posted publicly
- [ ] Gathering feedback

---

_Remember: Every line of code should help users have conversations. If it doesn't, cut it._

```

These updated documents focus on:

1. **Radical simplification** - One conversation loop, one UI component, one state tree
2. **2-day sprints** - Concrete deliverables every 48 hours
3. **Progressive enhancement** - Core works without auth, persistence, or advanced features
4. **Functional architecture** - But only where it helps ship faster
5. **7-day timeline** - From zero to deployed MVP with real users

The key insight: **Stop building infrastructure and start building the conversation experience**. Everything else can wait until Week 2.
```
