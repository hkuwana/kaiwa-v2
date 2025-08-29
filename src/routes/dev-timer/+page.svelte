<!-- src/routes/dev-timer/+page.svelte -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		createConversationTimerStore,
		type ConversationTimerStore
	} from '$lib/stores/conversation-timer.store.svelte';
	import type { UserTier } from '$lib/server/db/types';

	let selectedTier = $state<'free' | 'plus' | 'premium'>('free');
	let timerStore = $state<ConversationTimerStore | null>(null);
	let timerState = $state<ConversationTimerStore['state'] | null>(null);
	let customTimeoutMs = $state(180000); // 3 minutes default
	let customWarningMs = $state(30000); // 30 seconds default

	onMount(() => {
		console.log('🎯 Dev Timer Page Loaded');
		initializeTimerStore();
	});

	onDestroy(() => {
		if (timerStore) {
			timerStore.cleanup();
		}
	});

	function initializeTimerStore() {
		if (timerStore) {
			timerStore.cleanup();
		}

		timerStore = createConversationTimerStore(selectedTier);
		timerState = timerStore.state;

		console.log('⏰ Timer store initialized for tier:', selectedTier);
		console.log('Initial timer state:', timerState);
	}

	function handleTierChange() {
		initializeTimerStore();
	}

	function startTimer() {
		if (!timerStore) return;

		console.log('🚀 Starting timer...');
		timerStore.start(() => {
			console.log('⏰ Timer expired!');
		});

		timerState = timerStore.state;
		console.log('Timer started, new state:', timerState);
	}

	function stopTimer() {
		if (!timerStore) return;

		console.log('⏹️ Stopping timer...');
		timerStore.stop();

		timerState = timerStore.state;
		console.log('Timer stopped, new state:', timerState);
	}

	function pauseTimer() {
		if (!timerStore) return;

		console.log('⏸️ Pausing timer...');
		timerStore.pause();

		timerState = timerStore.state;
		console.log('Timer paused, new state:', timerState);
	}

	function resumeTimer() {
		if (!timerStore) return;

		console.log('▶️ Resuming timer...');
		timerStore.resume();

		timerState = timerStore.state;
		console.log('Timer resumed, new state:', timerState);
	}

	function resetTimer() {
		if (!timerStore) return;

		console.log('🔄 Resetting timer...');
		timerStore.reset();

		timerState = timerStore.state;
		console.log('Timer reset, new state:', timerState);
	}

	// Reactive timer state updates
	$effect(() => {
		if (timerStore) {
			timerState = timerStore.state;
		}
	});
</script>

<svelte:head>
	<title>Dev Timer - Kaiwa</title>
</svelte:head>

