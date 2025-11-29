<!-- src/lib/components/SwipeableCardStack.svelte -->
<!-- Jony Ive-inspired swipeable stacked card carousel -->
<script lang="ts">
	import { scenariosData } from '$lib/data/scenarios';
	import { settingsStore } from '$lib/stores/settings.store.svelte';
	import { getSpeakersByLanguage } from '$lib/data/speakers';
	import BriefingCard from './BriefingCard.svelte';
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { quintOut } from 'svelte/easing';
	import type { Scenario } from '$lib/data/scenarios';
	import { userPreferencesStore } from '$lib/stores/user-preferences.store.svelte';
	import type { AudioInputMode } from '$lib/server/db/types';
	import { getAudioInputModeFromCookie, setAudioInputModeCookie } from '$lib/utils/cookies';
	import { goto } from '$app/navigation';
	import { track } from '$lib/analytics/posthog';

	interface Props {
		/** Show only featured scenarios (default: first 3) */
		featuredScenariosCount?: number;
		/** Callback when user starts a conversation */
		onStartConversation?: (scenario: Scenario) => void;
		/** Selected speaker ID */
		selectedSpeaker?: string | null;
		/** Callback to open language/speaker selector */
		onChooseLanguage?: () => void;
	}

	const {
		featuredScenariosCount = 3,
		onStartConversation,
		selectedSpeaker,
		onChooseLanguage
	}: Props = $props();

	// Get featured scenarios + add a "Browse All" placeholder at the end
	const featuredScenarios = scenariosData.slice(0, featuredScenariosCount);
	// Card stack state
	let currentCardIndex = $state(0);
	let _showAdvancedOptions = $state(false);
	let showSwipeHint = $state(true); // Show hint animation initially
	let isStartingConversation = $state(false); // Track loading state

	// Hide swipe hint after first interaction or after 5 seconds
	$effect(() => {
		const timer = setTimeout(() => {
			showSwipeHint = false;
		}, 5000);
		return () => clearTimeout(timer);
	});

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

	// Derive the speaker object from prop or store, with auto-fallback to default speaker
	const currentSpeaker = $derived.by(() => {
		const speakerId = selectedSpeaker || settingsStore.selectedSpeaker;
		console.log('[SwipeableCardStack] Current speaker:', {
			selectedSpeaker,
			storeSelectedSpeaker: settingsStore.selectedSpeaker,
			speakerId
		});

		if (!settingsStore.selectedLanguage) {
			console.log('[SwipeableCardStack] No language selected, returning null');
			return null;
		}

		const languageId = settingsStore.selectedLanguage.id;
		console.log('[SwipeableCardStack] Looking up speakers for language:', {
			code: settingsStore.selectedLanguage.code,
			id: languageId,
			speakerId
		});
		const speakers = getSpeakersByLanguage(languageId);
		console.log(
			'[SwipeableCardStack] Available speakers:',
			speakers.map((s) => ({ id: s.id, voiceName: s.voiceName, languageId: s.languageId }))
		);

		// Try to find the speaker for this language
		if (speakerId) {
			const speaker = speakers.find((s) => s.id === speakerId);
			if (speaker) {
				console.log('[SwipeableCardStack] Found speaker:', speaker);
				return speaker;
			}
			console.log('[SwipeableCardStack] Speaker not available for language, using default');
		}

		// If speaker not found or no speaker selected, use first available speaker for this language
		const defaultSpeaker = speakers.length > 0 ? speakers[0] : null;
		console.log('[SwipeableCardStack] Using default speaker:', defaultSpeaker);
		return defaultSpeaker;
	});

	// Check if we're on the "Browse All" card (last position)
	const isOnBrowseAllCard = $derived(currentCardIndex === featuredScenarios.length);
	const totalCards = $derived(featuredScenarios.length + 1); // +1 for Browse All card

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

		// Hide hint on first interaction
		showSwipeHint = false;

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
			const direction = dragCurrentX > 0 ? 'next' : 'previous';
			if (direction === 'next') {
				nextCard(true);
			} else {
				previousCard(true);
			}
		}

		// Reset drag state
		dragCurrentX = 0;
		dragCurrentY = 0;
	}

	function trackCardChange(
		direction: 'next' | 'previous',
		fromIndex: number,
		toIndex: number
	): void {
		if (fromIndex === toIndex) return;

		const fromScenario =
			fromIndex >= 0 && fromIndex < featuredScenarios.length ? featuredScenarios[fromIndex] : null;
		const toScenario =
			toIndex >= 0 && toIndex < featuredScenarios.length ? featuredScenarios[toIndex] : null;

		track('home_scenario_swiped', {
			direction,
			from_index: fromIndex,
			to_index: toIndex,
			from_card_type: fromScenario ? 'scenario' : 'browse_all',
			to_card_type: toScenario ? 'scenario' : 'browse_all',
			from_scenario_id: fromScenario?.id || null,
			to_scenario_id: toScenario?.id || null
		});
	}

	function nextCard(fromUserGesture: boolean = false) {
		const previousIndex = currentCardIndex;

		if (currentCardIndex < totalCards - 1) {
			currentCardIndex++;
		} else {
			// Loop back to start
			currentCardIndex = 0;
		}

		if (fromUserGesture) {
			trackCardChange('next', previousIndex, currentCardIndex);
		}
	}

	function previousCard(fromUserGesture: boolean = false) {
		const previousIndex = currentCardIndex;

		if (currentCardIndex > 0) {
			currentCardIndex--;
		} else {
			// Loop to end
			currentCardIndex = totalCards - 1;
		}

		if (fromUserGesture) {
			trackCardChange('previous', previousIndex, currentCardIndex);
		}
	}

	function handleStartConversation(scenario: Scenario) {
		console.log('Starting conversation with scenario:', scenario.title);
		isStartingConversation = true;

		// Call parent callback if provided, otherwise fall back to direct navigation
		if (onStartConversation) {
			onStartConversation(scenario);
		} else {
			// Fallback for components that don't provide the callback
			const sessionId = crypto.randomUUID();
			goto(
				`/conversation?sessionId=${sessionId}&scenario=${scenario.id}&autoStart=true&audioMode=${selectedAudioMode}`
			);
		}
	}

	function _goToScenario(index: number) {
		currentCardIndex = index;
	}

	// Keyboard navigation for desktop users
	// Arrow direction matches the visual card movement direction
	function handleKeyDown(event: KeyboardEvent) {
		// Only handle arrow keys
		if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

		// Hide swipe hint on keyboard interaction
		showSwipeHint = false;

		if (event.key === 'ArrowLeft') {
			// Left arrow = cards move left = next card
			nextCard(true);
		} else if (event.key === 'ArrowRight') {
			// Right arrow = cards move right = previous card
			previousCard(true);
		}
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

<!-- Global keyboard listener for arrow key navigation -->
<svelte:window onkeydown={handleKeyDown} />

<div class="w-full">
	<!-- Voice Mode Toggle - Top position -->
	<div
		class="mb-3 flex justify-center sm:mb-5"
		in:fly={{ y: -10, duration: 400, delay: 100, easing: quintOut }}
	>
		<div
			class="flex flex-col items-center gap-2 rounded-2xl border border-base-content/10 bg-base-100/80 px-4 py-2.5 shadow-lg backdrop-blur-xl sm:px-5 sm:py-3"
		>
			<label class="flex cursor-pointer items-center gap-2 sm:gap-3">
				<!-- Show only active mode text on mobile, both on desktop -->
				<span
					class="flex items-center gap-1.5 text-sm font-medium transition-all"
					class:text-base-content={selectedAudioMode === 'ptt'}
					class:opacity-50={selectedAudioMode === 'vad'}
					class:scale-105={selectedAudioMode === 'ptt'}
				>
					<span class="h-4.5 w-4.5 icon-[mdi--gesture-tap-button]"></span>
					<span class:hidden={selectedAudioMode === 'vad'} class="sm:inline">Push to Talk</span>
				</span>
				<input
					type="checkbox"
					class="toggle toggle-primary toggle-sm"
					checked={selectedAudioMode === 'vad'}
					onchange={() => handleAudioModeChange(selectedAudioMode === 'vad' ? 'ptt' : 'vad')}
					aria-label="Switch between Push to Talk and Casual Chat modes"
				/>
				<span
					class="flex items-center gap-1.5 text-sm font-medium transition-all"
					class:text-base-content={selectedAudioMode === 'vad'}
					class:opacity-50={selectedAudioMode === 'ptt'}
					class:scale-105={selectedAudioMode === 'vad'}
				>
					<span class:hidden={selectedAudioMode === 'ptt'} class="sm:inline">Casual Chat</span>
					<span class="icon-[mdi--message-text-outline] h-4.5 w-4.5"></span>
				</span>
			</label>
			<div class="text-center text-xs text-base-content/60" in:fade={{ duration: 200 }}>
				{selectedAudioMode === 'vad' ? 'Best with earphones' : 'Best without earphones'}
			</div>
		</div>
	</div>

	<!-- Swipeable Card Stack Section -->
	<div class="space-y-2 sm:space-y-3">
		<!-- Card Stack Container -->
		<div class="relative mx-auto w-full max-w-2xl px-4">
			<!-- Animated Swipe Hints - Show initially then fade out -->
			{#if showSwipeHint}
				<!-- Left Arrow -->
				<div
					class="swipe-hint-left pointer-events-none absolute top-1/2 left-0 z-50 -translate-y-1/2"
				>
					<div class="flex flex-col items-center gap-1">
						<span class="animate-swipe-left icon-[mdi--chevron-left] h-10 w-10 text-primary"></span>
						<span class="text-xs font-medium text-primary">Swipe</span>
					</div>
				</div>

				<!-- Right Arrow -->
				<div
					class="swipe-hint-right pointer-events-none absolute top-1/2 right-0 z-50 -translate-y-1/2"
				>
					<div class="flex flex-col items-center gap-1">
						<span class="animate-swipe-right icon-[mdi--chevron-right] h-10 w-10 text-primary"
						></span>
						<span class="text-xs font-medium text-primary">Swipe</span>
					</div>
				</div>
			{/if}
			<!-- Stack of Cards with Depth -->
			<div
				class="relative mx-auto h-[520px] w-full max-w-md sm:h-[600px]"
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
							isLoading={isStartingConversation}
							onStartConversation={handleStartConversation}
							{onChooseLanguage}
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
							class="block overflow-hidden rounded-3xl border-2 border-dashed border-primary/30 bg-linear-to-br from-base-100 to-base-200/50 p-8 shadow-xl backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] hover:border-primary/60 hover:shadow-2xl sm:p-12"
						>
							<div class="flex flex-col items-center justify-center text-center">
								<!-- Icon -->
								<div
									class="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 sm:h-24 sm:w-24"
								>
									<span class="icon-[mdi--view-grid-outline] h-10 w-10 text-primary sm:h-12 sm:w-12"
									></span>
								</div>

								<!-- Text -->
								<div class="space-y-2">
									<h3 class="text-xl font-bold text-base-content sm:text-2xl">
										Browse More Scenarios
									</h3>
									<p class="text-sm text-base-content/70 sm:text-base">
										Explore {scenariosData.length}+ conversation scenarios
									</p>
								</div>

								<!-- CTA -->
								<div class="btn shadow-lg btn-lg btn-primary">
									View All
									<span class="icon-[mdi--arrow-right] h-5 w-5"></span>
								</div>
							</div>
						</a>
					</div>
				</div>
			</div>
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
					<div class="alert py-2 alert-warning">
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
</div>

<style>
	@reference "tailwindcss";

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

	/* Swipe hint animations */
	.animate-swipe-left {
		animation: swipe-left 2s ease-in-out infinite;
	}

	.animate-swipe-right {
		animation: swipe-right 2s ease-in-out infinite;
	}

	@keyframes swipe-left {
		0%,
		100% {
			transform: translateX(0);
			opacity: 0.6;
		}
		50% {
			transform: translateX(-10px);
			opacity: 1;
		}
	}

	@keyframes swipe-right {
		0%,
		100% {
			transform: translateX(0);
			opacity: 0.6;
		}
		50% {
			transform: translateX(10px);
			opacity: 1;
		}
	}

	/* Swipe hint containers fade in/out */
	.swipe-hint-left,
	.swipe-hint-right {
		animation: fade-in-out 5s ease-in-out forwards;
	}

	@keyframes fade-in-out {
		0% {
			opacity: 0;
		}
		10% {
			opacity: 1;
		}
		90% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}

	/* Initial card nudge animation - shows swipeability */
	.card-stack-item:first-child {
		animation: card-nudge 3s ease-in-out 0.5s;
	}

	@keyframes card-nudge {
		0%,
		100% {
			transform: translateX(-50%) translateY(0) scale(1);
		}
		5% {
			transform: translateX(calc(-50% + 20px)) translateY(-5px) rotate(3deg) scale(1.01);
		}
		10% {
			transform: translateX(calc(-50% - 20px)) translateY(-5px) rotate(-3deg) scale(1.01);
		}
		15% {
			transform: translateX(-50%) translateY(0) scale(1);
		}
	}
</style>
