<script lang="ts">
	// Dev-only competitive positioning page
	type Competitor = {
		name: string;
		segment: string;
		strengths: string[];
		gapsVsKaiwa: string[];
		notes?: string;
	};

	const competitors: Competitor[] = [
		{
			name: 'Speak',
			segment: 'AI speaking tutor for general learners',
			strengths: [
				'Polished UX and brand trust',
				'Structured drills + roleplays',
				'Clear pronunciation feedback',
				'Broad language coverage'
			],
			gapsVsKaiwa: [
				'Less focus on emotional/relationship scenarios',
				'Limited cultural insider hooks',
				'Less CJK comfort features (furigana/romanization)'
			],
			notes: 'Great general-purpose tutor; we should avoid competing on generic drills.'
		},
		{
			name: 'Duolingo',
			segment: 'Mass-market gamified learning',
			strengths: [
				'Habit formation and retention',
				'Huge content catalog',
				'Brand and distribution'
			],
			gapsVsKaiwa: [
				'Weak real conversation transfer',
				'Shallow cultural depth in hard scenarios',
				'Not optimized for voice-first practice'
			]
		},
		{
			name: 'ELSA Speak',
			segment: 'Pronunciation and speaking accuracy',
			strengths: ['Detailed pronunciation scoring', 'Phoneme-level feedback'],
			gapsVsKaiwa: [
				'Limited conversational realism',
				'No relationship/emotional fluency angle',
				'Little continuity memory across sessions'
			]
		},
		{
			name: 'TalkPal / Roleplay Apps',
			segment: 'AI roleplay chat apps',
			strengths: ['Varied topics and easy onboarding', 'Low friction practice'],
			gapsVsKaiwa: [
				'Shallow pedagogy for voice turn-taking',
				'No code-switching/de-escalation philosophy',
				'Limited memory and real-life continuity'
			]
		},
		{
			name: 'italki / Tandem',
			segment: 'Human tutors and exchanges',
			strengths: ['Human nuance and accountability', 'High personalization with tutors'],
			gapsVsKaiwa: [
				'Scheduling friction and higher cost',
				'Inconsistent pedagogy across tutors',
				'Not on-demand or private by default'
			]
		}
	];

	const kaiwaDifferentiators = [
		'Emotional fluency: apology, affection, conflict, humor, vulnerability',
		'Relationship packs: meet-parents, partner fights, family bonding, social nuance',
		'Japanese/Korean/Chinese comfort: furigana and romanization where helpful',
		'Graceful code-switching and de‑escalation pedagogy',
		'Continuity memory across sessions (facts, topics, people)',
		'Insider cultural hooks: “what locals actually say”'
	];

	const capabilityMatrix = [
		{
			key: 'Emotional/relationship scenarios',
			speak: 'Partial',
			duolingo: 'No',
			elsa: 'No',
			talkpal: 'Partial',
			kaiwa: 'Core'
		},
		{
			key: 'Japanese/Korean/Chinese script comfort (furigana/romanization)',
			speak: 'Limited',
			duolingo: 'No',
			elsa: 'No',
			talkpal: 'Limited',
			kaiwa: 'Core'
		},
		{
			key: 'Realtime voice turn-taking',
			speak: 'Yes',
			duolingo: 'Limited',
			elsa: 'Yes (micro)',
			talkpal: 'Yes',
			kaiwa: 'Yes (conversation-first)'
		},
		{
			key: 'Code-switching/de‑escalation pedagogy',
			speak: 'Limited',
			duolingo: 'No',
			elsa: 'No',
			talkpal: 'No',
			kaiwa: 'Core'
		},
		{
			key: 'Continuity memory and topic carryover',
			speak: 'Limited',
			duolingo: 'No',
			elsa: 'No',
			talkpal: 'Limited',
			kaiwa: 'Core'
		},
		{
			key: 'Insider cultural hooks',
			speak: 'Limited',
			duolingo: 'No',
			elsa: 'No',
			talkpal: 'Limited',
			kaiwa: 'Core'
		}
	];

	const messaging = [
		'Speak to be understood by the people you love',
		'Practice the conversations that actually change your relationships',
		'From awkward to authentic — real talk, not drills'
	];

	const nextSteps = [
		'Ship Relationship Packs (meet-parents, fair fights, bonding)',
		'Add “People Profiles” and weave them into memory instructions',
		'Celebrate “Magic Moments” with post-session cards',
		'Friendly target-language ratio stat with one actionable nudge',
		'City/scene packs with insider hooks (Tokyo/Osaka/Seoul)'
	];
