<script lang="ts">
	import {
		getLanguageMetric,
		formatLanguageName as formatLangName
	} from '$lib/utils/language-stats';

	let selectedUserId = $state('');
	let availableUsers = $state<Array<{ id: string; email: string; displayName: string }>>([]);
	let previewHtml = $state('');
	let statsData = $state<Record<string, unknown> | null>(null);
	let sendStatus: 'idle' | 'sending' | 'success' | 'error' = $state('idle');
	let statusMessage = $state('');

	// Rankings and platform stats
	let selectedPeriod = $state<'today' | 'week' | 'month' | 'all'>('week');
	let rankings = $state<Record<string, unknown>[]>([]);
	let platformStats = $state<Record<string, unknown> | null>(null);
	let loadingRankings = $state(false);

	// Load available users on mount
	$effect(() => {
		loadUsers();
		loadRankings();
		loadPlatformStats();
	});

	async function loadUsers() {
		try {
			const response = await fetch('/api/admin/weekly-stats/users');
			if (!response.ok) throw new Error('Failed to load users');
			const data = await response.json();
			availableUsers = data.users;
		} catch (error) {
			console.error('Error loading users:', error);
		}
	}

	async function generatePreview() {
		if (!selectedUserId) {
			statusMessage = 'Please select a user first';
			return;
		}

		try {
			const response = await fetch('/api/admin/weekly-stats/preview', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId: selectedUserId })
			});

			if (!response.ok) throw new Error('Failed to generate preview');

			const data = await response.json();
			previewHtml = data.html;
			statsData = data.stats;
			statusMessage = '';
		} catch (error) {
			console.error('Preview error:', error);
			statusMessage = 'Failed to generate preview';
			sendStatus = 'error';
		}
	}

	async function sendTestEmail() {
		if (!selectedUserId) {
			statusMessage = 'Please select a user first';
			return;
		}

		const confirmed = window.confirm('Send test email to this user?');
		if (!confirmed) {
			return;
		}

		sendStatus = 'sending';
		statusMessage = 'Sending test email...';

		try {
			const response = await fetch('/api/admin/weekly-stats/send-test', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId: selectedUserId })
			});

			if (!response.ok) {
				throw new Error('Failed to send test email');
			}

			const data = await response.json();
			sendStatus = 'success';
			statusMessage = `Test email sent successfully to ${data.email}!`;
		} catch (error) {
			sendStatus = 'error';
			statusMessage = `Error: ${error}`;
		}
	}

	async function sendAllWeeklyStats() {
		const confirmed = window.confirm(
			'Send weekly stats emails to ALL users who practiced this week? This cannot be undone.'
		);
		if (!confirmed) {
			return;
		}

		sendStatus = 'sending';
		statusMessage = 'Sending weekly stats to all eligible users...';

		try {
			const response = await fetch('/api/admin/weekly-stats/send-all', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});

			if (!response.ok) {
				throw new Error('Failed to send weekly stats');
			}

			const data = await response.json();
			sendStatus = 'success';
			statusMessage = `Successfully sent to ${data.sent} users! (${data.skipped} skipped, ${data.errors.length} errors)`;
		} catch (error) {
			sendStatus = 'error';
			statusMessage = `Error: ${error}`;
		}
	}

	async function loadRankings() {
		loadingRankings = true;
		try {
			const response = await fetch(
				`/api/admin/weekly-stats/rankings?period=${selectedPeriod}&limit=50`
			);
			if (!response.ok) throw new Error('Failed to load rankings');
			const data = await response.json();
			rankings = data.rankings;
		} catch (error) {
			console.error('Error loading rankings:', error);
		} finally {
			loadingRankings = false;
		}
	}

	async function loadPlatformStats() {
		let loadingPlatformStats = true;
		try {
			const response = await fetch(
				`/api/admin/weekly-stats/platform-stats?period=${selectedPeriod}`
			);
			if (!response.ok) throw new Error('Failed to load platform stats');
			const data = await response.json();
			platformStats = data.stats;
		} catch (error) {
			console.error('Error loading platform stats:', error);
		} finally {
			loadingPlatformStats = false;
		}
	}

	function handlePeriodChange() {
		loadRankings();
		loadPlatformStats();
	}

	function formatLanguageName(languageCode: string | null): string {
		return formatLangName(languageCode);
	}
</script>

