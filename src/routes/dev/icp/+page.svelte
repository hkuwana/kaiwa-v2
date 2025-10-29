<script lang="ts">
	type PersonaType = 'sofia' | 'david' | 'jamie' | 'rosa';

	interface Persona {
		id: PersonaType;
		name: string;
		title: string;
		age: number;
		background: string;
		signal: string;
		fears: string[];
		ltv: string;
		ltv_years: number;
		acquisition_channels: string[];
		outreach_hook: string;
		primary_driver: string;
		lifecycle_stages: {
			stage: string;
			frequency: string;
			scenario: string;
			pain: string;
		}[];
		commitment_model: {
			skin_in_game: string;
			real_conversation: string;
		};
		retention_risk: string;
		retention_lever: string;
		messaging_angle: string;
	}

	const personas: Record<PersonaType, Persona> = {
		sofia: {
			id: 'sofia',
			name: 'Sofia',
			title: 'The Committed Partner',
			age: 29,
			background: 'Product Designer, American, dating Yuto (Japanese) for 2 years',
			signal: "How to impress my partner's parents in their language",
			fears: [
				"What if his parents think I'm rude or stupid?",
				"I can't express my depth in his language",
				'What if I sound childish when meeting his family?',
				"I don't care about passing a test. I care about his mom liking me."
			],
			ltv: '5-10 years (evolving milestones)',
			ltv_years: 7,
			acquisition_channels: [
				'Reddit: r/JapaneseLanguage, r/relationships',
				'TikTok: #bilingualcouple, #meetingtheparents',
				'Facebook: Bilingual family groups, expat dating groups',
				'Organic: "How to impress boyfriend\'s parents in Japanese"'
			],
			outreach_hook: "I'm in your exact situation—here's what worked for me",
			primary_driver: 'Love + Commitment',
			lifecycle_stages: [
				{
					stage: 'Year 1-2: Meet the parents',
					frequency: '3-4x/month (leading up to visit)',
					scenario: 'Family dinner, small talk with in-laws',
					pain: 'What if I sound stupid?'
				},
				{
					stage: 'Year 2-3: Real emotional conversations',
					frequency: '2-3x/month (maintenance)',
					scenario: 'Apologizing, expressing feelings, discussing future',
					pain: "I can't express my depth in his language"
				},
				{
					stage: 'Year 3-4: Living in Japan',
					frequency: 'Weekly',
					scenario: 'Job interviews, apartment hunting, workplace interactions',
					pain: 'Can I handle the speed and nuance of daily life?'
				},
				{
					stage: 'Year 4-5: Parenting in two languages',
					frequency: '2-3x/week',
					scenario: 'Talking to doctors, negotiating parenting style',
					pain: "I'm responsible for another person's fluency"
				},
				{
					stage: 'Year 5+: Career & mastery',
					frequency: '2-3x/month',
					scenario: 'Presentations, difficult conversations with bosses',
					pain: 'I need to sound competent, not just polite'
				}
			],
			commitment_model: {
				skin_in_game: '$19 commitment = serious about meeting parents',
				real_conversation: 'Voice memo/transcript of convo with Yuto = proof it works'
			},
			retention_risk: 'After meeting parents, may feel "fixed" and drop off 3-6 months',
			retention_lever:
				'Position as "relationship maintenance." Next milestone: living together/engagement/moving abroad',
			messaging_angle: "You've got grammar down. Now let's make sure he knows you love him."
		},
		david: {
			id: 'david',
			name: 'David',
			title: 'The Returning Heritage Speaker',
			age: 35,
			background:
				'Engineer, California-born, parents from Mexico, grew up speaking English to "fit in"',
			signal: 'How to reconnect with family without shame',
			fears: [
				"I feel like a fraud. I look the part but can't talk to my abuela.",
				"They'll talk to me in Spanish and I'll have to reply in English.",
				"I want to share a memory with my grandfather but don't have the emotional vocabulary.",
				"I'm afraid I'll just sit there silently."
			],
			ltv: '10+ years (cyclical)',
			ltv_years: 12,
			acquisition_channels: [
				'Reddit: r/Spanish, r/heritage_speakers',
				'Facebook: Heritage language groups, Spanish-language family groups',
				'Email: Spanish organizations, cultural centers',
				'Organic: "Reconnect with family in Spanish," "Heritage shame"'
			],
			outreach_hook: "You're not starting from zero. You just need permission.",
			primary_driver: 'Shame + Reconnection',
			lifecycle_stages: [
				{
					stage: 'Year 1: Family reunion reconnection',
					frequency: '3-4x/week (4-week intensive prep)',
					scenario: 'Family reunion, emotional conversations, sharing memories',
					pain: "I'm ashamed of my Spanish"
				},
				{
					stage: 'Year 1-2: Maintaining family relationships',
					frequency: '1-2x/month (weekly calls with family)',
					scenario: 'Phone calls with relatives, casual family chat',
					pain: "I don't have things to talk about"
				},
				{
					stage: 'Year 2-3: Teaching kids about culture',
					frequency: '2-3x/month (if he has kids)',
					scenario: 'Explaining heritage, teaching cultural values',
					pain: "I don't know how to pass this down"
				},
				{
					stage: 'Year 3+: Cycles of reconnection',
					frequency: '1-2x/month (ongoing maintenance)',
					scenario: 'Holiday celebrations, family milestones, identity deepening',
					pain: 'Deepening cultural identity'
				}
			],
			commitment_model: {
				skin_in_game: '$19 = accountability for family reunion prep',
				real_conversation: 'Call with abuela = healing validation'
			},
			retention_risk: 'High churn after event if positioned as "reunion prep only"',
			retention_lever:
				'Reposition as "ongoing family relationship maintenance." The reunion was the start.',
			messaging_angle:
				"You're not starting from zero. You just need permission to sound like yourself again."
		},
		jamie: {
			id: 'jamie',
			name: 'Jamie',
			title: 'The Relocation Expat',
			age: 32,
			background:
				'Marketing Manager, relocated to Berlin from US for 3-5 years, German A2/B1 level',
			signal: 'Make a real life in this new country',
			fears: [
				'Will I ever make real friends here, or always be the American?',
				"What if I can't keep up in social conversations?",
				'Dating in another language seems impossible.',
				"I'm starting over—I can't feel like an outsider for 3+ years."
			],
			ltv: '2-5 years (job relocation cycle)',
			ltv_years: 3,
			acquisition_channels: [
				'Reddit: r/expats, r/IWantOut, r/Berlin',
				'Facebook: Expat groups in target cities',
				'LinkedIn: Job changers, visa announcements',
				'Organic: "Expat German," "Make friends in [city]"'
			],
			outreach_hook: "You're not alone—here's how to build a real life here",
			primary_driver: 'Belonging + Survival',
			lifecycle_stages: [
				{
					stage: 'Month 1-3: Survival & orientation',
					frequency: '3-4x/week',
					scenario: 'Ordering, asking directions, work basics',
					pain: 'Can I even order coffee without embarrassing myself?'
				},
				{
					stage: 'Month 3-12: Building a social life',
					frequency: '2-3x/week',
					scenario: 'Making friends, dating, small talk, work events',
					pain: 'How do I break into social circles?'
				},
				{
					stage: 'Year 1-3: Deep integration',
					frequency: '1-2x/week (maintenance + specific needs)',
					scenario: 'Career advancement, relationship milestones, deep friendships',
					pain: 'Career stagnation, identity in new place'
				},
				{
					stage: 'Year 3+: Mastery & mentoring',
					frequency: '1x/month or on-demand',
					scenario: 'Helping newcomers, advanced professional conversations',
					pain: 'Maintaining and deepening roots'
				}
			],
			commitment_model: {
				skin_in_game: '$19 = monthly check-in for ongoing integration',
				real_conversation: 'Dinner with new friends = belonging proof'
			},
			retention_risk: 'May feel confident after 18 months and drop off',
			retention_lever: 'Position as "deeper belonging." Introduce community features.',
			messaging_angle:
				"You know the rules of the language. Now let's help you understand the soul of the culture."
		},
		rosa: {
			id: 'rosa',
			name: 'Rosa',
			title: 'The Permanent Immigrant',
			age: 28,
			background: 'Nurse, moved permanently to Canada from Philippines 2 years ago, on PR path',
			signal: 'Pass exams and build belonging',
			fears: [
				'Will I ever sound natural, or always have an accent?',
				"Will I make clinical mistakes because I didn't understand something?",
				'Will I ever belong here, or always be the foreign nurse?',
				'Dating/socializing is hard when people comment on my English.'
			],
			ltv: '5-10+ years (career + PR timeline)',
			ltv_years: 8,
			acquisition_channels: [
				'Reddit: r/nurses, r/ImmigrationCanada, r/IELTS',
				'Facebook: Immigrant nurse groups, professional licensing groups',
				'Email: Immigration orgs, nursing associations',
				'Organic: "Medical English," "IELTS passing," "Belonging in [country]"'
			],
			outreach_hook: "You're qualified. You belong. Let's make sure they know it.",
			primary_driver: 'Professional + Identity',
			lifecycle_stages: [
				{
					stage: 'Year 1-2: Passing exams + initial confidence',
					frequency: '3-4x/week',
					scenario: 'Medical exams, professional conversations, IELTS prep',
					pain: 'Will I pass the tests?'
				},
				{
					stage: 'Year 2-3: Career advancement',
					frequency: '2x/week',
					scenario: 'Leading teams, difficult patient conversations, promotions',
					pain: 'Can I handle leadership in English?'
				},
				{
					stage: 'Year 3-5: Building social life',
					frequency: '1-2x/week',
					scenario: 'Friendships, dating, navigating discrimination',
					pain: 'Will I ever feel at home?'
				},
				{
					stage: 'Year 5+: Mastery & mentoring',
					frequency: '1x/month or on-demand',
					scenario: 'Helping new immigrants, professional excellence',
					pain: 'Staying connected to roots while building new identity'
				}
			],
			commitment_model: {
				skin_in_game: '$19 = career advancement alignment with exam prep intensity',
				real_conversation: 'Patient interaction documented = professional win'
			},
			retention_risk: 'May churn after passing exams if positioned only as "exam prep"',
			retention_lever:
				'"You passed the test. Now pass the belonging test." Emphasize long-term integration.',
			messaging_angle: "You're qualified. You belong. Let's make sure they know it."
		}
	};

	let selectedPersona: PersonaType = $state('sofia');
	const personaList: PersonaType[] = ['sofia', 'david', 'jamie', 'rosa'];
	const current = $derived(personas[selectedPersona]);
