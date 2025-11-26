<script lang="ts">
	/**
	 * LearningPathProgress - Shows progress for a user's active learning path
	 * Displays current day, progress bar, and next lesson info
	 */

	import type { UserLearningPath } from '../stores/learning-path.store.svelte';

	interface Props {
		path: UserLearningPath;
		compact?: boolean;
		onStartLesson?: (scenarioId: string) => void;
	}

	const { path, compact = false, onStartLesson }: Props = $props();

	// Calculate days remaining
	const daysRemaining = $derived(path.totalDays - path.daysCompleted);

	// Check if current day's scenario is ready
	const canStartToday = $derived(path.currentDay?.isReady && path.currentDay?.scenarioId);

	// Format the schedule entry for display
	function getDifficultyBadgeClass(difficulty: string): string {
		const level = difficulty.toUpperCase();
		if (level.startsWith('A1')) return 'badge-success';
		if (level.startsWith('A2')) return 'badge-info';
		if (level.startsWith('B1')) return 'badge-warning';
		if (level.startsWith('B2')) return 'badge-error';
		return 'badge-neutral';
	}
</script>

{#if compact}
	<!-- Compact view for dashboard widgets -->
	<div class="card bg-base-200 shadow-sm">
		<div class="card-body p-4">
			<div class="flex items-start justify-between gap-3">
				<div class="flex-1">
					<h3 class="line-clamp-1 font-semibold">{path.path.title}</h3>
					<p class="text-sm text-base-content/70">
						Day {path.daysCompleted + 1} of {path.totalDays}
					</p>
				</div>
				<div class="radial-progress text-primary text-sm" style="--value:{path.progressPercent}; --size:3rem;">
					{path.progressPercent}%
				</div>
			</div>

			{#if path.currentDay}
				<div class="mt-2 rounded-lg bg-base-300 p-3">
					<div class="flex items-center gap-2">
						<span class="badge {getDifficultyBadgeClass(path.currentDay.difficulty)} badge-sm">
							{path.currentDay.difficulty}
						</span>
						<span class="text-sm font-medium">{path.currentDay.theme}</span>
					</div>
					{#if canStartToday && onStartLesson}
						<button
							class="btn btn-primary btn-sm mt-2 w-full"
							onclick={() => onStartLesson(path.currentDay!.scenarioId!)}
						>
							Start Today's Lesson
						</button>
					{:else if !path.currentDay.isReady}
						<div class="mt-2 flex items-center gap-2 text-sm text-base-content/60">
							<span class="loading loading-spinner loading-xs"></span>
							Preparing lesson...
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
{:else}
	<!-- Full view for dedicated page -->
	<div class="card bg-base-200 shadow-lg">
		<div class="card-body">
			<div class="flex items-start justify-between">
				<div>
					<h2 class="card-title">{path.path.title}</h2>
					<p class="mt-1 text-base-content/70">{path.path.description}</p>
				</div>
				<div class="text-right">
					<div class="radial-progress text-primary" style="--value:{path.progressPercent}; --size:4rem; --thickness:4px;">
						{path.progressPercent}%
					</div>
					<p class="mt-1 text-sm text-base-content/60">{daysRemaining} days left</p>
				</div>
			</div>

			<!-- Progress bar -->
			<div class="mt-4">
				<progress class="progress progress-primary w-full" value={path.daysCompleted} max={path.totalDays}></progress>
				<div class="mt-1 flex justify-between text-xs text-base-content/60">
					<span>Day {path.daysCompleted + 1}</span>
					<span>{path.totalDays} days total</span>
				</div>
			</div>

			<!-- Current day info -->
			{#if path.currentDay}
				<div class="divider">Today's Lesson</div>
				<div class="rounded-xl bg-base-300 p-4">
					<div class="flex items-start justify-between">
						<div>
							<span class="badge {getDifficultyBadgeClass(path.currentDay.difficulty)} mb-2">
								{path.currentDay.difficulty}
							</span>
							<h3 class="text-lg font-semibold">{path.currentDay.theme}</h3>
							<p class="mt-1 text-sm text-base-content/70">Day {path.currentDay.dayIndex} of {path.totalDays}</p>
						</div>
						{#if canStartToday && onStartLesson}
							<button
								class="btn btn-primary"
								onclick={() => onStartLesson(path.currentDay!.scenarioId!)}
							>
								Start Lesson
							</button>
						{:else if !path.currentDay.isReady}
							<div class="flex items-center gap-2 text-base-content/60">
								<span class="loading loading-spinner loading-sm"></span>
								<span>Generating...</span>
							</div>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Next day preview -->
			{#if path.nextDay}
				<div class="mt-4 rounded-lg border border-base-300 p-3">
					<p class="text-xs font-medium uppercase text-base-content/50">Coming Next</p>
					<div class="mt-1 flex items-center gap-2">
						<span class="badge badge-outline badge-sm">{path.nextDay.difficulty}</span>
						<span class="text-sm">{path.nextDay.theme}</span>
					</div>
				</div>
			{/if}

			<!-- Quick stats -->
			<div class="mt-4 grid grid-cols-3 gap-2 text-center">
				<div class="rounded-lg bg-base-300 p-2">
					<p class="text-2xl font-bold text-primary">{path.daysCompleted}</p>
					<p class="text-xs text-base-content/60">Completed</p>
				</div>
				<div class="rounded-lg bg-base-300 p-2">
					<p class="text-2xl font-bold text-secondary">{daysRemaining}</p>
					<p class="text-xs text-base-content/60">Remaining</p>
				</div>
				<div class="rounded-lg bg-base-300 p-2">
					<p class="text-2xl font-bold text-accent">{path.totalDays}</p>
					<p class="text-xs text-base-content/60">Total Days</p>
				</div>
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
</style>
