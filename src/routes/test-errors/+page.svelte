<!-- src/routes/test-errors/+page.svelte -->
<script lang="ts">
	import LoadingScreen from '$lib/components/LoadingScreen.svelte';
	import { onMount } from 'svelte';

	let currentError: string | null = null;
	let status: 'connecting' | 'connected' | 'error' = 'connecting';

	const errorTypes = [
		{
			name: 'Country Restriction',
			error: 'Country, region, or territory not supported',
			description: 'Simulates OpenAI 403 country restriction error'
		},
		{
			name: 'Generic Connection Error',
			error: 'Failed to connect to OpenAI API',
			description: 'Simulates a generic connection error'
		},
		{
			name: 'Rate Limit Error',
			error: 'Rate limit exceeded',
			description: 'Simulates OpenAI rate limit error'
		},
		{
			name: 'No Error (Connected)',
			error: null,
			description: 'Shows connected state'
		}
	];

	function testError(errorType: (typeof errorTypes)[0]) {
		currentError = errorType.error;
		status = errorType.error ? 'error' : 'connected';
	}

	function resetToConnecting() {
		status = 'connecting';
		currentError = null;
	}

	onMount(() => {
		// Auto-cycle through errors for demo
		let index = 0;
		const interval = setInterval(() => {
			testError(errorTypes[index]);
			index = (index + 1) % errorTypes.length;
		}, 5000);

		return () => clearInterval(interval);
	});
</script>

<svelte:head>
	<title>Error Testing - Kaiwa</title>
	<meta name="description" content="Test page for different error types" />
</svelte:head>

<div class="container mx-auto max-w-6xl p-6">
	<h1 class="mb-8 text-center text-3xl font-bold">Error Testing Page</h1>

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
		<!-- Error Controls -->
		<div class="space-y-4">
			<h2 class="text-xl font-semibold">Test Different Error Types</h2>

			<div class="space-y-3">
				{#each errorTypes as errorType (errorType.name)}
					<button
						onclick={() => testError(errorType)}
						class="btn w-full justify-start btn-outline {currentError === errorType.error
							? 'btn-primary'
							: ''}"
					>
						<div class="text-left">
							<div class="font-medium">{errorType.name}</div>
							<div class="text-xs text-gray-600">{errorType.description}</div>
						</div>
					</button>
				{/each}
			</div>

			<button onclick={resetToConnecting} class="btn w-full btn-secondary">
				Reset to Connecting State
			</button>

			<!-- Current Status Display -->
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<h3 class="card-title">Current Status</h3>
					<div class="space-y-2">
						<p>
							<strong>Status:</strong>
							<span
								class="badge badge-{status === 'connected'
									? 'success'
									: status === 'error'
										? 'error'
										: 'info'}">{status}</span
							>
						</p>
						{#if currentError}
							<p>
								<strong>Error:</strong>
								<code class="rounded bg-gray-100 p-1 text-sm">{currentError}</code>
							</p>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<!-- LoadingScreen Demo -->
		<div class="overflow-hidden rounded-lg border">
			<LoadingScreen {status} error={currentError} onRetry={() => console.log('Retry clicked')} />
		</div>
	</div>

	<!-- Instructions -->
	<div class="card mt-8 bg-base-100 shadow-xl">
		<div class="card-body">
			<h3 class="card-title">How It Works</h3>
			<div class="prose">
				<p>This page demonstrates how the LoadingScreen component handles different error types:</p>
				<ul>
					<li>
						<strong>Country Restriction:</strong> Shows a special message for OpenAI location restrictions
					</li>
					<li><strong>Generic Errors:</strong> Shows standard error handling with retry options</li>
					<li><strong>Connected State:</strong> Shows the success state</li>
				</ul>
				<p>
					The component automatically detects country restriction errors by looking for specific
					text patterns in the error message, such as "Country, region, or territory not supported"
					or "403".
				</p>
			</div>
		</div>
	</div>

	<!-- Navigation -->
	<div class="mt-6 text-center">
		<a href="/" class="btn btn-primary">Back to Home</a>
	</div>
</div>
