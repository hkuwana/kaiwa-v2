<!-- Test Full Integration -->
<script lang="ts">
	import { createConversationStore } from '$lib/stores/conversation.svelte';

	const store = createConversationStore();

	let messageInput = $state('');
	let selectedLanguage = $state('en');
	let selectedVoice = $state('alloy');

	const languages = [
		{ code: 'en', name: 'English' },
		{ code: 'es', name: 'Spanish' },
		{ code: 'fr', name: 'French' },
		{ code: 'de', name: 'German' },
		{ code: 'ja', name: 'Japanese' }
	];

	const voices = [
		{ id: 'alloy', name: 'Alloy' },
		{ id: 'echo', name: 'Echo' },
		{ id: 'fable', name: 'Fable' },
		{ id: 'onyx', name: 'Onyx' },
		{ id: 'nova', name: 'Nova' },
		{ id: 'shimmer', name: 'Shimmer' }
	];

	function handleStart() {
		store.start(selectedLanguage, selectedVoice);
	}

	function handleStop() {
		store.stop();
	}

	function handleSendMessage() {
		if (messageInput.trim()) {
			store.sendMessage(messageInput.trim());
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

<div class="container">
	<h1>🚀 Full Integration Test</h1>
	<p>Test the complete conversation system with all features integrated</p>

	<div class="setup-section">
		<h2>⚙️ Configuration</h2>

		<div class="config-grid">
			<div class="config-item">
				<label for="language">Language:</label>
				<select
					id="language"
					bind:value={selectedLanguage}
					disabled={store.isConnecting || store.isConnected}
				>
					{#each languages as lang}
						<option value={lang.code}>{lang.name}</option>
					{/each}
				</select>
			</div>

			<div class="config-item">
				<label for="voice">Voice:</label>
				<select
					id="voice"
					bind:value={selectedVoice}
					disabled={store.isConnecting || store.isConnected}
				>
					{#each voices as voice}
						<option value={voice.id}>{voice.name}</option>
					{/each}
				</select>
			</div>

			<div class="config-item">
				<label for="device">Audio Device:</label>
				<select
					id="device"
					bind:value={store.selectedDevice}
					disabled={store.isConnecting || store.isConnected}
				>
					<option value="default">Default Device</option>
					{#each store.devices as device}
						<option value={device.deviceId}>
							{device.label || `Device ${device.deviceId.slice(0, 8)}...`}
						</option>
					{/each}
				</select>
			</div>
		</div>
	</div>

	<div class="control-section">
		<h2>🎮 Controls</h2>

		<div class="control-buttons">
			{#if !store.isConnected && !store.isConnecting}
				<button on:click={handleStart} class="start-btn"> 🚀 Start Conversation </button>
			{:else if store.isConnecting}
				<button disabled class="connecting-btn"> 🔄 Connecting... </button>
			{:else}
				<button on:click={handleStop} class="stop-btn"> ⏹️ Stop Conversation </button>
			{/if}
		</div>

		{#if store.error}
			<div class="error-message">
				❌ Error: {store.error}
				<button on:click={() => store.clearError()} class="clear-error-btn"> ✕ </button>
			</div>
		{/if}
	</div>

	{#if store.isConnected}
		<div class="conversation-section">
			<h2>💬 Conversation</h2>

			<div class="message-input">
				<textarea
					bind:value={messageInput}
					placeholder="Type your message here..."
					on:keypress={handleKeyPress}
					class="message-field"
					rows="3"
				></textarea>
				<button on:click={handleSendMessage} class="send-btn"> 📤 Send </button>
			</div>

			<div class="messages-container">
				<h3>Messages ({store.messages.length})</h3>

				<div class="messages-list">
					{#each store.messages as message}
						<div class="message-item {message.role}">
							<div class="message-header">
								<span class="message-role">
									{message.role === 'user' ? '👤 You' : '🤖 Assistant'}
								</span>
								<span class="message-time">
									{new Date(message.timestamp).toLocaleTimeString()}
								</span>
							</div>
							<div class="message-content">
								{message.content}
							</div>
						</div>
					{/each}

					{#if store.messages.length === 0}
						<p class="no-messages">No messages yet. Start the conversation to begin!</p>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	<div class="status-section">
		<h2>📊 System Status</h2>

		<div class="status-grid">
			<div class="status-item">
				<span class="label">Connection:</span>
				<span
					class="value {store.isConnected ? 'success' : store.isConnecting ? 'warning' : 'error'}"
				>
					{store.isConnected
						? '✅ Connected'
						: store.isConnecting
							? '🔄 Connecting'
							: '❌ Disconnected'}
				</span>
			</div>

			<div class="status-item">
				<span class="label">Language:</span>
				<span class="value">{store.currentLanguage}</span>
			</div>

			<div class="status-item">
				<span class="label">Voice:</span>
				<span class="value">{store.currentVoice}</span>
			</div>

			<div class="status-item">
				<span class="label">Device:</span>
				<span class="value">{store.selectedDevice}</span>
			</div>

			<div class="status-item">
				<span class="label">Messages:</span>
				<span class="value">{store.messages.length}</span>
			</div>
		</div>
	</div>

	<div class="info-section">
		<h2>ℹ️ Integration Info</h2>
		<p>This page demonstrates the complete integration of:</p>
		<ul>
			<li>✅ Audio Device Management</li>
			<li>✅ WebRTC Connection</li>
			<li>✅ Conversation State Management</li>
			<li>✅ Reactive UI with Svelte 5 Runes</li>
		</ul>
		<p>Each layer is tested independently and then integrated seamlessly.</p>
	</div>
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		font-family:
			system-ui,
			-apple-system,
			sans-serif;
	}

	h1 {
		color: #2563eb;
		margin-bottom: 0.5rem;
	}

	.setup-section,
	.control-section,
	.conversation-section,
	.status-section,
	.info-section {
		margin: 2rem 0;
		padding: 1.5rem;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		background: #f9fafb;
	}

	.config-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1rem;
		margin: 1rem 0;
	}

	.config-item {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	label {
		font-weight: 500;
		color: #374151;
	}

	select {
		padding: 0.5rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		background: white;
		font-size: 0.875rem;
	}

	select:disabled {
		background: #f3f4f6;
		color: #6b7280;
	}

	.control-buttons {
		margin: 1rem 0;
	}

	button {
		background: #2563eb;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.875rem;
		margin-right: 0.5rem;
	}

	button:hover:not(:disabled) {
		background: #1d4ed8;
	}

	button:disabled {
		background: #9ca3af;
		cursor: not-allowed;
	}

	.start-btn {
		background: #059669;
		font-size: 1rem;
		padding: 1rem 2rem;
	}

	.start-btn:hover {
		background: #047857;
	}

	.connecting-btn {
		background: #f59e0b;
	}

	.stop-btn {
		background: #dc2626;
		font-size: 1rem;
		padding: 1rem 2rem;
	}

	.stop-btn:hover {
		background: #b91c1c;
	}

	.error-message {
		background: #fef2f2;
		color: #dc2626;
		padding: 0.75rem;
		border-radius: 6px;
		border: 1px solid #fecaca;
		margin-top: 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.clear-error-btn {
		background: #dc2626;
		padding: 0.25rem 0.5rem;
		margin: 0;
		font-size: 0.75rem;
	}

	.message-input {
		display: flex;
		gap: 0.5rem;
		margin: 1rem 0;
	}

	.message-field {
		flex: 1;
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 0.875rem;
		resize: vertical;
		font-family: inherit;
	}

	.send-btn {
		background: #7c3aed;
		align-self: flex-end;
	}

	.send-btn:hover {
		background: #6d28d9;
	}

	.messages-container {
		margin-top: 1.5rem;
	}

	.messages-list {
		max-height: 400px;
		overflow-y: auto;
		margin-top: 1rem;
	}

	.message-item {
		margin: 0.75rem 0;
		padding: 1rem;
		border-radius: 8px;
		border: 1px solid #d1d5db;
	}

	.message-item.user {
		background: #eff6ff;
		border-color: #3b82f6;
		margin-left: 2rem;
	}

	.message-item.assistant {
		background: #f0fdf4;
		border-color: #22c55e;
		margin-right: 2rem;
	}

	.message-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
	}

	.message-role {
		font-weight: 600;
		color: #374151;
	}

	.message-time {
		color: #6b7280;
		font-size: 0.75rem;
	}

	.message-content {
		color: #1f2937;
		line-height: 1.5;
	}

	.no-messages {
		text-align: center;
		color: #6b7280;
		font-style: italic;
		padding: 2rem;
	}

	.status-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin: 1rem 0;
	}

	.status-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem;
		background: white;
		border-radius: 6px;
		border: 1px solid #d1d5db;
	}

	.label {
		font-weight: 500;
	}

	.value.success {
		color: #059669;
	}

	.value.warning {
		color: #f59e0b;
	}

	.value.error {
		color: #dc2626;
	}

	ul {
		margin: 1rem 0;
		padding-left: 1.5rem;
	}

	li {
		margin: 0.25rem 0;
	}
</style>
