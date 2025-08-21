<script lang="ts">
	import AudioVisualizer from './AudioVisualizer.svelte';

	interface Props {
		isRecording?: boolean;
		isProcessing?: boolean;
		isSpeaking?: boolean;
		hasError?: boolean;
		audioLevel?: number;
		onclick?: () => void;
	}

	let {
		isRecording = false,
		isProcessing = false,
		isSpeaking = false,
		hasError = false,
		audioLevel = 0,
		onclick = () => {}
	}: Props = $props();

	// Dynamic styling based on state
	const buttonClass = $derived(() => {
		const base =
			'btn btn-circle w-32 h-32 text-3xl font-semibold transition-all duration-300 shadow-lg transform';

		if (hasError) {
			return `${base} btn-error`;
		} else if (isRecording) {
			return `${base} btn-error scale-110 shadow-xl`;
		} else if (isProcessing) {
			return `${base} btn-warning opacity-75 animate-pulse`;
		} else if (isSpeaking) {
			return `${base} btn-success opacity-75 animate-pulse`;
		} else {
			return `${base} btn-primary hover:scale-105 active:scale-95`;
		}
	});

	const buttonText = $derived(() => {
		if (hasError) return '⚠️';
		if (isRecording) return '⏹️';
		if (isProcessing) return '⏳';
		if (isSpeaking) return '🔊';
		return '🎤';
	});

	const isDisabled = $derived(isProcessing || isSpeaking);

	// Accessibility label
	const ariaLabel = $derived(() => {
		if (hasError) return 'Error occurred, click to retry';
		if (isRecording) return 'Stop recording';
		if (isProcessing) return 'Processing speech';
		if (isSpeaking) return 'AI is speaking';
		return 'Start recording';
	});
</script>

<div class="relative">
	<button
		class={buttonClass()}
		{onclick}
		disabled={isDisabled}
		aria-label={ariaLabel()}
		type="button"
	>
		<!-- Background visualizer -->
		<AudioVisualizer  {audioLevel} />

		<!-- Button content -->
		<span class="relative z-10">
			{buttonText()}
		</span>

		<!-- Pulse animation for recording state -->
		{#if isRecording}
			<div
				class="absolute inset-0 animate-ping rounded-full bg-error opacity-25"
				aria-hidden="true"
			></div>
		{/if}
	</button>

	<!-- State indicator text -->
	<div class="absolute -bottom-8 left-1/2 -translate-x-1/2 transform text-center">
		<p
			class="text-sm font-medium whitespace-nowrap {hasError
				? 'text-error'
				: isRecording
					? 'text-error'
					: isProcessing
						? 'text-warning'
						: isSpeaking
							? 'text-success'
							: 'text-base-content opacity-70'}"
		>
			{#if hasError}
				Error - Try Again
			{:else if isRecording}
				Recording...
			{:else if isProcessing}
				Processing...
			{:else if isSpeaking}
				Speaking...
			{:else}
				Click to Start
			{/if}
		</p>
	</div>
</div>
