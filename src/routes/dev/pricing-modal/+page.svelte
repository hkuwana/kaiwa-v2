<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import PricingModal from '$lib/features/payments/components/PricingModal.svelte';
	import type { UsageStatus } from '$lib/server/tier.service';
	import { createDevUsageStatus } from '$lib/data/dev';

	// State for controlling the modal
	let isModalOpen = $state(false);
	let currentTier = $state('free');
	let modalSource = $state<'limit_modal' | 'navbar' | 'settings' | 'onboarding'>('navbar');

	// Dev usage status for testing, derived from canonical tier configs
	const devUsageStatus: UsageStatus = createDevUsageStatus('free');

	// Functions to open modal with different configurations
	function openModal(source: typeof modalSource, tier: string = 'free') {
		currentTier = tier;
		modalSource = source;
		isModalOpen = true;
	}

	function redirectToNewShowcase() {
		goto(resolve('/dev/modals'));
	}
</script>

<svelte:head>
	<title>Pricing Modal Test - Kaiwa Dev</title>
</svelte:head>

<div class="container mx-auto max-w-4xl px-4 py-8">
	<!-- Redirect Notice -->
	<div class="mb-8 alert alert-warning">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			class="h-6 w-6 shrink-0 stroke-current"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
			></path>
		</svg>
		<div>
			<h3 class="font-bold">Page Moved!</h3>
			<p>This component showcase has been moved to a comprehensive showcase page.</p>
			<button class="btn mt-2 btn-sm btn-primary" onclick={redirectToNewShowcase}>
				Go to New Showcase →
			</button>
		</div>
	</div>

	<div class="mb-8">
		<h1 class="mb-4 text-3xl font-bold">Pricing Modal Component Test</h1>
		<p class="text-base-content/70">
			Simplified pricing modal test page. For the full component showcase, visit /dev/modals.
		</p>
	</div>

	<!-- Quick Test -->
	<div class="card bg-base-100 shadow-lg">
		<div class="card-body">
			<h2 class="card-title">Quick Test</h2>
			<div class="flex flex-wrap gap-3">
				<button class="btn btn-primary" onclick={() => openModal('limit_modal', 'free')}>
					Test Limit Modal
				</button>
				<button class="btn btn-secondary" onclick={() => openModal('navbar', 'free')}>
					Test Navbar Modal
				</button>
			</div>

			<div class="mt-4 text-sm opacity-70">
				<strong>Current State:</strong>
				Modal: {isModalOpen ? 'Open' : 'Closed'} | Tier: {currentTier} | Source: {modalSource}
			</div>
		</div>
	</div>
</div>

<!-- Render the PricingModal -->
<PricingModal
	bind:isOpen={isModalOpen}
	{currentTier}
	usageStatus={modalSource === 'limit_modal' ? devUsageStatus : null}
	source={modalSource}
/>