<div class="container mx-auto max-w-6xl p-6">
	<header class="mb-8 text-center">
		<h1 class="mb-4 text-4xl font-bold text-primary">⏰ Dev Timer Testing</h1>
		<p class="mb-6 text-lg opacity-70">
			Test the conversation timer store directly and debug timer functionality
		</p>
	</header>

	<!-- Tier Selection -->
	<div class="card mb-8 bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title">🎛️ Timer Configuration</h2>

			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<div>
					<label class="label">
						<span class="label-text">User Tier</span>
					</label>
					<select
						bind:value={selectedTier}
						onchange={handleTierChange}
						class="select-bordered select w-full"
					>
						<option value="free">Free (3 min)</option>
						<option value="plus">Plus (10 min)</option>
						<option value="premium">Premium (30 min)</option>
					</select>
				</div>

				<div>
					<label class="label">
						<span class="label-text">Custom Timeout (ms)</span>
					</label>
					<input
						type="number"
						bind:value={customTimeoutMs}
						class="input-bordered input w-full"
						placeholder="180000"
					/>
				</div>
			</div>

			<div class="mt-4 rounded-lg bg-base-200 p-4">
				<h3 class="mb-2 font-semibold">Current Configuration:</h3>
				<div class="space-y-1 text-sm">
					<div><strong>Tier:</strong> {selectedTier}</div>
					<div>
						<strong>Custom Timeout:</strong>
						{customTimeoutMs}ms ({Math.round(customTimeoutMs / 1000)}s)
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Timer Controls -->
	<div class="card mb-8 bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title">🎮 Timer Controls</h2>

			<div class="flex flex-wrap gap-2">
				<button onclick={startTimer} class="btn btn-primary">
					<span class="iconify h-4 w-4" data-icon="mdi:play"></span>
					Start
				</button>

				<button onclick={stopTimer} class="btn btn-error">
					<span class="iconify h-4 w-4" data-icon="mdi:stop"></span>
					Stop
				</button>

				<button onclick={pauseTimer} class="btn btn-warning">
					<span class="iconify h-4 w-4" data-icon="mdi:pause"></span>
					Pause
				</button>

				<button onclick={resumeTimer} class="btn btn-success">
					<span class="iconify h-4 w-4" data-icon="mdi:play"></span>
					Resume
				</button>

				<button onclick={resetTimer} class="btn btn-secondary">
					<span class="iconify h-4 w-4" data-icon="mdi:refresh"></span>
					Reset
				</button>
			</div>
		</div>
	</div>

	<!-- Timer Display -->
	<div class="card mb-8 bg-base-100 shadow-xl">
		<div class="card-body text-center">
			<h2 class="card-title justify-center">⏰ Timer State</h2>

			{#if timerState}
				<div class="space-y-4">
					<!-- Time Display -->
					<div class="font-mono text-6xl">
						{Math.floor(timerState.timer.timeRemaining / 1000 / 60)}:{(
							Math.floor(timerState.timer.timeRemaining / 1000) % 60
						)
							.toString()
							.padStart(2, '0')}
					</div>

					<!-- Status -->
					<div class="text-lg">
						Status: <span
							class="badge badge-{timerState.timer.status === 'running'
								? 'success'
								: timerState.timer.status === 'paused'
									? 'warning'
									: timerState.timer.status === 'expired'
										? 'error'
										: 'neutral'}">{timerState.timer.status}</span
						>
					</div>

					<!-- Progress Bar -->
					<div class="mx-auto w-full max-w-md">
						<div class="h-4 w-full rounded-full bg-base-300">
							<div
								class="h-4 rounded-full transition-all duration-300 {timerState.timer.status ===
								'warning'
									? 'bg-warning'
									: timerState.timer.status === 'expired'
										? 'bg-error'
										: 'bg-primary'}"
								style="width: {Math.max(
									0,
									(timerState.timer.timeRemaining / (customTimeoutMs || 180000)) * 100
								)}%"
							></div>
						</div>
					</div>

					<!-- Details -->
					<div class="grid grid-cols-2 gap-4 text-sm">
						<div>
							<strong>Time Remaining:</strong><br />
							{timerState.timer.timeRemaining}ms ({Math.round(
								timerState.timer.timeRemaining / 1000
							)}s)
						</div>
						<div>
							<strong>Time Elapsed:</strong><br />
							{timerState.timer.timeElapsed}ms ({Math.round(timerState.timer.timeElapsed / 1000)}s)
						</div>
						<div>
							<strong>Is Active:</strong><br />
							{timerState.timer.isActive ? 'Yes' : 'No'}
						</div>
						<div>
							<strong>Can Extend:</strong><br />
							{timerState.timer.canExtend ? 'Yes' : 'No'}
						</div>
					</div>
				</div>
			{:else}
				<div class="text-gray-500">No timer state available</div>
			{/if}
		</div>
	</div>

	<!-- Debug Information -->
	<div class="card mb-8 bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title">🔍 Debug Information</h2>

			{#if timerStore}
				<div class="space-y-4">
					<div class="rounded-lg bg-base-200 p-4">
						<h3 class="mb-2 font-semibold">Timer Store Methods:</h3>
						<div class="space-y-2 text-sm">
							<div><strong>getTimeRemaining():</strong> {timerStore.timeRemaining}</div>
							<div><strong>getTimeElapsed():</strong> {timerStore.timeElapsed}</div>
							<div><strong>isExpired():</strong> {timerStore.isExpired ? 'Yes' : 'No'}</div>
						</div>
					</div>

					<div class="rounded-lg bg-base-200 p-4">
						<h3 class="mb-2 font-semibold">Raw Timer State:</h3>
						<pre class="max-h-40 overflow-auto text-xs">{JSON.stringify(timerState, null, 2)}</pre>
					</div>
				</div>
			{:else}
				<div class="text-gray-500">Timer store not initialized</div>
			{/if}
		</div>
	</div>

	<!-- Instructions -->
	<div class="card bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title">💡 How to Use</h2>
			<div class="space-y-2 text-sm">
				<div>1. <strong>Select a tier</strong> to configure the timer</div>
				<div>2. <strong>Start the timer</strong> to begin countdown</div>
				<div>3. <strong>Use controls</strong> to pause, resume, stop, or extend</div>
				<div>4. <strong>Monitor the state</strong> in real-time</div>
				<div>5. <strong>Check console</strong> for detailed debug information</div>
			</div>
		</div>
	</div>
</div>
