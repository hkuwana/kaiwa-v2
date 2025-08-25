<script lang="ts">
	import { page } from '$app/state';
	import { browser, dev, building, version } from '$app/environment';
	import { conversationStore } from '$lib/stores/conversation.store.svelte';
	import { settingsStore, usePersistentSettings } from '$lib/stores/settings.store.svelte';
	import AudioVisualizer from '$lib/components/AudioVisualizer.svelte';
	import LoadingScreen from '$lib/components/LoadingScreen.svelte';
	import MessageBubble from '$lib/components/MessageBubble.svelte';
	import { invalidateAll } from '$app/navigation';
	import { onDestroy } from 'svelte';

	// Get user ID from page data (from your +layout.server.ts)
	const userId = page.data.user?.id ?? null;

	// Use $derived to get reactive values from the store
	let status = $derived(conversationStore.status);
	let messages = $derived(conversationStore.messages);
	let audioLevel = $derived(conversationStore.reactiveAudioLevel);

	let error = $derived(conversationStore.error);
	let availableDevices = $derived(conversationStore.availableDevices);
	let selectedDeviceId = $derived(conversationStore.selectedDeviceId);

	// Get settings from settings store
	let selectedLanguage = $derived(settingsStore.selectedLanguage);
	let selectedSpeaker = $derived(settingsStore.selectedSpeaker);

	// Get persistent settings utilities
	const persistentSettings = usePersistentSettings();

	// Ensure persistence is set up when component mounts
	$effect(() => {
		if (browser) {
			settingsStore.ensurePersistence();
		}
	});

	// Enhanced cleanup when leaving the conversation page
	onDestroy(() => {
		console.log('🧹 Conversation page component destroying, cleaning up...');

		// End any active conversation
		if (conversationStore.status === 'connected' || conversationStore.status === 'streaming') {
			console.log('🔄 Ending active conversation before component destruction');
			conversationStore.endConversation();
		}

		// Force cleanup of realtime connection
		conversationStore.forceCleanup();

		console.log('✅ Conversation page cleanup complete');
	});

	// Handle browser page close/refresh
	if (browser) {
		const handleBeforeUnload = () => {
			console.log('🧹 Browser closing/refreshing, cleaning up...');

			// End any active conversation
			if (conversationStore.status === 'connected' || conversationStore.status === 'streaming') {
				console.log('🔄 Ending active conversation before page unload');
				conversationStore.endConversation();
			}

			// Force cleanup
			conversationStore.forceCleanup();
		};

		// Handle page visibility changes (tab switching, minimizing)
		const handleVisibilityChange = () => {
			if (document.hidden) {
				console.log('🧹 Page hidden (tab switch/minimize), cleaning up...');

				// End any active conversation when page becomes hidden
				if (conversationStore.status === 'connected' || conversationStore.status === 'streaming') {
					console.log('🔄 Ending active conversation due to page visibility change');
					conversationStore.endConversation();
				}
			}
		};

		// Add event listeners
		window.addEventListener('beforeunload', handleBeforeUnload);
		document.addEventListener('visibilitychange', handleVisibilityChange);

		// Clean up event listeners on component destroy
		onDestroy(() => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		});
	}

	// Manual message input
	let messageInput = $state('');

	// Dev mode toggle
	let showDevTools = $state(dev);

	function handleStart() {
		if (selectedLanguage) {
			conversationStore.startConversation(selectedLanguage, selectedSpeaker);
		} else {
			console.error('No language selected');
		}
	}

	function handleStartStreaming() {
		conversationStore.startStreaming();
	}

	function handleStopStreaming() {
		conversationStore.stopStreaming();
	}

	function handleEndConversation() {
		conversationStore.endConversation();
	}

	function handleSelectDevice(deviceId: string) {
		conversationStore.selectDevice(deviceId);
	}

	function handleClearError() {
		conversationStore.clearError();
		invalidateAll();
	}

	function handleSendMessage() {
		if ((messageInput.trim() && status === 'connected') || status === 'streaming') {
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
</script>

<div class="mx-auto max-w-7xl p-8 font-sans">
	<!-- User Experience Section (Left Side) -->
	<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
		<!-- Main Conversation Area (2/3 width) -->
		<div class="lg:col-span-2">
			<header class="mb-8 text-center">
				<h1 class="mb-2 text-4xl font-bold text-primary">{selectedLanguage?.name} Conversation</h1>
				{#if userId}
					<p class="text-lg text-base-content/70">Welcome back, user!</p>
				{:else}
					<p class="text-lg text-base-content/70">Guest mode - your conversation won't be saved</p>
				{/if}
			</header>

			<main>
				{#if status === 'idle' || status === 'error'}
					<div class="card my-8 border border-base-300 bg-base-100 p-8 text-center shadow-lg">
						<button onclick={handleStart} class="btn btn-lg btn-primary">Start Conversation</button>
						{#if error}
							<div class="mt-4 alert alert-error">
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
								<span>Something went wrong: {error}</span>
								<button onclick={handleClearError} class="btn btn-outline btn-sm">Try Again</button>
							</div>
						{/if}
					</div>
				{:else if status === 'connecting'}
					<LoadingScreen />
				{:else if status === 'connected'}
					<div class="card my-8 border border-base-300 bg-base-100 p-8 text-center shadow-lg">
						<p class="mb-4 text-xl text-success">Connected! Ready to start streaming.</p>
						<div class="space-x-4">
							<button onclick={handleStartStreaming} class="btn btn-lg btn-success"
								>Start Streaming</button
							>
							<button onclick={handleEndConversation} class="btn btn-lg btn-error"
								>End Conversation</button
							>
						</div>
					</div>
				{:else if status === 'streaming'}
					<div class="card my-8 border border-base-300 bg-base-100 p-8 text-center shadow-lg">
						<div class="mt-4 space-x-4">
							<button onclick={handleStopStreaming} class="btn btn-lg btn-warning"
								>Stop Streaming</button
							>
							<button onclick={handleEndConversation} class="btn btn-lg btn-error"
								>End Conversation</button
							>
						</div>
					</div>
					<div class="flex justify-center">
						<AudioVisualizer {audioLevel} />
					</div>
				{/if}

				{#if messages.length > 0}
					<div class="card my-8 border border-base-300 bg-base-100 p-6 shadow-lg">
						<h3 class="mb-4 text-2xl font-semibold text-primary">Conversation</h3>
						<div class="space-y-3">
							{#each messages as message}
								<MessageBubble {message} />
							{/each}
						</div>
					</div>
				{/if}

				<!-- Live Transcription Display -->
				{#if status === 'streaming' && conversationStore.currentTranscript}
					<div class="card my-8 border border-base-300 bg-base-100 p-6 shadow-lg">
						<h3 class="mb-4 text-xl font-semibold text-info">🎤 Live Transcription</h3>
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
				{/if}

				{#if status === 'connected' || status === 'streaming'}
					<div class="card my-8 border border-base-300 bg-base-100 p-6 shadow-lg">
						<h3 class="mb-4 text-xl font-semibold text-primary">Send Message</h3>
						<div class="flex space-x-2">
							<input
								type="text"
								bind:value={messageInput}
								onkeypress={handleKeyPress}
								placeholder="Type your message..."
								class="input-bordered input flex-1"
							/>
							<button onclick={handleSendMessage} class="btn btn-primary">Send</button>
						</div>
					</div>
				{/if}

				{#if availableDevices.length > 0}
					<div class="card my-8 border border-base-300 bg-base-100 p-6 shadow-lg">
						<h3 class="mb-4 text-xl font-semibold text-primary">Audio Device</h3>
						<select
							value={selectedDeviceId}
							onchange={(e) => handleSelectDevice((e.target as HTMLSelectElement).value)}
							class="select-bordered select w-full"
						>
							{#each availableDevices as device}
								<option value={device.deviceId}>
									{device.label || `Device ${device.deviceId.slice(0, 8)}`}
								</option>
							{/each}
						</select>
					</div>
				{/if}
			</main>
		</div>

		<!-- Dev Tools Sidebar (Right Side) -->
		{#if dev}
			<div class="lg:col-span-1">
				<!-- Dev Toggle -->
				<div class="sticky top-8">
					<div class="card border border-warning/30 bg-warning/5 p-4">
						<div class="mb-4 flex items-center justify-between">
							<h3 class="text-lg font-bold text-warning">🛠️ Dev Tools</h3>
							<button onclick={() => (showDevTools = !showDevTools)} class="btn btn-sm btn-warning">
								{showDevTools ? 'Hide' : 'Show'}
							</button>
						</div>

						{#if showDevTools}
							<!-- Dev Mode Indicator -->
							<div
								class="mb-4 inline-flex items-center gap-2 rounded-full bg-warning/20 px-3 py-1 text-sm text-warning-content"
							>
								<span class="relative flex h-2 w-2">
									<span
										class="absolute inline-flex h-full w-full animate-ping rounded-full bg-warning opacity-75"
									></span>
									<span class="relative inline-flex h-2 w-2 rounded-full bg-warning"></span>
								</span>
								Development Mode
							</div>

							<!-- All existing dev content goes here -->
							<div class="space-y-4">
								<!-- Status Debug Panel -->
								<div class="rounded-lg bg-base-200 p-3">
									<h4 class="mb-2 font-semibold text-base-content">Status Debug</h4>
									<div class="space-y-2 text-sm">
										<div class="flex items-center justify-between">
											<span class="font-medium">Status:</span>
											<span class="font-mono">{status}</span>
										</div>
										<div class="flex items-center justify-between">
											<span class="font-medium">Audio Level:</span>
											<span class="font-mono">{audioLevel.toFixed(4)}</span>
										</div>
										<div class="flex items-center justify-between">
											<span class="font-medium">Messages:</span>
											<span class="font-mono">{messages.length}</span>
										</div>
										<div class="flex items-center justify-between">
											<span class="font-medium">Language:</span>
											<span class="font-mono">{selectedLanguage?.code || 'None'}</span>
										</div>
									</div>
								</div>

								<!-- Session Configuration Panel -->
								{#if status === 'connected' || status === 'streaming'}
									<div class="rounded-lg bg-base-200 p-3">
										<h4 class="mb-2 font-semibold text-base-content">Session Configuration</h4>

										<!-- Language Information -->
										<div class="mb-4">
											<h5 class="mb-2 font-medium text-base-content">Current Language</h5>
											<div class="flex items-center gap-2">
												<span class="text-xl">🌍</span>
												<div>
													<p class="font-medium">{selectedLanguage?.name || 'Unknown'}</p>
													<p class="text-sm text-base-content/60">
														{selectedLanguage?.nativeName || ''} • {selectedLanguage?.code || ''}
													</p>
												</div>
											</div>
										</div>

										<!-- Turn Detection Settings -->
										<div class="mb-4">
											<h5 class="mb-2 font-medium text-base-content">Turn Detection</h5>
											<p class="mb-3 text-sm text-base-content/60">
												Settings are automatically optimized for {selectedLanguage?.name ||
													'your selected language'}.
											</p>
											<div class="space-y-3">
												<div>
													<label class="label" for="sensitivity-threshold">
														<span class="label-text">Sensitivity Threshold</span>
														<span class="label-text-alt">Lower = more sensitive</span>
													</label>
													<input
														id="sensitivity-threshold"
														type="range"
														min="0.1"
														max="0.9"
														step="0.05"
														value="0.45"
														onchange={(e) => {
															const threshold = parseFloat((e.target as HTMLInputElement).value);
															conversationStore.updateSessionConfig({
																turnDetection: {
																	threshold,
																	prefix_padding_ms: 300,
																	silence_duration_ms: 600
																}
															});
														}}
														class="range range-primary range-sm"
													/>
													<div class="mt-1 text-xs text-base-content/60">0.45</div>
												</div>

												<div>
													<label class="label" for="prefix-padding">
														<span class="label-text">Prefix Padding (ms)</span>
														<span class="label-text-alt">Capture speech start</span>
													</label>
													<input
														id="prefix-padding"
														type="range"
														min="100"
														max="1000"
														step="50"
														value="300"
														onchange={(e) => {
															const padding = parseInt((e.target as HTMLInputElement).value);
															conversationStore.updateSessionConfig({
																turnDetection: {
																	threshold: 0.45,
																	prefix_padding_ms: padding,
																	silence_duration_ms: 600
																}
															});
														}}
														class="range range-secondary range-sm"
													/>
													<div class="mt-1 text-xs text-base-content/60">300ms</div>
												</div>

												<div>
													<label class="label" for="silence-duration">
														<span class="label-text">Silence Duration (ms)</span>
														<span class="label-text-alt">Wait before turn end</span>
													</label>
													<input
														id="silence-duration"
														type="range"
														min="200"
														max="2000"
														step="100"
														value="600"
														onchange={(e) => {
															const duration = parseInt((e.target as HTMLInputElement).value);
															conversationStore.updateSessionConfig({
																turnDetection: {
																	threshold: 0.45,
																	prefix_padding_ms: 300,
																	silence_duration_ms: duration
																}
															});
														}}
														class="range range-accent range-sm"
													/>
													<div class="mt-1 text-xs text-base-content/60">600ms</div>
												</div>
											</div>
										</div>
									</div>
								{/if}

								<!-- Persistent Settings Debug Panel -->
								<div class="rounded-lg bg-base-200 p-3">
									<h4 class="mb-2 font-semibold text-base-content">Persistent Settings</h4>
									<div class="space-y-2 text-sm">
										<div class="flex items-center justify-between">
											<span class="font-medium">Current Language:</span>
											<span class="font-mono"
												>{selectedLanguage?.name || 'None'} ({selectedLanguage?.code ||
													'None'})</span
											>
										</div>
										<div class="flex items-center justify-between">
											<span class="font-medium">Current Speaker:</span>
											<span class="font-mono">{selectedSpeaker || 'None'}</span>
										</div>
										<div class="mt-3 flex flex-wrap gap-2">
											<button
												onclick={() => persistentSettings.debug()}
												class="btn btn-outline btn-xs"
											>
												Debug Storage
											</button>
											<button
												onclick={() => persistentSettings.reload()}
												class="btn btn-outline btn-xs"
											>
												Reload from Storage
											</button>
											<button
												onclick={() => persistentSettings.testPersistence()}
												class="btn btn-outline btn-xs btn-info"
											>
												Test Persistence
											</button>
											<button
												onclick={() => conversationStore.forceCleanup()}
												class="btn btn-outline btn-xs btn-warning"
											>
												Force Cleanup
											</button>
											<button
												onclick={() => persistentSettings.clear()}
												class="btn btn-outline btn-xs btn-error"
											>
												Clear All
											</button>
										</div>
									</div>
								</div>

								<!-- Page Data - Dev only -->
								{#if page.data}
									<div class="rounded-lg bg-base-200 p-3">
										<h4 class="mb-2 font-semibold text-base-content">Page Data</h4>
										<details class="text-sm">
											<summary class="cursor-pointer font-medium">Click to expand</summary>
											<pre class="mt-2 text-xs whitespace-pre-wrap">{JSON.stringify(
													page.data,
													null,
													2
												)}</pre>
										</details>
									</div>
								{/if}
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
