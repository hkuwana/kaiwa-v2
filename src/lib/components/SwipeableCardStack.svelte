<!-- src/lib/components/SwipeableCardStack.svelte -->
<!-- Swipeable stacked card carousel with touch and mouse gestures -->
<script lang="ts">
	import { languages } from '$lib/data/languages';
	import { scenariosData } from '$lib/data/scenarios';
	import { settingsStore } from '$lib/stores/settings.store.svelte';
	import { getSpeakersByLanguage } from '$lib/data/speakers';
	import BriefingCard from './BriefingCard.svelte';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import type { Language } from '$lib/data/languages';
	import type { Scenario } from '$lib/data/scenarios';

	interface Props {
		/** Show only featured scenarios (default: first 6) */
		featuredScenariosCount?: number;
	}

	const { featuredScenariosCount = 6 }: Props = $props();

	// Get featured scenarios
	const featuredScenarios = scenariosData.slice(0, featuredScenariosCount);

	// Card stack state
	let cards = $state<Scenario[]>([...featuredScenarios]);
	let currentCardIndex = $state(0);

	// Swipe gesture state
	let isDragging = $state(false);
	let dragStartX = $state(0);
	let dragStartY = $state(0);
	let dragCurrentX = $state(0);
	let dragCurrentY = $state(0);
	let cardElement: HTMLDivElement | null = null;

	// Get current speaker for selected language
	const currentSpeaker = $derived.by(() => {
		if (!settingsStore.selectedLanguage) return null;
		const speakersForLanguage = getSpeakersByLanguage(settingsStore.selectedLanguage.code);
		return speakersForLanguage?.[0] || null;
	});

	// Language selection handler
	function selectLanguage(language: Language) {
		settingsStore.setLanguage(language);
		// Also auto-select first speaker for that language
		const speakersForLanguage = getSpeakersByLanguage(language.code);
		if (speakersForLanguage?.[0]) {
			settingsStore.setSpeaker(speakersForLanguage[0]);
		}
	}

	// Swipe gesture handlers
	function handleDragStart(e: MouseEvent | TouchEvent) {
		if (currentCardIndex >= cards.length) return;

		isDragging = true;
		const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
		const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

		dragStartX = clientX;
		dragStartY = clientY;
		dragCurrentX = 0;
		dragCurrentY = 0;
	}

	function handleDragMove(e: MouseEvent | TouchEvent) {
		if (!isDragging) return;

		const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
		const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

		dragCurrentX = clientX - dragStartX;
		dragCurrentY = clientY - dragStartY;
	}

	function handleDragEnd() {
		if (!isDragging) return;

		isDragging = false;

		// Swipe threshold: 100px horizontal movement
		const swipeThreshold = 100;
		const horizontalSwipe = Math.abs(dragCurrentX);
		const verticalSwipe = Math.abs(dragCurrentY);

		// Only trigger swipe if horizontal movement is greater than vertical
		if (horizontalSwipe > swipeThreshold && horizontalSwipe > verticalSwipe) {
			// Swipe detected - move to next card
			nextCard();
		}

		// Reset drag state
		dragCurrentX = 0;
		dragCurrentY = 0;
	}

	function nextCard() {
		if (currentCardIndex < cards.length - 1) {
			currentCardIndex++;
		} else {
			// Loop back to start
			currentCardIndex = 0;
		}
	}

	function previousCard() {
		if (currentCardIndex > 0) {
			currentCardIndex--;
		} else {
			// Loop to end
			currentCardIndex = cards.length - 1;
		}
	}

	function handleStartConversation(scenario: Scenario) {
		console.log('Starting conversation with scenario:', scenario.title);
		// TODO: Navigate to conversation or trigger start
		alert(`Starting conversation: ${scenario.title}\n\nThis will be implemented to start the actual conversation!`);
	}

	// Get transform for card based on position in stack
	function getCardTransform(index: number): string {
		const offset = index - currentCardIndex;

		if (offset < 0) {
			// Cards that have been swiped away (move off to the left)
			return `translateX(-200%) rotate(-10deg)`;
		}

		if (offset === 0 && isDragging) {
			// Current card being dragged
			const rotation = dragCurrentX / 20; // Subtle rotation based on drag
			return `translateX(${dragCurrentX}px) translateY(${dragCurrentY}px) rotate(${rotation}deg)`;
		}

		if (offset === 0) {
			// Current card at front
			return 'translateX(0) translateY(0) scale(1)';
		}

		if (offset === 1) {
			// Next card slightly behind
			return 'translateX(0) translateY(8px) scale(0.95)';
		}

		if (offset === 2) {
			// Card two positions back
			return 'translateX(0) translateY(16px) scale(0.9)';
		}

		// Cards further back - hidden
		return 'translateX(0) translateY(20px) scale(0.85) opacity(0)';
	}

	function getCardOpacity(index: number): number {
		const offset = index - currentCardIndex;

		if (offset < 0) return 0; // Swiped away
		if (offset === 0) return 1; // Current card
		if (offset === 1) return 0.8; // Next card
		if (offset === 2) return 0.5; // Card two back
		return 0; // Hidden
	}

	function getCardZIndex(index: number): number {
		const offset = index - currentCardIndex;
		return cards.length - offset;
	}
