<!-- Dev Usage Testing Page -->
<script lang="ts">
	import { usageStore } from '$lib/stores/usage.store.svelte';
	import {
		createDefaultTimerConfig,
		createTimerConfig,
		startTimer,
		stopTimer,
		pauseTimer,
		resumeTimer,
		extendTimer,
		calculateTimerState
	} from '$lib/services/timer.service';
	import { onMount, onDestroy } from 'svelte';
	// Using Iconify icons via Tailwind classes
	import { defaultTierConfigs, type UserTier } from '$lib/data/tiers';
	import type { UserUsage } from '$lib/server/db/types';
	import { SvelteDate } from 'svelte/reactivity';

	// Mock user ID for testing
	const mockUserId = 'dev-test-user-123';

	// Tier selection
	let selectedTier: UserTier = $state('free');
	let tierConfig = $state(defaultTierConfigs.free);

	// Timer state management
	let timerConfig = createDefaultTimerConfig();
	const timerState = {
		startTime: 0,
		pauseTime: 0,
		totalPausedTime: 0,
		extensionsUsed: 0
	};
	let currentTimerState = {
		isActive: false,
		timeRemaining: 0,
		timeElapsed: 0,
		status: 'idle' as 'idle' | 'running' | 'paused' | 'warning' | 'expired',
		canExtend: false,
		extensionsUsed: 0
	};
	let timerInterval: NodeJS.Timeout | null = null;

	// Mock usage data for testing
	function getCurrentPeriod(): string {
		const now = new Date();
		return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
	}

	function createMockUsage(overrides: Partial<UserUsage> = {}): UserUsage {
		const now = new Date();
		return {
			userId: mockUserId,
			period: getCurrentPeriod(),
			conversationsUsed: 0,
			secondsUsed: 0,
			realtimeSessionsUsed: 0,
			bankedSeconds: 0,
			bankedSecondsUsed: 0,
			ankiExportsUsed: 0,
			sessionExtensionsUsed: 0,
			advancedVoiceSeconds: 0,
			analysesUsed: 0,
			// Simplified analysis usage fields for MVP
			basicAnalysesUsed: 0,
			advancedGrammarUsed: 0,
			fluencyAnalysisUsed: 0,
			onboardingProfileUsed: 0,
			pronunciationAnalysisUsed: 0,
			speechRhythmUsed: 0,
			completedSessions: 0,
			longestSessionSeconds: 0,
			averageSessionSeconds: 0,
			overageSeconds: 0,
			tierWhenUsed: selectedTier,
			lastConversationAt: null,
			lastRealtimeAt: null,
			firstActivityAt: null,
			createdAt: now,
			updatedAt: now,
			...overrides
		};
	}

	let mockUsageData: UserUsage = createMockUsage();

	// Test controls
	let showAdvancedControls = $state(false);
	let customTimeoutMs = $state(60000); // 1 minute default
	let customWarningMs = $state(10000); // 10 seconds default

	onMount(async () => {
		// Initialize usage store with mock data
		usageStore.setUser(mockUserId, tierConfig);

		// Set mock usage data
		usageStore.usage = mockUsageData;

		// Configure timer
		timerConfig = createTimerConfig({
			timeoutMs: (tierConfig.conversationTimeoutSeconds || 60) * 1000,
			warningThresholdMs: (tierConfig.warningThresholdSeconds || 10) * 1000,
			extendable: tierConfig.canExtend,
			maxExtensions: tierConfig.maxExtensions,
			extensionDurationMs: (tierConfig.extensionDurationSeconds || 0) * 1000
		});

		// Initialize timer state
		currentTimerState = {
			isActive: false,
			timeRemaining: timerConfig.timeoutMs,
			timeElapsed: 0,
			status: 'idle',
			canExtend: timerConfig.extendable,
			extensionsUsed: 0
		};
	});

	onDestroy(() => {
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
	});

	// Handle tier change
	function handleTierChange(tier: UserTier) {
		selectedTier = tier;
		tierConfig = defaultTierConfigs[tier];

		// Update store
		usageStore.setUser(mockUserId, tierConfig);

		// Update mock usage data based on tier
		updateMockUsageForTier(tier);

		// Reconfigure timer
		timerConfig = createTimerConfig({
			timeoutMs: (tierConfig.conversationTimeoutSeconds || 60) * 1000,
			warningThresholdMs: (tierConfig.warningThresholdSeconds || 10) * 1000,
			extendable: tierConfig.canExtend,
			maxExtensions: tierConfig.maxExtensions,
			extensionDurationMs: (tierConfig.extensionDurationSeconds || 0) * 1000
		});

		// Reset timer
		usageStore.resetTimer();
		currentTimerState = {
			isActive: false,
			timeRemaining: timerConfig.timeoutMs,
			timeElapsed: 0,
			status: 'idle',
			canExtend: timerConfig.extendable,
			extensionsUsed: 0
		};
	}

	// Update mock usage data based on tier
	function updateMockUsageForTier(tier: UserTier) {
		mockUsageData = createMockUsage({ tierWhenUsed: tier });
		usageStore.usage = mockUsageData;
	}

	// Start timer
	async function handleStart() {
		// Generate mock session ID
		const sessionId = `dev-session-${Date.now()}`;

		// Start timer using functional service
		const startTime = Date.now();
		timerState.startTime = startTime;
		timerState.pauseTime = 0;
		timerState.totalPausedTime = 0;
		timerState.extensionsUsed = 0;

		const result = startTimer(timerConfig, startTime);
		currentTimerState = result.state;

		// Start timer interval
		timerInterval = setInterval(() => {
			const now = Date.now();
			const timerInput = {
				config: timerConfig,
				...timerState
			};
			const timerResult = calculateTimerState(timerInput, now);
			currentTimerState = timerResult.state;

			// Handle notifications
			if (timerResult.shouldNotifyWarning) {
				console.log('⚠️ Timer warning triggered');
				usageStore.updateTimer({ warningTriggered: true });
			}

			if (timerResult.shouldNotifyExpired) {
				console.log('⏰ Timer expired - ending conversation');
				usageStore.updateTimer({ isRunning: false });
				simulateRealtimeEnd();
				if (timerInterval) {
					clearInterval(timerInterval);
					timerInterval = null;
				}
			}

			if (timerResult.shouldNotifyTick) {
				usageStore.updateTimer({
					remainingMs: timerResult.state.timeRemaining,
					elapsedMs: timerResult.state.timeElapsed
				});
			}
		}, 100);

		// Update store
		usageStore.updateTimer({
			isRunning: true,
			sessionId,
			language: 'en',
			startTime: new SvelteDate(),
			remainingMs: (tierConfig.conversationTimeoutSeconds || 60) * 1000,
			totalDurationMs: (tierConfig.conversationTimeoutSeconds || 60) * 1000
		});

		console.log('🚀 Session started:', sessionId);
	}

	// Stop timer
	async function handleStop() {
		// Stop timer interval
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}

		// Stop timer using functional service
		const result = stopTimer(timerConfig);
		currentTimerState = result.state;

		// Calculate seconds used
		const secondsUsed = Math.ceil((usageStore.timer.elapsedMs || 0) / 1000);
		const overageSeconds = Math.max(0, secondsUsed - (tierConfig.monthlySeconds || 0));

		// Update usage
		usageStore.updateUsageAfterSession(secondsUsed, overageSeconds);
		usageStore.resetTimer();

		console.log('⏹️ Session stopped. Seconds used:', secondsUsed, 'Overage:', overageSeconds);
	}

	// Pause/Resume timer
	function handlePauseResume() {
		if (usageStore.timer.isPaused) {
			// Resume timer
			const resumeTime = Date.now();
			const totalPausedTime = timerState.totalPausedTime + (resumeTime - timerState.pauseTime);
			timerState.totalPausedTime = totalPausedTime;

			const result = resumeTimer(
				currentTimerState,
				resumeTime,
				timerState.pauseTime,
				totalPausedTime
			);
			currentTimerState = result.state;

			usageStore.updateTimer({ isPaused: false, pausedAt: null });
		} else {
			// Pause timer
			const pauseTime = Date.now();
			timerState.pauseTime = pauseTime;

			const result = pauseTimer(currentTimerState, pauseTime);
			currentTimerState = result.state;

			usageStore.updateTimer({ isPaused: true, pausedAt: new SvelteDate() });
		}
	}

	// Extend timer
	function handleExtend() {
		if (!usageStore.canExtend) return;

		const result = extendTimer(
			currentTimerState,
			timerConfig,
			(tierConfig.extensionDurationSeconds || 0) * 1000
		);
		if (result.state !== currentTimerState) {
			currentTimerState = result.state;
			timerState.extensionsUsed = result.state.extensionsUsed;

			usageStore.updateTimer({
				extensionsUsed: result.state.extensionsUsed,
				remainingMs: result.state.timeRemaining
			});
			console.log('⏰ Timer extended');
		}
	}

	// Simulate realtime session ending when timer expires
	function simulateRealtimeEnd() {
		console.log('🔌 Simulating realtime session end due to timer expiration');
		// In a real app, this would disconnect the WebRTC connection
		// and notify the realtime service
	}

	// Reset everything
	function handleReset() {
		usageStore.clear();
		usageStore.setUser(mockUserId, tierConfig);
		mockUsageData = createMockUsage();
		usageStore.usage = mockUsageData;
		usageStore.resetTimer();

		// Stop any existing timer
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}

		// Configure timer with new tier settings
		timerConfig = createTimerConfig({
			timeoutMs: (tierConfig.conversationTimeoutSeconds || 60) * 1000,
			warningThresholdMs: (tierConfig.warningThresholdSeconds || 10) * 1000,
			extendable: tierConfig.canExtend,
			maxExtensions: tierConfig.maxExtensions,
			extensionDurationMs: (tierConfig.extensionDurationSeconds || 0) * 1000
		});

		// Reset timer state
		currentTimerState = {
			isActive: false,
			timeRemaining: timerConfig.timeoutMs,
			timeElapsed: 0,
			status: 'idle',
			canExtend: timerConfig.extendable,
			extensionsUsed: 0
		};
	}

	// Custom timer configuration
	function applyCustomTimerConfig() {
		// Stop any existing timer
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}

		// Configure timer with custom settings
		timerConfig = createTimerConfig({
			timeoutMs: customTimeoutMs,
			warningThresholdMs: customWarningMs,
			extendable: tierConfig.canExtend,
			maxExtensions: tierConfig.maxExtensions,
			extensionDurationMs: (tierConfig.extensionDurationSeconds || 0) * 1000
		});

		// Reset timer state
		currentTimerState = {
			isActive: false,
			timeRemaining: timerConfig.timeoutMs,
			timeElapsed: 0,
			status: 'idle',
			canExtend: timerConfig.extendable,
			extensionsUsed: 0
		};

		usageStore.updateTimer({
			remainingMs: customTimeoutMs,
			totalDurationMs: customTimeoutMs
		});

		console.log('⚙️ Custom timer config applied:', { customTimeoutMs, customWarningMs });
	}
