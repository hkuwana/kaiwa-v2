<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';

	import QuickAnalysisModal from '$lib/features/analysis/components/QuickAnalysisModal.svelte';
	import MessageBubble from '$lib/features/conversation/components/MessageBubble.svelte';
	import ExitSurvey from '$lib/components/ExitSurvey.svelte';
	import { settingsStore } from '$lib/stores/settings.store.svelte';
	import { conversationStore } from '$lib/stores/conversation.store.svelte';
	import { determineAnalysisType, type AnalysisType } from '$lib/services/analysis.service';
	import { userPreferencesStore } from '$lib/stores/user-preferences.store.svelte';
	import { analysisSuggestionService } from '$lib/features/analysis/services/analysis-suggestion.service';
	import { SvelteSet } from 'svelte/reactivity';
	import StageIndicator from '$lib/components/StageIndicator.svelte';

	const { data } = $props();

	// Get selected language from settings
	const selectedLanguage = $derived(settingsStore.selectedLanguage);

	// Get messages - prioritize server data if available, otherwise use conversation store
	const messages = $derived(
		data.hasExistingData && data.messages.length > 0
			? data.messages
			: conversationStore.analysisMessages.length > 0
				? conversationStore.analysisMessages
				: conversationStore.messages
	);

	// Get analysis results state
	const hasAnalysisResults = $derived(userPreferencesStore.hasCurrentAnalysisResults);

	// Analysis state
	let analysisMode = $state<'quick' | 'full'>('quick');
	let analysisType = $state<AnalysisType>('regular');
	let sessionNotFound = $state(false);
	let showExitSurvey = $state(false);
	let showQuickAnalysisModal = $state(false);

	// Analysis pipeline state
	let analysisStore = $state<any>(null);
	let modules = $state<any[]>([]);
	let selectedModuleIds = $state<Set<string>>(new SvelteSet());
	let isLoading = $state(false);
	let lastRun: any = $state(null);
	let errorMessage = $state<string | null>(null);
	let showRawAnalysis = $state(false);
	let showFindingsJson = $state(false);
	let usageInfo = $state<any>(null);
	let showUsageDetails = $state(false);

	// URL parameters
	const urlParams = $derived({
		mode: page.url.searchParams.get('mode') as 'quick' | 'full' | null,
		type: page.url.searchParams.get('type') as AnalysisType | null,
		messageCount: page.url.searchParams.get('messageCount')
	});

	// Handle cases where we need to load conversation data
	onMount(async () => {
		// If no language selected, redirect to home
		if (!selectedLanguage) {
			goto(resolve('/'));
			return;
		}

		// Set analysis mode and type from URL params or defaults
		analysisMode = urlParams.mode || 'quick';
		analysisType = urlParams.type || determineAnalysisType(userPreferencesStore);

		// Check if we should show exit survey (early exit with < 5 messages)
		const messageCount = urlParams.messageCount
			? parseInt(urlParams.messageCount)
			: messages.length;
		if (messageCount > 0 && messageCount < 5 && !data.hasExistingData) {
			showExitSurvey = true;
		}

		// Handle test scenarios for development
		if (data.sessionId?.startsWith('test-')) {
			console.log('🧪 Detected test session, using mock data');
			return; // Skip normal flow for test sessions
		}

		// Load analysis modules
		await loadModules();

		// If we have existing data from server (prioritized) or messages from conversationStore
		if (messages.length > 0 && selectedLanguage) {
			const dataSource = data.hasExistingData ? 'server data' : 'conversation store';
			console.log(`Using ${dataSource} for analysis:`, messages.length, 'messages');

			// Show quick analysis modal for all conversations
			if (analysisMode === 'quick') {
				showQuickAnalysisModal = true;
			} else if (data.hasExistingData) {
				console.log('📄 Displaying historical conversation - skipping new analysis generation');
			}
		} else if (data.sessionId && !data.isGuest && data.conversationSession) {
			// For authenticated users with a valid session, we could load messages from the session
			// This would require implementing message retrieval from the session
			console.log('Could load conversation messages from session:', data.conversationSession);
		} else if (data.sessionId && !data.isGuest && !data.conversationSession) {
			// Session not found in DB but we're authenticated - try using store data
			console.log('Session not found in database, checking if we have recent analysis data');
			// Check if we have recent analysis results from user preferences
			if (hasAnalysisResults) {
				console.log('Found recent analysis results, proceeding with display');
			} else {
				console.warn('No session in DB and no store data - showing session not found message');
				sessionNotFound = true;
				return;
			}
		} else if (messages.length === 0 && !hasAnalysisResults) {
			// No messages available and no analysis results - show session not found message
			console.warn('No conversation data available for analysis');
			sessionNotFound = true;
			return;
		}

		console.log('Analysis page loaded:', {
			sessionId: data.sessionId,
			conversationStoreSessionId: conversationStore.currentSessionId,
			mode: analysisMode,
			type: analysisType,
			messagesCount: messages.length,
			hasConversationSession: !!data.conversationSession,
			hasAnalysisResults,
			isGuest: data.isGuest,
			note: data.note
		});
	});

	function handleStartNewConversation() {
		// Clear current conversation and start new one
		conversationStore.destroyConversation();
		// Generate new sessionId for the new conversation
		const newSessionId = crypto.randomUUID();
		// Always go to home page first, then to conversation
		goto(`/?newSession=true&sessionId=${newSessionId}`);
	}

	function handleExitSurveyClose() {
		showExitSurvey = false;
	}

	function handleCloseQuickAnalysisModal() {
		showQuickAnalysisModal = false;
	}

	async function loadModules() {
		try {
			const response = await fetch('/api/analysis/modules');
			if (!response.ok) throw new Error('Failed to load modules');

			const data = await response.json();
			modules = data.modules;

			// Auto-select text-based modules including grammar analysis
			selectedModuleIds = new SvelteSet(
				modules.filter((module: any) => module.modality === 'text').map((module) => module.id)
			);
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Failed to load modules';
		}
	}

	async function runAnalysis() {
		if (!selectedLanguage) return;

		isLoading = true;
		errorMessage = null;
		lastRun = null;
		usageInfo = null;

		try {
			// Lazy load analysis store only when needed
			if (!analysisStore) {
				const { analysisStore: store } = await import(
					'$lib/features/analysis/stores/analysis.store.svelte'
				);
				analysisStore = store;
			}

			const response: Response = await fetch('/api/analysis/run', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					conversationId: data.sessionId || 'analysis-session',
					languageCode: selectedLanguage.code,
					moduleIds: Array.from(selectedModuleIds),
					messages: messages.map((m) => ({
						id: m.id,
						role: m.role,
						content: m.content,
						timestamp: m.timestamp
					}))
				})
			});

			const analysisData: any = await response.json();

			if (!response.ok || !analysisData.success) {
				throw new Error(analysisData?.error || 'Analysis failed');
			}

			lastRun = analysisData.run;
			const extractedSuggestions =
				analysisData.suggestions ??
				analysisSuggestionService.extract(lastRun, {
					runId: lastRun.runId,
					messages: messages.map((m) => ({
						id: m.id,
						role: m.role,
						content: m.content,
						timestamp: m.timestamp
					}))
				});

			const normalizedMessages = messages.map((message) => ({
				id: message.id,
				role: message.role,
				content: message.content,
				timestamp: message.timestamp
			}));

			// Update the analysis store with the complete analysis results
			analysisStore.setAnalysisResults(lastRun, extractedSuggestions, normalizedMessages);

			// Fetch updated usage info after running analysis
			try {
				const usageResponse = await fetch('/api/dev/usage-debug?action=current');
				if (usageResponse.ok) {
					const usageData = await usageResponse.json();
					usageInfo = usageData;
				}
			} catch (usageError) {
				console.warn('Could not fetch usage info:', usageError);
			}
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Analysis failed';
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Conversation Analysis - Kaiwa</title>
	<meta name="description" content="Review and analyze your conversation practice session" />