<div class="container mx-auto max-w-7xl p-8">
	<div class="mb-8">
		<h1 class="text-4xl font-bold">Weekly Stats Dashboard</h1>
		<p class="mt-2 text-base-content/70">
			View platform analytics, user rankings, and manage weekly stats emails
		</p>
	</div>

	<!-- Period Selector -->
	<div class="mb-6 flex items-center gap-4">
		<label class="label">
			<span class="label-text font-medium">Time Period:</span>
		</label>
		<div class="join">
			<button
				class="btn join-item btn-sm"
				class:btn-active={selectedPeriod === 'today'}
				onclick={() => {
					selectedPeriod = 'today';
					handlePeriodChange();
				}}
			>
				Today
			</button>
			<button
				class="btn join-item btn-sm"
				class:btn-active={selectedPeriod === 'week'}
				onclick={() => {
					selectedPeriod = 'week';
					handlePeriodChange();
				}}
			>
				Week
			</button>
			<button
				class="btn join-item btn-sm"
				class:btn-active={selectedPeriod === 'month'}
				onclick={() => {
					selectedPeriod = 'month';
					handlePeriodChange();
				}}
			>
				Month
			</button>
			<button
				class="btn join-item btn-sm"
				class:btn-active={selectedPeriod === 'all'}
				onclick={() => {
					selectedPeriod = 'all';
					handlePeriodChange();
				}}
			>
				All Time
			</button>
		</div>
	</div>

	<!-- Platform Stats Overview -->
	{#if platformStats}
		<div class="card mb-8 bg-base-200">
			<div class="card-body">
				<h2 class="card-title">Platform Statistics</h2>

				<div class="stats stats-vertical shadow sm:stats-horizontal">
					<div class="stat">
						<div class="stat-title">Total Sessions</div>
						<div class="stat-value text-primary">{platformStats.totalSessions}</div>
					</div>

					<div class="stat">
						<div class="stat-title">Active Users</div>
						<div class="stat-value text-secondary">{platformStats.totalUsers}</div>
					</div>

					<div class="stat">
						<div class="stat-title">Total Minutes</div>
						<div class="stat-value text-accent">{platformStats.totalMinutes}</div>
					</div>

					<div class="stat">
						<div class="stat-title">Avg Session</div>
						<div class="stat-value text-info">{platformStats.averageSessionMinutes} min</div>
					</div>
				</div>

				<!-- Language Breakdown -->
				{#if platformStats.languageBreakdown && platformStats.languageBreakdown.length > 0}
					<div class="mt-6">
						<h3 class="mb-3 font-semibold">Language Distribution</h3>
						<div class="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
							{#each platformStats.languageBreakdown as lang (lang.language)}
								<div class="badge gap-2 p-4 badge-lg">
									<span class="font-medium">{formatLanguageName(lang.language)}</span>
									<span class="text-xs opacity-70">{lang.percentage}%</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Device Breakdown -->
				{#if platformStats.deviceBreakdown && platformStats.deviceBreakdown.length > 0}
					<div class="mt-6">
						<h3 class="mb-3 font-semibold">Device Types</h3>
						<div class="flex flex-wrap gap-2">
							{#each platformStats.deviceBreakdown as device (device.deviceType)}
								<div class="badge gap-2 badge-outline p-3">
									<span class="capitalize">{device.deviceType}</span>
									<span class="text-xs opacity-70">{device.percentage}%</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- User Rankings -->
	<div class="card mb-8 bg-base-200">
		<div class="card-body">
			<h2 class="card-title">User Activity Rankings</h2>
			<p class="mb-4 text-sm text-base-content/70">
				Users ranked by total conversation time in the selected period
			</p>

			{#if loadingRankings}
				<div class="flex justify-center py-8">
					<span class="loading loading-lg loading-spinner"></span>
				</div>
			{:else if rankings.length === 0}
				<div class="alert alert-info">
					<span>No user activity found for the selected period.</span>
				</div>
			{:else}
				<div class="overflow-x-auto">
					<table class="table table-zebra">
						<thead>
							<tr>
								<th>Rank</th>
								<th>User</th>
								<th>Minutes</th>
								<th>Sessions</th>
								<th>Active Days</th>
								<th>Output</th>
								<th>Top Language</th>
							</tr>
						</thead>
						<tbody>
							{#each rankings as ranking (ranking.userId || ranking.email)}
								{@const metric = getLanguageMetric(
									ranking.mostUsedLanguage,
									ranking.totalWordsSpoken,
									ranking.totalCharactersSpoken
								)}
								<tr>
									<td>
										<div class="font-bold">
											{#if ranking.rank === 1}
												🥇
											{:else if ranking.rank === 2}
												🥈
											{:else if ranking.rank === 3}
												🥉
											{:else}
												#{ranking.rank}
											{/if}
										</div>
									</td>
									<td>
										<div class="flex flex-col">
											<div class="font-medium">{ranking.displayName}</div>
											<div class="text-xs opacity-50">{ranking.email}</div>
										</div>
									</td>
									<td>
										<div class="badge badge-primary">{ranking.totalMinutes} min</div>
									</td>
									<td>{ranking.totalSessions}</td>
									<td>{ranking.activeDays}</td>
									<td>
										<div class="flex flex-col">
											<div class="font-medium">{metric.value.toLocaleString()}</div>
											<div class="text-xs opacity-50">{metric.unit}</div>
										</div>
									</td>
									<td>
										<span class="text-sm">{formatLanguageName(ranking.mostUsedLanguage)}</span>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	</div>

	<div class="divider">Email Testing & Management</div>

	<div class="grid gap-8 lg:grid-cols-2">
		<!-- Control Panel -->
		<div class="space-y-6">
			<!-- User Selection -->
			<div class="card bg-base-200">
				<div class="card-body">
					<h2 class="card-title">Select User</h2>

					<div class="form-control">
						<label class="label">
							<span class="label-text">Choose a user to preview their stats</span>
						</label>
						<select
							bind:value={selectedUserId}
							class="select-bordered select"
							onchange={generatePreview}
						>
							<option value="">-- Select a user --</option>
							{#each availableUsers as user (user.id)}
								<option value={user.id}>
									{user.displayName || user.email} ({user.email})
								</option>
							{/each}
						</select>
					</div>
				</div>
			</div>

			<!-- Stats Summary -->
			{#if statsData}
				<div class="card bg-base-200">
					<div class="card-body">
						<h2 class="card-title">Calculated Stats (Past 7 Days)</h2>

						<div class="stats stats-vertical shadow">
							<div class="stat">
								<div class="stat-title">Total Minutes</div>
								<div class="stat-value text-primary">{statsData.totalMinutes}</div>
							</div>

							<div class="stat">
								<div class="stat-title">Sessions</div>
								<div class="stat-value text-secondary">{statsData.totalSessions}</div>
							</div>

							<div class="stat">
								<div class="stat-title">Active Days</div>
								<div class="stat-value text-accent">{statsData.totalDaysActive}</div>
							</div>

							<div class="stat">
								<div class="stat-title">Avg Session Length</div>
								<div class="stat-value text-info">{statsData.averageSessionMinutes} min</div>
							</div>

							{#if statsData.mostPracticedLanguage}
								<div class="stat">
									<div class="stat-title">Most Practiced</div>
									<div class="stat-value text-sm">{statsData.mostPracticedLanguage}</div>
								</div>
							{/if}

							{#if statsData.improvementVsPreviousWeek !== null}
								<div class="stat">
									<div class="stat-title">vs Last Week</div>
									<div
										class="stat-value text-sm"
										class:text-success={statsData.improvementVsPreviousWeek > 0}
										class:text-warning={statsData.improvementVsPreviousWeek < 0}
									>
										{statsData.improvementVsPreviousWeek > 0
											? '+'
											: ''}{statsData.improvementVsPreviousWeek}%
									</div>
								</div>
							{/if}
						</div>

						{#if statsData.totalSessions === 0}
							<div class="alert alert-warning">
								<span
									>⚠️ This user has no practice activity in the past 7 days. They would be skipped.</span
								>
							</div>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Actions -->
			<div class="card bg-base-200">
				<div class="card-body">
					<h2 class="card-title">Actions</h2>

					<div class="flex flex-col gap-2">
						<button class="btn btn-info" onclick={generatePreview} disabled={!selectedUserId}>
							👁️ Preview Email
						</button>

						<button
							class="btn btn-success"
							onclick={sendTestEmail}
							disabled={!selectedUserId ||
								sendStatus === 'sending' ||
								statsData?.totalSessions === 0}
						>
							{#if sendStatus === 'sending'}
								<span class="loading loading-spinner"></span>
								Sending...
							{:else}
								📧 Send Test Email
							{/if}
						</button>

						<div class="divider">Danger Zone</div>

						<button class="btn btn-error" onclick={sendAllWeeklyStats}>
							🚀 Send to ALL Eligible Users
						</button>
					</div>

					{#if statusMessage}
						<div
							class="alert"
							class:alert-success={sendStatus === 'success'}
							class:alert-error={sendStatus === 'error'}
							class:alert-info={sendStatus === 'idle'}
						>
							{statusMessage}
						</div>
					{/if}

					<div class="text-sm opacity-70">
						<p class="font-medium">💡 How It Works:</p>
						<ol class="ml-4 list-decimal space-y-1">
							<li>Select a user who practiced in the past week</li>
							<li>Preview their stats and email</li>
							<li>Test send to verify everything looks good</li>
							<li>The cron job runs automatically every Saturday at 11 AM UTC</li>
						</ol>
					</div>
				</div>
			</div>
		</div>

		<!-- Preview Panel -->
		<div class="sticky top-8">
			<div class="card bg-base-200">
				<div class="card-body">
					<h2 class="card-title">Email Preview</h2>

					{#if previewHtml}
						<div class="max-h-[800px] overflow-auto rounded border border-base-300 bg-white">
							<!-- svelte-ignore no-at-html-tags -->
						<!-- Safe: previewHtml is weekly stats email HTML generated by our own email templates -->
						{@html previewHtml}
						</div>
					{:else}
						<div class="flex h-96 items-center justify-center text-base-content/50">
							Select a user and click "Preview Email" to see how it will look
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
