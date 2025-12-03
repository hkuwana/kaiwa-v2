<script lang="ts">
	/**
	 * AdaptivePathOptions - Shows conversation options for adaptive learning paths
	 *
	 * Features:
	 * - Auto-generates scenarios when user lands on dashboard with pending seeds
	 * - Shows real-time generation progress
	 * - Handles failures with retry capability
	 * - Never gets stuck in "Generating..." state
	 */

	import { onMount, onDestroy } from 'svelte';
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

	interface GenerationStatus {
		totalReady: number;
		totalPending: number;
		totalFailed: number;
		totalGenerating: number;
		isComplete: boolean;
		needsGeneration: boolean;
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

	// Generation state
	let isGenerating = $state(false);
	let generationStatus = $state<GenerationStatus | null>(null);
	let currentlyGenerating = $state<string | null>(null); // seedId being generated
	let generationError = $state<string | null>(null);
	let hasTriedAutoGenerate = $state(false);
	let pollInterval: ReturnType<typeof setInterval> | null = null;

	// Derived state
	const hasReadyScenarios = $derived(readyOptions > 0);
	const allReady = $derived(readyOptions === totalOptions && totalOptions > 0);
	const needsGeneration = $derived(totalOptions > 0 && readyOptions < totalOptions);
	const hasFailed = $derived(generationStatus?.totalFailed ?? 0 > 0);

	// Progress calculation
	const progressPercent = $derived(
		totalOptions > 0 ? Math.round((readyOptions / totalOptions) * 100) : 0
	);

	// Fetch current generation status
	async function fetchStatus(): Promise<GenerationStatus | null> {
		try {
			const response = await fetch(`/api/learning-paths/${path.id}/generation-status`);
			const result = await response.json();

			if (result.success && result.data) {
				return {
					totalReady: result.data.totalReady,
					totalPending: result.data.totalPending,
					totalFailed: result.data.totalFailed,
					totalGenerating: result.data.totalGenerating,
					isComplete: result.data.isComplete,
					needsGeneration: result.data.needsGeneration
				};
			}
			return null;
		} catch (error) {
			console.error('Error fetching status:', error);
			return null;
		}
	}

	// Generate next pending scenario
	async function generateNext(resetFailed = false): Promise<boolean> {
		try {
			const response = await fetch(`/api/learning-paths/${path.id}/generation-status`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					weekId: activeWeek?.id,
					resetFailed
				})
			});

			const result = await response.json();

			if (!response.ok || !result.success) {
				throw new Error(result.error || 'Generation failed');
			}

			// Update status from response
			if (result.data?.currentStatus) {
				generationStatus = {
					totalReady: result.data.currentStatus.readyCount,
					totalPending: result.data.currentStatus.pendingCount,
					totalFailed: result.data.currentStatus.failedCount,
					totalGenerating: result.data.currentStatus.generatingCount,
					isComplete: result.data.currentStatus.isComplete,
					needsGeneration: result.data.currentStatus.pendingCount > 0
				};
			}

			return result.data?.shouldContinue ?? false;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			generationError = errorMessage;
			console.error('Generation error:', error);
			return false;
		}
	}

	// Main generation loop
	async function startGeneration(resetFailed = false) {
		if (isGenerating) return;

		isGenerating = true;
		generationError = null;

		try {
			let shouldContinue = true;
			let attempts = 0;
			const maxAttempts = 20; // Safety limit

			while (shouldContinue && attempts < maxAttempts) {
				attempts++;
				shouldContinue = await generateNext(resetFailed && attempts === 1);

				// Small delay between requests
				if (shouldContinue) {
					await new Promise(resolve => setTimeout(resolve, 500));
				}
			}

			// Notify parent and refresh if we generated anything
			onScenariosGenerated?.();

			// Final status check
			const finalStatus = await fetchStatus();
			if (finalStatus) {
				generationStatus = finalStatus;
			}

			// Reload to get fresh data if we're done
			if (!shouldContinue || attempts >= maxAttempts) {
				window.location.reload();
			}
		} catch (error) {
			generationError = error instanceof Error ? error.message : 'Generation failed';
			console.error('Generation loop error:', error);
		} finally {
			isGenerating = false;
		}
	}

	// Retry failed scenarios
	async function retryFailed() {
		await startGeneration(true);
	}

	// Check status on mount (but DON'T auto-generate - let user trigger it manually)
	onMount(async () => {
		// Check status first
		const status = await fetchStatus();
		generationStatus = status;

		// Note: We no longer auto-generate scenarios on dashboard mount.
		// This was causing issues with:
		// - Multiple page loads triggering multiple generation attempts
		// - Silent failures leaving dashboard in "Generating..." state
		// - No user control over when generation happens
		//
		// Instead, the user must click "Generate Scenarios" button manually,
		// or the admin can generate scenarios after assignment.
	});

	onDestroy(() => {
		if (pollInterval) {
			clearInterval(pollInterval);
		}
	});
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
				{#if isGenerating}
					<!-- Generation in progress -->
					<div class="mt-3">
						<div class="flex items-center gap-2 text-sm text-secondary">
							<span class="loading loading-spinner loading-sm"></span>
							<span>
								Generating scenarios...
								{#if generationStatus}
									({generationStatus.totalReady}/{totalOptions})
								{/if}
							</span>
						</div>
						<progress
							class="progress progress-secondary mt-2 w-full"
							value={generationStatus?.totalReady ?? readyOptions}
							max={totalOptions}
						></progress>
					</div>
				{:else if hasReadyScenarios}
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

					{#if needsGeneration}
						<!-- Generate remaining -->
						<button
							class="btn btn-secondary btn-sm mt-3 w-full gap-2"
							onclick={() => startGeneration()}
							disabled={isGenerating}
						>
							<span class="icon-[mdi--sparkles] h-4 w-4"></span>
							Generate {totalOptions - readyOptions} More
						</button>
					{/if}
				{:else if hasFailed}
					<!-- All failed - show retry -->
					<div class="mt-3">
						<div class="alert alert-warning py-2 text-sm">
							<span class="icon-[mdi--alert] h-4 w-4"></span>
							<span>Some scenarios failed to generate</span>
						</div>
						<button
							class="btn btn-warning btn-sm mt-2 w-full gap-2"
							onclick={retryFailed}
							disabled={isGenerating}
						>
							<span class="icon-[mdi--refresh] h-4 w-4"></span>
							Retry Generation
						</button>
					</div>
				{:else}
					<!-- Nothing ready yet - show clear message and generate button -->
					<div class="mt-3 rounded-lg bg-base-300 p-3 text-center">
						<span class="icon-[mdi--information-outline] h-5 w-5 text-base-content/60"></span>
						<p class="mt-1 text-sm text-base-content/70">
							Scenarios haven't been generated yet
						</p>
						<button
							class="btn btn-secondary btn-sm mt-2 w-full gap-2"
							onclick={() => startGeneration()}
							disabled={isGenerating}
						>
							<span class="icon-[mdi--sparkles] h-4 w-4"></span>
							Generate Scenarios
						</button>
					</div>
				{/if}
			{:else}
				<!-- No seeds yet -->
				<p class="mt-3 text-center text-sm text-base-content/60">
					No conversation options available
				</p>
			{/if}

			{#if generationError && !isGenerating}
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
						value={generationStatus?.totalReady ?? readyOptions}
						max={totalOptions}
					></progress>
					<span class="whitespace-nowrap text-sm text-base-content/60">
						{generationStatus?.totalReady ?? readyOptions}/{totalOptions} ready
					</span>
				</div>

				<!-- Generation status banner -->
				{#if isGenerating}
					<div class="alert alert-info mt-4">
						<span class="loading loading-spinner loading-sm"></span>
						<div>
							<h4 class="font-medium">Generating your scenarios...</h4>
							<p class="text-sm opacity-80">
								This usually takes about 30 seconds per scenario. You can leave this page and come back.
							</p>
						</div>
					</div>
				{:else if hasFailed && !allReady}
					<div class="alert alert-warning mt-4">
						<span class="icon-[mdi--alert-circle] h-5 w-5"></span>
						<div>
							<h4 class="font-medium">Some scenarios couldn't be generated</h4>
							<p class="text-sm opacity-80">
								{generationStatus?.totalFailed} scenario(s) failed. You can retry or continue with the available ones.
							</p>
						</div>
						<button class="btn btn-sm btn-warning" onclick={retryFailed}>
							<span class="icon-[mdi--refresh] h-4 w-4"></span>
							Retry
						</button>
					</div>
				{/if}

				<!-- Conversation options -->
				<div class="divider">Choose a Conversation</div>

				{#if activeWeek.seeds.length > 0}
					<div class="grid gap-3 sm:grid-cols-2">
						{#each activeWeek.seeds as option}
							{#if option.isReady}
								<button
									class="btn btn-outline btn-primary h-auto min-h-[4rem] flex-col items-start gap-1 p-4 text-left"
									onclick={() => option.scenarioId && onStartConversation?.(option.scenarioId)}
								>
									<div class="flex w-full items-center gap-2">
										<span class="badge badge-primary">Option {option.optionNumber}</span>
										<span class="icon-[mdi--check-circle] h-4 w-4 text-success"></span>
									</div>
									<span class="text-base font-medium">{option.title}</span>
									<span class="line-clamp-2 text-xs opacity-70">{option.description}</span>
								</button>
							{:else}
								<!-- Pending/generating scenario card -->
								<div
									class="flex h-auto min-h-[4rem] flex-col items-start gap-1 rounded-lg bg-base-300 p-4 opacity-60"
								>
									<div class="flex w-full items-center gap-2">
										<span class="badge badge-ghost">Option {option.optionNumber}</span>
										{#if isGenerating}
											<span class="loading loading-spinner loading-xs"></span>
										{:else}
											<span class="text-xs text-base-content/50">Pending</span>
										{/if}
									</div>
									<span class="text-base font-medium">{option.title}</span>
									<span class="line-clamp-2 text-xs opacity-70">{option.description}</span>
								</div>
							{/if}
						{/each}
					</div>

					<!-- Generate button -->
					{#if needsGeneration && !isGenerating}
						<div class="mt-6 flex flex-col items-center gap-3">
							<button class="btn btn-secondary btn-lg gap-2" onclick={() => startGeneration()}>
								<span class="icon-[mdi--sparkles] h-5 w-5"></span>
								Generate {totalOptions - readyOptions} Scenario{totalOptions - readyOptions > 1
									? 's'
									: ''}
							</button>
							<p class="text-sm text-base-content/50">
								Click to create personalized practice scenarios
							</p>
						</div>
					{/if}

					{#if generationError && !isGenerating}
						<div class="alert alert-error mt-4">
							<span class="icon-[mdi--alert-circle] h-5 w-5"></span>
							<span>{generationError}</span>
							<button class="btn btn-sm btn-ghost" onclick={() => startGeneration()}>
								Try Again
							</button>
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
