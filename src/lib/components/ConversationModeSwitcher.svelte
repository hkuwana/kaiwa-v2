<script lang="ts">
	import { fly } from 'svelte/transition';
	import { spring } from 'svelte/motion';
	import type { AudioInputMode } from '$lib/server/db/types';

	interface Props {
		mode: AudioInputMode;
		onModeChange: (mode: AudioInputMode) => void;
		disabled?: boolean;
	}

	let { mode, onModeChange, disabled = false }: Props = $props();

	// Spring animation for the sliding indicator
	const indicatorX = spring(mode === 'vad' ? 0 : 1, {
		stiffness: 0.15,
		damping: 0.8
	});

	$effect(() => {
		indicatorX.set(mode === 'vad' ? 0 : 1);
	});

	function selectMode(newMode: AudioInputMode) {
		if (disabled || newMode === mode) return;
		onModeChange(newMode);
	}
</script>

<!--
  Jony Ive Design Philosophy:
  - Radical simplicity: Two options, nothing more
  - Obvious hierarchy: The active mode is immediately clear
  - Beautiful materials: Glass-like, subtle shadows, smooth transitions
  - Focus on one thing: Switch between talking modes
-->
<div
	class="mode-switcher"
	class:disabled
	role="radiogroup"
	aria-label="Conversation mode"
>
	<!-- Sliding indicator - the "soul" of the interaction -->
	<div
		class="mode-indicator"
		style="transform: translateX({$indicatorX * 100}%)"
		aria-hidden="true"
	></div>

	<!-- Casual Chat (VAD) -->
	<button
		type="button"
		class="mode-option"
		class:active={mode === 'vad'}
		role="radio"
		aria-checked={mode === 'vad'}
		onclick={() => selectMode('vad')}
		{disabled}
	>
		<span class="mode-icon icon-[mdi--message-text-outline]" aria-hidden="true"></span>
		<span class="mode-label">Casual Chat</span>
		{#if mode === 'vad'}
			<span class="sr-only">(active)</span>
		{/if}
	</button>

	<!-- Walkie Talkie (PTT) -->
	<button
		type="button"
		class="mode-option"
		class:active={mode === 'ptt'}
		role="radio"
		aria-checked={mode === 'ptt'}
		onclick={() => selectMode('ptt')}
		{disabled}
	>
		<span class="mode-icon icon-[mdi--walkie-talkie]" aria-hidden="true"></span>
		<span class="mode-label">Walkie Talkie</span>
		{#if mode === 'ptt'}
			<span class="sr-only">(active)</span>
		{/if}
	</button>
</div>

<!-- Subtle hint about current mode -->
<div class="mode-hint" in:fly={{ y: -5, duration: 200 }}>
	{#if mode === 'vad'}
		<span class="hint-text">Just talk naturally</span>
	{:else}
		<span class="hint-text">Press & hold to speak</span>
	{/if}
</div>

<style>
	.mode-switcher {
		position: relative;
		display: inline-flex;
		padding: 4px;
		border-radius: 9999px;
		background: oklch(var(--b2) / 0.8);
		backdrop-filter: blur(12px);
		box-shadow:
			0 1px 3px oklch(0% 0 0 / 0.08),
			0 4px 12px oklch(0% 0 0 / 0.04),
			inset 0 1px 0 oklch(100% 0 0 / 0.1);
		gap: 0;
	}

	.mode-switcher.disabled {
		opacity: 0.6;
		pointer-events: none;
	}

	.mode-indicator {
		position: absolute;
		top: 4px;
		left: 4px;
		width: calc(50% - 4px);
		height: calc(100% - 8px);
		border-radius: 9999px;
		background: oklch(var(--b1));
		box-shadow:
			0 2px 8px oklch(0% 0 0 / 0.12),
			0 1px 2px oklch(0% 0 0 / 0.08);
		transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.mode-option {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 20px;
		border: none;
		border-radius: 9999px;
		background: transparent;
		color: oklch(var(--bc) / 0.5);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: color 0.2s ease;
		white-space: nowrap;
	}

	.mode-option:hover:not(.active):not(:disabled) {
		color: oklch(var(--bc) / 0.7);
	}

	.mode-option.active {
		color: oklch(var(--bc));
	}

	.mode-option:focus-visible {
		outline: 2px solid oklch(var(--p));
		outline-offset: 2px;
	}

	.mode-icon {
		width: 20px;
		height: 20px;
		flex-shrink: 0;
	}

	.mode-hint {
		margin-top: 8px;
		text-align: center;
	}

	.hint-text {
		font-size: 0.75rem;
		color: oklch(var(--bc) / 0.5);
		font-weight: 400;
	}

	/* Responsive: On small screens, show just icons with shorter labels */
	@media (max-width: 400px) {
		.mode-option {
			padding: 10px 14px;
			gap: 6px;
		}

		.mode-label {
			font-size: 0.75rem;
		}
	}

	/* Screen reader only */
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
