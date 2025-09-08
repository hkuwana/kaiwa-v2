<script lang="ts">
	/**
	 * Enhanced AudioVisualizer.svelte
	 * A Svelte 5 component that visualizes audio levels with smooth movement during recording
	 * and static display when not recording. Uses the existing audio.service.ts for level monitoring.
	 */

	import { onMount, onDestroy } from 'svelte';
	import { audioService } from '$lib/services/audio.service';

	interface Props {
		audioLevel?: number;
		isRecording?: boolean;
		isListening?: boolean;
		onRecordStart?: () => void;
		onRecordStop?: () => void;
		onRecordComplete?: (audioData: Blob) => void;
		deviceId?: string;
		controlMode?: 'internal' | 'external';
		pressBehavior?: 'press_hold' | 'tap_toggle';
	}

	// --- PROPS ---
	let {
		audioLevel = 0,
		isRecording = false,
		isListening = false,
		onRecordStart = () => {},
		onRecordStop = () => {},
		onRecordComplete = () => {},
		deviceId = undefined,
		controlMode = 'internal',
		pressBehavior = 'press_hold'
	}: Props = $props();

	// --- REACTIVE VALUES (SVELTE 5 RUNES) ---
	/**
	 * The scale will range from 1 (no sound) to 2 (max sound) for more dramatic effect.
	 */
	const scale = $derived(1 + audioLevel);

	/**
	 * The opacity of the outer glow will range from 0.1 (no sound) to 0.9 (max sound).
	 */
	const opacity = $derived(0.1 + audioLevel * 0.8);

	/**
	 * The blur radius for the glow effect, making it more dynamic.
	 */
	const blurRadius = $derived(2 + audioLevel * 8);

	/**
	 * The color intensity based on audio level and recording state.
	 */
	const colorIntensity = $derived(() => {
		if (isRecording) return 'bg-error';
		if (isListening) return 'bg-warning';
		return audioLevel > 0.5 ? 'bg-accent-focus' : 'bg-accent';
	});

	/**
	 * Smooth vertical movement for recording state
	 */
	let verticalOffset = $state(0);
	let animationFrame: number | null = null;
	let recordingStartTime = $state(0);

	// --- RECORDING STATE ---
	let mediaRecorder: MediaRecorder | null = null;
	let audioChunks: Blob[] = [];
	let isPressed = $state(false);
	let pressStartTime = $state(0);
	let pressTimeout: number | null = null;
	let audioStream: MediaStream | null = null;

	// --- AUDIO SERVICE INTEGRATION ---
	let currentAudioLevel = $state(0);
	let isAudioServiceInitialized = $state(false);

	// --- ANIMATION ---
	function startRecordingAnimation() {
		if (animationFrame) return;

		recordingStartTime = Date.now();

		function animate() {
			const elapsed = Date.now() - recordingStartTime;
			// Smooth sine wave movement with 2-second period
			verticalOffset = Math.sin(elapsed * 0.003) * 8;

			animationFrame = requestAnimationFrame(animate);
		}

		animate();
	}

	function stopRecordingAnimation() {
		if (animationFrame) {
			cancelAnimationFrame(animationFrame);
			animationFrame = null;
		}
		verticalOffset = 0;
	}

	// --- RECORDING FUNCTIONS ---
	async function startRecording() {
		try {
			if (controlMode === 'external') {
				// Delegate to parent; do not open a local stream
				onRecordStart();
				startRecordingAnimation();
				return;
			}

			// Internal demo mode
			if (!isAudioServiceInitialized) {
				await audioService.initialize();
				isAudioServiceInitialized = true;
			}
			audioStream = await audioService.getStream(deviceId);
			mediaRecorder = new MediaRecorder(audioStream, { mimeType: 'audio/webm;codecs=opus' });
			audioChunks = [];
			mediaRecorder.ondataavailable = (event) => {
				if (event.data.size > 0) audioChunks.push(event.data);
			};
			mediaRecorder.onstop = () => {
				const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
				onRecordComplete(audioBlob);
				audioStream?.getTracks().forEach((track) => track.stop());
				audioStream = null;
			};
			mediaRecorder.start();
			onRecordStart();
			startRecordingAnimation();
		} catch (error) {
			console.error('Failed to start recording:', error);
		}
	}

	function stopRecording() {
		if (controlMode === 'external') {
			onRecordStop();
			stopRecordingAnimation();
			return;
		}

		if (mediaRecorder && mediaRecorder.state === 'recording') {
			mediaRecorder.stop();
			onRecordStop();
			stopRecordingAnimation();
		}
	}

	// --- PRESS HANDLING ---
	function handlePointerDown() {
		if (isRecording || isListening) return;
		// Latching tap-to-toggle when externally controlled
		if (controlMode === 'external' && pressBehavior === 'tap_toggle') {
			isPressed = true;
			pressStartTime = Date.now();
			if (!isRecording) {
				startRecording();
			} else {
				stopRecording();
			}
			return;
		}

		// Default press-and-hold behavior
		isPressed = true;
		pressStartTime = Date.now();
		pressTimeout = window.setTimeout(() => {
			startRecording();
		}, 100);
	}

	function handlePointerUp() {
		if (!isPressed) return;

		isPressed = false;

		if (pressTimeout) {
			clearTimeout(pressTimeout);
			pressTimeout = null;
		}

		// In tap-to-toggle, do not auto-stop on pointerup
		if (controlMode === 'external' && pressBehavior === 'tap_toggle') {
			return;
		}

		// Stop based on control mode (press-and-hold)
		if (controlMode === 'external') {
			stopRecording();
		} else if (mediaRecorder && mediaRecorder.state === 'recording') {
			stopRecording();
		}
	}

	function handlePointerLeave() {
		if (isPressed) {
			handlePointerUp();
		}
	}

	// --- KEYBOARD HANDLING ---
	function handleKeyDown(event: KeyboardEvent) {
		// Only handle spacebar and enter key
		if (event.key !== ' ' && event.key !== 'Enter') return;

		// Prevent default behavior (page scroll for spacebar)
		event.preventDefault();

		if (controlMode === 'external' && pressBehavior === 'tap_toggle') {
			if (!isRecording) startRecording();
			else stopRecording();
			return;
		}

		if (isRecording || isListening) return;
		isPressed = true;
		pressStartTime = Date.now();
		startRecording();
	}

	function handleKeyUp(event: KeyboardEvent) {
		// Only handle spacebar and enter key
		if (event.key !== ' ' && event.key !== 'Enter') return;

		// Prevent default behavior
		event.preventDefault();

		if (controlMode === 'external' && pressBehavior === 'tap_toggle') {
			// no-op for toggle
			return;
		}

		if (!isPressed) return;
		isPressed = false;

		if (controlMode === 'external') {
			stopRecording();
		} else if (mediaRecorder && mediaRecorder.state === 'recording') {
			stopRecording();
		}
	}

	// --- AUDIO SERVICE SETUP ---
	async function initializeAudioService() {
		try {
			await audioService.initialize();
			isAudioServiceInitialized = true;

			// Set up audio level monitoring
			audioService.onLevelUpdate((level) => {
				currentAudioLevel = level.level;
			});

			console.log('✅ AudioVisualizer: Audio service initialized');
		} catch (error) {
			console.error('❌ AudioVisualizer: Failed to initialize audio service:', error);
		}
	}

	// --- EFFECTS ---
	$effect(() => {
		if (isRecording) {
			startRecordingAnimation();
		} else {
			stopRecordingAnimation();
		}
	});

	// Use audio level from service if not provided as prop
	$effect(() => {
		if (audioLevel === 0 && currentAudioLevel > 0) {
			audioLevel = currentAudioLevel;
		}
	});

	// --- LIFECYCLE ---
	onMount(() => {
		if (controlMode === 'internal') initializeAudioService();
	});

	// --- CLEANUP ---
	onDestroy(() => {
		stopRecordingAnimation();
		if (pressTimeout) {
			clearTimeout(pressTimeout);
		}
		if (mediaRecorder && mediaRecorder.state === 'recording') {
			mediaRecorder.stop();
		}
		if (audioStream) {
			audioStream.getTracks().forEach((track) => track.stop());
		}
	});

	// --- ACCESSIBILITY ---
	const buttonLabel = $derived(() => {
		if (isRecording) return 'Recording - Release to stop';
		if (isListening) return 'Listening to AI';
		return 'Press and hold to talk';
	});

	const buttonClass = $derived(() => {
		const base =
			'relative flex h-24 w-24 items-center justify-center cursor-pointer select-none transition-all duration-300';

		if (isRecording) {
			return `${base} scale-110`;
		} else if (isListening) {
			return `${base} opacity-75`;
		} else if (isPressed) {
			return `${base} scale-105`;
		}

		return `${base} hover:scale-105 active:scale-95`;
	});
