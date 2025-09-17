<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	import ConversationReviewableState from '$lib/components/ConversationReviewableState.svelte';
	import QuickAnalysis from '$lib/components/QuickAnalysis.svelte';
	import { settingsStore } from '$lib/stores/settings.store.svelte';
	import { conversationStore } from '$lib/stores/conversation.store.svelte';
	import {
		getQuickAnalysis,
		determineAnalysisType,
		type AnalysisType
	} from '$lib/services/analysis.service';
	import { userPreferencesStore } from '$lib/stores/userPreferences.store.svelte';

	const { data } = $props();

	// Get selected language from settings
	const selectedLanguage = $derived(settingsStore.selectedLanguage);

	// Get messages from conversation store - use analysisMessages if available, fallback to messages
	const messages = $derived(
		conversationStore.analysisMessages.length > 0
			? conversationStore.analysisMessages
			: conversationStore.messages
	);

	// Get analysis results state
	const hasAnalysisResults = $derived(userPreferencesStore.hasCurrentAnalysisResults);

	// Analysis state
	let analysisMode = $state<'quick' | 'full'>('quick');
	let analysisType = $state<AnalysisType>('regular');
	let quickAnalysisData = $state(null);

	// URL parameters
	const urlParams = $derived({
		mode: page.url.searchParams.get('mode') as 'quick' | 'full' | null,
		type: page.url.searchParams.get('type') as AnalysisType | null
	});

	// Handle cases where we need to load conversation data
	onMount(async () => {
		// If no language selected, redirect to home
		if (!selectedLanguage) {
			goto('/');
			return;
		}

		// Set analysis mode and type from URL params or defaults
		analysisMode = urlParams.mode || 'quick';
		analysisType = urlParams.type || determineAnalysisType(userPreferencesStore);

		// Handle test scenarios for development
		if (data.sessionId?.startsWith('test-')) {
			console.log('🧪 Detected test session, using mock data');
			return; // Skip normal flow for test sessions
		}

		// If we have messages from conversationStore, use them for analysis
		if (messages.length > 0 && selectedLanguage) {
			console.log('Using conversation store messages for analysis:', messages.length, 'messages');
			// Generate quick analysis data if in quick mode
			if (analysisMode === 'quick') {
				const result = getQuickAnalysis(messages, selectedLanguage, analysisType);
				if (result.success) {
					quickAnalysisData = result.data;
				}
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
				console.warn('No session in DB and no store data - redirecting to conversation');
				goto('/conversation');
				return;
			}
		} else if (messages.length === 0 && !hasAnalysisResults) {
			// No messages available and no analysis results - redirect back to conversation
			console.warn('No conversation data available for analysis');
			goto('/conversation');
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
		goto(`/conversation?sessionId=${newSessionId}`);
	}

	function handleGoHome() {
		goto('/');
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
</script>

<svelte:head>
	<title>Conversation Analysis - Kaiwa</title>
	<meta name="description" content="Review and analyze your conversation practice session" />
</svelte:head>

{#if selectedLanguage}
	{#if analysisMode === 'quick'}
		<QuickAnalysis
			{messages}
			language={selectedLanguage}
			onStartNewConversation={handleStartNewConversation}
			onGoToFullAnalysis={handleGoToFullAnalysis}
			onGoHome={handleGoHome}
			{analysisType}
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