</script>

<div class="min-h-screen bg-base-100 p-8">
	<div class="mx-auto max-w-5xl">
		<!-- Header -->
		<div class="mb-12">
			<h1 class="mb-4 text-5xl font-bold">Kaiwa ICP Personas</h1>
			<p class="text-lg text-base-content/60">
				Ideal Customer Profiles: High-Stakes Connectors with 5-10 year LTV
			</p>
		</div>

		<!-- Persona Selector -->
		<div class="mb-12 grid grid-cols-1 gap-4 md:grid-cols-4">
			{#each personaList as persona_id}
				{@const p = personas[persona_id]}
				<button
					onclick={() => {
						selectedPersona = persona_id;
					}}
					class={`btn btn-block ${selectedPersona === persona_id ? 'btn-primary' : 'btn-outline'}`}
				>
					<div class="w-full text-left">
						<div class="font-bold">{p.name}</div>
						<div class="text-xs opacity-70">{p.ltv_years} years LTV</div>
					</div>
				</button>
			{/each}
		</div>

		<!-- Main Content Card -->
		<div class="card bg-base-200 shadow-lg">
			<!-- Header Section -->
			<div class="card-body rounded-t-2xl bg-primary text-primary-content">
				<h2 class="card-title text-3xl">{current.name} — {current.title}</h2>
				<p class="text-lg opacity-90">{current.background}</p>
				<div class="divider-primary-content divider my-2"></div>
				<div class="grid grid-cols-2 gap-4 text-sm">
					<div>
						<div class="opacity-75">Primary Driver</div>
						<div class="text-base font-semibold">{current.primary_driver}</div>
					</div>
					<div>
						<div class="opacity-75">LTV Potential</div>
						<div class="text-base font-semibold">{current.ltv}</div>
					</div>
				</div>
			</div>

			<!-- Content -->
			<div class="card-body space-y-8">
				<!-- The Signal -->
				<section>
					<h3 class="mb-4 card-title text-2xl">The Signal</h3>
					<div class="alert alert-info">
						<span>"{current.signal}"</span>
					</div>
				</section>

				<!-- Core Fears -->
				<section>
					<h3 class="mb-4 card-title text-2xl">Core Fears</h3>
					<ul class="space-y-2">
						{#each current.fears as fear}
							<li class="flex gap-3">
								<span class="text-xl">😰</span>
								<span>{fear}</span>
							</li>
						{/each}
					</ul>
				</section>

				<!-- Messaging Angle -->
				<section>
					<h3 class="mb-4 card-title text-2xl">Messaging Angle</h3>
					<div class="alert-secondary alert">
						<span>"{current.messaging_angle}"</span>
					</div>
				</section>

				<!-- Commitment Model -->
				<section>
					<h3 class="mb-4 card-title text-2xl">Commitment Model</h3>
					<div class="space-y-3">
						<div class="border-l-4 border-secondary p-4">
							<div class="mb-2 text-lg font-semibold">💰 Skin in Game</div>
							<p>{current.commitment_model.skin_in_game}</p>
						</div>
						<div class="border-l-4 border-accent p-4">
							<div class="mb-2 text-lg font-semibold">✅ Real Conversation</div>
							<p>{current.commitment_model.real_conversation}</p>
						</div>
					</div>
				</section>

				<div class="divider my-4"></div>

				<!-- Lifetime Arc -->
				<section>
					<h3 class="mb-4 card-title text-2xl">Lifetime Arc</h3>
					<div class="space-y-4">
						{#each current.lifecycle_stages as stage}
							<div class="rounded-r-lg border-l-4 border-primary bg-base-300 p-4">
								<div class="mb-3 text-lg font-bold">{stage.stage}</div>
								<div class="grid grid-cols-3 gap-4 text-sm">
									<div>
										<span class="mb-1 block font-semibold">📅 Frequency</span>
										<span>{stage.frequency}</span>
									</div>
									<div>
										<span class="mb-1 block font-semibold">🎯 Scenario</span>
										<span>{stage.scenario}</span>
									</div>
									<div>
										<span class="mb-1 block font-semibold">😟 Core Pain</span>
										<span>{stage.pain}</span>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</section>

				<div class="divider my-4"></div>

				<!-- Acquisition -->
				<section>
					<h3 class="mb-4 card-title text-2xl">Acquisition Channels</h3>
					<ul class="mb-6 space-y-2">
						{#each current.acquisition_channels as channel}
							<li class="flex gap-3">
								<span class="text-lg">🎯</span>
								<span>{channel}</span>
							</li>
						{/each}
					</ul>
					<div class="alert alert-warning">
						<span class="font-semibold">Outreach Hook:</span>
						<span>"{current.outreach_hook}"</span>
					</div>
				</section>

				<div class="divider my-4"></div>

				<!-- Retention -->
				<section>
					<h3 class="mb-4 card-title text-2xl">Retention & Churn</h3>
					<div class="space-y-4">
						<div class="alert alert-error">
							<span class="font-semibold">⚠️ Churn Risk:</span>
							<span>{current.retention_risk}</span>
						</div>
						<div class="alert alert-success">
							<span class="font-semibold">✅ Retention Lever:</span>
							<span>{current.retention_lever}</span>
						</div>
					</div>
				</section>
			</div>
		</div>

		<!-- Comparison Table -->
		<div class="mt-12">
			<h2 class="mb-6 text-3xl font-bold">Quick Comparison</h2>
			<div class="overflow-x-auto">
				<table class="table table-zebra bg-base-100">
					<thead class="bg-primary text-primary-content">
						<tr>
							<th>Persona</th>
							<th>Driver</th>
							<th>LTV</th>
							<th>Churn Risk</th>
							<th>Phase</th>
						</tr>
					</thead>
					<tbody>
						{#each personaList as persona_id}
							{@const p = personas[persona_id]}
							<tr>
								<td>
									<button
										onclick={() => {
											selectedPersona = persona_id;
										}}
										class="link font-bold link-primary"
									>
										{p.name}
									</button>
								</td>
								<td>{p.primary_driver}</td>
								<td>{p.ltv_years} years</td>
								<td>
									{#if p.ltv_years >= 10}
										<div class="badge badge-success">Low</div>
									{:else if p.ltv_years >= 5}
										<div class="badge badge-warning">Medium</div>
									{:else}
										<div class="badge badge-error">High</div>
									{/if}
								</td>
								<td>
									{#if persona_id === 'sofia'}
										<div class="badge badge-primary">Phase 1 🌟</div>
									{:else if persona_id === 'david'}
										<div class="badge">Phase 2</div>
									{:else if persona_id === 'jamie'}
										<div class="badge">Phase 3</div>
									{:else}
										<div class="badge">Phase 4</div>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>

		<!-- Go-to-Market Timeline -->
		<div class="card mt-12 bg-base-200 shadow-lg">
			<div class="card-body">
				<h2 class="mb-6 card-title text-3xl">Go-to-Market Timeline</h2>
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
					<div class="card bg-primary text-primary-content">
						<div class="card-body">
							<h3 class="card-title text-lg">Phase 1</h3>
							<p class="text-sm opacity-90">Months 1-3</p>
							<div class="divider-primary-content divider my-2"></div>
							<ul class="space-y-1 text-sm">
								<li>✓ Sofia</li>
								<li>✓ Easiest reach</li>
								<li>✓ Test model</li>
							</ul>
						</div>
					</div>

					<div class="card bg-secondary text-secondary-content">
						<div class="card-body">
							<h3 class="card-title text-lg">Phase 2</h3>
							<p class="text-sm opacity-90">Months 3-6</p>
							<div class="divider-secondary-content divider my-2"></div>
							<ul class="space-y-1 text-sm">
								<li>✓ David</li>
								<li>✓ Emotional depth</li>
								<li>✓ 10+ yr LTV</li>
							</ul>
						</div>
					</div>

					<div class="card bg-accent text-accent-content">
						<div class="card-body">
							<h3 class="card-title text-lg">Phase 3</h3>
							<p class="text-sm opacity-90">Months 6-9</p>
							<div class="divider-accent-content divider my-2"></div>
							<ul class="space-y-1 text-sm">
								<li>✓ Jamie</li>
								<li>✓ Larger market</li>
								<li>✓ 2-5 yr LTV</li>
							</ul>
						</div>
					</div>

					<div class="card bg-success text-success-content">
						<div class="card-body">
							<h3 class="card-title text-lg">Phase 4</h3>
							<p class="text-sm opacity-90">Months 9+</p>
							<div class="divider-success-content divider my-2"></div>
							<ul class="space-y-1 text-sm">
								<li>✓ Rosa</li>
								<li>✓ Largest TAM</li>
								<li>✓ 5-10+ yr LTV</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Key Insight -->
		<div class="card mt-12 bg-info text-info-content shadow-lg">
			<div class="card-body">
				<h2 class="card-title text-2xl">🎯 Key Insight</h2>
				<p class="text-base leading-relaxed">
					You're not building for "language learners." You're building for <strong
						>High-Stakes Connectors</strong
					>
					who use your app to maintain and deepen relationships over <strong>5-10+ years</strong>,
					not just for one event.
				</p>
				<p class="mt-4 text-base leading-relaxed">
					This completely changes your retention story. You're hunting for <strong
						>annual retention</strong
					>
					and <strong>multi-year LTV</strong>, not 30-day churn metrics.
				</p>
			</div>
		</div>
	</div>
</div>