</script>

<svelte:head>
	<title>Dev — Competitive Positioning</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="min-h-screen bg-linear-to-br from-base-100 to-base-200">
	<div class="container mx-auto px-4 py-10">
		<div class="mb-8 text-center">
			<h1 class="text-3xl font-bold">Dev: Competitive Positioning</h1>
			<p class="mt-2 text-base-content/70">Internal view of the landscape and Kaiwa’s wedge</p>
		</div>

		<!-- Differentiators -->
		<div class="mb-10 rounded-xl border border-base-300 bg-base-100 p-6 shadow">
			<h2 class="mb-4 text-xl font-semibold">Kaiwa Differentiators</h2>
			<ul class="grid gap-2 md:grid-cols-2">
				{#each kaiwaDifferentiators as diff (diff)}
					<li class="flex items-start gap-2">
						<span class="mt-1 h-2 w-2 rounded-full bg-primary"></span>
						<span>{diff}</span>
					</li>
				{/each}
			</ul>
		</div>

		<!-- Competitor Cards -->
		<div class="mb-10 grid gap-6 md:grid-cols-2">
			{#each competitors as c (c.name)}
				<div class="rounded-xl border border-base-300 bg-base-100 p-5 shadow-sm">
					<div class="mb-1 text-lg font-semibold">{c.name}</div>
					<div class="mb-4 text-sm text-base-content/70">{c.segment}</div>

					<div class="mb-3 text-sm font-medium">Strengths</div>
					<ul class="mb-4 list-disc pl-5 text-sm">
						{#each c.strengths as s (s)}<li>{s}</li>{/each}
					</ul>

					<div class="mb-3 text-sm font-medium">Gaps vs Kaiwa</div>
					<ul class="mb-2 list-disc pl-5 text-sm">
						{#each c.gapsVsKaiwa as g (g)}<li>{g}</li>{/each}
					</ul>

					{#if c.notes}
						<div class="mt-2 text-xs text-base-content/60">{c.notes}</div>
					{/if}
				</div>
			{/each}
		</div>

		<!-- Capability Matrix -->
		<div class="mb-10 overflow-x-auto rounded-xl border border-base-300 bg-base-100 shadow">
			<table class="table min-w-full">
				<thead>
					<tr class="text-sm">
						<th class="bg-base-200">Capability</th>
						<th>Speak</th>
						<th>Duolingo</th>
						<th>ELSA</th>
						<th>TalkPal</th>
						<th class="text-primary">Kaiwa</th>
					</tr>
				</thead>
				<tbody>
					{#each capabilityMatrix as row (row.key)}
						<tr class="text-sm">
							<td class="font-medium">{row.key}</td>
							<td>{row.speak}</td>
							<td>{row.duolingo}</td>
							<td>{row.elsa}</td>
							<td>{row.talkpal}</td>
							<td class="font-semibold text-primary">{row.kaiwa}</td>
						</tr>
					{/each}
				</tbody>
			</table>
			<div class="p-3 text-xs text-base-content/60">
				Qualitative assessment for internal planning. Not for external use.
			</div>
		</div>

		<!-- Messaging -->
		<div class="mb-10 rounded-xl border border-base-300 bg-base-100 p-6 shadow">
			<h2 class="mb-3 text-xl font-semibold">Messaging Angles</h2>
			<ul class="space-y-2 text-sm">
				{#each messaging as m (m)}
					<li>• {m}</li>
				{/each}
			</ul>
		</div>

		<!-- Near-term Bets -->
		<div class="rounded-xl border border-base-300 bg-base-100 p-6 shadow">
			<h2 class="mb-3 text-xl font-semibold">Next Steps (0–90 days)</h2>
			<ul class="space-y-2 text-sm">
				{#each nextSteps as s (s)}
					<li>• {s}</li>
				{/each}
			</ul>
		</div>
	</div>
</div>
