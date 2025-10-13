<script lang="ts">
	// 🌍 Language Selector Component
	// Clean UI component for selecting conversation language and speaker

	import { languages as allLanguages } from '$lib/data/languages';
	import { getSpeakersByLanguage } from '$lib/data/speakers';
	import type { Language as DataLanguage } from '$lib/data/languages';

	const {
		selectedLanguage = null,
		selectedSpeaker = null,
		onLanguageChange,
		onSpeakerChange,
		disabled = false
	} = $props<{
		selectedLanguage?: DataLanguage | null;
		selectedSpeaker?: string | null;
		onLanguageChange: (language: DataLanguage) => void;
		onSpeakerChange?: (speakerId: string) => void;
		disabled?: boolean;
	}>();

	// Available languages for conversation practice (supported only)
	const languages = $derived(allLanguages.filter((l) => l.isSupported));

	// Get current language info

	// Get available speakers for selected language, sorted by dialect and with females first
	const availableSpeakers = $derived(
		selectedLanguage
			? getSpeakersByLanguage(selectedLanguage.code).sort((a, b) => {
					// Primary sort: dialectName
					const dialectCompare = (a.dialectName || '').localeCompare(b.dialectName || '');
					if (dialectCompare !== 0) return dialectCompare;

					// Secondary sort: gender (female first)
					if (a.gender === 'female' && b.gender !== 'female') return -1;
					if (a.gender !== 'female' && b.gender === 'female') return 1;

					// Tertiary sort: voiceName (alphabetical)
					return (a.voiceName || '').localeCompare(b.voiceName || '');
				})
			: []
	);

	// Get current speaker info
	const currentSpeaker = $derived(
		selectedSpeaker ? availableSpeakers.find((s) => s.id === selectedSpeaker) : null
	);

	let isOpen = $state(false);
	let viewingSpeakersFor = $state<DataLanguage | null>(null);

	// Auto-select first speaker if language is selected but no speaker is set
	$effect(() => {
		if (selectedLanguage && !selectedSpeaker && availableSpeakers.length > 0 && onSpeakerChange) {
			onSpeakerChange(availableSpeakers[0].id);
		}
	});

	function selectLanguage(language: DataLanguage) {
		onLanguageChange(language);

		// Show speaker selection if there are multiple speakers
		const speakersForLang = getSpeakersByLanguage(language.code);
		if (speakersForLang.length > 1) {
			viewingSpeakersFor = language;
		} else {
			// Set the first available speaker if only one exists
			if (speakersForLang.length === 1 && onSpeakerChange) {
				onSpeakerChange(speakersForLang[0].id);
			}
			closeMenu();
		}
	}

	function selectSpeaker(speakerId: string) {
		if (onSpeakerChange) {
			onSpeakerChange(speakerId);
		}
		closeMenu();
	}

	function closeMenu() {
		isOpen = false;
		viewingSpeakersFor = null;
	}

	function getGenderIcon(gender: 'male' | 'female' | 'neutral') {
		switch (gender) {
			case 'male':
				return '👨';
			case 'female':
				return '👩';
			case 'neutral':
				return '👤';
			default:
				return '👤';
		}
	}
</script>

<div class="relative w-full">
	<!-- Language selector button -->
	<button
		class="group btn flex w-full items-center justify-center border-2 px-6 py-4 text-base-content transition-all duration-200 btn-outline btn-lg hover:border-primary hover:bg-primary hover:text-primary-content"
		class:opacity-50={disabled}
		class:cursor-not-allowed={disabled}
		onclick={() => !disabled && (isOpen = !isOpen)}
		aria-haspopup="listbox"
		aria-expanded={isOpen}
		{disabled}
	>
		<div class="flex w-full items-center justify-center gap-3 text-center">
			<span class="text-lg">{selectedLanguage?.flag || '🌍'}</span>
			<div class="flex flex-col items-center">
				<span class="text-base font-medium"
					>{selectedLanguage ? 'Language' : 'Choose Your Language'}</span
				>
				{#if selectedLanguage}
					<span class="text-sm opacity-70">
						{selectedLanguage.name}
						{#if currentSpeaker}
							• {currentSpeaker.voiceName}
						{/if}
					</span>
				{:else}
					<span class="text-sm opacity-50">Not selected</span>
				{/if}
			</div>
		</div>
		<span class="icon-[mdi--chevron-down] h-5 w-5 transition-transform duration-200" class:rotate-180={isOpen}></span>
	</button>

	<!-- Language dropdown -->
	{#if isOpen}
		<div
			class="absolute top-full left-1/2 z-50 mt-3 w-96 -translate-x-1/2 transform rounded-2xl border border-base-200 bg-base-100 py-4 shadow-2xl backdrop-blur-md"
		>
			<!-- Header with back button if viewing speakers -->
			<div class="flex items-center gap-2 px-4 pb-3">
				{#if viewingSpeakersFor}
					<button
						onclick={() => {
							viewingSpeakersFor = null;
						}}
						class="btn btn-circle btn-ghost btn-sm"
						aria-label="Back to languages"
					>
						<span class="icon-[mdi--arrow-left] h-4 w-4"></span>
					</button>
				{/if}
				<h3 class="mb-2 text-sm font-semibold text-base-content/70">
					{#if viewingSpeakersFor}
						Choose Speaker for {viewingSpeakersFor.name}
					{:else}
						Choose Your Language
					{/if}
				</h3>
			</div>

			<!-- Content -->
			<div class="max-h-80 overflow-y-auto px-2">
				{#if viewingSpeakersFor}
					<!-- Speaker List -->
					{#each availableSpeakers as speaker (speaker.id)}
						<button
							onclick={() => selectSpeaker(speaker.id)}
							class="group btn my-1 flex w-full items-center justify-between rounded-xl px-4 py-3 text-left btn-ghost transition-colors duration-150 hover:bg-base-200/50"
							class:bg-primary={selectedSpeaker === speaker.id}
							class:text-primary-content={selectedSpeaker === speaker.id}
						>
							<div class="flex items-center gap-3">
								<span class="text-xl">{getGenderIcon(speaker.gender)}</span>
								<div class="flex flex-col">
									<span class="font-medium">{speaker.voiceName}</span>
									<span class="text-sm opacity-70">{speaker.dialectName} • {speaker.region}</span>
								</div>
							</div>
							                                <span class="icon-[mdi--check] h-5 w-5 flex-shrink-0"></span>						</button>
					{/each}
				{:else}
					<!-- Language List -->
					{#each languages as language (language.id)}
						<button
							onclick={() => selectLanguage(language)}
							class="group btn my-1 flex w-full items-center justify-between rounded-xl px-4 py-3 text-left btn-ghost transition-colors duration-150 hover:bg-base-200/50"
							class:bg-primary={selectedLanguage?.code === language.code}
							class:text-primary-content={selectedLanguage?.code === language.code}
						>
							<div class="flex items-center gap-3">
								<span class="text-xl">{language.flag || '🌍'}</span>
								<div class="flex flex-col">
									<span class="font-medium">{language.name}</span>
									<span class="text-sm opacity-70">{language.nativeName}</span>
								</div>
							</div>
							{#if selectedLanguage?.code === language.code}
								<span class="icon-[mdi--check] h-5 w-5 flex-shrink-0"></span>
							{/if}
						</button>
					{/each}
				{/if}
			</div>
		</div>
	{/if}
</div>
