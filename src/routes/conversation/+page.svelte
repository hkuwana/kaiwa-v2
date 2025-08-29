<!-- src/routes/conversation/+page.svelte -->
<script lang="ts">
	import { page } from '$app/state';
	import { browser, dev } from '$app/environment';
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';

	import { conversationStore } from '$lib/stores/conversation.store.svelte';
	import { settingsStore } from '$lib/stores/settings.store.svelte';
	import { userPreferencesStore } from '$lib/stores/userPreferences.store.svelte';

	// Import all state components
	import ConnectingState from '$lib/components/ConversationConnectingState.svelte';
	import ErrorState from '$lib/components/ConversationErrorState.svelte';
	import ActiveConversationState from '$lib/components/ConversationActiveState.svelte';
	import DevPanel from '$lib/components/DevPanel.svelte';

	// Keep existing components for analysis temporarily
	import { fade } from 'svelte/transition';
	import OnboardingResults from '$lib/components/OnboardingResults.svelte';
	import { audioStore } from '$lib/stores/audio.store.svelte';

	const { data } = $props();

	// Reactive values from stores
	let status = $derived(conversationStore.status);
	let messages = $derived(conversationStore.messages);
	let audioLevel = $derived(audioStore.getCurrentLevel());
	let error = $derived(conversationStore.error);
	let selectedLanguage = $derived(settingsStore.selectedLanguage);
	let hasAnalysisResults = $derived(userPreferencesStore.hasCurrentAnalysisResults);
	let isAnalyzing = $derived(userPreferencesStore.isCurrentlyAnalyzing);
	let isGuestUser = $derived(data.isGuest);

	// Connection state
	let autoConnectAttempted = $state(false);

	// Extract session parameters from URL
	const sessionId = $derived(page.url.searchParams.get('sessionId') || crypto.randomUUID());

	// Auto-connection effect
	$effect(() => {
		if (browser && !autoConnectAttempted && status === 'idle' && selectedLanguage) {
			attemptAutoConnection();
		}
	});

	onMount(() => {
		console.log('Conversation page mounted');

		// Redirect to home if no language selected
		if (!selectedLanguage) {
			goto('/');
			return;
		}

		// Update URL with session ID if needed
		if (!page.url.searchParams.get('sessionId')) {
			const newUrl = new URL(page.url);
			newUrl.searchParams.set('sessionId', sessionId);
			goto(newUrl.toString(), { replaceState: true });
		}
	});

	onDestroy(() => {
		console.log('Cleaning up conversation...');
		if (status === 'connected' || status === 'streaming') {
			conversationStore.endConversation();
		}
		conversationStore.forceCleanup();
	});

	// Browser cleanup
	if (browser) {
		const handleBeforeUnload = () => {
			if (status === 'connected' || status === 'streaming') {
				conversationStore.endConversation();
			}
		};

		window.addEventListener('beforeunload', handleBeforeUnload);
		onDestroy(() => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
		});
	}

	async function attemptAutoConnection() {
		if (autoConnectAttempted || !selectedLanguage) return;

		autoConnectAttempted = true;
		console.log('Starting auto-connection with:', selectedLanguage.name);

		try {
			await conversationStore.startConversation(selectedLanguage, settingsStore.selectedSpeaker);
			console.log('Auto-connection successful');
		} catch (err) {
			console.error('Auto-connection failed:', err);
		}
	}

	function handleRetryConnection() {
		autoConnectAttempted = false;
		conversationStore.clearError();
		if (selectedLanguage) {
			attemptAutoConnection();
		}
	}

	function handleEndConversation() {
		conversationStore.endConversation();
	}

	function handleContinueAfterResults() {
		conversationStore.completeAnalyzedSession();
		goto('/');
	}

	function handleSaveAndContinue() {
		// This would typically trigger a signup/login flow
		// For now, just dismiss results
		conversationStore.dismissAnalysisResults();
		goto('/');
	}
</script>

{#if status === 'connecting'}
	<!-- Use new ConnectingState component -->
	<ConnectingState {audioLevel} {error} onRetry={handleRetryConnection} />
{:else if status === 'error'}
	<!-- Use new ErrorState component -->
	<ErrorState
		error={error || 'Unknown error'}
		onRetry={handleRetryConnection}
		onGoHome={() => goto('/')}
	/>
{:else if isAnalyzing}
	<!-- Analysis Screen -->
	<div class="min-h-screen bg-gradient-to-br from-base-100 to-base-200">
		<div class="container mx-auto max-w-2xl px-4 py-12" in:fade={{ duration: 300 }}>
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body text-center">
					<div
						class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"
					>
						<div class="loading loading-lg loading-spinner text-primary"></div>
					</div>
					<h2 class="card-title justify-center text-2xl">Creating Your Learning Profile</h2>
					<p class="mb-6 text-base-content/70">
						We're analyzing our conversation to understand your learning style, goals, and current
						level. This helps us create the perfect personalized experience for you.
					</p>
					<div class="space-y-2 text-sm">
						<div class="flex items-center justify-center gap-2">
							<div class="loading loading-sm loading-dots"></div>
							<span>Assessing your language skills...</span>
						</div>
						<div class="flex items-center justify-center gap-2 text-base-content/50">
							<span>Understanding your goals...</span>
						</div>
						<div class="flex items-center justify-center gap-2 text-base-content/50">
							<span>Personalizing your experience...</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{:else if (status === 'connected' || status === 'streaming') && messages.length > 0}
	<ActiveConversationState
		{status}
		{messages}
		{audioLevel}
		{selectedLanguage}
		{isGuestUser}
		currentTranscript={conversationStore.currentTranscript}
		isTranscribing={conversationStore.isTranscribing}
		onSendMessage={(content) => conversationStore.sendMessage(content)}
		onEndConversation={handleEndConversation}
	/>
	{#if dev}
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title">Timer State</h2>
				<pre>{JSON.stringify(conversationStore.timerState, null, 2)}</pre>
			</div>
		</div>
	{/if}
{:else if hasAnalysisResults}
	<!-- Analysis Results Modal -->
	<OnboardingResults
		results={userPreferencesStore.getPreferences()}
		isVisible={true}
		onDismiss={handleContinueAfterResults}
		onSave={handleSaveAndContinue}
	/>
{/if}
<!-- Dev Panel -->
<DevPanel
	{status}
	messagesCount={messages.length}
	{audioLevel}
	{isGuestUser}
	{hasAnalysisResults}
	{isAnalyzing}
	timeInSeconds={Math.ceil(conversationStore.timerState.timer.timeRemaining / 1000)}
	position="bottom-right"
/>
