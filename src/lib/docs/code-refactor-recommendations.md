# Kaiwa Code Refactor Recommendations

**Purpose:** Specific file changes to support 30-day validation roadmap
**Priority:** Immediate (Week 0) vs. Week 2+ vs. Defer
**Timeline:** Changes aligned with `roadmap-oct-nov-2025.md`

---

## Priority 1: IMMEDIATE (Week 0, Days 1-3)

### 1. Remove Fake Social Proof (30 minutes)

**File:** [src/routes/+page.svelte](src/routes/+page.svelte#L354-365)

**Problem:**

```svelte
<!-- Lines 354-365: Unfounded claims -->
<div class="text-2xl font-bold text-primary md:text-3xl">5,000+</div>
<div class="text-xs opacity-70 md:text-sm">Conversations Completed</div>
...
<div class="text-2xl font-bold text-primary md:text-3xl">95%</div>
<div class="text-xs opacity-70 md:text-sm">Report Improved Confidence</div>
```

**Why this is critical:**

- With 5 users, "5,000+ conversations" kills credibility
- Visitors who try the product and find it empty will never return
- Honesty about early stage builds trust with early adopters

**Fix:**

```svelte
<!-- Replace section starting at line 347 -->
<section class="py-8 text-center md:py-12">
	<div class="container mx-auto max-w-4xl px-4">
		<h3 class="mb-6 text-xl font-semibold opacity-90 md:mb-8 md:text-2xl">
			Early Access — Build This With Us
		</h3>
		<div class="grid gap-6 md:grid-cols-2">
			<div class="rounded-lg bg-base-200 p-6 text-left">
				<div class="mb-3 text-3xl">🎯</div>
				<div class="mb-2 text-lg font-semibold">Honest Feedback Welcome</div>
				<div class="text-sm opacity-80">
					We're working with the first 100 users to build conversation scenarios that actually
					matter. Tell us what works and what doesn't — we're building this with you, not for you.
				</div>
			</div>
			<div class="rounded-lg bg-base-200 p-6 text-left">
				<div class="mb-3 text-3xl">💬</div>
				<div class="mb-2 text-lg font-semibold">Focus: Cross-Language Relationships</div>
				<div class="text-sm opacity-80">
					Especially if you're preparing to talk with your partner's family in their language. We
					know this anxiety intimately, and we're building scenarios that help.
				</div>
			</div>
		</div>
	</div>
</section>
```

**Deploy:** Immediately after testing locally

**Test:**

```bash
pnpm dev
# Visit localhost:5173
# Verify social proof section replaced with honest early access messaging
```

---

### 2. Add Exit Survey (2 hours)

**Problem:** Users drop off sessions, and we have zero insight into why.

**Solution:** Show exit survey when user leaves without completing session.

#### Step 1: Create Exit Survey Component

**File:** `src/lib/components/ExitSurvey.svelte` (new file)

```svelte
<script lang="ts">
	import { track } from '$lib/analytics/posthog';

	interface Props {
		sessionId: string;
		onClose: () => void;
	}

	let { sessionId, onClose }: Props = $props();

	let reason = $state('');
	let comment = $state('');
	let isSubmitting = $state(false);

	async function handleSubmit() {
		if (!reason) return;

		isSubmitting = true;

		try {
			// Track to PostHog
			track('exit_survey_submitted', {
				sessionId,
				reason,
				comment,
				timestamp: new Date().toISOString()
			});

			// Save to database
			await fetch('/api/feedback/exit-survey', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sessionId, reason, comment })
			});

			onClose();
		} catch (error) {
			console.error('Error submitting exit survey:', error);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<dialog class="modal-open modal">
	<div class="modal-box max-w-md">
		<h3 class="mb-4 text-xl font-bold">Quick Question Before You Go</h3>
		<p class="mb-4 text-base opacity-90">What conversation were you hoping to practice?</p>

		<div class="mb-4 space-y-2">
			<label class="flex cursor-pointer items-center gap-3 rounded-lg p-3 hover:bg-base-200">
				<input
					type="radio"
					name="reason"
					value="partner_family"
					bind:group={reason}
					class="radio radio-sm radio-primary"
				/>
				<span class="text-sm">Meeting my partner's family</span>
			</label>

			<label class="flex cursor-pointer items-center gap-3 rounded-lg p-3 hover:bg-base-200">
				<input
					type="radio"
					name="reason"
					value="heritage"
					bind:group={reason}
					class="radio radio-sm radio-primary"
				/>
				<span class="text-sm">Talking with heritage relatives (grandparents, etc.)</span>
			</label>

			<label class="flex cursor-pointer items-center gap-3 rounded-lg p-3 hover:bg-base-200">
				<input
					type="radio"
					name="reason"
					value="travel"
					bind:group={reason}
					class="radio radio-sm radio-primary"
				/>
				<span class="text-sm">Travel/survival conversations</span>
			</label>

			<label class="flex cursor-pointer items-center gap-3 rounded-lg p-3 hover:bg-base-200">
				<input
					type="radio"
					name="reason"
					value="business"
					bind:group={reason}
					class="radio radio-sm radio-primary"
				/>
				<span class="text-sm">Business/work scenarios</span>
			</label>

			<label class="flex cursor-pointer items-center gap-3 rounded-lg p-3 hover:bg-base-200">
				<input
					type="radio"
					name="reason"
					value="general"
					bind:group={reason}
					class="radio radio-sm radio-primary"
				/>
				<span class="text-sm">General practice</span>
			</label>

			<label class="flex cursor-pointer items-center gap-3 rounded-lg p-3 hover:bg-base-200">
				<input
					type="radio"
					name="reason"
					value="other"
					bind:group={reason}
					class="radio radio-sm radio-primary"
				/>
				<span class="text-sm">Something else</span>
			</label>
		</div>

		<textarea
			class="textarea-bordered textarea mb-4 w-full text-sm"
			placeholder="Anything else we should know? (optional)"
			rows="3"
			bind:value={comment}
		></textarea>

		<div class="modal-action">
			<button class="btn btn-ghost btn-sm" onclick={onClose} disabled={isSubmitting}> Skip </button>
			<button
				class="btn btn-sm btn-primary"
				onclick={handleSubmit}
				disabled={!reason || isSubmitting}
			>
				{isSubmitting ? 'Submitting...' : 'Submit'}
			</button>
		</div>
	</div>
	<!-- Backdrop -->
	<div class="modal-backdrop" onclick={onClose}></div>
</dialog>
```

#### Step 2: Add API Endpoint

**File:** `src/routes/api/feedback/exit-survey/+server.ts` (new file)

```typescript
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { analyticsEvents } from '$lib/server/db/schema';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const { sessionId, reason, comment } = await request.json();

		if (!sessionId || !reason) {
			return error(400, 'Missing required fields');
		}

		// Save to analytics_events table
		await db.insert(analyticsEvents).values({
			userId: locals.user?.id || null,
			sessionId,
			eventName: 'exit_survey_submitted',
			properties: {
				reason,
				comment: comment || null
			},
			createdAt: new Date()
		});

		return json({ success: true });
	} catch (err) {
		console.error('Error saving exit survey:', err);
		return error(500, 'Failed to save survey');
	}
};
```

#### Step 3: Integrate into Conversation Component

**File:** [src/lib/features/conversation/components/ConversationReviewableState.svelte](src/lib/features/conversation/components/ConversationReviewableState.svelte)

**Add imports:**

```svelte
<script lang="ts">
	// ... existing imports
	import ExitSurvey from '$lib/components/ExitSurvey.svelte';

	let showExitSurvey = $state(false);

	// Detect when user navigates away without completing
	import { onMount } from 'svelte';
	import { page } from '$app/state';

	onMount(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			// If session is active and not completed
			if (conversationStore.status === 'active' && !conversationStore.isCompleted) {
				showExitSurvey = true;
			}
		};

		window.addEventListener('beforeunload', handleBeforeUnload);

		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
		};
	});
</script>

<!-- Add to template -->
{#if showExitSurvey}
	<ExitSurvey sessionId={conversationStore.sessionId} onClose={() => (showExitSurvey = false)} />
{/if}
```

**Deploy:** Test locally, then deploy immediately

**Test:**

```bash
pnpm dev
# Start a conversation
# Close tab/navigate away without completing
# Verify exit survey appears
# Submit survey
# Check PostHog for "exit_survey_submitted" event
# Check database: SELECT * FROM analytics_events WHERE event_name = 'exit_survey_submitted';
```

---

### 3. Calculate Unit Economics (1 hour)

**File:** `scripts/calculate-unit-economics.ts` (new file)

```typescript
/**
 * Calculate unit economics based on OpenAI Realtime API usage
 *
 * Run: tsx scripts/calculate-unit-economics.ts
 */

// OpenAI Realtime API Pricing (as of Oct 2024)
const PRICING = {
	audioInputPerMin: 0.06, // $0.06 per minute of audio input
	audioOutputPerMin: 0.24, // $0.24 per minute of audio output
	textInputPer1M: 2.5, // $2.50 per 1M input tokens
	textOutputPer1M: 10.0 // $10.00 per 1M output tokens
};

// Test scenarios (fill in after running 10 sessions)
const TEST_SESSIONS = [
	// Example format:
	// { durationMin: 5, audioInputMin: 4, audioOutputMin: 3 },
	// Add your 10 test sessions here after dogfooding
];

function calculateSessionCost(session: {
	durationMin: number;
	audioInputMin: number;
	audioOutputMin: number;
}) {
	const audioInputCost = session.audioInputMin * PRICING.audioInputPerMin;
	const audioOutputCost = session.audioOutputMin * PRICING.audioOutputPerMin;
	const totalCost = audioInputCost + audioOutputCost;

	return {
		audioInputCost,
		audioOutputCost,
		totalCost
	};
}

function calculateMonthlyBurn(avgCostPerSession: number, sessionsPerMonth: number) {
	return avgCostPerSession * sessionsPerMonth;
}

// Run calculations
if (TEST_SESSIONS.length === 0) {
	console.log('❌ No test sessions recorded yet.');
	console.log('\n📋 Instructions:');
	console.log('1. Run 10 practice conversations yourself');
	console.log('2. Record: session duration, audio input time, audio output time');
	console.log('3. Add data to TEST_SESSIONS array in this file');
	console.log('4. Run: tsx scripts/calculate-unit-economics.ts');
} else {
	console.log('📊 Unit Economics Calculation\n');
	console.log('═'.repeat(50));

	const costs = TEST_SESSIONS.map(calculateSessionCost);
	const avgCost = costs.reduce((sum, c) => sum + c.totalCost, 0) / costs.length;

	console.log(`\n✅ Analyzed ${TEST_SESSIONS.length} sessions`);
	console.log(`\n💰 Cost per session (average): $${avgCost.toFixed(4)}`);
	console.log(
		`   • Audio input:  $${(costs.reduce((sum, c) => sum + c.audioInputCost, 0) / costs.length).toFixed(4)}`
	);
	console.log(
		`   • Audio output: $${(costs.reduce((sum, c) => sum + c.audioOutputCost, 0) / costs.length).toFixed(4)}`
	);

	console.log('\n📈 Monthly Burn Projections:');
	const scenarios = [
		{ users: 10, sessionsPerUser: 5 },
		{ users: 50, sessionsPerUser: 5 },
		{ users: 100, sessionsPerUser: 5 },
		{ users: 100, sessionsPerUser: 10 }
	];

	scenarios.forEach(({ users, sessionsPerUser }) => {
		const totalSessions = users * sessionsPerUser;
		const monthlyCost = calculateMonthlyBurn(avgCost, totalSessions);
		console.log(
			`   • ${users} users × ${sessionsPerUser} sessions: $${monthlyCost.toFixed(2)}/month`
		);
	});

	console.log('\n💡 Revenue Required to Break Even:');
	console.log(
		`   • At $10/month: ${Math.ceil(calculateMonthlyBurn(avgCost, 50) / 10)} paying users (50 sessions/month)`
	);
	console.log(
		`   • At $20/month: ${Math.ceil(calculateMonthlyBurn(avgCost, 50) / 20)} paying users (50 sessions/month)`
	);

	console.log('\n═'.repeat(50));
}
```

**Action:** Run 10 sessions yourself, fill in data, then run script

---

## Priority 2: WEEK 2 (Build Perfect Scenario)

### 4. Create Scenario Variations (8 hours)

**Current State:** 30+ scenarios exist, but they're generic.

**Goal:** Create 5 difficulty variations of ONE beachhead scenario.

**Assumption:** Based on Week 1 interviews, the beachhead is "Meeting Partner's Family"

**File:** [src/lib/data/scenarios.ts](src/lib/data/scenarios.ts)

**Current structure:**

```typescript
{
  id: 'relationship-family-update',
  title: 'Train Platform Family Call',
  description: 'Share good news with family.',
  category: 'relationships',
  difficulty: 'intermediate',
  // ...
}
```

**New structure (example for Level 1):**

```typescript
{
	id: 'partner-family-level-1-greetings',
	title: 'First Hello: Meeting Partner's Parents',
	description: 'Your first time meeting. Master the initial greetings and introductions.',
	category: 'relationships',
	difficulty: 'beginner',

	// Detailed instructions for AI
	instructions: `You are the parent of the user's partner. The user is meeting you for the first time at your home for dinner.

**Your role:**
- Warmly welcome the user
- Ask basic getting-to-know-you questions (work, hobbies, where they're from)
- Compliment their language ability (encouragingly, not patronizingly)
- Offer them food/drink
- Keep atmosphere light and welcoming

**Cultural context (adjust per language):**
${language === 'ja' ? `
- Use です・ます form (polite but not overly formal)
- Accept compliments modestly
- Show appreciation when they offer to help
- Gently correct if they use wrong formality level
` : ''}

**Topics to naturally bring up:**
- How long they've been learning the language
- What they do for work/study
- How they met your son/daughter
- Their family background

**Avoid:**
- Asking about marriage/kids too soon
- Politics or controversial topics
- Overly personal questions`,

	context: `You're arriving at your partner's parents' home for the first time. They've invited you for dinner. You brought a small gift (local sweets). Your palms are sweaty. This is the moment you've been preparing for.`,

	expectedOutcome: `Complete the introduction, gift exchange, and initial small talk. Goal: Make a warm first impression and set a comfortable tone.`,

	learningObjectives: [
		'Polite greetings in partner's language',
		'Gift-giving etiquette',
		'Basic self-introduction',
		'Answering "how did you meet?" question',
		'Accepting food/drink offers politely',
		'Reading formality cues'
	],

	comfortIndicators: {
		confidence: 3,  // Lower for first time
		engagement: 5,
		understanding: 4
	},

	// Personalization prompts (collect before scenario)
	personalizationPrompts: [
		{
			id: 'partner_name',
			question: "What's your partner's name?",
			type: 'text'
		},
		{
			id: 'relationship_length',
			question: 'How long have you been together?',
			type: 'text',
			placeholder: 'e.g., 2 years'
		},
		{
			id: 'gift_brought',
			question: 'What gift are you bringing?',
			type: 'text',
			placeholder: 'e.g., chocolates from my hometown'
		},
		{
			id: 'your_job',
			question: 'What do you do for work?',
			type: 'text'
		}
	],

	// Success criteria
	successMetrics: {
		minDurationMin: 3,
		expectedTurns: 8,
		keyPhrases: [
			'thank you for inviting me',
			'this is for you',
			'I\'ve heard so much about you',
			'the food looks delicious'
		]
	},

	isActive: true,
	createdAt: new Date(),
	updatedAt: new Date()
}
```

**Create 5 levels:**

1. **Level 1:** Greetings & First Impression
2. **Level 2:** Dinner Small Talk (job, family, hobbies)
3. **Level 3:** Relationship Questions (intentions, future plans)
4. **Level 4:** Handling Cultural Differences (gift etiquette, formality adjustments)
5. **Level 5:** Complex Family Dynamics (managing expectations, addressing concerns)

**File changes needed:**

- `src/lib/data/scenarios.ts`: Add 5 new scenario objects
- `src/lib/types/scenario.types.ts`: Add `personalizationPrompts` type
- `src/lib/services/instructions.service.ts`: Parse personalization into AI instructions

**Estimated time:** 8 hours (including testing each level)

---

### 5. Add Personalization System (4 hours)

**Goal:** Collect user context BEFORE scenario to make conversation feel personal.

**File:** `src/lib/components/ScenarioPersonalization.svelte` (new file)

```svelte
<script lang="ts">
	import type { PersonalizationPrompt } from '$lib/types/scenario.types';

	interface Props {
		prompts: PersonalizationPrompt[];
		onComplete: (answers: Record<string, string>) => void;
	}

	let { prompts, onComplete }: Props = $props();

	let answers = $state<Record<string, string>>({});
	let currentIndex = $state(0);

	const currentPrompt = $derived(prompts[currentIndex]);
	const isLastPrompt = $derived(currentIndex === prompts.length - 1);
	const canProceed = $derived(!!answers[currentPrompt.id]);

	function handleNext() {
		if (isLastPrompt) {
			onComplete(answers);
		} else {
			currentIndex++;
		}
	}

	function handleBack() {
		if (currentIndex > 0) currentIndex--;
	}
</script>

<div class="mx-auto max-w-md p-6">
	<div class="mb-8">
		<div class="mb-2 text-sm opacity-60">
			Question {currentIndex + 1} of {prompts.length}
		</div>
		<progress class="progress w-full progress-primary" value={currentIndex + 1} max={prompts.length}
		></progress>
	</div>

	<div class="mb-8">
		<h3 class="mb-4 text-2xl font-bold">{currentPrompt.question}</h3>

		{#if currentPrompt.type === 'text'}
			<input
				type="text"
				class="input-bordered input w-full text-lg"
				placeholder={currentPrompt.placeholder || ''}
				bind:value={answers[currentPrompt.id]}
				autofocus
			/>
		{:else if currentPrompt.type === 'select'}
			<select class="select-bordered select w-full text-lg" bind:value={answers[currentPrompt.id]}>
				<option value="">Choose...</option>
				{#each currentPrompt.options || [] as option}
					<option value={option}>{option}</option>
				{/each}
			</select>
		{/if}
	</div>

	<div class="flex gap-4">
		{#if currentIndex > 0}
			<button class="btn btn-ghost" onclick={handleBack}> Back </button>
		{/if}
		<button class="btn flex-1 btn-primary" onclick={handleNext} disabled={!canProceed}>
			{isLastPrompt ? 'Start Scenario' : 'Next'}
		</button>
	</div>
</div>
```

**Integration:**
File: [src/routes/conversation/+page.svelte](src/routes/conversation/+page.svelte)

Before starting conversation, show personalization if scenario has prompts:

```svelte
{#if selectedScenario?.personalizationPrompts && !personalizationComplete}
	<ScenarioPersonalization
		prompts={selectedScenario.personalizationPrompts}
		onComplete={(answers) => {
			personalizationAnswers = answers;
			personalizationComplete = true;
			// Pass answers to AI instructions
		}}
	/>
{:else}
	<!-- Existing conversation UI -->
{/if}
```

**Estimated time:** 4 hours

---

### 6. Success Page with Share CTA (2 hours)

**Goal:** When user completes scenario, show success page with easy sharing.

**File:** `src/lib/features/scenarios/components/ScenarioSuccess.svelte` (new file)

```svelte
<script lang="ts">
	import { share } from '$lib/utils/share';
	import { track } from '$lib/analytics/posthog';

	interface Props {
		scenarioTitle: string;
		attemptCount: number;
		partnerName?: string;
	}

	let { scenarioTitle, attemptCount, partnerName }: Props = $props();

	const shareText = `I just practiced "${scenarioTitle}" on Kaiwa${partnerName ? ` to prep for ${partnerName}'s family` : ''}. Feeling more confident! 💬`;
	const shareUrl = `https://trykaiwa.com/?ref=practice_share&scenario=${scenarioTitle}`;

	async function handleShare(method: 'native' | 'whatsapp' | 'copy') {
		track('scenario_share_clicked', { method, scenario: scenarioTitle });

		if (method === 'native' && navigator.share) {
			await navigator.share({ text: shareText, url: shareUrl });
		} else if (method === 'whatsapp') {
			const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
			window.open(whatsappUrl, '_blank');
		} else if (method === 'copy') {
			await navigator.clipboard.writeText(shareText + ' ' + shareUrl);
			// Show toast notification
		}
	}
</script>

<div class="modal-open modal">
	<div class="modal-box max-w-lg">
		<div class="mb-6 text-center">
			<div class="mb-4 text-6xl">✨</div>
			<h2 class="mb-2 text-2xl font-bold">Great Practice!</h2>
			<p class="text-lg opacity-90">
				You've practiced "{scenarioTitle}" {attemptCount} time{attemptCount > 1 ? 's' : ''}.
			</p>
		</div>

		<div class="mb-6 rounded-lg bg-base-200 p-4">
			<div class="mb-2 text-sm font-semibold">Next Steps:</div>
			<ul class="space-y-2 text-sm">
				<li>• Try the next difficulty level</li>
				<li>• Practice with your partner to show progress</li>
				<li>• Set a reminder to practice again tomorrow</li>
			</ul>
		</div>

		<div class="border-t border-base-300 pt-6">
			<div class="mb-4 text-center">
				<div class="mb-2 text-sm opacity-70">Know someone who needs this?</div>
				<div class="text-xs opacity-60">
					(Sharing helps us keep Kaiwa free for early users like you)
				</div>
			</div>

			<div class="flex justify-center gap-2">
				{#if navigator.share}
					<button class="btn btn-sm btn-primary" onclick={() => handleShare('native')}>
						Share
					</button>
				{/if}
				<button class="btn btn-outline btn-sm" onclick={() => handleShare('whatsapp')}>
					<span class="icon-[mdi--whatsapp] text-lg"></span>
					WhatsApp
				</button>
				<button class="btn btn-outline btn-sm" onclick={() => handleShare('copy')}>
					<span class="icon-[mdi--content-copy] text-lg"></span>
					Copy Link
				</button>
			</div>
		</div>

		<div class="modal-action">
			<button class="btn btn-ghost btn-sm" onclick={() => goto('/conversation')}>
				Practice Again
			</button>
		</div>
	</div>
</div>
```

**Estimated time:** 2 hours

---

## Priority 3: WEEK 3 (Retention Features)

### 7. Email Reminder System (4 hours)

**Goal:** Send "You haven't practiced in 3 days" email to drive return.

**Current state:** Email service exists (`src/lib/server/services/email-reminder.service.ts`) but not used.

**File to modify:** [src/lib/server/services/email-reminder.service.ts](src/lib/server/services/email-reminder.service.ts)

**Add cron job:** (Using your existing Fly.io deployment)

Create `src/routes/api/cron/send-reminders/+server.ts`:

```typescript
import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users, conversationSessions } from '$lib/server/db/schema';
import { sql, and, lt, isNotNull } from 'drizzle-orm';
import { sendEmail } from '$lib/server/services/email-service';

// Require auth header to prevent abuse
export const POST: RequestHandler = async ({ request }) => {
	const authHeader = request.headers.get('Authorization');

	// Simple secret check (set FLY_CRON_SECRET in Fly.io secrets)
	if (authHeader !== `Bearer ${process.env.FLY_CRON_SECRET}`) {
		return error(401, 'Unauthorized');
	}

	// Find users who:
	// 1. Have email verified
	// 2. Last session was 3 days ago
	// 3. Haven't been reminded in the last 7 days

	const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
	const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

	const usersToRemind = await db
		.select({
			id: users.id,
			email: users.email,
			displayName: users.displayName
		})
		.from(users)
		.leftJoin(conversationSessions, sql`${users.id} = ${conversationSessions.userId}`)
		.where(
			and(
				isNotNull(users.emailVerified),
				lt(users.lastUsage, threeDaysAgo)
				// TODO: Add last_reminded_at column to users table
			)
		)
		.groupBy(users.id);

	let emailsSent = 0;

	for (const user of usersToRemind) {
		try {
			await sendEmail({
				to: user.email,
				subject: 'We miss you at Kaiwa 💬',
				html: `
					<p>Hi ${user.displayName || 'there'},</p>

					<p>It's been a few days since your last practice session. Remember that conversation you wanted to master?</p>

					<p><strong>Even 3 minutes today can rebuild your confidence.</strong></p>

					<p><a href="https://trykaiwa.com/?utm_source=email&utm_medium=reminder&utm_campaign=3day_inactive" style="background:#3B82F6;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">Continue Practicing</a></p>

					<p>Best,<br>Hiro & the Kaiwa team</p>

					<p style="font-size:12px;color:#666;margin-top:24px;">
						Not interested anymore? <a href="https://trykaiwa.com/unsubscribe?email=${user.email}">Unsubscribe</a>
					</p>
				`
			});

			// TODO: Update user.last_reminded_at
			emailsSent++;
		} catch (err) {
			console.error(`Failed to send reminder to ${user.email}:`, err);
		}
	}

	return json({ success: true, emailsSent });
};
```

**Set up Fly.io cron:**
Add to `fly.toml`:

```toml
[http_service]
  processes = ["app"]

[[services]]
  [services.concurrency]
    type = "requests"
    hard_limit = 200
    soft_limit = 100

# Cron job to send reminders every 6 hours
[processes]
  app = "node build"
  cron = "*/6 * * * * curl -X POST -H 'Authorization: Bearer ${FLY_CRON_SECRET}' https://trykaiwa.com/api/cron/send-reminders"
```

**Alternative:** Use external cron service (cron-job.org, EasyCron) to hit the endpoint.

**Estimated time:** 4 hours (including adding `last_reminded_at` column to DB)

---

### 8. Session Count Display (30 minutes)

**Goal:** Show users "You've practiced this 3 times" to build momentum.

**File:** [src/routes/conversation/+page.svelte](src/routes/conversation/+page.svelte)

Add to top of conversation UI:

```svelte
{#if scenarioAttemptCount > 0}
	<div class="mb-4 alert alert-info">
		<span class="icon-[mdi--trophy] text-2xl"></span>
		<div>
			<div class="font-semibold">
				You've practiced this scenario {scenarioAttemptCount} time{scenarioAttemptCount > 1
					? 's'
					: ''}!
			</div>
			<div class="text-sm opacity-80">Keep going — repetition builds confidence.</div>
		</div>
	</div>
{/if}
```

**Backend query:**

```typescript
// In conversation/+page.server.ts
const attemptCount = await db
	.select({ count: sql`count(*)` })
	.from(scenarioAttempts)
	.where(
		and(
			eq(scenarioAttempts.userId, locals.user.id),
			eq(scenarioAttempts.scenarioId, selectedScenario.id)
		)
	);
```

**Estimated time:** 30 minutes

---

## Priority 4: DEFERRED (After Week 4 Decision)

### 9. Advanced Analytics Dashboard (8 hours)

**Only build if you have 20+ active users.**

Create founder dashboard:

- User cohort retention (D1, D7, D30)
- Scenario completion rates
- Drop-off points in funnel
- Top exit survey reasons

**File:** `src/routes/dev/analytics-dashboard/+page.svelte`

Use PostHog API or query `analytics_events` table directly.

---

### 10. Pricing Experiment Infrastructure (4 hours)

**Only build if you have users willing to pay.**

A/B test pricing:

- $10/mo vs. $15/mo vs. $20/mo
- Monthly vs. Annual
- Early backer discount

Already partially built in marketing hub. Full implementation needed for production.

---

### 11. Referral System (6 hours)

**Only build if users are organically sharing.**

"Give 1 month free, get 1 month free" system.

**Tables needed:**

- `referrals` (referrer_id, referred_user_id, status, reward_claimed)
- Track via `utm_source=referral&ref={userId}`

---

## Summary: What to Build When

| Week    | Priority    | Features                                                            | Time      | Deploy                  |
| ------- | ----------- | ------------------------------------------------------------------- | --------- | ----------------------- |
| Week 0  | 🔴 Critical | Remove fake social proof, Add exit survey, Calculate unit economics | 4 hours   | Immediately             |
| Week 2  | 🟡 High     | Perfect scenario (5 levels), Personalization, Success page          | 14 hours  | After Week 1 validation |
| Week 3  | 🟢 Medium   | Email reminders, Session count, Polish based on feedback            | 5 hours   | If users are returning  |
| Week 4+ | ⚪ Deferred | Analytics dashboard, Pricing tests, Referral system                 | 18+ hours | Only if PMF signal      |

**Total immediate work:** ~23 hours (Week 0 + Week 2)

---

## Testing Checklist

Before deploying each change:

### Week 0 Changes

- [ ] Homepage shows honest early access messaging (no fake numbers)
- [ ] Exit survey appears when user leaves mid-session
- [ ] Exit survey saves to `analytics_events` table
- [ ] PostHog receives `exit_survey_submitted` event
- [ ] Unit economics script runs with test data

### Week 2 Changes

- [ ] 5 scenario variations exist with different difficulty levels
- [ ] Personalization prompts appear before scenario starts
- [ ] User answers are passed to AI instructions
- [ ] Success page appears after completing scenario
- [ ] Share buttons work (native, WhatsApp, copy)
- [ ] PostHog receives `scenario_share_clicked` event

### Week 3 Changes

- [ ] Email reminder sent to inactive users (3 days)
- [ ] Session count displays correctly
- [ ] Users can opt out of reminders

---

## Deployment Commands

```bash
# Week 0: Immediate fixes
pnpm check
pnpm lint
pnpm test:unit
pnpm build
fly deploy

# Week 2: New features
pnpm db:generate  # If schema changes
pnpm db:push
pnpm check
pnpm test:e2e
fly deploy

# Week 3: Cron setup
fly secrets set FLY_CRON_SECRET=<random_secret>
# Update fly.toml with cron config
fly deploy
```

---

## Code Quality Notes

### Don't Overengineer

- You have 5 users. Premature optimization is the enemy.
- Use simple solutions: Google Sheets > PostHog dashboards
- Hardcode first, abstract later

### Follow Existing Patterns

- Repositories for DB access
- Services for business logic
- Svelte 5 runes syntax (`$state`, `$derived`, `$effect`)
- camelCase for all variables/functions

### Test Before Shipping

- Run `pnpm check` (TypeScript)
- Run `pnpm lint` (ESLint + Prettier)
- Run `pnpm test:e2e` (Playwright)
- Manually test the user flow

---

**Document Version:** 1.0
**Owner:** Founder (Hiro)
**Next:** Execute Week 0 changes within 24 hours
