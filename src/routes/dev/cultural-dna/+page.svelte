<!-- Dev Testing Page for Cultural DNA Feature -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { culturalDNAStore } from '$lib/features/cultural-dna/stores/cultural-dna.store.svelte';
	import { viralScenarios } from '$lib/features/cultural-dna/data/viral-scenarios';
	import { culturalDescriptors } from '$lib/features/cultural-dna/data/cultural-traits';
	import type { Language } from '$lib/server/db/types';

	// Mock language for testing
	const mockLanguage: Language = {
		id: 'ja',
		code: 'ja',
		name: 'Japanese',
		nativeName: '日本語',
		isRTL: false,
		flag: '🇯🇵',
		hasRomanization: true,
		writingSystem: 'logographic',
		supportedScripts: ['hiragana', 'katakana', 'kanji'],
		isSupported: true
	};

	// Component state
	let currentView = $state<'overview' | 'assessment' | 'results'>('overview');
	let mockResponse = $state('');

	// Reactive values from store
	const isAssessing = $derived(culturalDNAStore.isAssessing);
	const isAnalyzing = $derived(culturalDNAStore.isAnalyzing);
	const currentSession = $derived(culturalDNAStore.currentSession);
	const currentScenario = $derived(culturalDNAStore.getCurrentScenario());
	const progress = $derived(culturalDNAStore.getProgress());
	const dnaResults = $derived(culturalDNAStore.dnaResults);
	const error = $derived(culturalDNAStore.error);

	onMount(() => {
		console.log('🧬 Cultural DNA dev page mounted');
	});

	function startMockAssessment() {
		culturalDNAStore.startAssessment(mockLanguage);
		currentView = 'assessment';
	}

	function addMockResponse() {
		if (!mockResponse.trim()) return;

		culturalDNAStore.addScenarioResponse({
			audioTranscript: mockResponse,
			responseTime: Math.random() * 30 + 10, // 10-40 seconds
			culturalIndicators: {
				conflictStyle: 'direct',
				emotionalExpression: 'warm',
				decisionMaking: 'individual',
				formalityLevel: 'casual',
				communicationPace: 'fast'
			}
		});

		mockResponse = '';

		// Auto-advance to next scenario
		setTimeout(() => {
			const hasNext = culturalDNAStore.nextScenario();
			if (!hasNext) {
				currentView = 'results';
			}
		}, 1000);
	}

	function resetStore() {
		culturalDNAStore.reset();
		currentView = 'overview';
	}

	function generateMockDNA() {
		// Import and call the analysis service directly
		import('$lib/features/cultural-dna/services/dna-analysis.service').then(
			({ generateMockDNA }) => {
				culturalDNAStore.dnaResults = generateMockDNA();
				currentView = 'results';
			}
		);
	}
</script>

