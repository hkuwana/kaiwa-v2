<!-- src/routes/conversation/+page.svelte -->
<script lang="ts">
	import { page } from '$app/state';
	import { browser, dev } from '$app/environment';
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { fade, fly } from 'svelte/transition';

	import { conversationStore } from '$lib/stores/conversation.store.svelte';
	import { settingsStore } from '$lib/stores/settings.store.svelte';
	import LoadingScreen from '$lib/components/LoadingScreen.svelte';
	import AudioVisualizer from '$lib/components/AudioVisualizer.svelte';
	import MessageBubble from '$lib/components/MessageBubble.svelte';
	import OnboardingResults from '$lib/components/OnboardingResults.svelte';

	const { data } = $props();

	// Reactive values from stores
	let status = $derived(conversationStore.status);
	let messages = $derived(conversationStore.messages);
	let audioLevel = $derived(conversationStore.reactiveAudioLevel);
	let error = $derived(conversationStore.error);
	let selectedLanguage = $derived(settingsStore.selectedLanguage);
	let isAnalyzing = $derived(conversationStore.isAnalyzing);
	let hasAnalysisResults = $derived(conversationStore.hasAnalysisResults);
	let isGuestUser = $derived(conversationStore.isGuestUser);

	// Connection state
	let autoConnectAttempted = $state(false);
	let messageInput = $state('');

	// Extract session parameters from URL
	const sessionId = $derived(page.url.searchParams.get('sessionId') || crypto.randomUUID());

	// Determine view modes
	const showLoadingScreen = $derived(
		status === 'connecting' || (status === 'connected' && messages.length === 0)
	);

	const showActiveConversation = $derived(
		(status === 'connected' || status === 'streaming') && messages.length > 0
	);

 
	const showAnalysisResults = $derived(hasAnalysisResults);

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

	function handleSendMessage() {
		if (messageInput.trim() && (status === 'connected' || status === 'streaming')) {
			conversationStore.sendMessage(messageInput.trim());
			messageInput = '';
		}
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSendMessage();
		}
	}

	// Get appropriate header info
	function getHeaderInfo() {
		if (isGuestUser && messages.length < 4) {
			return {
				title: `Welcome to ${selectedLanguage?.name || 'Language'} Learning!`,
				subtitle: "Let's get to know you and create your perfect learning plan",
				badge: 'Personalizing'
			};
		} else {
			return {
				title: `${selectedLanguage?.name || 'Language'} Conversation`,
				subtitle: null,
				badge: 'Active'
			};
		}
	}

	const headerInfo = getHeaderInfo();
</script>

