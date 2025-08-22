<!-- src/lib/components/LoadingScreen.svelte -->
<script lang="ts">
	import { settingsStore } from '$lib/stores/settings.store.svelte';
	import { languages } from '$lib/data/languages';
	import { capitalizeFirstLetter } from '$lib/utils';

	// Get current settings
	const selectedLanguage = $derived(settingsStore.selectedLanguage);
	const selectedSpeaker = $derived(settingsStore.selectedSpeaker);

	// Get language info (now directly from the store)
	const languageInfo = $derived(selectedLanguage);

	// Tips that cycle through
	const tips = [
		'Find a quiet place to practice',
		'Speak clearly and at a natural pace',
		"Don't worry about making mistakes",
		'Take your time to think before speaking',
		'Practice regularly for best results'
	];

	let currentTipIndex = $state(0);

	// Cycle through tips every 4 seconds
	setInterval(() => {
		currentTipIndex = (currentTipIndex + 1) % tips.length;
	}, 4000);
</script>

<div class="flex items-center justify-center p-4">
	<div class="card w-full max-w-md bg-base-200 shadow-xl">
		<div class="card-body text-center">
			<!-- Language and Speaker Info -->
			<div class="mb-6">
				<h2 class="mb-2 text-2xl font-bold text-base-content">
					Practicing {languageInfo?.name}
				</h2>
				<p class="text-base-content/70">with {selectedSpeaker}</p>
			</div>

			<!-- Loading Animation -->
			<div class="mb-6 flex justify-center gap-2">
				<div class="h-3 w-3 animate-pulse rounded-full bg-primary"></div>
				<div
					class="h-3 w-3 animate-pulse rounded-full bg-primary"
					style="animation-delay: -0.32s"
				></div>
				<div
					class="h-3 w-3 animate-pulse rounded-full bg-primary"
					style="animation-delay: -0.16s"
				></div>
			</div>

			<!-- Status Text -->
			<div class="mb-6">
				<h3 class="mb-2 text-lg font-semibold text-base-content">
					Connecting to {capitalizeFirstLetter(selectedSpeaker)}...
				</h3>
				<p class="text-sm text-base-content/70">This may take a few moments</p>
			</div>

			<!-- Tips Section -->
			<div class="rounded-lg bg-base-200 p-4">
				<h4 class="mb-2 text-base font-semibold text-base-content">💡 Pro Tip</h4>
				<p
					class="min-h-[3rem] text-sm leading-relaxed text-base-content/70 transition-opacity duration-300"
				>
					{tips[currentTipIndex]}
				</p>
			</div>
		</div>
	</div>
</div>
