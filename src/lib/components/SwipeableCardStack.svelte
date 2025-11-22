<!-- src/lib/components/SwipeableCardStack.svelte -->
<!-- Jony Ive-inspired swipeable stacked card carousel -->
<script lang="ts">
	import { scenariosData } from '$lib/data/scenarios';
	import { settingsStore } from '$lib/stores/settings.store.svelte';
	import { getSpeakersByLanguage } from '$lib/data/speakers';
	import BriefingCard from './BriefingCard.svelte';
	import LanguageSelector from './LanguageSelector.svelte';
	import { fade, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import type { Language } from '$lib/data/languages';
	import type { Scenario } from '$lib/data/scenarios';

	interface Props {
		/** Show only featured scenarios (default: first 5) */
		featuredScenariosCount?: number;
	}

	const { featuredScenariosCount = 5 }: Props = $props();

	// Get featured scenarios + add a "Browse All" placeholder at the end
	const featuredScenarios = scenariosData.slice(0, featuredScenariosCount);
	// Card stack state
	let currentCardIndex = $state(0);
	let showAdvancedOptions = $state(false);
	const browseCardTransform = getCardTransform(featuredScenarios.length);

	// Swipe gesture state
	let isDragging = $state(false);
	let dragStartX = $state(0);
	let dragStartY = $state(0);
	let dragCurrentX = $state(0);
	let dragCurrentY = $state(0);

	// Get current speaker for selected language
	const currentSpeaker = $derived.by(() => {
		if (!settingsStore.selectedLanguage) return null;
		const speakersForLanguage = getSpeakersByLanguage(settingsStore.selectedLanguage.code);
		return speakersForLanguage?.[0] || null;
	});

	// Check if we're on the "Browse All" card (last position)
	const isOnBrowseAllCard = $derived(currentCardIndex === featuredScenarios.length);
	const totalCards = $derived(featuredScenarios.length + 1); // +1 for Browse All card

	// Language selection handlers
	function handleLanguageChange(language: Language) {
		settingsStore.setLanguage(language);
	}

	function handleSpeakerChange(speakerId: string) {
		// Find the speaker and set it
		if (settingsStore.selectedLanguage) {
			const speakers = getSpeakersByLanguage(settingsStore.selectedLanguage.code);
			const speaker = speakers.find((s) => s.id === speakerId);
			if (speaker) {
				settingsStore.setSpeaker(speaker);
			}
		}
	}

	// Swipe gesture handlers
	function handleDragStart(e: MouseEvent | TouchEvent) {
		if (currentCardIndex >= totalCards) return;

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

		// Swipe threshold: 80px horizontal movement
		const swipeThreshold = 80;
		const horizontalSwipe = Math.abs(dragCurrentX);
		const verticalSwipe = Math.abs(dragCurrentY);

		// Only trigger swipe if horizontal movement is greater than vertical
		if (horizontalSwipe > swipeThreshold && horizontalSwipe > verticalSwipe) {
			if (dragCurrentX < 0) {
				// Swiped left - next card
				nextCard();
			} else {
				// Swiped right - previous card
				previousCard();
			}
		}

		// Reset drag state
		dragCurrentX = 0;
		dragCurrentY = 0;
	}

	function nextCard() {
		if (currentCardIndex < totalCards - 1) {
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
			currentCardIndex = totalCards - 1;
		}
	}

	function handleStartConversation(scenario: Scenario) {
		console.log('Starting conversation with scenario:', scenario.title);
		// TODO: Navigate to conversation or trigger start
		alert(
			`Starting conversation: ${scenario.title}\n\nThis will be implemented to start the actual conversation!`
		);
	}

	function goToScenario(index: number) {
		currentCardIndex = index;
	}

	// Get transform for card based on position in stack
	// Jony Ive approach: Show only top 3 cards with subtle depth
	function getCardTransform(index: number): string {
		const offset = index - currentCardIndex;

		if (offset < 0) {
			// Cards that have been swiped away (move off to the left with rotation)
			// -50% centers, then -150% moves it way off-screen = -200% total
			return 'translateX(-200%) translateY(-20px) rotate(-12deg) scale(0.9)';
		}

		if (offset === 0 && isDragging) {
			// Current card being dragged
			const rotation = dragCurrentX / 30; // Subtle rotation based on drag
			// Keep the -50% centering, add the drag offset
			const dragOffset = `calc(-50% + ${dragCurrentX}px)`;
			return `translateX(${dragOffset}) translateY(${dragCurrentY}px) rotate(${rotation}deg) scale(1)`;
		}

		if (offset === 0) {
			// Current card at front - centered, no additional transform
			return 'translateX(-50%) translateY(0) scale(1) rotate(0deg)';
		}

		if (offset === 1) {
			// Next card - slightly behind and down
			return 'translateX(-50%) translateY(12px) scale(0.96) rotate(0deg)';
		}

		if (offset === 2) {
			// Card two positions back - more offset
			return 'translateX(-50%) translateY(24px) scale(0.92) rotate(0deg)';
		}

		// Cards further back - hidden but slightly visible
		return 'translateX(-50%) translateY(32px) scale(0.88) rotate(0deg)';
	}

	function getCardOpacity(index: number): number {
		const offset = index - currentCardIndex;

		if (offset < 0) return 0; // Swiped away
		if (offset === 0) return 1; // Current card - full opacity
		if (offset === 1) return 0.7; // Next card
		if (offset === 2) return 0.4; // Card two back
		return 0; // Hidden
	}

	function getCardZIndex(index: number): number {
		const offset = index - currentCardIndex;
		// Current card gets highest z-index, decreasing for cards behind
		return totalCards - offset;
	}

	function getCardPointerEvents(index: number): string {
		const offset = index - currentCardIndex;
		// Only the current card (offset 0) should be interactive
		return offset === 0 ? 'auto' : 'none';
	}
</script>

<div class="w-full space-y-8">
	<!-- Language Selection Section -->
	<div class="mx-auto w-full max-w-md space-y-4">
		<div class="text-center">
			<h2 class="text-2xl font-bold text-base-content sm:text-3xl">Choose Your Language</h2>
			<p class="mt-2 text-sm text-base-content/70">
				Select the language and speaker you want to practice with
			</p>
		</div>

		<LanguageSelector
			selectedLanguage={settingsStore.selectedLanguage}
			selectedSpeaker={currentSpeaker?.id || null}
			onLanguageChange={handleLanguageChange}
			onSpeakerChange={handleSpeakerChange}
		/>
	</div>

	<!-- Advanced Options Section -->
	<div class="mx-auto max-w-2xl">
		<div class="collapse-arrow collapse bg-base-200/30 backdrop-blur-sm">
			<input type="checkbox" bind:checked={showAdvancedOptions} />
			<div class="collapse-title text-sm font-medium text-base-content/70">
				<div class="flex items-center gap-2">
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
							d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
						/>
					</svg>
					<span>Advanced Options</span>
				</div>
			</div>
			<div class="collapse-content">
				<div class="space-y-4 pt-2">
					<!-- Difficulty Filter -->
					<div>
						<label class="label">
							<span class="label-text text-xs font-medium">Difficulty Level</span>
						</label>
						<div class="flex gap-2">
							<button class="btn btn-outline btn-xs">Beginner</button>
							<button class="btn btn-outline btn-xs">Intermediate</button>
							<button class="btn btn-outline btn-xs">Advanced</button>
							<button class="btn btn-xs">All</button>
						</div>
					</div>

					<!-- Speaker Preference -->
					{#if currentSpeaker}
						<div>
							<label class="label">
								<span class="label-text text-xs font-medium">Voice</span>
							</label>
							<div class="text-xs text-base-content/70">
								{currentSpeaker.voiceName} • {currentSpeaker.dialectName}
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- Swipeable Card Stack Section -->
	<div class="space-y-4">
		<div class="text-center">
			<h3 class="text-xl font-semibold text-base-content sm:text-2xl">Featured Scenarios</h3>
			<p class="mt-2 text-sm text-base-content/60">Swipe to explore • Tap to start</p>
		</div>

		<!-- Card Stack Container -->
		<div class="relative mx-auto w-full max-w-2xl px-4">
			<!-- Stack of Cards with Depth -->
			<div
				class="relative mx-auto h-[520px] w-full max-w-md sm:h-[620px]"
				onmousemove={handleDragMove}
				onmouseup={handleDragEnd}
				onmouseleave={handleDragEnd}
				ontouchmove={handleDragMove}
				ontouchend={handleDragEnd}
				role="region"
				aria-label="Scenario cards"
			>
				<!-- Render scenario cards -->
				{#each featuredScenarios as scenario, index (scenario.id)}
					<div
						class="card-stack-item absolute top-0 left-1/2 w-full cursor-grab touch-none transition-all duration-300 ease-out select-none"
						class:cursor-grabbing={isDragging && index === currentCardIndex}
						style="
							transform: {getCardTransform(index)};
							opacity: {getCardOpacity(index)};
							z-index: {getCardZIndex(index)};
							pointer-events: {getCardPointerEvents(index)};
						"
						onmousedown={index === currentCardIndex ? handleDragStart : undefined}
						ontouchstart={index === currentCardIndex ? handleDragStart : undefined}
					>
						<BriefingCard
							selectedLanguage={settingsStore.selectedLanguage}
							selectedSpeaker={currentSpeaker}
							selectedScenario={scenario}
							showStartButton={true}
							onStartConversation={handleStartConversation}
						/>
					</div>
				{/each}

				<!-- Browse All Scenarios Card (Final Card) -->
				<div
					class="card-stack-item absolute top-0 left-1/2 w-full cursor-grab touch-none transition-all duration-300 ease-out select-none"
					class:cursor-grabbing={isDragging && isOnBrowseAllCard}
					style="
						transform: {getCardTransform(featuredScenarios.length)};
						opacity: {getCardOpacity(featuredScenarios.length)};
						z-index: {getCardZIndex(featuredScenarios.length)};
						pointer-events: {getCardPointerEvents(featuredScenarios.length)};
					"
					onmousedown={isOnBrowseAllCard ? handleDragStart : undefined}
					ontouchstart={isOnBrowseAllCard ? handleDragStart : undefined}
				>
					<div
						class="w-full max-w-md"
						in:fade={{ duration: 300, easing: cubicOut }}
						out:fade={{ duration: 200 }}
					>
						<a
							href="/scenarios"
							class="block overflow-hidden rounded-3xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-base-100 to-base-200/50 p-8 shadow-xl backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] hover:border-primary/60 hover:shadow-2xl sm:p-12"
						>
							<div class="flex flex-col items-center justify-center space-y-4 text-center">
								<!-- Icon -->
								<div
									class="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 sm:h-24 sm:w-24"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-10 w-10 text-primary sm:h-12 sm:w-12"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
										/>
									</svg>
								</div>

								<!-- Text -->
								<div class="space-y-2">
									<h3 class="text-xl font-bold text-base-content sm:text-2xl">
										Browse All Scenarios
									</h3>
									<p class="text-sm text-base-content/70 sm:text-base">
										Explore {scenariosData.length}+ conversation scenarios
									</p>
								</div>

								<!-- CTA -->
								<div class="btn shadow-lg btn-lg btn-primary">
									View All
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
								</div>
							</div>
						</a>
					</div>
				</div>
			</div>

			<!-- Navigation Controls (Desktop) -->
			<div class="mt-8 hidden justify-center gap-4 sm:flex">
				<button
					class="btn btn-circle btn-ghost btn-lg"
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
					class="btn btn-circle btn-ghost btn-lg"
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

			<!-- Progress Indicators -->
			<div class="mt-6 flex justify-center gap-2">
				{#each Array(totalCards) as _, index}
					<button
						class="h-2 rounded-full transition-all duration-300"
						class:w-8={currentCardIndex === index}
						class:w-2={currentCardIndex !== index}
						class:bg-primary={currentCardIndex === index}
						class:bg-base-300={currentCardIndex !== index}
						onclick={() => goToScenario(index)}
						aria-label={index === totalCards - 1
							? 'Go to Browse All Scenarios'
							: `Go to scenario ${index + 1}`}
					></button>
				{/each}
			</div>

			<!-- Card Counter -->
			<div class="mt-4 text-center text-sm text-base-content/60">
				{#if isOnBrowseAllCard}
					<span class="font-medium">Browse All</span>
				{:else}
					<span class="font-medium">{currentCardIndex + 1}</span> of {featuredScenarios.length}
				{/if}
			</div>

			<!-- Swipe Hint (Mobile) -->
			<div class="mt-4 text-center text-xs text-base-content/50 sm:hidden">
				← Swipe to explore →
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

	/* Card stack item - smooth transitions with spring-like easing */
	.card-stack-item {
		transition:
			transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
			opacity 0.3s ease-out;
		will-change: transform, opacity;
	}

	/* When dragging, remove transition for immediate feedback */
	.card-stack-item.cursor-grabbing {
		transition: opacity 0.3s ease-out;
	}

	/* Progress indicator animation */
	button[aria-label^='Go to'] {
		@apply cursor-pointer transition-all duration-300 hover:scale-125;
	}
</style>