<svelte:head>
	<title>Cultural DNA Dev Testing - Kaiwa</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-base-100 to-base-200 p-4">
	<div class="container mx-auto max-w-4xl">
		<!-- Header -->
		<div class="mb-6 text-center">
			<h1 class="mb-2 text-3xl font-bold">🧬 Cultural DNA - Dev Testing</h1>
			<p class="text-base-content/70">Test the viral Cultural Conversation DNA feature</p>
			<div class="mt-4 flex justify-center gap-2">
				<div class="badge badge-primary">Feature: Cultural DNA</div>
				<div class="badge badge-secondary">Status: Development</div>
				<div class="badge badge-accent">Viral: Ready</div>
			</div>
		</div>

		<!-- Navigation -->
		<div class="mb-6 flex justify-center">
			<div class="tabs-boxed tabs">
				<button
					class="tab {currentView === 'overview' ? 'tab-active' : ''}"
					onclick={() => (currentView = 'overview')}
				>
					Overview
				</button>
				<button
					class="tab {currentView === 'assessment' ? 'tab-active' : ''}"
					onclick={() => (currentView = 'assessment')}
				>
					Assessment
				</button>
				<button
					class="tab {currentView === 'results' ? 'tab-active' : ''}"
					onclick={() => (currentView = 'results')}
				>
					Results
				</button>
			</div>
		</div>

		<!-- Error Display -->
		{#if error}
			<div class="mb-6 alert alert-error">
				<svg class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
					></path>
				</svg>
				<span>{error}</span>
				<button class="btn btn-sm" onclick={() => culturalDNAStore.clearError()}> Clear </button>
			</div>
		{/if}

		<!-- Content based on current view -->
		{#if currentView === 'overview'}
			<!-- Overview Section -->
			<div class="space-y-6">
				<!-- Feature Overview -->
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h2 class="card-title">🎯 Feature Overview</h2>
						<div class="space-y-4">
							<div>
								<h3 class="font-semibold">Viral Hook:</h3>
								<p class="text-sm">
									"Discover Your Cultural Conversation DNA" - Users take a 3-minute assessment and
									get a shareable personality result mixing cultural communication styles.
								</p>
							</div>
							<div>
								<h3 class="font-semibold">Experience Flow:</h3>
								<ol class="list-inside list-decimal space-y-1 text-sm">
									<li>User selects target language</li>
									<li>3 micro-scenarios (60 seconds each)</li>
									<li>AI analyzes conversation patterns</li>
									<li>Generate cultural personality mix (e.g., "60% German + 40% Japanese")</li>
									<li>Beautiful shareable results for social media</li>
								</ol>
							</div>
						</div>

						<div class="card-actions">
							<button class="btn btn-primary" onclick={startMockAssessment}>
								🧬 Start Assessment
							</button>
							<button class="btn btn-outline" onclick={generateMockDNA}>
								⚡ Generate Mock Results
							</button>
							<button class="btn btn-ghost" onclick={resetStore}> 🔄 Reset Store </button>
						</div>
					</div>
				</div>

				<!-- Viral Scenarios Preview -->
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h2 class="card-title">🎭 Viral Scenarios ({viralScenarios.length})</h2>
						<div class="space-y-3">
							{#each viralScenarios as scenario, i (i)}
								<div class="rounded-lg border border-base-200 p-3">
									<div class="mb-2 flex items-center gap-2">
										<span class="badge badge-sm badge-primary">{i + 1}</span>
										<h3 class="text-sm font-semibold">{scenario.title}</h3>
									</div>
									<p class="mb-2 text-xs text-base-content/70">{scenario.description}</p>
									<details class="text-xs">
										<summary class="cursor-pointer text-primary">View Scenario Details</summary>
										<div class="mt-2 space-y-1">
											<p><strong>Situation:</strong> {scenario.situation}</p>
											<p><strong>Context:</strong> {scenario.context}</p>
											<div>
												<strong>Analysis Weights:</strong>
												{#each Object.entries(scenario.analysisWeights) as [trait, weight] (trait)}
													<span class="mr-1 badge badge-ghost badge-xs">
														{trait}: {Math.round(weight * 100)}%
													</span>
												{/each}
											</div>
										</div>
									</details>
								</div>
							{/each}
						</div>
					</div>
				</div>

				<!-- Cultural Traits Preview -->
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h2 class="card-title">
							🌍 Cultural Traits ({Object.keys(culturalDescriptors).length})
						</h2>
						<div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
							{#each Object.entries(culturalDescriptors) as [_culture, descriptor] (_culture)}
								<div class="rounded-lg border border-base-200 p-3">
									<div class="mb-2 flex items-center gap-2">
										<span class="text-lg">{descriptor.flag}</span>
										<h3 class="text-sm font-semibold">{descriptor.name}</h3>
									</div>
									<p class="mb-2 text-xs text-base-content/70">{descriptor.communicationStyle}</p>
									<div class="flex flex-wrap gap-1">
										{#each descriptor.keywords.slice(0, 3) as keyword, i (i)}
											<span class="badge badge-ghost badge-xs">{keyword}</span>
										{/each}
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>
		{:else if currentView === 'assessment'}
			<!-- Assessment Section -->
			<div class="space-y-6">
				<!-- Progress -->
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<div class="mb-4 flex items-center justify-between">
							<h2 class="card-title">Assessment Progress</h2>
							<div class="badge badge-primary">{progress.current} / {progress.total}</div>
						</div>
						<progress class="progress w-full progress-primary" value={progress.percentage} max="100"
						></progress>
						<p class="mt-2 text-center text-sm">{progress.percentage}% Complete</p>
					</div>
				</div>

				{#if isAnalyzing}
					<!-- Analyzing State -->
					<div class="card bg-base-100 shadow-lg">
						<div class="card-body text-center">
							<div class="loading mb-4 loading-lg loading-spinner text-primary"></div>
							<h2 class="card-title justify-center">🧬 Analyzing Your Cultural DNA</h2>
							<p class="text-base-content/70">
								Processing your conversation patterns and cultural indicators...
							</p>
						</div>
					</div>
				{:else if currentScenario}
					<!-- Current Scenario -->
					<div class="card bg-base-100 shadow-lg">
						<div class="card-body">
							<div class="mb-4 flex items-center gap-2">
								<span class="badge badge-primary">Scenario {progress.current + 1}</span>
								<h2 class="card-title">{currentScenario.title}</h2>
							</div>

							<div class="space-y-4">
								<div>
									<h3 class="mb-2 font-semibold">Situation:</h3>
									<p class="rounded-lg bg-base-200 p-3 text-sm">{currentScenario.situation}</p>
								</div>

								<div>
									<h3 class="mb-2 font-semibold">Context:</h3>
									<p class="text-xs text-base-content/70">{currentScenario.context}</p>
								</div>

								<div>
									<h3 class="mb-2 font-semibold">Your Response (Mock Input):</h3>
									<textarea
										class="textarea-bordered textarea w-full"
										placeholder="Type your response to this scenario..."
										bind:value={mockResponse}
									></textarea>
								</div>

								<div class="card-actions">
									<button
										class="btn btn-primary"
										onclick={addMockResponse}
										disabled={!mockResponse.trim()}
									>
										Submit Response
									</button>
									<button class="btn btn-ghost" onclick={resetStore}> Cancel Assessment </button>
								</div>
							</div>
						</div>
					</div>
				{:else}
					<!-- No scenario available -->
					<div class="card bg-base-100 shadow-lg">
						<div class="card-body text-center">
							<h2 class="card-title justify-center">Assessment Complete!</h2>
							<p class="text-base-content/70">Moving to results analysis...</p>
						</div>
					</div>
				{/if}

				<!-- Session Debug Info -->
				{#if currentSession}
					<div class="card bg-base-200 shadow-lg">
						<div class="card-body">
							<h2 class="card-title text-sm">Debug: Session State</h2>
							<pre class="overflow-auto text-xs">{JSON.stringify(currentSession, null, 2)}</pre>
						</div>
					</div>
				{/if}
			</div>
		{:else if currentView === 'results'}
			<!-- Results Section -->
			<div class="space-y-6">
				{#if dnaResults}
					<!-- DNA Results Display -->
					<div class="card bg-gradient-to-r from-primary/5 to-secondary/5 shadow-lg">
						<div class="card-body">
							<div class="mb-6 text-center">
								<h1 class="mb-2 text-2xl font-bold">🧬 Your Cultural DNA</h1>
								<h2 class="text-xl font-semibold text-primary">{dnaResults.personalityType}</h2>
								<p class="text-lg text-base-content/70">
									{dnaResults.shareableData.culturalMixSummary}
								</p>
							</div>

							<!-- Cultural Mix Visualization -->
							<div class="mb-6">
								<h3 class="mb-3 font-semibold">Your Cultural Composition</h3>
								<div class="space-y-2">
									{#each dnaResults.culturalMix as mix (mix.culture)}
										<div class="flex items-center justify-between">
											<div class="flex items-center gap-2">
												<span class="font-medium">{mix.culture}</span>
												<span class="text-sm text-base-content/70">
													{mix.dominantTraits.slice(0, 2).join(', ')}
												</span>
											</div>
											<div class="flex items-center gap-2">
												<progress
													class="progress w-24 progress-primary"
													value={mix.percentage}
													max="100"
												></progress>
												<span class="text-sm font-medium">{mix.percentage}%</span>
											</div>
										</div>
									{/each}
								</div>
							</div>

							<!-- Traits Breakdown -->
							<div class="mb-6">
								<h3 class="mb-3 font-semibold">Conversation Traits</h3>
								<div class="grid grid-cols-2 gap-3 md:grid-cols-3">
									{#each Object.entries(dnaResults.traits) as [trait, value] (trait)}
										<div class="rounded-lg bg-base-100 p-2 text-center">
											<div class="text-xs text-base-content/60 capitalize">
												{trait.replace(/([A-Z])/g, ' $1')}
											</div>
											<div class="font-semibold capitalize">{value}</div>
										</div>
									{/each}
								</div>
							</div>

							<!-- Shareable Data Preview -->
							<div class="mb-6">
								<h3 class="mb-3 font-semibold">Shareable Content</h3>
								<div class="space-y-2 rounded-lg bg-base-100 p-4">
									<p><strong>Headline:</strong> {dnaResults.shareableData.headline}</p>
									<p><strong>Summary:</strong> {dnaResults.shareableData.oneLineSummary}</p>
									<div>
										<strong>Hashtags:</strong>
										{#each dnaResults.shareableData.hashtags as hashtag, i (i)}
											<span class="mr-1 badge badge-ghost badge-sm">#{hashtag}</span>
										{/each}
									</div>
								</div>
							</div>

							<div class="card-actions justify-center">
								<button class="btn btn-primary"> 📱 Share on Social </button>
								<button class="btn btn-outline"> 🔗 Copy Link </button>
								<button class="btn btn-ghost" onclick={resetStore}> 🔄 Try Again </button>
							</div>
						</div>
					</div>

					<!-- Results Debug -->
					<div class="card bg-base-200 shadow-lg">
						<div class="card-body">
							<h2 class="card-title text-sm">Debug: DNA Results</h2>
							<details>
								<summary class="cursor-pointer text-primary">View Raw Results</summary>
								<pre class="mt-2 overflow-auto text-xs">{JSON.stringify(dnaResults, null, 2)}</pre>
							</details>
						</div>
					</div>
				{:else}
					<!-- No Results -->
					<div class="card bg-base-100 shadow-lg">
						<div class="card-body text-center">
							<h2 class="card-title justify-center">No Results Yet</h2>
							<p class="mb-4 text-base-content/70">
								Complete an assessment or generate mock results to see the DNA analysis.
							</p>
							<div class="flex justify-center gap-3">
								<button class="btn btn-primary" onclick={startMockAssessment}>
									Start Assessment
								</button>
								<button class="btn btn-outline" onclick={generateMockDNA}>
									Generate Mock Results
								</button>
							</div>
						</div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Store State Debug (Always visible) -->
		<div class="card mt-8 bg-neutral text-neutral-content shadow-lg">
			<div class="card-body">
				<h2 class="card-title text-sm">Store State Debug</h2>
				<div class="grid grid-cols-2 gap-4 text-xs md:grid-cols-4">
					<div>
						<div class="opacity-70">Is Assessing:</div>
						<div class="font-bold">{isAssessing}</div>
					</div>
					<div>
						<div class="opacity-70">Is Analyzing:</div>
						<div class="font-bold">{isAnalyzing}</div>
					</div>
					<div>
						<div class="opacity-70">Has Session:</div>
						<div class="font-bold">{!!currentSession}</div>
					</div>
					<div>
						<div class="opacity-70">Has Results:</div>
						<div class="font-bold">{!!dnaResults}</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
