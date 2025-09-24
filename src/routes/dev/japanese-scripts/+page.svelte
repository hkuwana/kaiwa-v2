<!-- Japanese Script Generation Test Page -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { conversationStore } from '$lib/stores/conversation.store.svelte';
	import { userPreferencesStore } from '$lib/stores/user-preferences.store.svelte';
	import MessageBubble from '$lib/features/conversation/components/MessageBubble.svelte';
	import { SvelteDate } from 'svelte/reactivity';
	// import { getUserJapaneseScenarios } from '$lib/data/testing';

	// Test state
	let testText = $state('こんにちは、今日はどうですか？');
	let isProcessing = $state(false);
	let processedResult = $state<any>(null);
	let error = $state<string | null>(null);
	let language = $state<any>(null);

	// Message reactivity testing
	let testMessage = $state<any>(null);
	let messageUpdateCounter = $state(0);

	// Conversation state for testing
	const messages = $derived(conversationStore.messages);
	const conversationStatus = $derived(conversationStore.status);

	onMount(async () => {
		// Initialize services
		await userPreferencesStore.initialize();

		// Set Japanese as target language
		await userPreferencesStore.setLanguagePreferences('ja');

		// Load Japanese scenarios (disabled for now)
		// const japaneseScenarios = getUserJapaneseScenarios();
		// if (japaneseScenarios.length > 0) {
		// 	scenarioStore.setSelectedScenario(japaneseScenarios[0]);
		// }

		// Get language from scenarios
		language = {
			code: 'ja',
			name: 'Japanese',
			nativeName: '日本語'
		};
	});

	// Test direct script generation
	async function testDirectScriptGeneration() {
		if (!testText.trim()) return;

		isProcessing = true;
		error = null;
		processedResult = null;

		try {
			console.log('Testing direct script generation for:', testText);

			const response = await fetch('/api/furigana', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					text: testText,
					messageId: `test_${Date.now()}`
				})
			});

			if (!response.ok) {
				throw new Error(`API request failed: ${response.status}`);
			}

			processedResult = await response.json();
			console.log('Direct script generation result:', processedResult);
		} catch (err) {
			console.error('Direct script generation failed:', err);
			error = err instanceof Error ? err.message : 'Failed to generate scripts';
		} finally {
			isProcessing = false;
		}
	}

	// Test server-side script generation with database storage
	async function testServerScriptGeneration() {
		if (!testText.trim()) return;

		isProcessing = true;
		error = null;
		processedResult = null;

		try {
			const testMessageId = `test_${Date.now()}`;
			console.log('Testing server-side script generation with storage for:', testText);

			const response = await fetch(`/api/messages/${testMessageId}/generate-scripts`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					text: testText,
					language: 'ja'
				})
			});

			if (!response.ok) {
				throw new Error(`Server API request failed: ${response.status}`);
			}

			const result = await response.json();
			processedResult = result.data; // Extract the generated script data
			console.log('Server-side script generation result:', result);
		} catch (err) {
			console.error('Server script generation failed:', err);
			error = err instanceof Error ? err.message : 'Failed to generate and store scripts';
		} finally {
			isProcessing = false;
		}
	}

	// Test conversation flow
	async function testConversationFlow() {
		if (!language) {
			error = 'Language not initialized';
			return;
		}

		isProcessing = true;
		error = null;

		try {
			console.log('🇯🇵 Starting Japanese conversation - automatic script generation enabled...');
			console.log('Conversation language set to:', language.code, language.nativeName);

			// Start conversation (this will automatically detect and process Japanese)
			await conversationStore.startConversation(language);

			// Wait a moment for connection
			setTimeout(() => {
				// Send a test message (this should trigger automatic script generation because conversation.language = 'ja')
				conversationStore.sendMessage(testText);
				console.log('🚀 Sent test message to Japanese conversation:', testText);
				console.log(
					'📝 This should automatically trigger furigana/romaji generation for ANY text (even English) because conversation language is Japanese!'
				);
			}, 2000);
		} catch (err) {
			console.error('Conversation flow test failed:', err);
			error = err instanceof Error ? err.message : 'Failed to start conversation';
		} finally {
			isProcessing = false;
		}
	}

	// End conversation test
	function endConversation() {
		conversationStore.endConversation();
	}

	// Clear messages
	function clearMessages() {
		conversationStore.reset();
	}

	// Test with English text in Japanese conversation
	function testEnglishInJapaneseConversation() {
		const englishText = 'Hello, how are you today?';
		testText = englishText;
		console.log('🔄 Testing English text in Japanese conversation context...');
		console.log('This should still generate scripts because conversation.language = "ja"');
	}

	// Create a test message without scripts
	function createTestMessage() {
		testMessage = {
			id: `test_message_${Date.now()}`,
			role: 'assistant',
			content: testText,
			timestamp: new SvelteDate(),
			conversationId: 'test_conversation',
			audioUrl: null,
			translatedContent: null,
			sourceLanguage: null,
			targetLanguage: null,
			userNativeLanguage: null,
			romanization: null, // No scripts initially
			hiragana: null, // No scripts initially
			otherScripts: null, // No scripts initially
			translationConfidence: null,
			translationProvider: null,
			translationNotes: null,
			isTranslated: false,
			grammarAnalysis: null,
			vocabularyAnalysis: null,
			pronunciationScore: null,
			audioDuration: null,
			speechTimings: null,
			difficultyLevel: null,
			learningTags: null,
			conversationContext: null,
			messageIntent: null
		};
		messageUpdateCounter++;
		console.log('🔨 Created test message:', testMessage);
	}

	// Update the test message with scripts
	async function updateMessageWithScripts() {
		if (!testMessage) {
			console.error('No test message to update');
			return;
		}

		isProcessing = true;
		try {
			console.log('📝 Updating message with scripts...');

			// Call the script generation API
			const response = await fetch(`/api/messages/${testMessage.id}/generate-scripts`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					text: testMessage.content,
					language: 'ja'
				})
			});

			const result = await response.json();
			console.log('📋 Script generation result:', result);

			if (result.success && result.data) {
				// Update the message object to trigger reactivity
				testMessage = {
					...testMessage,
					hiragana: result.data.hiragana,
					romanization: result.data.romanization,
					otherScripts: result.data.otherScripts || {}
				};
				messageUpdateCounter++;
				console.log('✅ Updated test message with scripts:', testMessage);
			}
		} catch (err) {
			console.error('❌ Failed to update message with scripts:', err);
			error = err instanceof Error ? err.message : 'Script update failed';
		} finally {
			isProcessing = false;
		}
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-base-100 to-base-200 p-8">
	<div class="mx-auto max-w-4xl">
		<!-- Header -->
		<div class="mb-8 text-center">
			<h1 class="mb-4 text-4xl font-bold text-primary">🇯🇵 Japanese Script Generation Test</h1>
			<p class="text-lg text-base-content/70">
				Test automatic furigana and romaji generation for Japanese text in conversations
			</p>
		</div>

		<!-- Error Display -->
		{#if error}
			<div class="mb-6 alert alert-error">
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
				<span>{error}</span>
				<button onclick={() => (error = null)} class="btn btn-ghost btn-sm">✕</button>
			</div>
		{/if}

		<!-- Test Input -->
		<div class="card mb-8 bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title">🎯 Test Input</h2>

				<div class="form-control">
					<label for="japanese-text" class="label">
						<span class="label-text">Japanese Text to Process:</span>
					</label>
					<input
						id="japanese-text"
						bind:value={testText}
						type="text"
						placeholder="こんにちは、今日はどうですか？"
						class="input-bordered input w-full"
					/>
				</div>

				<div class="card-actions">
					<button
						onclick={testDirectScriptGeneration}
						class="btn btn-primary"
						disabled={isProcessing || !testText.trim()}
					>
						{isProcessing ? 'Processing...' : 'Test Direct API'}
					</button>

					<button
						onclick={testServerScriptGeneration}
						class="btn btn-accent"
						disabled={isProcessing || !testText.trim()}
					>
						{isProcessing ? 'Processing...' : 'Test Server + DB'}
					</button>

					<button
						onclick={testConversationFlow}
						class="btn btn-secondary"
						disabled={isProcessing || !testText.trim() || conversationStatus === 'streaming'}
					>
						{isProcessing ? 'Processing...' : 'Test Conversation Flow'}
					</button>

					<button onclick={clearMessages} class="btn btn-outline"> Clear Messages </button>

					<button onclick={testEnglishInJapaneseConversation} class="btn btn-sm btn-info">
						Test English Text
					</button>
				</div>
			</div>
		</div>

		<!-- MessageBubble Reactivity Testing -->
		<div class="card mb-8 bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title">🧪 MessageBubble Reactivity Testing</h2>

				<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
					<!-- Controls -->
					<div>
						<h3 class="mb-4 font-semibold">Test Controls</h3>

						<div class="space-y-4">
							<div class="stats stats-vertical shadow">
								<div class="stat">
									<div class="stat-title">Message Updates</div>
									<div class="stat-value text-2xl">{messageUpdateCounter}</div>
									<div class="stat-desc">Reactivity counter</div>
								</div>
								<div class="stat">
									<div class="stat-title">Has Scripts</div>
									<div class="stat-value text-sm">
										{testMessage?.hiragana ? '✅ Yes' : '❌ No'}
									</div>
									<div class="stat-desc">Script data present</div>
								</div>
							</div>

							<div class="space-y-2">
								<button onclick={createTestMessage} class="btn w-full btn-primary">
									📝 Create Test Message
								</button>

								<button
									onclick={updateMessageWithScripts}
									class="btn w-full btn-secondary"
									disabled={!testMessage || isProcessing}
								>
									{isProcessing ? '⏳ Generating...' : '🎌 Add Japanese Scripts'}
								</button>
							</div>

							{#if testMessage}
								<div class="rounded bg-base-200 p-3 text-xs">
									<strong>Message Data:</strong><br />
									ID: {testMessage.id}<br />
									Hiragana: {testMessage.hiragana ? 'Present' : 'None'}<br />
									Romaji: {testMessage.romanization ? 'Present' : 'None'}<br />
									Other Scripts: {testMessage.otherScripts
										? Object.keys(testMessage.otherScripts).length
										: 0} items
								</div>
							{/if}
						</div>
					</div>

					<!-- MessageBubble Display -->
					<div>
						<h3 class="mb-4 font-semibold">MessageBubble Component</h3>

						{#if testMessage}
							<div class="rounded-lg border-2 border-dashed border-base-300 p-4">
								<div class="mb-2 text-xs text-base-content/50">
									👁️ Watch this MessageBubble react to script changes:
								</div>
								<MessageBubble message={testMessage} conversationLanguage="ja" />
							</div>

							<div class="mt-4 text-sm">
								<strong>Expected Behavior:</strong>
								<ul class="mt-2 list-inside list-disc space-y-1">
									<li>Initially shows "Generating furigana..." or original text</li>
									<li>After clicking "Add Japanese Scripts" should show furigana + romaji</li>
									<li>Should display ruby markup for kanji with readings</li>
								</ul>
							</div>
						{:else}
							<div
								class="rounded-lg border-2 border-dashed border-base-300 p-8 text-center text-base-content/50"
							>
								👆 Click "Create Test Message" to start testing
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<!-- Direct API Results -->
		{#if processedResult}
			<div class="card mb-8 bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="card-title text-success">✅ Direct API Results</h2>

					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						{#if processedResult.hiragana}
							<div class="rounded bg-base-200 p-4">
								<h3 class="mb-2 font-semibold">Hiragana:</h3>
								<p class="text-lg">{processedResult.hiragana}</p>
							</div>
						{/if}

						{#if processedResult.romanization}
							<div class="rounded bg-base-200 p-4">
								<h3 class="mb-2 font-semibold">Romaji:</h3>
								<p class="text-lg">{processedResult.romanization}</p>
							</div>
						{/if}

						{#if processedResult.katakana}
							<div class="rounded bg-base-200 p-4">
								<h3 class="mb-2 font-semibold">Katakana:</h3>
								<p class="text-lg">{processedResult.katakana}</p>
							</div>
						{/if}

						{#if processedResult.furigana}
							<div class="rounded bg-base-200 p-4">
								<h3 class="mb-2 font-semibold">Furigana HTML:</h3>
								<div class="text-lg">{@html processedResult.furigana}</div>
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}

		<!-- Conversation Status -->
		<div class="card mb-8 bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title">📡 Conversation Status</h2>

				<div class="stats stats-horizontal">
					<div class="stat">
						<div class="stat-title">Status</div>
						<div class="stat-value text-sm">{conversationStatus}</div>
					</div>

					<div class="stat">
						<div class="stat-title">Messages</div>
						<div class="stat-value">{messages.length}</div>
					</div>

					<div class="stat">
						<div class="stat-title">Language</div>
						<div class="stat-value text-sm">{language?.nativeName || 'Loading...'}</div>
					</div>
				</div>

				{#if conversationStatus !== 'idle'}
					<div class="card-actions">
						<button onclick={endConversation} class="btn btn-warning"> End Conversation </button>
					</div>
				{/if}
			</div>
		</div>

		<!-- Messages Display -->
		{#if messages.length > 0}
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="card-title">💬 Conversation Messages vs MessageBubble Comparison</h2>

					<div class="space-y-6">
						{#each messages as message}
							<div
								class="grid grid-cols-1 gap-4 rounded-lg border border-base-300 p-4 lg:grid-cols-2"
							>
								<!-- Raw Message Data -->
								<div class="space-y-3">
									<div class="mb-2 flex items-center gap-2">
										<span class="font-semibold capitalize">{message.role}:</span>
										<span class="text-sm opacity-70">{message.timestamp.toLocaleTimeString()}</span>
									</div>

									<div class="text-sm">
										<strong>Raw Message Data:</strong>
									</div>

									<!-- Original Content -->
									<div class="mb-3">
										<div class="text-xs text-base-content/60">Content:</div>
										<p class="rounded bg-base-200 p-2 text-base">{message.content}</p>
									</div>

									<!-- Japanese Scripts -->
									{#if message.hiragana || message.romanization || message.otherScripts}
										<div class="space-y-2 border-t pt-3">
											{#if message.hiragana}
												<div>
													<div class="text-xs text-base-content/60">Hiragana:</div>
													<div class="rounded bg-primary/10 p-2 text-sm">{message.hiragana}</div>
												</div>
											{/if}

											{#if message.romanization}
												<div>
													<div class="text-xs text-base-content/60">Romaji:</div>
													<div class="rounded bg-secondary/10 p-2 text-sm italic">
														{message.romanization}
													</div>
												</div>
											{/if}

											{#if message.otherScripts && typeof message.otherScripts === 'object' && 'katakana' in message.otherScripts}
												<div>
													<div class="text-xs text-base-content/60">Katakana:</div>
													<div class="rounded bg-accent/10 p-2 text-sm">
														{message.otherScripts.katakana}
													</div>
												</div>
											{/if}

											{#if message.otherScripts && typeof message.otherScripts === 'object' && 'furigana' in message.otherScripts}
												<div>
													<div class="text-xs text-base-content/60">Furigana:</div>
													<div class="rounded bg-info/10 p-2 text-sm">
														{@html message.otherScripts.furigana}
													</div>
												</div>
											{/if}
										</div>
									{:else}
										<div class="rounded bg-warning/10 p-2 text-sm text-warning">
											⚠️ No Japanese scripts in message data
										</div>
									{/if}
								</div>

								<!-- MessageBubble Rendering -->
								<div class="space-y-3">
									<div class="text-sm">
										<strong>MessageBubble Rendering:</strong>
									</div>

									<div class="rounded-lg border-2 border-dashed border-base-300 p-3">
										<div class="mb-2 text-xs text-base-content/50">
											👁️ How MessageBubble renders this data:
										</div>
										<MessageBubble {message} conversationLanguage="ja" />
									</div>

									<div class="rounded bg-base-200 p-2 text-xs">
										<strong>Debug Info:</strong><br />
										needsScripts: {message.hiragana || message.romanization
											? 'true'
											: 'should be true for ja conversation'}<br />
										hasScriptData: {message.hiragana || message.romanization || message.otherScripts
											? 'true'
											: 'false'}
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}

		<!-- Instructions -->
		<div class="card mt-8 bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title">📝 Testing Instructions</h2>

				<div class="space-y-4">
					<div>
						<h3 class="mb-2 font-semibold">1. Direct API Test:</h3>
						<ul class="list-inside list-disc space-y-1 text-sm">
							<li>Tests the `/api/furigana` endpoint directly</li>
							<li>Shows immediate results without conversation context</li>
							<li>Good for debugging script generation issues</li>
						</ul>
					</div>

					<div>
						<h3 class="mb-2 font-semibold">2. Server + DB Test:</h3>
						<ul class="list-inside list-disc space-y-1 text-sm">
							<li>Tests the new `/api/messages/[id]/generate-scripts` endpoint</li>
							<li>
								Generates scripts using both `generateRomanizationServer` and
								`generateFuriganaServer`
							</li>
							<li>Stores results directly in the database</li>
							<li>This is the new enhanced server-side flow</li>
						</ul>
					</div>

					<div>
						<h3 class="mb-2 font-semibold">3. Conversation Flow Test:</h3>
						<ul class="list-inside list-disc space-y-1 text-sm">
							<li>Starts a full conversation with Japanese language setting</li>
							<li>Sends the test message through the conversation store</li>
							<li>Should automatically generate scripts when message is finalized</li>
							<li>Now also triggers server-side storage automatically</li>
						</ul>
					</div>

					<div>
						<h3 class="mb-2 font-semibold">Sample Japanese Texts to Test:</h3>
						<ul class="list-inside list-disc space-y-1 font-mono text-sm">
							<li>こんにちは、今日はどうですか？ (Hello, how are you today?)</li>
							<li>私は日本語を勉強しています (I am studying Japanese)</li>
							<li>東京の天気はどうですか？ (How's the weather in Tokyo?)</li>
							<li>ありがとうございました (Thank you very much)</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
