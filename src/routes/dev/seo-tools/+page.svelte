<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	interface KeywordData {
		keyword: string;
		volume: number;
		difficulty: number;
		competition: 'Low' | 'Medium' | 'High';
		cpc: number;
		trend: 'up' | 'down' | 'stable';
		relatedKeywords: string[];
	}

	interface ContentSuggestion {
		title: string;
		description: string;
		keywords: string[];
		wordCount: number;
		priority: 'High' | 'Medium' | 'Low';
		estimatedTraffic: number;
	}

	let selectedTool = $state<
		'keyword-research' | 'content-optimization' | 'competitor-analysis' | 'technical-seo'
	>('keyword-research');
	let searchQuery = $state('');
	let keywordResults = $state<KeywordData[]>([]);
	let contentSuggestions = $state<ContentSuggestion[]>([]);
	let isLoading = $state(false);
	let seoScore = $state(0);
	let technicalIssues = $state<string[]>([]);

	// Mock data for demonstration
	const mockKeywords: KeywordData[] = [
		{
			keyword: 'Japanese conversation practice AI',
			volume: 2400,
			difficulty: 70,
			competition: 'High',
			cpc: 2.5,
			trend: 'up',
			relatedKeywords: [
				'AI Japanese tutor',
				'Japanese speaking practice',
				'conversation AI Japanese'
			]
		},
		{
			keyword: 'authentic Japanese conversation practice',
			volume: 1200,
			difficulty: 65,
			competition: 'Medium',
			cpc: 1.8,
			trend: 'stable',
			relatedKeywords: [
				'real Japanese conversation',
				'natural Japanese speaking',
				'Japanese dialogue practice'
			]
		},
		{
			keyword: 'build confidence speaking Japanese',
			volume: 800,
			difficulty: 60,
			competition: 'Medium',
			cpc: 1.2,
			trend: 'up',
			relatedKeywords: [
				'Japanese speaking confidence',
				'overcome Japanese anxiety',
				'Japanese conversation confidence'
			]
		},
		{
			keyword: 'Japanese family conversation practice',
			volume: 400,
			difficulty: 45,
			competition: 'Low',
			cpc: 0.8,
			trend: 'up',
			relatedKeywords: [
				'speak to Japanese grandmother',
				'family Japanese practice',
				'Japanese family dialogue'
			]
		},
		{
			keyword: 'anxiety-free Japanese learning',
			volume: 300,
			difficulty: 35,
			competition: 'Low',
			cpc: 0.6,
			trend: 'up',
			relatedKeywords: [
				'safe Japanese practice',
				'judgment-free Japanese',
				'comfortable Japanese learning'
			]
		}
	];

	const mockContentSuggestions: ContentSuggestion[] = [
		{
			title: 'How to Build Confidence Speaking Japanese: A Complete Guide',
			description:
				'Learn practical strategies to overcome speaking anxiety and build confidence in Japanese conversations',
			keywords: [
				'build confidence speaking Japanese',
				'Japanese speaking anxiety',
				'Japanese conversation confidence'
			],
			wordCount: 2500,
			priority: 'High',
			estimatedTraffic: 1200
		},
		{
			title: 'Authentic Japanese Conversation Practice: What Locals Actually Say',
			description:
				'Discover the difference between textbook Japanese and real conversations with cultural context',
			keywords: [
				'authentic Japanese conversation',
				'real Japanese phrases',
				'Japanese cultural context'
			],
			wordCount: 2000,
			priority: 'High',
			estimatedTraffic: 800
		},
		{
			title: 'Japanese Family Conversations: Practice Scenarios for Real Life',
			description:
				'Practice conversations with Japanese family members, from grandparents to in-laws',
			keywords: [
				'Japanese family conversation',
				'speak to Japanese grandmother',
				'Japanese family practice'
			],
			wordCount: 1800,
			priority: 'Medium',
			estimatedTraffic: 500
		},
		{
			title: 'AI vs Human Japanese Tutors: Which is Better for Conversation Practice?',
			description: 'Compare AI conversation practice with human tutors for Japanese learning',
			keywords: ['AI Japanese tutor', 'Japanese conversation AI', 'human vs AI Japanese learning'],
			wordCount: 2200,
			priority: 'Medium',
			estimatedTraffic: 600
		}
	];

	onMount(() => {
		if (browser) {
			analyzeCurrentPage();
		}
	});

	function analyzeCurrentPage() {
		// Simulate page analysis
		seoScore = 75;
		technicalIssues = [
			'Missing meta description',
			'Images without alt text (3 found)',
			'No canonical URL set',
			'Page load time could be improved'
		];
	}

	async function searchKeywords() {
		if (!searchQuery.trim()) return;

		isLoading = true;
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// Filter mock data based on search query
		keywordResults = mockKeywords.filter(
			(k) =>
				k.keyword.toLowerCase().includes(searchQuery.toLowerCase()) ||
				k.relatedKeywords.some((rk) => rk.toLowerCase().includes(searchQuery.toLowerCase()))
		);

		isLoading = false;
	}

	function generateContentSuggestions() {
		contentSuggestions = mockContentSuggestions;
	}

	function getDifficultyColor(difficulty: number) {
		if (difficulty < 40) return 'text-green-600';
		if (difficulty < 70) return 'text-yellow-600';
		return 'text-red-600';
	}

	function getCompetitionColor(competition: string) {
		switch (competition) {
			case 'Low':
				return 'text-green-600 bg-green-100';
			case 'Medium':
				return 'text-yellow-600 bg-yellow-100';
			case 'High':
				return 'text-red-600 bg-red-100';
			default:
				return 'text-gray-600 bg-gray-100';
		}
	}

	function getTrendIcon(trend: string) {
		switch (trend) {
			case 'up':
				return '📈';
			case 'down':
				return '📉';
			case 'stable':
				return '➡️';
			default:
				return '➡️';
		}
	}

	function getPriorityColor(priority: string) {
		switch (priority) {
			case 'High':
				return 'text-red-600 bg-red-100';
			case 'Medium':
				return 'text-yellow-600 bg-yellow-100';
			case 'Low':
				return 'text-green-600 bg-green-100';
			default:
				return 'text-gray-600 bg-gray-100';
		}
	}
