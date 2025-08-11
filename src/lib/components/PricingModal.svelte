<!-- 💰 Pricing Modal Component -->
<!-- Smart freemium pricing that converts users -->

<script lang="ts">
	import { trackConversion } from '$lib/analytics/posthog.js';
	import type { UsageStatus } from '$lib/server/tierService.js';

	// Props
	export let isOpen = false;
	export let currentTier: string = 'free';
	export let usageStatus: UsageStatus | null = null;
	export let source: 'limit_modal' | 'navbar' | 'settings' | 'onboarding' = 'navbar';

	// State
	let isLoading = false;
	let selectedBilling: 'monthly' | 'yearly' = 'monthly';

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
	$: if (isOpen) {
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
	<div class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
		<!-- Modal content -->
		<div class="relative w-full max-w-6xl rounded-lg bg-white p-8 shadow-xl">
			<!-- Close button -->
			<button class="absolute top-4 right-4 text-gray-400 hover:text-gray-600" onclick={closeModal}>
				<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>

			<!-- Header -->
			<div class="mb-8 text-center">
				<h2 class="mb-2 text-3xl font-bold text-gray-900">Choose Your Plan</h2>
				<p class="text-gray-600">
					{#if source === 'limit_modal'}
						You've reached your {currentTier} tier limits. Upgrade to continue learning!
					{:else}
						Unlock your full language learning potential
					{/if}
				</p>

				<!-- Usage indicator if showing from limits -->
				{#if usageStatus && source === 'limit_modal'}
					<div class="mt-4 rounded-lg bg-yellow-50 p-4">
						<h3 class="font-medium text-yellow-800">Current Usage</h3>
						<div class="mt-2 space-y-2">
							<div class="flex items-center justify-between text-sm">
								<span>Conversations</span>
								<span class="font-medium">
									{usageStatus.usage.conversationsUsed}/{usageStatus.limits.monthlyConversations ||
										'∞'}
								</span>
							</div>
							<div class="h-2 w-full rounded-full bg-yellow-200">
								<div
									class="h-2 rounded-full bg-yellow-500"
									style="width: {getUsagePercentage(
										usageStatus.usage.conversationsUsed,
										usageStatus.limits.monthlyConversations
									)}%"
								></div>
							</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- Billing toggle -->
			<div class="mb-8 flex items-center justify-center">
				<div class="flex rounded-lg bg-gray-100 p-1">
					<button
						class="rounded-md px-4 py-2 text-sm font-medium transition-colors {selectedBilling ===
						'monthly'
							? 'bg-white text-blue-700 shadow-sm'
							: 'text-gray-700 hover:text-gray-900'}"
						onclick={() => (selectedBilling = 'monthly')}
					>
						Monthly
					</button>
					<button
						class="relative rounded-md px-4 py-2 text-sm font-medium transition-colors {selectedBilling ===
						'yearly'
							? 'bg-white text-blue-700 shadow-sm'
							: 'text-gray-700 hover:text-gray-900'}"
						onclick={() => (selectedBilling = 'yearly')}
					>
						Yearly
						<span
							class="absolute -top-1 -right-1 rounded-full bg-green-500 px-1.5 py-0.5 text-xs font-bold text-white"
						>
							Save 17%
						</span>
					</button>
				</div>
			</div>

			<!-- Pricing cards -->
			<div class="grid gap-6 md:grid-cols-3">
				{#each plans as plan}
					{@const savings = getYearlySavings(plan)}
					<div
						class="relative rounded-lg border-2 p-6 {plan.popular
							? 'border-blue-500 bg-blue-50'
							: 'border-gray-200 bg-white'} {plan.id === currentTier ? 'opacity-75' : ''}"
					>
						<!-- Popular badge -->
						{#if plan.popular}
							<div
								class="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-500 px-3 py-1 text-xs font-bold text-white"
							>
								Most Popular
							</div>
						{/if}

						<!-- Plan header -->
						<div class="mb-6 text-center">
							<h3 class="text-xl font-bold text-gray-900">{plan.name}</h3>
							<p class="text-gray-600">{plan.description}</p>

							<!-- Price -->
							<div class="mt-4">
								{#if plan.price[selectedBilling] === 0}
									<span class="text-3xl font-bold text-gray-900">Free</span>
								{:else}
									<span class="text-3xl font-bold text-gray-900">
										${plan.price[selectedBilling]}
									</span>
									<span class="text-gray-600">
										/{selectedBilling === 'monthly' ? 'month' : 'year'}
									</span>
								{/if}

								<!-- Yearly savings -->
								{#if selectedBilling === 'yearly' && plan.price.yearly > 0}
									<div class="mt-1 text-sm text-green-600">
										Save ${savings.amount} ({savings.percentage}%)
									</div>
								{/if}
							</div>
						</div>

						<!-- Features -->
						<ul class="mb-6 space-y-2">
							{#each plan.features as feature}
								<li class="flex items-center text-sm text-gray-700">
									<svg class="mr-2 h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
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
						<button
							class="w-full rounded-lg px-4 py-3 font-medium transition-colors {plan.id ===
							currentTier
								? 'cursor-not-allowed bg-gray-200 text-gray-600'
								: plan.popular
									? 'bg-blue-600 text-white hover:bg-blue-700'
									: 'bg-gray-900 text-white hover:bg-gray-800'} disabled:opacity-50"
							onclick={() => selectPlan(plan.id)}
							disabled={isLoading || plan.id === currentTier}
						>
							{#if isLoading}
								<svg class="mx-auto h-5 w-5 animate-spin" viewBox="0 0 24 24">
									<circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
										fill="none"
									/>
									<path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									/>
								</svg>
							{:else}
								{plan.id === currentTier ? 'Current Plan' : plan.cta}
							{/if}
						</button>
					</div>
				{/each}
			</div>

			<!-- Footer -->
			<div class="mt-8 text-center text-sm text-gray-600">
				<p>All plans include a 7-day free trial. Cancel anytime.</p>
				<p class="mt-1">
					Questions? <a href="/support" class="text-blue-600 hover:underline">Contact support</a>
				</p>
			</div>
		</div>
	</div>
{/if}
