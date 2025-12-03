<script lang="ts">
	/**
	 * Learning Path Page
	 *
	 * Shows a specific learning path with:
	 * - Path details and description
	 * - Progress tracking (if assigned)
	 * - Calendar view of all days
	 * - Quick access to start today's lesson
	 */

	import { goto, invalidateAll } from '$app/navigation';

	const { data } = $props();

	// Generation state
	let isGenerating = $state(false);
	let generationError = $state<string | null>(null);

	// Derived state
	const canStartToday = $derived(
		data.isAssigned && data.progress.currentDay?.isReady && data.progress.currentDay?.scenarioId
	);

	const daysRemaining = $derived(data.progress.totalDays - data.progress.daysCompleted);
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

	/**
	 * Generate scenario for the current day
	 */
	async function handleGenerateScenario() {
		if (isGenerating || !data.progress.currentDay) return;

		isGenerating = true;
		generationError = null;

		try {
			const response = await fetch(`/api/learning-paths/${data.path.id}/generate-day`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					dayIndex: data.progress.currentDay.dayIndex
				})
			});

			const result = await response.json();

			if (result.success && result.data?.generated) {
				// Refresh the page data to show the new scenario
				await invalidateAll();
			} else {
				generationError = result.data?.error || result.error || 'Failed to generate scenario';
			}
		} catch (error) {
			generationError = error instanceof Error ? error.message : 'Generation failed';
		} finally {
			isGenerating = false;
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
		{#if data.isLoggedIn}
			<a href="/dashboard" class="btn gap-2 btn-ghost btn-sm">
				<span class="icon-[mdi--arrow-left] h-4 w-4"></span>
				Back to Dashboard
			</a>
		{:else}
			<a href="/" class="btn gap-2 btn-ghost btn-sm">
				<span class="icon-[mdi--arrow-left] h-4 w-4"></span>
				Back to Home
			</a>
		{/if}
	</div>

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
							<div class="flex flex-col items-end gap-2">
								<button
									class="btn gap-2 btn-secondary"
									onclick={handleGenerateScenario}
									disabled={isGenerating}
								>
									{#if isGenerating}
										<span class="loading loading-sm loading-spinner"></span>
										Generating...
									{:else}
										<span class="icon-[mdi--sparkles] h-5 w-5"></span>
										Generate Scenario
									{/if}
								</button>
								{#if generationError}
									<p class="text-xs text-error">{generationError}</p>
								{:else}
									<p class="text-xs text-base-content/50">Lesson not ready yet</p>
								{/if}
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
	{:else if data.isLoggedIn}
		<!-- Logged in but not assigned - show enrollment CTA -->
		<div class="mb-8 rounded-2xl bg-base-200 p-6 text-center">
			<span class="icon-[mdi--bookmark-plus-outline] h-12 w-12 text-base-content/30"></span>
			<h2 class="mt-4 text-xl font-semibold">This path isn't on your dashboard yet</h2>
			<p class="mt-2 text-base-content/70">
				Want to learn with this program? Add it to your dashboard to get started.
			</p>
			<div class="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
				{#if data.path.isPublic && data.path.shareSlug}
					<a href="/program/{data.path.shareSlug}" class="btn gap-2 btn-primary">
						<span class="icon-[mdi--plus] h-5 w-5"></span>
						Add to Dashboard
					</a>
				{/if}
				<a href="/dashboard" class="btn gap-2 btn-ghost">
					<span class="icon-[mdi--view-dashboard-outline] h-5 w-5"></span>
					Check Dashboard
				</a>
			</div>
		</div>
	{:else}
		<!-- Not logged in - show sign in CTA -->
		<div class="mb-8 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 p-6 text-center">
			<span class="icon-[mdi--account-circle-outline] h-12 w-12 text-primary/50"></span>
			<h2 class="mt-4 text-xl font-semibold">Sign in to start learning</h2>
			<p class="mt-2 text-base-content/70">
				Create an account or sign in to add this learning path to your dashboard and track your
				progress.
			</p>
			<div class="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
				<a href="/auth?redirect=/path/{data.path.id}" class="btn gap-2 btn-primary">
					<span class="icon-[mdi--login] h-5 w-5"></span>
					Sign In to Start
				</a>
				{#if data.path.isPublic && data.path.shareSlug}
					<a href="/program/{data.path.shareSlug}" class="btn gap-2 btn-ghost">
						<span class="icon-[mdi--information-outline] h-5 w-5"></span>
						Learn More
					</a>
				{/if}
			</div>
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
</div>
