<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import RotatingLanguages from '$lib/components/RotatingLanguages.svelte';
	import ShareKaiwa from '$lib/components/ShareKaiwa.svelte';
	import { languages as allLanguages } from '$lib/data/languages';
	import { env as publicEnv } from '$env/dynamic/public';

	type Task = { id: string; label: string; done: boolean };
	const STORAGE_KEY = 'kaiwa_marketing_tasks_v1';

	let tasks: Task[] = [
		{ id: 'clarify-positioning', label: 'Clarify Home/About positioning', done: true },
		{ id: 'email-seq', label: 'Send 2-email sequence (story + BTS)', done: false },
		{ id: 'reddit-founder', label: 'Post founder story + demo', done: false },
		{ id: 'reddit-practical', label: 'Post practical write-up', done: false },
		{ id: 'video', label: 'Record 30–45s demo video', done: false },
		{ id: 'share-module', label: 'In-product share prompt', done: true },
		{ id: 'upsell', label: 'Early-backer upsell ready', done: false },
		{ id: 'pricing-id', label: 'Create Early‑Backer Stripe price', done: false },
		{ id: 'track-signup', label: 'Thread shareId → signup', done: true }
	];

	let goalShares = 5;
	let shareEvents = 0;

	onMount(() => {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) {
				const parsed = JSON.parse(raw);
				if (Array.isArray(parsed?.tasks)) tasks = parsed.tasks;
				if (typeof parsed?.goalShares === 'number') goalShares = parsed.goalShares;
			}
		} catch {}
		try {
			shareEvents = parseInt(localStorage.getItem('kaiwa_share_events') || '0', 10);
		} catch {}
	});

	function toggleTask(t: Task) {
		t.done = !t.done;
		persist();
	}

	function persist() {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks, goalShares }));
		} catch {}
	}

	function goPricing() {
		goto('/pricing');
	}
	function goHome() {
		goto('/');
	}
	function goAbout() {
		goto('/about');
	}

	// Component samples
	const sampleLabels = allLanguages
		.filter((l) => ['ja', 'es', 'ko', 'zh'].includes(l.code))
		.map((l) => `${l.name} ${l.flag}`);

	const earlyBackerPriceId = publicEnv.PUBLIC_STRIPE_EARLY_BACKER_PRICE_ID || '';
	async function testEarlyBackerCheckout() {
		if (!earlyBackerPriceId) return alert('Set PUBLIC_STRIPE_EARLY_BACKER_PRICE_ID');
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
			} else {
				alert('Checkout creation failed. See console.');
				console.log('Checkout response', data);
			}
		} catch (e) {
			console.warn(e);
		}
	}
</script>

