<!-- src/routes/conversation/+page.svelte -->
<script lang="ts">
	import { page } from '$app/state';
	import { browser, dev } from '$app/environment';
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';

	import { conversationStore } from '$lib/stores/conversation.store.svelte';
	import { settingsStore, usePersistentSettings } from '$lib/stores/settings.store.svelte';
	import AudioVisualizer from '$lib/components/AudioVisualizer.svelte';
	import LoadingScreen from '$lib/components/LoadingScreen.svelte';
	import MessageBubble from '$lib/components/MessageBubble.svelte';
	import type { PageData } from './$types';

	const { data } = $props();

	// Get user ID from page data
	const userId = data.user?.id ?? null;

	// Reactive values from stores
	let status = $derived(conversationStore.status);
	let messages = $derived(conversationStore.messages);
	let audioLevel = $derived(conversationStore.reactiveAudioLevel);
	let error = $derived(conversationStore.error);
	let availableDevices = $derived(conversationStore.availableDevices);
	let selectedDeviceId = $derived(conversationStore.selectedDeviceId);

	// Settings from settings store
	let selectedLanguage = $derived(settingsStore.selectedLanguage);
	let selectedSpeaker = $derived(settingsStore.selectedSpeaker);

	// Get persistent settings utilities
	const persistentSettings = usePersistentSettings();

	// Auto-connection state
	let autoConnectAttempted = $state(false);
	let autoConnectError = $state<string>('');
	let isAutoConnecting = $state(false);

	// Manual message input
	let messageInput = $state('');

	// Dev mode toggle
	let showDevTools = $state(dev);

	// Extract session parameters from URL
	const sessionId = $derived(page.url.searchParams.get('sessionId') || crypto.randomUUID());
	const urlLanguage = $derived(page.url.searchParams.get('language'));
	const urlSpeaker = $derived(page.url.searchParams.get('speaker'));

	// Setup persistence on mount
	$effect(() => {
		if (browser) {
			settingsStore.ensurePersistence();
		}
	});

	// Auto-connection effect - runs when page loads or settings change
	$effect(() => {
		// Only auto-connect if:
		// 1. We're in browser
		// 2. Haven't attempted auto-connect yet
		// 3. We're in idle state (not already connecting/connected)
		// 4. We have session ID
		// 5. We have either URL params or stored settings
		if (
			browser &&
			!autoConnectAttempted &&
			status === 'idle' &&
			sessionId &&
			(urlLanguage || selectedLanguage)
		) {
			attemptAutoConnection();
		}
	});

	onMount(() => {
		console.log('Conversation page mounted with session:', sessionId);

		// Update URL if session ID wasn't provided
		if (!page.url.searchParams.get('sessionId')) {
			const newUrl = new URL(page.url);
			newUrl.searchParams.set('sessionId', sessionId);
			goto(newUrl.toString(), { replaceState: true });
		}
	});

	onDestroy(() => {
		console.log('Conversation page component destroying, cleaning up...');

		// End any active conversation
		if (status === 'connected' || status === 'streaming') {
			conversationStore.endConversation();
		}

		// Force cleanup of realtime connection
		conversationStore.forceCleanup();
	});

	// Browser cleanup handlers
	if (browser) {
		const handleBeforeUnload = () => {
			if (status === 'connected' || status === 'streaming') {
				conversationStore.endConversation();
			}
			conversationStore.forceCleanup();
		};

		const handleVisibilityChange = () => {
			if (document.hidden && (status === 'connected' || status === 'streaming')) {
				console.log('Page hidden, ending conversation');
				conversationStore.endConversation();
			}
		};

		window.addEventListener('beforeunload', handleBeforeUnload);
		document.addEventListener('visibilitychange', handleVisibilityChange);

		onDestroy(() => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		});
	}

	async function attemptAutoConnection() {
		if (autoConnectAttempted || isAutoConnecting) return;

		autoConnectAttempted = true;
		isAutoConnecting = true;
		autoConnectError = '';

		try {
			// Determine language to use (URL param takes precedence)
			let targetLanguage = selectedLanguage;
			if (urlLanguage) {
				// You might want to validate/find the language from your data
				// For now, assuming selectedLanguage is set correctly
				console.log('Using URL language parameter:', urlLanguage);
			}

			// Determine speaker to use (URL param takes precedence)
			let targetSpeaker = selectedSpeaker;
			if (urlSpeaker) {
				targetSpeaker = urlSpeaker;
				console.log('Using URL speaker parameter:', urlSpeaker);
			}

			if (!targetLanguage) {
				throw new Error('No language selected for conversation');
			}

			console.log('Starting auto-connection with:', {
				language: targetLanguage.name,
				speaker: targetSpeaker,
				sessionId
			});

			await conversationStore.startConversation(targetLanguage, targetSpeaker);

			console.log('Auto-connection successful');
		} catch (err) {
			console.error('Auto-connection failed:', err);
			autoConnectError = err instanceof Error ? err.message : 'Connection failed';
		} finally {
			isAutoConnecting = false;
		}
	}

	async function handleManualStart() {
		if (!selectedLanguage) {
			autoConnectError = 'Please select a language first';
			return;
		}

		autoConnectError = '';

		try {
			await conversationStore.startConversation(selectedLanguage, selectedSpeaker);
		} catch (err) {
			autoConnectError = err instanceof Error ? err.message : 'Connection failed';
		}
	}

	function handleRetryConnection() {
		autoConnectAttempted = false;
		autoConnectError = '';
		conversationStore.clearError();

		// Will trigger auto-connection effect
		if (selectedLanguage) {
			attemptAutoConnection();
		}
	}

	function handleEndConversation() {
		conversationStore.endConversation();

		// Navigate back to language selection or home
		goto('/');
	}

	function handleSelectDevice(deviceId: string) {
		conversationStore.selectDevice(deviceId);
	}

	function handleClearError() {
		conversationStore.clearError();
		autoConnectError = '';
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

	// Connection status indicator
	const connectionStatusClass = $derived(
		{
			idle: 'badge-ghost',
			connecting: 'badge-warning',
			connected: 'badge-success',
			streaming: 'badge-info',
			error: 'badge-error'
		}[status] || 'badge-ghost'
	);
</script>

<div class="mx-auto max-w-7xl p-8 font-sans">
	<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
		<!-- Main Conversation Area -->
		<div class="lg:col-span-2">
			<header class="mb-8 text-center">
				<div class="mb-4 flex items-center justify-center gap-4">
					<h1 class="text-4xl font-bold text-primary">
						{selectedLanguage?.name || 'Language'} Conversation
					</h1>
					<div class="badge {connectionStatusClass} badge-lg">
						{status}
					</div>
				</div>

				<div class="flex items-center justify-center gap-2 text-sm text-base-content/60">
					<span>Session: {sessionId.slice(0, 8)}...</span>
					{#if userId}
						<span class="badge badge-outline">Logged In</span>
					{:else}
						<span class="badge badge-ghost">Guest Mode</span>
					{/if}
				</div>
			</header>

			<main class="space-y-6">
				<!-- Auto-connection status -->
				{#if isAutoConnecting}
					<div class="card bg-base-100 shadow-lg">
						<div class="card-body text-center">
							<h3 class="card-title justify-center text-info">Auto-Connecting...</h3>
							<p class="text-base-content/70">
								Setting up your conversation with {selectedLanguage?.name || 'selected language'}
							</p>
							<LoadingScreen />
						</div>
					</div>
				{:else if status === 'connecting'}
					<LoadingScreen />
				{/if}

				<!-- Error display -->
				{#if error || autoConnectError}
					<div class="alert alert-error">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6 shrink-0 stroke-current"
							fill="none"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<div>
							<h3 class="font-bold">Connection Error</h3>
							<div class="text-xs">{error || autoConnectError}</div>
						</div>
						<div class="flex gap-2">
							<button onclick={handleRetryConnection} class="btn btn-outline btn-sm">
								Retry
							</button>
							<button onclick={handleClearError} class="btn btn-ghost btn-sm"> Dismiss </button>
						</div>
					</div>
				{/if}

				<!-- Manual start button (only show if auto-connect failed or not attempted) -->
				{#if status === 'idle' && (autoConnectError || !selectedLanguage)}
					<div class="card bg-base-100 shadow-lg">
						<div class="card-body text-center">
							{#if !selectedLanguage}
								<h3 class="card-title justify-center text-warning">Language Required</h3>
								<p class="mb-4 text-base-content/70">
									Please select a language before starting your conversation
								</p>
								<button onclick={() => goto('/')} class="btn btn-primary"> Select Language </button>
							{:else}
								<h3 class="card-title justify-center">Ready to Start</h3>
								<p class="mb-4 text-base-content/70">
									Start your conversation with {selectedLanguage.name}
								</p>
								<button onclick={handleManualStart} class="btn btn-lg btn-primary">
									Start Conversation
								</button>
							{/if}
						</div>
					</div>
				{/if}

				<!-- Connected state -->
				{#if status === 'connected'}
					<div class="card border border-success/20 bg-success/10 shadow-lg">
						<div class="card-body text-center">
							<h3 class="card-title justify-center text-success">Connected!</h3>
							<p class="text-base-content/70">Ready to start your voice conversation</p>
							<div class="card-actions justify-center">
								<button onclick={handleEndConversation} class="btn btn-outline btn-error">
									End Conversation
								</button>
							</div>
						</div>
					</div>
				{/if}

				<!-- Streaming state -->
				{#if status === 'streaming'}
					<div class="card border border-info/20 bg-info/10 shadow-lg">
						<div class="card-body text-center">
							<h3 class="card-title justify-center text-info">Voice Chat Active</h3>
							<p class="mb-4 text-base-content/70">
								Speak naturally - the AI will respond when you finish talking
							</p>

							<div class="mb-4 flex justify-center">
								<AudioVisualizer {audioLevel} />
							</div>

							<div class="card-actions justify-center">
								<button onclick={handleEndConversation} class="btn btn-outline btn-error">
									End Conversation
								</button>
							</div>
						</div>
					</div>
				{/if}

				<!-- Live Transcription -->
				{#if status === 'streaming' && conversationStore.currentTranscript}
					<div class="card border-l-4 border-l-info bg-base-100 shadow-lg">
						<div class="card-body">
							<h3 class="card-title text-lg text-info">Live Transcription</h3>
							<div class="rounded-lg bg-base-200 p-4">
								<p class="text-lg">{conversationStore.currentTranscript}</p>
								{#if conversationStore.isTranscribing}
									<div class="mt-2 flex items-center gap-2 text-sm text-base-content/60">
										<div class="h-2 w-2 animate-pulse rounded-full bg-info"></div>
										<span>Transcribing...</span>
									</div>
								{/if}
							</div>
						</div>
					</div>
				{/if}

				<!-- Messages -->
				{#if messages.length > 0}
					<div class="card bg-base-100 shadow-lg">
						<div class="card-body">
							<h3 class="mb-4 card-title text-xl text-primary">Conversation History</h3>
							<div class="max-h-96 space-y-3 overflow-y-auto">
								{#each messages as message (message.id)}
									<MessageBubble {message} />
								{/each}
							</div>
						</div>
					</div>
				{/if}

				<!-- Text Message Input -->
				{#if status === 'connected' || status === 'streaming'}
					<div class="card bg-base-100 shadow-lg">
						<div class="card-body">
							<h3 class="card-title text-primary">Send Text Message</h3>
							<div class="flex gap-2">
								<input
									type="text"
									bind:value={messageInput}
									onkeypress={handleKeyPress}
									placeholder="Type your message..."
									class="input-bordered input flex-1"
									disabled={status !== 'connected' && status !== 'streaming'}
								/>
								<button
									onclick={handleSendMessage}
									class="btn btn-primary"
									disabled={!messageInput.trim() ||
										(status !== 'connected' && status !== 'streaming')}
								>
									Send
								</button>
							</div>
						</div>
					</div>
				{/if}

				<!-- Audio Device Selection -->
				{#if availableDevices.length > 0}
					<div class="card bg-base-100 shadow-lg">
						<div class="card-body">
							<h3 class="card-title text-primary">Audio Device</h3>
							<select
								value={selectedDeviceId}
								onchange={(e) => handleSelectDevice((e.target as HTMLSelectElement).value)}
								class="select-bordered select w-full"
							>
								{#each availableDevices as device (device.deviceId)}
									<option value={device.deviceId}>
										{device.label || `Device ${device.deviceId.slice(0, 8)}`}
									</option>
								{/each}
							</select>
						</div>
					</div>
				{/if}
			</main>
		</div>

		<!-- Dev Tools Sidebar -->
		{#if dev}
			<div class="lg:col-span-1">
				<div class="sticky top-8">
					<div class="card border border-warning/30 bg-warning/5">
						<div class="card-body">
							<div class="mb-4 flex items-center justify-between">
								<h3 class="card-title text-warning">Dev Tools</h3>
								<button
									onclick={() => (showDevTools = !showDevTools)}
									class="btn btn-sm btn-warning"
								>
									{showDevTools ? 'Hide' : 'Show'}
								</button>
							</div>

							{#if showDevTools}
								<div class="space-y-4">
									<!-- Status Debug -->
									<div class="rounded-lg bg-base-200 p-3">
										<h4 class="mb-2 font-semibold">Status Debug</h4>
										<div class="space-y-1 text-sm">
											<div class="flex justify-between">
												<span>Status:</span>
												<span class="font-mono">{status}</span>
											</div>
											<div class="flex justify-between">
												<span>Audio Level:</span>
												<span class="font-mono">{audioLevel.toFixed(4)}</span>
											</div>
											<div class="flex justify-between">
												<span>Messages:</span>
												<span class="font-mono">{messages.length}</span>
											</div>
											<div class="flex justify-between">
												<span>Session ID:</span>
												<span class="font-mono text-xs">{sessionId.slice(0, 12)}...</span>
											</div>
											<div class="flex justify-between">
												<span>Auto-Connect:</span>
												<span class="font-mono">{autoConnectAttempted ? 'Yes' : 'No'}</span>
											</div>
										</div>
									</div>

									<!-- Settings Debug -->
									<div class="rounded-lg bg-base-200 p-3">
										<h4 class="mb-2 font-semibold">Settings</h4>
										<div class="space-y-1 text-sm">
											<div class="flex justify-between">
												<span>Language:</span>
												<span class="font-mono">{selectedLanguage?.code || 'None'}</span>
											</div>
											<div class="flex justify-between">
												<span>Speaker:</span>
												<span class="font-mono">{selectedSpeaker || 'None'}</span>
											</div>
											<div class="flex justify-between">
												<span>URL Lang:</span>
												<span class="font-mono">{urlLanguage || 'None'}</span>
											</div>
											<div class="flex justify-between">
												<span>URL Speaker:</span>
												<span class="font-mono">{urlSpeaker || 'None'}</span>
											</div>
										</div>
									</div>

									<!-- Actions -->
									<div class="space-y-2">
										<button
											onclick={() => persistentSettings.debug()}
											class="btn w-full btn-outline btn-xs"
										>
											Debug Storage
										</button>
										<button
											onclick={() => conversationStore.forceCleanup()}
											class="btn w-full btn-outline btn-xs btn-warning"
										>
											Force Cleanup
										</button>
										<button
											onclick={handleRetryConnection}
											class="btn w-full btn-outline btn-xs btn-info"
										>
											Retry Auto-Connect
										</button>
									</div>
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
