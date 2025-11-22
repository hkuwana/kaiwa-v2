<!-- src/lib/components/SwipeableCardStack.svelte -->
<!-- Jony Ive-inspired swipeable stacked card carousel -->
<script lang="ts">
	import { scenariosData } from '$lib/data/scenarios';
	import { settingsStore } from '$lib/stores/settings.store.svelte';
	import { getSpeakersByLanguage } from '$lib/data/speakers';
	import BriefingCard from './BriefingCard.svelte';
	import LanguageSelector from './LanguageSelector.svelte';
	import SpeechSpeedSelector from './SpeechSpeedSelector.svelte';
	import { fade, scale, slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import type { Language } from '$lib/data/languages';
	import type { Scenario } from '$lib/data/scenarios';
	import { userPreferencesStore } from '$lib/stores/user-preferences.store.svelte';
	import type { AudioInputMode } from '$lib/server/db/types';
	import { getAudioInputModeFromCookie, setAudioInputModeCookie } from '$lib/utils/cookies';

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

	// Advanced audio options state
	let selectedAudioMode = $state<AudioInputMode>('ptt');
	let isAudioInitialized = $state(false);
	let showHeadphoneWarning = $state(false);
	let pendingMode = $state<AudioInputMode | null>(null);

	// Initialize audio mode from cookies
	$effect(() => {
		if (isAudioInitialized) return;

		const cookieMode = getAudioInputModeFromCookie();
		if (cookieMode) {
			selectedAudioMode = cookieMode;
		} else {
			selectedAudioMode = 'ptt';
		}

		isAudioInitialized = true;
	});

	// Swipe gesture state
	let isDragging = $state(false);
	let dragStartX = $state(0);
	let dragStartY = $state(0);
	let dragCurrentX = $state(0);
	let dragCurrentY = $state(0);

	// Speaker selection state (ID string, not object) - matches home page pattern
	let selectedSpeaker = $state<string | null>(settingsStore.selectedSpeaker);

	// Derive the speaker object from the ID
	const currentSpeaker = $derived.by(() => {
		if (!selectedSpeaker || !settingsStore.selectedLanguage) return null;
		const speakers = getSpeakersByLanguage(settingsStore.selectedLanguage.code);
		return speakers.find((s) => s.id === selectedSpeaker) || null;
	});

	// Check if we're on the "Browse All" card (last position)
	const isOnBrowseAllCard = $derived(currentCardIndex === featuredScenarios.length);
	const totalCards = $derived(featuredScenarios.length + 1); // +1 for Browse All card

	// Language selection handlers
	function handleLanguageChange(language: Language) {
		settingsStore.setLanguage(language);
	}

	function handleSpeakerChange(speakerId: string) {
		selectedSpeaker = speakerId;
		settingsStore.setSpeaker(speakerId);
	}

	// Audio mode handlers
	function handleAudioModeChange(mode: AudioInputMode) {
		// Show warning when switching to conversation mode (VAD)
		if (mode === 'vad' && selectedAudioMode === 'ptt') {
			pendingMode = mode;
			showHeadphoneWarning = true;
			return;
		}

		applyAudioModeChange(mode);
	}

	function applyAudioModeChange(mode: AudioInputMode) {
		selectedAudioMode = mode;
		setAudioInputModeCookie(mode);
		userPreferencesStore.updatePreferences({ audioInputMode: mode });
	}

	function confirmModeChange() {
		if (pendingMode) {
			applyAudioModeChange(pendingMode);
			pendingMode = null;
		}
		showHeadphoneWarning = false;
	}

	function cancelModeChange() {
		pendingMode = null;
		showHeadphoneWarning = false;
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
			// Both left and right swipes dismiss the card (move to next)
			// This creates a "pass/no thanks" gesture for both directions
			nextCard();
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
		<div class="advanced-options-container text-center">
			<!-- Toggle Button -->
			<button
				class="btn gap-2 btn-ghost btn-sm"
				onclick={() => (showAdvancedOptions = !showAdvancedOptions)}
				aria-expanded={showAdvancedOptions}
				aria-controls="advanced-options-panel"
			>
				<span class="icon-[mdi--cog] h-5 w-5"></span>
				Advanced Options
				<span
					class="icon-[mdi--chevron-down] h-4 w-4 transition-transform {showAdvancedOptions
						? 'rotate-180'
						: ''}"
				></span>
			</button>

			<!-- Options Panel -->
			{#if showAdvancedOptions}
				<div
					id="advanced-options-panel"
					class="mt-4 rounded-lg border border-base-300 bg-base-100 p-4 shadow-sm"
					transition:slide={{ duration: 200 }}
				>
					<h3 class="mb-4 text-sm font-semibold">Audio Input Mode</h3>

					<!-- Audio Mode Swap Toggle -->
					<div class="flex flex-col gap-4">
						<!-- Mode Labels -->
						<div class="flex items-center justify-between">
							<div class="text-left">
								<div class="text-sm font-medium" class:text-primary={selectedAudioMode === 'vad'}>
									Conversation Mode
								</div>
								<div class="text-xs text-base-content/60">Natural hands-free speaking</div>
							</div>
							<div class="text-right">
								<div class="text-sm font-medium" class:text-primary={selectedAudioMode === 'ptt'}>
									Manual Control
								</div>
								<div class="text-xs text-base-content/60">Press & hold to speak</div>
							</div>
						</div>

						<!-- Swap Toggle Container -->
						<div class="flex justify-center">
							<label class="swap swap-rotate">
								<input
									type="checkbox"
									checked={selectedAudioMode === 'ptt'}
									onchange={() =>
										handleAudioModeChange(selectedAudioMode === 'vad' ? 'ptt' : 'vad')}
								/>

								<!-- Auto-Detect icon (swap-off) -->
								<div class="swap-off flex items-center justify-center">
									<span class="icon-[mdi--microphone] h-8 w-8 text-base-content/70"></span>
								</div>

								<!-- Push-to-Talk icon (swap-on) -->
								<div class="swap-on flex items-center justify-center">
									<span class="icon-[mdi--gesture-tap] h-8 w-8 text-primary"></span>
								</div>
							</label>
						</div>

						<!-- Description based on selected mode -->
						<div class="rounded-lg bg-base-200 p-3">
							{#if selectedAudioMode === 'vad'}
								<div class="text-xs text-base-content/70">
									<strong>Conversation Mode:</strong> Automatically detects when you're speaking and
									captures your voice naturally. No buttons to press—just talk! Perfect for natural conversation
									flow in quiet environments.
								</div>
							{:else}
								<div class="text-xs text-base-content/70">
									<strong>Manual Control:</strong> Press and hold the microphone button to speak. Release
									to stop. Best for noisy backgrounds or when you want precise control over when your
									audio is transmitted.
								</div>
							{/if}
						</div>
					</div>

					<!-- Speech Speed Section -->
					<div class="divider"></div>

					<SpeechSpeedSelector />

					<!-- Info Banner -->
					<div class="mt-4 alert py-2 text-xs">
						<span class="icon-[mdi--information-outline] h-4 w-4 shrink-0 stroke-info"></span>
						<span>You can change this setting anytime in your profile settings.</span>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Headphone Warning Modal -->
	{#if showHeadphoneWarning}
		<dialog class="modal-open modal">
			<div class="modal-box">
				<h3 class="flex items-center gap-2 text-lg font-bold">
					<span class="icon-[mdi--alert-circle-outline] h-6 w-6 text-warning"></span>
					Headphones Required
				</h3>
				<div class="space-y-3 py-4">
					<p class="text-sm">
						<strong>Conversation Mode</strong> works best with headphones or earbuds to prevent audio
						feedback loops.
					</p>
					<div class="alert alert-warning py-2">
						<span class="icon-[mdi--headphones] h-5 w-5 shrink-0"></span>
						<span class="text-xs"
							>Without headphones, the assistant's voice may be picked up by your microphone,
							creating an echo effect and poor audio quality.</span
						>
					</div>
					<p class="text-sm">Do you have headphones or earbuds connected?</p>
				</div>
				<div class="modal-action">
					<button class="btn btn-ghost" onclick={cancelModeChange}>Cancel</button>
					<button class="btn btn-primary" onclick={confirmModeChange}>
						<span class="icon-[mdi--check] h-5 w-5"></span>
						Yes, Continue
					</button>
				</div>
			</div>
			<form method="dialog" class="modal-backdrop" onclick={cancelModeChange}>
				<button>close</button>
			</form>
		</dialog>
	{/if}

	<!-- Swipeable Card Stack Section -->
	<div class="space-y-4">
		<div class="text-center">
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
				{#each featuredScenarios as scenario, index (scenario.id + '-' + (currentSpeaker?.id || 'no-speaker'))}
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
				👈 Swipe left or right to pass 👉
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
