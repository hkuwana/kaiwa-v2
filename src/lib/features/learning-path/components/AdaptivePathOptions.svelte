<script lang="ts">
	/**
	 * AdaptivePathOptions - Shows conversation options for adaptive learning paths
	 *
	 * Instead of "Day 1, Day 2...", this shows flexible conversation options
	 * that users can choose in any order they want.
	 *
	 * Users can click "Generate Scenarios" to create personalized scenarios
	 * for their current week.
	 */

	import type { LearningPath, LearningPathAssignment } from '$lib/server/db/types';

	interface ConversationOption {
		id: string;
		title: string;
		description: string;
		scenarioId?: string;
		isReady: boolean;
		optionNumber: number;
	}

	interface ActiveWeek {
		id: string;
		weekNumber: number;
		theme: string;
		themeDescription: string;
		seeds: ConversationOption[];
	}

	interface Props {
		path: LearningPath;
		assignment: LearningPathAssignment;
		activeWeek: ActiveWeek | null;
		totalOptions: number;
		readyOptions: number;
		compact?: boolean;
		onStartConversation?: (scenarioId: string) => void;
		onScenariosGenerated?: () => void;
	}

	const {
		path,
		assignment,
		activeWeek,
		totalOptions,
		readyOptions,
		compact = false,
		onStartConversation,
		onScenariosGenerated
	}: Props = $props();

	// State for scenario generation
	let isGenerating = $state(false);
	let generationProgress = $state<{ current: number; total: number } | null>(null);
	let generationError = $state<string | null>(null);

	// Check if any scenarios are ready
	const hasReadyScenarios = $derived(readyOptions > 0);
	const allReady = $derived(readyOptions === totalOptions && totalOptions > 0);
	const needsGeneration = $derived(totalOptions > 0 && readyOptions < totalOptions);

	async function generateScenarios() {
		if (isGenerating) return;

		isGenerating = true;
		generationError = null;
		generationProgress = { current: 0, total: totalOptions - readyOptions };

		try {
			const response = await fetch(`/api/learning-paths/${path.id}/generate-scenarios`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});

			const result = await response.json();

			if (!response.ok || !result.success) {
				throw new Error(result.error || 'Failed to generate scenarios');
			}

			generationProgress = {
				current: result.data?.scenariosGenerated || 0,
				total: totalOptions - readyOptions
			};

			// Notify parent to refresh data
			onScenariosGenerated?.();

			// Reload the page to get fresh data
			window.location.reload();
		} catch (error) {
			generationError = error instanceof Error ? error.message : 'Generation failed';
			console.error('Scenario generation error:', error);
		} finally {
			isGenerating = false;
		}
	}
</script>

