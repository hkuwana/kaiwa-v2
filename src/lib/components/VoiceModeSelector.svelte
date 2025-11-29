<script lang="ts">
	import type { AudioInputMode } from '$lib/server/db/types';
	import { fly } from 'svelte/transition';

	interface Props {
		mode: AudioInputMode;
		onModeChange: (mode: AudioInputMode) => void;
		disabled?: boolean;
		compact?: boolean;
	}

	let { mode, onModeChange, disabled = false, compact = false }: Props = $props();

	function selectMode(newMode: AudioInputMode) {
		if (disabled || newMode === mode) return;
		onModeChange(newMode);
	}

	// Get recommendation text based on mode
	const getRecommendation = (selectedMode: AudioInputMode) => {
		if (selectedMode === 'vad') {
			return 'Recommended with earphones or headphones';
		}
		return 'Recommended without earphones (speaker mode)';
	};
</script>

<div class="voice-mode-container" class:compact>
	<!-- Mode Selector -->
	<div class="mode-selector-wrapper">
		<div
			class="mode-selector"
			class:disabled
			role="radiogroup"
			aria-label="Voice input mode"
		>
			<!-- Sliding indicator -->
			<div
				class="mode-indicator"
				style="transform: translateX({mode === 'vad' ? 0 : 100}%)"
				aria-hidden="true"
			></div>

			<!-- Casual Chat (VAD) Button -->
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
				<span class="mode-label">
					<span class="mode-name">Casual Chat</span>
					{#if !compact}
						<span class="mode-subtitle">Natural conversation</span>
					{/if}
				</span>
				{#if mode === 'vad'}
					<span class="sr-only">(active)</span>
				{/if}
			</button>

			<!-- Walkie Talkie (PTT) Button -->
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
				<span class="mode-label">
					<span class="mode-name">Walkie Talkie</span>
					{#if !compact}
						<span class="mode-subtitle">Press & hold</span>
					{/if}
				</span>
				{#if mode === 'ptt'}
					<span class="sr-only">(active)</span>
				{/if}
			</button>
		</div>
	</div>

	<!-- Recommendation Badge -->
	<div class="recommendation" in:fly={{ y: -5, duration: 200 }}>
		<span class="icon-[mdi--information-outline] recommendation-icon"></span>
		<span class="recommendation-text">{getRecommendation(mode)}</span>
	</div>
</div>

<style>
	.voice-mode-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		width: 100%;
	}

	.voice-mode-container.compact {
		gap: 8px;
	}

	.mode-selector-wrapper {
		width: 100%;
		display: flex;
		justify-content: center;
	}

	.mode-selector {
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
		width: 100%;
		max-width: 480px;
	}

	.mode-selector.disabled {
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
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4px;
		padding: 12px 16px;
		border: none;
		border-radius: 9999px;
		background: transparent;
		color: oklch(var(--bc) / 0.5);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: color 0.2s ease;
		white-space: nowrap;
		flex: 1;
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
		width: 24px;
		height: 24px;
		flex-shrink: 0;
	}

	.mode-label {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
	}

	.mode-name {
		font-size: 0.875rem;
		font-weight: 600;
	}

	.mode-subtitle {
		font-size: 0.7rem;
		opacity: 0.7;
		font-weight: 400;
	}

	.recommendation {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 8px 16px;
		border-radius: 9999px;
		background: oklch(var(--b2) / 0.6);
		font-size: 0.75rem;
		color: oklch(var(--bc) / 0.7);
		font-weight: 500;
		backdrop-filter: blur(8px);
	}

	.recommendation-icon {
		width: 14px;
		height: 14px;
		flex-shrink: 0;
		color: oklch(var(--in));
	}

	.recommendation-text {
		white-space: nowrap;
	}

	/* Compact mode adjustments */
	.voice-mode-container.compact .mode-selector {
		max-width: 360px;
	}

	.voice-mode-container.compact .mode-option {
		padding: 10px 12px;
		gap: 3px;
	}

	.voice-mode-container.compact .mode-icon {
		width: 20px;
		height: 20px;
	}

	.voice-mode-container.compact .mode-name {
		font-size: 0.8rem;
	}

	.voice-mode-container.compact .recommendation {
		padding: 6px 12px;
		font-size: 0.7rem;
	}

	/* Responsive */
	@media (max-width: 400px) {
		.mode-option {
			padding: 10px 12px;
			gap: 3px;
		}

		.mode-name {
			font-size: 0.8rem;
		}

		.mode-subtitle {
			font-size: 0.65rem;
		}

		.mode-icon {
			width: 20px;
			height: 20px;
		}

		.recommendation {
			padding: 6px 12px;
			font-size: 0.7rem;
		}

		.recommendation-text {
			white-space: normal;
			text-align: center;
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
