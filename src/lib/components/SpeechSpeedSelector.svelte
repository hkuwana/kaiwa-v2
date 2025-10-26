<script lang="ts">
	import { userPreferencesStore } from '$lib/stores/user-preferences.store.svelte';
	import type { SpeechSpeed } from '$lib/server/db/types';

	// Current selection from store - defaults to 'slow'
	let selectedSpeed = $state<SpeechSpeed>(userPreferencesStore.preferences?.speechSpeed ?? 'slow');

	// Speed options for dropdown
	const speedOptions = [
		{ value: 'very_slow', label: 'Very Slow', description: 'Slow and deliberate' },
		{ value: 'slow', label: 'Slow', description: 'Normal pace' },
		{ value: 'normal', label: 'Normal', description: 'Faster pace' },
		{ value: 'fast', label: 'Fast', description: 'Quick pace' },
		{ value: 'native', label: 'Native', description: 'Native speaker pace' }
	] as const;

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

<div class="speech-speed-selector">
	<label for="speech-speed-select" class="text-sm font-semibold"> Speech Speed </label>

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
</div>
