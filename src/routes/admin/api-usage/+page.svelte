<script lang="ts">
	import { SvelteDate } from 'svelte/reactivity';

	let { data } = $props();

	const { userId, stats, summary, sessions } = data;

	const numberFormatter = new Intl.NumberFormat();
	const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
		year: 'numeric',
		month: 'short',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit'
	});

	function formatDuration(seconds: number | null | undefined): string {
		if (!seconds || seconds <= 0) return '0s';
		if (seconds < 60) return `${seconds}s`;

		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
	}

	function formatAudioSeconds(seconds: number | null | undefined): string {
		if (seconds === null || seconds === undefined) return '—';
		return formatDuration(seconds);
	}

	function estimateRealtimeCost(inputTokens: number): number {
		// Pricing sourced from gpt-5-nano-realtime-preview (Dec 2024): $0.0006 / 1K input tokens.
		const costPerToken = 0.0006 / 1000;
		return inputTokens * costPerToken;
	}

	const aggregateCost = summary
		? estimateRealtimeCost(summary.totalInputTokens ?? 0)
		: estimateRealtimeCost(0);
</script>

<div class="mx-auto max-w-7xl space-y-6 p-6">
	<div>
		<h1 class="text-3xl font-bold">🔍 Realtime API Usage</h1>
		<p class="mt-2 text-base-content/70">
			Quick view of your conversation session metadata: durations, consumption, and estimated
			realtime costs.
		</p>
	</div>

	{#if !userId}
		<div class="alert alert-warning">
			<span>Sign in to inspect your realtime usage.</span>
		</div>
	{:else}
		<section class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			<div class="stat rounded-lg bg-base-100 shadow">
				<div class="stat-title">Sessions</div>
				<div class="stat-value text-2xl">
					{numberFormatter.format(stats?.totalSessions ?? 0)}
				</div>
				<div class="stat-desc">Tracked realtime sessions</div>
			</div>

			<div class="stat rounded-lg bg-base-100 shadow">
				<div class="stat-title">Recorded Duration</div>
				<div class="stat-value text-2xl">
					{formatDuration(stats?.totalSeconds ?? summary?.totalDurationSeconds ?? 0)}
				</div>
				<div class="stat-desc">All time conversation time</div>
			</div>

			<div class="stat rounded-lg bg-base-100 shadow">
				<div class="stat-title">Avg Session Length</div>
				<div class="stat-value text-2xl">
					{formatDuration(stats?.averageSessionLengthSeconds)}
				</div>
				<div class="stat-desc">Across all tracked sessions</div>
			</div>

			<div class="stat rounded-lg bg-base-100 shadow">
				<div class="stat-title">Input Tokens Used</div>
				<div class="stat-value text-2xl">
					{numberFormatter.format(summary?.totalInputTokens ?? 0)}
				</div>
				<div class="stat-desc">Approx. cost ${aggregateCost.toFixed(4)}</div>
			</div>
		</section>

		<section class="rounded-xl bg-base-100 p-6 shadow">
			<div class="flex items-center justify-between gap-4">
				<h2 class="text-xl font-semibold">Recent Sessions</h2>
				<p class="text-sm text-base-content/70">
					Showing up to 50 most recent sessions with realtime usage metrics.
				</p>
			</div>

			{#if sessions.length === 0}
				<div
					class="mt-6 rounded-lg border border-dashed border-base-content/20 p-6 text-center text-base-content/70"
				>
					No sessions recorded yet. Start a conversation to populate this dashboard.
				</div>
			{:else}
				<div class="mt-6 overflow-x-auto">
					<table class="table w-full table-zebra">
						<thead>
							<tr>
								<th>Started</th>
								<th>Duration</th>
								<th>Consumed</th>
								<th>Input Tokens</th>
								<th>Device</th>
								<th>Language</th>
							</tr>
						</thead>
						<tbody>
							{#each sessions as session (session.id)}
								<tr>
									<td>{dateTimeFormatter.format(new SvelteDate(session.startTime))}</td>
									<td>{formatDuration(session.durationSeconds)}</td>
									<td>{formatAudioSeconds(session.secondsConsumed)}</td>
									<td>{numberFormatter.format(session.inputTokens ?? 0)}</td>
									<td>{session.deviceType ?? '—'}</td>
									<td class="uppercase">{session.language}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</section>
	{/if}
</div>
