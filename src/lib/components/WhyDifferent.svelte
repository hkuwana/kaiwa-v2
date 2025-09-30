<script lang="ts">
	interface Props {
		variant?: 'compact' | 'extended';
	}

	const { variant = 'compact' }: Props = $props();

	const items = [
		{
			title: 'Start Speaking Immediately',
			desc: 'No tutorials, no setup screens. Just click and have a real conversation in seconds.',
			icon: 'icon-[mdi--lightning-bolt]',
			color: 'primary'
		},
		{
			title: 'Real Human Emotions',
			desc: 'Practice apologizing, expressing affection, handling conflict — the conversations that actually matter in relationships.',
			icon: 'icon-[mdi--heart]',
			color: 'secondary'
		},
		{
			title: 'Asian Language Support',
			desc: "Reading aids for Japanese, Korean, and Chinese speakers — because seeing characters shouldn't stop you from speaking.",
			icon: 'icon-[mdi--translate]',
			color: 'accent'
		},
		{
			title: 'Builds on Your Life',
			desc: 'Remembers your interests and experiences to create personally relevant conversations you actually care about.',
			icon: 'icon-[mdi--sprout]',
			color: 'success'
		},
		{
			title: 'Natural Conversation Flow',
			desc: 'True back-and-forth dialogue that feels human — no awkward pauses or robotic responses.',
			icon: 'icon-[mdi--chat]',
			color: 'info'
		},
		{
			title: 'Cultural Insider Knowledge',
			desc: 'Learn phrases locals actually use and understand the cultural context behind them.',
			icon: 'icon-[mdi--key]',
			color: 'warning'
		}
	];

	const compare = [
		{
			key: 'Instant conversation start',
			kaiwa: 'One click',
			typical: 'Setup required',
			problem: 'Most apps make you complete lessons before speaking'
		},

		{
			key: 'Emotional conversations',
			kaiwa: 'Built-in and custom scenarios',
			typical: 'Basic topics only',
			problem: 'Other apps avoid complex human emotions and relationships'
		},
		{
			key: 'Asian language reading help',
			kaiwa: 'Furigana/romanization',
			typical: 'Not available',
			problem: "Learning stops when you can't read the characters"
		},
		{
			key: 'Personal conversation memory',
			kaiwa: 'Remembers your life',
			typical: 'Starts fresh',
			problem: "Repetitive conversations that don't build on your experiences"
		}
	];
</script>

<section class="container mx-auto max-w-5xl py-12">
	<div class="mx-auto mb-6 max-w-3xl text-center">
		<h3 class="text-2xl font-bold">The Real Conversation Difference</h3>
		<p class="mt-2 text-base opacity-80">
			While other apps focus on lessons and drills, Kaiwa gets you speaking like a human from day
			one.
		</p>
	</div>

	<div class="grid gap-4 md:grid-cols-3">
		{#each variant === 'compact' ? items.slice(0, 6) : items as item (item.title)}
			<div class="rounded-xl bg-base-100 p-4 shadow">
				<div class="flex items-center gap-3">
					<div class="flex h-9 w-9 items-center justify-center rounded-full bg-{item.color}/10">
						<span class="{item.icon} h-5 w-5 text-{item.color}"></span>
					</div>
					<div class="text-base font-semibold">{item.title}</div>
				</div>
				<div class="mt-2 text-sm opacity-80">{item.desc}</div>
			</div>
		{/each}
	</div>

	<div class="mt-12 space-y-6">
		<div class="mx-auto mb-6 max-w-2xl text-center">
			<h4 class="text-xl font-bold">What Other Apps Get Wrong</h4>
			<p class="mt-2 text-sm opacity-70">Real problems that stop learners from actually speaking</p>
		</div>

		<div class="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
			{#each compare as row (row.key)}
				<div class="bg-base-50 rounded-xl border border-base-300 p-4">
					<div class="mb-2 flex items-center justify-between gap-4">
						<h5 class="text-base font-medium">{row.key}</h5>
					</div>
					<div class="grid gap-2 text-sm">
						<div class="flex items-center gap-2">
							<span class="inline-block w-12 text-xs font-medium opacity-60">Kaiwa:</span>
							<span class="font-semibold text-primary">{row.kaiwa}</span>
						</div>
						<div class="flex items-center gap-2">
							<span class="inline-block w-12 text-xs font-medium opacity-60">Others:</span>
							<span class="opacity-70">{row.typical}</span>
						</div>
						<div class="mt-2 text-xs italic opacity-60">Why it matters: {row.problem}</div>
					</div>
				</div>
			{/each}
		</div>

		<div class="mt-6 text-center">
			<p class="text-xs opacity-60">
				Based on ChatGPT Voice, Speak.com, Babbel, Duolingo features as of 2024. Features vary by
				product and pricing tier.
			</p>
		</div>
	</div>
</section>
