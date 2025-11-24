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
	}

	const {
		selectedLanguage = null,
		selectedSpeaker = null,
		selectedScenario = null,
		onStartConversation,
		showStartButton = false,
		isLoading = false
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

	const scenarioMeta = $derived(
		selectedScenario ? getDifficultyLevel(selectedScenario.difficultyRating ?? 1) : null
	);

	const rolePersonLabels: Record<string, string> = {
		tutor: 'Your Tutor',
		character: 'Your Partner',
		friendly_chat: 'Your Friend',
		expert: 'Your Expert'
	};

	// Language display variants for rotation animation

	// Default fallback image for scenarios
	const defaultScenarioImage =
		'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect fill="%2394a3b8" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%23fff"%3EScenario%3C/text%3E%3C/svg%3E';
</script>

{#if hasSelections}
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
					/>
				</figure>
			{:else if selectedScenario?.thumbnailUrl}
				<figure>
					<img
						src={defaultScenarioImage}
						alt={selectedScenario.title}
						class="h-full w-full object-cover"
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
										class="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/30 text-3xl sm:text-5xl"
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

							<!-- Difficulty Indicator - More compact on mobile -->
							{#if scenarioMeta}
								<div class="flex items-center gap-1.5 sm:gap-2">
									<span class="text-[10px] text-base-content/70 sm:text-xs">Difficulty:</span>
									<div class="flex items-center gap-0.5 sm:gap-1">
										{#each [1, 2, 3] as segment}
											<span
												class="h-1 w-4 rounded-full transition-colors sm:h-1.5 sm:w-6"
												class:bg-success={segment <=
													(selectedScenario.difficultyRating || 0) / 3.33 &&
													scenarioMeta.color === 'success'}
												class:bg-warning={segment <=
													(selectedScenario.difficultyRating || 0) / 3.33 &&
													scenarioMeta.color === 'warning'}
												class:bg-error={segment <=
													(selectedScenario.difficultyRating || 0) / 3.33 &&
													scenarioMeta.color === 'error'}
												class:bg-base-300={segment >
													(selectedScenario.difficultyRating || 0) / 3.33}
											></span>
										{/each}
									</div>
									<span
										class="text-[10px] font-medium sm:text-xs"
										class:text-success={scenarioMeta.color === 'success'}
										class:text-warning={scenarioMeta.color === 'warning'}
										class:text-error={scenarioMeta.color === 'error'}
									>
										{scenarioMeta.label}
									</span>
								</div>
							{/if}
						</div>
					</div>
				{/if}

				<!-- Start Conversation Button - Integrated into card -->
				{#if showStartButton && selectedScenario && onStartConversation}
					<div class="relative z-10 mt-4 sm:mt-6">
						<button
							disabled={isLoading}
							class="btn btn-block shadow-lg transition-all duration-200 btn-lg btn-primary hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed"
							onclick={() => onStartConversation?.(selectedScenario)}
						>
							{#if isLoading}
								<span class="loading loading-spinner loading-sm"></span>
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

<style>
	/* Smooth transitions for all interactive elements */
	.badge {
		@apply transition-all duration-200;
	}

	/* Subtle hover effect on card */
	.briefing-card:hover {
		@apply shadow-2xl;
	}

	/* Rotating text animation for language display */
	.text-rotate {
		overflow: hidden;
		height: 1.5rem; /* Mobile height */
		position: relative;
	}

	@media (min-width: 640px) {
		.text-rotate {
			height: 1.75rem; /* Desktop height */
		}
	}

	.rotate-text {
		display: flex;
		flex-direction: column;
		animation: rotate-words 9s infinite;
	}

	.rotate-text span {
		display: block;
		height: 1.5rem;
		line-height: 1.5rem;
	}

	@media (min-width: 640px) {
		.rotate-text span {
			height: 1.75rem;
			line-height: 1.75rem;
		}
	}

	@keyframes rotate-words {
		0%,
		30% {
			transform: translateY(0%);
		}
		33%,
		63% {
			transform: translateY(-33.33%);
		}
		66%,
		96% {
			transform: translateY(-66.66%);
		}
		100% {
			transform: translateY(0%);
		}
	}
</style>
