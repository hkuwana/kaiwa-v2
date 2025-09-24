<!-- Dev Analysis Testing Route -->
<script lang="ts">
	import { languages } from '$lib/data/languages';
	import { cloneDefaultCategories } from '$lib/features/analysis/config/analysis-categories.config';
	import { runAnalysisOrchestrator } from '$lib/features/analysis/services/analysis-orchestrator.service';
	import type { Language, Message, UserPreferences } from '$lib/server/db/types';
	import { SvelteDate } from 'svelte/reactivity';

	
	type Finding = {
		id: string;
		category: string;
		modality: string;
		summary: string;
		details?: Record<string, unknown>;
		targetMessageId?: string;
		suggestedAction?: string;
		confidence?: number;
	};

	const ANALYSIS_CONVERSATION_ID = 'analysis-dev-conversation';

	function createMessage({
		id,
		role,
		content,
		messageIntent = null
	}: {
		id: string;
		role: Message['role'];
		content: string;
		messageIntent?: Message['messageIntent'];
	}): Message {
		return {
			id,
			conversationId: ANALYSIS_CONVERSATION_ID,
			role,
			content,
			timestamp: new SvelteDate(),
			sequenceId: null,
			translatedContent: null,
			sourceLanguage: null,
			targetLanguage: null,
			userNativeLanguage: null,
			romanization: null,
			hiragana: null,
			otherScripts: null,
			translationConfidence: null,
			translationProvider: null,
			translationNotes: null,
			isTranslated: false,
			grammarAnalysis: null,
			vocabularyAnalysis: null,
			pronunciationScore: null,
			audioUrl: null,
			audioDuration: null,
			speechTimings: null,
			difficultyLevel: null,
			learningTags: null,
			conversationContext: null,
			messageIntent
		};
	}

	const dummyMessages: Message[] = [
		createMessage({
			id: '1',
			role: 'user',
			content:
				'Hello, my name is Sarah. I want to learn Japanese because my boyfriend is Japanese and I want to talk to his family.',
			messageIntent: 'statement'
		}),
		createMessage({
			id: '2',
			role: 'assistant',
			content: "That's wonderful! How long have you been studying Japanese?",
			messageIntent: 'question'
		}),
		createMessage({
			id: '3',
			role: 'user',
			content:
				"Um, I started about six months ago but I'm still very nervous. I can read some hiragana but speaking is scary.",
			messageIntent: 'statement'
		}),
		createMessage({
			id: '4',
			role: 'assistant',
			content: "That's completely normal! What situations worry you most about speaking Japanese?",
			messageIntent: 'question'
		}),
		createMessage({
			id: '5',
			role: 'user',
			content:
				"Meeting his parents for the first time. I want to make a good impression and show respect, but I don't want to mess up basic greetings.",
			messageIntent: 'statement'
		})
	];

	const baselinePreferences: Partial<UserPreferences> = {
		successfulExchanges: 0,
		speakingLevel: 25,
		listeningLevel: 30,
		learningGoal: 'Connection',
		favoriteScenarioIds: []
	};

	const allCategories = cloneDefaultCategories();

	let isAnalyzing = $state(false);
	let analysisError = $state<string | null>(null);
	let selectedLanguage = $state<Language>(languages.find((l) => l.code === 'ja') || languages[0]);
	let analysisMode = $state<'quick' | 'full'>('full');
	let selectedCategoryIds = $state<string[]>(
		allCategories.filter((category) => category.defaultEnabled !== false).map((category) => category.id)
	);
	let analysisSteps = $state<string[]>([]);
	let analysisSnapshot = $state<any>(null);
	let categoryStatusMap = $state<Record<string, ReturnType<typeof buildCategoryStatus>>>({});
	let runCounter = $state(0);

	function buildCategoryStatus(category: (typeof allCategories)[number]) {
		return {
			id: category.id,
			label: category.label,
			modality: category.modality,
			state: 'pending' as 'pending' | 'running' | 'complete',
			durationMs: 0,
			findingsCount: 0,
			summary: ''
		};
	}

	function buildEmptySnapshot() {
		return {
			meta: null,
			categories: [] as string[],
			findings: [] as Array<Record<string, unknown>>,
			logs: [] as string[]
		};
	}

	function toggleCategory(id: string) {
		if (isAnalyzing) return;
		if (selectedCategoryIds.includes(id)) {
			selectedCategoryIds = selectedCategoryIds.filter((existing) => existing !== id);
		} else {
			selectedCategoryIds = [...selectedCategoryIds, id];
		}
	}

	async function runAnalysis() {
		const categoriesToRun = allCategories.filter((category) => selectedCategoryIds.includes(category.id));
		if (categoriesToRun.length === 0) {
			analysisError = 'Select at least one category to run analysis.';
			return;
		}

		isAnalyzing = true;
		analysisError = null;
		analysisSteps = [];
		analysisSnapshot = buildEmptySnapshot();
		categoryStatusMap = Object.fromEntries(categoriesToRun.map((category) => [category.id, buildCategoryStatus(category)]));
		runCounter += 1;

		const sessionId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
			? crypto.randomUUID()
			: `dev-session-${runCounter}`;

		analysisSteps = [...analysisSteps, `🚀 Run #${runCounter} starting (${analysisMode} mode)`];
		analysisSteps = [...analysisSteps, `📋 Session ID: ${sessionId}`];
		analysisSteps = [
			...analysisSteps,
			`🗣️ User messages: ${dummyMessages.filter((message) => message.role === 'user').length}`
		];
		analysisSteps = [...analysisSteps, `🌍 Target language: ${selectedLanguage.name}`];
		analysisSteps = [...analysisSteps, `🧩 Categories: ${categoriesToRun.map((category) => category.label).join(', ')}`];

		try {
			const result = await runAnalysisOrchestrator(
				{
					categories: categoriesToRun,
					messages: dummyMessages,
					language: selectedLanguage,
					mode: analysisMode,
					preferences: baselinePreferences,
					sessionId,
					context: { source: 'dev-analysis-route' }
				},
				{
					onCategoryStart: ({ id, label }) => {
						analysisSteps = [...analysisSteps, `⏳ ${label} starting...`];
						categoryStatusMap = {
							...categoryStatusMap,
							[id]: {
								...categoryStatusMap[id],
								state: 'running'
							}
						};
					},
					onCategoryComplete: ({ config, findings, durationMs, summary }) => {
						analysisSteps = [...analysisSteps, `✅ ${config.label} completed (${durationMs.toFixed(1)}ms)`];
						categoryStatusMap = {
							...categoryStatusMap,
							[config.id]: {
								...categoryStatusMap[config.id],
								state: 'complete',
								durationMs,
								findingsCount: findings.length,
								summary: summary ?? ''
							}
						};
					}
				}
			);

			analysisSnapshot = result.snapshot;

			analysisSteps = [...analysisSteps, '🏁 Analysis run complete'];
		} catch (error) {
			analysisError = error instanceof Error ? error.message : 'Unknown error';
			analysisSteps = [...analysisSteps, `💥 Exception: ${analysisError}`];
		} finally {
			isAnalyzing = false;
		}
	}

	const categoryList = $derived(Object.values(categoryStatusMap));

	const activeFindings = $derived(analysisSnapshot?.findings ?? []);
