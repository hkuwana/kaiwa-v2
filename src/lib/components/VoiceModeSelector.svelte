<script lang="ts">
	import type { AudioInputMode } from '$lib/server/db/types';

	interface Props {
		mode: AudioInputMode;
		onModeChange: (mode: AudioInputMode) => void;
		disabled?: boolean;
		compact?: boolean;
	}

	let { mode, onModeChange, disabled = false, compact: _compact = false }: Props = $props();

	function handleToggle() {
		if (disabled) return;
		onModeChange(mode === 'vad' ? 'ptt' : 'vad');
	}

	// Get recommendation text based on mode
	const getRecommendation = (selectedMode: AudioInputMode) => {
		if (selectedMode === 'vad') {
			return 'Best with earphones';
		}
		return 'Best without earphones';
	};
</script>

<fieldset class="voice-mode-fieldset" class:disabled>
	<legend class="fieldset-legend">
		Voice Input Mode
		<span class="mode-hint">{getRecommendation(mode)}</span>
	</legend>

	<label class="label cursor-pointer">
		<span class="label-text flex items-center gap-2">
			<span class="h-5 w-5 text-base-content/70 icon-[mdi--walkie-talkie]"></span>
			<span class="font-medium">Walkie Talkie</span>
		</span>
		<input
			type="checkbox"
			class="toggle toggle-primary"
			checked={mode === 'vad'}
			onchange={handleToggle}
			{disabled}
			aria-label="Switch between Walkie Talkie and Casual Chat modes"
		/>
		<span class="label-text flex items-center gap-2">
			<span class="font-medium">Casual Chat</span>
			<span class="icon-[mdi--message-text-outline] h-5 w-5 text-base-content/70"></span>
		</span>
	</label>
</fieldset>

<style>
	.voice-mode-fieldset {
		border: 1px solid oklch(var(--bc) / 0.2);
		border-radius: var(--rounded-box, 1rem);
		padding: 1rem;
		background: oklch(var(--b1));
		width: 100%;
		max-width: 500px;
		margin: 0 auto;
	}

	.voice-mode-fieldset.disabled {
		opacity: 0.6;
		pointer-events: none;
	}

	.fieldset-legend {
		padding: 0 0.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: oklch(var(--bc) / 0.8);
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.mode-hint {
		font-size: 0.75rem;
		font-weight: 400;
		color: oklch(var(--bc) / 0.6);
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}

	.mode-hint::before {
		content: '•';
		margin: 0 0.25rem;
		opacity: 0.5;
	}

	.label {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0;
		gap: 1rem;
	}

	.label-text {
		font-size: 0.875rem;
		color: oklch(var(--bc) / 0.8);
	}

	/* Responsive */
	@media (max-width: 480px) {
		.voice-mode-fieldset {
			padding: 0.75rem;
		}

		.fieldset-legend {
			font-size: 0.8rem;
			flex-direction: column;
			align-items: flex-start;
			gap: 0.25rem;
		}

		.mode-hint::before {
			display: none;
		}

		.label {
			padding: 0.25rem 0;
			gap: 0.5rem;
		}

		.label-text {
			font-size: 0.8rem;
		}

		.label-text span:not(.font-medium) {
			display: none;
		}
	}
</style>
