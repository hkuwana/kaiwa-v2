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
	import LoadingAnalysis from '$lib/components/LoadingAnalysis.svelte';
	import ConversationReviewableState from '$lib/components/ConversationReviewableState.svelte';
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
		conversationStore.destroyConversation();
	});

	// Browser cleanup
	if (browser) {
		const handleBeforeUnload = () => {
			conversationStore.destroyConversation();
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
{:else if status === 'analyzing'}
	<!-- Loading Analysis Component -->
	<LoadingAnalysis
		messages={conversationStore.analysisMessages}
		language={selectedLanguage?.id || 'en'}
	/>
{:else if status === 'analyzed'}
	<!-- Analyzed Conversation State -->
	{#if selectedLanguage}
		<ConversationReviewableState
			{messages}
			language={selectedLanguage}
			onStartNewConversation={() => conversationStore.startNewConversationFromReview()}
			onAnalyzeConversation={() => conversationStore.endConversation()}
			onGoHome={() => goto('/')}
		/>
	{:else}
		<div class="flex min-h-screen items-center justify-center">
			<div class="text-center">
				<p class="text-lg text-base-content/70">No language selected</p>
				<button class="btn mt-4 btn-primary" onclick={() => goto('/')}>Go Home</button>
			</div>
		</div>
	{/if}
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
				<h2 class="card-title">Dev Controls</h2>
				<div class="space-y-3">
					<div>
						<h3 class="mb-2 text-sm font-medium">Timer State</h3>
						<pre class="rounded bg-base-200 p-2 text-xs">{JSON.stringify(
								conversationStore.timerState,
								null,
								2
							)}</pre>
					</div>
					<div>
						<h3 class="mb-2 text-sm font-medium">Assessment Testing</h3>
						<div class="flex gap-2">
							<button
								class="btn btn-outline btn-sm"
								onclick={() => {
									userPreferencesStore.constructAnalysis();
									// Simulate the analysis process
									setTimeout(() => {
										userPreferencesStore.setAnalysisResults({
											id: 'dev-test',
											userId: 'dev-user',
											targetLanguageId: selectedLanguage?.id || 'ja',
											learningGoal: 'Career',
											speakingLevel: 35,
											listeningLevel: 45,
											readingLevel: 30,
											writingLevel: 25,
											speakingConfidence: 60,
											specificGoals: ['Business meetings', 'Technical discussions'],
											challengePreference: 'moderate',
											correctionStyle: 'gentle',
											dailyGoalMinutes: 30,
											preferredVoice: 'alloy',
											createdAt: new Date(),
											updatedAt: new Date()
										});
									}, 3000);
								}}
							>
								Start Assessment
							</button>
							<button
								class="btn btn-outline btn-sm"
								onclick={() => userPreferencesStore.clearAnalysisResults()}
							>
								Clear Results
							</button>
							<button
								class="btn btn-outline btn-sm"
								onclick={() =>
									userPreferencesStore.setAnalysisResults({
										id: 'dev-test',
										userId: 'dev-user',
										targetLanguageId: selectedLanguage?.id || 'ja',
										learningGoal: 'Career',
										speakingLevel: 35,
										listeningLevel: 45,
										readingLevel: 30,
										writingLevel: 25,
										speakingConfidence: 60,
										specificGoals: ['Business meetings', 'Technical discussions'],
										challengePreference: 'moderate',
										correctionStyle: 'gentle',
										dailyGoalMinutes: 30,
										preferredVoice: 'alloy',
										createdAt: new Date(),
										updatedAt: new Date()
									})}
							>
								Set Mock Results
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
{:else if hasAnalysisResults}
	<!-- Analysis Results Modal -->
	<OnboardingResults
		results={userPreferencesStore.getPreferences()}
		isVisible={true}
		{isGuestUser}
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