</script>

<svelte:head>
	<title>Dev — SEO Tools</title>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<div class="min-h-screen bg-base-200">
	<div class="container mx-auto max-w-7xl px-4 py-10">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold">🔍 Advanced SEO Tools</h1>
			<p class="mt-2 text-base-content/70">
				Comprehensive SEO analysis, keyword research, and content optimization tools
			</p>
		</div>

		<!-- Tool Selector -->
		<div class="mb-6">
			<div class="tabs-boxed tabs">
				<button
					class="tab {selectedTool === 'keyword-research' ? 'tab-active' : ''}"
					onclick={() => (selectedTool = 'keyword-research')}
				>
					🔍 Keyword Research
				</button>
				<button
					class="tab {selectedTool === 'content-optimization' ? 'tab-active' : ''}"
					onclick={() => (selectedTool = 'content-optimization')}
				>
					📝 Content Optimization
				</button>
				<button
					class="tab {selectedTool === 'competitor-analysis' ? 'tab-active' : ''}"
					onclick={() => (selectedTool = 'competitor-analysis')}
				>
					⚔️ Competitor Analysis
				</button>
				<button
					class="tab {selectedTool === 'technical-seo' ? 'tab-active' : ''}"
					onclick={() => (selectedTool = 'technical-seo')}
				>
					⚙️ Technical SEO
				</button>
			</div>
		</div>

		<!-- Keyword Research Tool -->
		{#if selectedTool === 'keyword-research'}
			<div class="space-y-6">
				<!-- Search Interface -->
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h2 class="card-title">Keyword Research</h2>
						<div class="form-control">
							<div class="input-group">
								<input
									type="text"
									placeholder="Enter keywords to research..."
									class="input-bordered input flex-1"
									bind:value={searchQuery}
									onkeydown={(e) => e.key === 'Enter' && searchKeywords()}
								/>
								<button class="btn btn-primary" onclick={searchKeywords} disabled={isLoading}>
									{isLoading ? 'Searching...' : 'Search'}
								</button>
							</div>
						</div>
					</div>
				</div>

				<!-- Keyword Results -->
				{#if keywordResults.length > 0}
					<div class="card bg-base-100 shadow-lg">
						<div class="card-body">
							<h3 class="card-title">Keyword Analysis Results</h3>
							<div class="overflow-x-auto">
								<table class="table w-full table-zebra">
									<thead>
										<tr>
											<th>Keyword</th>
											<th>Volume</th>
											<th>Difficulty</th>
											<th>Competition</th>
											<th>CPC</th>
											<th>Trend</th>
											<th>Related Keywords</th>
										</tr>
									</thead>
									<tbody>
										{#each keywordResults as keyword}
											<tr>
												<td class="font-semibold">{keyword.keyword}</td>
												<td>{keyword.volume.toLocaleString()}</td>
												<td>
													<span class={getDifficultyColor(keyword.difficulty)}>
														{keyword.difficulty}/100
													</span>
												</td>
												<td>
													<span class="badge {getCompetitionColor(keyword.competition)}">
														{keyword.competition}
													</span>
												</td>
												<td>${keyword.cpc}</td>
												<td>
													<span class="flex items-center gap-1">
														{getTrendIcon(keyword.trend)}
														{keyword.trend}
													</span>
												</td>
												<td>
													<div class="flex flex-wrap gap-1">
														{#each keyword.relatedKeywords.slice(0, 2) as related}
															<span class="badge badge-outline badge-sm">{related}</span>
														{/each}
													</div>
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				{/if}

				<!-- Keyword Suggestions -->
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h3 class="card-title">Recommended Keywords for Kaiwa</h3>
						<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							{#each mockKeywords as keyword}
								<div class="card bg-base-200 shadow">
									<div class="card-body p-4">
										<div class="mb-2 flex items-center justify-between">
											<h4 class="font-semibold">{keyword.keyword}</h4>
											<span class="badge {getCompetitionColor(keyword.competition)}">
												{keyword.competition}
											</span>
										</div>
										<div class="space-y-1 text-sm">
											<div class="flex justify-between">
												<span>Volume:</span>
												<span>{keyword.volume.toLocaleString()}</span>
											</div>
											<div class="flex justify-between">
												<span>Difficulty:</span>
												<span class={getDifficultyColor(keyword.difficulty)}>
													{keyword.difficulty}/100
												</span>
											</div>
											<div class="flex justify-between">
												<span>CPC:</span>
												<span>${keyword.cpc}</span>
											</div>
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Content Optimization Tool -->
		{#if selectedTool === 'content-optimization'}
			<div class="space-y-6">
				<!-- Content Suggestions -->
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<div class="mb-4 flex items-center justify-between">
							<h2 class="card-title">Content Suggestions</h2>
							<button class="btn btn-primary" onclick={generateContentSuggestions}>
								Generate Suggestions
							</button>
						</div>

						{#if contentSuggestions.length > 0}
							<div class="space-y-4">
								{#each contentSuggestions as suggestion}
									<div class="card bg-base-200 shadow">
										<div class="card-body p-4">
											<div class="mb-2 flex items-start justify-between">
												<h3 class="text-lg font-semibold">{suggestion.title}</h3>
												<span class="badge {getPriorityColor(suggestion.priority)}">
													{suggestion.priority} Priority
												</span>
											</div>
											<p class="mb-3 text-sm text-base-content/70">{suggestion.description}</p>
											<div class="grid grid-cols-2 gap-4 text-sm">
												<div>
													<span class="font-medium">Target Keywords:</span>
													<div class="mt-1 flex flex-wrap gap-1">
														{#each suggestion.keywords as keyword}
															<span class="badge badge-outline badge-sm">{keyword}</span>
														{/each}
													</div>
												</div>
												<div class="space-y-1">
													<div class="flex justify-between">
														<span>Word Count:</span>
														<span>{suggestion.wordCount}</span>
													</div>
													<div class="flex justify-between">
														<span>Est. Traffic:</span>
														<span>{suggestion.estimatedTraffic}</span>
													</div>
												</div>
											</div>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>

				<!-- Content Optimization Tips -->
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h2 class="card-title">Content Optimization Tips</h2>
						<div class="grid gap-4 md:grid-cols-2">
							<div class="space-y-3">
								<h3 class="font-semibold text-green-600">✅ Best Practices</h3>
								<ul class="space-y-2 text-sm">
									<li>• Use target keywords naturally in title and first paragraph</li>
									<li>• Include long-tail keywords for better ranking</li>
									<li>• Write for humans first, search engines second</li>
									<li>• Use emotional triggers in headlines</li>
									<li>• Include personal stories and examples</li>
									<li>• Add internal links to related content</li>
								</ul>
							</div>
							<div class="space-y-3">
								<h3 class="font-semibold text-red-600">❌ Avoid</h3>
								<ul class="space-y-2 text-sm">
									<li>• Keyword stuffing or over-optimization</li>
									<li>• Duplicate content across pages</li>
									<li>• Thin content with little value</li>
									<li>• Generic, non-specific headlines</li>
									<li>• Missing meta descriptions</li>
									<li>• Poor mobile optimization</li>
								</ul>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Competitor Analysis Tool -->
		{#if selectedTool === 'competitor-analysis'}
			<div class="space-y-6">
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h2 class="card-title">SEO Competitor Analysis</h2>
						<div class="overflow-x-auto">
							<table class="table w-full table-zebra">
								<thead>
									<tr>
										<th>Competitor</th>
										<th>Domain Authority</th>
										<th>Monthly Traffic</th>
										<th>Top Keywords</th>
										<th>Backlinks</th>
										<th>Content Gaps</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td class="font-semibold">Duolingo</td>
										<td>92</td>
										<td>15M</td>
										<td>
											<div class="flex flex-wrap gap-1">
												<span class="badge badge-sm">learn languages</span>
												<span class="badge badge-sm">free language app</span>
											</div>
										</td>
										<td>2.1M</td>
										<td>Emotional conversations, family focus</td>
									</tr>
									<tr>
										<td class="font-semibold">iTalki</td>
										<td>89</td>
										<td>2.1M</td>
										<td>
											<div class="flex flex-wrap gap-1">
												<span class="badge badge-sm">online tutors</span>
												<span class="badge badge-sm">language exchange</span>
											</div>
										</td>
										<td>850K</td>
										<td>AI convenience, unlimited practice</td>
									</tr>
									<tr>
										<td class="font-semibold">Speak</td>
										<td>78</td>
										<td>120K</td>
										<td>
											<div class="flex flex-wrap gap-1">
												<span class="badge badge-sm">AI conversation</span>
												<span class="badge badge-sm">speaking practice</span>
											</div>
										</td>
										<td>45K</td>
										<td>Emotional scenarios, cultural context</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				</div>

				<!-- Opportunity Analysis -->
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h2 class="card-title">Content Gap Opportunities</h2>
						<div class="grid gap-4 md:grid-cols-2">
							<div class="card border border-success/20 bg-success/10">
								<div class="card-body p-4">
									<h3 class="mb-2 font-semibold text-success">High Opportunity</h3>
									<ul class="space-y-1 text-sm">
										<li>• "Japanese family conversation practice" - Low competition</li>
										<li>• "Anxiety-free Japanese learning" - Emerging keyword</li>
										<li>• "Emotional Japanese conversations" - Unique angle</li>
										<li>• "Speak to Japanese grandmother" - Long-tail opportunity</li>
									</ul>
								</div>
							</div>
							<div class="card border border-warning/20 bg-warning/10">
								<div class="card-body p-4">
									<h3 class="mb-2 font-semibold text-warning">Medium Opportunity</h3>
									<ul class="space-y-1 text-sm">
										<li>• "AI Japanese conversation practice" - High volume, high competition</li>
										<li>• "Build confidence speaking Japanese" - Medium competition</li>
										<li>• "Authentic Japanese conversation" - Established competitors</li>
										<li>• "Japanese speaking anxiety" - Niche but growing</li>
									</ul>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Technical SEO Tool -->
		{#if selectedTool === 'technical-seo'}
			<div class="space-y-6">
				<!-- Current Page Analysis -->
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h2 class="card-title">Current Page SEO Analysis</h2>
						<div class="grid gap-6 md:grid-cols-2">
							<div>
								<h3 class="mb-4 font-semibold">SEO Score</h3>
								<div
									class="radial-progress text-primary"
									style={`--value:${seoScore}; --size:8rem; --thickness:0.8rem;`}
								>
									{seoScore}/100
								</div>
								<p class="mt-2 text-sm text-base-content/70">
									{seoScore >= 80
										? 'Excellent SEO score!'
										: seoScore >= 60
											? 'Good, but room for improvement'
											: 'Needs significant improvement'}
								</p>
							</div>
							<div>
								<h3 class="mb-4 font-semibold">Technical Issues</h3>
								{#if technicalIssues.length === 0}
									<p class="text-green-600">🎉 No technical issues found!</p>
								{:else}
									<ul class="space-y-2">
										{#each technicalIssues as issue}
											<li class="flex items-center gap-2 text-sm">
												<span class="text-red-500">❌</span>
												<span>{issue}</span>
											</li>
										{/each}
									</ul>
								{/if}
							</div>
						</div>
					</div>
				</div>

				<!-- SEO Checklist -->
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h2 class="card-title">SEO Checklist</h2>
						<div class="grid gap-4 md:grid-cols-2">
							<div>
								<h3 class="mb-3 font-semibold">On-Page SEO</h3>
								<div class="space-y-2">
									<label class="flex cursor-pointer items-center gap-2">
										<input type="checkbox" class="checkbox checkbox-sm" checked />
										<span class="text-sm">Title tag optimized (30-60 chars)</span>
									</label>
									<label class="flex cursor-pointer items-center gap-2">
										<input type="checkbox" class="checkbox checkbox-sm" />
										<span class="text-sm">Meta description added (120-160 chars)</span>
									</label>
									<label class="flex cursor-pointer items-center gap-2">
										<input type="checkbox" class="checkbox checkbox-sm" checked />
										<span class="text-sm">H1 tag present and optimized</span>
									</label>
									<label class="flex cursor-pointer items-center gap-2">
										<input type="checkbox" class="checkbox checkbox-sm" />
										<span class="text-sm">Images have alt text</span>
									</label>
									<label class="flex cursor-pointer items-center gap-2">
										<input type="checkbox" class="checkbox checkbox-sm" />
										<span class="text-sm">Internal linking implemented</span>
									</label>
								</div>
							</div>
							<div>
								<h3 class="mb-3 font-semibold">Technical SEO</h3>
								<div class="space-y-2">
									<label class="flex cursor-pointer items-center gap-2">
										<input type="checkbox" class="checkbox checkbox-sm" checked />
										<span class="text-sm">Mobile-friendly design</span>
									</label>
									<label class="flex cursor-pointer items-center gap-2">
										<input type="checkbox" class="checkbox checkbox-sm" />
										<span class="text-sm">Canonical URL set</span>
									</label>
									<label class="flex cursor-pointer items-center gap-2">
										<input type="checkbox" class="checkbox checkbox-sm" checked />
										<span class="text-sm">Fast loading speed</span>
									</label>
									<label class="flex cursor-pointer items-center gap-2">
										<input type="checkbox" class="checkbox checkbox-sm" />
										<span class="text-sm">Schema markup implemented</span>
									</label>
									<label class="flex cursor-pointer items-center gap-2">
										<input type="checkbox" class="checkbox checkbox-sm" />
										<span class="text-sm">XML sitemap created</span>
									</label>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Performance Metrics -->
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h2 class="card-title">Performance Metrics</h2>
						<div class="grid gap-4 md:grid-cols-3">
							<div class="text-center">
								<div class="text-3xl font-bold text-green-600">95</div>
								<div class="text-sm text-base-content/70">Performance Score</div>
							</div>
							<div class="text-center">
								<div class="text-3xl font-bold text-yellow-600">78</div>
								<div class="text-sm text-base-content/70">Accessibility Score</div>
							</div>
							<div class="text-center">
								<div class="text-3xl font-bold text-green-600">92</div>
								<div class="text-sm text-base-content/70">Best Practices</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
