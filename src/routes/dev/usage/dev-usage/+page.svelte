<!-- 📊 Usage Tracking Debug Page -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { userManager } from '$lib/stores/user.store.svelte';
	import { posthogManager } from '$lib/client/posthog';

	// State
	let debugData = $state<Record<string, unknown> | null>(null);
	let isLoading = $state(false);
	let testResult = $state<string>('');

	onMount(async () => {
		console.log('📊 Usage Debug Page');
		posthogManager.trackEvent('dev_usage_page_viewed');
		await loadDebugData();
	});

	// Load usage debug data
	async function loadDebugData() {
		if (!userManager.isLoggedIn) return;

		isLoading = true;
		try {
			const response = await fetch('/api/dev/usage-debug?action=all');
			if (response.ok) {
				debugData = await response.json();
				console.log('Usage debug data:', debugData);
			} else {
				const error = await response.text();
				testResult = `❌ Failed to load debug data: ${error}`;
			}
		} catch (error) {
			testResult = `❌ Error loading debug data: ${error}`;
		} finally {
			isLoading = false;
		}
	}

	// Record usage
	async function recordUsage(action: string, data?: Record<string, unknown>) {
		if (!userManager.isLoggedIn) {
			testResult = '❌ Please log in first';
			return;
		}

		isLoading = true;
		testResult = `🔧 Recording ${action}...`;

		try {
			const response = await fetch('/api/dev/usage-debug', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action, data })
			});

			const result = await response.json();

			if (response.ok) {
				testResult = `✅ ${result.message}`;
				await loadDebugData(); // Refresh data
			} else {
				testResult = `❌ ${action} failed: ${result.message}`;
			}
		} catch (error) {
			testResult = `❌ ${action} error: ${error}`;
		} finally {
			isLoading = false;
		}
	}

	// Check specific feature
	async function checkFeature(type: string, amount?: number) {
		isLoading = true;
		testResult = `🔍 Checking ${type}...`;

		try {
			const url =
				`/api/dev/usage-debug?action=check_${type}` +
				(amount ? `&${type === 'seconds' ? 'seconds' : 'amount'}=${amount}` : '');
			const response = await fetch(url);
			const result = await response.json();

			if (response.ok) {
				const check = result.check;
				testResult = `${check.canUse ? '✅' : '❌'} ${check.reason}`;
			} else {
				testResult = `❌ Check failed: ${result.message}`;
			}
		} catch (error) {
			testResult = `❌ Check error: ${error}`;
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="container mx-auto max-w-6xl p-6">
	<h1 class="mb-8 text-center text-3xl font-bold">📊 Usage Tracking Debug</h1>

	{#if !userManager.isLoggedIn}
		<div class="mb-6 alert alert-warning">
			<span>⚠️ Please log in to test usage functionality</span>
		</div>
	{/if}

	<!-- Test Status -->
	<div class="card mb-6 bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="mb-4 card-title text-xl">Test Status</h2>

			{#if testResult}
				<div
					class="alert {testResult.includes('❌')
						? 'alert-error'
						: testResult.includes('✅')
							? 'alert-success'
							: 'alert-info'}"
				>
					<span>{testResult}</span>
				</div>
			{/if}

			{#if isLoading}
				<div class="loading loading-lg loading-spinner"></div>
			{/if}

			<div class="flex flex-wrap gap-2">
				<button class="btn btn-primary" onclick={loadDebugData} disabled={isLoading}>
					🔄 Refresh Data
				</button>
			</div>
		</div>
	</div>

	<!-- Current Usage Summary -->
	{#if debugData?.summary}
		<div class="card mb-6 bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="mb-4 card-title text-xl">Current Usage Summary</h2>

				<div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
					<div class="stat rounded-lg bg-base-200">
						<div class="stat-title">User & Tier</div>
						<div class="stat-value text-sm">{debugData.user?.email}</div>
						<div class="stat-desc capitalize">Tier: {debugData.summary.tier}</div>
					</div>

					<div class="stat rounded-lg bg-base-200">
						<div class="stat-title">Period</div>
						<div class="stat-value text-lg">{debugData.summary.period}</div>
						<div class="stat-desc">Current billing month</div>
					</div>

					<div class="stat rounded-lg bg-base-200">
						<div class="stat-title">Overall Status</div>
						<div class="stat-value text-sm">
							{#if debugData.summary.status.atLimits}
								🔴 At Limits
							{:else if debugData.summary.status.nearLimits}
								🟡 Near Limits
							{:else}
								🟢 Good
							{/if}
						</div>
						<div class="stat-desc">
							{debugData.summary.status.hasAnyLimits ? 'Has limits' : 'No limits'}
						</div>
					</div>
				</div>

				<!-- Feature Usage -->
				<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
					<!-- Conversations -->
					<div class="rounded-lg border border-base-300 p-4">
						<h3 class="mb-3 flex items-center font-semibold">
							💬 Conversations
							{#if debugData.summary.conversations.unlimited}
								<span class="ml-2 badge badge-success">Unlimited</span>
							{/if}
						</h3>
						<div class="space-y-2">
							<div class="flex justify-between">
								<span>Used:</span>
								<span class="font-mono">{debugData.summary.conversations.used}</span>
							</div>
							{#if !debugData.summary.conversations.unlimited}
								<div class="flex justify-between">
									<span>Limit:</span>
									<span class="font-mono">{debugData.summary.conversations.limit}</span>
								</div>
								<div class="flex justify-between">
									<span>Available:</span>
									<span class="font-mono font-semibold"
										>{debugData.summary.conversations.available}</span
									>
								</div>
							{/if}
							<div class="flex justify-between">
								<span>Can Use:</span>
								<span
									class={debugData.summary.conversations.canUse ? 'text-success' : 'text-error'}
								>
									{debugData.summary.conversations.canUse ? '✅ Yes' : '❌ No'}
								</span>
							</div>
						</div>
					</div>

					<!-- Time -->
					<div class="rounded-lg border border-base-300 p-4">
						<h3 class="mb-3 font-semibold">⏱️ Time Usage</h3>
						<div class="space-y-2">
							<div class="flex justify-between">
								<span>Used:</span>
								<span class="font-mono">{debugData.summary.seconds.usedMinutes}min</span>
							</div>
							<div class="flex justify-between">
								<span>Available:</span>
								<span class="font-mono font-semibold"
									>{debugData.summary.seconds.availableMinutes}min</span
								>
							</div>
							<div class="flex justify-between">
								<span>Monthly:</span>
								<span class="font-mono"
									>{Math.floor(debugData.summary.seconds.monthlyUsed / 60)}min</span
								>
							</div>
							{#if debugData.summary.seconds.bankedAvailable > 0}
								<div class="flex justify-between">
									<span>Banked:</span>
									<span class="font-mono"
										>{Math.floor(debugData.summary.seconds.bankedAvailable / 60)}min</span
									>
								</div>
							{/if}
							<div class="flex justify-between">
								<span>Can Use:</span>
								<span class={debugData.summary.seconds.canUse ? 'text-success' : 'text-error'}>
									{debugData.summary.seconds.canUse ? '✅ Yes' : '❌ No'}
								</span>
							</div>
						</div>
					</div>

					<!-- Realtime Sessions -->
					<div class="rounded-lg border border-base-300 p-4">
						<h3 class="mb-3 flex items-center font-semibold">
							🎙️ Realtime Sessions
							{#if debugData.summary.realtimeSessions.unlimited}
								<span class="ml-2 badge badge-success">Unlimited</span>
							{/if}
						</h3>
						<div class="space-y-2">
							<div class="flex justify-between">
								<span>Used:</span>
								<span class="font-mono">{debugData.summary.realtimeSessions.used}</span>
							</div>
							{#if !debugData.summary.realtimeSessions.unlimited}
								<div class="flex justify-between">
									<span>Limit:</span>
									<span class="font-mono">{debugData.summary.realtimeSessions.limit}</span>
								</div>
								<div class="flex justify-between">
									<span>Available:</span>
									<span class="font-mono font-semibold"
										>{debugData.summary.realtimeSessions.available}</span
									>
								</div>
							{/if}
							<div class="flex justify-between">
								<span>Can Use:</span>
								<span
									class={debugData.summary.realtimeSessions.canUse ? 'text-success' : 'text-error'}
								>
									{debugData.summary.realtimeSessions.canUse ? '✅ Yes' : '❌ No'}
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Feature Checks -->
	<div class="card mb-6 bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="mb-4 card-title text-xl">🔍 Feature Limit Checks</h2>

			<div class="grid grid-cols-1 gap-3 md:grid-cols-3">
				<button
					class="btn btn-outline"
					onclick={() => checkFeature('conversation')}
					disabled={isLoading}
				>
					Check Conversation
				</button>

				<button
					class="btn btn-outline"
					onclick={() => checkFeature('seconds', 600)}
					disabled={isLoading}
				>
					Check 10min Usage
				</button>

				<button
					class="btn btn-outline"
					onclick={() => checkFeature('realtime')}
					disabled={isLoading}
				>
					Check Realtime Session
				</button>
			</div>
		</div>
	</div>

	<!-- Record Usage -->
	<div class="card mb-6 bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="mb-4 card-title text-xl">📝 Record Usage</h2>

			<div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
				<button
					class="btn btn-sm btn-primary"
					onclick={() => recordUsage('record_conversation')}
					disabled={isLoading || !userManager.isLoggedIn}
				>
					+1 Conversation
				</button>

				<button
					class="btn btn-sm btn-primary"
					onclick={() => recordUsage('record_seconds', { seconds: 300 })}
					disabled={isLoading || !userManager.isLoggedIn}
				>
					+5 Minutes
				</button>

				<button
					class="btn btn-sm btn-primary"
					onclick={() => recordUsage('record_realtime')}
					disabled={isLoading || !userManager.isLoggedIn}
				>
					+1 Realtime Session
				</button>

				<button
					class="btn btn-sm btn-secondary"
					onclick={() =>
						recordUsage('record_multiple', { conversations: 3, seconds: 900, realtimeSessions: 2 })}
					disabled={isLoading || !userManager.isLoggedIn}
				>
					+Multiple (3conv, 15min, 2rt)
				</button>

				<button
					class="btn btn-sm btn-warning"
					onclick={() => recordUsage('simulate_heavy_usage')}
					disabled={isLoading || !userManager.isLoggedIn}
				>
					🔥 Simulate Heavy Usage
				</button>

				<button
					class="btn btn-sm btn-error"
					onclick={() => recordUsage('reset_usage')}
					disabled={isLoading || !userManager.isLoggedIn}
				>
					🗑️ Reset Usage
				</button>
			</div>
		</div>
	</div>

	<!-- Feature Access -->
	{#if debugData?.summary?.features}
		<div class="card mb-6 bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="mb-4 card-title text-xl">🎯 Feature Access</h2>

				<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
					{#each Object.entries(debugData.summary.features) as [feature, hasAccess] (feature)}
						<div class="flex items-center space-x-2">
							<span class={hasAccess ? 'text-success' : 'text-base-content/50'}>
								{hasAccess ? '✅' : '❌'}
							</span>
							<span class="text-sm {hasAccess ? '' : 'text-base-content/50'}">{feature}</span>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	<!-- Usage History -->
	{#if debugData?.history}
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="mb-4 card-title text-xl">📈 Usage History</h2>

				{#if debugData.history.length > 0}
					<div class="overflow-x-auto">
						<table class="table table-sm">
							<thead>
								<tr>
									<th>Period</th>
									<th>Conversations</th>
									<th>Minutes</th>
									<th>Realtime Sessions</th>
									<th>Banked</th>
								</tr>
							</thead>
							<tbody>
								{#each debugData.history as period (period.period)}
									<tr>
										<td class="font-mono">{period.period}</td>
										<td>{period.conversationsUsed}</td>
										<td>{Math.floor((period.secondsUsed || 0) / 60)}</td>
										<td>{period.realtimeSessionsUsed}</td>
										<td>{Math.floor((period.bankedSeconds || 0) / 60)}min</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{:else}
					<div class="py-8 text-center text-base-content/50">No usage history found</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
