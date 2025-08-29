<!-- src/lib/components/ConversationTimer.svelte -->
<script lang="ts">
	import { formatTimeRemaining } from '$lib/services/timer.service';
	import type { TimerState } from '$lib/services/timer.service';

	interface Props {
		timerState: TimerState;
		onExpired?: () => void;
	}

	let { timerState, onExpired } = $props();

	// Safety check for timer state
	let isValidTimerState = $derived(timerState && typeof timerState.timeRemaining === 'number');

	// Format time for display (only if timer state is valid)
	let formattedTime = $derived(
		isValidTimerState ? formatTimeRemaining(timerState.timeRemaining) : '--:--'
	);
	let timeInSeconds = $derived(isValidTimerState ? Math.ceil(timerState.timeRemaining / 1000) : 0);
	let isWarning = $derived(timeInSeconds <= 30 && timeInSeconds > 0); // Warning when 30 seconds or less
	let isExpired = $derived(timeInSeconds <= 0);

	// Handle expiration
	$effect(() => {
		if (isExpired && onExpired) {
			onExpired();
		}
	});

	// Log invalid timer states for debugging
	$effect(() => {
		if (!isValidTimerState) {
			console.error('Invalid timer state:', timerState);
		}
	});
</script>

<div class="flex flex-col items-center gap-2 rounded-lg border border-base-300 bg-base-200 p-4">
	<!-- Simple Time Display with Iconify -->
	<div class="flex items-center gap-2 text-sm">
		<span class="iconify h-4 w-4" data-icon="mdi:clock"></span>
		<span class="font-mono {isWarning ? 'text-warning' : ''} {isExpired ? 'text-error' : ''}">
			{formattedTime}
		</span>
	</div>

	<!-- Status Indicator -->
	{#if isValidTimerState && timeInSeconds > 0}
		<div class="mt-1 text-xs opacity-70">
			{#if isWarning}
				<span class="text-warning">⚠️ Time running out</span>
			{:else if isExpired}
				<span class="text-error">⏰ Time's up!</span>
			{:else}
				<span class="text-success">▶️ Active</span>
			{/if}
		</div>
	{:else if !isValidTimerState}
		<div class="mt-1 text-xs text-gray-500 opacity-70">⏳ Initializing timer...</div>
	{/if}

	<!-- Progress Bar -->
	{#if isValidTimerState && timeInSeconds > 0}
		<div class="mt-2 w-full max-w-xs">
			<div class="h-1 w-full rounded-full bg-base-300">
				<div
					class="h-1 rounded-full transition-all duration-300 {isWarning
						? 'bg-warning'
						: isExpired
							? 'bg-error'
							: 'bg-primary'}"
					style="width: {Math.max(0, (timeInSeconds / 120) * 100)}%"
				></div>
			</div>
		</div>
	{/if}

	<!-- Warning Alert -->
	{#if isValidTimerState && isWarning}
		<div class="mt-2 alert alert-warning">
			<span class="iconify h-4 w-4" data-icon="mdi:alert-triangle"></span>
			<span>Less than {timeInSeconds} seconds remaining!</span>
		</div>
	{/if}
</div>
