<script lang="ts">
	/**
	 * Learning Path Page
	 *
	 * Shows a specific learning path with:
	 * - Classic mode: Calendar view of all days with rigid schedule
	 * - Adaptive mode: Flexible weekly dashboard with session types
	 */

	import { goto } from '$app/navigation';
	import WeekDashboard from '$lib/features/learning-path/components/WeekDashboard.svelte';

	const { data } = $props();

	// Check if this is an adaptive path
	const isAdaptive = $derived(data.mode === 'adaptive');

	// Derived state
	const canStartToday = $derived(
		data.isAssigned && data.progress.currentDay?.isReady && data.progress.currentDay?.scenarioId
	);

	const daysRemaining = $derived(data.progress.totalDays - data.progress.daysCompleted);
	const weeks = $derived(Math.ceil(data.progress.totalDays / 7));

	const weeks = $derived(Math.ceil(data.progress.totalDays / 7));

	// Navigation handlers
	function handleStartLesson() {
		if (data.progress.currentDay?.scenarioId) {
			goto(`/conversation?scenario=${data.progress.currentDay.scenarioId}`);
		}
	}

	function handleDayClick(day: { scenarioId?: string | null; dayIndex: number }) {
		// Only allow clicking on completed days or current day with scenario ready
		if (day.scenarioId && day.dayIndex <= data.progress.daysCompleted + 1) {
			goto(`/conversation?scenario=${day.scenarioId}`);
		}
	}

	// Helpers
	function getDifficultyBadgeClass(difficulty: string): string {
		const level = difficulty?.toUpperCase() || '';
		if (level.startsWith('A1')) return 'badge-success';
		if (level.startsWith('A2')) return 'badge-info';
		if (level.startsWith('B1')) return 'badge-warning';
		if (level.startsWith('B2')) return 'badge-error';
		return 'badge-neutral';
	}

	function getWeekNumber(dayIndex: number): number {
		return Math.ceil(dayIndex / 7);
	}

	function getDayOfWeek(dayIndex: number): string {
		const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
		return days[(dayIndex - 1) % 7];
	}

	function getDayStatus(day: {
		dayIndex: number;
		scenarioId?: string | null;
	}): 'completed' | 'current' | 'upcoming' | 'locked' {
		if (day.dayIndex < data.progress.daysCompleted + 1) return 'completed';
		if (day.dayIndex === data.progress.daysCompleted + 1) return 'current';
		if (day.scenarioId) return 'upcoming';
		return 'locked';
	}
</script>

<svelte:head>
	<title>{data.path.title} | Kaiwa</title>
	<meta name="description" content={data.path.description || 'Your personalized learning path'} />
</svelte:head>

