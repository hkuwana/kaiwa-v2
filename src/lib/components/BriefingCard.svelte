<!-- src/lib/components/BriefingCard.svelte -->
<!-- Jony Ive-inspired briefing card - Clean, minimal, delightful -->
<script lang="ts">
	import type { Language as DataLanguage } from '$lib/data/languages';
	import type { Scenario } from '$lib/data/scenarios';
	import { getDifficultyLevel } from '$lib/utils/cefr';
	import { fade, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import type { Speaker } from '$lib/types';

	interface Props {
		selectedLanguage?: DataLanguage | null;
		selectedSpeaker?: Speaker | null;
		selectedScenario?: Scenario | null;
		/** Callback when "Start Conversation" button is clicked */
		onStartConversation?: (scenario: Scenario) => void;
		/** Show the start conversation button (default: false) */
		showStartButton?: boolean;
		/** Show loading spinner on button (default: false) */
		isLoading?: boolean;
		/** Callback to open language/speaker selector */
		onChooseLanguage?: () => void;
	}

	const {
		selectedLanguage = null,
		selectedSpeaker = null,
		selectedScenario = null,
		onStartConversation,
		showStartButton = false,
		isLoading = false,
		onChooseLanguage
	}: Props = $props();

	const hasSelections = $derived(selectedLanguage || selectedSpeaker || selectedScenario);

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

	const _scenarioMeta = $derived(
		selectedScenario ? getDifficultyLevel(selectedScenario.difficultyRating ?? 1) : null
	);

	const rolePersonLabels: Record<string, string> = {
		tutor: 'Your Tutor',
		character: 'Your Partner',
		friendly_chat: 'Your Friend',
		expert: 'Your Expert'
	};

	// Language display variants for rotation animation

	// Static scenario images available for fallback
	const FALLBACK_SCENARIO_IMAGES = [
		'/scenarios/tutor-scenario.png',
		'/scenarios/Free-Practice-Mode.png',
		'/scenarios/family-celebration-toast.png',
		'/scenarios/Dinner-drinks-date.png',
		'/scenarios/Emergency-room-visit.png',
		'/scenarios/Sharing-big-life-news.png',
		'/scenarios/repairing-the-relationship.png'
	];

	// Default fallback image for scenarios (SVG placeholder as last resort)
	const defaultScenarioImage =
		'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect fill="%2394a3b8" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%23fff"%3EScenario%3C/text%3E%3C/svg%3E';

	// Handle image load errors by using first available static scenario image
	function handleImageError(event: Event) {
		const img = event.target as HTMLImageElement;
		// Use the first static scenario image as fallback (tutor-scenario.png)
		if (img.src !== FALLBACK_SCENARIO_IMAGES[0]) {
			img.src = FALLBACK_SCENARIO_IMAGES[0];
		} else {
			// If even the fallback fails, use SVG placeholder
			img.src = defaultScenarioImage;
		}
	}
</script>

<!-- Empty State - Show when no language selected -->
{#if !selectedLanguage}
	<div class="w-full max-w-md" in:fade={{ duration: 300, easing: cubicOut }}>
		<div
			class="card relative overflow-hidden rounded-3xl border border-base-300 bg-linear-to-br from-base-100 to-base-200 shadow-xl"
		>
			<div class="card-body flex items-center justify-center gap-6 p-8 text-center sm:p-12">
				<div
					class="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 sm:h-32 sm:w-32"
				>
					<span class="icon-[mdi--earth] h-12 w-12 text-primary sm:h-16 sm:w-16"></span>
				</div>

				<div class="space-y-3">
					<h3 class="text-xl font-semibold text-base-content sm:text-2xl">Choose Your Language</h3>
					<p class="text-sm text-base-content/70 sm:text-base">
						Select a language and speaker to get started with a conversation practice
					</p>
				</div>

				{#if onChooseLanguage}
					<button
						onclick={onChooseLanguage}
						class="btn shadow-lg transition-all duration-200 btn-lg btn-primary hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
					>
						<span class="icon-[mdi--globe] h-5 w-5"></span>
						Choose Language & Speaker
					</button>
				{/if}
			</div>
		</div>
	</div>
{:else if hasSelections}
	<div
		class="w-full max-w-md"
		in:fade={{ duration: 300, easing: cubicOut }}
		out:fade={{ duration: 200 }}
	>
		<!-- Briefing Card with Full Background Image -->
		<div
			class="card {selectedScenario?.thumbnailUrl
				? 'image-full'
				: ''} relative overflow-hidden rounded-3xl border border-base-300 bg-base-100 shadow-xl"
			in:scale={{ duration: 400, start: 0.95, easing: cubicOut }}
		>
			<!-- Scenario Background Image (Full Card) -->
			{#if selectedScenario?.thumbnailUrl}
				<figure>
					<img
						src={selectedScenario.thumbnailUrl}
						alt={selectedScenario.title}
						class="h-full w-full object-cover"
						onerror={handleImageError}
					/>
				</figure>
			{:else}
				<figure>
					<img
						src={FALLBACK_SCENARIO_IMAGES[0]}
						alt={selectedScenario?.title ?? 'Scenario'}
						class="h-full w-full object-cover"
						onerror={handleImageError}
					/>
				</figure>
			{/if}

			<!-- Card Content Overlay -->
			<div class="card-body p-4 sm:p-8">
				<!-- Speaker Section (Hero) - Compact on mobile -->
				{#if selectedSpeaker}
					<div
						class="mb-4 flex flex-col items-center sm:mb-6"
						in:fade={{ duration: 400, delay: 100 }}
					>
						<!-- Avatar - Smaller on mobile -->

						<div class=" avatar mb-2 sm:mb-4">
							<div class="w-20 rounded-full ring-2 ring-success sm:w-24 sm:ring-4">
								{#if selectedSpeaker.characterImageUrl}
									<img
										alt={selectedSpeaker.characterImageAlt ||
											`Image of ${selectedSpeaker.voiceName}`}
										src={selectedSpeaker.characterImageUrl}
										class="object-cover"
										loading="eager"
									/>
								{:else}
									<div
										class="flex h-full w-full items-center justify-center bg-linear-to-br from-primary/10 to-primary/30 text-3xl sm:text-5xl"
									>
										{getGenderIcon(selectedSpeaker.gender)}
									</div>
								{/if}
							</div>
						</div>

						<!-- Speaker Info - More compact format on mobile -->
						<div class="text-center">
							<!-- Role Label - "Your Tutor", "Your Friend", etc. -->
							{#if selectedScenario}
								<p
									class="mb-1 text-xs font-medium tracking-wide text-neutral-content uppercase sm:mb-2"
								>
									{rolePersonLabels[selectedScenario.role] || 'Your Partner'}
								</p>
							{/if}
							<!-- Mobile: "Charlotte from Great Britain" format -->
							<h3 class="mb-0.5 text-lg font-semibold text-neutral-content sm:mb-1 sm:text-2xl">
								{selectedSpeaker.voiceName}
								{#if selectedSpeaker.region}
									<span class="text-sm font-normal text-neutral-content sm:hidden">
										from {selectedSpeaker.region}
									</span>
								{/if}
							</h3>
							<!-- Desktop: Show dialect and region separately -->
							<p class="hidden text-sm text-neutral-content sm:block">
								{selectedSpeaker.dialectName}
								{#if selectedSpeaker.region}
									<span class="opacity-50">•</span>
									{selectedSpeaker.region}
								{/if}
							</p>
						</div>
					</div>
				{/if}

				<!-- Scenario Info - Overlaid on background image -->
				{#if selectedScenario}
					<div class="space-y-2 sm:space-y-4">
						<div class="rounded-2xl bg-base-100/80 p-3 backdrop-blur-sm sm:p-4">
							<div class="mb-2 flex items-start justify-between gap-2 sm:mb-3 sm:gap-3">
								<div class="flex-1">
									<p
										class="text-[10px] font-medium tracking-wide text-base-content/70 uppercase sm:text-xs"
									>
										Scenario
									</p>
									<h3
										class="mt-0.5 text-base leading-tight font-semibold text-base-content sm:mt-1 sm:text-lg"
									>
										{selectedScenario.title}
									</h3>
								</div>
							</div>

							<p class="mb-2 text-xs leading-relaxed text-base-content/90">
								Goal: {selectedScenario.learningGoal}
							</p>
						</div>
					</div>
				{/if}

				<!-- Start Conversation Button - Integrated into card -->
				{#if showStartButton && selectedScenario && onStartConversation}
					<div class="relative z-10 mt-4 sm:mt-6">
						<button
							disabled={isLoading}
							class="btn btn-block text-success-content shadow-lg transition-all duration-200 btn-lg btn-success hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-75"
							onclick={() => onStartConversation?.(selectedScenario)}
						>
							{#if isLoading}
								<span class="loading loading-sm loading-spinner"></span>
								Starting Conversation...
							{:else}
								Start Conversation
							{/if}
						</button>
					</div>
				{/if}
			</div>
			<!-- End Card Body -->

			<!-- Subtle Gradient Overlay (bottom) - only show when no button -->
			{#if !showStartButton}
				<div
					class="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-base-100/30 to-transparent"
				></div>
			{/if}
		</div>
		<!-- End Card -->
	</div>
{/if}

<style></style>
