<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { posthogManager } from '$lib/client/posthog';
	import { userManager } from '$lib/stores/user.store.svelte';
	import { SubscriptionTier } from '$lib/enums.js';
	import { defaultTierConfigs, type UserTier } from '$lib/data/tiers';
	import {
		formatPrice,
		calculateAnnualDiscount
	} from '$lib/features/payments/services/stripe.service';
	import { PricingService } from '$lib/features/payments/services/pricing.service';
	import { env as publicEnv } from '$env/dynamic/public';
	import WhyDifferent from '$lib/components/WhyDifferent.svelte';
	import Faq from '$lib/features/payments/components/Faq.svelte';
	import { resolve } from '$app/paths';

	// Get page data from server using runes
	const {} = $props();

	// Plan selection
	let selectedPlan = $state('annual');

	// Feature status tracking
	const COMING_SOON = 'COMING SOON';

	// Assumes tiers are 'free', 'plus', 'premium'
	const currentTier = $derived(userManager.effectiveTier);

	// Convert tier configs to basic pricing format

	type PricingTier = (typeof defaultTierConfigs)[UserTier];
	type PricingApiTier = Partial<PricingTier> & { id: string };
	type PricingLoadResult = {
		tiers: Record<UserTier, PricingTier>;
		error?: string;
	};

	const pricingPromise = fetchPricingData();

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
				feature: 'Feedback & Reports',
				basic: '10 reports / month',
				plus: 'Unlimited',
				premium: 'Unlimited',
				tooltip: 'Receive detailed feedback on your conversations.'
			},
			{
				feature: 'Customized Phrases',
				basic: frequencyLabel(free.customizedPhrasesFrequency),
				plus: frequencyLabel(plus.customizedPhrasesFrequency),
				premium: frequencyLabel(premium.customizedPhrasesFrequency),
				tooltip: 'Get new phrases to practice every day.'
			},
			{
				feature: 'Conversation Memory',
				basic: free.conversationMemoryLevel,
				plus: plus.conversationMemoryLevel,
				premium: premium.conversationMemoryLevel,
				tooltip: 'Our AI remembers past conversations to personalize your learning.'
			},
			{
				feature: 'Anki Export',
				basic: `First ${free.ankiExportLimit ?? 0} words`,
				plus: '✓',
				premium: '✓',
				status: COMING_SOON,
				tooltip: 'Easily export vocabulary to Anki for spaced repetition practice.'
			}
		];
	}

	// Testimonial logic
	let currentTestimonial = $state(0);
	const testimonials = [
		{
			name: 'David T.',
			text: 'Being able to practice realistic conversations has helped me gain confidence in speaking Japanese. The feedback is so helpful!',
			language: 'Japanese'
		},
		{
			name: 'Scott H.',
			text: 'Kaiwa is like WD-40 for being rusty at a language.',
			language: 'Spanish'
		},
		{
			name: 'Miguel L.',
			text: "I love how Kaiwa adapts to my skill level. It's like having a patient tutor available whenever I have time to practice.",
			language: 'French'
		}
	];

	// Early‑Backer price id (optional)
	const earlyBackerPriceId = $state(publicEnv.PUBLIC_STRIPE_EARLY_BACKER_PRICE_ID || '');

	async function handleEarlyBackerCheckout() {
		await PricingService.handleEarlyBackerCheckout(earlyBackerPriceId, userManager.user);
	}

	onMount(() => {
		const interval = setInterval(() => {
			currentTestimonial = (currentTestimonial + 1) % testimonials.length;
		}, 5000);
		posthogManager.trackEvent('pricing_page_viewed', { plan: selectedPlan });
		return () => clearInterval(interval);
	});

	async function handleGetStarted() {
		console.log('handleGetStarted', userManager.isLoggedIn);
		if (!userManager.isLoggedIn) {
			await goto(resolve('/auth'));
		} else {
			await goto('/');
		}
	}

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
</script>

