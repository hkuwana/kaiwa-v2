<script lang="ts">
	import { userPreferencesStore } from '$lib/stores/user-preferences.store.svelte';
	import { realtimeOpenAI } from '$lib/stores/realtime-openai.store.svelte';
	import type { AudioInputMode } from '$lib/server/db/types';
	import { slide } from 'svelte/transition';
	import SpeechSpeedSelector from './SpeechSpeedSelector.svelte';
	// Component props
	interface Props {
		onModeChange?: (mode: AudioInputMode) => void;
	}

	let { onModeChange }: Props = $props();

	// Local state
	let isExpanded = $state(false);
	let selectedMode = $state<AudioInputMode>('ptt'); // Default to Push-to-Talk
	let isInitialized = $state(false);
	let pttStopDelay = $state(500); // Default 500ms delay

	// Initialize from user preferences OR use PTT default
	$effect(() => {
		if (isInitialized) return; // Only run once

		const savedMode = userPreferencesStore.getPreference('audioInputMode') as
			| AudioInputMode
			| undefined;

		// One-time migration: If saved mode is 'vad', reset to 'ptt' default
		// This ensures everyone starts with PTT as the new default
		let initialMode: AudioInputMode;
		if (savedMode === 'vad') {
			console.log('🎙️ AdvancedAudioOptions: Migrating from VAD to PTT default');
			initialMode = 'ptt';
			userPreferencesStore.updatePreferences({ audioInputMode: 'ptt' });
		} else {
			initialMode = savedMode || 'ptt';
		}

		selectedMode = initialMode;
		isInitialized = true;

		// Notify parent of initial mode
		onModeChange?.(initialMode);
		console.log('🎙️ AdvancedAudioOptions: Initialized with mode:', initialMode);
	});

	// Handle mode change
	function handleModeChange(mode: AudioInputMode) {
		selectedMode = mode;
		// Save to preferences
		userPreferencesStore.updatePreferences({ audioInputMode: mode });
		// Notify parent
		onModeChange?.(mode);
		console.log('🎙️ AdvancedAudioOptions: Mode changed to:', mode);
	}

	function toggleExpanded() {
		isExpanded = !isExpanded;
	}

	// Handle PTT delay change
</script>

<div class="advanced-options-container">
	<!-- Toggle Button -->
	<button
		class="btn gap-2 btn-ghost btn-sm"
		onclick={toggleExpanded}
		aria-expanded={isExpanded}
		aria-controls="advanced-options-panel"
	>
		<span class="icon-[mdi--cog] h-5 w-5"></span>
		Advanced Options
		<span
			class="icon-[mdi--chevron-down] h-4 w-4 transition-transform {isExpanded ? 'rotate-180' : ''}"
		></span>
	</button>

	<!-- Options Panel -->
	{#if isExpanded}
		<div
			id="advanced-options-panel"
			class="mt-4 rounded-lg border border-base-300 bg-base-100 p-4 shadow-sm"
			transition:slide={{ duration: 200 }}
		>
			<h3 class="mb-4 text-sm font-semibold">Audio Input Mode</h3>

			<!-- Audio Mode Swap Toggle -->
			<div class="flex flex-col gap-4">
				<!-- Mode Labels -->
				<div class="flex items-center justify-between">
					<div class="text-left">
						<div class="text-sm font-medium" class:text-primary={selectedMode === 'vad'}>
							Auto-Detect Mode
						</div>
						<div class="text-xs text-base-content/60">Hands-free speaking</div>
					</div>
					<div class="text-right">
						<div class="text-sm font-medium" class:text-primary={selectedMode === 'ptt'}>
							Push-to-Talk
						</div>
						<div class="text-xs text-base-content/60">Press to speak</div>
					</div>
				</div>

				<!-- Swap Toggle Container -->
				<div class="flex justify-center">
					<label class="swap swap-rotate">
						<!-- Hidden checkbox controls the state -->
						<input
							type="checkbox"
							checked={selectedMode === 'ptt'}
							onchange={() => handleModeChange(selectedMode === 'vad' ? 'ptt' : 'vad')}
						/>

						<!-- Auto-Detect icon (swap-off) -->
						<div class="swap-off flex items-center justify-center">
							<span class="icon-[mdi--microphone] h-8 w-8 text-base-content/70"></span>
						</div>

						<!-- Push-to-Talk icon (swap-on) -->
						<div class="swap-on flex items-center justify-center">
							<span class="icon-[mdi--gesture-tap] h-8 w-8 text-primary"></span>
						</div>
					</label>
				</div>

				<!-- Description based on selected mode -->
				<div class="rounded-lg bg-base-200 p-3">
					{#if selectedMode === 'vad'}
						<div class="text-xs text-base-content/70">
							<strong>Auto-Detect Mode (Voice Activity Detection):</strong> Automatically detects when
							you're speaking. Just talk naturally without pressing any buttons. Best for quiet environments.
						</div>
					{:else}
						<div class="text-xs text-base-content/70">
							<strong>Push-to-Talk Mode:</strong> Press and hold the microphone button to speak. Release
							to stop. Best for noisy backgrounds or when you want precise control over when your audio
							is transmitted.
						</div>
					{/if}
				</div>
			</div>

			<!-- Speech Speed Section -->
			<div class="divider"></div>

			<SpeechSpeedSelector compact={true} />

			<!-- Info Banner -->
			<div class="mt-4 alert py-2 text-xs">
				<span class="icon-[mdi--information-outline] h-4 w-4 shrink-0 stroke-info"></span>
				<span>You can change this setting anytime in your profile settings.</span>
			</div>
		</div>
	{/if}
</div>

<style>
	.advanced-options-container {
		width: 100%;
		max-width: 500px;
	}
</style>
