<!-- src/lib/components/LanguageStartButton.svelte -->
<script lang="ts">
	import { languages as allLanguages } from '$lib/data/languages';
	import { speakersData, getSpeakersByLanguage } from '$lib/data/speakers';
	import { goto } from '$app/navigation';
	import type { Language as DataLanguage } from '$lib/data/languages';
	import type { User } from '$lib/server/db/types';

	// Props for tracking
	interface Props {
		user: User;
		selectedLanguage?: DataLanguage | null;
		selectedSpeaker?: string | null;
		onLanguageChange?: (language: DataLanguage) => void;
		onSpeakerChange?: (speakerId: string) => void;
		onStartClick?: () => void;
	}

	const {
		user,
		selectedLanguage = null,
		selectedSpeaker = null,
		onLanguageChange,
		onSpeakerChange,
		onStartClick
	}: Props = $props();

	// Component state
	let isLanguageMenuOpen = $state(false);
	let searchTerm = $state('');
	let viewingSpeakersFor = $state<DataLanguage | null>(null);

	// Determine if user is a guest
	const isGuest = user.id === 'guest';

	// Get available speakers for selected language
	const availableSpeakers = $derived(
		selectedLanguage ? getSpeakersByLanguage(selectedLanguage.code) : []
	);

	// Get speakers for the language being viewed (for speaker selection)
	const viewingSpeakers = $derived(
		viewingSpeakersFor ? getSpeakersByLanguage(viewingSpeakersFor.code) : []
	);

	// Get current speaker info
	const currentSpeaker = $derived(
		selectedSpeaker ? availableSpeakers.find((s) => s.id === selectedSpeaker) : null
	);

	// Auto-select first speaker if language is selected but no speaker is set
	$effect(() => {
		if (selectedLanguage && !selectedSpeaker && availableSpeakers.length > 0 && onSpeakerChange) {
			onSpeakerChange(availableSpeakers[0].id);
		}
	});

	// Filter languages based on search
	const filteredLanguages = $derived(
		allLanguages
			.filter((lang) => lang.isSupported)
			.filter(
				(lang) =>
					lang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
					lang.nativeName.toLowerCase().includes(searchTerm.toLowerCase())
			)
	);

	// Popular languages first, then alphabetical
	const orderedLanguages = $derived.by(() => {
		const popularCodes = ['en', 'es', 'ja', 'zh', 'fr', 'ko', 'de'];
		const popular = popularCodes
			.map((code) => filteredLanguages.find((lang) => lang.code === code))
			.filter((lang): lang is DataLanguage => Boolean(lang));

		const others = filteredLanguages
			.filter((lang) => !popularCodes.includes(lang.code))
			.sort((a, b) => a.name.localeCompare(b.name));

		return [...popular, ...others];
	});

	// Functions
	function handleLanguageSelect(lang: DataLanguage) {
		if (onLanguageChange) {
			onLanguageChange(lang);
		}
		// Show speaker selection if there are multiple speakers
		const speakersForLang = getSpeakersByLanguage(lang.code);
		if (speakersForLang.length > 1) {
			viewingSpeakersFor = lang;
			searchTerm = '';
		} else {
			// Set the first available speaker if only one exists
			if (speakersForLang.length === 1 && onSpeakerChange) {
				onSpeakerChange(speakersForLang[0].id);
			}
			closeMenu();
		}
	}

	function handleSpeakerSelect(speakerId: string) {
		if (onSpeakerChange) {
			onSpeakerChange(speakerId);
		}
		closeMenu();
	}

	function handleStartClick(event: MouseEvent) {
		const sessionId = crypto.randomUUID();
		if (selectedLanguage) {
			// Track the click event
			if (onStartClick) {
				onStartClick();
			}

			// Add immediate visual feedback
			const button = event?.currentTarget as HTMLButtonElement;
			if (button) {
				button.classList.add('loading');
				button.disabled = true;
			}

			// Navigate with smooth transition
			goto(`/conversation?sessionId=${sessionId}&autoStart=true`);
		}
	}

	function toggleLanguageMenu() {
		isLanguageMenuOpen = !isLanguageMenuOpen;
	}

	function closeMenu() {
		isLanguageMenuOpen = false;
		searchTerm = '';
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

<div class="relative flex flex-col items-center gap-6 text-base-content">
	<!-- Language Selector - Minimal and elegant -->
	<div class="relative">
		<button
			onclick={toggleLanguageMenu}
			class="group btn flex items-center gap-3 border-2 px-6 py-3 text-base-content btn-ghost transition-all duration-200 btn-outline btn-lg hover:border-primary hover:bg-primary hover:text-primary-content"
			aria-label="Select language"
		>
			{#if selectedLanguage}
				<span class="text-lg"> 🌍 </span>
				<div class="flex flex-col items-start">
					<span class="text-base font-medium">
						{selectedLanguage.name}
					</span>
					{#if currentSpeaker}
						<span class="text-sm opacity-70">
							with {currentSpeaker.voiceName}
						</span>
					{/if}
				</div>
			{:else}
				<span class="animate-pulse text-base font-medium">Loading...</span>
			{/if}

			<svg
				class="h-5 w-5 transition-transform duration-200"
				class:rotate-180={isLanguageMenuOpen}
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
			</svg>
		</button>

		<!-- Language Dropdown -->
		{#if isLanguageMenuOpen}
			<div
				class="absolute top-full left-1/2 z-50 mt-3 w-96 -translate-x-1/2 transform rounded-2xl border border-base-200 bg-base-100 py-4 shadow-2xl backdrop-blur-md"
			>
				<!-- Header with search -->
				<div class="flex items-center gap-2 px-4 pb-3">
					{#if viewingSpeakersFor}
						<button
							onclick={() => {
								viewingSpeakersFor = null;
							}}
							class="btn btn-circle btn-ghost btn-sm"
							aria-label="Back to languages"
						>
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M15 19l-7-7 7-7"
								/>
							</svg>
						</button>
					{/if}
					<input
						type="text"
						placeholder={viewingSpeakersFor
							? `Choose voice for ${viewingSpeakersFor.name}...`
							: 'Search languages...'}
						bind:value={searchTerm}
						class="input-bordered input input-sm w-full border-base-300/50 bg-base-200/50 focus:border-primary/50 focus:bg-base-100"
						autocomplete="off"
					/>
				</div>

				<!-- Content -->
				<div class="max-h-80 overflow-y-auto px-2">
					{#if viewingSpeakersFor}
						<!-- Speaker List -->
						<div class="mb-3 px-4">
							<h3 class="mb-2 text-sm font-semibold">
								Choose Speaker for {viewingSpeakersFor.name}
							</h3>
						</div>
						{#each viewingSpeakers as speaker (speaker.id)}
							<button
								onclick={() => handleSpeakerSelect(speaker.id)}
								class="group btn my-1 flex w-full items-center justify-between rounded-xl px-4 py-3 text-left btn-ghost transition-colors duration-150 hover:bg-base-200/50"
								class:bg-primary={selectedSpeaker === speaker.id}
								class:text-primary-content={selectedSpeaker === speaker.id}
								class:hover:bg-primary={selectedSpeaker === speaker.id}
							>
								<div class="flex items-center gap-3">
									<span class="text-xl">{getGenderIcon(speaker.gender)}</span>
									<div class="flex flex-col">
										<span class="font-medium">{speaker.voiceName}</span>
										<span class="text-sm opacity-70">{speaker.dialectName} • {speaker.region}</span>
									</div>
								</div>
								{#if selectedSpeaker === speaker.id}
									<svg
										class="h-5 w-5 flex-shrink-0"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M5 13l4 4L19 7"
										/>
									</svg>
								{/if}
							</button>
						{/each}
					{:else}
						<!-- Language List -->
						<div class="mb-3 px-4">
							<h3 class="mb-2 text-sm font-semibold text-base-content/70">
								🌍 Choose Practice Language
							</h3>
						</div>
						{#if orderedLanguages.length === 0 && searchTerm}
							<div class="px-4 py-8 text-center text-base-content/60">
								<p>No languages found</p>
								<p class="mt-1 text-sm">Try a different search term</p>
							</div>
						{:else if orderedLanguages.length === 0}
							<div class="px-4 py-8 text-center text-base-content/60">
								<p>Loading languages...</p>
							</div>
						{:else}
							{#each orderedLanguages as language (language.id)}
								<button
									onclick={() => handleLanguageSelect(language)}
									class="group btn my-1 flex w-full items-center justify-between rounded-xl px-4 py-3 text-left btn-ghost transition-colors duration-150 hover:bg-base-200/50"
									class:bg-primary={selectedLanguage?.code === language.code}
									class:text-primary-content={selectedLanguage?.code === language.code}
									class:hover:bg-primary={selectedLanguage?.code === language.code}
								>
									<div class="flex items-center gap-3">
										<span class="text-xl">{language.flag || '🌍'}</span>
										<div class="flex flex-col">
											<span class="font-medium">{language.name}</span>
											<span class="text-sm opacity-70">{language.nativeName}</span>
										</div>
									</div>
									{#if selectedLanguage?.code === language.code}
										<svg
											class="h-5 w-5 flex-shrink-0"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M5 13l4 4L19 7"
											/>
										</svg>
									{/if}
								</button>
							{/each}
						{/if}
					{/if}
				</div>
			</div>
		{/if}
	</div>

	<!-- Main Start Button - The hero element -->
	{#if isGuest}
		<div class=" tooltip tooltip-primary" data-tip="Only logged in users can start conversations">
			<button
				disabled
				class="group btn cursor-not-allowed opacity-50 btn-lg btn-primary"
				aria-label="Start conversation (disabled for guests)"
			>
				<span class="relative z-10">
					Start Onboarding in {selectedLanguage?.name || 'Selected Language'}
				</span>
			</button>
		</div>
	{:else}
		<button
			onclick={handleStartClick}
			disabled={!selectedLanguage}
			class="group btn btn-lg btn-primary"
			aria-label={selectedLanguage ? `Start speaking ${selectedLanguage.name}` : 'Loading...'}
		>
			<span class="relative z-10">
				{#if selectedLanguage}
					Start Onboarding in {selectedLanguage.name}
				{:else}
					Loading...
				{/if}
			</span>

			<!-- Subtle highlight effect -->
			<div
				class="absolute inset-0 -translate-x-full -skew-x-12 transform bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full"
			></div>
		</button>
	{/if}
</div>

<!-- Click outside to close -->
{#if isLanguageMenuOpen}
	<button class="fixed inset-0 z-40 cursor-default" onclick={closeMenu} aria-hidden="true"></button>
{/if}
