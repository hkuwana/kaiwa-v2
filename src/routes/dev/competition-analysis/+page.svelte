<script lang="ts">
	import { onMount } from 'svelte';

	interface Competitor {
		name: string;
		website: string;
		description: string;
		strengths: string[];
		weaknesses: string[];
		features: string[];
		pricing: {
			free: boolean;
			premium: string;
			notes: string;
		};
		seo: {
			score: number;
			traffic: string;
			keywords: string[];
		};
		userReviews: {
			rating: number;
			count: number;
			commonComplaints: string[];
			commonPraises: string[];
		};
		marketing: {
			positioning: string;
			targetAudience: string;
			keyMessages: string[];
		};
		technical: {
			platform: string[];
			languages: string[];
			aiCapabilities: string[];
		};
	}

	let selectedCompetitor = $state<Competitor | null>(null);
	let analysisMode = $state<'overview' | 'detailed' | 'comparison'>('overview');
	let searchTerm = $state('');
	let filteredCompetitors = $state<Competitor[]>([]);

	const competitors: Competitor[] = [
		{
			name: 'Speak',
			website: 'speak.com',
			description: 'AI-powered language learning with focus on conversation practice',
			strengths: [
				'Polished UX and brand trust',
				'Advanced AI conversation capabilities',
				'Clear pronunciation feedback',
				'Broad language coverage',
				'Structured learning paths'
			],
			weaknesses: [
				'Expensive premium pricing',
				'Limited free features',
				'Less focus on emotional/relationship scenarios',
				'Limited cultural context',
				'Generic conversation topics'
			],
			features: [
				'AI conversation practice',
				'Pronunciation feedback',
				'Structured lessons',
				'Progress tracking',
				'Multiple languages'
			],
			pricing: {
				free: true,
				premium: '$19.99/month',
				notes: 'Limited free usage, premium required for full features'
			},
			seo: {
				score: 78,
				traffic: '120K/month',
				keywords: ['AI language learning', 'conversation practice', 'speaking app']
			},
			userReviews: {
				rating: 4.2,
				count: 1250,
				commonComplaints: ['Too expensive', 'Limited free features', 'Repetitive conversations'],
				commonPraises: ['Good pronunciation feedback', 'Easy to use', 'Effective learning']
			},
			marketing: {
				positioning: 'AI-powered conversation practice',
				targetAudience: 'General language learners',
				keyMessages: ['Speak confidently', 'AI-powered practice', 'Real conversations']
			},
			technical: {
				platform: ['iOS', 'Android', 'Web'],
				languages: ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese'],
				aiCapabilities: ['Conversation AI', 'Pronunciation analysis', 'Progress tracking']
			}
		},
		{
			name: 'Duolingo',
			website: 'duolingo.com',
			description: 'Gamified language learning with limited conversation features',
			strengths: [
				'Massive user base and brand recognition',
				'Gamification keeps users engaged',
				'Comprehensive language coverage',
				'Free tier with substantial content',
				'Strong community features'
			],
			weaknesses: [
				'Weak real conversation transfer',
				'Limited speaking practice',
				'Shallow cultural depth',
				'Repetitive exercises',
				'Not optimized for voice-first practice'
			],
			features: [
				'Gamified lessons',
				'Basic conversation practice',
				'Multiple languages',
				'Streak tracking',
				'Community features'
			],
			pricing: {
				free: true,
				premium: '$6.99/month',
				notes: 'Free with ads, premium removes ads and adds features'
			},
			seo: {
				score: 92,
				traffic: '15M/month',
				keywords: ['language learning', 'free language app', 'learn languages']
			},
			userReviews: {
				rating: 4.6,
				count: 50000,
				commonComplaints: [
					'Repetitive',
					'Not practical for real conversations',
					'Limited speaking practice'
				],
				commonPraises: ['Free', 'Fun', 'Easy to use', 'Good for vocabulary']
			},
			marketing: {
				positioning: 'Free language learning for everyone',
				targetAudience: 'Casual language learners',
				keyMessages: ['Free forever', 'Learn a language', 'Fun and effective']
			},
			technical: {
				platform: ['iOS', 'Android', 'Web'],
				languages: ['40+ languages'],
				aiCapabilities: ['Basic conversation AI', 'Adaptive learning']
			}
		},
		{
			name: 'iTalki',
			website: 'italki.com',
			description: 'Human tutors and language exchange platform',
			strengths: [
				'Real human interaction',
				'High personalization with tutors',
				'Authentic cultural context',
				'Flexible scheduling',
				'Professional and community tutors'
			],
			weaknesses: [
				'Expensive per session',
				'Scheduling friction',
				'Inconsistent quality across tutors',
				'Not on-demand',
				'Requires advance planning'
			],
			features: [
				'Human tutors',
				'Language exchange',
				'Flexible scheduling',
				'Multiple languages',
				'Progress tracking'
			],
			pricing: {
				free: false,
				premium: '$10-50/hour',
				notes: 'Pay per session with tutors, no free practice'
			},
			seo: {
				score: 89,
				traffic: '2.1M/month',
				keywords: ['online tutors', 'language exchange', 'learn with natives']
			},
			userReviews: {
				rating: 4.7,
				count: 8500,
				commonComplaints: ['Expensive', 'Scheduling issues', 'Quality varies'],
				commonPraises: ['Real human interaction', 'High quality', 'Flexible']
			},
			marketing: {
				positioning: 'Learn with real people',
				targetAudience: 'Serious language learners',
				keyMessages: ['Real teachers', 'Native speakers', 'Personalized learning']
			},
			technical: {
				platform: ['iOS', 'Android', 'Web'],
				languages: ['150+ languages'],
				aiCapabilities: ['None - human-based']
			}
		},
		{
			name: 'ELSA Speak',
			website: 'elsaspeak.com',
			description: 'AI-powered pronunciation and speaking practice',
			strengths: [
				'Detailed pronunciation scoring',
				'Phoneme-level feedback',
				'Specialized in speaking',
				'Good for accent reduction',
				'Clear progress tracking'
			],
			weaknesses: [
				'Limited conversational realism',
				'No relationship/emotional fluency',
				'Little continuity across sessions',
				'Expensive subscription',
				'Limited language support'
			],
			features: [
				'Pronunciation analysis',
				'Speaking exercises',
				'Progress tracking',
				'Accent training',
				'Multiple languages'
			],
			pricing: {
				free: true,
				premium: '$11.99/month',
				notes: 'Limited free usage, premium required for full features'
			},
			seo: {
				score: 74,
				traffic: '85K/month',
				keywords: ['pronunciation practice', 'accent training', 'speaking app']
			},
			userReviews: {
				rating: 4.3,
				count: 3200,
				commonComplaints: ['Expensive', 'Limited conversation practice', 'Repetitive exercises'],
				commonPraises: ['Good pronunciation feedback', 'Effective for accents', 'Clear progress']
			},
			marketing: {
				positioning: 'Perfect your pronunciation',
				targetAudience: 'Learners focused on pronunciation',
				keyMessages: ['Speak like a native', 'Perfect pronunciation', 'AI feedback']
			},
			technical: {
				platform: ['iOS', 'Android'],
				languages: ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese'],
				aiCapabilities: ['Pronunciation analysis', 'Accent detection', 'Progress tracking']
			}
		},
		{
			name: 'TalkPal',
			website: 'talkpal.ai',
			description: 'AI conversation partner for language practice',
			strengths: [
				'Varied conversation topics',
				'Easy onboarding',
				'Low friction practice',
				'Multiple languages',
				'Affordable pricing'
			],
			weaknesses: [
				'Shallow conversation depth',
				'Limited emotional scenarios',
				'No cultural context',
				'Generic responses',
				'Limited memory across sessions'
			],
			features: [
				'AI conversation practice',
				'Multiple topics',
				'Voice interaction',
				'Progress tracking',
				'Multiple languages'
			],
			pricing: {
				free: true,
				premium: '$9.99/month',
				notes: 'Free tier with limited usage, premium for unlimited'
			},
			seo: {
				score: 68,
				traffic: '45K/month',
				keywords: ['AI conversation', 'language practice', 'chat with AI']
			},
			userReviews: {
				rating: 4.0,
				count: 1200,
				commonComplaints: ['Repetitive conversations', 'Limited depth', 'Generic responses'],
				commonPraises: ['Easy to use', 'Good for practice', 'Affordable']
			},
			marketing: {
				positioning: 'Chat with AI to learn languages',
				targetAudience: 'Casual language learners',
				keyMessages: ['Practice with AI', 'Learn through conversation', 'Easy and fun']
			},
			technical: {
				platform: ['iOS', 'Android', 'Web'],
				languages: ['20+ languages'],
				aiCapabilities: ['Conversation AI', 'Voice recognition', 'Basic progress tracking']
			}
		}
	];

	let kaiwaAdvantages = $state([
		{
			category: 'Emotional Intelligence',
			advantage: 'Focus on relationship-building conversations',
			description:
				'Practice apologies, expressions of love, conflict resolution - conversations that actually matter in real relationships',
			competitorGap:
				'Most apps focus on transactional conversations like ordering food or asking directions'
		},
		{
			category: 'Cultural Context',
			advantage: 'Insider cultural knowledge and phrases',
			description:
				'Learn what locals actually say, not textbook language. Understand cultural nuances and context',
			competitorGap: 'Most apps teach formal, textbook language without cultural context'
		},
		{
			category: 'Asian Language Support',
			advantage: 'Furigana, romanization, and reading support',
			description:
				'Focus on speaking without getting stuck on characters. Reading support when you need it',
			competitorGap: 'Most apps either ignore Asian languages or make them unnecessarily difficult'
		},
		{
			category: 'Conversation Memory',
			advantage: 'AI remembers your context across sessions',
			description:
				'Each conversation builds on previous ones. AI remembers your interests, relationships, and progress',
			competitorGap: 'Most apps treat each conversation as isolated, with no memory or continuity'
		},
		{
			category: 'Anxiety-Free Learning',
			advantage: 'Safe space for practice without judgment',
			description:
				'Practice without fear of making mistakes. Build confidence through supportive, encouraging interactions',
			competitorGap: 'Most apps focus on correctness over confidence, creating anxiety'
		},
		{
			category: 'Unlimited Practice',
			advantage: 'No daily limits or paywalls for core features',
			description:
				'Practice as much as you want, whenever you want. Core conversation features always free',
			competitorGap:
				'Most apps limit free usage or require expensive subscriptions for real practice'
		}
	]);

	let marketOpportunities = $state([
		{
			opportunity: 'Family Connection Market',
			description: 'People learning languages to connect with family members',
			marketSize: 'High',
			competition: 'Low',
			keywords: ['speak to Japanese grandmother', 'family conversations', 'connect with family']
		},
		{
			opportunity: 'Anxiety-Free Learning',
			description: 'Learners who struggle with speaking anxiety and need a safe practice space',
			marketSize: 'High',
			competition: 'Low',
			keywords: ['overcome speaking anxiety', 'safe practice', 'judgment-free learning']
		},
		{
			opportunity: 'Emotional Conversations',
			description: 'Practice meaningful, relationship-building conversations',
			marketSize: 'Medium',
			competition: 'Very Low',
			keywords: ['emotional conversations', 'relationship practice', 'meaningful dialogue']
		},
		{
			opportunity: 'Asian Language Learners',
			description: 'Learners of Japanese, Korean, Chinese who need reading support',
			marketSize: 'Medium',
			competition: 'Low',
			keywords: ['Japanese conversation practice', 'Korean speaking', 'Chinese dialogue']
		}
	]);

	onMount(() => {
		filteredCompetitors = competitors;
	});

	function filterCompetitors() {
		if (!searchTerm.trim()) {
			filteredCompetitors = competitors;
			return;
		}

		filteredCompetitors = competitors.filter(
			(comp) =>
				comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				comp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
				comp.features.some((f) => f.toLowerCase().includes(searchTerm.toLowerCase()))
		);
	}

	function selectCompetitor(competitor: Competitor) {
		selectedCompetitor = competitor;
		analysisMode = 'detailed';
	}

	function getScoreColor(score: number) {
		if (score >= 80) return 'text-green-600';
		if (score >= 60) return 'text-yellow-600';
		return 'text-red-600';
	}

	function getRatingStars(rating: number) {
		return Array.from({ length: 5 }, (_, i) => (i < Math.floor(rating) ? '★' : '☆'));
	}
