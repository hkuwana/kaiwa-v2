<script lang="ts">
	// 🌍 Navigation Language Switcher Component
	// Responsive language and speaker selector for navbar

	import { languages as allLanguages } from '$lib/data/languages';
	import { getSpeakersByLanguage, getDefaultSpeakerForLanguage, getSpeakerById } from '$lib/data/speakers';
	import { settingsStore } from '$lib/stores/settings.store.svelte';
	import { setSelectedLanguageIdCookie, setSelectedSpeakerIdCookie, getSelectedLanguageIdFromCookie, getSelectedSpeakerIdFromCookie } from '$lib/utils/cookies';
	import type { Language as DataLanguage } from '$lib/data/languages';

	// Available languages
	const languages = $derived(allLanguages.filter((l) => l.isSupported));

	// Get available speakers for selected language
	const availableSpeakers = $derived(
		settingsStore.selectedLanguage
			? getSpeakersByLanguage(settingsStore.selectedLanguage.code).sort((a, b) => {
					// Primary sort: dialectName
					const dialectCompare = (a.dialectName || '').localeCompare(b.dialectName || '');
					if (dialectCompare !== 0) return dialectCompare;

					// Secondary sort: gender (female first)
					if (a.gender === 'female' && b.gender !== 'female') return -1;
					if (a.gender !== 'female' && b.gender === 'female') return 1;

					// Tertiary sort: voiceName
					return (a.voiceName || '').localeCompare(b.voiceName || '');
				})
			: []
	);

	// Get current speaker to show region-specific emoji
	const currentSpeaker = $derived(
		settingsStore.selectedSpeaker ? getSpeakerById(settingsStore.selectedSpeaker) : null
	);

	// Get the primary country for the selected language (first speaker's country)
	const primaryCountryCode = $derived(
		availableSpeakers.length > 0
			? availableSpeakers[0].bcp47Code?.split('-')[1]
			: null
	);

	// Determine which emoji to show: country-specific flag if speaker is from different country,
	// otherwise use language flag (to avoid regional dialect emojis like 🏯, 🐻, etc.)
	const displayEmoji = $derived.by(() => {
		if (!currentSpeaker) {
			return settingsStore.selectedLanguage?.flag || '🌍';
		}

		const speakerCountry = currentSpeaker.bcp47Code?.split('-')[1];
		// Only show speaker emoji if it's a different country; otherwise use language flag
		if (speakerCountry && primaryCountryCode && speakerCountry !== primaryCountryCode) {
			return currentSpeaker.speakerEmoji || settingsStore.selectedLanguage?.flag || '🌍';
		}

		// Same country = use language flag
		return settingsStore.selectedLanguage?.flag || '🌍';
	});

	let viewingSpeakersFor = $state<DataLanguage | null>(null);
	let modalRef: HTMLDialogElement;
	let languageListRef: HTMLDivElement | null = null;
	let searchQuery = $state('');

	// Initialize language and speaker from cookies on component mount
	$effect.pre(() => {
		const savedLanguageId = getSelectedLanguageIdFromCookie();
		const savedSpeakerId = getSelectedSpeakerIdFromCookie();

		// Load language from cookie if available and not already set
		if (savedLanguageId && !settingsStore.selectedLanguage) {
			const language = allLanguages.find((lang) => lang.id === savedLanguageId);
			if (language) {
				settingsStore.selectedLanguage = language;
			}
		}

		// Load speaker from cookie if available and not already set
		if (savedSpeakerId && !settingsStore.selectedSpeaker) {
			settingsStore.selectedSpeaker = savedSpeakerId;
		}
	});

	// Sync speaker with language - auto-select default speaker if current speaker doesn't exist for the language
	$effect(() => {
		if (!settingsStore.selectedLanguage || !settingsStore.selectedSpeaker) return;

		const currentLanguageSpeakers = getSpeakersByLanguage(settingsStore.selectedLanguage.code);
		const speakerExists = currentLanguageSpeakers.some((s) => s.id === settingsStore.selectedSpeaker);

		// If speaker doesn't exist for this language, auto-select the default speaker for this language
		if (!speakerExists) {
			const defaultSpeaker = getDefaultSpeakerForLanguage(settingsStore.selectedLanguage.id);
			if (defaultSpeaker) {
				settingsStore.selectedSpeaker = defaultSpeaker.id;
				setSelectedSpeakerIdCookie(defaultSpeaker.id);
			}
		}
	});

	// Filtered languages based on search
	let filteredLanguages = $derived(
		!searchQuery.trim()
			? languages
			: languages.filter(
					(lang) =>
						lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
						lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
						lang.code.toLowerCase().includes(searchQuery.toLowerCase())
				)
	);

	// Scroll to top when switching views
	$effect(() => {
		// Access viewingSpeakersFor to track changes
		void viewingSpeakersFor;
		if (languageListRef) {
			languageListRef.scrollTop = 0;
		}
	});

	// Scroll to selected language when modal opens
	$effect(() => {
		if (!viewingSpeakersFor && settingsStore.selectedLanguage && languageListRef) {
			setTimeout(() => {
				const selectedButton = languageListRef?.querySelector(
					`[data-language-code="${settingsStore.selectedLanguage?.code}"]`
				);
				if (selectedButton) {
					selectedButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
				}
			}, 50);
		}
	});

	function selectLanguage(language: DataLanguage) {
		setSelectedLanguageIdCookie(language.id);
		settingsStore.selectedLanguage = language;

		// Auto-select default speaker
		const defaultSpeaker = getDefaultSpeakerForLanguage(language.id);
		if (defaultSpeaker) {
			setSelectedSpeakerIdCookie(defaultSpeaker.id);
			settingsStore.selectedSpeaker = defaultSpeaker.id;
		}

		// Show speaker selection
		const speakersForLang = getSpeakersByLanguage(language.code);
		if (speakersForLang.length > 0) {
			viewingSpeakersFor = language;
		} else {
			closeMenu();
		}
	}

	function selectSpeaker(speakerId: string) {
		setSelectedSpeakerIdCookie(speakerId);
		settingsStore.selectedSpeaker = speakerId;
		closeMenu();
	}

	function closeMenu() {
		viewingSpeakersFor = null;
		searchQuery = '';
		modalRef?.close();
	}

	function openMenu() {
		modalRef?.showModal();
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

<!-- Language selector button -->
<button
	class="btn btn-circle"
	onclick={openMenu}
	aria-haspopup="dialog"
	title="Change language and speaker"
>
	<span class="text-lg">{displayEmoji}</span>
</button>

<!-- Modal dialog -->
<dialog bind:this={modalRef} class="modal modal-bottom sm:modal-middle">
		<div class="modal-box flex max-h-[85vh] w-full max-w-2xl flex-col sm:max-h-screen">
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-base-200 pb-2 sm:pb-4">
				{#if viewingSpeakersFor}
					<button
						onclick={() => {
							viewingSpeakersFor = null;
							searchQuery = '';
						}}
						class="btn btn-circle btn-ghost btn-sm"
						aria-label="Back to languages"
					>
						<span class="icon-[mdi--arrow-left] h-5 w-5"></span>
					</button>
				{/if}
				<h2 class="flex-1 text-center text-base sm:text-lg font-semibold">
					{#if viewingSpeakersFor}
						Choose Speaker
					{:else}
						Choose Language
					{/if}
				</h2>
				<button onclick={closeMenu} class="btn btn-circle btn-ghost btn-sm" aria-label="Close">
					<span class="icon-[mdi--close] h-5 w-5"></span>
				</button>
			</div>

			<!-- Search input (languages only) -->
			{#if !viewingSpeakersFor}
				<div class="py-2 sm:py-4">
					<div class="relative">
						<input
							type="text"
							bind:value={searchQuery}
							placeholder="Search languages..."
							class="input-bordered input input-sm w-full pl-8"
							autofocus
						/>
						<span
							class="absolute top-1/2 left-3 icon-[mdi--magnify] h-4 w-4 -translate-y-1/2 text-base-content/50"
						></span>
					</div>
				</div>
			{/if}

			<!-- Content -->
			<div class="flex-1 overflow-y-auto" bind:this={languageListRef}>
				{#if viewingSpeakersFor}
					<!-- Speaker List -->
					{#each availableSpeakers as speaker (speaker.id)}
						<button
							onclick={() => selectSpeaker(speaker.id)}
							class="my-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors duration-150 hover:bg-primary/20 sm:my-2 sm:gap-4 sm:rounded-xl sm:px-4 sm:py-4"
							class:bg-primary={settingsStore.selectedSpeaker === speaker.id}
							class:text-primary-content={settingsStore.selectedSpeaker === speaker.id}
						>
							<!-- Speaker Avatar -->
							{#if speaker.characterImageUrl}
								<img
									alt={speaker.characterImageAlt || speaker.voiceName}
									src={speaker.characterImageUrl}
									class="h-10 w-10 flex-shrink-0 rounded-full object-cover sm:h-14 sm:w-14"
									loading="lazy"
								/>
							{:else}
								<div
									class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-base-200 text-xl sm:h-14 sm:w-14 sm:text-3xl"
								>
									{getGenderIcon(speaker.gender)}
								</div>
							{/if}
							<div class="flex min-w-0 flex-1 flex-col">
								<span class="text-sm font-semibold sm:text-base">{speaker.voiceName}</span>
								<span class="text-xs opacity-70 sm:text-sm">{speaker.dialectName} • {speaker.region}</span>
							</div>
							{#if settingsStore.selectedSpeaker === speaker.id}
								<span class="icon-[mdi--check] h-6 w-6 flex-shrink-0"></span>
							{/if}
						</button>
					{/each}
				{:else}
					<!-- Language List -->
					{#if filteredLanguages.length === 0}
						<div class="flex h-full items-center justify-center text-center text-base-content/60">
							<div>
								<span class="mx-auto mb-3 icon-[mdi--magnify] block h-12 w-12"></span>
								<p class="text-lg">No languages found</p>
								<p class="text-sm">Try a different search term</p>
							</div>
						</div>
					{:else}
						{#each filteredLanguages as language (language.id)}
							<button
								data-language-code={language.code}
								onclick={() => selectLanguage(language)}
								class="my-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors duration-150 hover:bg-primary/20 sm:my-2 sm:gap-4 sm:rounded-xl sm:px-4 sm:py-4"
								class:bg-primary={settingsStore.selectedLanguage?.code === language.code}
								class:text-primary-content={settingsStore.selectedLanguage?.code === language.code}
							>
								<span class="flex-shrink-0 text-xl sm:text-3xl">{language.flag || '🌍'}</span>
								<div class="flex min-w-0 flex-1 flex-col">
									<span class="text-sm font-semibold sm:text-base">{language.name}</span>
									<span class="text-xs opacity-70 sm:text-sm">{language.nativeName}</span>
								</div>
								{#if settingsStore.selectedLanguage?.code === language.code}
									<span class="icon-[mdi--check] h-6 w-6 flex-shrink-0"></span>
								{/if}
							</button>
						{/each}
					{/if}
				{/if}
			</div>
		</div>

		<!-- Modal backdrop (closes on click) -->
		<form method="dialog" class="modal-backdrop">
			<button>close</button>
		</form>
	</dialog>

<style>
	:global(body.language-modal-open) {
		overflow: hidden;
	}

	.slide-in {
		animation: slideIn 0.3s ease-out;
	}

	@keyframes slideIn {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	.slide-out {
		animation: slideOut 0.3s ease-in;
	}

	@keyframes slideOut {
		from {
			transform: translateX(0);
			opacity: 1;
		}
		to {
			transform: translateX(100%);
			opacity: 0;
		}
	}
</style>
