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
			'relative w-32 h-32 rounded-full text-white font-semibold text-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-opacity-50 shadow-lg transform';

		if (hasError) {
			return `${base} bg-red-600 border-2 border-red-400 hover:bg-red-700 focus:ring-red-300`;
		} else if (isRecording) {
			return `${base} bg-red-500 hover:bg-red-600 focus:ring-red-300 scale-110 shadow-xl`;
		} else if (isProcessing) {
			return `${base} bg-yellow-500 cursor-not-allowed opacity-75 animate-pulse`;
		} else if (isSpeaking) {
			return `${base} bg-green-500 cursor-not-allowed opacity-75 animate-pulse`;
		} else {
			return `${base} bg-blue-500 hover:bg-blue-600 focus:ring-blue-300 hover:scale-105 active:scale-95`;
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
		<AudioVisualizer {isRecording} {audioLevel} />

		<!-- Button content -->
		<span class="relative z-10 text-3xl">
			{buttonText()}
		</span>

		<!-- Pulse animation for recording state -->
		{#if isRecording}
			<div
				class="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-25"
				aria-hidden="true"
			></div>
		{/if}
	</button>

	<!-- State indicator text -->
	<div class="absolute -bottom-8 left-1/2 -translate-x-1/2 transform text-center">
		<p
			class="text-sm font-medium whitespace-nowrap {hasError
				? 'text-red-600'
				: isRecording
					? 'text-red-600'
					: isProcessing
						? 'text-yellow-600'
						: isSpeaking
							? 'text-green-600'
							: 'text-gray-600'}"
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
