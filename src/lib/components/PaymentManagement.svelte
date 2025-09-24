<script lang="ts">
	import TierBadge from '$lib/features/payments/components/TierBadge.svelte';
	import type { UsageStatus } from '$lib/server/tier-service';

	// Props from parent component
	const {
		data,
		usageStatus,
		isLoadingUsage,
		loadUsageStatus,
		tierPricing,
		billingError,
		isManagingBilling,
		openBillingPortal,
		subscription,
		usageLimits
	}: {
		data: any;
		usageStatus: UsageStatus | null;
		isLoadingUsage: boolean;
		loadUsageStatus: () => Promise<void>;
		tierPricing: Record<string, string>;
		billingError: string;
		isManagingBilling: boolean;
		openBillingPortal: () => Promise<void>;
		subscription: any;
		usageLimits: any;
	} = $props();

	// Subscription management state
	let showUpgradeModal = $state(false);
	let selectedTier = $state<'plus' | 'premium'>('plus');
	let selectedBilling = $state<'monthly' | 'annual'>('monthly');
	let isProcessingUpgrade = $state(false);
	let upgradeError = $state('');

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
				const error = await response.json();
				upgradeError = error.error || 'Failed to create checkout session';
			}
		} catch (error) {
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
			<h2 class="mb-4 card-title text-xl">
				<span class="mr-2 icon-[mdi--credit-card] h-6 w-6"></span>
				Billing & Payments
			</h2>

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
							class="badge badge-lg capitalize {usageLimits?.currentTier === 'free'
								? 'badge-neutral'
								: 'badge-primary'}"
						>
							{usageLimits?.currentTier || 'free'}
						</span>
					</div>
					<div class="stat-desc">
						{#if usageLimits?.currentTier !== 'free'}
							${tierPricing[usageLimits?.currentTier || 'free']}/month
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

			<!-- Quick Actions -->
			<div class="flex flex-wrap gap-2 pt-4">
				{#if usageLimits?.currentTier === 'free'}
					<button class="btn btn-primary" onclick={() => (showUpgradeModal = true)}>
						<span class="icon-[mdi--arrow-up] h-4 w-4"></span>
						Upgrade Plan
					</button>
				{:else}
					<button class="btn btn-outline" onclick={openBillingPortal} disabled={isManagingBilling}>
						{#if isManagingBilling}
							<span class="loading loading-sm loading-spinner"></span>
						{:else}
							<span class="icon-[mdi--external-link] h-4 w-4"></span>
						{/if}
						Manage Billing in Stripe
					</button>
					<button class="btn btn-outline" onclick={() => (showUpgradeModal = true)}>
						<span class="icon-[mdi--arrow-up] h-4 w-4"></span>
						Change Plan
					</button>
				{/if}
			</div>
		</div>
	</div>

	<!-- Billing Management Info -->
	<div class="card bg-base-100 shadow-xl">
		<div class="card-body">
			<h3 class="mb-4 text-lg font-semibold">
				<span class="mr-2 icon-[mdi--information-outline] h-5 w-5"></span>
				Billing Management
			</h3>

			<div class="space-y-4">
				<div class="rounded-lg bg-base-200/50 p-4">
					<div class="flex items-start gap-3">
						<span class="mt-0.5 icon-[mdi--credit-card-outline] h-6 w-6 text-primary"></span>
						<div class="flex-1">
							<h4 class="mb-2 font-medium">Payment Methods & Invoices</h4>
							<p class="mb-3 text-sm text-base-content/70">
								We use Stripe to securely manage all billing, payment methods, and invoices. Click
								"Manage Billing in Stripe" above to:
							</p>
							<ul class="list-inside list-disc space-y-1 text-sm text-base-content/70">
								<li>Add or update payment methods</li>
								<li>View and download invoices</li>
								<li>Update billing information</li>
								<li>Cancel or modify your subscription</li>
							</ul>
						</div>
					</div>
				</div>

				<div class="rounded-lg border border-info/20 bg-info/10 p-4">
					<div class="flex items-start gap-3">
						<span class="mt-0.5 icon-[mdi--shield-check] h-6 w-6 text-info"></span>
						<div class="flex-1">
							<h4 class="mb-1 font-medium text-info">Secure & Trusted</h4>
							<p class="text-sm text-base-content/70">
								You'll be redirected to Stripe's secure portal where you can safely manage all
								aspects of your billing. We never store your payment information directly.
							</p>
						</div>
					</div>
				</div>

				{#if usageStatus && usageLimits?.currentTier !== 'free'}
					<div class="rounded-lg bg-base-200 p-4">
						<h4 class="mb-3 font-medium">Current Usage</h4>
						<TierBadge tierStatus={usageStatus} showDetails={true} />
					</div>
				{/if}
			</div>
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
