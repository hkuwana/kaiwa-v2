<script lang="ts">
	import type { PageData } from './$types';
	import type { LearnerWithPath } from './+page.server';

	const { data } = $props<{ data: PageData }>();

	// Language to country code mapping for circle-flags
	const languageToCountry: Record<string, string> = {
		ja: 'jp',
		es: 'es',
		fr: 'fr',
		de: 'de',
		zh: 'cn',
		ko: 'kr',
		it: 'it',
		pt: 'br',
		ru: 'ru',
		en: 'gb'
	};

	function getFlagIcon(langCode: string): string {
		const countryCode = languageToCountry[langCode] || 'xx';
		return `icon-[circle-flags--${countryCode}]`;
	}

	function formatDate(date: Date | null): string {
		if (!date) return '—';
		return new Date(date).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric'
		});
	}

	function formatMinutes(minutes: number): string {
		if (minutes < 60) {
			return `${Math.round(minutes)}m`;
		}
		const hours = Math.floor(minutes / 60);
		const mins = Math.round(minutes % 60);
		return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
	}

	function getDaysSince(date: Date | null): string {
		if (!date) return 'Never';
		const days = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
		if (days === 0) return 'Today';
		if (days === 1) return 'Yesterday';
		return `${days}d ago`;
	}

	function getStatusBadgeClass(status: LearnerWithPath['attentionStatus']): string {
		switch (status) {
			case 'needs_attention':
				return 'badge-error';
			case 'slow_progress':
				return 'badge-warning';
			case 'on_track':
				return 'badge-success';
			case 'completed':
				return 'badge-info';
			case 'invited':
				return 'badge-ghost';
			default:
				return 'badge-ghost';
		}
	}

	function getStatusLabel(status: LearnerWithPath['attentionStatus']): string {
		switch (status) {
			case 'needs_attention':
				return 'Needs Attention';
			case 'slow_progress':
				return 'Slow Progress';
			case 'on_track':
				return 'On Track';
			case 'completed':
				return 'Completed';
			case 'invited':
				return 'Invited';
			default:
				return status;
		}
	}
</script>

