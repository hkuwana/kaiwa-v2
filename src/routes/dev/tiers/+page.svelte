<script lang="ts">
	import { onMount } from 'svelte';
	import { userManager } from '$lib/stores/user.store.svelte';

	// Mock tier data for testing - matches our server configurations
	const tierConfigs = [
		{
			id: 'free',
			name: 'Basic',
			description: 'For trying out Kaiwa',
			monthlyConversations: 100,
			monthlySeconds: 900, // 15 minutes
			monthlyRealtimeSessions: 100,
			dailyConversations: 1, // NEW: 1 per day
			sessionSeconds: 180, // how long a single session can last
			dailyAnalyses: 1, // NEW: 1 analysis per day
			maxSessionLengthSeconds: 180,
			hasAnalytics: false,
			hasAdvancedVoices: false,
			color: 'neutral'
		},
		{
			id: 'plus',
			name: 'Plus',
			description: 'For serious language learners',
			monthlyConversations: 100,
			monthlySeconds: 18000, // 300 minutes
			monthlyRealtimeSessions: 100,
			dailyConversations: null, // No daily limits
			sessionSeconds: 600, // how long a single session can last
			dailyAnalyses: null,
			maxSessionLengthSeconds: 600, // 10 minutes
			hasAnalytics: true,
			hasAdvancedVoices: true,
			color: 'primary'
		},
		{
			id: 'premium',
			name: 'Premium',
			description: 'For power users who want more practice time',
			monthlyConversations: 100,
			monthlySeconds: 36000, // 600 minutes
			monthlyRealtimeSessions: 100,
			dailyConversations: null, // No daily limits
			sessionSeconds: 600, // how long a single session can last
			dailyAnalyses: null,
			maxSessionLengthSeconds: 600, // 10 minutes
			hasAnalytics: true,
			hasAdvancedVoices: true,
			color: 'secondary'
		}
	];

	// State for quota testing
	let currentQuotaStatus = $state<{
		canStartConversation: boolean;
		remainingConversations: number;
		remainingSeconds: number;
		resetTime: Date;
		resetType: 'daily' | 'monthly';
		tier: string;
		quotaExceeded: boolean;
		upgradeRequired: boolean;
		dailyLimitReached?: boolean;
		monthlyLimitReached?: boolean;
	} | null>(null);

	let analysisQuotaStatus = $state<{
		canAnalyze: boolean;
		remainingAnalyses: number;
		resetTime: Date;
		resetType: 'daily' | 'monthly';
		tier: string;
		quotaExceeded: boolean;
		upgradeRequired: boolean;
		error?: string;
	} | null>(null);

	let selectedTier = $state('free');
	let isLoading = $state(false);

	function formatTime(seconds: number) {
		if (seconds >= 3600) {
			const hours = Math.floor(seconds / 3600);
			const minutes = Math.floor((seconds % 3600) / 60);
			return `${hours}h ${minutes}m`;
		} else {
			const minutes = Math.floor(seconds / 60);
			const remainingSeconds = seconds % 60;
			if (minutes === 0) {
				return `${remainingSeconds}s`;
			}
			return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
		}
	}

	function getDailyResetTime() {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		tomorrow.setHours(0, 0, 0, 0);
		return tomorrow.toLocaleString();
	}

	function getMonthlyResetTime() {
		const nextMonth = new Date();
		nextMonth.setMonth(nextMonth.getMonth() + 1);
		nextMonth.setDate(1);
		nextMonth.setHours(0, 0, 0, 0);
		return nextMonth.toLocaleString();
	}

	async function checkQuotaStatus() {
		isLoading = true;
		try {
			// Check conversation quota
			const convResponse = await fetch('/api/conversation/quota-check');
			if (convResponse.ok) {
				currentQuotaStatus = await convResponse.json();
			}

			// Check analysis quota
			const analysisResponse = await fetch('/api/analysis/quota-check');
			if (analysisResponse.ok) {
				analysisQuotaStatus = await analysisResponse.json();
			}
		} catch (error) {
			console.error('Failed to fetch quota status:', error);
		} finally {
			isLoading = false;
		}
	}

	async function simulateTierChange(tierId: string) {
		selectedTier = tierId;
		// In a real scenario, this would update the user's tier in the database
		console.log(`Simulating tier change to: ${tierId}`);
		await checkQuotaStatus();
	}

	// Load quota status on mount
	onMount(() => {
		checkQuotaStatus();
	});
</script>

