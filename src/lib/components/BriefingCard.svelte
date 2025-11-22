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
	}

	const {
		selectedLanguage = null,
		selectedSpeaker = null,
		selectedScenario = null,
		onStartConversation,
		showStartButton = false
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

	const roleDisplayNames: Record<string, string> = {
		tutor: 'Tutor',
		character: 'Roleplay',
		friendly_chat: 'Friendly Chat',
		expert: 'Expert'
	};

	const rolePersonLabels: Record<string, string> = {
		tutor: 'Your Tutor',
		character: 'Your Date',
		friendly_chat: 'Your Friend',
		expert: 'Your Expert'
	};

	// Language display variants for rotation animation
	const languageVariants = $derived.by(() => {
		if (!selectedLanguage) return [];
		return [
			{ text: selectedLanguage.name, color: 'bg-primary text-primary-content' },
			{ text: selectedLanguage.nativeName, color: 'bg-secondary text-secondary-content' },
			{ text: selectedLanguage.name, color: 'bg-accent text-accent-content' }
		];
	});
</script>

{#if hasSelections}
	<div
		class="w-full max-w-md"
		in:fade={{ duration: 300, easing: cubicOut }}
		out:fade={{ duration: 200 }}
	>
		<!-- Briefing Card -->
		<div
			class="relative overflow-hidden rounded-3xl border border-base-300 bg-gradient-to-br from-base-100 to-base-200/50 p-4 shadow-xl backdrop-blur-sm sm:p-8"
			in:scale={{ duration: 400, start: 0.95, easing: cubicOut }}
		>
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
									alt={selectedSpeaker.characterImageAlt || `Image of ${selectedSpeaker.voiceName}`}
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
								class="mb-1 text-xs font-medium tracking-wide text-base-content/60 uppercase sm:mb-2"
							>
								{rolePersonLabels[selectedScenario.role] || 'Your Partner'}
							</p>
						{/if}
						<!-- Mobile: "Charlotte from Great Britain" format -->
						<h3 class="mb-0.5 text-lg font-semibold text-base-content sm:mb-1 sm:text-2xl">
							{selectedSpeaker.voiceName}
							{#if selectedSpeaker.region}
								<span class="text-sm font-normal text-base-content/60 sm:hidden">
									from {selectedSpeaker.region}
								</span>
							{/if}
						</h3>
						<!-- Desktop: Show dialect and region separately -->
						<p class="hidden text-sm text-base-content/60 sm:block">
							{selectedSpeaker.dialectName}
							{#if selectedSpeaker.region}
								<span class="opacity-50">•</span>
								{selectedSpeaker.region}
							{/if}
						</p>
					</div>
				</div>
			{/if}

			<!-- Divider - thinner on mobile -->
			{#if selectedSpeaker && (selectedLanguage || selectedScenario)}
				<div class="divider my-2 sm:my-4"></div>
			{/if}

			<!-- Language & Scenario Grid - More compact on mobile -->
			<div class="space-y-2 sm:space-y-4">
				{#if selectedScenario}
					<div
						class="card rounded-2xl shadow-sm {selectedScenario.thumbnailUrl
							? 'image-full bg-base-100'
							: 'bg-base-100/50'}"
					>
						{#if selectedScenario.thumbnailUrl}
							<figure>
								<img
									src={selectedScenario.thumbnailUrl}
									alt={selectedScenario.title}
									class="h-full w-full object-cover"
								/>
							</figure>
						{/if}
						<div class="card-body p-3 sm:p-4">
							<div class="mb-2 flex items-start justify-between gap-2 sm:mb-3 sm:gap-3">
								<div class="flex-1">
									<p
										class="text-[10px] font-medium tracking-wide uppercase sm:text-xs {selectedScenario.thumbnailUrl
											? 'text-base-content'
											: 'text-base-content/50'}"
									>
										Scenario
									</p>
									<h3
										class="mt-0.5 text-base leading-tight font-semibold sm:mt-1 sm:text-lg {selectedScenario.thumbnailUrl
											? 'text-base-content'
											: 'text-base-content'}"
									>
										{selectedScenario.title}
									</h3>
								</div>
							</div>

							<p
								class="mb-2 text-xs leading-relaxed {selectedScenario.thumbnailUrl
									? 'text-base-content/90'
									: 'text-base-content/70'}"
							>
								Goal: {selectedScenario.learningGoal}
							</p>

							<!-- Difficulty Indicator - More compact on mobile -->
							{#if scenarioMeta}
								<div class="flex items-center gap-1.5 sm:gap-2">
									<span
										class="text-[10px] sm:text-xs {selectedScenario.thumbnailUrl
											? 'text-base-content/70'
											: 'text-base-content/50'}"
									>
										Difficulty:
									</span>
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
			</div>

			<!-- Start Conversation Button - Integrated into card -->
			{#if showStartButton && selectedScenario && onStartConversation}
				<div class="relative z-10 mt-4 sm:mt-6">
					<button
						class="btn btn-primary btn-block btn-lg shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
						onclick={() => onStartConversation?.(selectedScenario)}
					>
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

			<!-- Subtle Gradient Overlay (bottom) - only show when no button -->
			{#if !showStartButton}
				<div
					class="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-base-100/30 to-transparent"
				></div>
			{/if}
		</div>
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