<svelte:head>
	<title>Learners | Kaiwa Admin</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-2xl font-bold">Learner Monitoring</h1>
		<p class="text-base-content/60">Track progress and help learners stay on path</p>
	</div>

	<!-- Stats Overview -->
	<div class="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5">
		<div class="rounded-lg bg-base-200 p-4">
			<div class="text-2xl font-bold">{data.stats.total}</div>
			<div class="text-sm text-base-content/60">Total Learners</div>
		</div>
		<div class="rounded-lg bg-error/10 p-4">
			<div class="text-2xl font-bold text-error">{data.stats.needsAttention}</div>
			<div class="text-sm text-base-content/60">Needs Attention</div>
		</div>
		<div class="rounded-lg bg-warning/10 p-4">
			<div class="text-2xl font-bold text-warning">{data.stats.slowProgress}</div>
			<div class="text-sm text-base-content/60">Slow Progress</div>
		</div>
		<div class="rounded-lg bg-success/10 p-4">
			<div class="text-2xl font-bold text-success">{data.stats.onTrack}</div>
			<div class="text-sm text-base-content/60">On Track</div>
		</div>
		<div class="rounded-lg bg-info/10 p-4">
			<div class="text-2xl font-bold text-info">{data.stats.completed}</div>
			<div class="text-sm text-base-content/60">Completed</div>
		</div>
	</div>

	<!-- Learner Groups -->
	{#if data.grouped.needsAttention.length > 0}
		<section class="mb-8">
			<h2 class="mb-4 flex items-center gap-2 text-lg font-semibold text-error">
				<span class="icon-[mdi--alert-circle] h-5 w-5"></span>
				Needs Attention ({data.grouped.needsAttention.length})
			</h2>
			<div class="space-y-2">
				{#each data.grouped.needsAttention as learner}
					{@render learnerCard(learner)}
				{/each}
			</div>
		</section>
	{/if}

	{#if data.grouped.slowProgress.length > 0}
		<section class="mb-8">
			<h2 class="mb-4 flex items-center gap-2 text-lg font-semibold text-warning">
				<span class="icon-[mdi--clock-alert-outline] h-5 w-5"></span>
				Slow Progress ({data.grouped.slowProgress.length})
			</h2>
			<div class="space-y-2">
				{#each data.grouped.slowProgress as learner}
					{@render learnerCard(learner)}
				{/each}
			</div>
		</section>
	{/if}

	{#if data.grouped.onTrack.length > 0}
		<section class="mb-8">
			<h2 class="mb-4 flex items-center gap-2 text-lg font-semibold text-success">
				<span class="icon-[mdi--check-circle-outline] h-5 w-5"></span>
				On Track ({data.grouped.onTrack.length})
			</h2>
			<div class="space-y-2">
				{#each data.grouped.onTrack as learner}
					{@render learnerCard(learner)}
				{/each}
			</div>
		</section>
	{/if}

	{#if data.grouped.invited.length > 0}
		<section class="mb-8">
			<h2 class="mb-4 flex items-center gap-2 text-lg font-semibold text-base-content/60">
				<span class="icon-[mdi--email-outline] h-5 w-5"></span>
				Invited ({data.grouped.invited.length})
			</h2>
			<div class="space-y-2">
				{#each data.grouped.invited as learner}
					{@render learnerCard(learner)}
				{/each}
			</div>
		</section>
	{/if}

	{#if data.grouped.completed.length > 0}
		<section class="mb-8">
			<h2 class="mb-4 flex items-center gap-2 text-lg font-semibold text-info">
				<span class="icon-[mdi--trophy-outline] h-5 w-5"></span>
				Completed ({data.grouped.completed.length})
			</h2>
			<div class="space-y-2">
				{#each data.grouped.completed as learner}
					{@render learnerCard(learner)}
				{/each}
			</div>
		</section>
	{/if}

	{#if data.learners.length === 0}
		<div class="rounded-lg border border-dashed border-base-300 p-12 text-center">
			<span class="icon-[mdi--account-group-outline] mx-auto mb-4 h-12 w-12 text-base-content/30"
			></span>
			<p class="text-base-content/60">No learners with assigned paths yet</p>
			<a href="/admin/learning-paths" class="btn btn-primary btn-sm mt-4">Create a Learning Path</a>
		</div>
	{/if}
</div>

{#snippet learnerCard(learner: LearnerWithPath)}
	<div
		class="flex items-center gap-4 rounded-lg border border-base-200 bg-base-100 p-4 transition-colors hover:bg-base-200/50"
	>
		<!-- Avatar -->
		<div class="avatar">
			<div class="h-10 w-10 rounded-full">
				{#if learner.avatarUrl}
					<img src={learner.avatarUrl} alt={learner.displayName || learner.email} />
				{:else}
					<div class="flex h-full w-full items-center justify-center bg-base-300 text-lg">
						{(learner.displayName || learner.email)[0].toUpperCase()}
					</div>
				{/if}
			</div>
		</div>

		<!-- User Info -->
		<div class="min-w-0 flex-1">
			<div class="flex items-center gap-2">
				<span class="truncate font-medium">
					{learner.displayName || learner.email.split('@')[0]}
				</span>
				<span class="badge {getStatusBadgeClass(learner.attentionStatus)} badge-sm">
					{getStatusLabel(learner.attentionStatus)}
				</span>
				{#if learner.assignment.role === 'tester'}
					<span class="badge badge-outline badge-sm">Tester</span>
				{/if}
			</div>
			<div class="flex items-center gap-2 text-sm text-base-content/60">
				<span class="{getFlagIcon(learner.path.targetLanguage)} h-4 w-4"></span>
				<span class="truncate">{learner.path.title}</span>
			</div>
		</div>

		<!-- Progress Stats -->
		<div class="hidden items-center gap-6 text-sm md:flex">
			<!-- Sessions -->
			<div class="text-center">
				<div class="font-medium">{learner.progress?.sessionsCompleted || 0}</div>
				<div class="text-xs text-base-content/50">sessions</div>
			</div>

			<!-- Time -->
			<div class="text-center">
				<div class="font-medium">{formatMinutes(learner.progress?.totalMinutes || 0)}</div>
				<div class="text-xs text-base-content/50">practiced</div>
			</div>

			<!-- Last Active -->
			<div class="text-center">
				<div class="font-medium">{getDaysSince(learner.progress?.lastSessionAt || null)}</div>
				<div class="text-xs text-base-content/50">last active</div>
			</div>

			<!-- Week -->
			<div class="text-center">
				<div class="font-medium">Week {learner.assignment.currentWeekNumber}</div>
				<div class="text-xs text-base-content/50">of {learner.path.durationWeeks}</div>
			</div>
		</div>

		<!-- Actions -->
		<div class="flex items-center gap-2">
			<a
				href="/admin/learners/{learner.id}?assignment={learner.assignment.id}"
				class="btn btn-ghost btn-sm"
				aria-label="View learner details"
			>
				<span class="icon-[mdi--chevron-right] h-5 w-5"></span>
			</a>
		</div>
	</div>
{/snippet}
