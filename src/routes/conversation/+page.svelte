<!-- src/routes/conversation/+page.svelte -->
<script lang="ts">
	import { page } from '$app/state';
	import { browser, dev } from '$app/environment';
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';

	import { conversationStore } from '$lib/stores/conversation.store.svelte';
	import { realtimeOpenAI } from '$lib/stores/realtime-openai.store.svelte';
	import { settingsStore } from '$lib/stores/settings.store.svelte';
	import { userPreferencesStore } from '$lib/stores/userPreferences.store.svelte';
	import { getSpeakerById } from '$lib/data/speakers';
	import { DEFAULT_VOICE } from '$lib/types/openai.realtime.types';
	import { determineAnalysisType } from '$lib/services/analysis.service';

	// Import all state components
	import ConnectingState from '$lib/components/ConversationConnectingState.svelte';
	import ErrorState from '$lib/components/ConversationErrorState.svelte';
	import ActiveConversationState from '$lib/components/ConversationActiveState.svelte';
	import DevPanel from '$lib/components/DevPanel.svelte';
	import RealtimeDebugPanel from '$lib/components/RealtimeDebugPanel.svelte';
	import { SvelteDate } from 'svelte/reactivity';

	// Keep existing components for analysis temporarily
	import OnboardingResults from '$lib/components/OnboardingResults.svelte';
	import { audioStore } from '$lib/stores/audio.store.svelte';

	const { data } = $props();

	// Reactive values from stores
	const status = $derived(conversationStore.status);
	// Use conversationStore.messages as primary source since it has mirroring and script generation
	const messages = $derived(conversationStore.messages);
	const audioLevel = $derived(audioStore.getCurrentLevel());
	const error = $derived(conversationStore.error);
	const selectedLanguage = $derived(settingsStore.selectedLanguage);
	const hasAnalysisResults = $derived(userPreferencesStore.hasCurrentAnalysisResults);
	const isAnalyzing = $derived(userPreferencesStore.isCurrentlyAnalyzing);
	const isGuestUser = $derived(data.isGuest);

	// Connection state
	let autoConnectAttempted = $state(false);

	// Debug panel state (only in dev mode)
	let showDebugPanel = $state(dev && true); // Show by default in dev mode
	let debugCollapsed = $state(false); // Start expanded

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

		// Ensure press-to-talk is the default on this route
		// Only override if not already set
		if (userPreferencesStore.getAudioMode() !== 'push_to_talk') {
			userPreferencesStore.setAudioMode('push_to_talk');
		}
		if (userPreferencesStore.getPressBehavior() !== 'press_hold') {
			userPreferencesStore.setPressBehavior('press_hold');
		}

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

		// Listen for clear events from debug panel (dev mode only)
		if (dev) {
			const handleClearEvents = () => {
				realtimeOpenAI.clearEvents();
			};

			document.addEventListener('clearEvents', handleClearEvents);

			// Return cleanup function
			return () => {
				document.removeEventListener('clearEvents', handleClearEvents);
			};
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
			// Get speaker object from ID
			const speaker = settingsStore.selectedSpeaker
				? getSpeakerById(settingsStore.selectedSpeaker)
				: undefined;
			await conversationStore.startConversation(selectedLanguage, speaker);
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
		// End conversation and redirect to quick analysis
		conversationStore.endConversation();

		// Determine analysis type and redirect to analysis page with quick mode
		const analysisType = determineAnalysisType(userPreferencesStore);
		goto(`/analysis?mode=quick&type=${analysisType}&sessionId=${sessionId}`);
	}

	function handleContinueAfterResults() {
		conversationStore.dismissAnalysisNotification();
		// Continue conversation instead of going home
	}

	function handleSaveAndContinue() {
		// This would typically trigger a signup/auth flow
		// For now, just dismiss results and continue conversation
		conversationStore.dismissAnalysisNotification();
	}

	function handlePermissionGranted() {
		console.log('🔒 Permission granted, attempting to reconnect...');
		// Clear any permission-related errors and retry connection
		audioStore.clearError();
		handleRetryConnection();
	}

	function handleSkipAudio() {
		console.log('🔇 User chose to skip audio, continuing without voice...');
		// For now, just retry connection - the system should handle graceful degradation
		// In the future, you could set a flag to disable audio features
		handleRetryConnection();
	}

	function toggleDebugPanel() {
		if (!showDebugPanel) {
			showDebugPanel = true;
			debugCollapsed = false;
		} else {
			debugCollapsed = !debugCollapsed;
		}
	}

	function hideDebugPanel() {
		showDebugPanel = false;
	}
</script>

