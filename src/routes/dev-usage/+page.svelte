<!-- 📊 Usage Tracking Debug Page -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { userManager } from '$lib/stores/user.store.svelte';
	import { posthogManager } from '$lib/client/posthog';

	// State
	let debugData = $state<any>(null);
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
	async function recordUsage(action: string, data?: any) {
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
			const url = `/api/dev/usage-debug?action=check_${type}` + (amount ? `&${type === 'seconds' ? 'seconds' : 'amount'}=${amount}` : '');
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

	// Format seconds to minutes
	function formatSeconds(seconds: number): string {
		if (seconds < 60) return `${seconds}s`;
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
	}
</script>

<div class="container mx-auto p-6 max-w-6xl">
	<h1 class="text-3xl font-bold mb-8 text-center">
		📊 Usage Tracking Debug
	</h1>

	{#if !userManager.isLoggedIn}
		<div class="alert alert-warning mb-6">
			<span>⚠️ Please log in to test usage functionality</span>
		</div>
	{/if}

	<!-- Test Status -->
	<div class="card bg-base-100 shadow-xl mb-6">
		<div class="card-body">
			<h2 class="card-title text-xl mb-4">Test Status</h2>

			{#if testResult}
				<div class="alert {testResult.includes('❌') ? 'alert-error' : testResult.includes('✅') ? 'alert-success' : 'alert-info'}">
					<span>{testResult}</span>
				</div>
			{/if}

			{#if isLoading}
				<div class="loading loading-spinner loading-lg"></div>
			{/if}

			<div class="flex gap-2 flex-wrap">
				<button
					class="btn btn-primary"
					onclick={loadDebugData}
					disabled={isLoading}
				>
					🔄 Refresh Data
				</button>
			</div>
		</div>
	</div>

	<!-- Current Usage Summary -->
	{#if debugData?.summary}
		<div class="card bg-base-100 shadow-xl mb-6">
			<div class="card-body">
				<h2 class="card-title text-xl mb-4">Current Usage Summary</h2>

				<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
					<div class="stat bg-base-200 rounded-lg">
						<div class="stat-title">User & Tier</div>
						<div class="stat-value text-sm">{debugData.user?.email}</div>
						<div class="stat-desc capitalize">Tier: {debugData.summary.tier}</div>
					</div>

					<div class="stat bg-base-200 rounded-lg">
						<div class="stat-title">Period</div>
						<div class="stat-value text-lg">{debugData.summary.period}</div>
						<div class="stat-desc">Current billing month</div>
					</div>

					<div class="stat bg-base-200 rounded-lg">
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
				<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
					<!-- Conversations -->
					<div class="border border-base-300 rounded-lg p-4">
						<h3 class="font-semibold mb-3 flex items-center">
							💬 Conversations
							{#if debugData.summary.conversations.unlimited}
								<span class="badge badge-success ml-2">Unlimited</span>
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
									<span class="font-mono font-semibold">{debugData.summary.conversations.available}</span>
								</div>
							{/if}
							<div class="flex justify-between">
								<span>Can Use:</span>
								<span class="{debugData.summary.conversations.canUse ? 'text-success' : 'text-error'}">
									{debugData.summary.conversations.canUse ? '✅ Yes' : '❌ No'}
								</span>
							</div>
						</div>
					</div>

					<!-- Time -->
					<div class="border border-base-300 rounded-lg p-4">
						<h3 class="font-semibold mb-3">⏱️ Time Usage</h3>
						<div class="space-y-2">
							<div class="flex justify-between">
								<span>Used:</span>
								<span class="font-mono">{debugData.summary.seconds.usedMinutes}min</span>
							</div>
							<div class="flex justify-between">
								<span>Available:</span>
								<span class="font-mono font-semibold">{debugData.summary.seconds.availableMinutes}min</span>
							</div>
							<div class="flex justify-between">
								<span>Monthly:</span>
								<span class="font-mono">{Math.floor(debugData.summary.seconds.monthlyUsed / 60)}min</span>
							</div>
							{#if debugData.summary.seconds.bankedAvailable > 0}
								<div class="flex justify-between">
									<span>Banked:</span>
									<span class="font-mono">{Math.floor(debugData.summary.seconds.bankedAvailable / 60)}min</span>
								</div>
							{/if}
							<div class="flex justify-between">
								<span>Can Use:</span>
								<span class="{debugData.summary.seconds.canUse ? 'text-success' : 'text-error'}">
									{debugData.summary.seconds.canUse ? '✅ Yes' : '❌ No'}
								</span>
							</div>
						</div>
					</div>

					<!-- Realtime Sessions -->
					<div class="border border-base-300 rounded-lg p-4">
						<h3 class="font-semibold mb-3 flex items-center">
							🎙️ Realtime Sessions
							{#if debugData.summary.realtimeSessions.unlimited}
								<span class="badge badge-success ml-2">Unlimited</span>
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
									<span class="font-mono font-semibold">{debugData.summary.realtimeSessions.available}</span>
								</div>
							{/if}
							<div class="flex justify-between">
								<span>Can Use:</span>
								<span class="{debugData.summary.realtimeSessions.canUse ? 'text-success' : 'text-error'}">
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
	<div class="card bg-base-100 shadow-xl mb-6">
		<div class="card-body">
			<h2 class="card-title text-xl mb-4">🔍 Feature Limit Checks</h2>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-3">
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
	<div class="card bg-base-100 shadow-xl mb-6">
		<div class="card-body">
			<h2 class="card-title text-xl mb-4">📝 Record Usage</h2>

			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
				<button
					class="btn btn-primary btn-sm"
					onclick={() => recordUsage('record_conversation')}
					disabled={isLoading || !userManager.isLoggedIn}
				>
					+1 Conversation
				</button>

				<button
					class="btn btn-primary btn-sm"
					onclick={() => recordUsage('record_seconds', { seconds: 300 })}
					disabled={isLoading || !userManager.isLoggedIn}
				>
					+5 Minutes
				</button>

				<button
					class="btn btn-primary btn-sm"
					onclick={() => recordUsage('record_realtime')}
					disabled={isLoading || !userManager.isLoggedIn}
				>
					+1 Realtime Session
				</button>

				<button
					class="btn btn-secondary btn-sm"
					onclick={() => recordUsage('record_multiple', { conversations: 3, seconds: 900, realtimeSessions: 2 })}
					disabled={isLoading || !userManager.isLoggedIn}
				>
					+Multiple (3conv, 15min, 2rt)
				</button>

				<button
					class="btn btn-warning btn-sm"
					onclick={() => recordUsage('simulate_heavy_usage')}
					disabled={isLoading || !userManager.isLoggedIn}
				>
					🔥 Simulate Heavy Usage
				</button>

				<button
					class="btn btn-error btn-sm"
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
		<div class="card bg-base-100 shadow-xl mb-6">
			<div class="card-body">
				<h2 class="card-title text-xl mb-4">🎯 Feature Access</h2>

				<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
					{#each Object.entries(debugData.summary.features) as [feature, hasAccess]}
						<div class="flex items-center space-x-2">
							<span class="{hasAccess ? 'text-success' : 'text-base-content/50'}">
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
				<h2 class="card-title text-xl mb-4">📈 Usage History</h2>

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
								{#each debugData.history as period}
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
					<div class="text-center text-base-content/50 py-8">
						No usage history found
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>