<!-- Dev Translation Testing Page -->
<script lang="ts">
	import { onMount } from 'svelte';
	import MessageBubble from '$lib/components/MessageBubble.svelte';
	// Remove direct import of translation service since it won't work in browser
	import { translationStore } from '$lib/stores/translation.store.svelte';
	import type { Message } from '$lib/server/db/types';
	import type { Speaker } from '$lib/types';

	// Test data
	let testText = $state('Hello, how are you today?');
	let sourceLanguage = $state('en');
	let targetLanguage = $state('ja');

	let translationResult = $state<Partial<Message> | null>(null);
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	// Use derived for testMessage to react to testText changes
	const testMessage = $derived({
		id: 'test-message-1',
		content: testText,
		role: 'user' as const,
		timestamp: new Date(),
		conversationId: 'test-conversation',
		translatedContent: translationResult?.translatedContent || null,
		sourceLanguage: sourceLanguage,
		targetLanguage: targetLanguage,
		userNativeLanguage: null,
		romanization: translationResult?.romanization || null,
		hiragana: translationResult?.hiragana || null,
		otherScripts: translationResult?.otherScripts || null,
		translationConfidence: translationResult?.translationConfidence || null,
		translationProvider: translationResult?.translationProvider || null,
		translationNotes: null,
		isTranslated: !!translationResult?.translatedContent,
		grammarAnalysis: null,
		vocabularyAnalysis: null,
		pronunciationScore: null,
		audioUrl: null,
		audioDuration: null,
		difficultyLevel: null,
		learningTags: null,
		conversationContext: null,
		messageIntent: null
	});

	// Test speaker
	const testSpeaker: Speaker = {
		id: 'test-speaker',
		voiceName: 'Test Speaker',
		openaiVoiceId: 'alloy',
		languageId: 'en',
		region: 'US',
		dialectName: 'General American',
		bcp47Code: 'en-US',
		speakerEmoji: '🧑',
		gender: 'male',
		voiceProviderId: 'openai',
		isActive: true,
		createdAt: new Date()
	};

	// Language options
	const languages = [
		{ code: 'en', name: 'English' },
		{ code: 'ja', name: 'Japanese' },
		{ code: 'zh', name: 'Chinese' },
		{ code: 'ko', name: 'Korean' },
		{ code: 'es', name: 'Spanish' },
		{ code: 'fr', name: 'French' },
		{ code: 'de', name: 'German' },
		{ code: 'ar', name: 'Arabic' },
		{ code: 'hi', name: 'Hindi' },
		{ code: 'ru', name: 'Russian' }
	];

	// Sample test messages
	const sampleMessages = [
		{ text: 'Hello, how are you today?', lang: 'en' },
		{ text: 'こんにちは、元気ですか？', lang: 'ja' },
		{ text: '你好，你今天怎么样？', lang: 'zh' },
		{ text: '안녕하세요, 오늘 어떠세요?', lang: 'ko' },
		{ text: 'Hola, ¿cómo estás hoy?', lang: 'es' },
		{ text: "Bonjour, comment allez-vous aujourd'hui?", lang: 'fr' }
	];

	function updateTestMessage() {
		// testMessage is now derived, so we just need to clear results
		translationResult = null;
		error = null;
	}

	async function testTranslation() {
		if (!testText.trim()) return;

		isLoading = true;
		error = null;

		try {
			updateTestMessage();

			const messageId = `test-message-${Date.now()}`;

			// Call the server-side API endpoint
			const response = await fetch('/api/translate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					text: testText,
					messageId,
					sourceLanguage,
					targetLanguage
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Translation failed');
			}

			const result = await response.json();

			// Convert result to partial Message object
			translationResult = {
				translatedContent: result.translatedContent,
				romanization: result.romanization,

				hiragana: result.hiragana,

				otherScripts: result.otherScripts,
				sourceLanguage: result.sourceLanguage,
				targetLanguage: result.targetLanguage,
				translationConfidence: result.confidence,
				translationProvider: result.provider,
				isTranslated: true
			};

			console.log('Translation result:', result);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Translation failed';
			console.error('Translation error:', err);
		} finally {
			isLoading = false;
		}
	}

	function loadSampleMessage(sample: { text: string; lang: string }) {
		testText = sample.text;
		sourceLanguage = sample.lang;
		targetLanguage = sample.lang === 'en' ? 'ja' : 'en';
		updateTestMessage();
	}

	function swapLanguages() {
		const temp = sourceLanguage;
		sourceLanguage = targetLanguage;
		targetLanguage = temp;
		updateTestMessage();
	}

	async function handleTranslation(event: string, data: any) {
		console.log('Translation event received:', event, data);
		await testTranslation();
	}

	onMount(() => {
		updateTestMessage();
	});
