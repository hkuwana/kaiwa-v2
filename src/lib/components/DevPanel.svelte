<!-- 🧪 Clean DevPanel for PR #2 & #3 Testing -->
<script lang="ts">
	import { onMount, onDestroy, setContext, getContext } from 'svelte';
	import { audioService } from '$lib/services/audio.service';
	import type { RealtimeService } from '$lib/services';
	import type { ConversationStore } from '$lib/stores/conversation.store.svelte';

	// Use the exported instances that automatically handle browser/server
	// No need to manually instantiate or check browser environment

	// Reactive state for UI feedback
	let audioTestStatus = $state<'idle' | 'testing' | 'success' | 'error'>('idle');
	let realtimeTestStatus = $state<'idle' | 'testing' | 'success' | 'error'>('idle');
	let storeTestStatus = $state<'idle' | 'testing' | 'success' | 'error'>('idle');
	let audioTestError: string | null = $state(null);
	let realtimeTestError: string | null = $state(null);
	let storeTestError: string | null = $state(null);

	let audioStream = $state<MediaStream | null>(null);

	const conversationStore = getContext('conversation') as ConversationStore;
	const realtimeService = getContext('realtime') as RealtimeService;

	// PR #2 Tests - Individual Services
	async function testAudioService() {
		audioTestStatus = 'testing';
		audioTestError = null;

		try {
			console.log('🧪 Testing AudioService...');
			const stream = await audioService.getStream();
			audioStream = stream;

			audioTestStatus = 'success';
			console.log('✅ Success: Got MediaStream!', stream);
		} catch (e) {
			const errorMsg = e instanceof Error ? e.message : 'Unknown error';
			audioTestStatus = 'error';
			audioTestError = errorMsg;
			console.error('❌ Error in AudioService:', e);
		} finally {
			audioService.cleanup();
		}
	}

	async function testRealtimeService() {
		realtimeTestStatus = 'testing';
		realtimeTestError = null;

		try {
			console.log('🧪 Testing RealtimeService...');

			// First get a stream if we don't have one
			let stream = audioStream;
			if (!stream) {
				console.log('📡 Getting audio stream for RealtimeService...');
				stream = await audioService.getStream();
			}

			// Create a test session first
			console.log('🔗 Creating test session for RealtimeService...');
			const response = await fetch('/api/realtime-session', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					sessionId: 'test-realtime-' + Date.now(),
					model: 'gpt-4o-realtime-preview-2024-10-01',
					voice: 'alloy'
				})
			});

			if (!response.ok) {
				throw new Error(`Failed to create test session: ${response.statusText}`);
			}

			const sessionData = await response.json();
			const sessionUrl = `/api/realtime-session/${sessionData.id}`;
			console.log('✅ Test session created:', sessionData.id);

			console.log('📡 Connecting RealtimeService with stream...');

			// Create a promise that resolves when connection is established or fails
			let connectionEstablished = false;
			let connectionFailed = false;

			// Create a test session first
			console.log('🔗 Creating test session for RealtimeService...');
			const realtimeResponse = await fetch('/api/realtime-session', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					sessionId: 'test-realtime-' + Date.now(),
					model: 'gpt-4o-realtime-preview-2024-10-01',
					voice: 'alloy'
				})
			});

			if (!realtimeResponse.ok) {
				throw new Error(`Failed to create test session: ${realtimeResponse.statusText}`);
			}

			const realtimeSessionData = await realtimeResponse.json();
			console.log('✅ Test session created:', realtimeSessionData.session_id);

			await realtimeService.connectWithSession(
				realtimeSessionData,
				stream,
				(message) => console.log('📨 Message received:', message),
				(state) => {
					console.log('🔌 Connection state:', state);
					if (state === 'connected') {
						connectionEstablished = true;
					} else if (state === 'failed' || state === 'closed') {
						connectionFailed = true;
					}
				}
			);

			// Wait a bit for the connection to establish
			await new Promise((resolve) => setTimeout(resolve, 2000));

			if (connectionEstablished) {
				realtimeTestStatus = 'success';
				console.log('✅ Success: RealtimeService connected successfully');
			} else if (connectionFailed) {
				throw new Error('Connection failed or closed');
			} else {
				// Check current connection state
				const currentState = realtimeService.getConnectionState();
				if (currentState === 'connected') {
					realtimeTestStatus = 'success';
					console.log('✅ Success: RealtimeService connected successfully');
				} else {
					throw new Error(`Connection not established, current state: ${currentState}`);
				}
			}
		} catch (e) {
			const errorMsg = e instanceof Error ? e.message : 'Unknown error';
			realtimeTestStatus = 'error';
			realtimeTestError = errorMsg;
			console.error('❌ Error in RealtimeService:', e);
		} finally {
			realtimeService.disconnect();
		}
	}

	// PR #3 Test - Store Orchestration
	async function testStoreOrchestration() {
		storeTestStatus = 'testing';
		storeTestError = null;

		try {
			console.log('🧪 Testing Conversation Store Orchestration...');

			// Clear any previous state
			conversationStore.reset();

			// Start the conversation
			await conversationStore.startConversation();

			// Wait for the connection to be established
			let attempts = 0;
			const maxAttempts = 10;

			while (conversationStore.status !== 'connected' && attempts < maxAttempts) {
				await new Promise((resolve) => setTimeout(resolve, 1000));
				attempts++;
				console.log(
					`🔄 Waiting for connection... Attempt ${attempts}/${maxAttempts}, Status: ${conversationStore.status}`
				);
			}

			if (conversationStore.status === 'connected') {
				storeTestStatus = 'success';
				console.log('✅ Success: Conversation store orchestration completed successfully');
			} else {
				throw new Error(
					`Failed to establish connection. Final status: ${conversationStore.status}, Error: ${conversationStore.error}`
				);
			}
		} catch (e) {
			const errorMsg = e instanceof Error ? e.message : 'Unknown error';
			storeTestStatus = 'error';
			storeTestError = errorMsg;
			console.error('❌ Error in Conversation Store:', e);
		} finally {
			// Clean up the conversation store
			conversationStore.endConversation();
		}
	}

	function clearResults() {
		audioTestStatus = 'idle';
		realtimeTestStatus = 'idle';
		storeTestStatus = 'idle';
		audioTestError = null;
		realtimeTestError = null;
		storeTestError = null;
		audioStream = null;

		// Clean up services
		audioService.cleanup();
		realtimeService.disconnect();

		// Reset conversation store
		conversationStore.reset();

		console.log('🧹 All tests cleared and services reset');
	}

	function getStatusIcon(result: typeof audioTestStatus) {
		if (result === 'testing') return '🔄';
		if (result === 'success') return '✅';
		if (result === 'error') return '❌';
		return '⚪';
	}
