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
	import bambooDayImage from '$lib/assets/pricing/pricing-bamboo-day.png?enhanced';
	import pineDawnImage from '$lib/assets/pricing/pricing-pine-dawn.png?enhanced';
	import plumSunsetImage from '$lib/assets/pricing/pricing-plum-sunset.png?enhanced';

	import Faq from '$lib/features/payments/components/Faq.svelte';
	import Testimonials from '$lib/features/payments/components/Testimonials.svelte';
	import DowngradeModal from '$lib/features/payments/components/DowngradeModal.svelte';
	import { resolve } from '$app/paths';

	// Plan selection
	let selectedPlan = $state('annual');

	// Feature status tracking
	const { data } = $props();

	// Assumes tiers are 'free', 'plus', 'premium'
	const currentTier = $derived(userManager.effectiveTier);

	// Convert tier configs to basic pricing format

	type PricingTier = (typeof defaultTierConfigs)[UserTier];

	type PricingLoadResult = {
		tiers: Record<UserTier, PricingTier>;
		error?: string;
	};

	type PlanKey = 'free' | 'plus' | 'premium';

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

	// (frequencyLabel and getFeatureValueForPlan were previously defined here but removed as unused)

	function buildFeatureRows(tiers: Record<UserTier, PricingTier>) {
		const { free, plus, premium } = tiers;
		return [
			{
				feature: '1-on-1 with Founder',
				basic: '-',
				plus: '-',
				premium: 'Monthly 15-min call',
				tooltip: 'Personal call with Hiro to discuss your goals and adjust your learning path.'
			},
			{
				feature: 'Direct Support',
				basic: '-',
				plus: 'Email',
				premium: 'Text/Chat anytime',
				tooltip: 'Get help and ask questions between sessions.'
			},
			{
				feature: '28-Day Learning Path',
				basic: '-',
				plus: 'Automated',
				premium: 'Custom (built for you)',
				tooltip: 'Structured learning path to guide your practice.'
			},
			{
				feature: 'Practice Time',
				basic: `${formatTime(free.monthlySeconds)} / month`,
				plus: `${formatTime(plus.monthlySeconds)} / month`,
				premium: `${formatTime(premium.monthlySeconds)} / month`,
				tooltip: 'Total conversation time available each month.'
			},
			{
				feature: 'Custom Scenarios',
				basic: 'During trial only',
				plus: 'Unlimited',
				premium: 'Unlimited',
				tooltip: 'Create your own practice scenarios tailored to your life.'
			},
			{
				feature: 'Regenerate Scenarios',
				basic: '-',
				plus: '✓',
				premium: '✓',
				tooltip: 'Regenerate scenarios to get fresh variations.'
			},
			{
				feature: 'Private Scenarios',
				basic: '-',
				plus: '✓',
				premium: '✓',
				tooltip: 'Keep your custom scenarios private instead of sharing publicly.'
			},
			{
				feature: 'Scenario Translations',
				basic: '50 / month',
				plus: 'Unlimited',
				premium: 'Unlimited',
				tooltip: 'Translate scenarios to practice in different languages.'
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

	function getMobilePriceCopy(tier: PricingTier) {
		if (selectedPlan === 'annual') {
			return {
				price: `$${getAnnualPricePerMonth(tier)}`,
				subline: 'Paid annually'
			};
		}

		return {
			price: formatPriceDisplay(tier.monthlyPriceUsd),
			subline: 'Paid monthly'
		};
	}

	// Loading state for checkout
	let isLoading = $state(false);

	// Downgrade modal state
	let showDowngradeModal = $state(false);

	// Feature comparison toggle (mobile)
	let showFeatureComparison = $state(false);

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

			const checkoutData = await response.json();

			if (response.ok && checkoutData.url) {
				// Redirect to Stripe checkout
				window.location.href = checkoutData.url;
			} else {
				console.error('Checkout error:', checkoutData);
				// eslint-disable-next-line no-alert
				alert(checkoutData.error || 'Failed to create checkout session. Please try again.');
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

	<!-- Pricing JSON-LD structured data -->
	{#if data.pricingJsonLd}
		{#each data.pricingJsonLd as productSchema, i (i)}
			<script type="application/ld+json">
				{JSON.stringify(productSchema)}
			</script>
		{/each}
	{/if}
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
	{@const featureRows = buildFeatureRows(tiers)}

	<div class="container mx-auto max-w-7xl px-4 py-2 sm:py-20">
		{#if result.error}
			<div class="mb-8 alert alert-warning shadow-lg">
				<span>{result.error}</span>
			</div>
		{/if}

		<!-- Founding Member Offer - Simplified -->
		<div
			class="group mb-20 overflow-hidden rounded-3xl border border-accent/30 bg-linear-to-br from-accent/5 via-base-100 to-primary/5"
		>
			<!-- Compact header - always visible -->
			<div class="flex flex-col items-center justify-between gap-6 p-6 sm:flex-row sm:p-8">
				<div class="text-center sm:text-left">
					<p class="mb-1 text-xs font-medium tracking-widest text-accent/80 uppercase">
						{personalizedPathOffer.spotsAvailable} spots for {personalizedPathOffer.availabilityPeriod}
					</p>
					<h2 class="text-xl font-semibold tracking-tight sm:text-2xl">
						Get a learning path built just for you
					</h2>
					<p class="mt-1 text-sm text-base-content/60">
						15 min call with me + custom scenarios + premium access
					</p>
				</div>
				<div class="flex shrink-0 items-center gap-4">
					<div class="text-right">
						<span class="text-lg text-base-content/40 line-through"
							>${personalizedPathOffer.regularPrice}</span
						>
						<span class="ml-2 text-3xl font-bold text-accent"
							>${personalizedPathOffer.foundingMemberPrice}</span
						>
					</div>
					<a href={CALENDAR_LINK} target="_blank" rel="noopener noreferrer" class="btn btn-accent">
						Book Call
					</a>
				</div>
			</div>
		</div>

		<!-- Simplified headline -->
		<div class="mb-12 text-center">
			<p class="mb-3 text-xs font-medium tracking-widest text-base-content/50 uppercase">
				Or practice on your own
			</p>
			<h1 class="mb-3 text-3xl font-semibold tracking-tight sm:text-4xl">
				Practice conversations that matter
			</h1>
			<p class="text-base-content/60">Free trial included · Cancel anytime</p>
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
					Annual
				</button>
			</div>
		</div>

		<div
			class="mx-auto mb-16 grid max-w-4xl grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3 lg:items-start"
		>
			<div
				class="relative flex flex-col overflow-hidden rounded-2xl border border-base-200 bg-base-100 p-6 sm:p-8"
			>
				<div class="pointer-events-none absolute inset-0">
					<enhanced:img
						src={pineDawnImage}
						alt="Sunrise over a pine forest"
						class="h-full w-full object-cover opacity-20 dark:opacity-10"
						sizes="(min-width:1024px) 360px, (min-width:640px) 520px, 100vw"
						loading="lazy"
					/>
				</div>
				<div
					class="pointer-events-none absolute inset-0 bg-linear-to-t from-base-100 via-base-100/80 to-transparent"
				></div>
				<div class="relative">
					<h2 class="text-lg font-medium">{freeTier.name}</h2>
					<p class="mt-3 text-3xl font-semibold">
						$0<span class="text-base font-normal text-base-content/50">/mo</span>
					</p>
					<p class="mt-2 text-sm text-base-content/60">15 minutes to try</p>
					<div class="mt-6">
						{#if isCurrentTier(SubscriptionTier.GUEST) || isCurrentTier(SubscriptionTier.BASIC)}
							<button class="btn w-full btn-soft" disabled>Current plan</button>
						{:else if isOnPaidTier()}
							<button
								class="btn w-full btn-soft btn-error"
								onclick={() => handlePlanSelection('free')}
								disabled={isLoading}
							>
								{isLoading ? 'Processing...' : 'Downgrade'}
							</button>
						{:else}
							<button
								onclick={() => handlePlanSelection('free')}
								class="btn w-full btn-soft"
								disabled={isLoading}
							>
								Get started
							</button>
						{/if}
					</div>
				</div>
			</div>

			<!-- Premium Tier - Plum Sunset (recommended) -->
			<div
				class="relative flex flex-col overflow-hidden rounded-2xl border-2 border-primary bg-base-100 p-6 shadow-xl shadow-primary/10 sm:p-8 lg:-mt-2 lg:mb-2"
			>
				<!-- Ghibli background - plum blossoms at sunset -->
				<div class="pointer-events-none absolute inset-0">
					<enhanced:img
						src={plumSunsetImage}
						alt="Plum blossoms at sunset"
						class="h-full w-full object-cover opacity-25 dark:opacity-15"
						sizes="(min-width:1024px) 360px, (min-width:640px) 520px, 100vw"
						loading="eager"
						fetchpriority="high"
					/>
				</div>
				<div
					class="pointer-events-none absolute inset-0 bg-linear-to-t from-base-100 via-base-100/70 to-transparent"
				></div>
				<div class="relative">
					<div class="flex items-center justify-between">
						<h2 class="text-lg font-medium">{premiumTier.name}</h2>
						<span class="badge badge-sm badge-primary">Best value</span>
					</div>
					{#if selectedPlan === 'monthly'}
						<p class="mt-3 text-3xl font-semibold">
							{formatPriceDisplay(premiumTier.monthlyPriceUsd)}<span
								class="text-base font-normal text-base-content/50">/mo</span
							>
						</p>
					{:else}
						<p class="mt-3 text-3xl font-semibold">
							${getAnnualPricePerMonth(premiumTier)}<span
								class="text-base font-normal text-base-content/50">/mo</span
							>
						</p>
						<p class="text-xs text-base-content/50">billed annually</p>
					{/if}
					<p class="mt-2 text-sm text-base-content/60">10 hours + personal guidance</p>
					<div class="mt-6">
						{#if isCurrentTier(SubscriptionTier.PREMIUM)}
							<button class="btn w-full btn-soft" disabled>Current plan</button>
						{:else}
							<button
								class="btn w-full btn-primary"
								onclick={() => handlePlanSelection('premium')}
								disabled={isLoading}
							>
								{isLoading ? 'Processing...' : 'Start free trial'}
							</button>
						{/if}
					</div>
				</div>
			</div>

			<!-- Plus Tier - Bamboo Day -->
			<div
				class="relative flex flex-col overflow-hidden rounded-2xl border border-base-200 bg-base-100 p-6 sm:p-8"
			>
				<!-- Ghibli background - bamboo forest in daylight -->
				<div class="pointer-events-none absolute inset-0">
					<enhanced:img
						src={bambooDayImage}
						alt="Bamboo forest in daylight"
						class="h-full w-full object-cover opacity-20 dark:opacity-10"
						sizes="(min-width:1024px) 360px, (min-width:640px) 520px, 100vw"
						loading="lazy"
					/>
				</div>
				<div
					class="pointer-events-none absolute inset-0 bg-linear-to-t from-base-100 via-base-100/80 to-transparent"
				></div>
				<div class="relative">
					<h2 class="text-lg font-medium">{plusTier.name}</h2>
					{#if selectedPlan === 'monthly'}
						<p class="mt-3 text-3xl font-semibold">
							{formatPriceDisplay(plusTier.monthlyPriceUsd)}<span
								class="text-base font-normal text-base-content/50">/mo</span
							>
						</p>
					{:else}
						<p class="mt-3 text-3xl font-semibold">
							${getAnnualPricePerMonth(plusTier)}<span
								class="text-base font-normal text-base-content/50">/mo</span
							>
						</p>
						<p class="text-xs text-base-content/50">billed annually</p>
					{/if}
					<p class="mt-2 text-sm text-base-content/60">10 hours, self-guided</p>
					<div class="mt-6">
						{#if isCurrentTier(SubscriptionTier.PLUS)}
							<button class="btn w-full btn-soft" disabled>Current plan</button>
						{:else}
							<button
								class="btn w-full btn-soft"
								onclick={() => handlePlanSelection('plus')}
								disabled={isLoading}
							>
								{isLoading ? 'Processing...' : 'Start free trial'}
							</button>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<!-- Feature Comparison - Collapsible on mobile -->
		<div class="mt-16">
			<!-- Mobile: Collapsible -->
			<div class="text-center lg:hidden">
				<button
					class="inline-flex items-center gap-2 text-sm text-base-content/60 transition hover:text-base-content"
					onclick={() => (showFeatureComparison = !showFeatureComparison)}
				>
					<span>{showFeatureComparison ? 'Hide' : 'Compare'} all features</span>
					<span
						class="icon-[mdi--chevron-down] h-4 w-4 transition-transform {showFeatureComparison
							? 'rotate-180'
							: ''}"
					></span>
				</button>

				{#if showFeatureComparison}
					<div class="mt-6 space-y-3">
						{#each featureRows.slice(0, 6) as feature (feature.feature)}
							<div class="rounded-xl bg-base-200/50 p-4">
								<p class="mb-2 text-sm font-medium">{feature.feature}</p>
								<div class="grid grid-cols-3 gap-2 text-xs">
									<div>
										<p class="text-base-content/50">{freeTier.name}</p>
										<p class="font-medium capitalize">{feature.basic}</p>
									</div>
									<div>
										<p class="text-primary/70">{premiumTier.name}</p>
										<p class="font-semibold text-primary capitalize">{feature.premium}</p>
									</div>
									<div>
										<p class="text-base-content/50">{plusTier.name}</p>
										<p class="font-medium capitalize">{feature.plus}</p>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Desktop: Clean table -->
			<div class="hidden lg:block">
				<h2 class="mb-6 text-center text-xl font-medium text-base-content/70">Compare plans</h2>
				<div class="overflow-hidden rounded-xl border border-base-200 bg-base-100">
					<table class="table text-center">
						<thead>
							<tr class="bg-base-200/50">
								<th class="w-2/5 text-left font-medium"></th>
								<th class="font-medium">{freeTier.name}</th>
								<th class="font-semibold text-primary">{premiumTier.name}</th>
								<th class="font-medium">{plusTier.name}</th>
							</tr>
						</thead>
						<tbody>
							{#each featureRows as feature (feature.feature)}
								<tr class="border-base-200/50">
									<td class="text-left text-sm text-base-content/80">{feature.feature}</td>
									<td class="text-sm capitalize">{feature.basic}</td>
									<td class="text-sm font-medium text-primary capitalize">{feature.premium}</td>
									<td class="text-sm capitalize">{feature.plus}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
				<p class="mt-3 text-center text-xs text-base-content/40">
					* 1-on-1 calls available while we're small
				</p>
			</div>
		</div>

		<Testimonials />

		<Faq />
	</div>
{:catch error}
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
