<script lang="ts">
	import { page } from '$app/state';
	import { browser, dev, building, version } from '$app/environment';
	import { conversationStore } from '$lib/stores/conversation.store.svelte';
	import { settingsStore } from '$lib/stores/settings.store.svelte';
	import AudioVisualizer from '$lib/components/AudioVisualizer.svelte';
	import LoadingScreen from '$lib/components/LoadingScreen.svelte';
	import MessageBubble from '$lib/components/MessageBubble.svelte';
	import { invalidateAll } from '$app/navigation';

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

	// Manual message input
	let messageInput = $state('');

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

<div class="mx-auto max-w-4xl p-8 font-sans">
	<header class="mb-8 text-center">
		<h1 class="mb-2 text-4xl font-bold text-primary">{selectedLanguage?.name} Conversation</h1>
		{#if userId}
			<p class="text-lg text-base-content/70">Welcome back, user!</p>
		{:else}
			<p class="text-lg text-base-content/70">Guest mode - your conversation won't be saved</p>
		{/if}

		<!-- Dev mode indicator -->
		{#if dev}
			<div
				class="mt-2 inline-flex items-center gap-2 rounded-full bg-warning/20 px-3 py-1 text-sm text-warning-content"
			>
				<span class="relative flex h-2 w-2">
					<span
						class="absolute inline-flex h-full w-full animate-ping rounded-full bg-warning opacity-75"
					></span>
					<span class="relative inline-flex h-2 w-2 rounded-full bg-warning"></span>
				</span>
				Development Mode
			</div>
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
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
							/></svg
						>
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
					<button onclick={handleStopStreaming} class="btn btn-lg btn-warning">
						Stop Streaming
					</button>
					<button onclick={handleEndConversation} class="btn btn-lg btn-error">
						End Conversation
					</button>
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

		<!-- Debug information - Dev only -->
		{#if dev}
			<div class="mt-4 text-sm text-base-content/60">
				<p>Audio Level: {Math.round(audioLevel * 100)}%</p>
				<p>Raw Value: {audioLevel.toFixed(4)}</p>
				<p>Status: {status}</p>
				<button
					onclick={() => conversationStore.testAudioLevel()}
					class="btn mt-2 btn-outline btn-sm"
				>
					Test Audio Level
				</button>
			</div>
		{/if}
		<!-- Session Configuration Panel - Dev only -->
		{#if dev && (status === 'connected' || status === 'streaming')}
			<div class="card my-8 border border-base-300 bg-base-100 p-6 shadow-lg">
				<h3 class="mb-4 text-xl font-semibold text-primary">Session Configuration</h3>

				<!-- Language Information -->
				<div class="mb-4 rounded-lg bg-base-200 p-3">
					<h4 class="mb-2 font-semibold text-base-content">Current Language</h4>
					<div class="flex items-center gap-2">
						<span class="text-2xl">🌍</span>
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
					<h4 class="mb-2 font-semibold text-base-content">Turn Detection</h4>
					<p class="mb-3 text-sm text-base-content/60">
						Settings are automatically optimized for {selectedLanguage?.name ||
							'your selected language'}. Adjust these to fine-tune the conversation flow.
					</p>
					<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
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
								<span class="label-text-alt">Wait for pauses</span>
							</label>
							<input
								id="silence-duration"
								type="range"
								min="200"
								max="1500"
								step="100"
								value="600"
								onchange={(e) => {
									const silence = parseInt((e.target as HTMLInputElement).value);
									conversationStore.updateSessionConfig({
										turnDetection: {
											threshold: 0.45,
											prefix_padding_ms: 300,
											silence_duration_ms: silence
										}
									});
								}}
								class="range range-accent range-sm"
							/>
							<div class="mt-1 text-xs text-base-content/60">600ms</div>
						</div>
					</div>
				</div>

				<!-- Instructions Update -->
				<div class="mb-4">
					<label class="label" for="ai-instructions">
						<span class="label-text">AI Instructions</span>
						<span class="label-text-alt">Customize AI behavior</span>
					</label>
					<textarea
						id="ai-instructions"
						class="textarea-bordered textarea w-full"
						rows="3"
						placeholder="Customize how the AI should behave..."
						onblur={(e) => {
							const instructions = (e.target as HTMLTextAreaElement).value;
							if (instructions.trim()) {
								conversationStore.updateSessionConfig({ instructions });
							}
						}}
					></textarea>
				</div>

				<!-- Preset Configurations -->
				<div class="mb-4">
					<div class="label">
						<span class="label-text">Preset Configurations</span>
						<span class="label-text-alt">Quick setup for different styles</span>
					</div>
					<div class="flex flex-wrap gap-2">
						<button
							class="btn btn-outline btn-sm"
							onclick={() => {
								conversationStore.updateSessionConfig({
									turnDetection: {
										threshold: 0.35,
										prefix_padding_ms: 200,
										silence_duration_ms: 400
									}
								});
							}}
						>
							Fast-paced
						</button>
						<button
							class="btn btn-outline btn-sm"
							onclick={() => {
								conversationStore.updateSessionConfig({
									turnDetection: {
										threshold: 0.55,
										prefix_padding_ms: 400,
										silence_duration_ms: 800
									}
								});
							}}
						>
							Relaxed
						</button>
						<button
							class="btn btn-outline btn-sm"
							onclick={() => {
								conversationStore.updateSessionConfig({
									turnDetection: {
										threshold: 0.45,
										prefix_padding_ms: 300,
										silence_duration_ms: 600
									}
								});
							}}
						>
							Balanced
						</button>
					</div>
				</div>
			</div>
		{/if}

		<!-- Dev Console - Dev only -->
		{#if dev || status === 'connected' || status === 'streaming'}
			<div class="card my-8 border border-base-300 bg-base-100 p-6 shadow-lg">
				<h3 class="mb-4 text-xl font-semibold text-warning">🛠️ Development Console</h3>

				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<!-- Real-time Data -->
					<div>
						<h4 class="mb-2 font-semibold text-base-content">Real-time Data</h4>
						<div class="space-y-2 text-sm">
							<div class="flex justify-between">
								<span>Audio Level:</span>
								<span class="font-mono">{audioLevel.toFixed(4)}</span>
							</div>
							<div class="flex justify-between">
								<span>Session ID:</span>
								<span class="font-mono text-xs">{conversationStore.sessionId || 'None'}</span>
							</div>
							<div class="flex justify-between">
								<span>Start Time:</span>
								<span class="font-mono">
									{conversationStore.startTime
										? new Date(conversationStore.startTime).toLocaleTimeString()
										: 'Not started'}
								</span>
							</div>
							<div class="flex justify-between">
								<span>Messages:</span>
								<span class="font-mono">{messages.length}</span>
							</div>
						</div>
					</div>

					<!-- Quick Actions -->
					<div>
						<h4 class="mb-2 font-semibold text-base-content">Quick Actions</h4>
						<div class="space-y-2">
							<button
								onclick={() => {
									console.log('🎯 Current conversation state:', {
										status: conversationStore.status,
										audioLevel: audioLevel,
										messages: conversationStore.messages,
										language: conversationStore.language
									});
								}}
								class="btn w-full btn-outline btn-sm"
							>
								Log State to Console
							</button>
							<button
								onclick={() => {
									const debugInfo = conversationStore.getDebugInfo();
									console.log('🔍 Detailed Debug Info:', debugInfo);
									alert(
										`Debug info logged to console!\nStatus: ${debugInfo.status}\nAudio Level: ${debugInfo.audioLevel.toFixed(4)}\nMessages: ${debugInfo.messages}`
									);
								}}
								class="btn w-full btn-outline btn-sm"
							>
								Detailed Debug Info
							</button>
							<button
								onclick={() => {
									conversationStore.testAudioLevel();
								}}
								class="btn w-full btn-outline btn-sm"
							>
								Test Audio Level
							</button>
							<button
								onclick={() => {
									// Force a small audio level update for testing
									conversationStore.audioLevel = Math.random() * 0.5;
								}}
								class="btn w-full btn-outline btn-sm"
							>
								Simulate Audio Input
							</button>
							<button
								onclick={() => {
									// Show current session configuration
									const config = {
										language: conversationStore.language?.name || 'Unknown',
										voice: conversationStore.voice,
										status: conversationStore.status,
										sessionId: conversationStore.sessionId
									};
									console.log('⚙️ Current Session Config:', config);
									alert(
										`Session Config:\nLanguage: ${config.language}\nVoice: ${config.voice}\nStatus: ${config.status}\nSession ID: ${config.sessionId || 'None'}`
									);
								}}
								class="btn w-full btn-outline btn-sm"
							>
								Show Session Config
							</button>
						</div>
					</div>
				</div>

				<!-- Environment Info -->
				<div class="mt-4 rounded-lg bg-base-200 p-3">
					<h4 class="mb-2 font-semibold text-base-content">Environment</h4>
					<div class="grid grid-cols-2 gap-4 text-sm">
						<div>
							<span class="font-medium">Browser:</span>
							{browser ? '✅ Yes' : '❌ No'}
						</div>
						<div>
							<span class="font-medium">Dev Mode:</span>
							{dev ? '✅ Yes' : '❌ No'}
						</div>
						<div>
							<span class="font-medium">Building:</span>
							{building ? '✅ Yes' : '❌ No'}
						</div>
						<div>
							<span class="font-medium">Version:</span>
							{version || 'N/A'}
						</div>
						<div>
							<span class="font-medium">User ID:</span>
							{userId || 'Guest'}
						</div>
						<div>
							<span class="font-medium">Language:</span>
							{selectedLanguage?.code || 'None'}
						</div>
					</div>
				</div>

				<!-- Page Data - Dev only -->
				{#if dev && page.data}
					<div class="mt-4 rounded-lg bg-base-200 p-3">
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
