<script lang="ts">
	/**
	 * AdaptivePathOptions - Shows conversation options for adaptive learning paths
	 *
	 * Instead of "Day 1, Day 2...", this shows flexible conversation options
	 * that users can choose in any order they want.
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
	}

	const {
		path,
		assignment,
		activeWeek,
		totalOptions,
		readyOptions,
		compact = false,
		onStartConversation
	}: Props = $props();

	// Check if any scenarios are ready
	const hasReadyScenarios = $derived(readyOptions > 0);
	const allReady = $derived(readyOptions === totalOptions && totalOptions > 0);
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
				<div class="mt-3 space-y-2">
					{#each activeWeek.seeds.slice(0, 3) as option}
						<button
							class="btn btn-sm w-full justify-start gap-2 {option.isReady ? 'btn-outline btn-primary' : 'btn-disabled'}"
							disabled={!option.isReady}
							onclick={() => option.scenarioId && onStartConversation?.(option.scenarioId)}
						>
							<span class="badge badge-xs {option.isReady ? 'badge-primary' : 'badge-ghost'}">
								{option.optionNumber}
							</span>
							<span class="line-clamp-1 flex-1 text-left">{option.title}</span>
							{#if !option.isReady}
								<span class="loading loading-spinner loading-xs"></span>
							{/if}
						</button>
					{/each}
					{#if activeWeek.seeds.length > 3}
						<p class="text-center text-xs text-base-content/60">
							+{activeWeek.seeds.length - 3} more options
						</p>
					{/if}
				</div>
			{:else}
				<div class="mt-2 flex items-center gap-2 text-sm text-base-content/60">
					<span class="loading loading-xs loading-spinner"></span>
					Setting up your conversation options...
				</div>
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
					<div class="badge badge-lg badge-secondary">
						Week {activeWeek.weekNumber}
					</div>
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
					<div class="grid gap-3 sm:grid-cols-2">
						{#each activeWeek.seeds as option}
							<button
								class="btn h-auto min-h-[4rem] flex-col items-start gap-1 p-4 text-left {option.isReady ? 'btn-outline btn-primary' : 'btn-disabled bg-base-300'}"
								disabled={!option.isReady}
								onclick={() => option.scenarioId && onStartConversation?.(option.scenarioId)}
							>
								<div class="flex w-full items-center gap-2">
									<span class="badge {option.isReady ? 'badge-primary' : 'badge-ghost'}">
										Option {option.optionNumber}
									</span>
									{#if !option.isReady}
										<span class="loading loading-spinner loading-xs ml-auto"></span>
									{/if}
								</div>
								<span class="text-base font-medium">{option.title}</span>
								<span class="line-clamp-2 text-xs opacity-70">{option.description}</span>
							</button>
						{/each}
					</div>

					{#if !allReady}
						<div class="mt-4 flex items-center justify-center gap-2 text-sm text-base-content/60">
							<span class="loading loading-spinner loading-sm"></span>
							<span>Some scenarios are still being generated...</span>
						</div>
					{/if}
				{:else}
					<div class="flex flex-col items-center justify-center py-8 text-center">
						<span class="loading loading-lg loading-spinner text-secondary"></span>
						<p class="mt-4 text-base-content/60">Setting up your conversation options...</p>
						<p class="text-sm text-base-content/40">This usually takes about 30-60 seconds</p>
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
