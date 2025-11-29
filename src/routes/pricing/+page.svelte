<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { posthogManager } from '$lib/client/posthog';
	import { userManager } from '$lib/stores/user.store.svelte';
	import { SubscriptionTier } from '$lib/enums.js';
	import { defaultTierConfigs, type UserTier } from '$lib/data/tiers';
	import { personalizedPathOffer } from '$lib/data/marketing';
	import { CALENDAR_LINK } from '$lib/data/calendar';
	import {
		formatPrice,
		calculateAnnualDiscount
	} from '$lib/features/payments/services/stripe.service';
	import { PricingService } from '$lib/features/payments/services/pricing.service';

	import Faq from '$lib/features/payments/components/Faq.svelte';
	import Testimonials from '$lib/features/payments/components/Testimonials.svelte';
	import DowngradeModal from '$lib/features/payments/components/DowngradeModal.svelte';
	import { resolve } from '$app/paths';

	// Plan selection
	let selectedPlan = $state('annual');

	// Feature status tracking
	const COMING_SOON = 'COMING SOON';

	// Assumes tiers are 'free', 'plus', 'premium'
	const currentTier = $derived(userManager.effectiveTier);

	// Convert tier configs to basic pricing format

	type PricingTier = (typeof defaultTierConfigs)[UserTier];

	type PricingLoadResult = {
		tiers: Record<UserTier, PricingTier>;
		error?: string;
	};

	// Initialize pricingPromise as a deferred promise
	let pricingPromise = new Promise<PricingLoadResult>((resolve) => {
		if (typeof window !== 'undefined') {
			// Client-side only
			fetchPricingData().then(resolve);
		}
	});

	async function fetchPricingData(): Promise<PricingLoadResult> {
		const fallback: Record<UserTier, PricingTier> = {
			free: { ...defaultTierConfigs.free },
			plus: { ...defaultTierConfigs.plus },
			premium: { ...defaultTierConfigs.premium }
		};

		try {
			const tiers = await PricingService.fetchPricing();
			const hydrated: Record<UserTier, PricingTier> = {
				free: { ...fallback.free },
				plus: { ...fallback.plus },
				premium: { ...fallback.premium }
			};

			for (const tier of tiers) {
				const id = tier.id as UserTier;
				if (id && id in hydrated) {
					hydrated[id] = { ...hydrated[id], ...tier } as PricingTier;
				}
			}

			return { tiers: hydrated };
		} catch (error) {
			console.error('Failed to load pricing data', error);
			return {
				tiers: fallback,
				error:
					error instanceof Error
						? `${error.message}. Showing cached pricing while we reconnect.`
						: 'Showing cached pricing while we reconnect.'
			};
		}
	}

	// Helper function to format seconds to human readable format
	function formatTime(seconds: number | null | undefined): string {
		if (!seconds) return 'Unlimited';
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) {
			return `${minutes} minutes`;
		}
		const hours = Math.floor(minutes / 60);
		const remainingMinutes = minutes % 60;
		if (remainingMinutes === 0) {
			return `${hours} hours`;
		}
		return `${hours}h ${remainingMinutes}m`;
	}

	// Helper function to format price
	function formatPriceDisplay(price: string | number | null | undefined): string {
		if (price === null || price === undefined) return '$0';
		const value = typeof price === 'string' ? parseFloat(price) : price;
		if (!Number.isFinite(value) || value === 0) return '$0';
		return formatPrice(value as number);
	}

	function computeAnnualDiscount(tier: PricingTier): number {
		if (!tier.monthlyPriceUsd || !tier.annualPriceUsd) return 0;
		return calculateAnnualDiscount(
			parseFloat(tier.monthlyPriceUsd),
			parseFloat(tier.annualPriceUsd)
		);
	}

	function frequencyLabel(value: string | null | undefined): string {
		if (value === 'daily') return 'Daily';
		return 'Weekly';
	}

	function buildFeatureRows(tiers: Record<UserTier, PricingTier>) {
		const { free, plus, premium } = tiers;
		return [
			{
				feature: 'Practice Time',
				basic: `${formatTime(free.monthlySeconds)} / month`,
				plus: `${formatTime(plus.monthlySeconds)} / month`,
				premium: `${formatTime(premium.monthlySeconds)} / month`,
				tooltip: 'Total conversation time available each month.'
			},
			{
				feature: '28-Day Learning Path',
				basic: '-',
				plus: 'Automated',
				premium: 'Custom (built for you)',
				tooltip: 'Structured learning path to guide your practice.'
			},
			{
				feature: 'Monthly Call',
				basic: '-',
				plus: '-',
				premium: '15 min with Hiro',
				tooltip: 'Personal check-in call to adjust your learning path.'
			},
			{
				feature: 'Text/Chat Support',
				basic: '-',
				plus: 'Email only',
				premium: 'Direct messaging',
				tooltip: 'Get help and ask questions between sessions.'
			},
			{
				feature: 'Feedback & Reports',
				basic: '10 reports / month',
				plus: 'Unlimited',
				premium: 'Unlimited',
				tooltip: 'Receive detailed feedback on your conversations.'
			},
			{
				feature: 'Conversation Memory',
				basic: free.conversationMemoryLevel,
				plus: plus.conversationMemoryLevel,
				premium: premium.conversationMemoryLevel,
				tooltip: 'Our AI remembers past conversations to personalize your learning.'
			},
			{
				feature: 'Rollover Minutes',
				basic: '-',
				plus: `${formatTime(plus.maxBankedSeconds)}`,
				premium: `${formatTime(premium.maxBankedSeconds)}`,
				tooltip: 'Unused minutes roll over to the next month.'
			}
		];
	}

	function getCycleFromQuery(): 'monthly' | 'annual' | null {
		if (typeof window === 'undefined') return null;
		const searchParams = new URLSearchParams(window.location.search);
		const cycle = searchParams.get('billing')?.toLowerCase();
		return cycle === 'monthly' || cycle === 'annual' ? cycle : null;
	}

	onMount(() => {
		const cycle = getCycleFromQuery();
		if (cycle) {
			selectedPlan = cycle;
		}
		posthogManager.trackEvent('pricing_page_viewed', { plan: selectedPlan });
	});

	function isCurrentTier(tier: SubscriptionTier): boolean {
		return currentTier?.toLowerCase() === tier.toLowerCase();
	}

	function selectBillingCycle(cycle: 'monthly' | 'annual') {
		selectedPlan = cycle;
		posthogManager.trackEvent('pricing_toggle_clicked', {
			billing_cycle: cycle
		});
	}

	function getAnnualPricePerMonth(tier: PricingTier): string {
		if (!tier.annualPriceUsd || tier.annualPriceUsd === '0') return '0';
		const annual = parseFloat(tier.annualPriceUsd);
		if (Number.isNaN(annual) || annual === 0) return '0';
		return (annual / 12).toFixed(2);
	}

	// Loading state for checkout
	let isLoading = $state(false);

	// Downgrade modal state
	let showDowngradeModal = $state(false);

	// Check if user is on a paid tier
	function isOnPaidTier(): boolean {
		const tier = currentTier?.toLowerCase();
		return tier === 'plus' || tier === 'premium';
	}

	// Handle plan selection
	async function handlePlanSelection(tierId: string) {
		if (!userManager.isLoggedIn) {
			// Redirect to auth if not logged in
			await goto(resolve('/auth'));
			return;
		}

		if (tierId === 'free') {
			// Check if user is downgrading from a paid tier
			if (isOnPaidTier()) {
				// Show downgrade modal to collect feedback
				showDowngradeModal = true;
				return;
			}
			// Free tier - just redirect to dashboard
			await goto('/');
			return;
		}

		isLoading = true;

		try {
			// Map selectedPlan to billing cycle ('annual' or 'monthly')
			const billing = selectedPlan === 'annual' ? 'annual' : 'monthly';

			// Track checkout started
			posthogManager.trackEvent('checkout_started', {
				tier: tierId,
				billing_cycle: billing,
				source: 'pricing_page'
			});

			// Call checkout API
			const response = await fetch('/api/billing/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					tier: tierId,
					billing,
					successPath: '/profile?upgraded=true',
					cancelPath: '/pricing?cancelled=true'
				})
			});

			const data = await response.json();

			if (response.ok && data.url) {
				// Redirect to Stripe checkout
				window.location.href = data.url;
			} else {
				console.error('Checkout error:', data);
				// eslint-disable-next-line no-alert
				alert(data.error || 'Failed to create checkout session. Please try again.');
			}
		} catch (error) {
			console.error('Checkout error:', error);
			// eslint-disable-next-line no-alert
			alert('Something went wrong. Please try again.');
		} finally {
			isLoading = false;
		}
	}

	// Handle downgrade confirmation
	async function handleDowngradeConfirm(reason: string, feedback: string) {
		isLoading = true;

		try {
			const response = await fetch('/api/billing/cancel', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ reason, feedback })
			});

			const data = await response.json();

			if (response.ok) {
				// Show success message
				// eslint-disable-next-line no-alert
				alert(
					`Your subscription has been cancelled and will remain active until the end of your billing period. Thank you for your feedback!`
				);
				// Redirect to profile page
				await goto('/profile?downgraded=true');
			} else {
				throw new Error(data.error || 'Failed to cancel subscription');
			}
		} catch (error) {
			console.error('Downgrade error:', error);
			throw error; // Re-throw to let modal handle it
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Kaiwa | Pricing Plans</title>
	<meta
		name="description"
		content="Practice real conversations with loved ones. Go beyond Duolingo basics and see their face light up when you speak. Free trial included."
	/>
	<meta
		name="keywords"
		content="practice conversations with family, learn language for loved ones, speak to partner's family, heritage language practice, conversation practice not Duolingo"
	/>
	<meta property="og:title" content="Kaiwa | Practice Real Conversations" />
	<meta
		property="og:description"
		content="Go beyond tourist phrases. Practice conversations that make your loved ones' faces light up with pride."
	/>
	<meta property="og:type" content="website" />
</svelte:head>

{#await pricingPromise}
	<div class="container mx-auto max-w-7xl space-y-16 px-4 py-16 sm:py-20">
		<div class="space-y-4 text-center">
			<div class="mx-auto h-12 w-3/4 max-w-2xl skeleton"></div>
			<div class="mx-auto h-4 w-full max-w-3xl skeleton"></div>
			<div class="mx-auto h-4 w-2/3 max-w-xl skeleton"></div>
			<div class="flex justify-center gap-4 pt-4">
				<div class="h-5 w-24 skeleton"></div>
				<div class="h-5 w-28 skeleton"></div>
				<div class="h-5 w-32 skeleton"></div>
			</div>
		</div>

		<div class="flex justify-center">
			<div class="join">
				<div class="rounded-btn h-11 w-28 skeleton"></div>
				<div class="rounded-btn h-11 w-28 skeleton"></div>
			</div>
		</div>

		<div class="grid gap-8 lg:grid-cols-3">
			{#each Array.from({ length: 3 }) as _, i (i)}
				<div
					class="flex flex-col items-center rounded-2xl border bg-base-100 p-8 text-center shadow-sm"
				>
					<div class="h-6 w-3/4 skeleton"></div>
					<div class="mt-4 h-12 w-1/2 skeleton"></div>
					<div class="mt-4 h-4 w-full skeleton"></div>
					<div class="mt-2 h-4 w-5/6 skeleton"></div>
					<div class="mt-10 h-12 w-full skeleton"></div>
				</div>
			{/each}
		</div>

		<div class="rounded-2xl border bg-base-100 p-6">
			<div class="h-6 w-1/4 skeleton"></div>
			<div class="mt-6 grid gap-4 lg:grid-cols-4">
				{#each Array.from({ length: 8 }) as _, i (i)}
					<div class="h-4 w-full skeleton"></div>
				{/each}
			</div>
		</div>
	</div>
{:then result}
	{@const tiers = result.tiers}
	{@const freeTier = tiers.free}
	{@const plusTier = tiers.plus}
	{@const premiumTier = tiers.premium}
	{@const plusDiscount = computeAnnualDiscount(plusTier)}
	{@const featureRows = buildFeatureRows(tiers)}

	<div class="container mx-auto max-w-7xl px-4 py-16 sm:py-20">
		{#if result.error}
			<div class="mb-8 alert alert-warning shadow-lg">
				<span>{result.error}</span>
			</div>
		{/if}

		<!-- Personalized Path Featured Offer -->
		<div class="mb-16 rounded-3xl border-2 border-accent bg-gradient-to-br from-accent/10 via-base-100 to-primary/10 p-8 shadow-xl md:p-12">
			<div class="grid gap-8 lg:grid-cols-2 lg:items-center">
				<div>
					<div class="mb-4 inline-flex items-center gap-2 rounded-full bg-accent/20 px-4 py-1 text-sm font-medium text-accent">
						<span class="icon-[mdi--star-four-points] h-4 w-4"></span>
						{personalizedPathOffer.tagline}
					</div>
					<h2 class="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
						{personalizedPathOffer.headline}
					</h2>
					<p class="mb-6 text-lg text-base-content/80">
						{personalizedPathOffer.description}
					</p>
					<ul class="mb-6 space-y-3">
						<li class="flex items-start gap-3">
							<span class="icon-[mdi--check-circle] mt-0.5 h-5 w-5 shrink-0 text-success"></span>
							<span><strong>15 minutes with me, personally</strong>: We'll talk through your exact situation and goals</span>
						</li>
						<li class="flex items-start gap-3">
							<span class="icon-[mdi--check-circle] mt-0.5 h-5 w-5 shrink-0 text-success"></span>
							<span><strong>Custom path built for you</strong>: 14 or 28 days of scenarios designed for YOUR life</span>
						</li>
						<li class="flex items-start gap-3">
							<span class="icon-[mdi--crown] mt-0.5 h-5 w-5 shrink-0 text-accent"></span>
							<span><strong>Premium access included</strong>: Unlimited practice time during your entire path</span>
						</li>
						<li class="flex items-start gap-3">
							<span class="icon-[mdi--check-circle] mt-0.5 h-5 w-5 shrink-0 text-success"></span>
							<span><strong>Mid-path check-in</strong>: We'll review progress and adjust if needed</span>
						</li>
					</ul>
				</div>
				<div class="text-center lg:text-right">
					<div class="inline-block rounded-2xl bg-base-100 p-8 shadow-lg">
						<p class="mb-1 text-sm font-medium text-base-content/70">Then unlock your path for</p>
						<div class="mb-2 flex items-center justify-center gap-2">
							<p class="text-2xl font-medium text-base-content/40 line-through">${personalizedPathOffer.regularPrice}</p>
							<p class="text-5xl font-bold text-accent">${personalizedPathOffer.foundingMemberPrice}</p>
						</div>
						<p class="mb-4 text-sm text-base-content/70">Founding member price</p>
						<p class="mb-6 text-xs text-base-content/50">Only {personalizedPathOffer.spotsAvailable} spots for {personalizedPathOffer.availabilityPeriod}</p>
						<a
							href={CALENDAR_LINK}
							target="_blank"
							rel="noopener noreferrer"
							class="btn btn-accent btn-lg w-full gap-2"
						>
							<span class="icon-[mdi--calendar-check] h-5 w-5"></span>
							{personalizedPathOffer.ctaText}
						</a>
						<p class="mt-3 text-xs text-base-content/50">
							{personalizedPathOffer.ctaSubtext}
						</p>
					</div>
				</div>
			</div>
		</div>

		<div class="mb-16 text-center">
			<p class="mb-2 text-sm font-medium uppercase tracking-wider text-base-content/50">Or practice on your own</p>
			<h1 class="mb-4 text-4xl font-bold tracking-tight lg:text-5xl">
				Practice Real Conversations With Loved Ones
			</h1>
			<p class="mx-auto max-w-3xl text-lg text-base-content/70 lg:text-xl">
				Go beyond Duolingo basics. Practice the conversations that matter, so you can see their face
				light up with pride when you speak.
			</p>
			<div class="mt-6 flex justify-center space-x-6 text-sm opacity-70">
				<span>✓ Free trial included</span>
				<span>✓ Cancel anytime</span>
				<span>✓ 20+ languages included</span>
			</div>
		</div>

		<div class="mb-12 flex justify-center">
			<div class="join">
				<button
					class="btn join-item btn-md {selectedPlan === 'monthly'
						? 'btn-active btn-primary'
						: 'btn-soft'}"
					onclick={() => selectBillingCycle('monthly')}>Monthly</button
				>
				<button
					class="btn join-item btn-md {selectedPlan === 'annual'
						? 'btn-active btn-primary'
						: 'btn-soft'}"
					onclick={() => selectBillingCycle('annual')}
				>
					Annual <span class="ml-2 badge badge-outline badge-success">Save {plusDiscount}%</span>
				</button>
			</div>
		</div>

		<div class="mx-auto mb-20 grid max-w-5xl grid-cols-1 gap-8 lg:grid-cols-3">
			<div class="flex flex-col items-center rounded-2xl border bg-base-100 p-8 text-center">
				<h2 class="mb-4 text-2xl font-semibold">{freeTier.name} - Free Forever</h2>
				<p class="text-4xl font-bold">
					FREE
					<span class="text-xl font-normal text-base-content/60">/forever</span>
				</p>
				<p class="mt-2 text-sm text-primary">15 minutes practice time included</p>
				<p class="mt-4 min-h-[4rem] text-base-content/70">
					{freeTier.description} • Perfect for trying AI conversation practice
				</p>
				<div class="flex-grow"></div>
				{#if isCurrentTier(SubscriptionTier.GUEST) || isCurrentTier(SubscriptionTier.BASIC)}
					<button class="btn mt-8 w-full btn-outline" disabled>Your Current Plan</button>
				{:else if isOnPaidTier()}
					<button
						class="btn mt-8 w-full btn-outline btn-error"
						onclick={() => handlePlanSelection('free')}
						disabled={isLoading}
					>
						{#if isLoading}
							<span class="loading loading-sm loading-spinner"></span>
							Processing...
						{:else}
							Downgrade to Free
						{/if}
					</button>
				{:else}
					<button
						onclick={() => handlePlanSelection('free')}
						class="btn mt-8 w-full btn-outline"
						disabled={isLoading}
					>
						Get Started
					</button>
				{/if}
			</div>

			<div
				class="flex flex-col items-center rounded-2xl border-2 border-primary bg-base-100 p-8 text-center shadow-xl shadow-primary/20"
			>
				<div class="flex items-center gap-2">
					<span class="icon-[mdi--star] h-6 w-6 text-yellow-400"></span>
					<h2 class="text-2xl font-semibold">{plusTier.name}</h2>
				</div>
				<p class="mt-4 badge badge-outline badge-primary">Most Popular</p>

				{#if selectedPlan === 'monthly'}
					<p class="mt-4 text-4xl font-bold">
						{formatPriceDisplay(plusTier.monthlyPriceUsd)}
						<span class="text-xl font-normal text-base-content/60">/month</span>
					</p>
				{:else}
					<p class="mt-4 text-4xl font-bold">
						${getAnnualPricePerMonth(plusTier)}
						<span class="text-xl font-normal text-base-content/60">/month</span>
					</p>
				{/if}
				<p class="mt-4 min-h-[4rem] text-base-content/70">
					10 hours of AI practice monthly with automated 28-day learning paths
				</p>
				<div class="flex-grow"></div>
				{#if isCurrentTier(SubscriptionTier.PLUS)}
					<button class="btn mt-8 w-full btn-outline" disabled>Your Current Plan</button>
				{:else}
					<button
						class="btn mt-8 w-full btn-primary"
						onclick={() => handlePlanSelection('plus')}
						disabled={isLoading}
					>
						{#if isLoading}
							<span class="loading loading-sm loading-spinner"></span>
							Processing...
						{:else}
							Start Free Trial
						{/if}
					</button>
				{/if}
			</div>

			<div class="flex flex-col items-center rounded-2xl border-2 border-accent bg-base-100 p-8 text-center">
				<div class="flex items-center gap-2">
					<span class="icon-[mdi--crown] h-6 w-6 text-purple-400"></span>
					<h2 class="text-2xl font-semibold">{premiumTier.name}</h2>
				</div>
				<p class="mt-2 text-sm text-base-content/50 line-through">$99/month value</p>

				{#if selectedPlan === 'monthly'}
					<p class="mt-2 text-4xl font-bold text-accent">
						{formatPriceDisplay(premiumTier.monthlyPriceUsd)}
						<span class="text-xl font-normal text-base-content/60">/month</span>
					</p>
				{:else}
					<p class="mt-2 text-4xl font-bold text-accent">
						${getAnnualPricePerMonth(premiumTier)}
						<span class="text-xl font-normal text-base-content/60">/month</span>
					</p>
				{/if}
				<p class="mt-4 text-base-content/70">
					Everything in Plus, with human touch:
				</p>
				<ul class="mt-2 space-y-1 text-left text-sm text-base-content/70">
					<li class="flex items-center gap-2">
						<span class="icon-[mdi--phone] h-4 w-4 text-accent"></span>
						15-min monthly call
					</li>
					<li class="flex items-center gap-2">
						<span class="icon-[mdi--message-text] h-4 w-4 text-accent"></span>
						Text/chat support
					</li>
					<li class="flex items-center gap-2">
						<span class="icon-[mdi--road-variant] h-4 w-4 text-accent"></span>
						Custom learning path
					</li>
				</ul>
				<div class="flex-grow"></div>
				{#if isCurrentTier(SubscriptionTier.PREMIUM)}
					<button class="btn mt-8 w-full btn-outline" disabled>Your Current Plan</button>
				{:else}
					<button
						class="btn mt-8 w-full btn-outline btn-primary"
						onclick={() => handlePlanSelection('premium')}
						disabled={isLoading}
					>
						{#if isLoading}
							<span class="loading loading-sm loading-spinner"></span>
							Processing...
						{:else}
							Start Free Trial
						{/if}
					</button>
				{/if}
			</div>
		</div>

		<div class="mt-24">
			<h2 class="mb-10 text-center text-3xl font-bold">Feature Comparison</h2>
			<div class="overflow-x-auto rounded-xl border bg-base-100">
				<table class="table table-lg text-center">
					<thead>
						<tr class="bg-base-200">
							<th class="w-2/5 text-left"></th>
							<th class="text-lg">{freeTier.name}</th>
							<th class="text-lg text-accent">{plusTier.name}</th>
							<th class="text-lg">{premiumTier.name}</th>
						</tr>
					</thead>
					<tbody>
						{#each featureRows as feature (feature.feature)}
							<tr class="hover">
								<td class="text-left font-medium text-base-content/90">
									{feature.feature}
								</td>
								<td class="font-light capitalize">{feature.basic}</td>
								<td class="font-semibold text-accent capitalize">{feature.plus}</td>
								<td class="font-medium capitalize">{feature.premium}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>

		<Testimonials />

		<Faq />
	</div>
{:catch _error}
	<div class="container mx-auto max-w-4xl px-4 py-16">
		<div class="alert alert-error shadow-lg">
			<span>We couldn't load pricing details. Please refresh the page to try again.</span>
		</div>
	</div>
{/await}

<!-- Downgrade Modal -->
<DowngradeModal
	bind:isOpen={showDowngradeModal}
	currentTier={currentTier || 'plus'}
	onConfirm={handleDowngradeConfirm}
/>
