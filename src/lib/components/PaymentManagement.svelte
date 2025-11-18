<script lang="ts">
	import TierBadge from '$lib/features/payments/components/TierBadge.svelte';
	import type { Subscription } from '$lib/server/db/types';
	import type { UsageStatus } from '$lib/server/tier.service';
	import type { UsageLimits } from '$lib/stores/conversation-timer.store.svelte';

	// Props from parent component
	const {
		data: _data,
		usageStatus,
		isLoadingUsage,
		loadUsageStatus,
		tierPricing,
		billingError,
		isManagingBilling,
		openBillingPortal,
		subscription: _subscription,
		usageLimits: _usageLimits
	}: {
		data: Record<string, unknown>;
		usageStatus: UsageStatus | null;
		isLoadingUsage: boolean;
		loadUsageStatus: () => Promise<void>;
		tierPricing: Record<string, string>;
		billingError: string;
		isManagingBilling: boolean;
		openBillingPortal: () => Promise<void>;
		subscription: Subscription | null;
		usageLimits: UsageLimits;
	} = $props();

	// Subscription management state
	let showUpgradeModal = $state(false);
	let selectedTier = $state<'plus' | 'premium'>('plus');
	let selectedBilling = $state<'monthly' | 'annual'>('monthly');
	let isProcessingUpgrade = $state(false);
	let upgradeError = $state('');

	// Subscription status state
	let subscriptionStatus = $state<{
		currentPeriodEnd: string | null;
		cancelAt: string | null;
		willCancelAtPeriodEnd: boolean;
		billingCycle: string;
	} | null>(null);
	let isLoadingStatus = $state(false);

	// Fetch subscription status
	async function fetchSubscriptionStatus() {
		if (usageStatus?.tier.id === 'free') return;

		isLoadingStatus = true;
		try {
			const response = await fetch('/api/billing/subscription-status');
			if (response.ok) {
				const data = await response.json();
				if (data.hasActiveSubscription) {
					subscriptionStatus = {
						currentPeriodEnd: data.currentPeriodEnd,
						cancelAt: data.cancelAt,
						willCancelAtPeriodEnd: data.willCancelAtPeriodEnd,
						billingCycle: data.billingCycle
					};
				}
			}
		} catch (error) {
			console.error('Failed to fetch subscription status:', error);
		} finally {
			isLoadingStatus = false;
		}
	}

	// Load subscription status when tier changes
	$effect(() => {
		if (usageStatus?.tier.id && usageStatus.tier.id !== 'free') {
			fetchSubscriptionStatus();
		}
	});

	// Format date for display
	function formatDate(dateString: string | null): string {
		if (!dateString) return '';
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	// Available tiers for upgrade
	const availableTiers: Array<{
		id: 'plus' | 'premium';
		name: string;
		monthlyPrice: string;
		annualPrice: string;
		features: string[];
		popular: boolean;
	}> = [
		{
			id: 'plus',
			name: 'Plus',
			monthlyPrice: '$19',
			annualPrice: '$190',
			features: ['Unlimited conversations', '60 audio minutes/month', 'Real-time conversations'],
			popular: true
		},
		{
			id: 'premium',
			name: 'Premium',
			monthlyPrice: '$29',
			annualPrice: '$290',
			features: [
				'Everything in Plus',
				'120 audio minutes/month',
				'Advanced analytics',
				'Priority support'
			],
			popular: false
		}
	];

	// Upgrade subscription
	const upgradeSubscription = async () => {
		isProcessingUpgrade = true;
		upgradeError = '';

		try {
			const response = await fetch('/api/stripe/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					tier: selectedTier,
					billing: selectedBilling,
					successPath: '/profile?upgraded=true',
					cancelPath: '/profile'
				})
			});

			if (response.ok) {
				const { url } = await response.json();
				window.location.href = url;
			} else {
				const _error = await response.json();
				upgradeError = _error.error || 'Failed to create checkout session';
			}
		} catch {
			upgradeError = 'Network error creating checkout session';
		} finally {
			isProcessingUpgrade = false;
		}
	};
</script>

