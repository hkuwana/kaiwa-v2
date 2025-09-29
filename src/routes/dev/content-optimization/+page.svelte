<script lang="ts">
	import { onMount } from 'svelte';

	interface ABTest {
		id: string;
		name: string;
		description: string;
		status: 'draft' | 'running' | 'completed' | 'paused';
		variants: {
			name: string;
			content: string;
			traffic: number;
			conversions: number;
			conversionRate: number;
		}[];
		startDate: string;
		endDate?: string;
		winner?: string;
	}

	interface ContentSuggestion {
		title: string;
		description: string;
		keywords: string[];
		wordCount: number;
		priority: 'High' | 'Medium' | 'Low';
		estimatedTraffic: number;
		contentType: 'blog' | 'landing' | 'social' | 'email';
		seoScore: number;
		readabilityScore: number;
	}

	let selectedTab = $state<
		'ab-testing' | 'content-suggestions' | 'headline-optimizer' | 'meta-optimizer'
	>('ab-testing');
	let abTests = $state<ABTest[]>([]);
	let contentSuggestions = $state<ContentSuggestion[]>([]);
	let newTestName = $state('');
	let newTestDescription = $state('');
	let isCreatingTest = $state(false);

	// Mock data
	const mockABTests: ABTest[] = [
		{
			id: '1',
			name: 'Homepage Headline Test',
			description: 'Testing different value propositions for homepage conversion',
			status: 'running',
			variants: [
				{
					name: 'Control',
					content: 'Practice Japanese conversations with AI',
					traffic: 1000,
					conversions: 45,
					conversionRate: 4.5
				},
				{
					name: 'Variant A',
					content: 'Speak to your Japanese family with confidence',
					traffic: 1000,
					conversions: 67,
					conversionRate: 6.7
				},
				{
					name: 'Variant B',
					content: 'Build confidence in Japanese conversations',
					traffic: 1000,
					conversions: 52,
					conversionRate: 5.2
				}
			],
			startDate: '2024-01-15',
			winner: 'Variant A'
		},
		{
			id: '2',
			name: 'CTA Button Test',
			description: 'Testing different call-to-action button text',
			status: 'completed',
			variants: [
				{
					name: 'Control',
					content: 'Start Learning',
					traffic: 2000,
					conversions: 120,
					conversionRate: 6.0
				},
				{
					name: 'Variant A',
					content: 'Try Free Now',
					traffic: 2000,
					conversions: 156,
					conversionRate: 7.8
				}
			],
			startDate: '2024-01-01',
			endDate: '2024-01-14',
			winner: 'Variant A'
		}
	];

	const mockContentSuggestions: ContentSuggestion[] = [
		{
			title: 'How to Overcome Japanese Speaking Anxiety: A Complete Guide',
			description:
				'Practical strategies and techniques to build confidence in Japanese conversations',
			keywords: ['Japanese speaking anxiety', 'overcome language anxiety', 'Japanese confidence'],
			wordCount: 2800,
			priority: 'High',
			estimatedTraffic: 1500,
			contentType: 'blog',
			seoScore: 85,
			readabilityScore: 78
		},
		{
			title: 'Speak to Your Japanese Grandmother: Family Conversation Practice',
			description: 'Learn the phrases and cultural context for meaningful family conversations',
			keywords: ['Japanese grandmother', 'family conversations', 'Japanese family practice'],
			wordCount: 2200,
			priority: 'High',
			estimatedTraffic: 800,
			contentType: 'landing',
			seoScore: 92,
			readabilityScore: 82
		},
		{
			title: 'AI vs Human Japanese Tutors: Which is Better for You?',
			description: 'Compare the benefits of AI conversation practice with human tutoring',
			keywords: ['AI Japanese tutor', 'human vs AI learning', 'Japanese conversation AI'],
			wordCount: 2000,
			priority: 'Medium',
			estimatedTraffic: 600,
			contentType: 'blog',
			seoScore: 78,
			readabilityScore: 75
		}
	];

	onMount(() => {
		abTests = mockABTests;
		contentSuggestions = mockContentSuggestions;
	});

	function createABTest() {
		if (!newTestName.trim() || !newTestDescription.trim()) return;

		isCreatingTest = true;
		// Simulate API call
		setTimeout(() => {
			const newTest: ABTest = {
				id: Date.now().toString(),
				name: newTestName,
				description: newTestDescription,
				status: 'draft',
				variants: [
					{
						name: 'Control',
						content: '',
						traffic: 0,
						conversions: 0,
						conversionRate: 0
					}
				],
				startDate: new Date().toISOString().split('T')[0]
			};

			abTests = [...abTests, newTest];
			newTestName = '';
			newTestDescription = '';
			isCreatingTest = false;
		}, 1000);
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'running':
				return 'text-green-600 bg-green-100';
			case 'completed':
				return 'text-blue-600 bg-blue-100';
			case 'paused':
				return 'text-yellow-600 bg-yellow-100';
			case 'draft':
				return 'text-gray-600 bg-gray-100';
			default:
				return 'text-gray-600 bg-gray-100';
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

	function getContentTypeColor(type: string) {
		switch (type) {
			case 'blog':
				return 'text-blue-600 bg-blue-100';
			case 'landing':
				return 'text-purple-600 bg-purple-100';
			case 'social':
				return 'text-pink-600 bg-pink-100';
			case 'email':
				return 'text-orange-600 bg-orange-100';
			default:
				return 'text-gray-600 bg-gray-100';
		}
	}

	function getScoreColor(score: number) {
		if (score >= 80) return 'text-green-600';
		if (score >= 60) return 'text-yellow-600';
		return 'text-red-600';
	}

	function calculateStatisticalSignificance(
		control: number,
		variant: number,
		controlVisitors: number,
		variantVisitors: number
	) {
		// Simplified statistical significance calculation
		const controlRate = control / controlVisitors;
		const variantRate = variant / variantVisitors;
		const improvement = ((variantRate - controlRate) / controlRate) * 100;

		// Basic confidence calculation (simplified)
		const totalVisitors = controlVisitors + variantVisitors;
		const confidence = totalVisitors > 1000 ? 'High' : totalVisitors > 500 ? 'Medium' : 'Low';

		return {
			improvement: Math.round(improvement * 100) / 100,
			confidence
		};
	}
</script>

<svelte:head>
	<title>Dev — Content Optimization</title>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<div class="min-h-screen bg-base-200">
	<div class="container mx-auto max-w-7xl px-4 py-10">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold">📝 Content Optimization & A/B Testing</h1>
			<p class="mt-2 text-base-content/70">
				Optimize content performance with A/B testing and data-driven suggestions
			</p>
		</div>

		<!-- Tab Selector -->
		<div class="mb-6">
			<div class="tabs-boxed tabs">
				<button
					class="tab {selectedTab === 'ab-testing' ? 'tab-active' : ''}"
					onclick={() => (selectedTab = 'ab-testing')}
				>
					🧪 A/B Testing
				</button>
				<button
					class="tab {selectedTab === 'content-suggestions' ? 'tab-active' : ''}"
					onclick={() => (selectedTab = 'content-suggestions')}
				>
					💡 Content Suggestions
				</button>
				<button
					class="tab {selectedTab === 'headline-optimizer' ? 'tab-active' : ''}"
					onclick={() => (selectedTab = 'headline-optimizer')}
				>
					📰 Headline Optimizer
				</button>
				<button
					class="tab {selectedTab === 'meta-optimizer' ? 'tab-active' : ''}"
					onclick={() => (selectedTab = 'meta-optimizer')}
				>
					🔍 Meta Optimizer
				</button>
			</div>
		</div>

		<!-- A/B Testing Tab -->
		{#if selectedTab === 'ab-testing'}
			<div class="space-y-6">
				<!-- Create New Test -->
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h2 class="card-title">Create New A/B Test</h2>
						<div class="grid gap-4 md:grid-cols-2">
							<div class="form-control">
								<label class="label" for="test-name">
									<span class="label-text">Test Name</span>
								</label>
								<input
									id="test-name"
									type="text"
									placeholder="e.g., Homepage Headline Test"
									class="input-bordered input"
									bind:value={newTestName}
								/>
							</div>
							<div class="form-control">
								<label class="label" for="test-description">
									<span class="label-text">Description</span>
								</label>
								<input
									id="test-description"
									type="text"
									placeholder="What are you testing?"
									class="input-bordered input"
									bind:value={newTestDescription}
								/>
							</div>
						</div>
						<div class="mt-4 card-actions justify-end">
							<button
								class="btn btn-primary"
								onclick={createABTest}
								disabled={isCreatingTest || !newTestName.trim() || !newTestDescription.trim()}
							>
								{isCreatingTest ? 'Creating...' : 'Create Test'}
							</button>
						</div>
					</div>
				</div>

				<!-- Active Tests -->
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h2 class="card-title">A/B Tests</h2>
						<div class="space-y-4">
							{#each abTests as test}
								<div class="card bg-base-200 shadow">
									<div class="card-body p-4">
										<div class="mb-4 flex items-start justify-between">
											<div>
												<h3 class="text-lg font-semibold">{test.name}</h3>
												<p class="text-sm text-base-content/70">{test.description}</p>
											</div>
											<div class="flex items-center gap-2">
												<span class="badge {getStatusColor(test.status)}">
													{test.status}
												</span>
												{#if test.winner}
													<span class="badge badge-success">Winner: {test.winner}</span>
												{/if}
											</div>
										</div>

										<!-- Variants Table -->
										<div class="overflow-x-auto">
											<table class="table w-full table-zebra">
												<thead>
													<tr>
														<th>Variant</th>
														<th>Content</th>
														<th>Traffic</th>
														<th>Conversions</th>
														<th>Conversion Rate</th>
														<th>Improvement</th>
													</tr>
												</thead>
												<tbody>
													{#each test.variants as variant, index}
														{@const control = test.variants[0]}
														{@const stats = calculateStatisticalSignificance(
															control.conversions,
															variant.conversions,
															control.traffic,
															variant.traffic
														)}
														<tr class={variant.name === test.winner ? 'bg-success/20' : ''}>
															<td class="font-semibold">
																{variant.name}
																{#if variant.name === test.winner}
																	<span class="ml-2 text-success">👑</span>
																{/if}
															</td>
															<td class="max-w-xs truncate">{variant.content}</td>
															<td>{variant.traffic.toLocaleString()}</td>
															<td>{variant.conversions}</td>
															<td>
																<span class={getScoreColor(variant.conversionRate * 100)}>
																	{variant.conversionRate}%
																</span>
															</td>
															<td>
																{#if index > 0}
																	<span
																		class={stats.improvement > 0
																			? 'text-green-600'
																			: 'text-red-600'}
																	>
																		{stats.improvement > 0 ? '+' : ''}{stats.improvement}%
																	</span>
																	<div class="text-xs text-base-content/60">
																		Confidence: {stats.confidence}
																	</div>
																{:else}
																	<span class="text-base-content/60">Control</span>
																{/if}
															</td>
														</tr>
													{/each}
												</tbody>
											</table>
										</div>

										<div
											class="mt-4 flex items-center justify-between text-sm text-base-content/60"
										>
											<span>Started: {new Date(test.startDate).toLocaleDateString()}</span>
											{#if test.endDate}
												<span>Ended: {new Date(test.endDate).toLocaleDateString()}</span>
											{/if}
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Content Suggestions Tab -->
		{#if selectedTab === 'content-suggestions'}
			<div class="space-y-6">
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h2 class="card-title">AI-Generated Content Suggestions</h2>
						<div class="space-y-4">
							{#each contentSuggestions as suggestion}
								<div class="card bg-base-200 shadow">
									<div class="card-body p-4">
										<div class="mb-3 flex items-start justify-between">
											<div class="flex-1">
												<h3 class="text-lg font-semibold">{suggestion.title}</h3>
												<p class="mt-1 text-sm text-base-content/70">{suggestion.description}</p>
											</div>
											<div class="flex gap-2">
												<span class="badge {getPriorityColor(suggestion.priority)}">
													{suggestion.priority}
												</span>
												<span class="badge {getContentTypeColor(suggestion.contentType)}">
													{suggestion.contentType}
												</span>
											</div>
										</div>

										<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
											<div>
												<span class="text-sm font-medium">Target Keywords:</span>
												<div class="mt-1 flex flex-wrap gap-1">
													{#each suggestion.keywords as keyword}
														<span class="badge badge-outline badge-sm">{keyword}</span>
													{/each}
												</div>
											</div>
											<div class="space-y-1">
												<div class="flex justify-between text-sm">
													<span>Word Count:</span>
													<span>{suggestion.wordCount}</span>
												</div>
												<div class="flex justify-between text-sm">
													<span>Est. Traffic:</span>
													<span>{suggestion.estimatedTraffic}</span>
												</div>
											</div>
											<div class="space-y-1">
												<div class="flex justify-between text-sm">
													<span>SEO Score:</span>
													<span class={getScoreColor(suggestion.seoScore)}>
														{suggestion.seoScore}/100
													</span>
												</div>
												<div class="flex justify-between text-sm">
													<span>Readability:</span>
													<span class={getScoreColor(suggestion.readabilityScore)}>
														{suggestion.readabilityScore}/100
													</span>
												</div>
											</div>
											<div class="flex items-center gap-2">
												<button class="btn btn-sm btn-primary">Create Content</button>
												<button class="btn btn-outline btn-sm">Save for Later</button>
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

		<!-- Headline Optimizer Tab -->
		{#if selectedTab === 'headline-optimizer'}
			<div class="space-y-6">
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h2 class="card-title">Headline Optimizer</h2>
						<div class="grid gap-6 md:grid-cols-2">
							<div>
								<h3 class="mb-4 font-semibold">Input Your Headline</h3>
								<div class="form-control">
									<textarea
										class="textarea-bordered textarea h-24"
										placeholder="Enter your headline here..."
									></textarea>
								</div>
								<button class="btn mt-4 btn-primary">Analyze Headline</button>
							</div>
							<div>
								<h3 class="mb-4 font-semibold">Headline Analysis</h3>
								<div class="space-y-3">
									<div class="flex items-center justify-between">
										<span class="text-sm">Length:</span>
										<span class="badge badge-warning">Too long (85 chars)</span>
									</div>
									<div class="flex items-center justify-between">
										<span class="text-sm">Emotional Impact:</span>
										<span class="badge badge-success">High</span>
									</div>
									<div class="flex items-center justify-between">
										<span class="text-sm">Power Words:</span>
										<span class="badge badge-info">3 found</span>
									</div>
									<div class="flex items-center justify-between">
										<span class="text-sm">SEO Score:</span>
										<span class="badge badge-success">85/100</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Headline Suggestions -->
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h2 class="card-title">Optimized Headline Suggestions</h2>
						<div class="space-y-3">
							<div class="card border border-success/20 bg-success/10">
								<div class="card-body p-3">
									<h4 class="font-semibold text-success">High Impact</h4>
									<p class="text-sm">
										"Speak Japanese with Confidence: Overcome Anxiety in 30 Days"
									</p>
									<div class="mt-2 flex gap-2 text-xs">
										<span class="badge badge-sm">65 chars</span>
										<span class="badge badge-sm">High emotional impact</span>
										<span class="badge badge-sm">SEO optimized</span>
									</div>
								</div>
							</div>
							<div class="card border border-warning/20 bg-warning/10">
								<div class="card-body p-3">
									<h4 class="font-semibold text-warning">Medium Impact</h4>
									<p class="text-sm">"Build Confidence in Japanese Conversations"</p>
									<div class="mt-2 flex gap-2 text-xs">
										<span class="badge badge-sm">45 chars</span>
										<span class="badge badge-sm">Medium emotional impact</span>
										<span class="badge badge-sm">Good for SEO</span>
									</div>
								</div>
							</div>
							<div class="card border border-info/20 bg-info/10">
								<div class="card-body p-3">
									<h4 class="font-semibold text-info">Question Format</h4>
									<p class="text-sm">
										"Tired of Japanese Speaking Anxiety? Here's How to Overcome It"
									</p>
									<div class="mt-2 flex gap-2 text-xs">
										<span class="badge badge-sm">68 chars</span>
										<span class="badge badge-sm">High engagement</span>
										<span class="badge badge-sm">Question hook</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Meta Optimizer Tab -->
		{#if selectedTab === 'meta-optimizer'}
			<div class="space-y-6">
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h2 class="card-title">Meta Description Optimizer</h2>
						<div class="grid gap-6 md:grid-cols-2">
							<div>
								<h3 class="mb-4 font-semibold">Current Meta Description</h3>
								<div class="form-control">
									<textarea
										class="textarea-bordered textarea h-24"
										placeholder="Enter your meta description here..."
									></textarea>
								</div>
								<div class="mt-2 text-sm text-base-content/60">
									<span class="text-red-600">85 characters (optimal: 120-160)</span>
								</div>
								<button class="btn mt-4 btn-primary">Optimize Meta</button>
							</div>
							<div>
								<h3 class="mb-4 font-semibold">Optimization Tips</h3>
								<div class="space-y-3">
									<div class="alert alert-info">
										<span class="text-sm">Include your target keyword naturally</span>
									</div>
									<div class="alert alert-warning">
										<span class="text-sm">Add a call-to-action to encourage clicks</span>
									</div>
									<div class="alert alert-success">
										<span class="text-sm">Keep it between 120-160 characters</span>
									</div>
									<div class="alert alert-info">
										<span class="text-sm">Make it compelling and descriptive</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Optimized Suggestions -->
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h2 class="card-title">Optimized Meta Descriptions</h2>
						<div class="space-y-3">
							<div class="card border border-success/20 bg-success/10">
								<div class="card-body p-3">
									<h4 class="font-semibold text-success">Option 1 (Recommended)</h4>
									<p class="text-sm">
										"Practice Japanese conversations with AI. Build confidence speaking to family
										members. Free, anxiety-free learning that actually works. Try now!"
									</p>
									<div class="mt-2 flex gap-2 text-xs">
										<span class="badge badge-sm badge-success">142 chars</span>
										<span class="badge badge-sm">Includes CTA</span>
										<span class="badge badge-sm">Target keywords</span>
									</div>
								</div>
							</div>
							<div class="card border border-warning/20 bg-warning/10">
								<div class="card-body p-3">
									<h4 class="font-semibold text-warning">Option 2</h4>
									<p class="text-sm">
										"Overcome Japanese speaking anxiety with AI conversation practice. Speak
										confidently to family and friends. Start free today!"
									</p>
									<div class="mt-2 flex gap-2 text-xs">
										<span class="badge badge-sm badge-warning">128 chars</span>
										<span class="badge badge-sm">Emotional appeal</span>
										<span class="badge badge-sm">Clear benefit</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
