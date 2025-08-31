<!-- Dev Payment Testing Page -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { userManager } from '$lib/stores/user.store.svelte';
	import { posthogManager } from '$lib/client/posthog';

	// Test data
	let testResults = $state<any[]>([]);
	let isLoading = $state(false);
	let currentTest = $state<string>('');

	// Test configurations
	const testConfigs = [
		{
			name: 'Plus Monthly',
			priceId: 'price_plus_monthly_dev',
			description: 'Test Plus tier monthly subscription'
		},
		{
			name: 'Plus Annual',
			priceId: 'price_plus_annual_dev',
			description: 'Test Plus tier annual subscription'
		},
		{
			name: 'Premium Monthly',
			priceId: 'price_premium_monthly_dev',
			description: 'Test Premium tier monthly subscription'
		},
		{
			name: 'Premium Annual',
			priceId: 'price_premium_annual_dev',
			description: 'Test Premium tier annual subscription'
		}
	];

	onMount(() => {
		console.log('userManager', userManager.getDebugInfo());
		posthogManager.trackEvent('dev_payment_page_viewed');
	});

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

	function addTestResult(type: 'info' | 'success' | 'error', message: string) {
		testResults = [
			...testResults,
			{
				id: Date.now(),
				type,
				message,
				timestamp: new Date().toLocaleTimeString()
			}
		];
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
			default:
				return 'text-base-content';
		}
	}
</script>

<svelte:head>
	<title>Dev Payment Testing | Kaiwa</title>
	<meta name="description" content="Test Stripe payment integration with dev keys" />
</svelte:head>

<div class="container mx-auto max-w-6xl px-4 py-8">
	<div class="mb-8">
		<h1 class="mb-4 text-3xl font-bold">🧪 Dev Payment Testing</h1>
		<p class="text-base-content/70">
			Test Stripe payment integration with development keys. This page is for development and
			testing purposes only.
		</p>
	</div>

	<!-- User Status -->
	<div class="mb-8 rounded-lg border bg-base-200 p-4">
		<h2 class="mb-2 text-lg font-semibold">User Status</h2>
		<div class="grid grid-cols-1 gap-2 md:grid-cols-3">
			<div>
				<strong>Logged In:</strong>

				{userManager.user ? '✅ Yes' : '❌ No'}
			</div>
			<div>
				<strong>User ID:</strong>
				{userManager.user?.id || 'N/A'}
			</div>
			<div>
				<strong>Current Tier:</strong>
				{userManager.effectiveTier || 'N/A'}
			</div>
		</div>
	</div>

	<!-- Test Controls -->
	<div class="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
		<div class="rounded-lg border bg-base-100 p-4">
			<h3 class="mb-3 text-lg font-semibold">Stripe Checkout Tests</h3>
			<div class="space-y-2">
				{#each testConfigs as config}
					<button
						class="btn w-full btn-outline btn-sm"
						onclick={() => testStripeCheckout(config.priceId, config.name)}
						disabled={isLoading || !userManager.isLoggedIn}
					>
						{isLoading && currentTest === config.name ? '⏳' : '🧪'}
						{config.name}
					</button>
				{/each}
			</div>
		</div>

		<div class="rounded-lg border bg-base-100 p-4">
			<h3 class="mb-3 text-lg font-semibold">Service Tests</h3>
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
			</div>
		</div>
	</div>

	<!-- Test Results -->
	<div class="mb-8">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-xl font-semibold">Test Results</h2>
			<button class="btn btn-outline btn-sm" onclick={clearResults}>Clear Results</button>
		</div>

		<div class="max-h-96 overflow-y-auto rounded-lg border bg-base-100">
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
		</div>
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
		</ul>
	</div>
</div>