</script>

<!-- 
	The enhanced structure includes:
	- Press-to-record functionality
	- Smooth vertical movement during recording
	- Static display when not recording
	- Enhanced visual feedback
	- Integration with existing audio.service.ts
  -->
<div
	class={buttonClass()}
	role="button"
	tabindex="0"
	aria-label={buttonLabel()}
	onpointerdown={handlePointerDown}
	onpointerup={handlePointerUp}
	onpointerleave={handlePointerLeave}
	onkeydown={(e) => {
		if (e.key === ' ' || e.key === 'Enter') {
			e.preventDefault();
			handleKeyDown(e);
		}
	}}
	onkeyup={(e) => {
		if (e.key === ' ' || e.key === 'Enter') {
			e.preventDefault();
			handleKeyUp(e);
		}
	}}
>
	<!-- Outer Circle (The Pulse/Glow) -->
	<div
		class="absolute h-full w-full rounded-full transition-all duration-75 ease-out {colorIntensity()}"
		style:transform="translateY({verticalOffset}px) scale({scale})"
		style:opacity
		style:filter="blur({blurRadius}px)"
	></div>

	<!-- Inner Circle (The Core) -->
	<div
		class="relative h-12 w-12 rounded-full {colorIntensity()}/80 transition-all duration-300"
		style:transform="translateY({verticalOffset}px)"
	></div>

	<!-- Recording Indicator -->
	{#if isRecording}
		<div
			class="absolute inset-0 animate-ping rounded-full bg-error opacity-25"
			aria-hidden="true"
		></div>
	{/if}

	<!-- Press State Indicator -->
	{#if isPressed && !isRecording}
		<div
			class="absolute inset-0 scale-110 rounded-full bg-primary/20 transition-all duration-200"
			aria-hidden="true"
		></div>
	{/if}

	<!-- Audio Level Indicator Text (for debugging) -->
	{#if audioLevel > 0}
		<div class="absolute -bottom-8 text-xs text-base-content/60">
			{Math.round(audioLevel * 100)}%
		</div>
	{/if}

	<!-- Recording State Text -->
	{#if isRecording}
		<div class="absolute -bottom-8 text-xs font-medium text-error">Recording...</div>
	{:else if isListening}
		<div class="absolute -bottom-8 text-xs font-medium text-warning">Listening...</div>
	{:else if !isPressed}
		<div class="absolute -bottom-8 text-xs text-base-content/60">Press and hold to talk</div>
	{/if}
</div>

<style>
	/* Ensure smooth animations */
	* {
		transform-style: preserve-3d;
		backface-visibility: hidden;
	}

	/* Custom cursor for recording state */
	.cursor-pointer:active {
		cursor: grabbing;
	}
</style>