<svelte:head>
	<title>Kaiwa | Pricing Plans</title>
	<meta
		name="description"
		content="Choose a Kaiwa plan that fits your language learning goals. Basic, Plus, and Premium options available."
	/>
	<meta
		name="keywords"
		content="Kaiwa pricing, language learning pricing, AI conversation practice plans, Japanese learning, Spanish practice, language app subscription"
	/>
	<meta property="og:title" content="Kaiwa | Pricing Plans" />
	<meta
		property="og:description"
		content="Compare Kaiwa plans and choose the conversation practice that fits your goals."
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
			{#each Array.from({ length: 3 }) as _ (_)}
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
				{#each Array.from({ length: 8 }) as _ (_)}
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

		<div class="mb-16 text-center">
			<h1 class="mb-4 text-4xl font-bold tracking-tight lg:text-5xl">
				Kaiwa Pricing: Choose Your AI Language Learning Plan
			</h1>
			<p class="mx-auto max-w-3xl text-lg text-base-content/70 lg:text-xl">
				Start practicing conversations for free, then unlock more practice time with our affordable
				subscription plans. Perfect for learning Japanese, Spanish, French, and more through
				AI-powered conversation practice.
			</p>
			<div class="mt-6 flex justify-center space-x-6 text-sm opacity-70">
				<span>✓ Free trial included</span>
				<span>✓ Cancel anytime</span>
				<span>✓ All languages included</span>
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
				{:else}
					<button onclick={handleGetStarted} class="btn mt-8 w-full btn-outline">Get Started</button
					>
				{/if}
			</div>

			<div
				class="flex flex-col items-center rounded-2xl border-2 border-primary bg-base-100 p-8 text-center shadow-xl shadow-primary/20"
			>
				<div class="flex items-center gap-2">
					<span class="icon-[mdi--star] h-6 w-6 text-yellow-400"></span>
					<h2 class="text-2xl font-semibold">{plusTier.name} - Most Popular</h2>
				</div>
				<p class="mt-4 badge badge-outline badge-primary">Best for Regular Learners</p>

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
					{plusTier.description} • 300 minutes monthly • Advanced features • Perfect for consistent practice
				</p>
				<div class="flex-grow"></div>
				{#if isCurrentTier(SubscriptionTier.PLUS)}
					<button class="btn mt-8 w-full btn-outline" disabled>Your Current Plan</button>
				{:else}
					<button class="btn mt-8 w-full btn-primary">Start Free Trial</button>
				{/if}
			</div>

			<div class="flex flex-col items-center rounded-2xl border bg-base-100 p-8 text-center">
				<div class="flex items-center gap-2">
					<span class="icon-[mdi--crown] h-6 w-6 text-purple-400"></span>
					<h2 class="text-2xl font-semibold">{premiumTier.name} - Power Users</h2>
				</div>

				{#if selectedPlan === 'monthly'}
					<p class="mt-4 text-4xl font-bold">
						{formatPriceDisplay(premiumTier.monthlyPriceUsd)}
						<span class="text-xl font-normal text-base-content/60">/month</span>
					</p>
				{:else}
					<p class="mt-4 text-4xl font-bold">
						${getAnnualPricePerMonth(premiumTier)}
						<span class="text-xl font-normal text-base-content/60">/month</span>
					</p>
				{/if}
				<p class="mt-4 min-h-[4rem] text-base-content/70">
					{premiumTier.description} • 600 minutes monthly • Maximum practice time • Unlimited features
				</p>
				<div class="flex-grow"></div>
				{#if isCurrentTier(SubscriptionTier.PREMIUM)}
					<button class="btn mt-8 w-full btn-outline" disabled>Your Current Plan</button>
				{:else}
					<button class="btn mt-8 w-full btn-outline btn-primary">Start Free Trial</button>
				{/if}
			</div>
		</div>

		{#if earlyBackerPriceId}
			<div
				class="mx-auto mb-10 max-w-5xl rounded-2xl border-2 border-success/40 bg-success/5 p-6 text-center"
			>
				<div class="mb-2 text-lg font-semibold">Early‑Backer</div>
				<p class="mb-4 text-base-content/70">
					Support the mission and unlock more practice time — $5/mo for 12 months.
				</p>
				<button class="btn btn-success" onclick={handleEarlyBackerCheckout}>Support + Unlock</button
				>
			</div>
		{/if}

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

		<div class="mx-auto mt-24 max-w-5xl">
			<h2 class="mb-12 text-center text-3xl font-bold">What Our Users Say</h2>

			<div class="relative mb-12 h-48">
				{#each testimonials as testimonial, i (testimonial.name)}
					<div
						class="absolute top-0 left-0 w-full px-4 transition-opacity duration-500 ease-in-out"
						style="opacity: {i === currentTestimonial ? '1' : '0'};"
					>
						<div class="mx-auto flex max-w-2xl flex-col items-center text-center">
							<p class="mb-4 text-xl italic">"{testimonial.text}"</p>
							<div>
								<p class="font-bold">{testimonial.name}</p>
								<p class="text-sm text-base-content/70">
									Learning {testimonial.language}
								</p>
							</div>
						</div>
					</div>
				{/each}
			</div>
			<div class="mb-20 flex justify-center gap-2">
				{#each testimonials as _, i (_)}
					<button
						aria-label={`Testimonial ${i + 1}`}
						onclick={() => (currentTestimonial = i)}
						class="h-2.5 w-2.5 rounded-full transition-colors duration-300
           {i === currentTestimonial
							? 'bg-primary'
							: 'bg-base-content/20 hover:bg-base-content/40'}"
					>
					</button>
				{/each}
			</div>

			<Faq />
		</div>

		<!-- Extended Differentiators (educate near bottom) -->
		<div class="mt-24">
			<WhyDifferent variant="extended" />
		</div>
	</div>
{:catch error}
	<div class="container mx-auto max-w-4xl px-4 py-16">
		<div class="alert alert-error shadow-lg">
			<span>We couldn't load pricing details. Please refresh the page to try again.</span>
		</div>
	</div>
{/await}