<div class="min-h-screen bg-gradient-to-br from-base-100 to-base-200">
	{#if showLoadingScreen}
		<!-- Loading/Connection Screen -->
		<div class="container mx-auto px-4" in:fade={{ duration: 300 }}>
			<LoadingScreen
				status={error ? 'error' : status}
				{audioLevel}
				{error}
				onRetry={handleRetryConnection}
			/>
		</div>
	{:else if isAnalyzing}
		<!-- Analysis Screen -->
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
	{:else if showAnalysisResults}
		<!-- Analysis Results Modal -->
		<OnboardingResults
			results={conversationStore.getAnalysisResults()}
			isVisible={true}
			onDismiss={handleContinueAfterResults}
			onSave={handleSaveAndContinue}
		/>
	{:else if showActiveConversation}
		<!-- Active Conversation View -->
		<div class="container mx-auto max-w-4xl px-4 py-6" in:fly={{ y: 20, duration: 400 }}>
			<!-- Header -->
			<header class="mb-6 text-center">
				<div class="mb-4 flex items-center justify-center gap-4">
					<h1 class="text-2xl font-bold text-primary">
						{headerInfo.title}
					</h1>
					<div class="badge badge-success">{headerInfo.badge}</div>
				</div>
				{#if headerInfo.subtitle}
					<p class="text-base-content/70">{headerInfo.subtitle}</p>
				{/if}
			</header>

			<!-- Live Audio Indicator -->
			{#if status === 'connected' || status === 'streaming'}
				<div class="mb-6 flex justify-center" in:fade={{ duration: 300, delay: 200 }}>
					<div class="card border border-success/20 bg-success/5 shadow-lg">
						<div class="card-body p-4 text-center">
							<div class="mb-2 flex justify-center">
								<AudioVisualizer {audioLevel} />
							</div>
							<p class="text-sm text-success">
								{isGuestUser && messages.length < 4
									? 'Getting to know you - Speak naturally'
									: 'Voice chat active - Speak naturally'}
							</p>
						</div>
					</div>
				</div>
			{/if}

			<!-- Live Transcription -->
			{#if conversationStore.currentTranscript}
				<div class="mb-6" in:fly={{ y: -10, duration: 200 }}>
					<div class="card border-l-4 border-l-info bg-info/5">
						<div class="card-body">
							<h3 class="card-title text-lg text-info">You're saying:</h3>
							<div class="rounded-lg bg-base-100 p-4">
								<p class="text-lg">{conversationStore.currentTranscript}</p>
								{#if conversationStore.isTranscribing}
									<div class="mt-2 flex items-center gap-2 text-sm opacity-70">
										<div class="loading loading-sm loading-dots"></div>
										<span>Listening...</span>
									</div>
								{/if}
							</div>
						</div>
					</div>
				</div>
			{/if}

			<!-- Guest User Helper Text -->
			{#if isGuestUser && messages.length < 3}
				<div class="mb-6" in:fade={{ duration: 300 }}>
					<div class="alert alert-info">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							class="h-6 w-6 shrink-0 stroke-current"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							></path>
						</svg>
						<div>
							<h3 class="font-bold">Welcome to your first lesson!</h3>
							<div class="mt-1 text-xs">
								Our AI tutor will chat with you to understand your goals and assess your level. This
								helps us create the perfect learning experience for you!
							</div>
						</div>
					</div>
				</div>
			{/if}

			<!-- Conversation Messages -->
			<div class="mb-6">
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h3 class="mb-4 card-title text-xl">
							{isGuestUser && messages.length < 4 ? 'Getting to Know You' : 'Conversation'}
						</h3>
						<div class="max-h-96 space-y-3 overflow-y-auto">
							{#each messages as message, index (message.id)}
								<div in:fly={{ y: 20, duration: 300, delay: index * 50 }}>
									<MessageBubble {message} />
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>

			<!-- Text Input -->
			<div class="mb-6">
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<div class="flex gap-2">
							<input
								type="text"
								bind:value={messageInput}
								onkeypress={handleKeyPress}
								placeholder="Type your response..."
								class="input-bordered input flex-1"
								disabled={status === 'analyzing'}
							/>
							<button
								onclick={handleSendMessage}
								class="btn btn-primary"
								disabled={!messageInput.trim() || status === 'analyzing'}
							>
								Send
							</button>
						</div>
						{#if isGuestUser && messages.length < 4}
							<div class="mt-2 text-xs text-base-content/60">
								Pro tip: You can speak out loud or type your responses - whatever feels more
								comfortable!
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- End Conversation -->
			<div class="flex justify-center">
				<button
					onclick={handleEndConversation}
					class="btn btn-outline btn-error"
					disabled={status === 'analyzing'}
				>
					{isGuestUser ? 'Finish & Get My Results' : 'End Conversation'}
				</button>
			</div>
		</div>

		<!-- Dev Tools -->
		{#if dev}
			<div class="fixed right-4 bottom-4">
				<div class="card border border-warning/30 bg-warning/10">
					<div class="card-body p-3">
						<div class="space-y-1 text-xs">
							<div>Status: <span class="font-mono">{status}</span></div>
							<div>Messages: <span class="font-mono">{messages.length}</span></div>
							<div>Audio: <span class="font-mono">{audioLevel.toFixed(2)}</span></div>
							<div>Guest: <span class="font-mono">{isGuestUser}</span></div>
							<div>Analysis: <span class="font-mono">{hasAnalysisResults}</span></div>
						</div>
					</div>
				</div>
			</div>
		{/if}
	{/if}
</div>
