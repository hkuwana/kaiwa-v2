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

	// Get messages from conversation store
	const messages = $derived(conversationStore.messages);

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

		// Generate quick analysis data if in quick mode
		if (analysisMode === 'quick' && selectedLanguage) {
			const result = getQuickAnalysis(messages, selectedLanguage, analysisType);
			if (result.success) {
				quickAnalysisData = result.data;
			}
		}

		console.log('Analysis page loaded:', {
			sessionId: data.sessionId,
			mode: analysisMode,
			type: analysisType
		});
	});

	function handleStartNewConversation() {
		// Clear current conversation and start new one
		conversationStore.destroyConversation();
		goto('/conversation');
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
