<script lang="ts">
	import { GUEST_USER } from '$lib/data/user';
	import type { User } from '$lib/server/db/types';

	interface Props {
		user: User;
		timeRemaining: number;
		timerActive: boolean;
		onEndConversation: () => void;
		onRestartConversation: () => void;
	}

	let {
		user = GUEST_USER,
		timeRemaining = 0,
		timerActive = true,
		onEndConversation,
		onRestartConversation
	}: Props = $props();

	let displaySeconds = $derived(normalizeTime(timeRemaining));

	const isGuest = $derived(user.id === 'guest');
	const displayTime = $derived(formatDisplay(displaySeconds));
	const timerTooltip = $derived(() => {
		if (displaySeconds <= 0) return 'No time remaining';
		return timerActive ? 'Time remaining' : 'Timer paused';
	});

	$effect(() => {
		displaySeconds = normalizeTime(timeRemaining);
	});

	$effect(() => {
		if (!timerActive) return;
		if (displaySeconds <= 0) return;

		const timer = setInterval(() => {
			displaySeconds = Math.max(0, displaySeconds - 1);
		}, 1000);

		return () => clearInterval(timer);
	});

	function normalizeTime(seconds: number) {
		if (!Number.isFinite(seconds) || seconds <= 0) return 0;
		return Math.floor(seconds);
	}

	function formatDisplay(seconds: number) {
		if (seconds > 3600) {
			const hours = seconds / 3600;
			return `${hours.toFixed(1)}h`;
		}
		if (seconds > 60) {
			return `${Math.ceil(seconds / 60)}m`;
		}
		return `${Math.max(0, seconds)}s`;
	}
</script>

{#if isGuest}
	<div class="fab">
		<button
			type="button"
			class="btn btn-circle btn-soft btn-lg"
			aria-label="End conversation"
			onclick={() => {
				onEndConversation();
			}}
			onkeydown={(event) => {
				if (event.key === 'Enter' || event.key === ' ') {
					onEndConversation?.();
				}
			}}
		>
			<span class="icon-[mdi--arrow-right] h-5 w-5"></span>
		</button>
	</div>
{:else}
	<div class="fab fab-flower">
		<div tabindex="0" role="button" class="btn btn-circle btn-primary btn-sm md:btn-lg" data-tip="Next Options">
			<span class="icon-[mdi--arrow-right] h-5 w-5 md:h-6 md:w-6"></span>
		</div>

		<!-- Main Action button replaces the original button when FAB is open -->
		<button class="fab-main-action btn btn-circle btn-primary btn-sm md:btn-lg">
			<span class="sr-only">{timerTooltip()}: {displayTime}</span>
			<span class="text-sm md:text-base">{displayTime}</span>
		</button>

		<!-- buttons that show up when FAB is open -->
		<div class="tooltip tooltip-left" data-tip="End conversation">
			<button
				class="btn btn-circle btn-primary btn-sm md:btn-lg"
				aria-label="End conversation"
				onclick={(event) => {
					event.stopPropagation();
					onEndConversation?.();
				}}
			>
				<span class="icon-[mdi--arrow-right] h-5 w-5 md:h-6 md:w-6"></span>
			</button>
		</div>
		<div class="tooltip tooltip-left" data-tip="Retry conversation">
			<button
				class="btn btn-circle btn-primary btn-sm md:btn-lg"
				aria-label="Retry conversation"
				onclick={(event) => {
					if (!onRestartConversation) return;
					event.stopPropagation();
					onRestartConversation();
				}}
			>
				<span class="icon-[mdi--refresh] h-5 w-5 md:h-6 md:w-6"></span>
			</button>
		</div>
	</div>
{/if}
