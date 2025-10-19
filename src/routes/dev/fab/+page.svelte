<script lang="ts">
	import ConversationFab from '$lib/features/conversation/components/ConversationFab.svelte';
	import { GUEST_USER } from '$lib/data/user';
	import type { User } from '$lib/server/db/types';
	import { SvelteDate } from 'svelte/reactivity';

	const demoUser: User = {
		...GUEST_USER,
		id: 'demo-user',
		displayName: 'Aria Learner',
		email: 'learner@example.com',
		username: 'aria',
		emailVerified: new SvelteDate()
	};

	let isLoggedIn = $state(true);
	let timerActive = $state(true);
	let timeRemaining = $state(185);
	let lastAction = $state('Interact with the FAB to see action logs.');

	const user = $derived(isLoggedIn ? demoUser : GUEST_USER);
	const sliderLabel = $derived(formatDemoTime(timeRemaining));

	const logAction = (label: string) => {
		const now = new SvelteDate().toLocaleTimeString();
		lastAction = `${now} — ${label}`;
		console.info('[Conversation FAB demo]', label);
	};

	const handleEndConversation = () => {
		logAction('End conversation');
		timerActive = false;
	};

	const handleRestartConversation = () => {
		logAction('Restart conversation');
		timeRemaining = 180;
		timerActive = true;
	};

	const handleToggleUser = () => {
		isLoggedIn = !isLoggedIn;
		timeRemaining = 185;
		timerActive = true;
		logAction(isLoggedIn ? 'Switched to mock logged-in user' : 'Switched to guest user');
	};

	const handleResetTimer = () => {
		timeRemaining = 185;
		logAction('Timer reset to 3m');
	};

	const handleToggleTimer = () => {
		timerActive = !timerActive;
		logAction(timerActive ? 'Timer resumed' : 'Timer paused');
	};

	const handleSliderCommit = () => {
		logAction(`Timer set to ${sliderLabel}`);
	};

	function formatDemoTime(seconds: number) {
		const value = Number(seconds);
		if (!Number.isFinite(value) || value <= 0) return '0s';
		if (value > 60) return `${Math.ceil(value / 60)}m`;
		return `${Math.floor(value)}s`;
	}
</script>

<div class="space-y-8 px-4 py-8">
	<header class="space-y-2">
		<h1 class="text-3xl font-bold">Conversation FAB Playground</h1>
		<p class="max-w-2xl text-base-content/70">
			Explore the simplified floating action button states for guests and signed-in learners.
		</p>
	</header>

	<section class="rounded-xl border border-base-300 bg-base-200/40 p-6 shadow-sm">
		<div class="flex flex-wrap items-center justify-between gap-4">
			<div>
				<h2 class="text-xl font-semibold">Scenario controls</h2>
				<p class="text-sm text-base-content/70">
					Switch persona, tweak the timer, and trigger callbacks to explore the FAB behaviour.
				</p>
			</div>
			<div class="flex flex-wrap gap-2">
				<button class="btn btn-sm" type="button" onclick={handleToggleUser}>
					{isLoggedIn ? 'View as guest' : 'View as member'}
				</button>
				<button class="btn btn-sm" type="button" onclick={handleResetTimer}>Reset timer</button>
				<button class="btn btn-sm" type="button" onclick={handleToggleTimer}>
					{timerActive ? 'Pause timer' : 'Resume timer'}
				</button>
			</div>
		</div>

		<div class="mt-6 grid gap-6 md:grid-cols-2">
			<div class="space-y-2">
				<label class="text-sm font-semibold" for="timer-range">Time remaining</label>
				<input
					id="timer-range"
					class="range range-primary"
					type="range"
					min="0"
					max="600"
					step="1"
					value={timeRemaining}
					oninput={(event) =>
						(timeRemaining = Number((event.currentTarget as HTMLInputElement).value))}
					onchange={handleSliderCommit}
				/>
				<div class="text-xs text-base-content/70">Display: {sliderLabel}</div>
			</div>

			<div class="space-y-2">
				<div class="rounded-lg border border-base-300 bg-base-100 p-4 text-sm text-base-content/70">
					<p><strong>Mode:</strong> {isLoggedIn ? 'Member controls' : 'Guest only'}</p>
					<p><strong>Timer:</strong> {timerActive ? 'Running' : 'Paused'}</p>
				</div>
			</div>
		</div>

		<div
			class="relative mt-8 min-h-[280px] rounded-lg border border-dashed border-base-300 bg-base-100/60 p-6"
		>
			<p class="text-sm text-base-content/60">
				{isLoggedIn ? 'Logged-in learner view' : 'Guest view'}
			</p>
			<ConversationFab
				{user}
				{timeRemaining}
				{timerActive}
				onEndConversation={handleEndConversation}
				onRestartConversation={handleRestartConversation}
			/>
		</div>
	</section>

	<section class="rounded-xl border border-dashed border-base-300 bg-base-200/20 p-6">
		<h2 class="text-lg font-semibold">Action log</h2>
		<p class="text-sm text-base-content/70">
			Triggered callbacks appear here so you can confirm wiring while exploring combinations.
		</p>
		<div class="mt-4 rounded-lg bg-base-100 p-4 font-mono text-sm shadow-inner">{lastAction}</div>
	</section>
</div>