</script>

<svelte:head>
	<title>Dev Usage Testing</title>
</svelte:head>

<div class="container mx-auto max-w-4xl p-6">
	<div class="mb-8">
		<h1 class="mb-2 text-3xl font-bold">Dev Usage Testing</h1>
		<p class="text-gray-600">Test different tier configurations and timer functionality</p>
	</div>

	<!-- Tier Selection -->
	<div class="card mb-6 bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title">Tier Configuration</h2>

			<div class="mb-4 flex gap-4">
				{#each Object.keys(defaultTierConfigs) as tier}
					<button
						class="btn {selectedTier === tier ? 'btn-primary' : 'btn-outline'}"
						onclick={() => handleTierChange(tier as UserTier)}
					>
						{tier.charAt(0).toUpperCase() + tier.slice(1)}
					</button>
				{/each}
			</div>

			<div class="stats shadow">
				<div class="stat">
					<div class="stat-title">Monthly Seconds</div>
					<div class="stat-value">{tierConfig.monthlySeconds || 'Unlimited'}</div>
				</div>

				<div class="stat">
					<div class="stat-title">Session Timeout</div>
					<div class="stat-value">{(tierConfig.conversationTimeoutSeconds || 0) / 60}m</div>
				</div>

				<div class="stat">
					<div class="stat-title">Warning Threshold</div>
					<div class="stat-value">{tierConfig.warningThresholdSeconds || 0}s</div>
				</div>

				<div class="stat">
					<div class="stat-title">Can Extend</div>
					<div class="stat-value">{tierConfig.canExtend ? 'Yes' : 'No'}</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Usage Overview -->
	{#if usageStore.usage}
		<div class="card mb-6 bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title">Usage Overview</h2>

				<div class="stats shadow">
					<div class="stat">
						<div class="stat-title">Seconds Remaining</div>
						<div class="stat-value">
							{Math.floor(usageStore.secondsRemaining / 60)}m {usageStore.secondsRemaining % 60}s
						</div>
						<div class="stat-desc">
							{#if usageStore.willIncurOverage()}
								<span class="text-warning">
									Overage rate: ${usageStore.overageRate()}/min
								</span>
							{:else}
								{usageStore.percentageUsed.toFixed(0)}% used this month
							{/if}
						</div>
					</div>

					{#if (usageStore.usage?.bankedSeconds || 0) > 0}
						<div class="stat">
							<div class="stat-title">Banked Seconds</div>
							<div class="stat-value">
								{Math.floor((usageStore.usage?.bankedSeconds || 0) / 60)}m {(usageStore.usage
									?.bankedSeconds || 0) % 60}s
							</div>
							<div class="stat-desc">Rolled over from last month</div>
						</div>
					{/if}

					<div class="stat">
						<div class="stat-title">Sessions Today</div>
						<div class="stat-value">{usageStore.sessionsToday}</div>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Timer Display -->
	<div class="card mb-6 bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title">Timer Display</h2>

			<div class="text-center">
				<div class="font-mono text-6xl {usageStore.isInWarningZone() ? 'text-warning' : ''} mb-4">
					{usageStore.formattedTime()}
				</div>

				{#if usageStore.timer.isRunning}
					<div class="mb-4 text-sm opacity-60">
						Elapsed: {usageStore.formattedElapsed()}
					</div>

					<div class="mb-4 h-2 w-full rounded-full bg-gray-200">
						<div
							class="h-2 rounded-full bg-primary transition-all duration-300"
							style="width: {usageStore.percentageRemaining()}%"
						></div>
					</div>
				{/if}

				<div class="flex justify-center gap-2">
					{#if !usageStore.timer.isRunning}
						<button
							class="btn btn-primary"
							onclick={handleStart}
							disabled={!usageStore.canStartNewSession()}
						>
							<span class="icon-[mdi--play] h-4 w-4"></span>
							Start Session
						</button>
					{:else}
						<button class="btn btn-error" onclick={handleStop}>
							<span class="icon-[mdi--stop] h-4 w-4"></span>
							End Session
						</button>

						<button class="btn btn-secondary" onclick={handlePauseResume}>
							{#if usageStore.timer.isPaused}
								<span class="icon-[mdi--play] h-4 w-4"></span>
								Resume
							{:else}
								<span class="icon-[mdi--pause] h-4 w-4"></span>
								Pause
							{/if}
						</button>

						{#if usageStore.canExtend()}
							<button class="btn btn-warning" onclick={handleExtend}>
								<span class="icon-[mdi--refresh] h-4 w-4"></span>
								Extend ({usageStore.extensionsRemaining()})
							</button>
						{/if}
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- Advanced Controls -->
	<div class="card mb-6 bg-base-100 shadow-xl">
		<div class="card-body">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="card-title">Advanced Controls</h2>
				<button
					class="btn btn-ghost btn-sm"
					onclick={() => (showAdvancedControls = !showAdvancedControls)}
				>
					<span class="icon-[mdi--cog] h-4 w-4"></span>
					{showAdvancedControls ? 'Hide' : 'Show'}
				</button>
			</div>

			{#if showAdvancedControls}
				<div class="mb-4 grid grid-cols-2 gap-4">
					<div>
						<label for="custom-timeout" class="label">
							<span class="label-text">Custom Timeout (ms)</span>
						</label>
						<input
							id="custom-timeout"
							type="number"
							class="input-bordered input w-full"
							bind:value={customTimeoutMs}
							min="10000"
							step="1000"
						/>
					</div>

					<div>
						<label for="custom-warning" class="label">
							<span class="label-text">Custom Warning (ms)</span>
						</label>
						<input
							id="custom-warning"
							type="number"
							class="input-bordered input w-full"
							bind:value={customWarningMs}
							min="1000"
							step="1000"
						/>
					</div>
				</div>

				<div class="flex gap-2">
					<button class="btn btn-outline" onclick={applyCustomTimerConfig}>
						Apply Custom Config
					</button>

					<button class="btn btn-outline" onclick={handleReset}> Reset Everything </button>
				</div>
			{/if}
		</div>
	</div>

	<!-- Warnings and Status -->
	{#if usageStore.willIncurOverage() && !usageStore.timer.isRunning}
		<div class="alert alert-warning">
			<span class="icon-[mdi--alert] h-4 w-4"></span>
			<span
				>You've used all included minutes. Additional time will be charged at ${usageStore.overageRate()}/minute</span
			>
		</div>
	{/if}

	{#if usageStore.timer.warningTriggered}
		<div class="alert alert-warning">
			<span class="icon-[mdi--alert] h-4 w-4"></span>
			<span>Warning: Less than {tierConfig.warningThresholdSeconds || 0} seconds remaining!</span>
		</div>
	{/if}

	{#if !usageStore.canStartNewSession()}
		<div class="alert alert-error">
			<span class="icon-[mdi--alert] h-4 w-4"></span>
			<span>Cannot start new session - limits reached</span>
		</div>
	{/if}

	<!-- Debug Info -->
	<div class="card bg-base-200 shadow-xl">
		<div class="card-body">
			<h2 class="card-title">Debug Information</h2>

			<div class="grid grid-cols-2 gap-4 text-sm">
				<div>
					<strong>Timer State:</strong>
					<pre class="mt-2 overflow-auto rounded bg-base-300 p-2 text-xs">
{JSON.stringify(usageStore.timer, null, 2)}
          </pre>
				</div>

				<div>
					<strong>Store State:</strong>
					<pre class="mt-2 overflow-auto rounded bg-base-300 p-2 text-xs">
{JSON.stringify(
							{
								tier: usageStore.tier,
								canStartNewSession: usageStore.canStartNewSession(),
								willIncurOverage: usageStore.willIncurOverage(),
								overageRate: usageStore.overageRate()
							},
							null,
							2
						)}
          </pre>
				</div>
			</div>
		</div>
	</div>
</div>
