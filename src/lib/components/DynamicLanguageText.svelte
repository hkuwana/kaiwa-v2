<script lang="ts">
	import { onMount } from 'svelte';
	import type { Language } from '$lib/data/languages';
	import { languages } from '$lib/data/languages';

	interface Props {
		selectedLanguage: Language | null;
		onLanguageSelect?: (language: Language) => void;
		autoAnimate?: boolean;
		animationInterval?: number;
		variant: 'grandmother' | 'practice' | 'connect';
		/** When false, renders as plain slogan (no button/dropdown) */
		interactive?: boolean;
	}

	let {
		selectedLanguage = $bindable(),
		onLanguageSelect,
		autoAnimate = true,
		animationInterval = 2500,
		variant = 'grandmother',
		interactive = true
	}: Props = $props();

	// Filter out English for cycling animation
	const cyclingLanguages = languages.filter(lang => lang.id !== 'en');

	// Hyper-specific text variations for each language and context
	// Split into prefix, language name, and suffix for better animation control
	const textTemplates = {
		grandmother: {
			prefix: "Talk to your grandmother in ",
			suffix: ""
		},
		practice: {
			prefix: "Practice ",
			suffix: " without fear. Connect with confidence."
		},
		connect: {
			prefix: "",
			suffix: " conversations to speak with your partner"
		}
	};

	let currentIndex = $state(0);
	let isAnimating = $state(false);
	let intervalId: number | null = null;
	let isUserSelected = $state(false);
	let showDropdown = $state(false);

	// Get current language for display
	const currentLanguage = $derived(
		isUserSelected && selectedLanguage
			? selectedLanguage
			: cyclingLanguages[currentIndex]
	);

	// Get the text parts for better animation control
	const textParts = $derived.by(() => {
		if (!currentLanguage) return { prefix: 'Loading...', languageName: '', suffix: '' };
		const template = textTemplates[variant];
		return {
			prefix: template.prefix,
			languageName: currentLanguage.name,
			suffix: template.suffix
		};
	});

	function startAnimation() {
		if (!autoAnimate || isUserSelected) return;

		intervalId = window.setInterval(() => {
			if (!isUserSelected) {
				cycleToNextLanguage();
			}
		}, animationInterval);
	}

	function stopAnimation() {
		if (intervalId) {
			clearInterval(intervalId);
			intervalId = null;
		}
	}

	function cycleToNextLanguage() {
		isAnimating = true;
		setTimeout(() => {
			currentIndex = (currentIndex + 1) % cyclingLanguages.length;
			isAnimating = false;
		}, 300);
	}

	function handleLanguageClick(language: Language) {
		isUserSelected = true;
		selectedLanguage = language;
		showDropdown = false;
		stopAnimation();
		onLanguageSelect?.(language);
	}

	function resetToAnimation() {
		isUserSelected = false;
		selectedLanguage = null;
		showDropdown = false;
		startAnimation();
	}

	function toggleDropdown() {
		showDropdown = !showDropdown;
		if (showDropdown) {
			stopAnimation();
		} else if (!isUserSelected) {
			startAnimation();
		}
	}

	onMount(() => {
		startAnimation();
		return () => stopAnimation();
	});
</script>

<div class="relative">
	<!-- Slogan-only (non-interactive) -->
	{#if !interactive}
		<div class="text-left transition-all duration-300">
			<span>{textParts.prefix}</span>
			<span
				class="transition-transform duration-300 [transform-style:preserve-3d] inline-block"
				class:animate-flip={isAnimating}
			>
				{textParts.languageName}
			</span>
			<span>{textParts.suffix}</span>
		</div>
	{:else}
		<!-- Interactive version with dropdown -->
		<div class="group text-left transition-all duration-300 focus:outline-none">
			<div class="transition-all duration-300">
				<span>{textParts.prefix}</span>
				<button
					class="relative inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 hover:bg-primary/20 transition-all duration-200 border-b-2 border-primary/40 hover:border-primary/60"
					class:scale-110={isAnimating}
					class:bg-primary={showDropdown}
					class:border-primary={showDropdown}
					onclick={toggleDropdown}
				>
					<span
						class="font-semibold text-primary transition-transform duration-300 [transform-style:preserve-3d] inline-block"
						class:animate-flip={isAnimating}
					>
						{textParts.languageName}
					</span>
					<svg
						class="w-3 h-3 text-primary/70 transition-transform duration-200"
						class:rotate-180={showDropdown}
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 9-7 7-7-7"></path>
					</svg>
				</button>
				<span>{textParts.suffix}</span>
			</div>

			<!-- Subtle interaction hint -->
			<div class="mt-1 text-xs opacity-60 transition-opacity duration-200 group-hover:opacity-80">
				{#if isUserSelected}
					✨ {currentLanguage.flag} Selected • Click to change
				{:else}
					🎯 Click to choose your language
				{/if}
			</div>
		</div>

		<!-- Language dropdown -->
		{#if showDropdown}
			<div class="absolute top-full left-0 mt-3 w-80 rounded-xl bg-base-100 shadow-xl border border-base-300 z-20 max-h-80 overflow-y-auto">
				<div class="p-4">
					<div class="text-sm font-semibold text-base-content mb-3 flex items-center gap-2">
						<span>🌍</span>
						Choose your language:
					</div>

					<div class="grid grid-cols-1 gap-1">
						{#each languages.filter(lang => lang.id !== 'en') as language}
							<button
								class="flex items-center gap-3 p-3 rounded-lg text-left hover:bg-primary/10 transition-all duration-200 group"
								onclick={() => handleLanguageClick(language)}
							>
								<span class="text-lg">{language.flag}</span>
								<div class="flex-1">
									<div class="font-medium">{language.name}</div>
									<div class="text-xs opacity-70 group-hover:opacity-90 transition-opacity">
										{textParts.prefix}{language.name}{textParts.suffix}
									</div>
								</div>
							</button>
						{/each}
					</div>

					{#if isUserSelected}
						<button
							class="w-full mt-3 p-2 text-sm text-base-content/70 hover:text-primary transition-colors duration-200 border-t border-base-300"
							onclick={resetToAnimation}
						>
							↻ Reset to auto-cycle
						</button>
					{/if}
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	@keyframes flipOutIn {
		0% { transform: rotateX(0deg); opacity: 1; }
		49% { transform: rotateX(90deg); opacity: 0; }
		51% { transform: rotateX(-90deg); opacity: 0; }
		100% { transform: rotateX(0deg); opacity: 1; }
	}

	.animate-flip {
		animation: flipOutIn 0.3s ease-in-out;
		transform-origin: center top;
		perspective: 800px;
	}
</style>