</script>

<svelte:head>
	<title>Dev — Competition Analysis</title>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<div class="min-h-screen bg-base-200">
	<div class="container mx-auto max-w-7xl px-4 py-10">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold">🔍 Competition Analysis Dashboard</h1>
			<p class="mt-2 text-base-content/70">
				Comprehensive analysis of language learning competitors and market opportunities
			</p>
		</div>

		<!-- Mode Selector -->
		<div class="mb-6">
			<div class="tabs-boxed tabs">
				<button
					class="tab {analysisMode === 'overview' ? 'tab-active' : ''}"
					onclick={() => (analysisMode = 'overview')}
				>
					📊 Overview
				</button>
				<button
					class="tab {analysisMode === 'detailed' ? 'tab-active' : ''}"
					onclick={() => (analysisMode = 'detailed')}
				>
					🔍 Detailed Analysis
				</button>
				<button
					class="tab {analysisMode === 'comparison' ? 'tab-active' : ''}"
					onclick={() => (analysisMode = 'comparison')}
				>
					⚖️ Comparison
				</button>
			</div>
		</div>

		<!-- Overview Mode -->
		{#if analysisMode === 'overview'}
			<div class="space-y-8">
				<!-- Search and Filter -->
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h2 class="card-title">Search Competitors</h2>
						<div class="form-control">
							<input
								type="text"
								placeholder="Search by name, features, or description..."
								class="input-bordered input"
								bind:value={searchTerm}
								oninput={filterCompetitors}
							/>
						</div>
					</div>
				</div>

				<!-- Competitor Grid -->
				<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{#each filteredCompetitors as competitor}
						<div
							class="card cursor-pointer bg-base-100 shadow-lg transition-shadow hover:shadow-xl"
							role="button"
							tabindex="0"
							onclick={() => selectCompetitor(competitor)}
							onkeydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									selectCompetitor(competitor);
								}
							}}
						>
							<div class="card-body">
								<div class="mb-4 flex items-center justify-between">
									<h3 class="card-title text-lg">{competitor.name}</h3>
									<div class="badge badge-primary">{competitor.seo.traffic}</div>
								</div>

								<p class="mb-4 text-sm text-base-content/70">{competitor.description}</p>

								<div class="space-y-2">
									<div class="flex items-center justify-between text-sm">
										<span>SEO Score:</span>
										<span class={getScoreColor(competitor.seo.score)}
											>{competitor.seo.score}/100</span
										>
									</div>
									<div class="flex items-center justify-between text-sm">
										<span>User Rating:</span>
										<span class="flex items-center gap-1">
											{getRatingStars(competitor.userReviews.rating)}
											<span class="text-xs">({competitor.userReviews.count})</span>
										</span>
									</div>
									<div class="flex items-center justify-between text-sm">
										<span>Pricing:</span>
										<span class={competitor.pricing.free ? 'text-green-600' : 'text-red-600'}>
											{competitor.pricing.free ? 'Free + Premium' : 'Premium Only'}
										</span>
									</div>
								</div>

								<div class="mt-4 card-actions justify-end">
									<button class="btn btn-sm btn-primary">Analyze</button>
								</div>
							</div>
						</div>
					{/each}
				</div>

				<!-- Market Opportunities -->
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h2 class="mb-4 card-title">🎯 Market Opportunities</h2>
						<div class="grid gap-4 md:grid-cols-2">
							{#each marketOpportunities as opportunity}
								<div class="card bg-base-200 shadow">
									<div class="card-body p-4">
										<div class="mb-2 flex items-center justify-between">
											<h3 class="font-semibold">{opportunity.opportunity}</h3>
											<div class="flex gap-2">
												<span
													class="badge badge-sm {opportunity.marketSize === 'High'
														? 'badge-success'
														: 'badge-warning'}"
												>
													{opportunity.marketSize} Market
												</span>
												<span
													class="badge badge-sm {opportunity.competition === 'Low'
														? 'badge-success'
														: 'badge-warning'}"
												>
													{opportunity.competition} Competition
												</span>
											</div>
										</div>
										<p class="mb-2 text-sm text-base-content/70">{opportunity.description}</p>
										<div class="text-xs text-base-content/60">
											<strong>Keywords:</strong>
											{opportunity.keywords.join(', ')}
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Detailed Analysis Mode -->
		{#if analysisMode === 'detailed' && selectedCompetitor}
			<div class="space-y-6">
				<!-- Competitor Header -->
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<div class="mb-4 flex items-center justify-between">
							<div>
								<h2 class="text-2xl font-bold">{selectedCompetitor.name}</h2>
								<p class="text-base-content/70">{selectedCompetitor.description}</p>
								<a
									href="https://{selectedCompetitor.website}"
									target="_blank"
									class="link text-sm link-primary"
								>
									{selectedCompetitor.website}
								</a>
							</div>
							<button class="btn btn-ghost" onclick={() => (selectedCompetitor = null)}>
								← Back to Overview
							</button>
						</div>
					</div>
				</div>

				<!-- Detailed Analysis Grid -->
				<div class="grid gap-6 lg:grid-cols-2">
					<!-- Strengths & Weaknesses -->
					<div class="card bg-base-100 shadow-lg">
						<div class="card-body">
							<h3 class="card-title text-lg">Strengths & Weaknesses</h3>
							<div class="space-y-4">
								<div>
									<h4 class="mb-2 font-semibold text-green-600">Strengths</h4>
									<ul class="list-inside list-disc space-y-1 text-sm">
										{#each selectedCompetitor.strengths as strength}
											<li>{strength}</li>
										{/each}
									</ul>
								</div>
								<div>
									<h4 class="mb-2 font-semibold text-red-600">Weaknesses</h4>
									<ul class="list-inside list-disc space-y-1 text-sm">
										{#each selectedCompetitor.weaknesses as weakness}
											<li>{weakness}</li>
										{/each}
									</ul>
								</div>
							</div>
						</div>
					</div>

					<!-- SEO & Marketing -->
					<div class="card bg-base-100 shadow-lg">
						<div class="card-body">
							<h3 class="card-title text-lg">SEO & Marketing</h3>
							<div class="space-y-4">
								<div>
									<div class="mb-2 flex items-center justify-between">
										<span class="font-semibold">SEO Score:</span>
										<span class={getScoreColor(selectedCompetitor.seo.score)}>
											{selectedCompetitor.seo.score}/100
										</span>
									</div>
									<div class="mb-2 flex items-center justify-between">
										<span class="font-semibold">Monthly Traffic:</span>
										<span>{selectedCompetitor.seo.traffic}</span>
									</div>
									<div>
										<span class="font-semibold">Top Keywords:</span>
										<div class="mt-1 flex flex-wrap gap-1">
											{#each selectedCompetitor.seo.keywords as keyword}
												<span class="badge badge-outline badge-sm">{keyword}</span>
											{/each}
										</div>
									</div>
								</div>
								<div>
									<h4 class="mb-2 font-semibold">Positioning</h4>
									<p class="text-sm text-base-content/70">
										{selectedCompetitor.marketing.positioning}
									</p>
									<p class="mt-1 text-sm text-base-content/70">
										<strong>Target:</strong>
										{selectedCompetitor.marketing.targetAudience}
									</p>
								</div>
							</div>
						</div>
					</div>

					<!-- Pricing & Reviews -->
					<div class="card bg-base-100 shadow-lg">
						<div class="card-body">
							<h3 class="card-title text-lg">Pricing & Reviews</h3>
							<div class="space-y-4">
								<div>
									<h4 class="mb-2 font-semibold">Pricing</h4>
									<div class="mb-2 flex items-center gap-2">
										<span
											class="badge {selectedCompetitor.pricing.free
												? 'badge-success'
												: 'badge-error'}"
										>
											{selectedCompetitor.pricing.free ? 'Free Available' : 'Premium Only'}
										</span>
										<span class="font-semibold">{selectedCompetitor.pricing.premium}</span>
									</div>
									<p class="text-sm text-base-content/70">{selectedCompetitor.pricing.notes}</p>
								</div>
								<div>
									<h4 class="mb-2 font-semibold">User Reviews</h4>
									<div class="mb-2 flex items-center gap-2">
										<span class="text-lg"
											>{getRatingStars(selectedCompetitor.userReviews.rating).join('')}</span
										>
										<span class="font-semibold">{selectedCompetitor.userReviews.rating}/5</span>
										<span class="text-sm text-base-content/70"
											>({selectedCompetitor.userReviews.count} reviews)</span
										>
									</div>
									<div class="space-y-2">
										<div>
											<span class="text-sm font-medium text-green-600">Common Praises:</span>
											<ul class="list-inside list-disc text-xs text-base-content/70">
												{#each selectedCompetitor.userReviews.commonPraises as praise}
													<li>{praise}</li>
												{/each}
											</ul>
										</div>
										<div>
											<span class="text-sm font-medium text-red-600">Common Complaints:</span>
											<ul class="list-inside list-disc text-xs text-base-content/70">
												{#each selectedCompetitor.userReviews.commonComplaints as complaint}
													<li>{complaint}</li>
												{/each}
											</ul>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					<!-- Technical Details -->
					<div class="card bg-base-100 shadow-lg">
						<div class="card-body">
							<h3 class="card-title text-lg">Technical Details</h3>
							<div class="space-y-4">
								<div>
									<h4 class="mb-2 font-semibold">Platforms</h4>
									<div class="flex flex-wrap gap-1">
										{#each selectedCompetitor.technical.platform as platform}
											<span class="badge badge-sm">{platform}</span>
										{/each}
									</div>
								</div>
								<div>
									<h4 class="mb-2 font-semibold">Languages</h4>
									<div class="text-sm text-base-content/70">
										{selectedCompetitor.technical.languages.join(', ')}
									</div>
								</div>
								<div>
									<h4 class="mb-2 font-semibold">AI Capabilities</h4>
									<div class="flex flex-wrap gap-1">
										{#each selectedCompetitor.technical.aiCapabilities as capability}
											<span class="badge badge-outline badge-sm">{capability}</span>
										{/each}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Comparison Mode -->
		{#if analysisMode === 'comparison'}
			<div class="space-y-6">
				<!-- Kaiwa Advantages -->
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h2 class="mb-4 card-title">🚀 Kaiwa's Competitive Advantages</h2>
						<div class="grid gap-4 md:grid-cols-2">
							{#each kaiwaAdvantages as advantage}
								<div class="card border border-primary/20 bg-primary/10">
									<div class="card-body p-4">
										<div class="mb-2 flex items-center gap-2">
											<span class="badge badge-primary">{advantage.category}</span>
										</div>
										<h3 class="text-lg font-semibold">{advantage.advantage}</h3>
										<p class="mb-2 text-sm text-base-content/70">{advantage.description}</p>
										<div class="text-xs text-base-content/60">
											<strong>Competitor Gap:</strong>
											{advantage.competitorGap}
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>

				<!-- Feature Comparison Matrix -->
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h2 class="mb-4 card-title">📊 Feature Comparison Matrix</h2>
						<div class="overflow-x-auto">
							<table class="table w-full table-zebra">
								<thead>
									<tr>
										<th>Feature</th>
										{#each competitors as comp}
											<th class="text-center">{comp.name}</th>
										{/each}
										<th class="text-center text-primary">Kaiwa</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td class="font-semibold">Emotional Conversations</td>
										{#each competitors as comp}
											<td class="text-center">
												{comp.name === 'Speak' ? 'Partial' : comp.name === 'iTalki' ? 'Yes' : 'No'}
											</td>
										{/each}
										<td class="text-center font-bold text-primary">Core</td>
									</tr>
									<tr>
										<td class="font-semibold">Asian Language Support</td>
										{#each competitors as comp}
											<td class="text-center">
												{comp.name === 'ELSA Speak' ? 'Limited' : 'No'}
											</td>
										{/each}
										<td class="text-center font-bold text-primary">Core</td>
									</tr>
									<tr>
										<td class="font-semibold">Conversation Memory</td>
										{#each competitors as comp}
											<td class="text-center">
												{comp.name === 'TalkPal' ? 'Limited' : 'No'}
											</td>
										{/each}
										<td class="text-center font-bold text-primary">Core</td>
									</tr>
									<tr>
										<td class="font-semibold">Unlimited Free Practice</td>
										{#each competitors as comp}
											<td class="text-center">
												{comp.name === 'Duolingo'
													? 'Limited'
													: comp.name === 'TalkPal'
														? 'Limited'
														: 'No'}
											</td>
										{/each}
										<td class="text-center font-bold text-primary">Yes</td>
									</tr>
									<tr>
										<td class="font-semibold">Cultural Context</td>
										{#each competitors as comp}
											<td class="text-center">
												{comp.name === 'iTalki' ? 'Yes' : 'Limited'}
											</td>
										{/each}
										<td class="text-center font-bold text-primary">Core</td>
									</tr>
									<tr>
										<td class="font-semibold">Anxiety-Free Learning</td>
										{#each competitors as comp}
											<td class="text-center">No</td>
										{/each}
										<td class="text-center font-bold text-primary">Core</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				</div>

				<!-- Strategic Recommendations -->
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h2 class="mb-4 card-title">🎯 Strategic Recommendations</h2>
						<div class="grid gap-4 md:grid-cols-2">
							<div class="card border border-success/20 bg-success/10">
								<div class="card-body p-4">
									<h3 class="mb-2 font-semibold text-success">Immediate Actions</h3>
									<ul class="list-inside list-disc space-y-1 text-sm">
										<li>Emphasize emotional conversation focus in marketing</li>
										<li>Highlight unlimited free practice vs competitors</li>
										<li>Target family connection market specifically</li>
										<li>Create anxiety-free positioning content</li>
									</ul>
								</div>
							</div>
							<div class="card border border-warning/20 bg-warning/10">
								<div class="card-body p-4">
									<h3 class="mb-2 font-semibold text-warning">Medium-term Strategy</h3>
									<ul class="list-inside list-disc space-y-1 text-sm">
										<li>Build authority in emotional language learning</li>
										<li>Create comparison content vs major competitors</li>
										<li>Develop Asian language learning community</li>
										<li>Partner with family-focused influencers</li>
									</ul>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
