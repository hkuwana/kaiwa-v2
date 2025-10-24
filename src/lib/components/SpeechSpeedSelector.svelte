<script lang="ts">
	import { userPreferencesStore } from '$lib/stores/user-preferences.store.svelte';
	import { getLearnerCefrLevel } from '$lib/utils/cefr';
	import type { SpeechSpeed } from '$lib/server/db/types';

	interface Props {
		compact?: boolean;
	}

	const { compact = false } = $props();

	// Current selection from store
	let selectedSpeed = $state<SpeechSpeed>(userPreferencesStore.preferences?.speechSpeed || 'slow');

	// Sync with store changes
	$effect(() => {
		const storeSpeed = userPreferencesStore.preferences?.speechSpeed;
		if (storeSpeed && storeSpeed !== selectedSpeed) {
			selectedSpeed = storeSpeed;
		}
	});

	// Speed options for dropdown
	const speedOptions = [
		{ value: 'auto', label: '🤖 Auto (Recommended)', description: 'Based on your level' },
		{ value: 'very_slow', label: '🐌 Very Slow', description: 'Slow and deliberate' },
		{ value: 'slow', label: '🐢 Slow', description: 'Normal pace' },
		{ value: 'normal', label: '🚶 Normal', description: 'Faster pace' },
		{ value: 'fast', label: '🏃 Fast', description: 'Quick pace' },
		{ value: 'native', label: '🚀 Native', description: 'Slow and deliberate' }
	] as const;

	// Calculate auto mode display
	const autoSpeedDisplay = $derived(() => {
		if (selectedSpeed !== 'auto') return null;

		const cefrLevel = getLearnerCefrLevel(userPreferencesStore.preferences || {});
		const cefrMap: Record<string, string> = {
			A1: 'Very Slow',
			A2: 'Slow',
			B1: 'Normal',
			B2: 'Fast',
			C1: 'Fast',
			C2: 'Native'
		};

		return cefrMap[cefrLevel] || 'Slow';
	});

	// Handle speed change
	function handleSpeedChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		const newSpeed = target.value as SpeechSpeed;

		selectedSpeed = newSpeed;

		// Save to store
		userPreferencesStore.updatePreferences({
			speechSpeed: newSpeed
		});

		console.log(`🎚️ User changed speech speed to: ${newSpeed}`);
	}
</script>

<div class="speech-speed-selector space-y-2">
	<div class="flex items-center justify-between">
		<label for="speech-speed-select" class="text-sm font-semibold"> Speech Speed </label>
		{#if selectedSpeed === 'auto'}
			<span class="badge badge-outline badge-sm">
				Currently: {autoSpeedDisplay()}
			</span>
		{/if}
	</div>

	<!-- Compact Dropdown -->
	<select
		id="speech-speed-select"
		class="select-bordered select w-full select-sm"
		bind:value={selectedSpeed}
		onchange={handleSpeedChange}
	>
		{#each speedOptions as option, i (i)}
			<option value={option.value}>
				{option.label}
			</option>
		{/each}
	</select>

	<!-- Description (only in non-compact mode) -->
	{#if !compact}
		<div class="rounded-lg bg-base-200 p-3 text-xs text-base-content/70">
			{#if selectedSpeed === 'auto'}
				<strong>Auto Mode:</strong> Speed automatically adjusts based on your
				{getLearnerCefrLevel(userPreferencesStore.preferences || {})} level. Currently using:
				<strong>{autoSpeedDisplay()}</strong>.
				{#if userPreferencesStore.preferences?.targetLanguageId}
					Some languages may be slightly slower for better clarity.
				{/if}
			{:else}
				{@const option = speedOptions.find((o) => o.value === selectedSpeed)}
				<strong>{option?.label?.replace(/[🐌🐢🚶🏃🚀🤖]\s*/, '')}:</strong>
				{option?.description}
			{/if}
		</div>
	{/if}

	<!-- Info banner -->
	{#if !compact}
		<div class="alert alert-info py-2">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				class="h-4 w-4 shrink-0 stroke-current"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				></path>
			</svg>
			<span class="text-xs">
				AI speaks slower through clearer pacing, pauses, and articulation.
			</span>
		</div>
	{/if}
</div>
