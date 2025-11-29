<script lang="ts">
	/**
	 * Dashboard - User's learning hub
	 *
	 * Shows:
	 * - Active learning paths with progress
	 * - Quick access to today's lesson
	 * - Completed paths
	 * - Discover new templates
	 */

	import { goto } from '$app/navigation';
	import LearningPathProgress from '$lib/features/learning-path/components/LearningPathProgress.svelte';
	import SharePathButton from '$lib/features/learning-path/components/SharePathButton.svelte';
	import type { UserLearningPath } from '$lib/features/learning-path/stores/learning-path.store.svelte';
	import type { LearningPath, LearningPathAssignment } from '$lib/server/db/types';

	const { data } = $props();

	// Transform server data to UserLearningPath format
	function toUserLearningPath(item: {
		path: LearningPath;
		assignment: LearningPathAssignment;
		totalDays: number;
		daysCompleted: number;
		progressPercent: number;
	}): UserLearningPath {
		const schedule = item.path.schedule || [];
		const currentDayIndex = Math.min(item.daysCompleted + 1, item.totalDays);
		const currentDaySchedule = schedule.find((s) => s.dayIndex === currentDayIndex);
		const nextDaySchedule = schedule.find((s) => s.dayIndex === currentDayIndex + 1);

		return {
			path: item.path,
			assignment: item.assignment,
			progressPercent: item.progressPercent,
			daysCompleted: item.daysCompleted,
			totalDays: item.totalDays,
			currentDay: currentDaySchedule
				? {
						dayIndex: currentDaySchedule.dayIndex,
						theme: currentDaySchedule.theme,
						difficulty: currentDaySchedule.difficulty,
						scenarioId: currentDaySchedule.scenarioId,
						isReady: !!currentDaySchedule.scenarioId
					}
				: null,
			nextDay: nextDaySchedule
				? {
						dayIndex: nextDaySchedule.dayIndex,
						theme: nextDaySchedule.theme,
						difficulty: nextDaySchedule.difficulty
					}
				: null
		};
	}

	const activePaths = $derived(data.activePaths.map(toUserLearningPath));
	const completedPaths = $derived(data.completedPaths.map(toUserLearningPath));
	const currentPath = $derived(activePaths[0] || null);

	function handleStartLesson(scenarioId: string) {
		goto(`/conversation?scenario=${scenarioId}`);
	}

	function handleEnroll(templateId: string) {
		goto(
			`/program/${data.templates.find((t: LearningPath) => t.id === templateId)?.shareSlug || templateId}`
		);
	}
</script>

<svelte:head>
	<title>Dashboard | Kaiwa</title>
	<meta
		name="description"
		content="Your learning dashboard - track progress and continue your language learning journey"
	/>
</svelte:head>

