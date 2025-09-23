<script lang="ts">
	import TierBadge from '$lib/features/payments/components/TierBadge.svelte';
	import type { UsageStatus } from '$lib/server/tierService';

	// Type definitions
	interface PaymentMethod {
		id: string;
		last4: string;
		brand: string;
		exp_month: number;
		exp_year: number;
		is_default: boolean;
	}

	interface Invoice {
		id: string;
		amount_paid: number;
		currency: string;
		created: number;
		status: string;
		invoice_pdf?: string;
	}

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
		pauseSubscription,
		cancelSubscription,
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
		pauseSubscription: () => Promise<void>;
		cancelSubscription: () => Promise<void>;
		subscription: any;
		usageLimits: any;
	} = $props();

	// Payment method state
	let showAddPaymentModal = $state(false);
	let paymentMethodError = $state('');

	// Subscription management state
	let showUpgradeModal = $state(false);
	let selectedTier = $state<'plus' | 'premium'>('plus');
	let selectedBilling = $state<'monthly' | 'annual'>('monthly');
	let isProcessingUpgrade = $state(false);

	// Data loading promises
	let paymentMethodsPromise = $state<Promise<PaymentMethod[]>>();
	let invoiceHistoryPromise = $state<Promise<Invoice[]>>();

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

	// Load payment methods
	const loadPaymentMethods = async (): Promise<PaymentMethod[]> => {
		paymentMethodError = '';

		try {
			const response = await fetch('/api/billing/payment-methods');
			if (response.ok) {
				const result = await response.json();
				return result.paymentMethods || [];
			} else if (response.status === 404) {
				// API endpoint doesn't exist yet, return mock data
				return [
					{
						id: 'pm_mock1',
						last4: '4242',
						brand: 'visa',
						exp_month: 12,
						exp_year: 2025,
						is_default: true
					},
					{
						id: 'pm_mock2',
						last4: '1234',
						brand: 'mastercard',
						exp_month: 8,
						exp_year: 2026,
						is_default: false
					}
				];
			} else {
				const error = await response.json();
				throw new Error(error.error || 'Failed to load payment methods');
			}
		} catch (error) {
			if (error instanceof TypeError) {
				// Network error, return empty array
				console.warn('Payment methods API not available, using fallback');
				return [];
			}
			throw error;
		}
	};

	// Load invoice history
	const loadInvoiceHistory = async (): Promise<Invoice[]> => {
		try {
			const response = await fetch('/api/billing/invoices');
			if (response.ok) {
				const result = await response.json();
				return result.invoices || [];
			} else if (response.status === 404) {
				// API endpoint doesn't exist yet, return mock data
				return [
					{
						id: 'in_mock1',
						amount_paid: 1900,
						currency: 'usd',
						created: Math.floor(Date.now() / 1000) - 86400 * 30,
						status: 'paid',
						invoice_pdf: '#'
					},
					{
						id: 'in_mock2',
						amount_paid: 1900,
						currency: 'usd',
						created: Math.floor(Date.now() / 1000) - 86400 * 60,
						status: 'paid',
						invoice_pdf: '#'
					}
				];
			} else {
				throw new Error('Failed to load invoice history');
			}
		} catch (error) {
			if (error instanceof TypeError) {
				// Network error, return empty array
				console.warn('Invoice history API not available, using fallback');
				return [];
			}
			throw error;
		}
	};

	// Add payment method - redirect to Stripe billing portal
	const addPaymentMethod = async () => {
		paymentMethodError = '';

		try {
			// Use the same billing portal that's used for general billing management
			// This will allow users to add/remove payment methods through Stripe's interface
			await openBillingPortal();
			showAddPaymentModal = false;
		} catch (error) {
			paymentMethodError = 'Unable to open payment management portal';
		}
	};

	// Remove payment method
	const removePaymentMethod = async (paymentMethodId: string) => {
		if (!confirm('Are you sure you want to remove this payment method?')) return;

		try {
			const response = await fetch(`/api/billing/payment-methods/${paymentMethodId}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				// Reload payment methods
				paymentMethodsPromise = loadPaymentMethods();
			} else if (response.status === 404) {
				// API doesn't exist, just reload with mock data
				paymentMethodsPromise = loadPaymentMethods();
			} else {
				const error = await response.json();
				paymentMethodError = error.error || 'Failed to remove payment method';
			}
		} catch (error) {
			paymentMethodError = 'Network error removing payment method';
		}
	};

	// Upgrade subscription
	const upgradeSubscription = async () => {
		isProcessingUpgrade = true;

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
				paymentMethodError = error.error || 'Failed to create checkout session';
			}
		} catch (error) {
			paymentMethodError = 'Network error creating checkout session';
		} finally {
			isProcessingUpgrade = false;
		}
	};

	// Initialize data loading promises
	paymentMethodsPromise = loadPaymentMethods();
	invoiceHistoryPromise = loadInvoiceHistory();
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
							<span class="icon-[mdi--settings] h-4 w-4"></span>
						{/if}
						Manage Billing
					</button>
					<button class="btn btn-outline" onclick={() => (showUpgradeModal = true)}>
						<span class="icon-[mdi--arrow-up] h-4 w-4"></span>
						Change Plan
					</button>
				{/if}
			</div>
		</div>
	</div>

	<!-- Payment Methods -->
	<div class="card bg-base-100 shadow-xl">
		<div class="card-body">
			<div class="mb-4 flex items-center justify-between">
				<h3 class="text-lg font-semibold">
					<span class="mr-2 icon-[mdi--credit-card-outline] h-5 w-5"></span>
					Payment Methods
				</h3>
				<button class="btn btn-outline btn-sm" onclick={() => (showAddPaymentModal = true)}>
					<span class="icon-[mdi--credit-card-plus] h-4 w-4"></span>
					Manage Payment Methods
				</button>
			</div>

			{#if paymentMethodError}
				<div class="mb-4 alert alert-error">
					<span class="icon-[mdi--alert-circle] h-5 w-5"></span>
					<span>{paymentMethodError}</span>
				</div>
			{/if}

			{#await paymentMethodsPromise}
				<div class="space-y-3">
					{#each Array(2) as _, i (i)}
						<div class="flex items-center gap-4">
							<div class="h-12 w-12 skeleton rounded-lg"></div>
							<div class="flex-1">
								<div class="mb-2 h-4 w-24 skeleton"></div>
								<div class="h-3 w-32 skeleton"></div>
							</div>
							<div class="h-8 w-16 skeleton"></div>
						</div>
					{/each}
				</div>
			{:then paymentMethods}
				{@const methods = paymentMethods || []}
				{#if methods.length === 0}
					<div class="py-8 text-center">
						<span class="mx-auto mb-4 icon-[mdi--credit-card-off] h-16 w-16 text-base-content/30"
						></span>
						<p class="text-base-content/70">No payment methods on file</p>
						<p class="text-sm text-base-content/50">
							Add a payment method to manage your subscription
						</p>
					</div>
				{:else}
					<div class="space-y-3">
						{#each methods as method (method.id)}
							<div class="flex items-center gap-4 rounded-lg border border-base-300 p-4">
								<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
									<span class="icon-[mdi--credit-card] h-6 w-6 text-primary"></span>
								</div>
								<div class="flex-1">
									<div class="font-medium">**** **** **** {method.last4}</div>
									<div class="text-sm text-base-content/70">
										{method.brand?.toUpperCase()} • Expires {method.exp_month}/{method.exp_year}
									</div>
								</div>
								{#if method.is_default}
									<span class="badge badge-primary">Default</span>
								{/if}
								<button
									class="btn btn-ghost btn-sm"
									onclick={() => removePaymentMethod(method.id)}
									aria-label="Remove payment method"
								>
									<span class="icon-[mdi--delete] h-4 w-4"></span>
								</button>
							</div>
						{/each}
					</div>
				{/if}
			{:catch error}
				<div class="alert alert-error">
					<span class="icon-[mdi--alert-circle] h-5 w-5"></span>
					<span>Failed to load payment methods: {error.message}</span>
				</div>
			{/await}
		</div>
	</div>

	<!-- Subscription Management -->
	{#if usageLimits?.currentTier !== 'free'}
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h3 class="mb-4 text-lg font-semibold">
					<span class="mr-2 icon-[mdi--calendar-clock] h-5 w-5"></span>
					Subscription Management
				</h3>

				<div class="space-y-4">
					<!-- Detailed usage if available -->
					{#if usageStatus}
						<div class="rounded-lg bg-base-200 p-4">
							<TierBadge tierStatus={usageStatus} showDetails={true} />
						</div>
					{/if}

					<!-- Quick Actions -->
					<div class="flex flex-wrap gap-2">
						<button
							class="btn btn-outline btn-sm"
							onclick={pauseSubscription}
							disabled={isManagingBilling}
						>
							<span class="icon-[mdi--pause] h-4 w-4"></span>
							Pause Subscription
						</button>
						<button
							class="btn btn-outline btn-sm btn-error"
							onclick={cancelSubscription}
							disabled={isManagingBilling}
						>
							<span class="icon-[mdi--cancel] h-4 w-4"></span>
							Cancel Subscription
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Invoice History -->
	<div class="card bg-base-100 shadow-xl">
		<div class="card-body">
			<h3 class="mb-4 text-lg font-semibold">
				<span class="mr-2 icon-[mdi--receipt] h-5 w-5"></span>
				Invoice History
			</h3>

			{#await invoiceHistoryPromise}
				<div class="space-y-3">
					{#each Array(3) as _, i (i)}
						<div class="flex items-center justify-between">
							<div class="flex-1">
								<div class="mb-2 h-4 w-32 skeleton"></div>
								<div class="h-3 w-24 skeleton"></div>
							</div>
							<div class="h-8 w-20 skeleton"></div>
						</div>
					{/each}
				</div>
			{:then invoiceHistory}
				{#if invoiceHistory.length === 0}
					<div class="py-8 text-center">
						<span class="mx-auto mb-4 icon-[mdi--receipt-outline] h-16 w-16 text-base-content/30"
						></span>
						<p class="text-base-content/70">No invoices yet</p>
						<p class="text-sm text-base-content/50">Your billing history will appear here</p>
					</div>
				{:else}
					<div class="space-y-3">
						{#each invoiceHistory as invoice (invoice.id)}
							<div class="flex items-center justify-between rounded-lg border border-base-300 p-4">
								<div class="flex-1">
									<div class="font-medium">
										${(invoice.amount_paid / 100).toFixed(2)}
										{invoice.currency.toUpperCase()}
									</div>
									<div class="text-sm text-base-content/70">
										{new Date(invoice.created * 1000).toLocaleDateString()} •
										<span class="capitalize">{invoice.status}</span>
									</div>
								</div>
								{#if invoice.invoice_pdf}
									<a
										href={invoice.invoice_pdf}
										target="_blank"
										class="btn btn-ghost btn-sm"
										rel="noopener noreferrer"
									>
										<span class="icon-[mdi--download] h-4 w-4"></span>
										Download
									</a>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			{:catch error}
				<div class="alert alert-error">
					<span class="icon-[mdi--alert-circle] h-5 w-5"></span>
					<span>Failed to load invoice history: {error.message}</span>
				</div>
			{/await}
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

<!-- Add Payment Method Modal -->
{#if showAddPaymentModal}
	<div class="modal-open modal">
		<div class="modal-box">
			<h3 class="mb-4 text-lg font-bold">Manage Payment Methods</h3>

			<div class="py-4">
				<p class="mb-4 text-base-content/70">
					You'll be redirected to Stripe's secure billing portal where you can safely add, remove,
					or update your payment methods.
				</p>

				<div class="rounded-lg border border-primary/20 bg-primary/5 p-6">
					<div class="mb-3 flex items-center gap-3">
						<span class="icon-[mdi--shield-check] h-8 w-8 text-primary"></span>
						<div>
							<h4 class="font-semibold text-primary">Secure & Protected</h4>
							<p class="text-sm text-base-content/70">Powered by Stripe's secure infrastructure</p>
						</div>
					</div>

					<ul class="space-y-2 text-sm text-base-content/70">
						<li class="flex items-center gap-2">
							<span class="icon-[mdi--check] h-4 w-4 text-success"></span>
							Add credit or debit cards
						</li>
						<li class="flex items-center gap-2">
							<span class="icon-[mdi--check] h-4 w-4 text-success"></span>
							Set default payment method
						</li>
						<li class="flex items-center gap-2">
							<span class="icon-[mdi--check] h-4 w-4 text-success"></span>
							Update billing information
						</li>
						<li class="flex items-center gap-2">
							<span class="icon-[mdi--check] h-4 w-4 text-success"></span>
							Remove old payment methods
						</li>
					</ul>
				</div>

				{#if paymentMethodError}
					<div class="mt-4 alert alert-error">
						<span class="icon-[mdi--alert-circle] h-5 w-5"></span>
						<span>{paymentMethodError}</span>
					</div>
				{/if}
			</div>

			<div class="modal-action">
				<button class="btn btn-ghost" onclick={() => (showAddPaymentModal = false)}>Cancel</button>
				<button class="btn btn-primary" onclick={addPaymentMethod}>
					<span class="icon-[mdi--open-in-new] h-4 w-4"></span>
					Open Billing Portal
				</button>
			</div>
		</div>
	</div>
{/if}
