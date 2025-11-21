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
			class="relative overflow-hidden rounded-3xl border border-base-300 bg-gradient-to-br from-base-100 to-base-200/50 p-6 shadow-xl backdrop-blur-sm sm:p-8"
			in:scale={{ duration: 400, start: 0.95, easing: cubicOut }}
		>
			<!-- Header -->
			<div class="mb-6 text-center">
				<h2 class="text-sm font-medium uppercase tracking-wider text-base-content/50">
					Your Session
				</h2>
			</div>

			<!-- Speaker Section (Hero) -->
			{#if selectedSpeaker}
				<div
					class="mb-6 flex flex-col items-center"
					in:fade={{ duration: 400, delay: 100 }}
				>
					<!-- Large Avatar -->
					<div class="avatar mb-4">
						<div
							class="w-24 rounded-full ring-4 ring-primary/20 ring-offset-2 ring-offset-base-100 sm:w-28"
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
									class="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/30 text-5xl"
								>
									{getGenderIcon(selectedSpeaker.gender)}
								</div>
							{/if}
						</div>
					</div>

					<!-- Speaker Info -->
					<div class="text-center">
						<h3 class="mb-1 text-2xl font-semibold text-base-content">
							{selectedSpeaker.voiceName}
						</h3>
						<p class="text-sm text-base-content/60">
							{selectedSpeaker.dialectName}
							{#if selectedSpeaker.region}
								<span class="opacity-50">•</span>
								{selectedSpeaker.region}
							{/if}
						</p>
					</div>
				</div>
			{/if}

			<!-- Divider -->
			{#if selectedSpeaker && (selectedLanguage || selectedScenario)}
				<div class="divider my-4"></div>
			{/if}

			<!-- Language & Scenario Grid -->
			<div class="space-y-4">
				<!-- Language Section -->
				{#if selectedLanguage}
					<div
						class="flex items-center gap-4 rounded-2xl bg-base-100/50 p-4 backdrop-blur-sm"
						in:fade={{ duration: 400, delay: 200 }}
					>
						<div
							class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl"
						>
							{selectedLanguage.flag || '🌍'}
						</div>
						<div class="flex-1">
							<p class="text-xs font-medium uppercase tracking-wide text-base-content/50">
								Language
							</p>
							<p class="text-lg font-semibold text-base-content">
								{selectedLanguage.name}
							</p>
						</div>
					</div>
				{/if}

				<!-- Scenario Section -->
				{#if selectedScenario}
					<div
						class="rounded-2xl bg-base-100/50 p-4 backdrop-blur-sm"
						in:fade={{ duration: 400, delay: 250 }}
					>
						<div class="mb-3 flex items-start justify-between gap-3">
							<div class="flex-1">
								<p class="text-xs font-medium uppercase tracking-wide text-base-content/50">
									Scenario
								</p>
								<p class="mt-1 text-lg font-semibold leading-tight text-base-content">
									{selectedScenario.title}
								</p>
							</div>
							<div class="flex-shrink-0">
								<span
									class="badge badge-sm capitalize"
									class:badge-primary={selectedScenario.role === 'tutor'}
									class:badge-info={selectedScenario.role === 'character'}
									class:badge-warning={selectedScenario.role === 'friendly_chat'}
									class:badge-accent={selectedScenario.role === 'expert'}
								>
									{roleDisplayNames[selectedScenario.role] || selectedScenario.role}
								</span>
							</div>
						</div>

						<!-- Scenario Description -->
						{#if selectedScenario.description}
							<p class="mb-3 text-sm leading-relaxed text-base-content/70">
								{selectedScenario.description}
							</p>
						{/if}

						<!-- Difficulty Indicator -->
						{#if scenarioMeta}
							<div class="flex items-center gap-2">
								<span class="text-xs text-base-content/50">Difficulty:</span>
								<div class="flex items-center gap-1">
									{#each [1, 2, 3] as segment}
										<span
											class="h-1.5 w-6 rounded-full transition-colors"
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
									class="text-xs font-medium"
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
