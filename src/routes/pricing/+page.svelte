<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { posthogManager } from '$lib/client/posthog';
	import { userManager } from '$lib/stores/user.store.svelte';
	import { SubscriptionTier } from '$lib/enums.js';
	import { defaultTierConfigs } from '$lib/data/tiers';
	import { formatPrice, calculateAnnualDiscount } from '$lib/client/stripe.service';
	import { env as publicEnv } from '$env/dynamic/public';
	import WhyDifferent from '$lib/components/WhyDifferent.svelte';

	// Get page data from server using runes
	const { data } = $props();

	// Plan selection
	let selectedPlan = $state('annual');

	// Feature status tracking
	const COMING_SOON = 'COMING SOON';

	// Assumes tiers are 'free', 'plus', 'premium'
	const currentTier = $derived(userManager.effectiveTier);

	// Convert tier configs to basic pricing format

	// Get tier configs
	const freeTier = defaultTierConfigs.free;
	const plusTier = defaultTierConfigs.plus;
	const premiumTier = defaultTierConfigs.premium;

	// Calculate annual discounts using Stripe service
	const plusDiscount = $derived(
		plusTier.monthlyPriceUsd && plusTier.annualPriceUsd
			? calculateAnnualDiscount(
					parseFloat(plusTier.monthlyPriceUsd),
					parseFloat(plusTier.annualPriceUsd)
				)
			: 0
	);

	// Helper function to format seconds to human readable format
	function formatTime(seconds: number | null): string {
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
	function formatPriceDisplay(price: string | null): string {
		if (!price || price === '0') return '$0';
		return formatPrice(parseFloat(price));
	}

	// Helper function to calculate annual discount

	// Feature comparison based on tier data
	const allFeatures = [
		{
			feature: 'Monthly Practice Time',
			basic: `${formatTime(freeTier.monthlySeconds)} + $${freeTier.overagePricePerMinuteInCents / 100}/extra minute`,
			plus: `${formatTime(plusTier.monthlySeconds)} + $${plusTier.overagePricePerMinuteInCents / 100}/extra minute`,
			premium: `${formatTime(premiumTier.monthlySeconds)} + $${premiumTier.overagePricePerMinuteInCents / 100}/extra minute`,
			tooltip: 'Total conversation time available each month.'
		},
		{
			feature: 'Max Session Length',
			basic: formatTime(freeTier.maxSessionLengthSeconds),
			plus: formatTime(plusTier.maxSessionLengthSeconds),
			premium: formatTime(premiumTier.maxSessionLengthSeconds),
			tooltip: 'Maximum duration for a single conversation practice.'
		},
		{
			feature: 'Session Banking',
			basic: '—',
			plus: freeTier.sessionBankingEnabled
				? `Unused minutes rollover (${formatTime(plusTier.maxBankedSeconds)})`
				: '—',
			premium: premiumTier.sessionBankingEnabled
				? `Unused minutes rollover (${formatTime(premiumTier.maxBankedSeconds)})`
				: '—',
			tooltip: 'Save your practice time. Use it when you need it.'
		},
		{
			feature: 'Feedback & Reports',
			basic: `${freeTier.feedbackSessionsPerMonth} sessions / month`,
			plus:
				plusTier.feedbackSessionsPerMonth === 'unlimited'
					? 'After every session'
					: `${plusTier.feedbackSessionsPerMonth} sessions / month`,
			premium:
				premiumTier.feedbackSessionsPerMonth === 'unlimited'
					? 'After every session'
					: `${premiumTier.feedbackSessionsPerMonth} sessions / month`,
			tooltip: 'Receive detailed feedback on your conversations.'
		},
		{
			feature: 'Customized Phrases',
			basic: freeTier.customizedPhrasesFrequency === 'daily' ? 'Daily' : 'Weekly',
			plus: plusTier.customizedPhrasesFrequency === 'daily' ? 'Daily' : 'Weekly',
			premium: premiumTier.customizedPhrasesFrequency === 'daily' ? 'Daily' : 'Weekly',
			tooltip: 'Get new phrases to practice every day.'
		},
		{
			feature: 'Conversation Memory',
			basic: freeTier.conversationMemoryLevel,
			plus: plusTier.conversationMemoryLevel,
			premium: premiumTier.conversationMemoryLevel,
			tooltip: 'Our AI remembers past conversations to personalize your learning.'
		},
		{
			feature: 'Anki Export',
			basic: `First ${freeTier.ankiExportLimit} words`,
			plus: `First ${plusTier.ankiExportLimit} words`,
			premium:
				premiumTier.ankiExportLimit === -1
					? 'Unlimited'
					: `First ${premiumTier.ankiExportLimit} words`,
			status: COMING_SOON,
			tooltip: 'Easily export vocabulary to Anki for spaced repetition practice.'
		}
	];

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

	// FAQ logic
	const faqs = [
		{
			question: 'Can I cancel anytime?',
			answer:
				'Yes, you can cancel your subscription at any time. Your benefits will continue until the end of your billing period. You can manage your subscription through your account settings.'
		},
		{
			question: 'What happens to my rollover minutes if I cancel?',
			answer:
				'Rollover minutes are a benefit of an active subscription. If you cancel, your accumulated rollover minutes will expire at the end of your final billing period.'
		},
		{
			question: 'Can I upgrade or downgrade my plan?',
			answer:
				'Absolutely! You can change your plan at any time from your account settings. The new plan will be prorated and take effect immediately.'
		}
	];
	let expandedFaq = $state(-1);

	// Early‑Backer price id (optional)
	const earlyBackerPriceId = $state(publicEnv.PUBLIC_STRIPE_EARLY_BACKER_PRICE_ID || '');

	async function handleEarlyBackerCheckout() {
		if (!userManager.isLoggedIn) {
			await goto('/auth');
			return;
		}
		if (!earlyBackerPriceId) return;
		try {
			const res = await fetch('/api/stripe/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					priceId: earlyBackerPriceId,
					successPath: '/profile',
					cancelPath: '/pricing'
				})
			});
			const data = await res.json();
			if (data?.url) {
				window.location.href = data.url;
			}
		} catch (e) {
			console.warn('Early‑Backer checkout failed', e);
		}
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
			await goto('/auth');
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

	function getAnnualPricePerMonth(tier: typeof plusTier | typeof premiumTier): string {
		if (!tier.annualPriceUsd || tier.annualPriceUsd === '0') return '0';
		const annual = parseFloat(tier.annualPriceUsd);
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

<div class="container mx-auto max-w-7xl px-4 py-16 sm:py-20">
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
				<button onclick={handleGetStarted} class="btn mt-8 w-full btn-outline">Get Started</button>
			{/if}
		</div>

		<div
			class="flex flex-col items-center rounded-2xl border-2 border-primary bg-base-100 p-8 text-center shadow-xl shadow-primary/20"
		>
			<div class="flex items-center gap-2">
				<span class="iconify h-6 w-6 text-yellow-400" data-icon="mdi:star"></span>
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
				<span class="iconify h-6 w-6 text-purple-400" data-icon="mdi:crown"></span>
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
			<button class="btn btn-success" onclick={handleEarlyBackerCheckout}>Support + Unlock</button>
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
					{#each allFeatures as feature}
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
			{#each testimonials as testimonial, i}
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
			{#each testimonials as _, i}
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

		<h2 class="mb-10 text-center text-3xl font-bold">Common Questions</h2>
		<div class="mx-auto max-w-3xl space-y-4">
			{#each faqs as faq, index}
				<div class="collapse-plus collapse bg-base-200">
					<input
						type="radio"
						name="faq-accordion"
						checked={expandedFaq === index}
						onchange={() => (expandedFaq = expandedFaq === index ? -1 : index)}
					/>
					<div class="collapse-title text-xl font-medium">{faq.question}</div>
					<div class="collapse-content">
						<p class="pt-2 text-base-content/90">{faq.answer}</p>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Extended Differentiators (educate near bottom) -->
	<div class="mt-24">
		<WhyDifferent variant="extended" />
	</div>
</div>
