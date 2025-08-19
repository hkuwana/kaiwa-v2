<!-- 💰 Pricing Modal Component -->
<!-- Smart freemium pricing that converts users -->

<script lang="ts">
	import { trackConversion } from '$lib/analytics/posthog';
	import type { UsageStatus } from '$lib/server/tierService';

	// Props
	let {
		isOpen,
		currentTier = 'free',
		usageStatus = null,
		source = 'navbar'
	} = $props<{
		isOpen: boolean;
		currentTier: string;
		usageStatus: UsageStatus | null;
		source: 'limit_modal' | 'navbar' | 'settings' | 'onboarding';
	}>();

	// State
	let isLoading = $state(false);
	let selectedBilling = $state<'monthly' | 'yearly'>('monthly');

	// Pricing data
	const plans = [
		{
			id: 'free',
			name: 'Free',
			price: { monthly: 0, yearly: 0 },
			description: 'Perfect for getting started',
			features: [
				'10 conversations/month',
				'30 minutes/month',
				'3 realtime sessions',
				'8 languages',
				'Basic voices'
			],
			limitations: ['Limited conversations', 'Basic features only'],
			cta: 'Current Plan',
			popular: false
		},
		{
			id: 'pro',
			name: 'Pro',
			price: { monthly: 9.99, yearly: 99.99 },
			description: 'For serious language learners',
			features: [
				'100 conversations/month',
				'300 minutes/month',
				'50 realtime sessions',
				'All languages',
				'Premium voices',
				'Progress analytics',
				'Priority support'
			],
			cta: 'Upgrade to Pro',
			popular: true
		},
		{
			id: 'premium',
			name: 'Premium',
			price: { monthly: 19.99, yearly: 199.99 },
			description: 'Unlimited learning potential',
			features: [
				'Unlimited conversations',
				'Unlimited minutes',
				'Unlimited realtime',
				'All languages & voices',
				'Advanced analytics',
				'Custom scenarios',
				'Priority support',
				'Early access features'
			],
			cta: 'Go Premium',
			popular: false
		}
	];

	// Calculate savings for yearly billing
	const getYearlySavings = (plan: (typeof plans)[0]) => {
		const monthlyYearly = plan.price.monthly * 12;
		const savings = monthlyYearly - plan.price.yearly;
		const percentage = Math.round((savings / monthlyYearly) * 100);
		return { amount: savings, percentage };
	};

	// Handle plan selection
	async function selectPlan(planId: string) {
		if (planId === 'free' || planId === currentTier) return;

		isLoading = true;

		try {
			// Track conversion intent
			trackConversion.checkoutStarted(planId as 'pro' | 'premium', selectedBilling);

			// Determine price ID based on plan and billing
			const priceId = `price_${planId}_${selectedBilling}`;

			// Call checkout API
			const response = await fetch('/api/stripe/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					priceId,
					successPath: '/dashboard?upgraded=true',
					cancelPath: '/pricing?cancelled=true'
				})
			});

			const data = await response.json();

			if (response.ok && data.url) {
				// Redirect to Stripe checkout
				window.location.href = data.url;
			} else {
				throw new Error(data.error || 'Failed to create checkout session');
			}
		} catch (error) {
			console.error('Checkout error:', error);
			alert('Something went wrong. Please try again.');
		} finally {
			isLoading = false;
		}
	}

	// Close modal
	function closeModal() {
		isOpen = false;
	}

	// Track modal view
	$effect(() => {
		if (isOpen) {
			trackConversion.viewPricing(source);
		}
	});

	// Get usage percentage for visual indicator
	if (isOpen) {
		trackConversion.viewPricing(source);
	}

	// Get usage percentage for visual indicator
	function getUsagePercentage(used: number, limit: number | null): number {
		if (!limit) return 0;
		return Math.min(Math.round((used / limit) * 100), 100);
	}
</script>

