<script lang="ts">
	import type { PageData } from './$types';

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

	function formatDate(date: Date | string | null): string {
		if (!date) return '—';
		return new Date(date).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function formatTime(date: Date | string | null): string {
		if (!date) return '';
		return new Date(date).toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit'
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

	function formatDuration(seconds: number | null): string {
		if (!seconds) return '—';
		if (seconds < 60) return `${seconds}s`;
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
	}

	function getDaysSince(date: Date | string | null): string {
		if (!date) return 'Never';
		const days = Math.floor(
			(Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)
		);
		if (days === 0) return 'Today';
		if (days === 1) return 'Yesterday';
		return `${days} days ago`;
	}

	function getMoodEmoji(mood: string | null): string {
		switch (mood) {
			case 'great':
				return '😊';
			case 'good':
				return '🙂';
			case 'okay':
				return '😐';
			case 'struggling':
				return '😓';
			default:
				return '';
		}
	}

	function getStatusBadgeClass(status: string): string {
		switch (status) {
			case 'active':
				return 'badge-success';
			case 'completed':
				return 'badge-info';
			case 'invited':
				return 'badge-warning';
			case 'archived':
				return 'badge-ghost';
			default:
				return 'badge-ghost';
		}
	}
</script>

<svelte:head>
	<title>{data.learner.displayName || data.learner.email} | Learners | Kaiwa Admin</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<!-- Breadcrumb -->
	<div class="mb-6 text-sm breadcrumbs">
		<ul>
			<li><a href="/admin">Admin</a></li>
			<li><a href="/admin/learners">Learners</a></li>
			<li>{data.learner.displayName || data.learner.email.split('@')[0]}</li>
		</ul>
	</div>

	<!-- Header -->
	<div class="mb-8 flex items-start gap-4">
		<!-- Avatar -->
		<div class="avatar">
			<div class="h-16 w-16 rounded-full">
				{#if data.learner.avatarUrl}
					<img src={data.learner.avatarUrl} alt={data.learner.displayName || data.learner.email} />
				{:else}
					<div class="flex h-full w-full items-center justify-center bg-base-300 text-2xl">
						{(data.learner.displayName || data.learner.email)[0].toUpperCase()}
					</div>
				{/if}
			</div>
		</div>

		<!-- Info -->
		<div class="flex-1">
			<h1 class="text-2xl font-bold">
				{data.learner.displayName || data.learner.email.split('@')[0]}
			</h1>
			<p class="text-base-content/60">{data.learner.email}</p>
			<div class="mt-2 flex items-center gap-3">
				<span class="badge {getStatusBadgeClass(data.assignment.status)}">
					{data.assignment.status}
				</span>
				{#if data.assignment.role === 'tester'}
					<span class="badge badge-outline">Tester</span>
				{/if}
				<span class="text-sm text-base-content/50">
					Member since {formatDate(data.learner.createdAt)}
				</span>
			</div>
		</div>

		<!-- Actions -->
		<div class="flex gap-2">
			<button class="btn btn-outline btn-sm" disabled>
				<span class="icon-[mdi--email-outline] h-4 w-4"></span>
				Send Message
			</button>
		</div>
	</div>

	<!-- Current Path -->
	<div class="mb-8 rounded-lg border border-base-200 bg-base-100 p-6">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-lg font-semibold">Current Learning Path</h2>
			{#if data.allAssignments.length > 1}
				<select class="select select-bordered select-sm">
					{#each data.allAssignments as assignment}
						<option value={assignment.id} selected={assignment.id === data.assignment.id}>
							{assignment.pathTitle}
						</option>
					{/each}
				</select>
			{/if}
		</div>

		<div class="flex items-start gap-4">
			<span class="{getFlagIcon(data.path.targetLanguage)} h-8 w-8 shrink-0"></span>
			<div class="flex-1">
				<h3 class="text-xl font-medium">{data.path.title}</h3>
				<p class="text-base-content/60">{data.path.description}</p>
				<div class="mt-3 flex flex-wrap gap-4 text-sm">
					<div>
						<span class="text-base-content/50">Started:</span>
						<span class="font-medium">{formatDate(data.assignment.startsAt)}</span>
					</div>
					<div>
						<span class="text-base-content/50">Current Week:</span>
						<span class="font-medium"
							>{data.assignment.currentWeekNumber} of {data.path.durationWeeks}</span
						>
					</div>
					<div>
						<span class="text-base-content/50">Mode:</span>
						<span class="badge badge-sm">{data.path.mode}</span>
					</div>
					{#if data.assignment.completedAt}
						<div>
							<span class="text-base-content/50">Completed:</span>
							<span class="font-medium text-success">{formatDate(data.assignment.completedAt)}</span
							>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- Stats Grid -->
	<div class="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
		<div class="rounded-lg bg-base-200 p-4">
			<div class="text-2xl font-bold">{data.stats.totalSessions}</div>
			<div class="text-sm text-base-content/60">Total Sessions</div>
		</div>
		<div class="rounded-lg bg-base-200 p-4">
			<div class="text-2xl font-bold">{formatMinutes(data.stats.totalMinutes)}</div>
			<div class="text-sm text-base-content/60">Time Practiced</div>
		</div>
		<div class="rounded-lg bg-base-200 p-4">
			<div class="text-2xl font-bold">{data.stats.completedConversations}</div>
			<div class="text-sm text-base-content/60">Conversations</div>
		</div>
		<div class="rounded-lg bg-base-200 p-4">
			<div class="text-2xl font-bold">{getDaysSince(data.learner.lastUsage)}</div>
			<div class="text-sm text-base-content/60">Last Active</div>
		</div>
	</div>

	<!-- Week Progress -->
	<div class="mb-8">
		<h2 class="mb-4 text-lg font-semibold">Weekly Progress</h2>

		{#if data.weekProgress.length === 0}
			<div class="rounded-lg border border-dashed border-base-300 p-8 text-center">
				<span class="icon-[mdi--calendar-blank-outline] mx-auto mb-2 h-8 w-8 text-base-content/30"
				></span>
				<p class="text-base-content/60">No weekly progress recorded yet</p>
			</div>
		{:else}
			<div class="space-y-4">
				{#each data.weekProgress as week}
					<div class="collapse collapse-arrow rounded-lg border border-base-200 bg-base-100">
						<input type="checkbox" checked={week.weekNumber === data.assignment.currentWeekNumber} />
						<div class="collapse-title">
							<div class="flex items-center justify-between">
								<span class="font-medium">Week {week.weekNumber}</span>
								<div class="flex items-center gap-4 text-sm text-base-content/60">
									<span>{week.sessionsCompleted} sessions</span>
									<span>{formatMinutes(week.totalMinutes)}</span>
									{#if week.currentStreakDays > 0}
										<span class="text-success">{week.currentStreakDays} day streak</span>
									{/if}
								</div>
							</div>
						</div>
						<div class="collapse-content">
							{#if week.sessions.length === 0}
								<p class="text-base-content/60">No sessions this week</p>
							{:else}
								<div class="space-y-2">
									{#each week.sessions as session}
										<div class="flex items-center gap-4 rounded-lg bg-base-200/50 p-3 text-sm">
											<div class="flex-1">
												<div class="font-medium">
													{formatDate(session.startedAt)} at {formatTime(session.startedAt)}
												</div>
												<div class="text-base-content/60">
													{session.exchangeCount} exchanges · {formatDuration(session.durationSeconds)}
												</div>
											</div>
											{#if session.mood}
												<div class="text-lg" title={session.mood}>{getMoodEmoji(session.mood)}</div>
											{/if}
											{#if session.comfortRating}
												<div class="badge badge-sm">Comfort: {session.comfortRating}/5</div>
											{/if}
											<a
												href="/admin/conversations/{session.conversationId}"
												class="btn btn-ghost btn-xs"
												aria-label="View conversation"
											>
												<span class="icon-[mdi--chevron-right] h-4 w-4"></span>
											</a>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Recent Conversations -->
	<div>
		<h2 class="mb-4 text-lg font-semibold">Recent Conversations</h2>

		{#if data.recentConversations.length === 0}
			<div class="rounded-lg border border-dashed border-base-300 p-8 text-center">
				<span class="icon-[mdi--chat-outline] mx-auto mb-2 h-8 w-8 text-base-content/30"></span>
				<p class="text-base-content/60">No conversations yet</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="table table-sm">
					<thead>
						<tr>
							<th>Date</th>
							<th>Scenario</th>
							<th>Language</th>
							<th>Duration</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each data.recentConversations as conversation}
							<tr>
								<td>
									<div>{formatDate(conversation.startedAt)}</div>
									<div class="text-xs text-base-content/50">{formatTime(conversation.startedAt)}</div>
								</td>
								<td class="max-w-xs truncate">{conversation.scenarioId || '—'}</td>
								<td>
									<span class="{getFlagIcon(conversation.targetLanguageId)} h-5 w-5"></span>
								</td>
								<td>
									{#if conversation.endedAt}
										<span class="badge badge-success badge-sm">
											{formatDuration(conversation.durationSeconds)}
										</span>
									{:else}
										<span class="badge badge-warning badge-sm">In progress</span>
									{/if}
								</td>
								<td>
									<a
										href="/admin/conversations/{conversation.id}"
										class="btn btn-ghost btn-xs"
										aria-label="View conversation"
									>
										<span class="icon-[mdi--chevron-right] h-4 w-4"></span>
									</a>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>