<div class="container mx-auto max-w-7xl px-4 py-6">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold">Welcome back{data.user?.name ? `, ${data.user.name}` : ''}!</h1>
		<p class="mt-1 text-base-content/70">Continue your language learning journey</p>
	</div>

	{#if data.error}
		<div class="mb-6 alert alert-error">
			<span class="icon-[mdi--alert-circle-outline] h-6 w-6 shrink-0"></span>
			<span>{data.error}</span>
		</div>
	{/if}

	<div class="grid gap-6 lg:grid-cols-3">
		<!-- Main content area -->
		<div class="space-y-6 lg:col-span-2">
			<!-- Current Learning Path -->
			{#if currentPath}
				<div>
					<div class="mb-4 flex items-center justify-between">
						<h2 class="text-xl font-semibold">Current Learning Path</h2>
						<SharePathButton
							pathId={currentPath.path.id}
							pathTitle={currentPath.path.title}
							isTemplate={currentPath.path.isTemplate}
							shareSlug={currentPath.path.shareSlug}
						/>
					</div>
					<LearningPathProgress path={currentPath} onStartLesson={handleStartLesson} />
				</div>
			{:else}
				<!-- No active paths - show CTA -->
				<div class="card bg-linear-to-br from-primary/10 to-secondary/10">
					<div class="card-body text-center">
						<h2 class="card-title justify-center">Start Your Learning Journey</h2>
						<p class="text-base-content/70">
							Choose a learning path below to begin your structured language learning experience.
						</p>
						<div class="mt-4 card-actions justify-center">
							<a href="/scenarios" class="btn btn-primary">Browse Scenarios</a>
						</div>
					</div>
				</div>
			{/if}

			<!-- Other Active Paths -->
			{#if activePaths.length > 1}
				<div>
					<h2 class="mb-4 text-xl font-semibold">Other Active Paths</h2>
					<div class="grid gap-4 sm:grid-cols-2">
						{#each activePaths.slice(1) as path}
							<LearningPathProgress {path} compact onStartLesson={handleStartLesson} />
						{/each}
					</div>
				</div>
			{/if}

			<!-- Completed Paths -->
			{#if completedPaths.length > 0}
				<div>
					<h2 class="mb-4 text-xl font-semibold">Completed Paths</h2>
					<div class="grid gap-4 sm:grid-cols-2">
						{#each completedPaths as path}
							<div class="card bg-base-200 shadow-sm">
								<div class="card-body p-4">
									<div class="flex items-start justify-between">
										<div>
											<h3 class="font-semibold">{path.path.title}</h3>
											<p class="text-sm text-base-content/70">{path.totalDays} days completed</p>
										</div>
										<span class="badge badge-success">Completed</span>
									</div>
									<div class="mt-2 card-actions justify-end">
										<SharePathButton
											pathId={path.path.id}
											pathTitle={path.path.title}
											isTemplate={path.path.isTemplate}
											shareSlug={path.path.shareSlug}
											size="sm"
										/>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<!-- Sidebar -->
		<div class="space-y-6">
			<!-- Quick Stats -->
			<div class="card bg-base-200">
				<div class="card-body">
					<h3 class="card-title text-base">Your Progress</h3>
					<div class="stats stats-vertical shadow">
						<div class="stat">
							<div class="stat-title">Active Paths</div>
							<div class="stat-value text-primary">{data.totalActive}</div>
						</div>
						<div class="stat">
							<div class="stat-title">Completed</div>
							<div class="stat-value text-success">{data.totalCompleted}</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Quick Actions -->
			<div class="card bg-base-200">
				<div class="card-body">
					<h3 class="card-title text-base">Quick Actions</h3>
					<div class="flex flex-col gap-2">
						<a href="/scenarios" class="btn justify-start gap-2 btn-outline btn-sm">
							<span class="icon-[mdi--view-grid-outline] h-4 w-4"></span>
							Browse Scenarios
						</a>
						<a href="/conversation" class="btn justify-start gap-2 btn-outline btn-sm">
							<span class="icon-[mdi--message-text-outline] h-4 w-4"></span>
							Start Conversation
						</a>
						<a href="/profile" class="btn justify-start gap-2 btn-outline btn-sm">
							<span class="icon-[mdi--cog-outline] h-4 w-4"></span>
							Settings
						</a>
					</div>
				</div>
			</div>

			<!-- Discover Templates -->
			{#if data.templates && data.templates.length > 0}
				<div class="card bg-base-200">
					<div class="card-body">
						<h3 class="card-title text-base">Discover Paths</h3>
						<div class="flex flex-col gap-2">
							{#each data.templates.slice(0, 3) as template}
								<button
									class="btn h-auto justify-start py-2 text-left btn-ghost btn-sm"
									onclick={() => handleEnroll(template.id)}
								>
									<div class="flex-1">
										<p class="line-clamp-1 font-medium">{template.title}</p>
										<p class="text-xs text-base-content/60">
											{template.schedule?.length || 0} days
										</p>
									</div>
								</button>
							{/each}
						</div>
						<a href="/scenarios" class="btn mt-2 btn-sm btn-primary">View All</a>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.line-clamp-1 {
		display: -webkit-box;
		-webkit-line-clamp: 1;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