{#if isOpen}
	<!-- Modal backdrop -->
	<dialog class="modal-open modal">
		<div class="modal-box max-h-[90vh] w-full max-w-6xl overflow-y-auto">
			<!-- Close button -->
			<form method="dialog">
				<button class="btn absolute top-2 right-2 btn-circle btn-ghost btn-sm" onclick={closeModal}
					>✕</button
				>
			</form>

			<!-- Header -->
			<div class="mb-8 text-center">
				<h2 class="mb-2 text-3xl font-bold">Choose Your Plan</h2>
				<p class="opacity-70">
					{#if source === 'limit_modal'}
						You've reached your {currentTier} tier limits. Upgrade to continue learning!
					{:else}
						Unlock your full language learning potential
					{/if}
				</p>

				<!-- Usage indicator if showing from limits -->
				{#if usageStatus && source === 'limit_modal'}
					<div class="mt-4 alert alert-warning">
						<div>
							<svg class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
								></path>
							</svg>
							<div>
								<h3 class="font-bold">Current Usage</h3>
								<div class="text-xs">
									<div class="mt-2 flex items-center justify-between">
										<span>Conversations</span>
										<span class="font-medium">
											{usageStatus.usage.conversationsUsed}/{usageStatus.limits
												.monthlyConversations || '∞'}
										</span>
									</div>
									<progress
										class="progress mt-1 w-full progress-warning"
										value={getUsagePercentage(
											usageStatus.usage.conversationsUsed,
											usageStatus.limits.monthlyConversations
										)}
										max="100"
									></progress>
								</div>
							</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- Billing toggle -->
			<div class="mb-8 flex items-center justify-center">
				<div class="join">
					<button
						class="btn join-item {selectedBilling === 'monthly' ? 'btn-active' : ''}"
						onclick={() => (selectedBilling = 'monthly')}
					>
						Monthly
					</button>
					<button
						class="btn join-item {selectedBilling === 'yearly' ? 'btn-active' : ''} relative"
						onclick={() => (selectedBilling = 'yearly')}
					>
						Yearly
						<span class="absolute -top-1 -right-1 badge badge-sm badge-success"> Save 17% </span>
					</button>
				</div>
			</div>

			<!-- Pricing cards -->
			<div class="grid gap-6 md:grid-cols-3">
				{#each plans as plan}
					{@const savings = getYearlySavings(plan)}
					<div
						class="card {plan.popular ? 'card-primary' : 'bg-base-100'} shadow-xl {plan.id ===
						currentTier
							? 'opacity-75'
							: ''}"
					>
						<!-- Popular badge -->
						{#if plan.popular}
							<div class="absolute -top-3 left-1/2 badge -translate-x-1/2 badge-primary">
								Most Popular
							</div>
						{/if}

						<div class="card-body">
							<!-- Plan header -->
							<div class="mb-6 text-center">
								<h3 class="card-title justify-center text-xl">{plan.name}</h3>
								<p class="opacity-70">{plan.description}</p>

								<!-- Price -->
								<div class="mt-4">
									{#if plan.price[selectedBilling] === 0}
										<span class="text-3xl font-bold">Free</span>
									{:else}
										<span class="text-3xl font-bold">
											${plan.price[selectedBilling]}
										</span>
										<span class="opacity-70">
											/{selectedBilling === 'monthly' ? 'month' : 'year'}
										</span>
									{/if}

									<!-- Yearly savings -->
									{#if selectedBilling === 'yearly' && plan.price.yearly > 0}
										<div class="mt-1 text-sm text-success">
											Save ${savings.amount} ({savings.percentage}%)
										</div>
									{/if}
								</div>
							</div>

							<!-- Features -->
							<ul class="mb-6 space-y-2">
								{#each plan.features as feature}
									<li class="flex items-center text-sm">
										<svg class="mr-2 h-4 w-4 text-success" fill="currentColor" viewBox="0 0 20 20">
											<path
												fill-rule="evenodd"
												d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
												clip-rule="evenodd"
											/>
										</svg>
										{feature}
									</li>
								{/each}
							</ul>

							<!-- CTA button -->
							<div class="card-actions justify-center">
								<button
									class="btn w-full {plan.id === currentTier
										? 'btn-disabled'
										: plan.popular
											? 'btn-primary'
											: 'btn-outline'}"
									onclick={() => selectPlan(plan.id)}
									disabled={isLoading || plan.id === currentTier}
								>
									{#if isLoading}
										<span class="loading loading-sm loading-spinner"></span>
									{:else}
										{plan.id === currentTier ? 'Current Plan' : plan.cta}
									{/if}
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>

			<!-- Footer -->
			<div class="mt-8 text-center text-sm opacity-70">
				<p>All plans include a 7-day free trial. Cancel anytime.</p>
				<p class="mt-1">
					Questions? <a href="/support" class="link link-primary">Contact support</a>
				</p>
			</div>
		</div>

		<!-- Modal backdrop click to close -->
		<form method="dialog" class="modal-backdrop">
			<button onclick={closeModal}>close</button>
		</form>
	</dialog>
{/if}