<svelte:head>
	<title>Dev — Marketing Tracker</title>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<div class="min-h-screen bg-base-200">
	<div class="container mx-auto max-w-5xl px-4 py-10">
		<div class="mb-6 flex items-center justify-between">
			<h1 class="text-2xl font-bold">Dev — MVP Marketing</h1>
			<div class="flex gap-2">
				<button class="btn btn-sm" onclick={goHome}>Home</button>
				<button class="btn btn-sm" onclick={goAbout}>About</button>
				<button class="btn btn-sm" onclick={goPricing}>Pricing</button>
			</div>
		</div>

		<div class="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
			<div class="rounded-xl bg-base-100 p-5 shadow">
				<div class="mb-2 text-sm tracking-wide text-base-content/60 uppercase">Objective</div>
				<div class="text-lg">Get 5 people to share in 2.5 weeks</div>
			</div>
			<div class="rounded-xl bg-base-100 p-5 shadow">
				<div class="mb-2 text-sm tracking-wide text-base-content/60 uppercase">Shares (local)</div>
				<div class="text-3xl font-bold">{shareEvents}</div>
				<div class="text-sm text-base-content/60">Sum of share actions this browser</div>
			</div>
			<div class="rounded-xl bg-base-100 p-5 shadow">
				<div class="mb-2 text-sm tracking-wide text-base-content/60 uppercase">Target</div>
				<div class="flex items-center gap-2">
					<input
						type="number"
						min="1"
						class="input input-sm w-24"
						bind:value={goalShares}
						onchange={persist}
					/>
					<span class="text-sm text-base-content/60">people sharing</span>
				</div>
			</div>
		</div>

		<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
			<div class="rounded-xl bg-base-100 p-5 shadow">
				<div class="mb-4 text-lg font-semibold">Plan Checklist</div>
				<div class="space-y-2">
					{#each tasks as t (t.id)}
						<label class="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-base-200">
							<input
								type="checkbox"
								class="checkbox checkbox-sm"
								checked={t.done}
								onchange={() => toggleTask(t)}
							/>
							<span class={t.done ? 'line-through opacity-60' : ''}>{t.label}</span>
						</label>
					{/each}
				</div>
			</div>
			<div class="rounded-xl bg-base-100 p-5 shadow">
				<div class="mb-4 text-lg font-semibold">Notes</div>
				<p class="mb-2 text-sm text-base-content/70">
					Audience: Couples across languages + diaspora families
				</p>
				<p class="mb-2 text-sm text-base-content/70">
					Channels: Reddit (founder story + practical), email (BTS), personal networks
				</p>
				<p class="mb-4 text-sm text-base-content/70">
					Aha: 3‑minute onboarding → quick daily chats
				</p>
				<div class="rounded-lg bg-base-200 p-3 text-sm">
					Tip: Add PUBLIC_STRIPE_EARLY_BACKER_PRICE_ID to .env and test checkout.
				</div>
			</div>
		</div>

		<div class="mt-8 rounded-xl bg-base-100 p-5 shadow">
			<div class="mb-4 text-lg font-semibold">Component Testbed</div>
			<div class="mb-6">
				<div class="mb-2 text-sm uppercase tracking-wide text-base-content/60">Rotating Languages</div>
				<div class="text-lg">Speak in <RotatingLanguages items={sampleLabels} /></div>
			</div>
			<div class="mb-6">
				<div class="mb-2 text-sm uppercase tracking-wide text-base-content/60">Share Module</div>
				<ShareKaiwa source="dev_marketing" />
			</div>
			<div>
				<div class="mb-2 text-sm uppercase tracking-wide text-base-content/60">Early‑Backer Checkout</div>
				<div class="mb-2 text-xs">PUBLIC_STRIPE_EARLY_BACKER_PRICE_ID: <code>{earlyBackerPriceId || '(unset)'}</code></div>
				<button class="btn btn-primary" onclick={testEarlyBackerCheckout} disabled={!earlyBackerPriceId}>Start Test Checkout</button>
			</div>
		</div>

		<!-- Detailed Timeline -->
		<div class="mt-8 rounded-xl bg-base-100 p-5 shadow">
			<div class="mb-4 text-lg font-semibold">Launch Timeline (2.5 Weeks)</div>
			<ul class="timeline timeline-snap-icon max-md:timeline-compact timeline-vertical">
				<li>
					<div class="timeline-middle">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
						</svg>
					</div>
					<div class="timeline-start mb-10 md:text-end">
						<time class="font-mono italic">Week 0–0.5</time>
						<div class="text-lg font-black">Messaging + Instrumentation</div>
						- Home/About: Who it’s for, How it works, JP‑first default<br />
						- AB headlines: 3 emotional variants live<br />
						- UTM + shareId capture to PostHog; cookie + localStorage persistence
					</div>
					<hr />
				</li>
				<li>
					<hr />
					<div class="timeline-middle">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
						</svg>
					</div>
					<div class="timeline-end md:mb-10">
						<time class="font-mono italic">Week 1</time>
						<div class="text-lg font-black">Warm Start + Seeding</div>
						- Email #1 (founder story) → 3‑minute onboarding CTA + gentle share ask<br />
						- Reddit founder story + 30–45s demo (link in comments; disclose self‑promo)
					</div>
					<hr />
				</li>
				<li>
					<hr />
					<div class="timeline-middle">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
						</svg>
					</div>
					<div class="timeline-start mb-10 md:text-end">
						<time class="font-mono italic">Week 1.5</time>
						<div class="text-lg font-black">Activation + Practical Content</div>
						- Reddit practical post (handling emotional convos); link in comments<br />
						- In‑product share prompt + serene thanks animation live<br />
						- Capture 2–3 authentic quotes (with permission) for Home
					</div>
					<hr />
				</li>
				<li>
					<hr />
					<div class="timeline-middle">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
						</svg>
					</div>
					<div class="timeline-end md:mb-10">
						<time class="font-mono italic">Week 2</time>
						<div class="text-lg font-black">Retention Loop + Early‑Backer</div>
						- Gentle post‑session nudge to Plus (Early‑Backer $5/mo for 12 months)<br />
						- Monitor session frequency (2+ sessions in 3 days target)
					</div>
					<hr />
				</li>
				<li>
					<hr />
					<div class="timeline-middle">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
						</svg>
					</div>
					<div class="timeline-start mb-10 md:text-end">
						<time class="font-mono italic">Week 2–2.5</time>
						<div class="text-lg font-black">Review + Iterate</div>
						- Analyze funnel (UTM → onboarding → sessions), AB headline results<br />
						- Email #2 (behind‑the‑scenes + reminder); invite replies<br />
						- Publish a small case study (authentic testimonial + short clip)
					</div>
				</li>
			</ul>
		</div>

		<!-- Detailed Plan (long form) -->
		<div class="mt-8 rounded-xl bg-base-100 p-5 shadow">
			<div class="mb-4 text-lg font-semibold">Detailed Plan (In Progress)</div>
			<div class="space-y-6 text-sm leading-relaxed">
				<div>
					<div class="mb-1 font-semibold">Audience & Positioning</div>
					<ul class="list-disc pl-6">
						<li>Primary: couples across languages; secondary: diaspora family communication.</li>
						<li>Problem: apps focus on drills; real emotional conversations remain hard.</li>
						<li>Positioning: relationship‑first practice for moments that matter.</li>
						<li>JP‑first emphasis in marketing; product remains multi‑language.</li>
					</ul>
				</div>
				<div>
					<div class="mb-1 font-semibold">Core Experience & Aha</div>
					<ul class="list-disc pl-6">
						<li>Free 3‑minute onboarding: sample flow + quick level assessment.</li>
						<li>Daily quick chat loop: small wins with phrases that feel useful now.</li>
						<li>Post‑session review screen: clear next step (analyze / practice / share).</li>
					</ul>
				</div>
				<div>
					<div class="mb-1 font-semibold">Content & Channels</div>
					<ul class="list-disc pl-6">
						<li><span class="font-medium">Email #1 (Week 1):</span> founder story, 3‑min onboarding CTA, gentle share ask; subject ideas: “I made Kaiwa for couples across languages”, “3 minutes to talk in their language”.</li>
						<li><span class="font-medium">Email #2 (Week 2–2.5):</span> behind‑the‑scenes + reminder; share 30–45s demo; invite replies with personal use cases.</li>
						<li><span class="font-medium">Reddit founder story (Week 1):</span> authentic narrative, short demo; link in comments; disclose self‑promo; respect rules.</li>
						<li><span class="font-medium">Reddit practical post (Week 1.5):</span> “How I’m tackling emotional convos across languages with AI” + examples; link in comments.</li>
						<li><span class="font-medium">Personal networks:</span> 1‑to‑1 messages; avoid mass spam; include personal reason and a simple link.</li>
					</ul>
				</div>
				<div>
					<div class="mb-1 font-semibold">In‑Product Moments</div>
					<ul class="list-disc pl-6">
						<li><span class="font-medium">Share module:</span> native share on mobile; WhatsApp/text + copy on desktop; serene thanks animation.</li>
						<li><span class="font-medium">Placement:</span> About page and post‑session review (implemented).</li>
						<li><span class="font-medium">Copy:</span> neutral, calm, personal—no moral pressure.</li>
						<li><span class="font-medium">Upsell:</span> Early‑Backer Plus banner on review screen; pricing page CTA if env price set.</li>
					</ul>
				</div>
				<div>
					<div class="mb-1 font-semibold">Measurement & Attribution</div>
					<ul class="list-disc pl-6">
						<li>Capture <code>utm_*</code> + <code>shareId</code>/<code>ref</code> in layout; persist in localStorage + cookie.</li>
						<li>Register super properties in PostHog; track <code>share_referred_visit</code>, <code>about_cta_clicked</code>, auth success props.</li>
						<li>Activation: onboarding complete → first scenario → 2+ sessions in 3 days.</li>
						<li>Referrals: count signups with <code>share_id</code>; monitor share actions volume.</li>
					</ul>
				</div>
				<div>
					<div class="mb-1 font-semibold">Referral Implementation</div>
					<ul class="list-disc pl-6">
						<li>Share links use <code>/?shareId={userId}</code>.</li>
						<li>Persist shareId in cookie (<code>kaiwa_share_id</code>) + storage for pre‑signup navigation.</li>
						<li>Include shareId and UTMs on signup success event for attribution.</li>
					</ul>
				</div>
				<div>
					<div class="mb-1 font-semibold">Monetization Approach</div>
					<ul class="list-disc pl-6">
						<li>Usage and shares first; keep free onboarding and quick chats open.</li>
						<li>Early‑Backer Plus ($5/mo for 12 months) via env price; maps to Plus tier server‑side.</li>
						<li>Overage minutes deferred until operational support exists.</li>
					</ul>
				</div>
				<div>
					<div class="mb-1 font-semibold">Risks & Mitigations</div>
					<ul class="list-disc pl-6">
						<li>Reddit self‑promo sensitivity → founder narrative, value share, link in comments, follow subreddit rules.</li>
						<li>Pay friction → avoid hard paywall; keep free loop; position Early‑Backer as support + unlock.</li>
						<li>Cost control → short sessions; cap defaults; monitor usage.</li>
					</ul>
				</div>
				<div>
					<div class="mb-1 font-semibold">Next Iterations</div>
					<ul class="list-disc pl-6">
						<li>Drop a 30–45s demo on Home (prod‑gated by env) once recorded.</li>
						<li>Collect 2–3 named testimonials; add to Home hero/strip.</li>
						<li>Optional: language‑specific landing (e.g., Japanese relationships) for targeted posts.</li>
					</ul>
				</div>
			</div>
		</div>
	</div>
</div>
