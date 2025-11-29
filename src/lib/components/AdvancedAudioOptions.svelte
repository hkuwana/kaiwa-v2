<script lang="ts">
	import { userPreferencesStore } from '$lib/stores/user-preferences.store.svelte';
	import type { AudioInputMode } from '$lib/server/db/types';
	import { getAudioInputModeFromCookie, setAudioInputModeCookie } from '$lib/utils/cookies';
	import { slide } from 'svelte/transition';
	import SpeechSpeedSelector from './SpeechSpeedSelector.svelte';
	import VoiceModeSelector from './VoiceModeSelector.svelte';
	// Component props
	interface Props {
		onModeChange?: (mode: AudioInputMode) => void;
	}

	let { onModeChange }: Props = $props();

	// Local state
	let isExpanded = $state(false);
	let selectedMode = $state<AudioInputMode>('ptt'); // Default to Push-to-Talk (PTT)
	let isInitialized = $state(false);
	let _pttStopDelay = $state(500); // Default 500ms delay
	let showHeadphoneWarning = $state(false);
	let pendingMode = $state<AudioInputMode | null>(null);

	// Initialize from cookies, user preferences, or use VAD default
	$effect(() => {
		if (isInitialized) return; // Only run once

		// Check cookies first (user's last preference)
		const cookieMode = getAudioInputModeFromCookie();
		if (cookieMode) {
			selectedMode = cookieMode;
			console.log('🎙️ AdvancedAudioOptions: Restored from cookie:', cookieMode);
		} else {
			// Default to 'ptt' (Push-to-Talk) for best audio quality
			// Conversation Mode (VAD) requires headphones to prevent feedback
			selectedMode = 'ptt';
			console.log('🎙️ AdvancedAudioOptions: Using Push-to-Talk (ptt) as default');
		}

		isInitialized = true;

		// Notify parent of initial mode
		onModeChange?.(selectedMode);
		console.log('🎙️ AdvancedAudioOptions: Initialized with mode:', selectedMode);
	});

	// Handle mode change
	function handleModeChange(mode: AudioInputMode) {
		// Show warning when switching to conversation mode (VAD)
		if (mode === 'vad' && selectedMode === 'ptt') {
			pendingMode = mode;
			showHeadphoneWarning = true;
			return;
		}

		applyModeChange(mode);
	}

	function applyModeChange(mode: AudioInputMode) {
		selectedMode = mode;
		// Save to cookie for quick recall
		setAudioInputModeCookie(mode);
		// Save to preferences for persistence across devices
		userPreferencesStore.updatePreferences({ audioInputMode: mode });
		// Notify parent
		onModeChange?.(mode);
		console.log('🎙️ AdvancedAudioOptions: Mode changed to:', mode);
	}

	function confirmModeChange() {
		if (pendingMode) {
			applyModeChange(pendingMode);
			pendingMode = null;
		}
		showHeadphoneWarning = false;
	}

	function cancelModeChange() {
		pendingMode = null;
		showHeadphoneWarning = false;
	}

	function toggleExpanded() {
		isExpanded = !isExpanded;
	}

	// Handle PTT delay change
</script>

<div class="advanced-options-container">
	<!-- Voice Mode Selector - Always visible at top -->
	<div class="mb-6">
		<VoiceModeSelector mode={selectedMode} onModeChange={handleModeChange} compact={false} />
	</div>

	<!-- Toggle Button for Speech Speed Settings -->
	<button
		class="btn gap-2 btn-ghost btn-sm"
		onclick={toggleExpanded}
		aria-expanded={isExpanded}
		aria-controls="advanced-options-panel"
	>
		<span class="icon-[mdi--cog] h-5 w-5"></span>
		Speech Speed Settings
		<span
			class="icon-[mdi--chevron-down] h-4 w-4 transition-transform {isExpanded ? 'rotate-180' : ''}"
		></span>
	</button>

	<!-- Options Panel - Speech Speed Only -->
	{#if isExpanded}
		<div
			id="advanced-options-panel"
			class="mt-4 rounded-lg border border-base-300 bg-base-100 p-4 shadow-sm"
			transition:slide={{ duration: 200 }}
		>
			<SpeechSpeedSelector />

			<!-- Info Banner -->
			<div class="mt-4 alert py-2 text-xs">
				<span class="icon-[mdi--information-outline] h-4 w-4 shrink-0 stroke-info"></span>
				<span>You can change these settings anytime in your profile.</span>
			</div>
		</div>
	{/if}

	<!-- Headphone Warning Modal -->
	{#if showHeadphoneWarning}
		<dialog class="modal-open modal">
			<div class="modal-box">
				<h3 class="flex items-center gap-2 text-lg font-bold">
					<span class="icon-[mdi--alert-circle-outline] h-6 w-6 text-warning"></span>
					Headphones Required
				</h3>
				<div class="space-y-3 py-4">
					<p class="text-sm">
						<strong>Casual Chat</strong> mode works best with headphones or earbuds to prevent audio
						feedback loops.
					</p>
					<div class="alert py-2 alert-warning">
						<span class="icon-[mdi--headphones] h-5 w-5 shrink-0"></span>
						<span class="text-xs"
							>Without headphones, the assistant's voice may be picked up by your microphone,
							creating an echo effect and poor audio quality.</span
						>
					</div>
					<p class="text-sm">Do you have headphones or earbuds connected?</p>
				</div>
				<div class="modal-action">
					<button class="btn btn-ghost" onclick={cancelModeChange}>Cancel</button>
					<button class="btn btn-primary" onclick={confirmModeChange}>
						<span class="icon-[mdi--check] h-5 w-5"></span>
						Yes, Continue
					</button>
				</div>
			</div>
			<form method="dialog" class="modal-backdrop" onclick={cancelModeChange}>
				<button>close</button>
			</form>
		</dialog>
	{/if}
</div>

<style>
	.advanced-options-container {
		width: 100%;
		max-width: 500px;
	}
</style>