<svelte:head>
	<title>Tier & Quota Testing - Dev Panel</title>
	<meta name="description" content="Test tier configurations and quota systems" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-base-100 to-base-200 p-6">
	<div class="container mx-auto max-w-6xl">
		<div class="mb-8">
			<h1 class="mb-2 text-3xl font-bold text-primary">⚡ Tier & Quota System Testing</h1>
			<p class="text-base-content/70">
				Test the enhanced tier configurations with daily and monthly limits
			</p>
		</div>

		<!-- Current User Status -->
		<div class="card mb-6 bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title text-xl">Current User Status</h2>
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div class="stat">
						<div class="stat-title">User Type</div>
						<div class="stat-value text-sm">
							{userManager.isLoggedIn ? 'Authenticated' : 'Guest'}
						</div>
						<div class="stat-desc">
							{userManager.isLoggedIn ? userManager.displayName : 'Not logged in'}
						</div>
					</div>
					<div class="stat">
						<div class="stat-title">Current Tier</div>
						<div class="stat-value text-primary text-sm">{userManager.effectiveTier}</div>
					</div>
					<div class="stat">
						<div class="stat-title">Quota Check</div>
						<div class="stat-actions">
							<button
								class="btn btn-primary btn-sm"
								onclick={checkQuotaStatus}
								disabled={isLoading}
							>
								{isLoading ? 'Checking...' : 'Check Quotas'}
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Quota Status Display -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
			<!-- Conversation Quota Status -->
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<h3 class="card-title text-lg flex items-center">
						<svg class="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
						</svg>
						Conversation Quota
					</h3>

					{#if currentQuotaStatus}
						<div class="space-y-3">
							<div class="flex justify-between items-center">
								<span class="text-sm font-medium">Can Start Conversation:</span>
								<div class="badge {currentQuotaStatus.canStartConversation ? 'badge-success' : 'badge-error'}">
									{currentQuotaStatus.canStartConversation ? 'Yes' : 'No'}
								</div>
							</div>

							{#if currentQuotaStatus.dailyLimitReached}
								<div class="alert alert-warning">
									<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
									</svg>
									<span class="text-xs">Daily limit reached! Resets: {getDailyResetTime()}</span>
								</div>
							{/if}

							<div class="grid grid-cols-2 gap-4 text-sm">
								<div>
									<div class="font-medium">Daily Conversations</div>
									<div class="text-base-content/60">
										{currentQuotaStatus.remainingConversations === -1
											? '∞'
											: currentQuotaStatus.remainingConversations} left
									</div>
								</div>
								<div>
									<div class="font-medium">Daily Time</div>
									<div class="text-base-content/60">
										{currentQuotaStatus.remainingSeconds === -1
											? '∞'
											: formatTime(currentQuotaStatus.remainingSeconds)} left
									</div>
								</div>
							</div>

							<div class="text-xs text-base-content/50">
								Resets: {currentQuotaStatus.resetType === 'daily' ? getDailyResetTime() : getMonthlyResetTime()}
							</div>
						</div>
					{:else}
						<div class="text-center py-4 text-base-content/50">
							Click "Check Quotas" to load status
						</div>
					{/if}
				</div>
			</div>

			<!-- Analysis Quota Status -->
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<h3 class="card-title text-lg flex items-center">
						<svg class="h-5 w-5 mr-2 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
						</svg>
						Analysis Quota
					</h3>

					{#if analysisQuotaStatus}
						<div class="space-y-3">
							<div class="flex justify-between items-center">
								<span class="text-sm font-medium">Can Analyze:</span>
								<div class="badge {analysisQuotaStatus.canAnalyze ? 'badge-success' : 'badge-error'}">
									{analysisQuotaStatus.canAnalyze ? 'Yes' : 'No'}
								</div>
							</div>

							{#if analysisQuotaStatus.quotaExceeded}
								<div class="alert alert-warning">
									<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
									</svg>
									<span class="text-xs">{analysisQuotaStatus.error}</span>
								</div>
							{/if}

							<div class="text-sm">
								<div class="font-medium">Remaining Analyses</div>
								<div class="text-base-content/60">
									{analysisQuotaStatus.remainingAnalyses === -1
										? '∞ unlimited'
										: analysisQuotaStatus.remainingAnalyses} left
								</div>
							</div>

							<div class="text-xs text-base-content/50">
								Tier: {analysisQuotaStatus.tier} | Resets: {analysisQuotaStatus.resetType === 'daily' ? 'Daily' : 'Monthly'}
							</div>
						</div>
					{:else}
						<div class="text-center py-4 text-base-content/50">
							Click "Check Quotas" to load status
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Tier Comparison Table -->
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title text-xl mb-4">Enhanced Tier Configurations</h2>
				<div class="overflow-x-auto">
					<table class="table table-zebra w-full">
						<thead>
							<tr>
								<th>Feature</th>
								<th class="text-center">
									<div class="badge badge-neutral">Free</div>
								</th>
								<th class="text-center">
									<div class="badge badge-primary">Plus</div>
								</th>
								<th class="text-center">
									<div class="badge badge-secondary">Premium</div>
								</th>
							</tr>
						</thead>
						<tbody>
							<tr class="bg-warning/5">
								<td class="font-semibold">🆕 Daily Conversations</td>
								<td class="text-center">
									<span class="badge badge-error badge-sm">1 per day</span>
								</td>
								<td class="text-center">
									<span class="badge badge-success badge-sm">Unlimited</span>
								</td>
								<td class="text-center">
									<span class="badge badge-success badge-sm">Unlimited</span>
								</td>
							</tr>
							<tr class="bg-warning/5">
								<td class="font-semibold">🆕 Daily Time Limit</td>
								<td class="text-center">
									<span class="badge badge-error badge-sm">3 min/day</span>
								</td>
								<td class="text-center">
									<span class="badge badge-success badge-sm">No limit</span>
								</td>
								<td class="text-center">
									<span class="badge badge-success badge-sm">No limit</span>
								</td>
							</tr>
							<tr class="bg-warning/5">
								<td class="font-semibold">🆕 Daily Analyses</td>
								<td class="text-center">
									<span class="badge badge-error badge-sm">1 per day</span>
								</td>
								<td class="text-center">
									<span class="badge badge-info badge-sm">10/month</span>
								</td>
								<td class="text-center">
									<span class="badge badge-success badge-sm">Unlimited</span>
								</td>
							</tr>
							<tr>
								<td>Monthly Time</td>
								<td class="text-center">{formatTime(900)}</td>
								<td class="text-center">{formatTime(18000)}</td>
								<td class="text-center">{formatTime(36000)}</td>
							</tr>
							<tr>
								<td>Max Session Length</td>
								<td class="text-center">{formatTime((tierConfigs.find(t => t.id === 'free')?.sessionSeconds) || 0)}</td>
								<td class="text-center">{formatTime((tierConfigs.find(t => t.id === 'plus')?.sessionSeconds) || 0)}</td>
								<td class="text-center">{formatTime((tierConfigs.find(t => t.id === 'premium')?.sessionSeconds) || 0)}</td>
							</tr>
							<tr>
								<td>Advanced Features</td>
								<td class="text-center">
									<span class="badge badge-ghost badge-sm">Basic</span>
								</td>
								<td class="text-center">
									<span class="badge badge-primary badge-sm">Full</span>
								</td>
								<td class="text-center">
									<span class="badge badge-secondary badge-sm">Premium</span>
								</td>
							</tr>
						</tbody>
					</table>
				</div>

				<div class="mt-6 p-4 bg-info/10 rounded-lg border border-info/20">
					<h3 class="font-semibold text-info mb-2">🎯 New Daily Limits Strategy</h3>
					<ul class="text-sm text-base-content/70 space-y-1">
						<li>• <strong>Free users:</strong> Daily limits encourage daily engagement and upgrades</li>
						<li>• <strong>Paid users:</strong> No daily limits, only generous monthly quotas</li>
						<li>• <strong>Analysis limits:</strong> Prevent AI cost abuse while encouraging feature usage</li>
						<li>• <strong>Conversation limits:</strong> Drive users to experience value before hitting limits</li>
					</ul>
				</div>
			</div>
		</div>

		<!-- API Testing Section -->
		<div class="card mt-6 bg-base-100 shadow-xl">
			<div class="card-body">
				<h3 class="card-title text-lg">🔧 API Endpoint Testing</h3>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<h4 class="font-semibold mb-2">Available Endpoints:</h4>
						<ul class="text-sm space-y-1 text-base-content/70">
							<li>• <code>GET /api/analysis/quota-check</code></li>
							<li>• <code>GET /api/conversation/quota-check</code></li>
							<li>• <code>POST /api/conversation/start</code> (with quota check)</li>
							<li>• <code>POST /api/analysis/analyze</code> (with quota tracking)</li>
						</ul>
					</div>
					<div>
						<h4 class="font-semibold mb-2">Testing Actions:</h4>
						<div class="flex flex-wrap gap-2">
							<button
								class="btn btn-outline btn-sm"
								onclick={checkQuotaStatus}
								disabled={isLoading}
							>
								Refresh Quotas
							</button>
							<a href="/dev/assessment-test" class="btn btn-primary btn-sm">
								Test Analysis Flow
							</a>
							<a href="/conversation?scenario=onboarding-welcome" class="btn btn-secondary btn-sm">
								Test Conversation
							</a>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
