<!-- 🔧 Simple Payment Testing (MVP) -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { userManager } from '$lib/stores/user.store.svelte';
	import { posthogManager } from '$lib/client/posthog';

	// Simple state
	let debugData = $state<any>(null);
	let isLoading = $state(false);
	let testResult = $state<string>('');

	// Available tiers from our config
	const tiers = [
		{ id: 'plus', name: 'Plus', price: '$15/month', priceAnnual: '$144/year' },
		{ id: 'premium', name: 'Premium', price: '$25/month', priceAnnual: '$240/year' }
	];

	onMount(async () => {
		console.log('💳 Simple Payment Debug Page');
		posthogManager.trackEvent('dev_payment_page_viewed');
		await loadDebugData();
	});

	// Load payment debug data
	async function loadDebugData() {
		if (!userManager.isLoggedIn) return;

		isLoading = true;
		try {
			const response = await fetch('/api/dev/payment-debug?action=full');
			if (response.ok) {
				debugData = await response.json();
				console.log('Debug data:', debugData);
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

	// Test checkout flow
	async function testCheckout(tier: string, billing: 'monthly' | 'annual') {
		if (!userManager.isLoggedIn) {
			testResult = '❌ Please log in first';
			return;
		}

		isLoading = true;
		testResult = `🔧 Creating ${tier} ${billing} checkout...`;

		try {
			const response = await fetch('/api/stripe/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					tier,
					billing,
					successPath: '/dev-payment?success=true',
					cancelPath: '/dev-payment?cancelled=true'
				})
			});

			const result = await response.json();

			if (response.ok) {
				testResult = `✅ Checkout session created: ${result.sessionId}`;
				console.log('Checkout URL:', result.url);

				// Open checkout in new tab
				window.open(result.url, '_blank');
			} else {
				testResult = `❌ Checkout failed: ${result.error}`;
				console.error('Checkout error:', result);
			}
		} catch (error) {
			testResult = `❌ Checkout error: ${error}`;
		} finally {
			isLoading = false;
		}
	}

	// Test payment service actions
	async function testPaymentAction(action: string) {
		isLoading = true;
		testResult = `🔧 Running ${action}...`;

		try {
			const response = await fetch('/api/dev/payment-debug', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action })
			});

			const result = await response.json();

			if (response.ok) {
				testResult = `✅ ${action} completed`;
				console.log('Action result:', result);

				// Reload debug data
				await loadDebugData();
			} else {
				testResult = `❌ ${action} failed: ${result.message}`;
			}
		} catch (error) {
			testResult = `❌ ${action} error: ${error}`;
		} finally {
			isLoading = false;
		}
	}

	// Quick tier switching
	async function switchTier(tier: string) {
		if (!userManager.isLoggedIn) {
			testResult = '❌ Please log in first';
			return;
		}

		isLoading = true;
		testResult = `🔧 Switching to ${tier} tier...`;

		try {
			const response = await fetch('/api/dev/payment-debug', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'set_tier', tier })
			});

			const result = await response.json();

			if (response.ok) {
				testResult = `✅ Successfully switched to ${tier} tier`;
				console.log('Tier switch result:', result);

				// Reload debug data
				await loadDebugData();
			} else {
				testResult = `❌ Tier switch failed: ${result.message}`;
			}
		} catch (error) {
			testResult = `❌ Tier switch error: ${error}`;
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="container mx-auto max-w-4xl p-6">
	<h1 class="mb-8 text-center text-3xl font-bold">🔧 Payment Testing (MVP)</h1>

	{#if !userManager.isLoggedIn}
		<div class="mb-6 alert alert-warning">
			<span>⚠️ Please log in to test payment functionality</span>
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
					🔄 Refresh Debug Data
				</button>
			</div>
		</div>
	</div>

	<!-- User & Subscription Status -->
	{#if debugData}
		<div class="card mb-6 bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="mb-4 card-title text-xl">Current Status</h2>

				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div class="stat rounded-lg bg-base-200">
						<div class="stat-title">User</div>
						<div class="stat-value text-sm">{debugData.user?.email}</div>
						<div class="stat-desc">
							Stripe Customer: {debugData.user?.hasStripeCustomerId ? '✅ Yes' : '❌ No'}
						</div>
					</div>

					<div class="stat rounded-lg bg-base-200">
						<div class="stat-title">Current Tier</div>
						<div class="stat-value text-lg capitalize">{debugData.currentTier}</div>
						<div class="stat-desc">
							{#if debugData.stripeData?.hasActiveSubscription}
								✅ Active subscription
							{:else}
								❌ No active subscription
							{/if}
						</div>
					</div>
				</div>

				<!-- Comparison -->
				{#if debugData.comparison}
					<div class="mt-4">
						<h3 class="mb-2 font-semibold">Data Comparison</h3>
						<div class="rounded-lg bg-base-200 p-3">
							<div class="text-sm">
								<div>
									Stripe Tier: <span class="font-mono">{debugData.comparison.stripeTier}</span>
								</div>
								<div>DB Tier: <span class="font-mono">{debugData.comparison.dbTier}</span></div>
								<div>Match: {debugData.comparison.tierMatch ? '✅' : '❌'}</div>
								<div>
									Recommendation: <span class="font-mono font-semibold"
										>{debugData.comparison.recommendation}</span
									>
								</div>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Quick Tier Switching -->
	<div class="card mb-6 bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="mb-4 card-title text-xl">⚡ Quick Tier Switching</h2>
			<p class="mb-4 text-base-content/70">
				Instantly switch between tiers for testing (Dev only - bypasses Stripe)
			</p>

			<div class="flex flex-wrap gap-3">
				<button
					class="btn btn-outline btn-success"
					onclick={() => switchTier('free')}
					disabled={isLoading || !userManager.isLoggedIn}
				>
					🆓 Free Tier
				</button>

				<button
					class="btn btn-outline btn-primary"
					onclick={() => switchTier('plus')}
					disabled={isLoading || !userManager.isLoggedIn}
				>
					➕ Plus Tier
				</button>

				<button
					class="btn btn-outline btn-secondary"
					onclick={() => switchTier('premium')}
					disabled={isLoading || !userManager.isLoggedIn}
				>
					⭐ Premium Tier
				</button>
			</div>

			{#if debugData?.currentTier}
				<div class="mt-4 alert alert-info">
					<span>Current tier: <strong class="capitalize">{debugData.currentTier}</strong></span>
				</div>
			{/if}
		</div>
	</div>

	<!-- Test Actions -->
	<div class="card mb-6 bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="mb-4 card-title text-xl">Test Actions</h2>

			<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
				<button
					class="btn btn-outline"
					onclick={() => testPaymentAction('ensure_stripe_customer')}
					disabled={isLoading}
				>
					🔧 Ensure Stripe Customer
				</button>

				<button
					class="btn btn-outline"
					onclick={() => testPaymentAction('sync_from_stripe')}
					disabled={isLoading}
				>
					🔄 Sync from Stripe
				</button>

				<button
					class="btn btn-outline"
					onclick={() => testPaymentAction('get_current_tier')}
					disabled={isLoading}
				>
					📊 Get Current Tier
				</button>
			</div>
		</div>
	</div>

	<!-- Checkout Tests -->
	<div class="card mb-6 bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="mb-4 card-title text-xl">🛒 Test Checkout Flow</h2>
			<p class="mb-4 text-base-content/70">
				Test the complete checkout process with real Stripe sessions
			</p>

			<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
				{#each tiers as tier}
					<div class="rounded-lg border border-base-300 p-4">
						<h3 class="mb-2 text-lg font-semibold">{tier.name}</h3>
						<div class="mb-4 text-sm text-base-content/70">
							Monthly: {tier.price} | Annual: {tier.priceAnnual}
						</div>

						<div class="flex gap-2">
							<button
								class="btn flex-1 btn-sm btn-primary"
								onclick={() => testCheckout(tier.id, 'monthly')}
								disabled={isLoading || !userManager.isLoggedIn}
							>
								Monthly
							</button>
							<button
								class="btn flex-1 btn-sm btn-secondary"
								onclick={() => testCheckout(tier.id, 'annual')}
								disabled={isLoading || !userManager.isLoggedIn}
							>
								Annual
							</button>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Available Tiers -->
	{#if debugData?.availableTiers}
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="mb-4 card-title text-xl">Available Tiers</h2>

				<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{#each debugData.availableTiers as tier}
						<div class="rounded-lg bg-base-200 p-3">
							<h3 class="font-semibold capitalize">{tier.tier}</h3>
							<div class="text-sm">
								<div>{tier.name}</div>
								<div class="mt-1 font-mono text-xs">
									Monthly: {tier.monthlyPrice || 'Free'}<br />
									Annual: {tier.annualPrice || 'Free'}
								</div>
								{#if tier.stripePriceIdMonthly}
									<div class="mt-1 text-xs text-base-content/50">
										M: {tier.stripePriceIdMonthly?.slice(0, 20)}...<br />
										A: {tier.stripePriceIdAnnual?.slice(0, 20)}...
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>