</script>

<div class="min-h-screen bg-base-200 p-6">
	<div class="mx-auto max-w-6xl">
		<h1 class="mb-8 text-4xl font-bold">🔤 Translation Service Testing</h1>

		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
			<!-- Translation Controls -->
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="mb-4 card-title">Translation Controls</h2>

					<!-- Text Input -->
					<div class="form-control">
						<label for="test-text" class="label">
							<span class="label-text">Text to Translate</span>
						</label>
						<textarea
							id="test-text"
							bind:value={testText}
							class="textarea-bordered textarea h-24"
							placeholder="Enter text to translate..."
							oninput={updateTestMessage}
						></textarea>
					</div>

					<!-- Language Selection -->
					<div class="grid grid-cols-2 gap-4">
						<div class="form-control">
							<label for="source-language" class="label">
								<span class="label-text">Source Language</span>
							</label>
							<select
								id="source-language"
								bind:value={sourceLanguage}
								class="select-bordered select"
							>
								{#each languages as lang}
									<option value={lang.code}>{lang.name}</option>
								{/each}
							</select>
						</div>

						<div class="form-control">
							<label for="target-language" class="label">
								<span class="label-text">Target Language</span>
							</label>
							<select
								id="target-language"
								bind:value={targetLanguage}
								class="select-bordered select"
							>
								{#each languages as lang}
									<option value={lang.code}>{lang.name}</option>
								{/each}
							</select>
						</div>
					</div>

					<!-- Action Buttons -->
					<div class="flex gap-2">
						<button
							onclick={testTranslation}
							class="btn flex-1 btn-primary"
							disabled={isLoading || !testText.trim()}
						>
							{#if isLoading}
								<span class="loading loading-sm loading-spinner"></span>
								Translating...
							{:else}
								🔤 Translate
							{/if}
						</button>

						<button onclick={swapLanguages} class="btn btn-outline"> 🔄 Swap </button>
					</div>

					<!-- Sample Messages -->
					<div class="divider">Sample Messages</div>
					<div class="grid grid-cols-2 gap-2">
						{#each sampleMessages as sample}
							<button onclick={() => loadSampleMessage(sample)} class="btn btn-outline btn-sm">
								{sample.text.substring(0, 20)}...
							</button>
						{/each}
					</div>

					<!-- Error Display -->
					{#if error}
						<div class="alert alert-error">
							<span>❌ {error}</span>
						</div>
					{/if}
				</div>
			</div>

			<!-- MessageBubble Preview -->
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="mb-4 card-title">MessageBubble Preview</h2>

					<div class="space-y-4">
						<!-- Message with Translation -->
						<div>
							<h3 class="mb-2 text-sm font-medium">
								{translationResult ? 'Message with Translation' : 'Original Message'}
							</h3>
							<MessageBubble
								message={testMessage}
								speaker={testSpeaker}
								dispatch={handleTranslation}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Translation Details -->
		{#if translationResult}
			<div class="card mt-6 bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="mb-4 card-title">Translation Details</h2>

					<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
						{#if translationResult.translatedContent}
							<div class="stat">
								<div class="stat-title">Translation</div>
								<div class="stat-value text-lg">{translationResult.translatedContent}</div>
							</div>
						{/if}

						{#if translationResult.romanization}
							<div class="stat">
								<div class="stat-title">Romanization</div>
								<div class="stat-value text-lg">{translationResult.romanization}</div>
							</div>
						{/if}

						{#if translationResult.hiragana}
							<div class="stat">
								<div class="stat-title">Hiragana</div>
								<div class="stat-value text-lg">{translationResult.hiragana}</div>
							</div>
						{/if}

						{#if translationResult.translationConfidence}
							<div class="stat">
								<div class="stat-title">Confidence</div>
								<div class="stat-value text-lg capitalize">
									{translationResult.translationConfidence}
								</div>
							</div>
						{/if}

						{#if translationResult.translationProvider}
							<div class="stat">
								<div class="stat-title">Provider</div>
								<div class="stat-value text-lg">{translationResult.translationProvider}</div>
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}

		<!-- Raw Translation Data -->
		{#if translationResult}
			<div class="card mt-6 bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="mb-4 card-title">Raw Translation Data</h2>
					<pre class="overflow-auto rounded-lg bg-base-200 p-4 text-sm">{JSON.stringify(
							translationResult,
							null,
							2
						)}</pre>
				</div>
			</div>
		{/if}
	</div>
</div>