<div class="space-y-6">
	<!-- Header with current plan overview -->
	<div class="card bg-base-100 shadow-xl">
		<div class="card-body">
			<div class="flex items-center justify-between">
				<h2 class="card-title text-xl">
					<span class="mr-2 icon-[mdi--credit-card] h-6 w-6"></span>
					Billing & Payments
				</h2>
				<div
					class="tooltip tooltip-left"
					data-tip="We use Stripe to securely manage all billing, payment methods, and invoices. We never store your payment information directly."
				>
					<span class="icon-[mdi--shield-check] h-6 w-6 text-info"></span>
				</div>
			</div>

			{#if billingError}
				<div class="mb-4 alert alert-error">
					<span class="icon-[mdi--alert-circle] h-6 w-6"></span>
					<span>{billingError}</span>
				</div>
			{/if}

			<!-- Current Plan Summary -->
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<div class="stat rounded-lg bg-base-200">
					<div class="stat-title">Current Plan</div>
					<div class="stat-value text-lg capitalize">
						<span
							class="badge badge-lg capitalize {usageStatus?.tier.id === 'free'
								? 'badge-neutral'
								: 'badge-primary'}"
						>
							{usageStatus?.tier.id || 'free'}
						</span>
					</div>
					<div class="stat-desc">
						{#if usageStatus?.tier.id !== 'free'}
							${tierPricing[usageStatus?.tier.id || 'free']}/month
						{:else}
							Limited features
						{/if}
					</div>
				</div>

				<div class="stat rounded-lg bg-base-200">
					<div class="stat-title">Usage Status</div>
					<div class="stat-value text-sm">
						{#if isLoadingUsage}
							<span class="loading loading-sm loading-spinner"></span>
						{:else if usageStatus}
							<TierBadge tierStatus={usageStatus} showDetails={false} />
						{:else}
							<span class="text-warning">Unable to load</span>
						{/if}
					</div>
					<div class="stat-actions">
						<button
							class="btn btn-ghost btn-xs"
							onclick={loadUsageStatus}
							disabled={isLoadingUsage}
						>
							<span class="icon-[mdi--refresh] h-3 w-3"></span>
							Refresh
						</button>
					</div>
				</div>
			</div>

			<!-- Subscription Renewal/End Date -->
			{#if usageStatus?.tier.id !== 'free' && (subscriptionStatus || isLoadingStatus)}
				<div class="mt-4 alert {subscriptionStatus?.willCancelAtPeriodEnd ? 'alert-warning' : 'alert-info'}">
					{#if isLoadingStatus}
						<span class="loading loading-sm loading-spinner"></span>
						<span>Loading subscription details...</span>
					{:else if subscriptionStatus}
						{#if subscriptionStatus.willCancelAtPeriodEnd}
							<span class="icon-[mdi--information] h-6 w-6"></span>
							<div>
								<h3 class="font-bold">Subscription Ending</h3>
								<div class="text-sm">
									Your subscription will end on <strong>{formatDate(subscriptionStatus.currentPeriodEnd)}</strong>.
									You'll continue to have access to {usageStatus?.tier.id} features until then.
									You can reactivate anytime before this date.
								</div>
							</div>
						{:else if subscriptionStatus.currentPeriodEnd}
							<span class="icon-[mdi--calendar-check] h-6 w-6"></span>
							<div>
								<h3 class="font-bold">Next Billing Date</h3>
								<div class="text-sm">
									Your subscription will renew on <strong>{formatDate(subscriptionStatus.currentPeriodEnd)}</strong>
									({subscriptionStatus.billingCycle === 'year' ? 'annual' : 'monthly'} billing).
								</div>
							</div>
						{/if}
					{/if}
				</div>
			{/if}

			<!-- Quick Actions -->
			<div class="flex flex-wrap items-center gap-2 pt-4">
				{#if usageStatus?.tier.id === 'free'}
					<button class="btn btn-primary" onclick={() => (showUpgradeModal = true)}>
						<span class="icon-[mdi--arrow-up] h-4 w-4"></span>
						Upgrade Plan
					</button>
				{:else}
					<button class="btn btn-primary" onclick={openBillingPortal} disabled={isManagingBilling}>
						{#if isManagingBilling}
							<span class="loading loading-sm loading-spinner"></span>
						{:else}
							<span class="icon-[mdi--external-link] h-4 w-4"></span>
						{/if}
						Manage Billing
					</button>
					<button class="btn btn-outline" onclick={() => (showUpgradeModal = true)}>
						<span class="icon-[mdi--arrow-up] h-4 w-4"></span>
						Change Plan
					</button>
				{/if}
				<p class="text-sm text-base-content/70">
					Use the Stripe billing portal to update your payment method, download invoices, or cancel
					your subscription.
				</p>
			</div>
			{#if usageStatus}
				<div class="mt-4 rounded-lg bg-base-200 p-4">
					<h4 class="mb-3 font-medium">Current Usage</h4>
					<TierBadge tierStatus={usageStatus} showDetails={true} />
				</div>

				<!-- Detailed Usage Breakdown -->
				<div class="mt-4 rounded-lg bg-base-200 p-4">
					<h4 class="mb-4 font-medium">Usage Breakdown</h4>
					<div class="space-y-4">
						<!-- Main Features -->
						<div>
							<h5 class="mb-2 text-sm font-semibold opacity-70">Main Features</h5>
							<div class="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
								<div class="flex items-center justify-between">
									<span>Conversations:</span>
									<span class="font-medium">{usageStatus.usage.conversationsUsed || 0}</span>
								</div>
								<div class="flex items-center justify-between">
									<span>Realtime Sessions:</span>
									<span class="font-medium">{usageStatus.usage.realtimeSessionsUsed || 0}</span>
								</div>
								<div class="flex items-center justify-between">
									<span>Session Extensions:</span>
									<span class="font-medium">{usageStatus.usage.sessionExtensionsUsed || 0}</span>
								</div>
								{#if (usageStatus.usage.bankedSeconds || 0) > 0}
									<div class="flex items-center justify-between">
										<span>Banked Seconds:</span>
										<span class="font-medium text-success"
											>{Math.floor((usageStatus.usage.bankedSeconds || 0) / 60)} min</span
										>
									</div>
								{/if}
								{#if (usageStatus.usage.bankedSecondsUsed || 0) > 0}
									<div class="flex items-center justify-between">
										<span>Banked Used:</span>
										<span class="font-medium"
											>{Math.floor((usageStatus.usage.bankedSecondsUsed || 0) / 60)} min</span
										>
									</div>
								{/if}
							</div>
						</div>

						<!-- Session Quality Metrics -->
						<div class="border-t border-base-300 pt-3">
							<h5 class="mb-2 text-sm font-semibold opacity-70">Session Quality</h5>
							<div class="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
								<div class="flex items-center justify-between">
									<span>Completed Sessions:</span>
									<span class="font-medium">{usageStatus.usage.completedSessions || 0}</span>
								</div>
								<div class="flex items-center justify-between">
									<span>Longest Session:</span>
									<span class="font-medium"
										>{Math.floor((usageStatus.usage.longestSessionSeconds || 0) / 60)} min</span
									>
								</div>
								{#if (usageStatus.usage.averageSessionSeconds || 0) > 0}
									<div class="flex items-center justify-between">
										<span>Avg Session:</span>
										<span class="font-medium"
											>{Math.floor((usageStatus.usage.averageSessionSeconds || 0) / 60)} min</span
										>
									</div>
								{/if}
							</div>
						</div>

						<!-- Analysis Usage -->
						<div class="border-t border-base-300 pt-3">
							<h5 class="mb-2 text-sm font-semibold opacity-70">Analyses</h5>
							<div class="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
								<div class="flex items-center justify-between">
									<span>Total Analyses:</span>
									<span class="font-medium">{usageStatus.usage.analysesUsed || 0}</span>
								</div>
								{#if (usageStatus.usage.basicAnalysesUsed || 0) > 0}
									<div class="flex items-center justify-between">
										<span>Basic:</span>
										<span class="font-medium">{usageStatus.usage.basicAnalysesUsed || 0}</span>
									</div>
								{/if}
								{#if (usageStatus.usage.advancedGrammarUsed || 0) > 0}
									<div class="flex items-center justify-between">
										<span>Grammar:</span>
										<span class="font-medium">{usageStatus.usage.advancedGrammarUsed || 0}</span>
									</div>
								{/if}
								{#if (usageStatus.usage.fluencyAnalysisUsed || 0) > 0}
									<div class="flex items-center justify-between">
										<span>Fluency:</span>
										<span class="font-medium">{usageStatus.usage.fluencyAnalysisUsed || 0}</span>
									</div>
								{/if}
								{#if (usageStatus.usage.pronunciationAnalysisUsed || 0) > 0}
									<div class="flex items-center justify-between">
										<span>Pronunciation:</span>
										<span class="font-medium"
											>{usageStatus.usage.pronunciationAnalysisUsed || 0}</span
										>
									</div>
								{/if}
								{#if (usageStatus.usage.speechRhythmUsed || 0) > 0}
									<div class="flex items-center justify-between">
										<span>Speech Rhythm:</span>
										<span class="font-medium">{usageStatus.usage.speechRhythmUsed || 0}</span>
									</div>
								{/if}
							</div>
						</div>

						<!-- Other Features -->
						{#if (usageStatus.usage.ankiExportsUsed || 0) > 0 || (usageStatus.usage.advancedVoiceSeconds || 0) > 0 || (usageStatus.usage.overageSeconds || 0) > 0}
							<div class="border-t border-base-300 pt-3">
								<h5 class="mb-2 text-sm font-semibold opacity-70">Additional Features</h5>
								<div class="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
									{#if (usageStatus.usage.ankiExportsUsed || 0) > 0}
										<div class="flex items-center justify-between">
											<span>Anki Exports:</span>
											<span class="font-medium">{usageStatus.usage.ankiExportsUsed || 0}</span>
										</div>
									{/if}
									{#if (usageStatus.usage.advancedVoiceSeconds || 0) > 0}
										<div class="flex items-center justify-between">
											<span>Advanced Voice:</span>
											<span class="font-medium"
												>{Math.floor((usageStatus.usage.advancedVoiceSeconds || 0) / 60)} min</span
											>
										</div>
									{/if}
									{#if (usageStatus.usage.overageSeconds || 0) > 0}
										<div class="flex items-center justify-between">
											<span class="text-warning">Overage Seconds:</span>
											<span class="font-medium text-warning"
												>{Math.floor((usageStatus.usage.overageSeconds || 0) / 60)} min</span
											>
										</div>
									{/if}
								</div>
							</div>
						{/if}

						<!-- Activity Dates -->
						{#if usageStatus.usage.lastConversationAt || usageStatus.usage.lastRealtimeAt}
							<div class="border-t border-base-300 pt-3 text-xs opacity-60">
								<div class="space-y-1">
									{#if usageStatus.usage.lastConversationAt}
										<div>
											Last conversation: {new Date(
												usageStatus.usage.lastConversationAt
											).toLocaleDateString()}
										</div>
									{/if}
									{#if usageStatus.usage.lastRealtimeAt}
										<div>
											Last realtime: {new Date(
												usageStatus.usage.lastRealtimeAt
											).toLocaleDateString()}
										</div>
									{/if}
									{#if usageStatus.usage.firstActivityAt}
										<div>
											First activity: {new Date(
												usageStatus.usage.firstActivityAt
											).toLocaleDateString()}
										</div>
									{/if}
								</div>
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Upgrade Modal -->
{#if showUpgradeModal}
	<div class="modal-open modal">
		<div class="modal-box max-w-2xl">
			<h3 class="mb-4 text-lg font-bold">Choose Your Plan</h3>

			<!-- Billing Toggle -->
			<div class="mb-6 flex justify-center">
				<div class="tabs-boxed tabs">
					<button
						class="tab {selectedBilling === 'monthly' ? 'tab-active' : ''}"
						onclick={() => (selectedBilling = 'monthly')}
					>
						Monthly
					</button>
					<button
						class="tab {selectedBilling === 'annual' ? 'tab-active' : ''}"
						onclick={() => (selectedBilling = 'annual')}
					>
						Annual <span class="ml-1 badge badge-sm badge-success">Save 20%</span>
					</button>
				</div>
			</div>

			<!-- Plan Options -->
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				{#each availableTiers as tier (tier.id)}
					<button
						type="button"
						class="card cursor-pointer border-2 {selectedTier === tier.id
							? 'border-primary'
							: 'border-base-300'} {tier.popular ? 'bg-primary/5' : 'bg-base-100'} text-left"
						onclick={() => (selectedTier = tier.id)}
						aria-label="Select {tier.name} plan"
					>
						<div class="card-body">
							{#if tier.popular}
								<div class="mb-2 badge badge-primary">Most Popular</div>
							{/if}
							<h4 class="card-title text-lg">{tier.name}</h4>
							<div class="text-2xl font-bold">
								{selectedBilling === 'monthly' ? tier.monthlyPrice : tier.annualPrice}
								<span class="text-sm font-normal text-base-content/70">
									/{selectedBilling === 'monthly' ? 'month' : 'year'}
								</span>
							</div>
							{#if selectedBilling === 'annual'}
								<div class="text-sm text-success">
									Save ${(
										parseFloat(tier.monthlyPrice.slice(1)) * 12 -
										parseFloat(tier.annualPrice.slice(1))
									).toFixed(0)} per year
								</div>
							{/if}
							<ul class="mt-4 space-y-2">
								{#each tier.features as feature, i (i)}
									<li class="flex items-center gap-2">
										<span class="icon-[mdi--check] h-4 w-4 text-success"></span>
										<span class="text-sm">{feature}</span>
									</li>
								{/each}
							</ul>
						</div>
					</button>
				{/each}
			</div>

			{#if upgradeError}
				<div class="mb-4 alert alert-error">
					<span class="icon-[mdi--alert-circle] h-5 w-5"></span>
					<span>{upgradeError}</span>
				</div>
			{/if}

			<div class="modal-action">
				<button class="btn btn-ghost" onclick={() => (showUpgradeModal = false)}>Cancel</button>
				<button
					class="btn btn-primary"
					onclick={upgradeSubscription}
					disabled={isProcessingUpgrade}
				>
					{#if isProcessingUpgrade}
						<span class="loading loading-sm loading-spinner"></span>
						Processing...
					{:else}
						Continue to Payment
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
