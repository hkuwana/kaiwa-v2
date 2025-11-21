<!-- src/lib/components/BriefingCard.svelte -->
<!-- Jony Ive-inspired briefing card - Clean, minimal, delightful -->
<script lang="ts">
	import type { Language as DataLanguage } from '$lib/data/languages';
	import type { Scenario } from '$lib/data/scenarios';
	import { getDifficultyLevel } from '$lib/utils/cefr';
	import { fade, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	interface Speaker {
		id: string;
		voiceName: string;
		characterImageUrl?: string;
		characterImageAlt?: string;
		dialectName?: string;
		region?: string;
		gender: 'male' | 'female' | 'neutral';
	}

	interface Props {
		selectedLanguage?: DataLanguage | null;
		selectedSpeaker?: Speaker | null;
		selectedScenario?: Scenario | null;
	}

	const { selectedLanguage = null, selectedSpeaker = null, selectedScenario = null }: Props =
		$props();

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
			<!-- Header - more compact on mobile -->
			<div class="mb-3 text-center sm:mb-6">
				<h2 class="text-xs font-medium uppercase tracking-wider text-base-content/50 sm:text-sm">
					Your Session
				</h2>
			</div>

			<!-- Speaker Section (Hero) - Compact on mobile -->
			{#if selectedSpeaker}
				<div
					class="mb-4 flex flex-col items-center sm:mb-6"
					in:fade={{ duration: 400, delay: 100 }}
				>
					<!-- Avatar - Smaller on mobile -->
					<div class="avatar mb-2 sm:mb-4">
						<div
							class="w-16 rounded-full ring-2 ring-primary/20 ring-offset-2 ring-offset-base-100 sm:w-24 sm:ring-4"
						>
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
						<!-- Mobile: Show just dialect -->
						<p class="text-xs text-base-content/60 sm:hidden">
							{selectedSpeaker.dialectName}
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
				<!-- Language Section - Compact -->
				{#if selectedLanguage}
					<div
						class="flex items-center gap-3 rounded-2xl bg-base-100/50 p-3 backdrop-blur-sm sm:gap-4 sm:p-4"
						in:fade={{ duration: 400, delay: 200 }}
					>
						<div
							class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl sm:h-12 sm:w-12 sm:text-2xl"
						>
							{selectedLanguage.flag || '🌍'}
						</div>
						<div class="flex-1">
							<p class="text-[10px] font-medium uppercase tracking-wide text-base-content/50 sm:text-xs">
								Language
							</p>
							<p class="text-base font-semibold text-base-content sm:text-lg">
								{selectedLanguage.name}
							</p>
						</div>
					</div>
				{/if}

				<!-- Scenario Section - More compact on mobile -->
				{#if selectedScenario}
					<div
						class="rounded-2xl bg-base-100/50 p-3 backdrop-blur-sm sm:p-4"
						in:fade={{ duration: 400, delay: 250 }}
					>
						<div class="mb-2 flex items-start justify-between gap-2 sm:mb-3 sm:gap-3">
							<div class="flex-1">
								<p class="text-[10px] font-medium uppercase tracking-wide text-base-content/50 sm:text-xs">
									Scenario
								</p>
								<p class="mt-0.5 text-base font-semibold leading-tight text-base-content sm:mt-1 sm:text-lg">
									{selectedScenario.title}
								</p>
							</div>
							<div class="flex-shrink-0">
								<span
									class="badge badge-xs capitalize sm:badge-sm"
									class:badge-primary={selectedScenario.role === 'tutor'}
									class:badge-info={selectedScenario.role === 'character'}
									class:badge-warning={selectedScenario.role === 'friendly_chat'}
									class:badge-accent={selectedScenario.role === 'expert'}
								>
									{roleDisplayNames[selectedScenario.role] || selectedScenario.role}
								</span>
							</div>
						</div>

						<!-- Scenario Description - Hide on small mobile, show on sm+ -->
						{#if selectedScenario.description}
							<p class="mb-2 hidden text-sm leading-relaxed text-base-content/70 sm:mb-3 sm:block">
								{selectedScenario.description}
							</p>
						{/if}

						<!-- Scenario Goal (learningGoal) - Show on mobile if available -->
						{#if selectedScenario.learningGoal}
							<p class="mb-2 text-xs leading-relaxed text-base-content/70 sm:hidden">
								Goal: {selectedScenario.learningGoal}
							</p>
						{/if}

						<!-- Difficulty Indicator - More compact on mobile -->
						{#if scenarioMeta}
							<div class="flex items-center gap-1.5 sm:gap-2">
								<span class="text-[10px] text-base-content/50 sm:text-xs">Difficulty:</span>
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
											class:bg-error={segment <= (selectedScenario.difficultyRating || 0) / 3.33 &&
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
				{/if}
			</div>

			<!-- Subtle Gradient Overlay (bottom) -->
			<div
				class="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-base-100/30 to-transparent"
			></div>
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
</style>