</svelte:head>

{#if sessionNotFound}
	<div class="min-h-screen bg-gradient-to-br from-base-100 to-base-200 py-10">
		<div class="mx-auto max-w-5xl px-4">
			<!-- Stage Indicator -->
			<div class="mb-8 flex justify-center">
				<StageIndicator currentStage="review" />
			</div>

			<div class="flex min-h-[60vh] items-center justify-center">
				<div class="mx-auto max-w-md p-8 text-center">
					<div class="mb-6">
						<span class="mx-auto mb-4 icon-[mdi--file-question-outline] h-16 w-16 text-warning"
						></span>
						<h1 class="mb-2 text-2xl font-bold">Conversation Not Found</h1>
						<p class="mb-6 text-base-content/70">
							This conversation session doesn't exist or has been removed. You can start a new
							conversation to practice your language skills.
						</p>
					</div>
					<div class="flex flex-col justify-center gap-3 sm:flex-row">
						<button class="btn btn-primary" onclick={handleStartNewConversation}>
							<span class="mr-2 icon-[mdi--plus] h-5 w-5"></span>
							Start New Conversation
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{:else if selectedLanguage}
	<div class="min-h-screen bg-base-200 py-10">
		<div class="mx-auto max-w-5xl space-y-8 px-4">
			<!-- Stage Indicator -->
			<div class="flex justify-center">
				<StageIndicator currentStage="review" />
			</div>

			<header class="rounded-lg bg-base-100 p-6 shadow">
				<div class="flex items-center justify-between">
					<div>
						<h1 class="text-2xl font-semibold">Conversation Analysis</h1>
						<p class="mt-2 text-base-content">
							Review your {selectedLanguage.name} conversation and get detailed insights.
						</p>
					</div>
					<div class="flex flex-wrap gap-2">
						<button class="btn btn-primary" onclick={() => (showQuickAnalysisModal = true)}>
							<span class="mr-2 icon-[mdi--chart-bar] h-4 w-4"></span>
							Quick Insights
						</button>
						<button
							class="btn btn-outline"
							onclick={runAnalysis}
							disabled={isLoading || selectedModuleIds.size === 0}
						>
							{#if isLoading}
								<span class="loading mr-2 loading-sm loading-spinner"></span>
								Running Analysis...
							{:else}
								<span class="mr-2 icon-[mdi--chart-line] h-4 w-4"></span>
								Detailed Analysis
							{/if}
						</button>
						<button class="btn btn-ghost" onclick={handleStartNewConversation}>
							<span class="mr-2 icon-[mdi--plus] h-4 w-4"></span>
							Start New Conversation
						</button>
					</div>
				</div>
			</header>

			<section class="rounded-lg bg-base-100 p-6 shadow">
				<h2 class="mb-4 text-xl font-semibold">Your Conversation</h2>
				<div class="space-y-4">
					{#each messages as message (message.id)}
						<div class="space-y-2">
							<!-- Original message -->
							<MessageBubble
								message={{
									...message,
									conversationId: data.sessionId || 'analysis-session',
									sequenceId: null,
									translatedContent: null,
									sourceLanguage: null,
									targetLanguage: null,
									romanization: null,
									hiragana: null,
									otherScripts: null,
									audioUrl: null,
									isStreaming: null,
									hasCompleted: null,
									finishReason: null,
									toolCalls: null,
									toolCallResults: null,
									tokens: null,
									promptTokens: null,
									completionTokens: null,
									messageIntent: null
								} as any}
								clickToToggle={false}
							/>
						</div>
					{/each}
				</div>
			</section>

			<!-- Analysis Results -->
			{#if errorMessage}
				<section class="rounded-lg bg-error/10 p-6 shadow">
					<div class="flex items-center gap-2 text-error">
						<span class="icon-[mdi--close-circle] h-5 w-5"></span>
						<h3 class="font-semibold">Analysis Error</h3>
					</div>
					<p class="mt-2 text-error">{errorMessage}</p>
				</section>
			{/if}

			{#if lastRun}
				<section class="rounded-lg bg-base-100 p-6 shadow">
					<div class="mb-4 flex items-center justify-between">
						<h2 class="text-xl font-semibold">Analysis Results</h2>
						<div class="flex gap-2">
							<label class="flex cursor-pointer items-center gap-2">
								<input type="checkbox" class="toggle toggle-sm" bind:checked={showRawAnalysis} />
								<span class="text-sm">Show Raw JSON</span>
							</label>
							<label class="flex cursor-pointer items-center gap-2">
								<input type="checkbox" class="toggle toggle-sm" bind:checked={showFindingsJson} />
								<span class="text-sm">Show Findings JSON</span>
							</label>
						</div>
					</div>

					<!-- Analysis Complete Status -->
					<div class="mb-6 rounded-lg border border-success/20 bg-success p-4">
						<div class="mb-2 flex items-center gap-2">
							<span class="icon-[mdi--arrow-right-circle] h-5 w-5 text-success"></span>
							<h3 class="font-semibold text-success-content">Analysis Complete</h3>
						</div>
						<div class="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
							<div>
								<span class="text-success-content">Conversation ID:</span>
								<span class="font-mono text-success-content">{lastRun.conversationId}</span>
							</div>
							<div>
								<span class="text-success-content">Modules Run:</span>
								<span class="font-medium text-success-content"
									>{lastRun.moduleResults?.length || 0}</span
								>
							</div>
							<div>
								<span class="text-success-content">Messages Analyzed:</span>
								<span class="font-medium text-success-content">{messages.length}</span>
							</div>
						</div>
					</div>

					<!-- Usage Impact -->
					{#if usageInfo}
						<div class="mb-6 rounded-lg border border-info/20 bg-info p-4">
							<div class="mb-3 flex items-center justify-between">
								<div class="flex items-center gap-2">
									<span class="icon-[mdi--database-outline] h-5 w-5 text-info"></span>
									<h3 class="font-semibold text-info-content">Usage Impact</h3>
								</div>
								<label class="flex cursor-pointer items-center gap-2">
									<input type="checkbox" class="toggle toggle-sm" bind:checked={showUsageDetails} />
									<span class="text-xs text-info-content">Details</span>
								</label>
							</div>

							<div class="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
								<div class="rounded border border-info/10 bg-info/5 p-3 text-center">
									<div class="text-lg font-bold text-info-content">
										{usageInfo.current?.analysesUsed || 0}
									</div>
									<div class="text-xs text-info-content/80">Total Analyses</div>
								</div>
								<div class="rounded border border-info/10 bg-info/5 p-3 text-center">
									<div class="text-lg font-bold text-info-content">
										{usageInfo.current?.basicAnalysesUsed || 0}
									</div>
									<div class="text-xs text-info-content/80">Basic Analyses</div>
								</div>
								<div class="rounded border border-info/10 bg-info/5 p-3 text-center">
									<div class="text-lg font-bold text-info-content">
										{usageInfo.current?.advancedGrammarUsed || 0}
									</div>
									<div class="text-xs text-info-content/80">Advanced Grammar</div>
								</div>
								<div class="rounded border border-info/10 bg-info/5 p-3 text-center">
									<div class="text-lg font-bold text-info-content">
										{usageInfo.current?.fluencyAnalysisUsed || 0}
									</div>
									<div class="text-xs text-info-content/80">Fluency Analysis</div>
								</div>
							</div>
						</div>
					{/if}

					<!-- Module Results -->
					<div class="space-y-4">
						<h3 class="flex items-center gap-2 font-semibold">
							<span class="icon-[mdi--check-circle] h-5 w-5"></span>
							Module Results
						</h3>
						{#each lastRun.moduleResults as moduleResult, index (index)}
							<div class="bg-base-50 rounded-lg border border-base-300 p-4">
								<div class="mb-3 flex items-center justify-between">
									<div class="flex items-center gap-2">
										<span class="badge badge-sm badge-primary">{index + 1}</span>
										<span class="font-semibold text-base-content">{moduleResult.moduleId}</span>
									</div>
									{#if modules.find((m) => m.id === moduleResult.moduleId)}
										{@const module = modules.find((m) => m.id === moduleResult.moduleId)}
										{#if module}
											<div class="flex gap-1">
												<span class="badge badge-outline badge-xs">{module.modality}</span>
												{#if module.tier}
													<span class="badge badge-outline badge-xs">{module.tier}</span>
												{/if}
											</div>
										{/if}
									{/if}
								</div>

								{#if moduleResult.summary}
									<div class="mb-3">
										<h4 class="mb-1 text-sm font-medium text-base-content/80">Summary:</h4>
										<p class="rounded border-l-4 border-primary bg-base-100 p-3 text-base-content">
											{moduleResult.summary}
										</p>
									</div>
								{/if}

								{#if moduleResult.recommendations?.length}
									<div>
										<h4
											class="mb-2 flex items-center gap-1 text-sm font-medium text-base-content/80"
										>
											<span class="icon-[mdi--information-outline] h-4 w-4"></span>
											Recommendations ({moduleResult.recommendations.length}):
										</h4>
										<ul class="space-y-2">
											{#each moduleResult.recommendations as recommendation, recIndex (recIndex)}
												<li class="flex items-start gap-2 text-sm text-base-content/80">
													<span class="mt-0.5 badge badge-xs badge-info">{recIndex + 1}</span>
													<span>{recommendation}</span>
												</li>
											{/each}
										</ul>
									</div>
								{/if}

								{#if showRawAnalysis && moduleResult.data && Object.keys(moduleResult.data).length > 0}
									<details class="mt-3">
										<summary
											class="flex cursor-pointer items-center gap-1 text-sm font-medium text-base-content/60 hover:text-base-content"
										>
											<span class="icon-[mdi--code-json] h-4 w-4"></span>
											Module Data (Click to expand)
										</summary>
										<pre
											class="mt-2 max-h-48 overflow-auto rounded bg-base-200 p-3 text-xs text-base-content">{JSON.stringify(
												moduleResult.data,
												null,
												2
											)}</pre>
									</details>
								{/if}
							</div>
						{/each}
					</div>

					<!-- Raw Analysis JSON -->
					{#if showRawAnalysis}
						<div class="mt-6 rounded-lg bg-base-200 p-4">
							<div class="mb-4 flex items-center gap-2">
								<span class="icon-[mdi--code-json] h-5 w-5"></span>
								<h4 class="font-semibold">Raw Analysis JSON</h4>
								<button
									class="btn ml-auto btn-outline btn-xs"
									onclick={() => navigator.clipboard.writeText(JSON.stringify(lastRun, null, 2))}
									>Copy JSON</button
								>
							</div>
							<pre
								class="max-h-96 overflow-auto rounded bg-base-300 p-4 text-xs text-base-content/80">{JSON.stringify(
									lastRun,
									null,
									2
								)}</pre>
						</div>
					{/if}
				</section>
			{/if}
		</div>
	</div>
{:else}
	<div class="flex min-h-screen items-center justify-center">
		<div class="text-center">
			<h1 class="mb-4 text-2xl font-bold">No Language Selected</h1>
			<p class="mb-6 text-base-content/70">Please select a language to continue.</p>
			<button class="btn btn-primary" onclick={handleStartNewConversation}>
				Start New Conversation
			</button>
		</div>
	</div>
{/if}

<!-- Quick Analysis Modal -->
{#if showQuickAnalysisModal && selectedLanguage}
	<QuickAnalysisModal
		{messages}
		language={selectedLanguage}
		onStartNewConversation={handleStartNewConversation}
		onDetailedAnalysis={runAnalysis}
		onGoHome={handleStartNewConversation}
		onClose={handleCloseQuickAnalysisModal}
		{analysisType}
		isGuestUser={data.isGuest}
		isHistorical={data.hasExistingData}
		sessionId={data.sessionId}
	/>
{/if}

<!-- Exit Survey Modal -->
{#if showExitSurvey && data.sessionId}
	<ExitSurvey sessionId={data.sessionId} onClose={handleExitSurveyClose} />
{/if}
