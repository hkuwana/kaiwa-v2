<script lang="ts">
	import { userPreferencesStore } from '$lib/stores/user-preferences.store.svelte';
	import { realtimeOpenAI } from '$lib/stores/realtime-openai.store.svelte';
	import type { AudioInputMode } from '$lib/server/db/types';
	import { slide } from 'svelte/transition';
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
	function handlePttDelayChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const delay = parseInt(target.value, 10);
		pttStopDelay = delay;
		realtimeOpenAI.setPttStopDelay(delay);
		console.log('🎙️ AdvancedAudioOptions: PTT stop delay changed to:', delay, 'ms');
	}
</script>

<div class="advanced-options-container">
	<!-- Toggle Button -->
	<button
		class="btn gap-2 btn-ghost btn-sm"
		onclick={toggleExpanded}
		aria-expanded={isExpanded}
		aria-controls="advanced-options-panel"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke-width="1.5"
			stroke="currentColor"
			class="h-5 w-5"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
			/>
			<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
		</svg>
		Advanced Options
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke-width="1.5"
			stroke="currentColor"
			class="h-4 w-4 transition-transform {isExpanded ? 'rotate-180' : ''}"
		>
			<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
		</svg>
	</button>

	<!-- Options Panel -->
	{#if isExpanded}
		<div
			id="advanced-options-panel"
			class="mt-4 rounded-lg border border-base-300 bg-base-100 p-4 shadow-sm"
			transition:slide={{ duration: 200 }}
		>
			<h3 class="mb-4 text-sm font-semibold">Audio Input Mode</h3>

			<!-- Toggle Switch -->
			<div class="flex flex-col gap-4">
				<!-- Mode Labels with Toggle -->
				<div class="flex items-center justify-between gap-4">
					<div class="flex-1 text-left">
						<div class="font-medium text-sm" class:text-primary={selectedMode === 'vad'}>
							Conversation Mode
						</div>
						<div class="text-xs text-base-content/60">Voice detection enabled</div>
					</div>

					<!-- Toggle Switch -->
					<label class="swap swap-flip">
						<input
							type="checkbox"
							checked={selectedMode === 'ptt'}
							onchange={() => handleModeChange(selectedMode === 'vad' ? 'ptt' : 'vad')}
							aria-label="Toggle between Conversation Mode and Push-to-Talk"
						/>
						<div class="swap-on">
							<div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke-width="2"
									stroke="currentColor"
									class="h-6 w-6 text-primary-content"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M15.75 5.25v13.5m-7.5-13.5v13.5"
									/>
								</svg>
							</div>
						</div>
						<div class="swap-off">
							<div class="flex h-12 w-12 items-center justify-center rounded-full bg-base-300">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke-width="2"
									stroke="currentColor"
									class="h-6 w-6"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
									/>
								</svg>
							</div>
						</div>
					</label>

					<div class="flex-1 text-right">
						<div class="font-medium text-sm" class:text-primary={selectedMode === 'ptt'}>
							Push-to-Talk
						</div>
						<div class="text-xs text-base-content/60">Press to speak</div>
					</div>
				</div>

				<!-- Description based on selected mode -->
				<div class="rounded-lg bg-base-200 p-3">
					{#if selectedMode === 'vad'}
						<div class="text-xs text-base-content/70">
							<strong>Conversation Mode (Voice Activity Detection):</strong> Automatically detects when
							you're speaking. Just talk naturally without pressing any buttons. Best for quiet environments.
						</div>
					{:else}
						<div class="text-xs text-base-content/70">
							<strong>Push-to-Talk Mode:</strong> Press and hold the microphone button to speak.
							Release to stop. Best for noisy backgrounds or when you want precise control over when
							your audio is transmitted.
						</div>
					{/if}
				</div>
			</div>

			<!-- PTT Stop Delay Slider (only show in PTT mode) -->
			{#if selectedMode === 'ptt'}
				<div class="mt-6 space-y-3">
					<h3 class="text-sm font-semibold">Push-to-Talk Settings</h3>

					<div class="rounded-lg bg-base-200 p-3">
						<label for="ptt-delay-slider" class="mb-2 block text-xs font-medium">
							Stop Delay: {pttStopDelay}ms
						</label>
						<input
							id="ptt-delay-slider"
							type="range"
							min="0"
							max="1000"
							step="100"
							bind:value={pttStopDelay}
							oninput={handlePttDelayChange}
							class="range range-primary range-sm"
						/>
						<div class="mt-2 flex justify-between text-xs text-base-content/60">
							<span>Instant (0ms)</span>
							<span>1 second</span>
						</div>
						<p class="mt-2 text-xs text-base-content/70">
							Adds a small delay after releasing the button before sending audio. This helps ensure
							the end of your speech is captured. Try 500ms if you're experiencing cut-off audio.
						</p>
					</div>
				</div>
			{/if}

			<!-- Info Banner -->
			<div class="mt-4 alert py-2 text-xs">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					class="h-4 w-4 shrink-0 stroke-info"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					></path>
				</svg>
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

	.radio:checked {
		--tw-radio-color: oklch(var(--p));
	}
</style>