</script>

<svelte:head>
	<title>Dev: Analysis Testing - Kaiwa</title>
</svelte:head>

<div class="min-h-screen bg-base-200 p-4">
	<div class="container mx-auto max-w-6xl">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-base-content">🧪 Analysis Pipeline Testing</h1>
				<p class="mt-2 text-base-content/70">
					Exercise the modular analysis pipeline with sample conversation data
				</p>
		</div>

		<div class="grid gap-6 lg:grid-cols-2">
			<!-- Left Column: Inputs & Controls -->
			<div class="space-y-6">
				<!-- Language Selection -->
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body space-y-4">
						<h2 class="card-title text-lg">🌍 Language Selection</h2>
						<select
							class="select-bordered select w-full"
							bind:value={selectedLanguage}
							disabled={isAnalyzing}
						>
							{#each languages.filter((lang) => lang.isSupported) as lang}
								<option value={lang}>{lang.name} ({lang.code})</option>
							{/each}
						</select>

						<div class="flex items-center justify-between">
							<span class="text-sm font-medium">Mode</span>
							<div class="join">
								<button
									class={`btn btn-sm join-item ${analysisMode === 'quick' ? 'btn-primary' : 'btn-ghost'}`}
									onclick={() => (analysisMode = 'quick')}
									disabled={isAnalyzing}
								>
									Quick
								</button>
								<button
									class={`btn btn-sm join-item ${analysisMode === 'full' ? 'btn-primary' : 'btn-ghost'}`}
									onclick={() => (analysisMode = 'full')}
									disabled={isAnalyzing}
								>
									Full
								</button>
							</div>
						</div>
					</div>
				</div>

				<!-- Category Selection -->
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h2 class="card-title text-lg">🧩 Categories</h2>
						<p class="text-sm opacity-70">Toggle the analysis modules you want to exercise.</p>
						<div class="mt-4 space-y-3">
							{#each allCategories as category}
								<label class="flex cursor-pointer items-start gap-3 rounded-lg border border-base-200 p-3 hover:border-primary/50">
									<input
										type="checkbox"
										class="checkbox"
										checked={selectedCategoryIds.includes(category.id)}
										onchange={() => toggleCategory(category.id)}
										disabled={isAnalyzing && !selectedCategoryIds.includes(category.id)}
									/>
									<div>
										<p class="font-medium">{category.label}</p>
										<p class="text-xs opacity-60">{category.description}</p>
									</div>
								</label>
							{/each}
						</div>
					</div>
				</div>

				<!-- Dummy Messages -->
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h2 class="card-title text-lg">💬 Test Conversation</h2>
						<div class="max-h-80 space-y-3 overflow-y-auto">
							{#each dummyMessages as message}
								<div
									class={`rounded-lg p-3 ${message.role === 'user' ? 'ml-4 bg-primary/10' : 'mr-4 bg-base-200'}`}
								>
									<div class="mb-1 text-xs font-medium opacity-70">
										{message.role === 'user' ? '👤 User' : '🤖 Assistant'}
									</div>
									<div class="text-sm">{message.content}</div>
								</div>
							{/each}
						</div>
					</div>
				</div>

				<!-- Controls -->
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body space-y-4">
						<h2 class="card-title text-lg">🎮 Controls</h2>
						<div class="text-sm opacity-70">
							Selected categories: {selectedCategoryIds.length} / {allCategories.length}
						</div>
						<button class="btn w-full btn-primary" onclick={runAnalysis} disabled={isAnalyzing}>
							{#if isAnalyzing}
								<span class="loading loading-sm loading-spinner"></span>
								Analyzing...
							{:else}
								🔄 Run Analysis
							{/if}
						</button>
					</div>
				</div>
			</div>

			<!-- Right Column: Results & Diagnostics -->
			<div class="space-y-6">
				<!-- Analysis Steps -->
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h2 class="card-title text-lg">📋 Analysis Pipeline</h2>
						<div class="max-h-64 space-y-2 overflow-y-auto">
							{#each analysisSteps as step}
								<div class="rounded bg-base-200 p-2 font-mono text-sm">
									{step}
								</div>
							{/each}

							{#if isAnalyzing}
								<div
									class="flex items-center gap-2 rounded bg-info/10 p-2 font-mono text-sm text-info"
								>
									<span class="loading loading-xs loading-spinner"></span>
									Processing...
								</div>
							{/if}
						</div>
					</div>
				</div>

				<!-- Category Status -->
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h2 class="card-title text-lg">🧭 Category Status</h2>
						{#if categoryList.length === 0}
							<p class="text-sm opacity-70">Run an analysis to populate status.</p>
						{:else}
							<ul class="space-y-3">
								{#each categoryList as category}
									<li class="rounded-lg border border-base-200 p-3">
										<div class="flex items-center justify-between text-sm">
											<span class="font-medium">{category.label}</span>
											<span class={`badge badge-sm ${category.state === 'complete' ? 'badge-success' : category.state === 'running' ? 'badge-warning' : 'badge-ghost'}`}>
												{category.state}
											</span>
										</div>
										<div class="mt-2 text-xs opacity-70">
											{category.summary || 'Awaiting summary'}
										</div>
										<div class="mt-1 flex items-center justify-between text-xs">
											<span>Findings: {category.findingsCount}</span>
											<span>{category.durationMs ? `${category.durationMs.toFixed(1)}ms` : '—'}</span>
										</div>
									</li>
								{/each}
							</ul>
						{/if}
					</div>
				</div>

				<!-- Findings -->
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h2 class="card-title text-lg">🔎 Findings</h2>
						{#if activeFindings.length === 0}
							<p class="text-sm opacity-70">No findings yet. Run the analysis or wait for completion.</p>
						{:else}
							<div class="space-y-3">
								{#each activeFindings as finding, index}
									<div class="rounded-lg border border-base-200 p-3">
										<div class="flex items-center justify-between text-xs">
											<span class="font-semibold">{finding.category}</span>
											<span class="badge badge-outline">{finding.modality}</span>
										</div>
										<p class="mt-2 text-sm">{finding.summary}</p>
										{#if finding.details}
											<details class="mt-2">
												<summary class="cursor-pointer text-xs font-medium text-primary">Details</summary>
												<pre class="mt-1 max-h-48 overflow-y-auto rounded bg-base-200 p-2 text-[11px]">
													{JSON.stringify(finding.details, null, 2)}
												</pre>
											</details>
										{/if}
										<div class="mt-2 flex flex-wrap gap-2 text-[11px] opacity-70">
											{#if finding.targetMessageId}
												<span>Message: {finding.targetMessageId}</span>
											{/if}
											{#if finding.suggestedAction}
												<span>Action: {finding.suggestedAction}</span>
											{/if}
											{#if typeof finding.confidence === 'number'}
												<span>Confidence: {(finding.confidence * 100).toFixed(0)}%</span>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>

				<!-- Snapshot & Raw Output -->
				{#if analysisSnapshot}
					<div class="card bg-base-100 shadow-lg">
						<div class="card-body space-y-4">
							<h2 class="card-title text-lg">🗂️ Snapshot</h2>
							{#if analysisSnapshot.meta}
								<div class="grid gap-2 text-xs opacity-70 sm:grid-cols-2">
									<span>Mode: {analysisSnapshot.meta.mode}</span>
									<span>Language: {analysisSnapshot.meta.languageCode}</span>
									<span>Session: {analysisSnapshot.meta.sessionId}</span>
									<span>Run ID: {analysisSnapshot.meta.analysisRunId}</span>
								</div>
							{/if}
							<details>
								<summary class="cursor-pointer text-sm font-medium text-primary">View JSON Snapshot</summary>
								<pre class="mt-2 max-h-60 overflow-y-auto rounded bg-base-200 p-3 text-[11px]">
									{JSON.stringify(analysisSnapshot, null, 2)}
								</pre>
							</details>
						</div>
					</div>
				{/if}

				<!-- Error Display -->
				{#if analysisError}
					<div class="alert alert-error">
						<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
						</svg>
						<div>
							<h3 class="font-medium">Analysis Error</h3>
							<div class="text-sm">{analysisError}</div>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Back to Dev -->
		<div class="mt-8 text-center">
			<a href="/dev" class="btn btn-outline">← Back to Dev Tools</a>
		</div>
	</div>
</div>

<style>
	/* Custom scrollbar for better UX */
	.overflow-y-auto::-webkit-scrollbar {
		width: 6px;
	}
	.overflow-y-auto::-webkit-scrollbar-track {
		background: hsl(var(--b2));
	}
	.overflow-y-auto::-webkit-scrollbar-thumb {
		background: hsl(var(--bc) / 0.3);
		border-radius: 3px;
	}
</style>
