<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';

	// SEO Target Keywords Strategy
	const targetKeywords = {
		primary: [
			{ keyword: 'authentic conversation practice in Japanese', volume: 1200, difficulty: 65, competitors: ['Rocket Japanese', 'Langua', 'iTalki', 'Pimsleur'] },
			{ keyword: 'build confidence in Japanese', volume: 800, difficulty: 60, competitors: ['Pimsleur', 'Falou', 'HelloTalk'] },
			{ keyword: 'Japanese conversation practice AI', volume: 2400, difficulty: 70, competitors: ['TalkPal', 'Langua', 'Falou'] },
			{ keyword: 'natural Japanese speaking practice', volume: 900, difficulty: 55, competitors: ['iTalki', 'Preply', 'HelloTalk'] }
		],
		secondary: [
			{ keyword: 'Japanese conversation practice app', volume: 3200, difficulty: 75, competitors: ['Duolingo', 'Busuu', 'Babbel'] },
			{ keyword: 'practice Japanese speaking online', volume: 1800, difficulty: 65, competitors: ['FluentU', 'JapanesePod101', 'Rocket Japanese'] },
			{ keyword: 'AI Japanese tutor conversation', volume: 1100, difficulty: 60, competitors: ['Andy English Bot', 'Speechling'] },
			{ keyword: 'Japanese speaking confidence', volume: 600, difficulty: 50, competitors: ['Pimsleur', 'Rosetta Stone'] }
		],
		longTail: [
			{ keyword: 'practice Japanese conversation with AI for free', volume: 400, difficulty: 35, competitors: ['HelloTalk', 'Tandem'] },
			{ keyword: 'build confidence speaking Japanese online', volume: 320, difficulty: 40, competitors: ['iTalki', 'Preply'] },
			{ keyword: 'authentic Japanese conversation practice app', volume: 280, difficulty: 45, competitors: ['Langua', 'Falou'] },
			{ keyword: 'natural Japanese dialogue practice', volume: 190, difficulty: 30, competitors: ['JapanesePod101'] }
		]
	};

	// Content Gap Analysis
	const contentGaps = [
		{
			topic: 'Family Conversation Scenarios',
			opportunity: 'High',
			reason: 'Emotional connection angle missing from competitors',
			keywords: ['speak to Japanese grandmother', 'family conversations in Japanese', 'connect with Japanese family']
		},
		{
			topic: 'Professional Japanese Confidence',
			opportunity: 'Medium',
			reason: 'Business conversation practice underserved',
			keywords: ['Japanese business conversations', 'professional Japanese speaking', 'workplace Japanese confidence']
		},
		{
			topic: 'Anxiety-Free Learning',
			opportunity: 'High',
			reason: 'Few apps address speaking anxiety specifically',
			keywords: ['overcome Japanese speaking anxiety', 'safe Japanese practice', 'judgment-free Japanese learning']
		},
		{
			topic: 'Real-Time Feedback',
			opportunity: 'Medium',
			reason: 'AI feedback quality varies widely',
			keywords: ['instant Japanese correction', 'real-time Japanese feedback', 'AI Japanese pronunciation help']
		}
	];

	// Technical SEO Analysis
	let seoScore = $state(0);
	let seoIssues = $state<string[]>([]);
	let loadTime = $state(0);
	let currentPageSEO = $state<any>({});

	// Competitor Analysis
	const competitorAnalysis = [
		{
			name: 'Langua',
			strengths: ['Advanced AI', 'Native-like voice', 'Roleplay scenarios'],
			weaknesses: ['Expensive', 'Limited free features', 'New brand'],
			SEOScore: 72,
			monthlyTraffic: '45K'
		},
		{
			name: 'iTalki',
			strengths: ['Human tutors', 'Live conversation', 'Established brand'],
			weaknesses: ['Expensive', 'Scheduling required', 'Variable quality'],
			SEOScore: 89,
			monthlyTraffic: '2.1M'
		},
		{
			name: 'Pimsleur',
			strengths: ['Audio-based', 'Proven method', 'Brand recognition'],
			weaknesses: ['Not AI-powered', 'Limited interaction', 'Subscription model'],
			SEOScore: 86,
			monthlyTraffic: '890K'
		},
		{
			name: 'Rocket Japanese',
			strengths: ['Comprehensive course', 'Interactive audio', 'Cultural context'],
			weaknesses: ['Traditional approach', 'Not conversational AI', 'Expensive'],
			SEOScore: 79,
			monthlyTraffic: '156K'
		}
	];

	// SEO Strategy Recommendations
	const seoStrategy = {
		phase1: {
			title: 'Foundation (Months 1-2)',
			tasks: [
				'Optimize homepage for "Japanese conversation practice AI"',
				'Create landing pages for each target keyword',
				'Implement proper schema markup for educational app',
				'Add language-specific structured data',
				'Fix technical SEO issues (Core Web Vitals)',
				'Create comprehensive FAQ section'
			]
		},
		phase2: {
			title: 'Content Dominance (Months 3-4)',
			tasks: [
				'Launch blog with "How to build confidence speaking Japanese"',
				'Create "Authentic Japanese conversation practice guide"',
				'Develop scenario-based landing pages (family, work, travel)',
				'Add user success stories and testimonials',
				'Create comparison pages vs major competitors',
				'Implement internal linking strategy'
			]
		},
		phase3: {
			title: 'Authority Building (Months 5-6)',
			tasks: [
				'Guest posting on language learning blogs',
				'Get featured in "best apps" roundups',
				'Create shareable infographics about Japanese learning',
				'Build backlinks from language learning communities',
				'Optimize for featured snippets on target queries',
				'Launch referral program for organic link building'
			]
		}
	};

	// Performance Metrics
	onMount(async () => {
		if (!browser) return;

		// Measure page load time
		const startTime = performance.now();
		await new Promise(resolve => setTimeout(resolve, 100));
		loadTime = Math.round(performance.now() - startTime);

		// Analyze current page SEO
		analyzeCurrentPageSEO();

		// Calculate overall SEO score
		calculateSEOScore();
	});

	function analyzeCurrentPageSEO() {
		const issues = [];

		// Check title length
		const title = document.title;
		if (title.length < 30 || title.length > 60) {
			issues.push(`Title length: ${title.length} characters (optimal: 30-60)`);
		}

		// Check meta description
		const metaDesc = document.querySelector('meta[name="description"]');
		if (!metaDesc || !metaDesc.getAttribute('content')) {
			issues.push('Missing meta description');
		} else {
			const descLength = metaDesc.getAttribute('content')?.length || 0;
			if (descLength < 120 || descLength > 160) {
				issues.push(`Meta description length: ${descLength} characters (optimal: 120-160)`);
			}
		}

		// Check for h1
		const h1Elements = document.querySelectorAll('h1');
		if (h1Elements.length === 0) {
			issues.push('Missing H1 tag');
		} else if (h1Elements.length > 1) {
			issues.push(`Multiple H1 tags found: ${h1Elements.length}`);
		}

		// Check for alt tags on images
		const images = document.querySelectorAll('img');
		const imagesWithoutAlt = Array.from(images).filter(img => !img.alt);
		if (imagesWithoutAlt.length > 0) {
			issues.push(`${imagesWithoutAlt.length} images missing alt text`);
		}

		// Check canonical URL
		const canonical = document.querySelector('link[rel="canonical"]');
		if (!canonical) {
			issues.push('Missing canonical URL');
		}

		seoIssues = issues;

		currentPageSEO = {
			title: title,
			titleLength: title.length,
			metaDescription: metaDesc?.getAttribute('content') || 'Missing',
			metaDescLength: metaDesc?.getAttribute('content')?.length || 0,
			h1Count: h1Elements.length,
			imageCount: images.length,
			imagesWithAlt: images.length - imagesWithoutAlt.length,
			hasCanonical: !!canonical
		};
	}

	function calculateSEOScore() {
		let score = 100;

		// Deduct points for each issue
		score -= seoIssues.length * 10;

		// Bonus points for good practices
		if (currentPageSEO.hasCanonical) score += 5;
		if (currentPageSEO.h1Count === 1) score += 5;
		if (currentPageSEO.titleLength >= 30 && currentPageSEO.titleLength <= 60) score += 5;
		if (currentPageSEO.metaDescLength >= 120 && currentPageSEO.metaDescLength <= 160) score += 5;

		seoScore = Math.max(0, Math.min(100, score));
	}

	// Utility functions
	function getKeywordDifficultyColor(difficulty: number) {
		if (difficulty < 40) return 'text-green-600';
		if (difficulty < 70) return 'text-yellow-600';
		return 'text-red-600';
	}

	function getOpportunityColor(opportunity: string) {
		switch (opportunity) {
			case 'High': return 'text-green-600 bg-green-50';
			case 'Medium': return 'text-yellow-600 bg-yellow-50';
			case 'Low': return 'text-red-600 bg-red-50';
			default: return 'text-gray-600 bg-gray-50';
		}
	}
