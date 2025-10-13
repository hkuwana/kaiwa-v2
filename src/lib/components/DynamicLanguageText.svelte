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
	const cyclingLanguages = languages.filter((lang) => lang.id !== 'en');

	// Hyper-specific text variations for each language and context
	// Split into prefix, language name, and suffix for better animation control
	const textTemplates = {
		grandmother: {
			prefix: 'Talk to your grandmother in ',
			suffix: ''
		},
		practice: {
			prefix: 'Practice ',
			suffix: ' without fear. Speak with confidence.'
		},
		connect: {
			prefix: '',
			suffix: ' conversations to speak with your loved ones'
		}
	};

	let currentIndex = $state(0);
	let isAnimating = $state(false);
	let intervalId: number | null = null;
	let isUserSelected = $state(false);

	// Get current language for display
	const currentLanguage = $derived(
		isUserSelected && selectedLanguage ? selectedLanguage : cyclingLanguages[currentIndex]
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

		stopAnimation();
		onLanguageSelect?.(language);
	}

	function resetToAnimation() {
		isUserSelected = false;
		selectedLanguage = null;

		startAnimation();
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
				class="inline-block transition-transform duration-300 [transform-style:preserve-3d]"
				class:animate-flip={isAnimating}
			>
				{textParts.languageName}
			</span>
			<span>{textParts.suffix}</span>
		</div>
	{:else}
		<!-- Interactive version with dropdown -->
		<div class="group text-left transition-all duration-300 focus:outline-none">
			<div class="inline-flex items-center transition-all duration-300">
				<span>{textParts.prefix}</span>
				<div class="dropdown dropdown-end">
					<button
						type="button"
						class="btn m-1 inline-flex items-center gap-1 rounded-md border-b-2 border-primary/40 bg-primary/10 px-2 py-1 transition-all duration-200 btn-sm hover:border-primary/60 hover:bg-primary/20"
						class:scale-110={isAnimating}
					>
						<span
							class="inline-block font-semibold text-primary transition-transform duration-300 [transform-style:preserve-3d]"
							class:animate-flip={isAnimating}
						>
							{textParts.languageName}
						</span>
						<span class="icon-[mdi--chevron-down] h-3 w-3 text-primary/70 transition-transform duration-200 group-focus-within:rotate-180"></span>
					</button>
					<div
						class="dropdown-content z-30 mt-2 max-h-80 w-80 overflow-y-auto rounded-xl border border-base-300 bg-base-100 p-4 shadow-xl"
						tabindex="-1"
					>
						<div class="mb-3 flex items-center gap-2 text-sm font-semibold text-base-content">
							<span>🌍</span>
							Choose your language:
						</div>

						<ul class="menu -mx-4 mt-2 -mb-4 gap-1">
							{#each languages.filter((lang) => lang.id !== 'en') as language (language.id)}
								<li>
									<button
										class="flex items-center gap-3 rounded-lg p-3 text-left transition-all duration-200 hover:bg-primary/10"
										onclick={() => handleLanguageClick(language)}
									>
										<span class="text-lg">{language.flag}</span>
										<div class="flex-1">
											<div class="font-medium">{language.name}</div>
											<div class="text-xs opacity-70 transition-opacity group-hover:opacity-90">
												{textParts.prefix}{language.name}{textParts.suffix}
											</div>
										</div>
									</button>
								</li>
							{/each}
						</ul>

						{#if isUserSelected}
							<div class="divider my-2"></div>
							<button
								class="btn w-full text-base-content/70 btn-ghost transition-colors duration-200 btn-sm hover:text-primary"
								onclick={resetToAnimation}
							>
								↻ Reset to auto-cycle
							</button>
						{/if}
					</div>
				</div>
				<span>{textParts.suffix}</span>
			</div>
		</div>
	{/if}
</div>

<style>
	@keyframes flipOutIn {
		0% {
			transform: rotateX(0deg);
			opacity: 1;
		}
		49% {
			transform: rotateX(90deg);
			opacity: 0;
		}
		51% {
			transform: rotateX(-90deg);
			opacity: 0;
		}
		100% {
			transform: rotateX(0deg);
			opacity: 1;
		}
	}

	.animate-flip {
		animation: flipOutIn 0.3s ease-in-out;
		transform-origin: center top;
		perspective: 800px;
	}
</style>