<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';

	import ConversationReviewableState from '$lib/features/conversation/components/ConversationReviewableState.svelte';
	import QuickAnalysis from '$lib/features/analysis/components/QuickAnalysis.svelte';
	import ExitSurvey from '$lib/components/ExitSurvey.svelte';
	import { settingsStore } from '$lib/stores/settings.store.svelte';
	import { conversationStore } from '$lib/stores/conversation.store.svelte';
	import {
		getQuickAnalysis,
		determineAnalysisType,
		type AnalysisType
	} from '$lib/services/analysis.service';
	import { userPreferencesStore } from '$lib/stores/user-preferences.store.svelte';

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
	let quickAnalysisData = $state(null);
	let sessionNotFound = $state(false);
	let showExitSurvey = $state(false);

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

		// If we have existing data from server (prioritized) or messages from conversationStore
		if (messages.length > 0 && selectedLanguage) {
			const dataSource = data.hasExistingData ? 'server data' : 'conversation store';
			console.log(`Using ${dataSource} for analysis:`, messages.length, 'messages');

			// Only generate new analysis for fresh conversations (not existing server data)
			if (analysisMode === 'quick' && !data.hasExistingData) {
				const result = getQuickAnalysis(messages, selectedLanguage, analysisType);
				if (result.success) {
					quickAnalysisData = result.data;
				}
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
		// For historical conversations, navigate back to the same conversation
		if (data.hasExistingData && data.sessionId && !sessionNotFound) {
			goto(`/conversation?sessionId=${data.sessionId}`);
		} else {
			// Clear current conversation and start new one
			conversationStore.destroyConversation();
			// Generate new sessionId for the new conversation
			const newSessionId = crypto.randomUUID();
			goto(`/conversation?sessionId=${newSessionId}`);
		}
	}

	function handleGoHome() {
		goto(resolve('/'));
	}

	function handleAnalyzeConversation() {
		// Switch to full analysis mode
		analysisMode = 'full';
		conversationStore.endConversation();
	}

	function handleGoToFullAnalysis() {
		// Update URL to show full analysis
		const url = new URL(window.location.href);
		url.searchParams.set('mode', 'full');
		url.searchParams.set('type', analysisType);
		goto(url.toString());
	}

	function handleExitSurveyClose() {
		showExitSurvey = false;
	}
</script>

<svelte:head>
	<title>Conversation Analysis - Kaiwa</title>
	<meta name="description" content="Review and analyze your conversation practice session" />
</svelte:head>

{#if sessionNotFound}
	<div
		class="flex min-h-screen items-center justify-center bg-gradient-to-br from-base-100 to-base-200"
	>
		<div class="mx-auto max-w-md p-8 text-center">
			<div class="mb-6">
				<svg
					class="mx-auto mb-4 h-16 w-16 text-warning"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
					/>
				</svg>
				<h1 class="mb-2 text-2xl font-bold">Conversation Not Found</h1>
				<p class="mb-6 text-base-content/70">
					This conversation session doesn't exist or has been removed. You can start a new
					conversation to practice your language skills.
				</p>
			</div>
			<div class="flex flex-col justify-center gap-3 sm:flex-row">
				<button class="btn btn-primary" onclick={handleStartNewConversation}>
					<svg class="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 6v6m0 0v6m0-6h6m-6 0H6"
						/>
					</svg>
					Start New Conversation
				</button>
				<button class="btn btn-ghost" onclick={handleGoHome}>
					<svg class="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
						/>
					</svg>
					Go Home
				</button>
			</div>
		</div>
	</div>
{:else if selectedLanguage}
	{#if analysisMode === 'quick'}
		<QuickAnalysis
			{messages}
			language={selectedLanguage}
			onStartNewConversation={handleStartNewConversation}
			onGoToFullAnalysis={handleGoToFullAnalysis}
			onGoHome={handleGoHome}
			{analysisType}
			isGuestUser={data.isGuest}
			isHistorical={data.hasExistingData}
			sessionId={data.sessionId}
		/>
	{:else}
		<ConversationReviewableState
			{messages}
			language={selectedLanguage}
			onStartNewConversation={handleStartNewConversation}
			onAnalyzeConversation={handleAnalyzeConversation}
			onGoHome={handleGoHome}
		/>
	{/if}
{:else}
	<div class="flex min-h-screen items-center justify-center">
		<div class="text-center">
			<h1 class="mb-4 text-2xl font-bold">No Language Selected</h1>
			<p class="mb-6 text-base-content/70">Please select a language to continue.</p>
			<button class="btn btn-primary" onclick={handleGoHome}> Go Home </button>
		</div>
	</div>
{/if}

<!-- Exit Survey Modal -->
{#if showExitSurvey && data.sessionId}
	<ExitSurvey sessionId={data.sessionId} onClose={handleExitSurveyClose} />
{/if}