</script>

<div class="container mx-auto max-w-4xl p-6">
	<header class="mb-8 text-center">
		<h1 class="mb-4 text-4xl font-bold text-primary">🧪 PR #2 & #3 Test Suite</h1>
		<p class="mb-6 text-lg opacity-70">
			Test isolated services and store orchestration. Open the console to see detailed logs.
		</p>
		<button onclick={clearResults} class="btn btn-outline btn-sm"> 🧹 Clear Results </button>
	</header>

	<!-- Test Results Summary -->
	<div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
		<div class="card bg-base-100 shadow-md">
			<div class="card-body">
				<h3 class="card-title flex items-center gap-2 text-lg">
					{getStatusIcon(audioTestStatus)}
					🎵 Audio Service
				</h3>
				<p class="mb-4 text-sm opacity-70">PR #2: Test audio stream acquisition</p>
				<button
					onclick={testAudioService}
					class="btn btn-primary {audioTestStatus === 'testing' ? 'loading' : ''}"
					disabled={audioTestStatus === 'testing'}
				>
					{audioTestStatus === 'testing' ? 'Testing...' : 'Test Audio Service'}
				</button>
				{#if audioTestError}
					<div class="mt-4 rounded bg-error/20 p-3 text-error">
						<p class="text-sm">{audioTestError}</p>
					</div>
				{/if}
			</div>
		</div>

		<div class="card bg-base-100 shadow-md">
			<div class="card-body">
				<h3 class="card-title flex items-center gap-2 text-lg">
					{getStatusIcon(realtimeTestStatus)}
					📡 Realtime Service
				</h3>
				<p class="mb-4 text-sm opacity-70">PR #2: Test WebRTC connection with stream</p>
				<button
					onclick={testRealtimeService}
					class="btn btn-secondary {realtimeTestStatus === 'testing' ? 'loading' : ''}"
					disabled={realtimeTestStatus === 'testing'}
				>
					{realtimeTestStatus === 'testing' ? 'Testing...' : 'Test Realtime Service'}
				</button>
				{#if realtimeTestError}
					<div class="mt-4 rounded bg-error/20 p-3 text-error">
						<p class="text-sm">{realtimeTestError}</p>
					</div>
				{/if}
			</div>
		</div>

		<div class="card bg-base-100 shadow-md">
			<div class="card-body">
				<h3 class="card-title flex items-center gap-2 text-lg">
					{getStatusIcon(storeTestStatus)}
					🎭 Store Orchestration
				</h3>
				<p class="mb-4 text-sm opacity-70">PR #3: Test complete conversation flow</p>
				<button
					onclick={testStoreOrchestration}
					class="btn btn-accent {storeTestStatus === 'testing' ? 'loading' : ''}"
					disabled={storeTestStatus === 'testing'}
				>
					{storeTestStatus === 'testing' ? 'Testing...' : 'Test Store Flow'}
				</button>
				{#if storeTestError}
					<div class="mt-4 rounded bg-error/20 p-3 text-error">
						<p class="text-sm">{storeTestError}</p>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Live Store State -->
	<div class="card mb-8 bg-base-100 shadow-md">
		<div class="card-body">
			<h3 class="mb-4 card-title text-lg">📊 Live Conversation Store State</h3>
			<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
				<div class="stat">
					<div class="stat-title">Status</div>
					<div
						class="stat-value text-sm {conversationStore.status === 'connected'
							? 'text-success'
							: conversationStore.status === 'connecting'
								? 'text-warning'
								: conversationStore.status === 'error'
									? 'text-error'
									: 'text-base-content'}"
					>
						{conversationStore.status}
					</div>
				</div>
				<div class="stat">
					<div class="stat-title">Messages</div>
					<div class="stat-value text-sm">{conversationStore.messages.length}</div>
				</div>
				<div class="stat">
					<div class="stat-title">Audio Level</div>
					<div class="stat-value text-sm">{Math.round(conversationStore.audioLevel * 100)}%</div>
				</div>
				<div class="stat">
					<div class="stat-title">Error</div>
					<div class="stat-value text-sm {conversationStore.error ? 'text-error' : 'text-success'}">
						{conversationStore.error || 'None'}
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Instructions -->
	<div class="alert alert-info">
		<svg class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
			></path>
		</svg>
		<div>
			<h4 class="font-bold">Testing Instructions</h4>
			<div class="text-sm">
				<p class="mb-2">
					<strong>PR #2 Goal:</strong> Services work independently without Svelte dependencies
				</p>
				<p class="mb-2">
					<strong>PR #3 Goal:</strong> Store orchestrates services and manages state properly
				</p>
				<p>
					<strong>Success Criteria:</strong> All three tests should show ✅ success messages in console
				</p>
			</div>
		</div>
	</div>
</div>
