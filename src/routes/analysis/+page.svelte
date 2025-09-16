<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	import ConversationReviewableState from '$lib/components/ConversationReviewableState.svelte';
	import { settingsStore } from '$lib/stores/settings.store.svelte';
	import { conversationStore } from '$lib/stores/conversation.store.svelte';

	const { data } = $props();

	// Get selected language from settings
	const selectedLanguage = $derived(settingsStore.selectedLanguage);

	// Get messages from conversation store
	const messages = $derived(conversationStore.messages);

	// Handle cases where we need to load conversation data
	onMount(async () => {
		// If no language selected, redirect to home
		if (!selectedLanguage) {
			goto('/');
			return;
		}

		// If no messages in store and we have a session, we might need to load the conversation
		// For now, we'll show the analysis interface regardless
		console.log('Analysis page loaded for session:', data.sessionId);
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
		// This will trigger analysis of the current conversation
		conversationStore.endConversation();
	}
</script>

<svelte:head>
	<title>Conversation Analysis - Kaiwa</title>
	<meta name="description" content="Review and analyze your conversation practice session" />
</svelte:head>

{#if selectedLanguage}
	<ConversationReviewableState
		{messages}
		language={selectedLanguage}
		onStartNewConversation={handleStartNewConversation}
		onAnalyzeConversation={handleAnalyzeConversation}
		onGoHome={handleGoHome}
	/>
{:else}
	<div class="flex min-h-screen items-center justify-center">
		<div class="text-center">
			<h1 class="text-2xl font-bold mb-4">No Language Selected</h1>
			<p class="text-base-content/70 mb-6">Please select a language to continue.</p>
			<button class="btn btn-primary" onclick={handleGoHome}>
				Go Home
			</button>
		</div>
	</div>
{/if}