{#if status === 'connecting'}
	<!-- Use new ConnectingState component -->
	<ConnectingState
		{audioLevel}
		{error}
		onRetry={handleRetryConnection}
		onPermissionGranted={handlePermissionGranted}
		onSkipAudio={handleSkipAudio}
	/>
{:else if status === 'error'}
	<!-- Use new ErrorState component -->
	<ErrorState
		error={error || 'Unknown error'}
		onRetry={handleRetryConnection}
		onGoHome={() => goto('/')}
	/>
{:else if status === 'analyzing'}
	<!-- Redirect to analysis page with quick mode -->
	{#if selectedLanguage}
		<script>
			// Auto-redirect to analysis page for quick analysis
			const analysisType = determineAnalysisType(userPreferencesStore);
			goto(`/analysis?mode=quick&type=${analysisType}&sessionId=${sessionId}`);
		</script>
	{/if}
{:else if status === 'analyzed'}
	<!-- Redirect to analysis page instead of showing ConversationReviewableState -->
	{#if selectedLanguage}
		<script>
			// Auto-redirect to analysis page
			const analysisType = determineAnalysisType(userPreferencesStore);
			goto(`/analysis?mode=quick&type=${analysisType}&sessionId=${sessionId}`);
		</script>
	{:else}
		<div class="flex min-h-screen items-center justify-center">
			<div class="text-center">
				<p class="text-lg text-base-content/70">No language selected</p>
				<button class="btn mt-4 btn-primary" onclick={() => goto('/')}>Go Home</button>
			</div>
		</div>
	{/if}
{:else if status === 'connected' || status === 'streaming'}
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
		timeRemaining={Math.ceil(conversationStore.timerState.timer.timeRemaining / 1000)}
		isTimerActive={conversationStore.timerState.timer.isActive}
		maxSessionLengthSeconds={conversationStore.usageLimits?.maxSessionLengthSeconds || 180}
	/>
	{#if dev}
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title">Dev Controls</h2>
				<div class="space-y-3">
					<!-- Debug controls -->
					<div class="flex flex-wrap items-center gap-2">
						<button
							class="btn btn-sm {showDebugPanel ? 'btn-secondary' : 'btn-outline'}"
							onclick={toggleDebugPanel}
						>
							{#if !showDebugPanel}
								Show Debug Panel
							{:else if debugCollapsed}
								Expand Debug
							{:else}
								Collapse Debug
							{/if}
						</button>
						{#if showDebugPanel}
							<button class="btn btn-ghost btn-sm" onclick={hideDebugPanel}> Hide Debug </button>
						{/if}
					</div>

					<!-- Audio Interaction Mode -->
					<div class="flex flex-wrap items-center gap-3">
						<div>
							Mode:
							<span class="badge badge-ghost">{userPreferencesStore.getAudioMode()}</span>
						</div>
						<button
							class="btn btn-sm"
							onclick={() =>
								userPreferencesStore.setAudioMode(
									userPreferencesStore.getAudioMode() === 'toggle' ? 'push_to_talk' : 'toggle'
								)}
						>
							Toggle Mode
						</button>
						<div class="divider divider-horizontal"></div>
						<div>
							Press Behavior:
							<span class="badge badge-ghost">{userPreferencesStore.getPressBehavior()}</span>
						</div>
						<button
							class="btn btn-sm"
							onclick={() =>
								userPreferencesStore.setPressBehavior(
									userPreferencesStore.getPressBehavior() === 'press_hold'
										? 'tap_toggle'
										: 'press_hold'
								)}
						>
							Toggle Press
						</button>
						<p class="text-xs opacity-70">
							Hands-free: leave mic open with VAD. Push-to-talk: gate the mic; release requests a
							response.
						</p>
					</div>
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
											dailyGoalSeconds: 30,
											preferredVoice: DEFAULT_VOICE,
											createdAt: new SvelteDate(),
											updatedAt: new SvelteDate()
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
										dailyGoalSeconds: 30,
										preferredVoice: DEFAULT_VOICE,
										createdAt: new SvelteDate(),
										updatedAt: new SvelteDate()
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
/>

<!-- Realtime Debug Panel at bottom (only shown in dev mode) -->
{#if dev && showDebugPanel}
	<section class="mx-auto mt-8 max-w-7xl px-6 pb-6">
		<RealtimeDebugPanel
			messages={conversationStore.messages}
			realtimeMessages={realtimeOpenAI.messages}
			events={realtimeOpenAI.events}
			connectionStatus={conversationStore.status}
			isCollapsed={debugCollapsed}
			onToggleCollapse={toggleDebugPanel}
		/>
	</section>
{/if}
