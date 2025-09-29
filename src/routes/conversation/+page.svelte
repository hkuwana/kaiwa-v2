<!-- src/routes/conversation/+page.svelte -->
<script lang="ts">
	import { page } from '$app/state';
	import { browser, dev } from '$app/environment';
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	import { conversationStore } from '$lib/stores/conversation.store.svelte';
	import { realtimeOpenAI } from '$lib/stores/realtime-openai.store.svelte';
	import { settingsStore } from '$lib/stores/settings.store.svelte';
	import { userPreferencesStore } from '$lib/stores/user-preferences.store.svelte';
	import { getSpeakerById } from '$lib/data/speakers';
	import { DEFAULT_VOICE } from '$lib/types/openai.realtime.types';
	import { determineAnalysisType } from '$lib/services/analysis.service';

	// Import all state components
	import ConnectingState from '$lib/features/conversation/components/ConversationConnectingState.svelte';
	import ErrorState from '$lib/features/conversation/components/ConversationErrorState.svelte';
	import ActiveConversationState from '$lib/features/conversation/components/ConversationActiveState.svelte';
	import DevPanel from '$lib/components/DevPanel.svelte';
	import MessageBubble from '$lib/features/conversation/components/MessageBubble.svelte';
	import { SvelteDate } from 'svelte/reactivity';

	// Keep existing components for analysis temporarily
	import OnboardingResults from '$lib/features/scenarios/components/OnboardingResults.svelte';
	import { audioStore } from '$lib/stores/audio.store.svelte';
	import type { Message } from '$lib/server/db/types';

	const { data } = $props();

	// Reactive values from stores or server data
	const status = $derived(data.isStaticView ? 'static' : conversationStore.status);
	// Use server messages for static view, otherwise use store messages
	const messages = $derived(data.isStaticView ? data.messages : conversationStore.messages);
	const audioLevel = $derived(audioStore.getCurrentLevel());
	const error = $derived(conversationStore.error);
	const selectedLanguage = $derived(settingsStore.selectedLanguage);
	const hasAnalysisResults = $derived(userPreferencesStore.hasCurrentAnalysisResults);
	const isAnalyzing = $derived(userPreferencesStore.isCurrentlyAnalyzing);
	const isGuestUser = $derived(data.isGuest);
	const isStaticView = $derived(data.isStaticView);

	// Connection state
	let autoConnectAttempted = $state(false);

	// Extract session parameters from URL
	const sessionId = $derived(page.url.searchParams.get('sessionId') || crypto.randomUUID());

	// Auto-connection effect (skip for static views)
	$effect(() => {
		if (
			browser &&
			!autoConnectAttempted &&
			!isStaticView &&
			status === 'idle' &&
			selectedLanguage
		) {
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
			goto(resolve('/'));
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

	onDestroy(async () => {
		console.log('Cleaning up conversation...');
		await conversationStore.destroyConversation();
	});

	// Browser cleanup
	if (browser) {
		const handleBeforeUnload = () => {
			// For beforeunload, we can't use async, so use the sync queue method
			conversationStore.queueConversationSave();
		};

		window.addEventListener('beforeunload', handleBeforeUnload);
		onDestroy(() => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
		});
	}

	async function attemptAutoConnection() {
		if (autoConnectAttempted || !selectedLanguage) return;

		autoConnectAttempted = true;
		console.log('Starting auto-connection with:', selectedLanguage.name, 'sessionId:', sessionId);

		try {
			// Set sessionId in conversation store before starting
			conversationStore.sessionId = sessionId;

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
		// End conversation first
		conversationStore.endConversation();

		// Wait a moment for conversation state to update, then redirect
		setTimeout(() => {
			// Determine analysis type and redirect to analysis page with quick mode
			const analysisType = determineAnalysisType(userPreferencesStore);
			goto(`/analysis?mode=quick&type=${analysisType}&sessionId=${sessionId}`, {
				replaceState: false,
				noScroll: false,
				keepFocus: false,
				invalidateAll: false
			});
		}, 100);
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
</script>

{#if status === 'static'}
	<!-- Static view of existing conversation -->
	<div class="min-h-screen bg-gradient-to-br from-base-100 to-base-200">
		<div class="container mx-auto flex h-screen max-w-4xl flex-col px-4 py-4">
			<!-- Header for static view -->
			<div class="mb-4 flex-shrink-0">
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body p-4">
						<div class="flex items-center justify-between">
							<div>
								<h1 class="text-xl font-bold">Past Conversation</h1>
								<p class="text-sm text-base-content/70">
									{#if data.existingSession}
										Started {data.existingSession.startTime.toLocaleDateString()} at {data.existingSession.startTime.toLocaleTimeString()}
									{/if}
								</p>
							</div>
							<div class="flex gap-2">
								<button
									class="btn btn-primary"
									onclick={() => goto(`/analysis?sessionId=${sessionId}`)}
								>
									View Analysis
								</button>
								<button class="btn btn-outline" onclick={() => goto('/')}>
									New Conversation
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Conversation Messages -->
			<div class="mb-4 min-h-0 flex-1">
				<div class="card h-full bg-base-100 shadow-lg">
					<div class="card-body flex h-full flex-col">
						<div class="mb-4 card-title flex-shrink-0 text-xl">
							Conversation History
							<span class="text-sm font-normal opacity-70">({messages.length} messages)</span>
						</div>
						<div class="flex-1 space-y-3 overflow-y-auto">
							{#if messages.length === 0}
								<div class="flex h-full items-center justify-center">
									<div class="text-center">
										<div class="text-lg opacity-70">No messages found</div>
										<div class="text-sm opacity-50">This conversation may not have been saved</div>
									</div>
								</div>
							{:else}
								{#each messages as message (message.id)}
									<div>
										<MessageBubble
											{message}
											dispatch={() => {}}
										/>
									</div>
								{/each}
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{:else if status === 'connecting'}
	<!-- Use new ConnectingState component -->
	<ConnectingState
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
		onGoHome={() => goto(resolve('/'))}
	/>
{:else if status === 'analyzing'}
	<!-- Show loading state while redirecting to analysis -->
	<div
		class="flex min-h-screen items-center justify-center bg-gradient-to-br from-base-100 to-base-200"
	>
		<div class="text-center">
			<div class="loading mb-4 loading-lg loading-spinner text-primary"></div>
			<h2 class="mb-2 text-2xl font-bold">Analyzing Your Conversation</h2>
			<p class="text-base-content/70">Preparing your personalized insights...</p>
		</div>
	</div>
	{#if selectedLanguage}
		{setTimeout(() => {
			const analysisType = determineAnalysisType(userPreferencesStore);
			goto(`/analysis?mode=quick&type=${analysisType}&sessionId=${sessionId}`, {
				replaceState: true
			});
		}, 1500)}
	{/if}
{:else if status === 'analyzed'}
	<!-- Redirect to analysis page instead of showing ConversationReviewableState -->
	{#if selectedLanguage}
		{(() => {
			const analysisType = determineAnalysisType(userPreferencesStore);
			goto(`/analysis?mode=quick&type=${analysisType}&sessionId=${sessionId}`, {
				replaceState: true
			});
		})()}
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
						<h3 class="mb-2 text-sm font-medium">Messages Debug</h3>
						<div class="space-y-2">
							<div class="rounded bg-base-200 p-2 text-xs">
								<div>Messages count: {messages.length}</div>
								<div>Status: {status}</div>
								<div>Connected: {conversationStore.isConnected()}</div>
								<details>
									<summary class="cursor-pointer">Show all messages</summary>
									<pre
										class="mt-2 max-h-32 overflow-y-auto rounded bg-base-300 p-2 text-xs">{JSON.stringify(
											messages.map((m) => ({
												id: m.id,
												role: m.role,
												content:
													m.content?.substring(0, 50) + (m.content?.length > 50 ? '...' : ''),
												timestamp: m.timestamp
											})),
											null,
											2
										)}</pre>
								</details>
							</div>
						</div>
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
						<div class="flex flex-wrap gap-2">
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
							<a href="/dev/analysis-test" class="btn btn-sm btn-secondary">
								🧪 Test Analysis Page
							</a>
						</div>
					</div>
					<div>
						<h3 class="mb-2 text-sm font-medium">Message Testing</h3>
						<div class="flex flex-wrap gap-2">
							<button
								class="btn btn-outline btn-sm"
								onclick={() => {
									// Add a test user message
									const testUserMessage: Message = {
										id: `test_user_${Date.now()}`,
										role: 'user',
										content: 'Hello, this is a test user message!',
										timestamp: new SvelteDate(),
										sequenceId: Date.now().toString(),
										conversationId: '',
										translatedContent: null,
										sourceLanguage: null,
										targetLanguage: null,
										userNativeLanguage: null,
										romanization: null,
										hiragana: null,
										otherScripts: undefined,
										translationConfidence: null,
										translationProvider: null,
										translationNotes: null,
										isTranslated: null,
										grammarAnalysis: undefined,
										vocabularyAnalysis: undefined,
										pronunciationScore: null,
										audioUrl: null,
										audioDuration: null,
										speechTimings: null,
										difficultyLevel: null,
										learningTags: undefined,
										conversationContext: null,
										messageIntent: null
									};
									conversationStore.messages = [...conversationStore.messages, testUserMessage];
								}}
							>
								Add Test User Message
							</button>
							<button
								class="btn btn-outline btn-sm"
								onclick={() => {
									// Add a test assistant message
									const testAssistantMessage: Message = {
										id: `test_assistant_${Date.now()}`,
										conversationId: sessionId,
										role: 'assistant',
										content: 'Hello! This is a test assistant response. How are you doing today?',
										timestamp: new SvelteDate(),
										sequenceId: String(Date.now()),
										translatedContent: null,
										sourceLanguage: null,
										targetLanguage: null,

										audioUrl: null,
										userNativeLanguage: null,
										romanization: null,
										hiragana: null,
										otherScripts: undefined,
										translationConfidence: null,
										translationProvider: null,
										translationNotes: null,
										isTranslated: null,
										grammarAnalysis: undefined,
										vocabularyAnalysis: undefined,
										pronunciationScore: null,
										audioDuration: null,
										speechTimings: null,
										difficultyLevel: null,
										learningTags: undefined,
										conversationContext: null,
										messageIntent: null
									};
									conversationStore.messages = [
										...conversationStore.messages,
										testAssistantMessage
									];
								}}
							>
								Add Test Assistant Message
							</button>
							<button
								class="btn btn-outline btn-sm"
								onclick={() => {
									// Clear all messages
									conversationStore.messages = [];
								}}
							>
								Clear Messages
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
		expandable={false}
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
