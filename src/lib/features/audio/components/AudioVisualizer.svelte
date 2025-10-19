<script lang="ts">
	/**
	 * Enhanced AudioVisualizer.svelte
	 * A Svelte 5 component that visualizes audio levels with smooth movement during recording
	 * and static display when not recording. Uses the existing audio.service.ts for level monitoring.
	 */

	import { onMount, onDestroy } from 'svelte';
	import { audioService } from '$lib/services/audio.service';
	import type { AudioInputMode } from '$lib/server/db/types';

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
		audioInputMode?: AudioInputMode; // 'vad' or 'ptt'
		// Visuals
		// Timer props
		timeRemaining?: number; // in seconds
		isTimerActive?: boolean;
		maxSessionLengthSeconds?: number;
		// Children support
		children?: import('svelte').Snippet;
	}

	// --- PROPS ---
	const {
		audioLevel = 0,
		isRecording = false,
		isListening = false,
		onRecordStart = () => {},
		onRecordStop = () => {},
		onRecordComplete = () => {},
		deviceId = undefined,
		controlMode = 'internal',
		pressBehavior = 'press_hold',
		audioInputMode = 'ptt', // Default to Push-to-Talk
		timeRemaining = 180,
		isTimerActive = false,
		maxSessionLengthSeconds = 180,
		children
	}: Props = $props();

	// Determine if PTT controls should be active
	const isPTTMode = $derived(audioInputMode === 'ptt');
	const isVADMode = $derived(audioInputMode === 'vad');

	// --- REACTIVE VALUES (SVELTE 5 RUNES) ---

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
		// In VAD mode, pointer events are disabled - do nothing
		if (isVADMode) {
			console.log('🎙️ AudioVisualizer: Ignoring pointer down in VAD mode');
			return;
		}

		if (isRecording || isListening) return;
		// Latching tap-to-toggle when externally controlled
		if (controlMode === 'external' && pressBehavior === 'tap_toggle') {
			isPressed = true;

			if (!isRecording) {
				startRecording();
			} else {
				stopRecording();
			}
			return;
		}

		// Default press-and-hold behavior (PTT mode)
		isPressed = true;
		pressTimeout = window.setTimeout(() => {
			startRecording();
		}, 100);
	}

	function handlePointerUp() {
		// In VAD mode, pointer events are disabled - do nothing
		if (isVADMode) {
			return;
		}

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

	let displayAudioLevel = $state(audioLevel);

	// Use audio level from service if not provided as prop
	$effect(() => {
		if (audioLevel === 0 && currentAudioLevel > 0) {
			displayAudioLevel = currentAudioLevel;
		} else {
			displayAudioLevel = audioLevel;
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
		return '';
	});

	// Timer calculations
	const progressPercentage = $derived(() => {
		if (!isTimerActive || !timeRemaining || !maxSessionLengthSeconds) {
			return 100;
		}

		// Keep circle at 100% until 30 seconds or less remaining
		if (timeRemaining > 30) {
			return 100;
		}

		// When 30 seconds or less, show progress from 100% to 0%
		return Math.round((timeRemaining / 30) * 100);
	});

	const timerColor = $derived(() => {
		if (!isTimerActive) return 'text-primary';
		if (timeRemaining <= 30) return 'text-error';
		if (timeRemaining <= 60) return 'text-warning';
		return 'text-primary';
	});

	const buttonClass = $derived(() => {
		const base =
			'relative flex h-24 w-24 items-center justify-center cursor-pointer select-none transition-all duration-300 active:cursor-grabbing';

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
	<!-- Timer Ring (DaisyUI Radial Progress) -->
	<div class="absolute inset-0">
		<div
			class="radial-progress text-base-300/30"
			style="--value:100; --size:6rem; --thickness: 4px;"
		></div>
	</div>
	{#if isTimerActive}
		<div class="absolute inset-0">
			<div
				class="radial-progress {timerColor()}"
				style="--value:{progressPercentage()}; --size:6rem; --thickness: 4px; transition: --value 0.3s ease;"
			></div>
		</div>
	{/if}

	<!-- Audio Activity Pulse -->
	<div
		class="absolute inset-4 rounded-full bg-primary/10 transition-all duration-300"
		style="opacity: {audioLevel *
			0.8}; background: radial-gradient(circle, currentColor 0%, transparent 70%);"
		style:transform="translateY({verticalOffset}px) scale({1 + audioLevel * 0.2})"
	></div>

	<!-- Center Microphone Icon (Larger) -->
	<div class="pointer-events-none relative z-10 flex items-center justify-center">
		<span class="icon-[mdi--microphone] h-10 w-10 {timerColor()}"></span>
	</div>

	<!-- Children Content (e.g., additional info) in Center -->
	{#if children}
		<div class="pointer-events-none absolute inset-0 flex items-center justify-center">
			{@render children()}
		</div>
	{/if}

	<!-- Recording State Indicator -->
	{#if isRecording}
		<div
			class="absolute inset-0 animate-ping rounded-full border-2 border-error opacity-25 transition-opacity duration-200"
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
	{#if displayAudioLevel > 0}
		<div class="absolute -bottom-8 text-xs text-base-content/60">
			{Math.round(displayAudioLevel * 100)}%
		</div>
	{/if}
</div>

<style>
	/* Ensure smooth animations */
	* {
		transform-style: preserve-3d;
		backface-visibility: hidden;
	}
</style>