</script>

<div class="w-full space-y-8">
	<!-- Language Selection Section -->
	<div class="space-y-4">
		<div class="text-center">
			<h2 class="text-2xl font-bold text-base-content sm:text-3xl">Choose Your Language</h2>
			<p class="mt-2 text-sm text-base-content/70">
				Select the language you want to practice speaking
			</p>
		</div>

		<!-- Language Tabs - Scrollable on mobile, wrapped on desktop -->
		<div
			class="flex justify-center overflow-x-auto px-4 pb-2 scrollbar-hide sm:px-0"
			role="tablist"
			aria-label="Language selection"
		>
			<div class="tabs tabs-boxed gap-2 bg-base-200/50 p-2 backdrop-blur-sm">
				{#each languages as language (language.code)}
					<button
						role="tab"
						aria-selected={settingsStore.selectedLanguage?.code === language.code}
						class="tab tab-lg whitespace-nowrap transition-all duration-200 hover:scale-105"
						class:tab-active={settingsStore.selectedLanguage?.code === language.code}
						onclick={() => selectLanguage(language)}
					>
						<span class="mr-2 text-xl sm:text-2xl">{language.flag}</span>
						<span class="hidden sm:inline">{language.name}</span>
						<span class="sm:hidden">{language.code.toUpperCase()}</span>
					</button>
				{/each}
			</div>
		</div>

		<!-- Selected Language Display (Mobile) -->
		{#if settingsStore.selectedLanguage}
			<div class="text-center sm:hidden" transition:fade={{ duration: 200 }}>
				<p class="text-sm font-medium text-base-content/80">
					Learning: <span class="text-primary">{settingsStore.selectedLanguage.name}</span>
					<span class="text-base-content/50">({settingsStore.selectedLanguage.nativeName})</span>
				</p>
			</div>
		{/if}
	</div>

	<!-- Swipeable Card Stack Section -->
	<div class="space-y-4">
		<div class="text-center">
			<h3 class="text-xl font-semibold text-base-content sm:text-2xl">Featured Scenarios</h3>
			<p class="mt-2 text-sm text-base-content/60">
				Swipe to explore • Scenarios adapt to your level
			</p>
		</div>

		<!-- Card Stack Container -->
		<div class="relative mx-auto w-full max-w-2xl">
			<!-- Stack of Cards -->
			<div
				class="relative mx-auto h-[500px] w-full max-w-md sm:h-[600px]"
				onmousemove={handleDragMove}
				onmouseup={handleDragEnd}
				onmouseleave={handleDragEnd}
				ontouchmove={handleDragMove}
				ontouchend={handleDragEnd}
			>
				{#each cards as scenario, index (scenario.id)}
					<div
						class="card-stack-item absolute left-1/2 top-0 w-full -translate-x-1/2 cursor-grab touch-none select-none transition-all duration-300 ease-out"
						class:cursor-grabbing={isDragging && index === currentCardIndex}
						style="
							transform: translateX(-50%) {getCardTransform(index)};
							opacity: {getCardOpacity(index)};
							z-index: {getCardZIndex(index)};
							pointer-events: {index === currentCardIndex ? 'auto' : 'none'};
						"
						onmousedown={index === currentCardIndex ? handleDragStart : undefined}
						ontouchstart={index === currentCardIndex ? handleDragStart : undefined}
					>
						<div class="relative">
							<BriefingCard
								selectedLanguage={settingsStore.selectedLanguage}
								selectedSpeaker={currentSpeaker}
								selectedScenario={scenario}
							/>

							<!-- Start Conversation Button Overlay -->
							{#if index === currentCardIndex}
								<div class="mt-4 text-center">
									<button
										class="btn btn-primary btn-lg w-full shadow-xl transition-all duration-200 hover:scale-105 sm:btn-wide"
										onclick={() => handleStartConversation(scenario)}
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-6 w-6"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
											/>
										</svg>
										Start Conversation
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-5 w-5"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M13 7l5 5m0 0l-5 5m5-5H6"
											/>
										</svg>
									</button>
								</div>
							{/if}
						</div>
					</div>
				{/each}

				<!-- Empty State (when no cards left to show - shouldn't happen with loop) -->
				{#if cards.length === 0}
					<div class="flex h-full items-center justify-center">
						<p class="text-base-content/60">No scenarios available</p>
					</div>
				{/if}
			</div>

			<!-- Navigation Buttons (Desktop) -->
			<div class="mt-6 hidden justify-center gap-4 sm:flex">
				<button
					class="btn btn-circle btn-outline btn-lg"
					onclick={previousCard}
					aria-label="Previous scenario"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 19l-7-7 7-7"
						/>
					</svg>
				</button>
				<button
					class="btn btn-circle btn-outline btn-lg"
					onclick={nextCard}
					aria-label="Next scenario"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 5l7 7-7 7"
						/>
					</svg>
				</button>
			</div>

			<!-- Progress Indicator -->
			<div class="mt-6 flex justify-center gap-2">
				{#each cards as _, index}
					<button
						class="h-2 rounded-full transition-all duration-300"
						class:w-8={currentCardIndex === index}
						class:w-2={currentCardIndex !== index}
						class:bg-primary={currentCardIndex === index}
						class:bg-base-300={currentCardIndex !== index}
						onclick={() => (currentCardIndex = index)}
						aria-label={`Go to scenario ${index + 1}`}
					></button>
				{/each}
			</div>

			<!-- Scenario Counter -->
			<div class="mt-4 text-center text-sm text-base-content/60">
				<span class="font-medium">{currentCardIndex + 1}</span> of {cards.length} scenarios
			</div>

			<!-- Swipe Hint (Mobile) -->
			<div class="mt-4 text-center text-xs text-base-content/50 sm:hidden">
				👆 Swipe left/right to explore scenarios
			</div>
		</div>
	</div>
</div>

<style>
	@reference "tailwindcss";

	/* Hide scrollbar but keep functionality */
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}

	/* Smooth tab transitions */
	.tab {
		@apply transition-all duration-200;
	}

	.tab-active {
		@apply scale-105 shadow-md;
	}

	/* Card stack item - smooth transitions */
	.card-stack-item {
		transition:
			transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
			opacity 0.3s ease-out,
			z-index 0s;
	}

	/* When dragging, remove transition for immediate feedback */
	.card-stack-item.cursor-grabbing {
		transition: none;
	}

	/* Progress indicator animation */
	button[aria-label^='Go to scenario'] {
		@apply cursor-pointer transition-all duration-300 hover:scale-125;
	}
</style>
