<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

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
	</div>
</div>
