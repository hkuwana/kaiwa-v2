<script lang="ts">
	import { onMount } from 'svelte';
	import { userManager } from '$lib/stores/user.store.svelte';
	import { SvelteDate } from 'svelte/reactivity';
	import TierBadge from '$lib/features/payments/components/TierBadge.svelte';
	import type { UsageStatus } from '$lib/server/tier.service';
	import { defaultTierConfigs, type UserTier } from '$lib/data/tiers';

	// Use real tier configurations from data/tiers.ts

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

	let isLoading = $state(false);

	// Mock usage status for TierBadge testing
	let mockUsageStatus = $state<UsageStatus>({
		tier: {
			id: 'free',
			name: 'Free',
			description: 'Basic plan',
			monthlyConversations: 10,
			monthlySeconds: 1800,
			monthlyRealtimeSessions: 3,
			customizedPhrasesFrequency: 'weekly',
			conversationMemoryLevel: 'basic',
			ankiExportLimit: 50,
			dailyConversations: 1,
			dailySeconds: 180,
			dailyAnalyses: 1,
			maxSessionLengthSeconds: 180,
			sessionBankingEnabled: false,
			maxBankedSeconds: 0,
			hasRealtimeAccess: true,
			hasAdvancedVoices: false,
			hasAnalytics: false,
			hasDeepAnalysis: false,
			hasCustomPhrases: false,
			hasConversationMemory: false,
			hasAnkiExport: false,
			monthlyPriceUsd: '0',
			annualPriceUsd: '0',
			stripeProductId: null,
			stripePriceIdMonthly: null,
			stripePriceIdAnnual: null,
			overagePricePerMinuteInCents: 0,
			conversationTimeoutSeconds: 300,
			warningThresholdSeconds: 240,
			canExtend: false,
			maxExtensions: 0,
			extensionDurationSeconds: 0,
			feedbackSessionsPerMonth: '0',
			maxMemories: 10,
			isActive: true,
			createdAt: new SvelteDate(),
			updatedAt: new SvelteDate()
		},
		usage: {
			createdAt: new SvelteDate(),
			userId: 'demo-user',
			updatedAt: new SvelteDate(),
			period: '2024-01',
			conversationsUsed: 8,
			secondsUsed: 1500,
			realtimeSessionsUsed: 2,
			bankedSeconds: 0,
			bankedSecondsUsed: 0,
			ankiExportsUsed: 0,
			sessionExtensionsUsed: 0,
			advancedVoiceSeconds: 0,
			analysesUsed: 5,
			// Simplified analysis usage fields for MVP
			basicAnalysesUsed: 3,
			advancedGrammarUsed: 1,
			fluencyAnalysisUsed: 1,
			onboardingProfileUsed: 0,
			pronunciationAnalysisUsed: 0,
			speechRhythmUsed: 0,
			completedSessions: 6,
			longestSessionSeconds: 900,
			averageSessionSeconds: 300,
			overageSeconds: 0,
			tierWhenUsed: 'free',
			lastConversationAt: new SvelteDate(),
			lastRealtimeAt: new SvelteDate(Date.now() - 2 * 86400000),
			firstActivityAt: new SvelteDate(Date.now() - 20 * 86400000),
			quickStatsUsed: null,
			grammarSuggestionsUsed: null,
			phraseSuggestionsUsed: null,
			audioSuggestionUsed: null,
			dailyUsage: null,
			lastAnalysisAt: null
		},
		canStartConversation: true,
		canUseRealtime: true,
		resetDate: new SvelteDate(Date.now() + 20 * 24 * 60 * 60 * 1000)
	});

	function switchMockTier(tierId: UserTier) {
		const tierConfig = defaultTierConfigs[tierId];
		if (!tierConfig) return;

		// Update tier info
		mockUsageStatus.tier.id = tierId;
		mockUsageStatus.tier.name = tierConfig.name;
		mockUsageStatus.tier.description = tierConfig.description;
		mockUsageStatus.tier.monthlyConversations = tierConfig.monthlyConversations;
		mockUsageStatus.tier.monthlySeconds = tierConfig.monthlySeconds;
		mockUsageStatus.tier.monthlyRealtimeSessions = tierConfig.monthlyRealtimeSessions;
		mockUsageStatus.tier.dailyConversations = tierConfig.dailyConversations;
		mockUsageStatus.tier.dailySeconds = tierConfig.dailySeconds;
		mockUsageStatus.tier.dailyAnalyses = tierConfig.dailyAnalyses;
		mockUsageStatus.tier.maxSessionLengthSeconds = tierConfig.maxSessionLengthSeconds;
		mockUsageStatus.tier.hasAnalytics = tierConfig.hasAnalytics;
		mockUsageStatus.tier.hasAdvancedVoices = tierConfig.hasAdvancedVoices;
		mockUsageStatus.tier.hasCustomPhrases = tierConfig.hasCustomPhrases;
		mockUsageStatus.tier.hasConversationMemory = tierConfig.hasConversationMemory;
		mockUsageStatus.tier.hasAnkiExport = tierConfig.hasAnkiExport;
		mockUsageStatus.tier.monthlyPriceUsd = tierConfig.monthlyPriceUsd;
		mockUsageStatus.tier.annualPriceUsd = tierConfig.annualPriceUsd;

		// Adjust usage based on tier to show realistic scenarios
		if (tierId === 'free') {
			mockUsageStatus.usage.conversationsUsed = 8;
			mockUsageStatus.usage.secondsUsed = 720; // 12 minutes out of 15
			mockUsageStatus.canStartConversation = true;
		} else if (tierId === 'plus') {
			mockUsageStatus.usage.conversationsUsed = 45;
			mockUsageStatus.usage.secondsUsed = 12600; // 3.5 hours out of 5 hours
			mockUsageStatus.canStartConversation = true;
		} else {
			mockUsageStatus.usage.conversationsUsed = 80;
			mockUsageStatus.usage.secondsUsed = 28800; // 8 hours out of 10 hours
			mockUsageStatus.canStartConversation = true;
		}
	}

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
		const tomorrow = new SvelteDate();
		tomorrow.setDate(tomorrow.getDate() + 1);
		tomorrow.setHours(0, 0, 0, 0);
		return tomorrow.toLocaleString();
	}

	function getMonthlyResetTime() {
		const nextMonth = new SvelteDate();
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
				<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
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
						<div class="stat-value text-sm text-primary">{userManager.effectiveTier}</div>
					</div>
					<div class="stat">
						<div class="stat-title">Quota Check</div>
						<div class="stat-actions">
							<button
								class="btn btn-sm btn-primary"
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

		<!-- TierBadge Component Testing -->
		<div class="card mb-6 bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title text-xl">
					<span class="icon-[mdi--trophy] h-5 w-5 text-warning"></span>
					TierBadge Component Testing
				</h2>
				<div class="space-y-4">
					<!-- Tier Selection -->
					<div>
						<h3 class="mb-2 text-lg font-semibold">Switch Mock Tier:</h3>
						<div class="flex gap-2">
							<button
								class="btn btn-sm {mockUsageStatus.tier.id === 'free'
									? 'btn-active'
									: 'btn-outline'}"
								onclick={() => switchMockTier('free')}
							>
								<span class="icon-[mdi--account-outline] h-4 w-4"></span>
								Free
							</button>
							<button
								class="btn btn-sm {mockUsageStatus.tier.id === 'plus'
									? 'btn-active btn-primary'
									: 'btn-outline'}"
								onclick={() => switchMockTier('plus')}
							>
								<span class="icon-[mdi--star] h-4 w-4"></span>
								Plus
							</button>
							<button
								class="btn btn-sm {mockUsageStatus.tier.id === 'premium'
									? 'btn-active btn-secondary'
									: 'btn-outline'}"
								onclick={() => switchMockTier('premium')}
							>
								<span class="icon-[mdi--crown] h-4 w-4"></span>
								Premium
							</button>
						</div>
					</div>

					<!-- TierBadge Display -->
					<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
						<div class="space-y-3">
							<h4 class="font-semibold">Simple Badge (showDetails=false):</h4>
							<div class="rounded-lg border bg-base-200 p-4">
								<TierBadge tierStatus={mockUsageStatus} showDetails={false} />
							</div>
						</div>

						<div class="space-y-3">
							<h4 class="font-semibold">Detailed Badge (showDetails=true):</h4>
							<div class="rounded-lg border bg-base-200 p-4">
								<TierBadge tierStatus={mockUsageStatus} showDetails={true} />
							</div>
						</div>
					</div>

					<!-- Current Mock Data Display -->
					<div class="rounded-lg border border-info/20 bg-info/10 p-4">
						<h4 class="mb-2 font-semibold text-info">Current Mock Data:</h4>
						<div class="text-sm text-base-content/70">
							<p><strong>Tier:</strong> {mockUsageStatus.tier.name} ({mockUsageStatus.tier.id})</p>
							<p>
								<strong>Conversations:</strong>
								{mockUsageStatus.usage.conversationsUsed}/{mockUsageStatus.tier
									.monthlyConversations}
							</p>
							<p>
								<strong>Time:</strong>
								{formatTime(mockUsageStatus.usage.secondsUsed ?? 0)}/{formatTime(
									mockUsageStatus.tier.monthlySeconds
								)}
							</p>
							<p>
								<strong>Realtime:</strong>
								{mockUsageStatus.usage.realtimeSessionsUsed}/{mockUsageStatus.tier
									.monthlyRealtimeSessions}
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Quota Status Display -->
		<div class="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
			<!-- Conversation Quota Status -->
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<h3 class="card-title flex items-center text-lg">
						<svg
							class="mr-2 h-5 w-5 text-primary"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
							/>
						</svg>
						Conversation Quota
					</h3>

					{#if currentQuotaStatus}
						<div class="space-y-3">
							<div class="flex items-center justify-between">
								<span class="text-sm font-medium">Can Start Conversation:</span>
								<div
									class="badge {currentQuotaStatus.canStartConversation
										? 'badge-success'
										: 'badge-error'}"
								>
									{currentQuotaStatus.canStartConversation ? 'Yes' : 'No'}
								</div>
							</div>

							{#if currentQuotaStatus.dailyLimitReached}
								<div class="alert alert-warning">
									<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
										/>
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
								Resets: {currentQuotaStatus.resetType === 'daily'
									? getDailyResetTime()
									: getMonthlyResetTime()}
							</div>
						</div>
					{:else}
						<div class="py-4 text-center text-base-content/50">
							Click "Check Quotas" to load status
						</div>
					{/if}
				</div>
			</div>

			<!-- Analysis Quota Status -->
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<h3 class="card-title flex items-center text-lg">
						<svg
							class="mr-2 h-5 w-5 text-secondary"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
							/>
						</svg>
						Analysis Quota
					</h3>

					{#if analysisQuotaStatus}
						<div class="space-y-3">
							<div class="flex items-center justify-between">
								<span class="text-sm font-medium">Can Analyze:</span>
								<div
									class="badge {analysisQuotaStatus.canAnalyze ? 'badge-success' : 'badge-error'}"
								>
									{analysisQuotaStatus.canAnalyze ? 'Yes' : 'No'}
								</div>
							</div>

							{#if analysisQuotaStatus.quotaExceeded}
								<div class="alert alert-warning">
									<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
										/>
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
								Tier: {analysisQuotaStatus.tier} | Resets: {analysisQuotaStatus.resetType ===
								'daily'
									? 'Daily'
									: 'Monthly'}
							</div>
						</div>
					{:else}
						<div class="py-4 text-center text-base-content/50">
							Click "Check Quotas" to load status
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Tier Comparison Table -->
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="mb-4 card-title text-xl">Enhanced Tier Configurations</h2>
				<div class="overflow-x-auto">
					<table class="table w-full table-zebra">
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
								<td class="font-semibold">Daily Conversations</td>
								<td class="text-center">
									<span class="badge badge-sm badge-error">
										{defaultTierConfigs.free.dailyConversations || 'Unlimited'}
									</span>
								</td>
								<td class="text-center">
									<span class="badge badge-sm badge-success">
										{defaultTierConfigs.plus.dailyConversations || 'Unlimited'}
									</span>
								</td>
								<td class="text-center">
									<span class="badge badge-sm badge-success">
										{defaultTierConfigs.premium.dailyConversations || 'Unlimited'}
									</span>
								</td>
							</tr>
							<tr class="bg-warning/5">
								<td class="font-semibold">Daily Time Limit</td>
								<td class="text-center">
									<span class="badge badge-sm badge-error">
										{formatTime(defaultTierConfigs.free.dailySeconds || 0)}
									</span>
								</td>
								<td class="text-center">
									<span class="badge badge-sm badge-success">
										{defaultTierConfigs.plus.dailySeconds
											? formatTime(defaultTierConfigs.plus.dailySeconds)
											: 'No limit'}
									</span>
								</td>
								<td class="text-center">
									<span class="badge badge-sm badge-success">
										{defaultTierConfigs.premium.dailySeconds
											? formatTime(defaultTierConfigs.premium.dailySeconds)
											: 'No limit'}
									</span>
								</td>
							</tr>
							<tr class="bg-warning/5">
								<td class="font-semibold">Daily Analyses</td>
								<td class="text-center">
									<span class="badge badge-sm badge-error">
										{defaultTierConfigs.free.dailyAnalyses || 'Unlimited'}
									</span>
								</td>
								<td class="text-center">
									<span class="badge badge-sm badge-success">
										{defaultTierConfigs.plus.dailyAnalyses || 'Unlimited'}
									</span>
								</td>
								<td class="text-center">
									<span class="badge badge-sm badge-success">
										{defaultTierConfigs.premium.dailyAnalyses || 'Unlimited'}
									</span>
								</td>
							</tr>
							<tr>
								<td>Monthly Time</td>
								<td class="text-center">{formatTime(defaultTierConfigs.free.monthlySeconds)}</td>
								<td class="text-center">{formatTime(defaultTierConfigs.plus.monthlySeconds)}</td>
								<td class="text-center">{formatTime(defaultTierConfigs.premium.monthlySeconds)}</td>
							</tr>
							<tr>
								<td>Max Session Length</td>
								<td class="text-center"
									>{formatTime(defaultTierConfigs.free.maxSessionLengthSeconds)}</td
								>
								<td class="text-center"
									>{formatTime(defaultTierConfigs.plus.maxSessionLengthSeconds)}</td
								>
								<td class="text-center"
									>{formatTime(defaultTierConfigs.premium.maxSessionLengthSeconds)}</td
								>
							</tr>
							<tr>
								<td>Memory Level</td>
								<td class="text-center">
									<span class="badge badge-ghost badge-sm"
										>{defaultTierConfigs.free.conversationMemoryLevel}</span
									>
								</td>
								<td class="text-center">
									<span class="badge badge-sm badge-primary"
										>{defaultTierConfigs.plus.conversationMemoryLevel}</span
									>
								</td>
								<td class="text-center">
									<span class="badge badge-sm badge-secondary"
										>{defaultTierConfigs.premium.conversationMemoryLevel}</span
									>
								</td>
							</tr>
							<tr>
								<td>Pricing</td>
								<td class="text-center">
									<span class="badge badge-ghost badge-sm"
										>${defaultTierConfigs.free.monthlyPriceUsd}/mo</span
									>
								</td>
								<td class="text-center">
									<span class="badge badge-sm badge-primary"
										>${defaultTierConfigs.plus.monthlyPriceUsd}/mo</span
									>
								</td>
								<td class="text-center">
									<span class="badge badge-sm badge-secondary"
										>${defaultTierConfigs.premium.monthlyPriceUsd}/mo</span
									>
								</td>
							</tr>
						</tbody>
					</table>
				</div>

				<div class="mt-6 rounded-lg border border-info/20 bg-info/10 p-4">
					<h3 class="mb-2 font-semibold text-info">🎯 New Daily Limits Strategy</h3>
					<ul class="space-y-1 text-sm text-base-content/70">
						<li>
							• <strong>Free users:</strong> Daily limits encourage daily engagement and upgrades
						</li>
						<li>• <strong>Paid users:</strong> No daily limits, only generous monthly quotas</li>
						<li>
							• <strong>Analysis limits:</strong> Prevent AI cost abuse while encouraging feature usage
						</li>
						<li>
							• <strong>Conversation limits:</strong> Drive users to experience value before hitting
							limits
						</li>
					</ul>
				</div>
			</div>
		</div>

		<!-- API Testing Section -->
		<div class="card mt-6 bg-base-100 shadow-xl">
			<div class="card-body">
				<h3 class="card-title text-lg">🔧 API Endpoint Testing</h3>
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div>
						<h4 class="mb-2 font-semibold">Available Endpoints:</h4>
						<ul class="space-y-1 text-sm text-base-content/70">
							<li>• <code>GET /api/analysis/quota-check</code></li>
							<li>• <code>GET /api/conversation/quota-check</code></li>
							<li>• <code>POST /api/conversation/start</code> (with quota check)</li>
							<li>• <code>POST /api/analysis/analyze</code> (with quota tracking)</li>
						</ul>
					</div>
					<div>
						<h4 class="mb-2 font-semibold">Testing Actions:</h4>
						<div class="flex flex-wrap gap-2">
							<button
								class="btn btn-outline btn-sm"
								onclick={checkQuotaStatus}
								disabled={isLoading}
							>
								Refresh Quotas
							</button>
							<a href="/dev/assessment-test" class="btn btn-sm btn-primary"> Test Analysis Flow </a>
							<a href="/conversation?scenario=onboarding-welcome" class="btn btn-sm btn-secondary">
								Test Conversation
							</a>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