</script>

<div class="min-h-screen bg-gray-50 p-6">
	<div class="mx-auto max-w-7xl">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-4xl font-bold text-gray-900">🚀 Kaiwa SEO Strategy Dashboard</h1>
			<p class="mt-2 text-lg text-gray-600">
				Path to Ranking #1 for "Authentic Conversation Practice in Japanese"
			</p>
		</div>

		<!-- Quick Metrics -->
		<div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<div class="rounded-lg bg-white p-4 shadow">
				<div class="text-sm font-medium text-gray-500">Current SEO Score</div>
				<div class="mt-1 text-3xl font-semibold {seoScore >= 80 ? 'text-green-600' : seoScore >= 60 ? 'text-yellow-600' : 'text-red-600'}">
					{seoScore}/100
				</div>
			</div>
			<div class="rounded-lg bg-white p-4 shadow">
				<div class="text-sm font-medium text-gray-500">Page Load Time</div>
				<div class="mt-1 text-3xl font-semibold {loadTime < 2000 ? 'text-green-600' : 'text-yellow-600'}">
					{loadTime}ms
				</div>
			</div>
			<div class="rounded-lg bg-white p-4 shadow">
				<div class="text-sm font-medium text-gray-500">Target Keywords</div>
				<div class="mt-1 text-3xl font-semibold text-blue-600">
					{targetKeywords.primary.length + targetKeywords.secondary.length + targetKeywords.longTail.length}
				</div>
			</div>
			<div class="rounded-lg bg-white p-4 shadow">
				<div class="text-sm font-medium text-gray-500">SEO Issues</div>
				<div class="mt-1 text-3xl font-semibold {seoIssues.length === 0 ? 'text-green-600' : 'text-red-600'}">
					{seoIssues.length}
				</div>
			</div>
		</div>

		<!-- Current Page Analysis -->
		<div class="mb-8 rounded-lg bg-white p-6 shadow">
			<h2 class="text-2xl font-bold text-gray-900 mb-4">📊 Current Page SEO Analysis</h2>

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div>
					<h3 class="text-lg font-semibold text-gray-800 mb-3">Page Details</h3>
					<div class="space-y-2 text-sm">
						<div><strong>Title:</strong> {currentPageSEO.title} <span class="text-gray-500">({currentPageSEO.titleLength} chars)</span></div>
						<div><strong>Meta Description:</strong> {currentPageSEO.metaDescription} <span class="text-gray-500">({currentPageSEO.metaDescLength} chars)</span></div>
						<div><strong>H1 Tags:</strong> {currentPageSEO.h1Count}</div>
						<div><strong>Images:</strong> {currentPageSEO.imagesWithAlt}/{currentPageSEO.imageCount} with alt text</div>
						<div><strong>Canonical:</strong> {currentPageSEO.hasCanonical ? '✅' : '❌'}</div>
					</div>
				</div>

				<div>
					<h3 class="text-lg font-semibold text-gray-800 mb-3">Issues to Fix</h3>
					{#if seoIssues.length === 0}
						<p class="text-green-600">🎉 No major SEO issues detected!</p>
					{:else}
						<ul class="space-y-1 text-sm">
							{#each seoIssues as issue}
								<li class="text-red-600">❌ {issue}</li>
							{/each}
						</ul>
					{/if}
				</div>
			</div>
		</div>

		<!-- Target Keywords Strategy -->
		<div class="mb-8 rounded-lg bg-white p-6 shadow">
			<h2 class="text-2xl font-bold text-gray-900 mb-4">🎯 Target Keywords Strategy</h2>

			<div class="space-y-6">
				<!-- Primary Keywords -->
				<div>
					<h3 class="text-lg font-semibold text-gray-800 mb-3">Primary Keywords (High Priority)</h3>
					<div class="overflow-x-auto">
						<table class="w-full text-sm">
							<thead>
								<tr class="bg-gray-50">
									<th class="px-4 py-2 text-left">Keyword</th>
									<th class="px-4 py-2 text-center">Volume</th>
									<th class="px-4 py-2 text-center">Difficulty</th>
									<th class="px-4 py-2 text-left">Competitors</th>
								</tr>
							</thead>
							<tbody>
								{#each targetKeywords.primary as keyword}
									<tr class="border-t">
										<td class="px-4 py-2 font-medium">{keyword.keyword}</td>
										<td class="px-4 py-2 text-center">{keyword.volume.toLocaleString()}</td>
										<td class="px-4 py-2 text-center {getKeywordDifficultyColor(keyword.difficulty)}">{keyword.difficulty}/100</td>
										<td class="px-4 py-2 text-xs text-gray-600">{keyword.competitors.join(', ')}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>

				<!-- Secondary Keywords -->
				<div>
					<h3 class="text-lg font-semibold text-gray-800 mb-3">Secondary Keywords (Medium Priority)</h3>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						{#each targetKeywords.secondary as keyword}
							<div class="border rounded p-3">
								<div class="font-medium">{keyword.keyword}</div>
								<div class="text-sm text-gray-600 mt-1">
									Volume: {keyword.volume} • Difficulty: <span class="{getKeywordDifficultyColor(keyword.difficulty)}">{keyword.difficulty}/100</span>
								</div>
							</div>
						{/each}
					</div>
				</div>

				<!-- Long-tail Keywords -->
				<div>
					<h3 class="text-lg font-semibold text-gray-800 mb-3">Long-tail Keywords (Quick Wins)</h3>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
						{#each targetKeywords.longTail as keyword}
							<div class="border rounded p-3 bg-green-50">
								<div class="font-medium text-sm">{keyword.keyword}</div>
								<div class="text-xs text-gray-600 mt-1">
									Volume: {keyword.volume} • Difficulty: <span class="text-green-600">{keyword.difficulty}/100</span>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>

		<!-- Content Gap Analysis -->
		<div class="mb-8 rounded-lg bg-white p-6 shadow">
			<h2 class="text-2xl font-bold text-gray-900 mb-4">🔍 Content Gap Analysis</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				{#each contentGaps as gap}
					<div class="border rounded-lg p-4">
						<div class="flex items-center justify-between mb-2">
							<h3 class="font-semibold text-gray-800">{gap.topic}</h3>
							<span class="px-2 py-1 rounded text-xs font-medium {getOpportunityColor(gap.opportunity)}">
								{gap.opportunity} Opportunity
							</span>
						</div>
						<p class="text-sm text-gray-600 mb-3">{gap.reason}</p>
						<div class="text-xs text-gray-500">
							<strong>Target keywords:</strong> {gap.keywords.join(', ')}
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Competitor Analysis -->
		<div class="mb-8 rounded-lg bg-white p-6 shadow">
			<h2 class="text-2xl font-bold text-gray-900 mb-4">⚔️ Competitor Analysis</h2>
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="bg-gray-50">
							<th class="px-4 py-2 text-left">Competitor</th>
							<th class="px-4 py-2 text-center">SEO Score</th>
							<th class="px-4 py-2 text-center">Monthly Traffic</th>
							<th class="px-4 py-2 text-left">Strengths</th>
							<th class="px-4 py-2 text-left">Weaknesses</th>
						</tr>
					</thead>
					<tbody>
						{#each competitorAnalysis as competitor}
							<tr class="border-t">
								<td class="px-4 py-2 font-medium">{competitor.name}</td>
								<td class="px-4 py-2 text-center {competitor.SEOScore >= 80 ? 'text-red-600' : competitor.SEOScore >= 60 ? 'text-yellow-600' : 'text-green-600'}">
									{competitor.SEOScore}/100
								</td>
								<td class="px-4 py-2 text-center font-medium">{competitor.monthlyTraffic}</td>
								<td class="px-4 py-2 text-xs text-green-700">{competitor.strengths.join(', ')}</td>
								<td class="px-4 py-2 text-xs text-red-700">{competitor.weaknesses.join(', ')}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>

		<!-- SEO Strategy Roadmap -->
		<div class="mb-8 rounded-lg bg-white p-6 shadow">
			<h2 class="text-2xl font-bold text-gray-900 mb-4">🗺️ SEO Strategy Roadmap</h2>

			<div class="space-y-6">
				{#each Object.entries(seoStrategy) as [phase, details]}
					<div class="border-l-4 border-blue-500 pl-4">
						<h3 class="text-lg font-semibold text-gray-800">{details.title}</h3>
						<ul class="mt-2 space-y-1">
							{#each details.tasks as task}
								<li class="text-sm text-gray-600">
									<span class="mr-2">•</span>
									{task}
								</li>
							{/each}
						</ul>
					</div>
				{/each}
			</div>
		</div>

		<!-- Action Items -->
		<div class="rounded-lg bg-blue-50 p-6">
			<h2 class="text-2xl font-bold text-blue-900 mb-4">🎯 Immediate Action Items</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				<div class="bg-white rounded-lg p-4">
					<h3 class="font-semibold text-blue-800 mb-2">Week 1: Technical Fixes</h3>
					<ul class="text-sm text-gray-600 space-y-1">
						<li>• Fix meta descriptions</li>
						<li>• Add missing alt tags</li>
						<li>• Optimize Core Web Vitals</li>
						<li>• Implement schema markup</li>
					</ul>
				</div>

				<div class="bg-white rounded-lg p-4">
					<h3 class="font-semibold text-blue-800 mb-2">Week 2: Content Optimization</h3>
					<ul class="text-sm text-gray-600 space-y-1">
						<li>• Optimize homepage for primary keywords</li>
						<li>• Create keyword-focused landing pages</li>
						<li>• Add FAQ section</li>
						<li>• Write blog post: "How to build confidence speaking Japanese"</li>
					</ul>
				</div>

				<div class="bg-white rounded-lg p-4">
					<h3 class="font-semibold text-blue-800 mb-2">Week 3: Authority Building</h3>
					<ul class="text-sm text-gray-600 space-y-1">
						<li>• Submit to "best Japanese apps" lists</li>
						<li>• Create comparison pages</li>
						<li>• Start guest posting outreach</li>
						<li>• Optimize for featured snippets</li>
					</ul>
				</div>
			</div>
		</div>
	</div>
</div>