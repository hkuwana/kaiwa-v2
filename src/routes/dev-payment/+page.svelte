<!-- Enhanced Dev Payment Testing Page -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { userManager } from '$lib/stores/user.store.svelte';
	import { posthogManager } from '$lib/client/posthog';
	import { getMonthlyPriceId, getAnnualPriceId, getPriceId, getStripeEnvironmentInfo } from '$lib/data/stripe';

	// Test state
	let testResults = $state<any[]>([]);
	let isLoading = $state(false);
	let currentTest = $state<string>('');
	let autoRefresh = $state(false);
	let refreshInterval: ReturnType<typeof setInterval> | null = null;
	let subscriptionData = $state<any>(null);
	let webhookEvents = $state<any[]>([]);
	let stripeEnvironmentInfo = $state<any>(null);

	// Enhanced test configurations with tier and pricing info
	const testConfigs = [
		{
			name: 'Plus Monthly',
			tier: 'plus',
			billing: 'monthly',
			priceId: getMonthlyPriceId(),
			price: '$15.00/month',
			description: 'Plus tier - 300 minutes monthly'
		},
		{
			name: 'Plus Annual',
			tier: 'plus',
			billing: 'annual',
			priceId: getAnnualPriceId(),
			price: '$144.00/year (20% off)',
			description: 'Plus tier - 300 minutes monthly (annual)'
		},
		{
			name: 'Premium Monthly',
			tier: 'premium',
			billing: 'monthly',
			priceId: getPriceId('premium', 'monthly'),
			price: '$25.00/month',
			description: 'Premium tier - 600 minutes monthly'
		},
		{
			name: 'Premium Annual',
			tier: 'premium',
			billing: 'annual',
			priceId: getPriceId('premium', 'annual'),
			price: '$240.00/year (20% off)',
			description: 'Premium tier - 600 minutes monthly (annual)'
		}
	];

	onMount(async () => {
		console.log('userManager', userManager.getDebugInfo());
		posthogManager.trackEvent('dev_payment_page_viewed');
		
		// Load initial data
		await Promise.all([
			loadSubscriptionData(),
			loadWebhookEvents(),
			loadStripeEnvironmentInfo()
		]);
		
		// Set up auto-refresh if enabled
		if (autoRefresh) {
			startAutoRefresh();
		}
	});
	
	onDestroy(() => {
		if (refreshInterval) {
			clearInterval(refreshInterval);
		}
	});

	// Data loading functions
	async function loadSubscriptionData() {
		if (!userManager.isLoggedIn) return;
		
		try {
			const response = await fetch('/api/user/subscription');
			if (response.ok) {
				subscriptionData = await response.json();
			}
		} catch (error) {
			console.error('Failed to load subscription data:', error);
		}
	}
	
	async function loadWebhookEvents() {
		try {
			const response = await fetch('/api/dev/webhook-events');
			if (response.ok) {
				const events = await response.json();
				webhookEvents = events.slice(0, 10); // Latest 10 events
			}
		} catch (error) {
			console.error('Failed to load webhook events:', error);
		}
	}
	
	async function loadStripeEnvironmentInfo() {
		try {
			const response = await fetch('/api/dev/stripe-info');
			if (response.ok) {
				stripeEnvironmentInfo = await response.json();
			} else {
				// Fallback to client-side info
				stripeEnvironmentInfo = getStripeEnvironmentInfo();
			}
		} catch (error) {
			console.error('Failed to load Stripe environment info:', error);
			// Fallback to client-side info
			stripeEnvironmentInfo = getStripeEnvironmentInfo();
		}
	}
	
	// Auto-refresh functionality
	function startAutoRefresh() {
		if (refreshInterval) clearInterval(refreshInterval);
		refreshInterval = setInterval(async () => {
			await Promise.all([
				loadSubscriptionData(),
				loadWebhookEvents()
			]);
		}, 5000); // Refresh every 5 seconds
	}
	
	function toggleAutoRefresh() {
		autoRefresh = !autoRefresh;
		if (autoRefresh) {
			startAutoRefresh();
		} else if (refreshInterval) {
			clearInterval(refreshInterval);
			refreshInterval = null;
		}
	}

	async function testStripeCheckout(priceId: string, testName: string) {
		if (!userManager.isLoggedIn) {
			addTestResult('error', `User not logged in for ${testName}`);
			return;
		}

		isLoading = true;
		currentTest = testName;

		try {
			addTestResult('info', `Starting Stripe checkout test for ${testName}...`);

			const response = await fetch('/api/stripe/checkout', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					priceId,
					successPath: '/dev-payment?success=true',
					cancelPath: '/dev-payment?cancelled=true'
				})
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Checkout creation failed');
			}

			const { url, sessionId } = await response.json();

			addTestResult('success', `Checkout session created successfully for ${testName}`);
			addTestResult('info', `Session ID: ${sessionId}`);

			// Redirect to Stripe checkout
			window.location.href = url;
		} catch (error) {
			addTestResult(
				'error',
				`Failed to create checkout for ${testName}: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		} finally {
			isLoading = false;
			currentTest = '';
		}
	}

	async function testStripeWebhook() {
		isLoading = true;
		currentTest = 'Webhook Test';

		try {
			addTestResult('info', 'Testing Stripe webhook endpoint...');

			const response = await fetch('/api/stripe/webhook', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					test: true,
					event_type: 'test.webhook'
				})
			});

			if (response.ok) {
				addTestResult('success', 'Webhook endpoint is accessible');
			} else {
				addTestResult('error', `Webhook endpoint returned ${response.status}`);
			}
		} catch (error) {
			addTestResult(
				'error',
				`Webhook test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		} finally {
			isLoading = false;
			currentTest = '';
		}
	}

	async function testStripeService() {
		isLoading = true;
		currentTest = 'Service Test';

		try {
			addTestResult('info', 'Testing Stripe service endpoints...');

			// Test customer creation
			const customerResponse = await fetch('/api/stripe/test-customer', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (customerResponse.ok) {
				addTestResult('success', 'Customer creation endpoint working');
			} else {
				addTestResult('error', `Customer creation failed: ${customerResponse.status}`);
			}
		} catch (error) {
			addTestResult(
				'error',
				`Service test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		} finally {
			isLoading = false;
			currentTest = '';
		}
	}

	// Subscription management functions
	async function cancelSubscription() {
		if (!confirm('Are you sure you want to cancel your subscription?')) return;
		
		isLoading = true;
		currentTest = 'Cancel Subscription';
		
		try {
			addTestResult('info', 'Cancelling subscription...');
			
			const response = await fetch('/api/subscription/cancel', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});
			
			if (response.ok) {
				addTestResult('success', 'Subscription cancelled successfully');
				await loadSubscriptionData();
			} else {
				const error = await response.json();
				addTestResult('error', `Failed to cancel: ${error.error}`);
			}
		} catch (error) {
			addTestResult('error', `Cancel failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
		} finally {
			isLoading = false;
			currentTest = '';
		}
	}
	
	async function reactivateSubscription() {
		isLoading = true;
		currentTest = 'Reactivate Subscription';
		
		try {
			addTestResult('info', 'Reactivating subscription...');
			
			const response = await fetch('/api/subscription/reactivate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});
			
			if (response.ok) {
				addTestResult('success', 'Subscription reactivated successfully');
				await loadSubscriptionData();
			} else {
				const error = await response.json();
				addTestResult('error', `Failed to reactivate: ${error.error}`);
			}
		} catch (error) {
			addTestResult('error', `Reactivation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
		} finally {
			isLoading = false;
			currentTest = '';
		}
	}

	function addTestResult(type: 'info' | 'success' | 'error' | 'warning', message: string) {
		testResults = [
			...testResults,
			{
				id: Date.now(),
				type,
				message,
				timestamp: new Date().toLocaleTimeString()
			}
		];
		
		// Auto-scroll to latest result
		setTimeout(() => {
			const resultsContainer = document.querySelector('.test-results');
			if (resultsContainer) {
				resultsContainer.scrollTop = resultsContainer.scrollHeight;
			}
		}, 100);
	}

	function clearResults() {
		testResults = [];
	}

	function getResultIcon(type: string) {
		switch (type) {
			case 'success':
				return '✅';
			case 'error':
				return '❌';
			case 'info':
				return 'ℹ️';
			case 'warning':
				return '⚠️';
			default:
				return '📝';
		}
	}

	function getResultColor(type: string) {
		switch (type) {
			case 'success':
				return 'text-success';
			case 'error':
				return 'text-error';
			case 'info':
				return 'text-info';
			case 'warning':
				return 'text-warning';
			default:
				return 'text-base-content';
		}
	}
	
	function getSubscriptionStatusBadge(status: string) {
		switch (status) {
			case 'active':
				return 'badge-success';
			case 'canceled':
				return 'badge-error';
			case 'trialing':
				return 'badge-info';
			case 'past_due':
				return 'badge-warning';
			default:
				return 'badge-neutral';
		}
	}
</script>

<svelte:head>
	<title>Enhanced Dev Payment Testing | Kaiwa</title>
	<meta name="description" content="Enhanced Stripe payment integration testing with real-time monitoring" />
</svelte:head>

<div class="container mx-auto max-w-7xl px-4 py-8">
	<div class="mb-8">
		<h1 class="mb-4 text-3xl font-bold">🧪 Enhanced Dev Payment Testing</h1>
		<p class="text-base-content/70">
			Comprehensive Stripe payment integration testing with real-time monitoring, subscription management, and webhook tracking.
		</p>
	</div>

	<!-- User Status -->
	<div class="mb-8 rounded-lg border bg-base-200 p-4">
		<h2 class="mb-2 text-lg font-semibold">User Status</h2>
		<div class="space-y-2">
			<div class="flex items-center justify-between">
				<strong>Logged In:</strong>
				<span class="{userManager.user ? 'text-success' : 'text-error'}">
					{userManager.user ? '✅ Yes' : '❌ No'}
				</span>
			</div>
			<div class="flex items-center justify-between">
				<strong>User ID:</strong>
				<span class="font-mono text-sm">{userManager.user?.id || 'N/A'}</span>
			</div>
			<div class="flex items-center justify-between">
				<strong>Current Tier:</strong>
				<span class="badge badge-outline">{userManager.effectiveTier || 'N/A'}</span>
			</div>
			{#if subscriptionData}
				<div class="flex items-center justify-between">
					<strong>Subscription ID:</strong>
					<span class="font-mono text-xs">{subscriptionData.id}</span>
				</div>
			{/if}
		</div>
	</div>

	<!-- Real-time Status Dashboard -->
	<div class="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
		<!-- Subscription Status -->
		<div class="rounded-lg border bg-base-100 p-4">
			<div class="mb-3 flex items-center justify-between">
				<h3 class="text-lg font-semibold">Current Subscription</h3>
				{#if autoRefresh}
					<span class="badge badge-success badge-sm">🔄 Auto-refreshing</span>
				{/if}
			</div>
			
			{#if subscriptionData}
				<div class="space-y-2">
					<div class="flex items-center justify-between">
						<span>Status:</span>
						<span class="badge {getSubscriptionStatusBadge(subscriptionData.status)}">
							{subscriptionData.status}
						</span>
					</div>
					<div class="flex items-center justify-between">
						<span>Tier:</span>
						<span class="badge badge-outline">{subscriptionData.tierId}</span>
					</div>
					<div class="flex items-center justify-between">
						<span>Current Period:</span>
						<span class="text-sm">
							{new Date(subscriptionData.currentPeriodStart).toLocaleDateString()} -
							{new Date(subscriptionData.currentPeriodEnd).toLocaleDateString()}
						</span>
					</div>
					{#if subscriptionData.cancelAtPeriodEnd}
						<div class="text-warning text-sm">⚠️ Will cancel at period end</div>
					{/if}
				</div>
			{:else}
				<div class="text-base-content/50">No active subscription</div>
			{/if}
		</div>
		
		<!-- Recent Webhook Events -->
		<div class="rounded-lg border bg-base-100 p-4">
			<h3 class="mb-3 text-lg font-semibold">Recent Webhook Events</h3>
			<div class="space-y-2 max-h-48 overflow-y-auto">
				{#if webhookEvents.length > 0}
					{#each webhookEvents as event}
						<div class="flex items-center justify-between border-b border-base-200 pb-2">
							<div>
								<div class="font-medium text-sm">{event.type}</div>
								<div class="text-xs text-base-content/50">
									{new Date(event.created * 1000).toLocaleString()}
								</div>
							</div>
							<span class="badge badge-outline badge-sm">✅</span>
						</div>
					{/each}
				{:else}
					<div class="text-base-content/50">No recent webhook events</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Test Controls -->
	<div class="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
		<div class="rounded-lg border bg-base-100 p-4">
			<h3 class="mb-3 text-lg font-semibold">Stripe Checkout Tests</h3>
			<div class="space-y-3">
				{#each testConfigs as config}
					<div class="border rounded-lg p-3">
						<div class="flex items-center justify-between mb-2">
							<span class="font-medium">{config.name}</span>
							<span class="badge badge-outline">{config.price}</span>
						</div>
						<p class="text-sm text-base-content/70 mb-2">{config.description}</p>
						<div class="text-xs text-base-content/50 mb-2">
							<strong>Price ID:</strong> <code>{config.priceId}</code>
						</div>
						<button
							class="btn w-full btn-outline btn-sm"
							onclick={() => testStripeCheckout(config.priceId, config.name)}
							disabled={isLoading || !userManager.isLoggedIn || config.priceId.includes('placeholder')}
						>
							{isLoading && currentTest === config.name ? '⏳' : '🧪'}
							Test {config.name}
						</button>
						{#if config.priceId.includes('placeholder')}
							<div class="text-xs text-warning mt-1">⚠️ Price ID needs to be created in Stripe</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<div class="rounded-lg border bg-base-100 p-4">
			<h3 class="mb-3 text-lg font-semibold">Service & Management Tests</h3>
			<div class="space-y-2">
				<button
					class="btn w-full btn-outline btn-sm"
					onclick={testStripeWebhook}
					disabled={isLoading}
				>
					🧪 Test Webhook
				</button>
				<button
					class="btn w-full btn-outline btn-sm"
					onclick={testStripeService}
					disabled={isLoading}
				>
					🧪 Test Service
				</button>
				
				<div class="divider">Subscription Management</div>
				
				<button
					class="btn w-full btn-outline btn-sm btn-warning"
					onclick={cancelSubscription}
					disabled={isLoading || !subscriptionData || subscriptionData.status !== 'active'}
				>
					🗑️ Cancel Subscription
				</button>
				<button
					class="btn w-full btn-outline btn-sm btn-success"
					onclick={reactivateSubscription}
					disabled={isLoading || !subscriptionData || subscriptionData.cancelAtPeriodEnd !== true}
				>
					🔄 Reactivate Subscription
				</button>
				
				<div class="divider">Data Refresh</div>
				
				<button
					class="btn w-full btn-outline btn-sm"
					onclick={toggleAutoRefresh}
				>
					{autoRefresh ? '⏸️ Stop Auto-Refresh' : '🔄 Start Auto-Refresh'}
				</button>
			</div>
		</div>
	</div>

	<!-- Test Results -->
	<div class="mb-8">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-xl font-semibold">Test Results</h2>
			<button class="btn btn-outline btn-sm" onclick={clearResults}>Clear Results</button>
		</div>

		<div class="test-results max-h-96 overflow-y-auto rounded-lg border bg-base-100">
			{#if testResults.length === 0}
				<div class="p-4 text-center text-base-content/50">
					No test results yet. Run some tests to see results here.
				</div>
			{:else}
				{#each testResults as result}
					<div class="border-b border-base-200 p-3 last:border-b-0">
						<div class="flex items-start gap-2">
							<span class="text-lg">{getResultIcon(result.type)}</span>
							<div class="flex-1">
								<div class="flex items-center gap-2">
									<span class="text-sm text-base-content/50">{result.timestamp}</span>
									<span class="badge badge-outline badge-sm">{result.type}</span>
								</div>
								<p class="mt-1 {getResultColor(result.type)}">{result.message}</p>
							</div>
						</div>
					</div>
				{/each}
			{/if}
		</div>
	</div>

	<!-- Environment Info -->
	<div class="rounded-lg border bg-base-200 p-4">
		<h2 class="mb-3 text-lg font-semibold">Environment Information</h2>
		<div class="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
			<div>
				<strong>Node Environment:</strong>
				{import.meta.env.MODE}
			</div>
			<div>
				<strong>Base URL:</strong>
				{import.meta.env.BASE_URL}
			</div>
			{#if stripeEnvironmentInfo}
				<div>
					<strong>Stripe Dev Mode:</strong>
					{stripeEnvironmentInfo.isStripeDev ? '✅ Enabled' : '❌ Disabled'}
				</div>
				<div>
					<strong>Available Price IDs:</strong>
					{stripeEnvironmentInfo.allPriceIds ? stripeEnvironmentInfo.allPriceIds.length : 'N/A'}
				</div>
			{/if}
		</div>
		
		{#if stripeEnvironmentInfo && stripeEnvironmentInfo.currentPrices}
			<details class="mt-3">
				<summary class="cursor-pointer text-sm font-medium">Show Price IDs</summary>
				<div class="mt-2 space-y-1 text-xs">
					{#each Object.entries(stripeEnvironmentInfo.currentPrices) as [key, priceId]}
						<div class="flex justify-between">
							<span class="font-mono">{key}:</span>
							<span class="font-mono text-base-content/70">{priceId}</span>
						</div>
					{/each}
				</div>
			</details>
		{/if}
		
		<div class="mt-2 text-xs text-base-content/50">
			Note: Stripe keys and price IDs are configured server-side for security.
		</div>
	</div>

	<!-- Instructions -->
	<div class="mt-8 rounded-lg border border-warning bg-warning/10 p-4">
		<h3 class="mb-2 text-lg font-semibold text-warning">⚠️ Development Instructions</h3>
		<ul class="list-inside list-disc space-y-1 text-sm">
			<li>Ensure you have valid Stripe test keys configured in your environment</li>
			<li>Use Stripe test card numbers (e.g., 4242 4242 4242 4242) for testing</li>
			<li>Check the Stripe dashboard for webhook events and checkout sessions</li>
			<li>Monitor the browser console and server logs for detailed error information</li>
			<li>Use auto-refresh to monitor subscription state changes in real-time</li>
		</ul>
	</div>
</div>