{#if compact}
	<!-- Compact view for dashboard widgets -->
	<div class="card bg-base-200 shadow-sm">
		<div class="card-body p-4">
			<div class="flex items-start justify-between gap-3">
				<div class="flex-1">
					<h3 class="line-clamp-1 font-semibold">{path.title}</h3>
					{#if activeWeek}
						<p class="text-sm text-base-content/70">
							Week {activeWeek.weekNumber}: {activeWeek.theme}
						</p>
					{:else}
						<p class="text-sm text-base-content/70">No active week</p>
					{/if}
				</div>
				<div class="badge badge-secondary badge-outline">
					{readyOptions}/{totalOptions} ready
				</div>
			</div>

			{#if activeWeek && activeWeek.seeds.length > 0}
				{#if hasReadyScenarios}
					<!-- Show ready scenarios -->
					<div class="mt-3 space-y-2">
						{#each activeWeek.seeds.filter((s) => s.isReady).slice(0, 3) as option}
							<button
								class="btn btn-sm btn-outline btn-primary w-full justify-start gap-2"
								onclick={() => option.scenarioId && onStartConversation?.(option.scenarioId)}
							>
								<span class="badge badge-xs badge-primary">
									{option.optionNumber}
								</span>
								<span class="line-clamp-1 flex-1 text-left">{option.title}</span>
							</button>
						{/each}
						{#if activeWeek.seeds.filter((s) => s.isReady).length > 3}
							<p class="text-center text-xs text-base-content/60">
								+{activeWeek.seeds.filter((s) => s.isReady).length - 3} more ready
							</p>
						{/if}
					</div>
				{/if}

				{#if needsGeneration && !isGenerating}
					<!-- Generate button for remaining scenarios -->
					<button class="btn btn-secondary btn-sm mt-3 w-full gap-2" onclick={generateScenarios}>
						<span class="icon-[mdi--sparkles] h-4 w-4"></span>
						Generate {totalOptions - readyOptions} Scenario{totalOptions - readyOptions > 1
							? 's'
							: ''}
					</button>
				{/if}

				{#if isGenerating}
					<div class="mt-3 flex items-center gap-2 text-sm text-secondary">
						<span class="loading loading-spinner loading-sm"></span>
						<span>Generating scenarios...</span>
					</div>
				{/if}
			{:else}
				<!-- No seeds yet - show generate button -->
				<button
					class="btn btn-secondary btn-sm mt-3 w-full gap-2"
					onclick={generateScenarios}
					disabled={isGenerating}
				>
					{#if isGenerating}
						<span class="loading loading-spinner loading-sm"></span>
						Generating...
					{:else}
						<span class="icon-[mdi--sparkles] h-4 w-4"></span>
						Generate Scenarios
					{/if}
				</button>
			{/if}

			{#if generationError}
				<p class="mt-2 text-xs text-error">{generationError}</p>
			{/if}
		</div>
	</div>
{:else}
	<!-- Full view -->
	<div class="card bg-base-200 shadow-lg">
		<div class="card-body">
			<div class="flex items-start justify-between">
				<div>
					<h2 class="card-title">{path.title}</h2>
					<p class="mt-1 text-base-content/70">{path.description}</p>
				</div>
				{#if activeWeek}
					<div class="badge badge-lg badge-secondary">Week {activeWeek.weekNumber}</div>
				{/if}
			</div>

			{#if activeWeek}
				<!-- Week theme -->
				<div class="mt-4 rounded-lg bg-base-300 p-4">
					<h3 class="font-semibold">{activeWeek.theme}</h3>
					<p class="mt-1 text-sm text-base-content/70">{activeWeek.themeDescription}</p>
				</div>

				<!-- Progress indicator -->
				<div class="mt-4 flex items-center gap-3">
					<progress
						class="progress w-full progress-secondary"
						value={readyOptions}
						max={totalOptions}
					></progress>
					<span class="whitespace-nowrap text-sm text-base-content/60">
						{readyOptions}/{totalOptions} ready
					</span>
				</div>

				<!-- Conversation options -->
				<div class="divider">Choose a Conversation</div>

				{#if activeWeek.seeds.length > 0}
					{#if hasReadyScenarios}
						<!-- Show ready scenarios as clickable -->
						<div class="grid gap-3 sm:grid-cols-2">
							{#each activeWeek.seeds as option}
								{#if option.isReady}
									<button
										class="btn btn-outline btn-primary h-auto min-h-[4rem] flex-col items-start gap-1 p-4 text-left"
										onclick={() => option.scenarioId && onStartConversation?.(option.scenarioId)}
									>
										<div class="flex w-full items-center gap-2">
											<span class="badge badge-primary">Option {option.optionNumber}</span>
										</div>
										<span class="text-base font-medium">{option.title}</span>
										<span class="line-clamp-2 text-xs opacity-70">{option.description}</span>
									</button>
								{:else}
									<!-- Show pending scenarios as disabled cards -->
									<div
										class="flex h-auto min-h-[4rem] flex-col items-start gap-1 rounded-lg bg-base-300 p-4 opacity-60"
									>
										<div class="flex w-full items-center gap-2">
											<span class="badge badge-ghost">Option {option.optionNumber}</span>
											<span class="text-xs text-base-content/50">Not generated</span>
										</div>
										<span class="text-base font-medium">{option.title}</span>
										<span class="line-clamp-2 text-xs opacity-70">{option.description}</span>
									</div>
								{/if}
							{/each}
						</div>
					{:else}
						<!-- No scenarios ready yet - show preview cards -->
						<div class="grid gap-3 sm:grid-cols-2">
							{#each activeWeek.seeds as option}
								<div
									class="flex h-auto min-h-[4rem] flex-col items-start gap-1 rounded-lg bg-base-300 p-4 opacity-60"
								>
									<div class="flex w-full items-center gap-2">
										<span class="badge badge-ghost">Option {option.optionNumber}</span>
									</div>
									<span class="text-base font-medium">{option.title}</span>
									<span class="line-clamp-2 text-xs opacity-70">{option.description}</span>
								</div>
							{/each}
						</div>
					{/if}

					<!-- Generate button -->
					{#if needsGeneration}
						<div class="mt-6 flex flex-col items-center gap-3">
							{#if isGenerating}
								<div class="flex flex-col items-center gap-2">
									<span class="loading loading-spinner loading-lg text-secondary"></span>
									<p class="text-base-content/70">
										Generating your personalized scenarios...
									</p>
									<p class="text-sm text-base-content/50">
										This usually takes 30-60 seconds
									</p>
								</div>
							{:else}
								<button class="btn btn-secondary btn-lg gap-2" onclick={generateScenarios}>
									<span class="icon-[mdi--sparkles] h-5 w-5"></span>
									Generate {totalOptions - readyOptions} Scenario{totalOptions - readyOptions > 1
										? 's'
										: ''}
								</button>
								<p class="text-sm text-base-content/50">
									Click to create personalized practice scenarios for this week
								</p>
							{/if}

							{#if generationError}
								<div class="alert alert-error mt-2">
									<span class="icon-[mdi--alert-circle] h-5 w-5"></span>
									<span>{generationError}</span>
								</div>
							{/if}
						</div>
					{/if}
				{:else}
					<!-- No seeds at all -->
					<div class="flex flex-col items-center justify-center py-8 text-center">
						<span class="icon-[mdi--chat-question] h-12 w-12 text-base-content/30"></span>
						<p class="mt-4 text-base-content/60">No conversation options set up yet</p>
						<p class="text-sm text-base-content/40">Please contact support if this persists</p>
					</div>
				{/if}
			{:else}
				<div class="mt-4 flex flex-col items-center justify-center py-8 text-center">
					<span class="icon-[mdi--calendar-clock] h-12 w-12 text-base-content/30"></span>
					<p class="mt-4 text-base-content/60">No active week found</p>
					<p class="text-sm text-base-content/40">Please contact support if this persists</p>
				</div>
			{/if}

			<!-- Quick info -->
			<div class="mt-4 flex flex-wrap gap-2">
				<span class="badge badge-outline gap-1">
					<span class="icon-[mdi--translate] h-4 w-4"></span>
					{path.targetLanguage.toUpperCase()}
				</span>
				<span class="badge badge-outline gap-1">
					<span class="icon-[mdi--clock-outline] h-4 w-4"></span>
					{path.durationWeeks || 4} weeks
				</span>
				<span class="badge badge-outline gap-1">
					<span class="icon-[mdi--shuffle-variant] h-4 w-4"></span>
					Flexible order
				</span>
			</div>
		</div>
	</div>
{/if}

<style>
	.line-clamp-1 {
		display: -webkit-box;
		-webkit-line-clamp: 1;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
