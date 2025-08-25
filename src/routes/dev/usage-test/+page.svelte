<!-- Dev Usage Testing Page -->
<script lang="ts">
	import { usageStore } from '$lib/stores/usage.store.svelte';
	import { TimerService } from '$lib/services/timer.service';
	import { onMount, onDestroy } from 'svelte';
	// Using Iconify icons via Tailwind classes
	import { defaultTierConfigs, type UserTier } from '$lib/data/tiers';

	// Mock user ID for testing
	const mockUserId = 'dev-test-user-123';

	// Tier selection
	let selectedTier: UserTier = 'free';
	let tierConfig = defaultTierConfigs.free;

	// Timer service
	let timerService: TimerService | null = null;

	// Mock usage data for testing
	let mockUsageData = {
		secondsUsed: 0, // Changed from minutesUsed
		secondsRemaining: 1800, // 30 minutes = 1800 seconds
		totalAvailableSeconds: 1800, // 30 minutes = 1800 seconds
		bankedSeconds: 0, // Changed from bankedMinutes
		bankedSecondsUsed: 0, // Changed from bankedMinutesUsed
		conversationsUsed: 0,
		realtimeSessionsUsed: 0,
		monthlySeconds: 1800, // 30 minutes = 1800 seconds
		monthlyConversations: 0,
		monthlyRealtimeSessions: 0,
		maxBankedSeconds: 0, // Changed from maxBankedMinutes
		currentPeriod: '2024-01',
		percentageUsed: 0,
		canStartSession: true,
		estimatedOverageCharge: 0,
		sessionsToday: 0
	};

	// Test controls
	let showAdvancedControls = false;
	let customTimeoutMs = 60000; // 1 minute default
	let customWarningMs = 10000; // 10 seconds default

	onMount(async () => {
		// Initialize usage store with mock data
		usageStore.setUser(mockUserId, selectedTier, tierConfig);

		// Set mock usage data
		usageStore.usage = mockUsageData;

		// Create timer service
		timerService = new TimerService({
			timeoutMs: tierConfig.conversationTimeoutMs || 60000,
			warningThresholdMs: tierConfig.warningThresholdMs || 10000,
			extendable: tierConfig.canExtend,
			maxExtensions: tierConfig.maxExtensions,
			extensionDurationMs: tierConfig.extensionDurationMs
		});

		// Set up timer callbacks
		timerService.onWarning(() => {
			console.log('⚠️ Timer warning triggered');
			usageStore.updateTimer({ warningTriggered: true });
		});

		timerService.onExpired(() => {
			console.log('⏰ Timer expired - ending conversation');
			usageStore.updateTimer({ isRunning: false });
			// Simulate realtime session ending
			simulateRealtimeEnd();
		});

		timerService.onTick((timeRemaining: number) => {
			const elapsed = (tierConfig.conversationTimeoutMs || 60000) - timeRemaining;
			usageStore.updateTimer({
				remainingMs: timeRemaining,
				elapsedMs: elapsed
			});
		});
	});

	onDestroy(() => {
		timerService?.stop();
	});

	// Handle tier change
	function handleTierChange(tier: UserTier) {
		selectedTier = tier;
		tierConfig = defaultTierConfigs[tier];

		// Update store
		usageStore.setUser(mockUserId, selectedTier, tierConfig);

		// Update mock usage data based on tier
		updateMockUsageForTier(tier);

		// Reconfigure timer service
		if (timerService) {
			timerService.configure({
				timeoutMs: tierConfig.conversationTimeoutMs || 60000,
				warningThresholdMs: tierConfig.warningThresholdMs || 10000,
				extendable: tierConfig.canExtend,
				maxExtensions: tierConfig.maxExtensions,
				extensionDurationMs: tierConfig.extensionDurationMs
			});
		}

		// Reset timer
		usageStore.resetTimer();
	}

	// Update mock usage data based on tier
	function updateMockUsageForTier(tier: UserTier) {
		const config = defaultTierConfigs[tier];
		mockUsageData = {
			...mockUsageData,
			monthlySeconds: config.monthlySeconds || 0,
			totalAvailableSeconds: config.monthlySeconds || 0,
			secondsRemaining: config.monthlySeconds || 0
		};
		usageStore.usage = mockUsageData;
	}

	// Start timer
	async function handleStart() {
		if (!timerService) return;

		// Generate mock session ID
		const sessionId = `dev-session-${Date.now()}`;

		// Start timer
		timerService.start();

		// Update store
		usageStore.updateTimer({
			isRunning: true,
			sessionId,
			language: 'en',
			startTime: new Date(),
			remainingMs: tierConfig.conversationTimeoutMs || 60000,
			totalDurationMs: tierConfig.conversationTimeoutMs || 60000
		});

		console.log('🚀 Session started:', sessionId);
	}

	// Stop timer
	async function handleStop() {
		if (!timerService) return;

		timerService.stop();

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
		if (!timerService) return;

		if (usageStore.timer.isPaused) {
			timerService.resume();
			usageStore.updateTimer({ isPaused: false, pausedAt: null });
		} else {
			timerService.pause();
			usageStore.updateTimer({ isPaused: true, pausedAt: new Date() });
		}
	}

	// Extend timer
	function handleExtend() {
		if (!timerService || !usageStore.canExtend) return;

		const success = timerService.extend(tierConfig.extensionDurationMs);
		if (success) {
			usageStore.updateTimer({
				extensionsUsed: (usageStore.timer.extensionsUsed || 0) + 1,
				remainingMs: (usageStore.timer.remainingMs || 0) + (tierConfig.extensionDurationMs || 0)
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
		usageStore.setUser(mockUserId, selectedTier, tierConfig);
		usageStore.usage = mockUsageData;
		usageStore.resetTimer();

		if (timerService) {
			timerService.stop();
			timerService.configure({
				timeoutMs: tierConfig.conversationTimeoutMs || 60000,
				warningThresholdMs: tierConfig.warningThresholdMs || 10000,
				extendable: tierConfig.canExtend,
				maxExtensions: tierConfig.maxExtensions,
				extensionDurationMs: tierConfig.extensionDurationMs
			});
		}
	}

	// Custom timer configuration
	function applyCustomTimerConfig() {
		if (!timerService) return;

		timerService.configure({
			timeoutMs: customTimeoutMs,
			warningThresholdMs: customWarningMs,
			extendable: tierConfig.canExtend,
			maxExtensions: tierConfig.maxExtensions,
			extensionDurationMs: tierConfig.extensionDurationMs
		});

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
					<div class="stat-value">{(tierConfig.conversationTimeoutMs || 0) / 60000}m</div>
				</div>

				<div class="stat">
					<div class="stat-title">Warning Threshold</div>
					<div class="stat-value">{(tierConfig.warningThresholdMs || 0) / 1000}s</div>
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
							{Math.floor(usageStore.usage.secondsRemaining / 60)}m {usageStore.usage
								.secondsRemaining % 60}s
						</div>
						<div class="stat-desc">
							{#if usageStore.willIncurOverage()}
								<span class="text-warning">
									Overage rate: ${usageStore.overageRate()}/min
								</span>
							{:else}
								{usageStore.usage.percentageUsed.toFixed(0)}% used this month
							{/if}
						</div>
					</div>

					{#if usageStore.usage.bankedSeconds > 0}
						<div class="stat">
							<div class="stat-title">Banked Seconds</div>
							<div class="stat-value">
								{Math.floor(usageStore.usage.bankedSeconds / 60)}m {usageStore.usage.bankedSeconds %
									60}s
							</div>
							<div class="stat-desc">Rolled over from last month</div>
						</div>
					{/if}

					<div class="stat">
						<div class="stat-title">Sessions Today</div>
						<div class="stat-value">{usageStore.usage.sessionsToday}</div>
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
							<span class="iconify h-4 w-4" data-icon="mdi:play"></span>
							Start Session
						</button>
					{:else}
						<button class="btn btn-error" onclick={handleStop}>
							<span class="iconify h-4 w-4" data-icon="mdi:stop"></span>
							End Session
						</button>

						<button class="btn btn-secondary" onclick={handlePauseResume}>
							{#if usageStore.timer.isPaused}
								<span class="iconify h-4 w-4" data-icon="mdi:play"></span>
								Resume
							{:else}
								<span class="iconify h-4 w-4" data-icon="mdi:pause"></span>
								Pause
							{/if}
						</button>

						{#if usageStore.canExtend()}
							<button class="btn btn-warning" onclick={handleExtend}>
								<span class="iconify h-4 w-4" data-icon="mdi:refresh"></span>
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
					<span class="iconify h-4 w-4" data-icon="mdi:cog"></span>
					{showAdvancedControls ? 'Hide' : 'Show'}
				</button>
			</div>

			{#if showAdvancedControls}
				<div class="mb-4 grid grid-cols-2 gap-4">
					<div>
						<label class="label">
							<span class="label-text">Custom Timeout (ms)</span>
						</label>
						<input
							type="number"
							class="input-bordered input w-full"
							bind:value={customTimeoutMs}
							min="10000"
							step="1000"
						/>
					</div>

					<div>
						<label class="label">
							<span class="label-text">Custom Warning (ms)</span>
						</label>
						<input
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
			<span class="iconify h-4 w-4" data-icon="mdi:alert-triangle"></span>
			<span
				>You've used all included minutes. Additional time will be charged at ${usageStore.overageRate()}/minute</span
			>
		</div>
	{/if}

	{#if usageStore.timer.warningTriggered}
		<div class="alert alert-warning">
			<span class="iconify h-4 w-4" data-icon="mdi:alert-triangle"></span>
			<span
				>Warning: Less than {(tierConfig.warningThresholdMs || 0) / 1000} seconds remaining!</span
			>
		</div>
	{/if}

	{#if !usageStore.canStartNewSession()}
		<div class="alert alert-error">
			<span class="iconify h-4 w-4" data-icon="mdi:alert-triangle"></span>
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