<div class="container mx-auto max-w-6xl px-4 py-6">
	<!-- Back navigation -->
	<div class="mb-4">
		<a href="/dashboard" class="btn gap-2 btn-ghost btn-sm">
			<span class="icon-[mdi--arrow-left] h-4 w-4"></span>
			Back to Dashboard
		</a>
	</div>

	{#if isAdaptive}
		<!-- ========================================================================== -->
		<!-- ADAPTIVE MODE: Week Dashboard -->
		<!-- ========================================================================== -->
		<WeekDashboard
			pathId={data.path.id}
			week={data.week}
			progress={data.progress}
			sessionTypes={data.sessionTypes}
		/>
	{:else}
		<!-- ========================================================================== -->
		<!-- CLASSIC MODE: Traditional Calendar View -->
		<!-- ========================================================================== -->

		<!-- Header -->
		<div class="mb-8">
			<div class="flex items-start justify-between gap-4">
				<div class="flex-1">
					<div class="flex items-center gap-3">
						<h1 class="text-3xl font-bold">{data.path.title}</h1>
						{#if data.path.status === 'draft'}
							<span class="badge badge-warning">Draft</span>
						{:else if data.path.status === 'active'}
							<span class="badge badge-success">Active</span>
						{/if}
					</div>
					<p class="mt-2 text-base-content/70">{data.path.description}</p>
					<div class="mt-3 flex flex-wrap gap-2">
						<span class="badge badge-outline">{data.path.targetLanguage?.toUpperCase()}</span>
						<span class="badge badge-outline">{data.progress.totalDays} days</span>
						{#if data.path.estimatedMinutesPerDay}
							<span class="badge badge-outline">{data.path.estimatedMinutesPerDay} min/day</span>
						{/if}
						{#if data.path.category}
							<span class="badge badge-outline">{data.path.category}</span>
						{/if}
					</div>
				</div>

				<!-- Progress circle (if assigned) -->
				{#if data.isAssigned}
					<div class="text-center">
						<div
							class="radial-progress text-primary"
							style="--value:{data.progress.progressPercent}; --size:5rem; --thickness:5px;"
						>
							<span class="text-lg font-bold">{data.progress.progressPercent}%</span>
						</div>
						<p class="mt-1 text-sm text-base-content/60">{daysRemaining} days left</p>
					</div>
				{/if}
			</div>
		</div>

	{#if data.isAssigned}
		<!-- Progress stats -->
		<div class="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
			<div class="rounded-xl bg-base-200 p-4 text-center">
				<p class="text-3xl font-bold text-primary">{data.progress.daysCompleted}</p>
				<p class="text-sm text-base-content/60">Days Completed</p>
			</div>
			<div class="rounded-xl bg-base-200 p-4 text-center">
				<p class="text-3xl font-bold text-secondary">{daysRemaining}</p>
				<p class="text-sm text-base-content/60">Days Remaining</p>
			</div>
			<div class="rounded-xl bg-base-200 p-4 text-center">
				<p class="text-3xl font-bold text-accent">{data.progress.totalDays}</p>
				<p class="text-sm text-base-content/60">Total Days</p>
			</div>
			<div class="rounded-xl bg-base-200 p-4 text-center">
				<p class="text-3xl font-bold text-info">{data.progress.progressPercent}%</p>
				<p class="text-sm text-base-content/60">Progress</p>
			</div>
		</div>

		<!-- Today's Lesson CTA -->
		{#if data.progress.currentDay}
			<div
				class="mb-8 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5 p-6"
			>
				<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<p class="text-sm font-medium text-primary">
							Today's Lesson - Day {data.progress.currentDay.dayIndex}
						</p>
						<h2 class="mt-1 text-xl font-semibold">{data.progress.currentDay.theme}</h2>
						<div class="mt-2 flex items-center gap-2">
							<span class="badge {getDifficultyBadgeClass(data.progress.currentDay.difficulty)}">
								{data.progress.currentDay.difficulty}
							</span>
						</div>
						{#if data.progress.currentDay.description}
							<p class="mt-3 text-sm text-base-content/70">
								{data.progress.currentDay.description}
							</p>
						{/if}
					</div>
					<div class="flex-shrink-0">
						{#if canStartToday}
							<button class="btn btn-lg btn-primary" onclick={handleStartLesson}>
								<span class="icon-[mdi--play-circle] h-6 w-6"></span>
								Start Lesson
							</button>
						{:else if !data.progress.currentDay.isReady}
							<div class="flex items-center gap-2 rounded-lg bg-base-200 px-4 py-3">
								<span class="loading loading-sm loading-spinner text-primary"></span>
								<span class="text-sm text-base-content/70">Preparing lesson...</span>
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}

		<!-- Next Day Preview -->
		{#if data.progress.nextDay}
			<div class="mb-8 rounded-lg border border-base-300 p-4">
				<p class="text-xs font-medium text-base-content/50 uppercase">Coming Tomorrow</p>
				<div class="mt-2 flex items-center gap-2">
					<span class="badge badge-outline badge-sm">{data.progress.nextDay.difficulty}</span>
					<span class="font-medium">{data.progress.nextDay.theme}</span>
				</div>
			</div>
		{/if}
	{:else}
		<!-- Not assigned - show enrollment CTA -->
		<div class="mb-8 rounded-2xl bg-base-200 p-6 text-center">
			<h2 class="text-xl font-semibold">You're not enrolled in this path</h2>
			<p class="mt-2 text-base-content/70">This learning path hasn't been assigned to you yet.</p>
			{#if data.path.isPublic && data.path.shareSlug}
				<a href="/program/{data.path.shareSlug}" class="btn mt-4 btn-primary">
					View Public Program
				</a>
			{:else}
				<a href="/dashboard" class="btn mt-4 btn-ghost"> Return to Dashboard </a>
			{/if}
		</div>
	{/if}

	<!-- Full Calendar View -->
	<div class="rounded-2xl bg-base-200 p-6">
		<h2 class="mb-6 text-xl font-semibold">Your Learning Journey</h2>

		<div class="grid gap-6 lg:grid-cols-4">
			{#each Array.from({ length: weeks }, (_, i) => i + 1) as week}
				{@const weekLabel =
					week === 1
						? 'Foundation'
						: week === 2
							? 'Building'
							: week === 3
								? 'Practicing'
								: 'Mastering'}
				<div class="rounded-xl bg-base-100 p-4">
					<h3 class="mb-1 font-semibold">Week {week}</h3>
					<p class="mb-3 text-xs text-base-content/60">{weekLabel}</p>
					<div class="space-y-2">
						{#each (data.path.schedule || []).filter((d) => getWeekNumber(d.dayIndex) === week) as day}
							{@const status = getDayStatus(day)}
							<button
								class="w-full rounded-lg p-3 text-left transition
									{status === 'completed' ? 'bg-success/10 hover:bg-success/20' : ''}
									{status === 'current' ? 'bg-primary/10 ring-2 ring-primary/50 hover:bg-primary/20' : ''}
									{status === 'upcoming' ? 'bg-base-200 hover:bg-base-300' : ''}
									{status === 'locked' ? 'cursor-not-allowed bg-base-200 opacity-50' : ''}"
								onclick={() => handleDayClick(day)}
								disabled={status === 'locked'}
							>
								<div class="flex items-center justify-between">
									<span class="text-xs font-medium text-base-content/60">
										Day {day.dayIndex} - {getDayOfWeek(day.dayIndex)}
									</span>
									{#if status === 'completed'}
										<span class="icon-[mdi--check-circle] h-4 w-4 text-success"></span>
									{:else if status === 'current'}
										<span class="icon-[mdi--play-circle] h-4 w-4 text-primary"></span>
									{:else if status === 'locked'}
										<span class="icon-[mdi--lock] h-4 w-4 text-base-content/40"></span>
									{/if}
								</div>
								<p class="mt-1 line-clamp-2 text-sm">{day.theme || 'Scenario TBD'}</p>
								{#if day.difficulty}
									<span class="mt-1 badge badge-xs {getDifficultyBadgeClass(day.difficulty)}">
										{day.difficulty}
									</span>
								{/if}
							</button>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>
	{/if}
	<!-- End Classic Mode -->
</div>
