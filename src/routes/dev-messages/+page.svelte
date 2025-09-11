<!-- Dev Messages Testing Page -->
<script lang="ts">
	import { onMount } from 'svelte';
	import MessageBubble from '$lib/components/MessageBubble.svelte';
	import {
		generateScriptsForMessage,
		detectLanguage,
		hasScriptData,
		needsScriptGeneration
	} from '$lib/services/scripts.service';
	import { generateFuriganaClient, generateFuriganaServer } from '$lib/services/furigana.service';
	import {
		generateRomanizationClient,
		generateRomanizationServer
	} from '$lib/services/romanization.service';
	import type { Message } from '$lib/server/db/types';
	import type { Speaker } from '$lib/types';
	import { SvelteDate } from 'svelte/reactivity';

	// Test data
	let testText = $state('こんにちは、元気ですか？');
	let sourceLanguage = $state('ja');
	let targetLanguage = $state('en');

	let translationResult = $state<Partial<Message> | null>(null);
	let scriptResult = $state<any>(null);
	let furiganaResult = $state<any>(null);
	let romanizationResult = $state<any>(null);
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let lastUpdateTime = $state<Date | null>(null);

	// Test message with full schema - reactive to all test results
	const testMessage = $derived({
		id: 'test-message-1',
		content: testText,
		role: 'user' as const,
		timestamp: new SvelteDate(),
		conversationId: 'test-conversation',
		sequenceId: Date.now().toString(),
		translatedContent: translationResult?.translatedContent || null,
		sourceLanguage: sourceLanguage,
		targetLanguage: targetLanguage,
		userNativeLanguage: null,
		romanization:
			translationResult?.romanization ||
			scriptResult?.romanization ||
			romanizationResult?.server?.romanization ||
			null,
		hiragana:
			translationResult?.hiragana ||
			scriptResult?.hiragana ||
			furiganaResult?.server?.hiragana ||
			null,
		otherScripts: {
			...(translationResult?.otherScripts || {}),
			...(scriptResult?.otherScripts || {}),
			...(furiganaResult?.server?.otherScripts || {}),
			...(romanizationResult?.server?.otherScripts || {}),
			...(romanizationResult?.pinyin && { pinyin: romanizationResult.pinyin }),
			...(romanizationResult?.hangul && { hangul: romanizationResult.hangul })
		},
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
		languageId: 'ja',
		createdAt: new Date(),
		isActive: true,
		region: 'JP',
		dialectName: 'Standard',
		bcp47Code: 'ja-JP',
		speakerEmoji: '🎌',
		gender: 'female',
		voiceProviderId: 'openai'
	};

	// Sample messages for testing
	const sampleMessages = [
		{ text: 'こんにちは、元気ですか？', lang: 'ja', desc: 'Japanese greeting' },
		{ text: 'Hello, how are you today?', lang: 'en', desc: 'English greeting' },
		{ text: '你好，你今天怎么样？', lang: 'zh', desc: 'Chinese greeting' },
		{ text: '안녕하세요, 오늘 어떠세요?', lang: 'ko', desc: 'Korean greeting' },
		{ text: '今日は天気がいいですね。', lang: 'ja', desc: 'Japanese weather' },
		{ text: '私は日本語を勉強しています。', lang: 'ja', desc: 'Japanese learning' },
		{ text: '今天天气很好。', lang: 'zh', desc: 'Chinese weather' },
		{ text: '저는 한국어를 공부하고 있습니다.', lang: 'ko', desc: 'Korean learning' },
		{ text: '北京是中国的首都。', lang: 'zh', desc: 'Chinese geography' },
		{ text: '서울은 한국의 수도입니다.', lang: 'ko', desc: 'Korean geography' }
	];

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
			lastUpdateTime = new Date();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Translation failed';
			console.error('Translation error:', err);
		} finally {
			isLoading = false;
		}
	}

	async function testScripts() {
		if (!testText.trim()) return;

		isLoading = true;
		error = null;

		try {
			const messageId = `test-message-${Date.now()}`;
			const testMessage = {
				id: messageId,
				content: testText,
				role: 'user' as const,
				timestamp: new Date(),
				conversationId: 'test-conversation',
				translatedContent: null,
				sourceLanguage: sourceLanguage,
				targetLanguage: targetLanguage,
				userNativeLanguage: null,
				romanization: null,
				hiragana: null,
				otherScripts: null,
				translationConfidence: null,
				translationProvider: null,
				translationNotes: null,
				isTranslated: false,
				grammarAnalysis: null,
				vocabularyAnalysis: null,
				pronunciationScore: null,
				audioUrl: null,
				audioDuration: null,
				difficultyLevel: null,
				learningTags: null,
				conversationContext: null,
				messageIntent: null
			};

			// Test server-side script generation
			scriptResult = await generateScriptsForMessage(testMessage, true);
			console.log('Scripts result:', scriptResult);
			lastUpdateTime = new Date();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Script generation failed';
			console.error('Script generation error:', err);
		} finally {
			isLoading = false;
		}
	}

	async function testFurigana() {
		if (!testText.trim()) return;

		isLoading = true;
		error = null;

		try {
			const messageId = `test-message-${Date.now()}`;

			// Test client-side furigana
			furiganaResult = {
				client: await generateFuriganaClient(testText),
				server: await generateFuriganaServer(testText, messageId)
			};

			console.log('Furigana result:', furiganaResult);
			lastUpdateTime = new Date();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Furigana generation failed';
			console.error('Furigana generation error:', err);
		} finally {
			isLoading = false;
		}
	}

	async function testRomanization() {
		if (!testText.trim()) return;

		isLoading = true;
		error = null;

		try {
			const messageId = `test-message-${Date.now()}`;
			const language = detectLanguage(testText);

			// Test client-side romanization
			romanizationResult = {
				language,
				client: await generateRomanizationClient(testText, language),
				server: await generateRomanizationServer(testText, language, messageId)
			};

			console.log('Romanization result:', romanizationResult);
			lastUpdateTime = new Date();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Romanization generation failed';
			console.error('Romanization generation error:', err);
		} finally {
			isLoading = false;
		}
	}

	async function testPinyin() {
		if (!testText.trim()) return;

		isLoading = true;
		error = null;

		try {
			const messageId = `test-message-${Date.now()}`;

			// Test server-side romanization for Chinese
			const result = await generateRomanizationServer(testText, 'zh', messageId);

			romanizationResult = {
				language: 'zh',
				server: result,
				pinyin: result.pinyin,
				otherScripts: result.otherScripts
			};

			console.log('Pinyin result:', romanizationResult);
			lastUpdateTime = new Date();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Pinyin generation failed';
			console.error('Pinyin generation error:', err);
		} finally {
			isLoading = false;
		}
	}

	async function testNativePinyin() {
		if (!testText.trim()) return;

		isLoading = true;
		error = null;

		try {
			const messageId = `test-message-${Date.now()}`;

			// Call the native pinyin API directly
			const response = await fetch('/api/pinyin', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					text: testText,
					messageId
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Native pinyin API failed');
			}

			const result = await response.json();

			romanizationResult = {
				language: 'zh',
				native: result,
				pinyin: result.pinyin,
				otherScripts: result.otherScripts
			};

			console.log('Native pinyin result:', romanizationResult);
			lastUpdateTime = new Date();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Native pinyin generation failed';
			console.error('Native pinyin generation error:', err);
		} finally {
			isLoading = false;
		}
	}

	async function testHangul() {
		if (!testText.trim()) return;

		isLoading = true;
		error = null;

		try {
			const messageId = `test-message-${Date.now()}`;

			// Test server-side romanization for Korean
			const result = await generateRomanizationServer(testText, 'ko', messageId);

			romanizationResult = {
				language: 'ko',
				server: result,
				hangul: result.hangul,
				otherScripts: result.otherScripts
			};

			console.log('Hangul result:', romanizationResult);
			lastUpdateTime = new Date();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Hangul generation failed';
			console.error('Hangul generation error:', err);
		} finally {
			isLoading = false;
		}
	}

	function loadSampleMessage(sample: { text: string; lang: string; desc: string }) {
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

	function updateTestMessage() {
		// This will trigger the derived testMessage to update
		translationResult = null;
		scriptResult = null;
		furiganaResult = null;
		romanizationResult = null;
		error = null;
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
	<div class="container mx-auto max-w-6xl">
		<h1 class="mb-8 text-4xl font-bold">🧪 Dev Messages Testing</h1>

		<div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
			<!-- Input Section -->
			<div class="space-y-6">
				<div class="card bg-base-100 shadow-xl">
					<div class="card-body">
						<h2 class="card-title">Test Input</h2>

						<div class="form-control">
							<label class="label" for="test-text">
								<span class="label-text">Test Text</span>
							</label>
							<textarea
								id="test-text"
								class="textarea-bordered textarea h-24"
								bind:value={testText}
								placeholder="Enter text to test..."
							></textarea>
						</div>

						<div class="grid grid-cols-2 gap-4">
							<div class="form-control">
								<label class="label" for="source-language">
									<span class="label-text">Source Language</span>
								</label>
								<select
									id="source-language"
									class="select-bordered select"
									bind:value={sourceLanguage}
								>
									<option value="en">English</option>
									<option value="ja">Japanese</option>
									<option value="zh">Chinese</option>
									<option value="ko">Korean</option>
								</select>
							</div>

							<div class="form-control">
								<label class="label" for="target-language">
									<span class="label-text">Target Language</span>
								</label>
								<select
									id="target-language"
									class="select-bordered select"
									bind:value={targetLanguage}
								>
									<option value="en">English</option>
									<option value="ja">Japanese</option>
									<option value="zh">Chinese</option>
									<option value="ko">Korean</option>
								</select>
							</div>
						</div>

						<div class="card-actions justify-end">
							<button class="btn btn-outline" onclick={swapLanguages}> 🔄 Swap Languages </button>
						</div>
					</div>
				</div>

				<!-- Sample Messages -->
				<div class="card bg-base-100 shadow-xl">
					<div class="card-body">
						<h3 class="card-title">Sample Messages</h3>
						<div class="grid grid-cols-1 gap-2">
							{#each sampleMessages as sample}
								<button
									class="btn justify-start btn-outline btn-sm"
									onclick={() => loadSampleMessage(sample)}
								>
									<span class="mr-2 badge badge-primary">{sample.lang}</span>
									{sample.text}
									<span class="ml-auto text-xs opacity-70">{sample.desc}</span>
								</button>
							{/each}
						</div>
					</div>
				</div>

				<!-- Test Buttons -->
				<div class="card bg-base-100 shadow-xl">
					<div class="card-body">
						<h3 class="card-title">Test Functions</h3>
						<div class="grid grid-cols-1 gap-2">
							<button class="btn btn-primary" onclick={testTranslation} disabled={isLoading}>
								{#if isLoading}
									<span class="loading loading-sm loading-spinner"></span>
								{:else}
									🌐
								{/if}
								Test Translation
							</button>

							<button class="btn btn-secondary" onclick={testScripts} disabled={isLoading}>
								{#if isLoading}
									<span class="loading loading-sm loading-spinner"></span>
								{:else}
									📝
								{/if}
								Test Scripts
							</button>

							<button class="btn btn-accent" onclick={testFurigana} disabled={isLoading}>
								{#if isLoading}
									<span class="loading loading-sm loading-spinner"></span>
								{:else}
									🎌
								{/if}
								Test Furigana
							</button>

							<button class="btn btn-info" onclick={testRomanization} disabled={isLoading}>
								{#if isLoading}
									<span class="loading loading-sm loading-spinner"></span>
								{:else}
									🔤
								{/if}
								Test Romanization
							</button>

							<button class="btn btn-warning" onclick={testPinyin} disabled={isLoading}>
								{#if isLoading}
									<span class="loading loading-sm loading-spinner"></span>
								{:else}
									🇨🇳
								{/if}
								Test Pinyin
							</button>

							<button class="btn btn-error" onclick={testHangul} disabled={isLoading}>
								{#if isLoading}
									<span class="loading loading-sm loading-spinner"></span>
								{:else}
									🇰🇷
								{/if}
								Test Hangul
							</button>

							<button class="btn btn-success" onclick={testNativePinyin} disabled={isLoading}>
								{#if isLoading}
									<span class="loading loading-sm loading-spinner"></span>
								{:else}
									🚀
								{/if}
								Test Native Pinyin
							</button>
						</div>
					</div>
				</div>
			</div>

			<!-- Results Section -->
			<div class="space-y-6">
				<!-- Message Display -->
				<div class="card bg-base-100 shadow-xl">
					<div class="card-body">
						<h3 class="card-title">
							Message Display
							{#if lastUpdateTime}
								<span class="ml-2 badge badge-sm badge-success">
									Updated {lastUpdateTime.toLocaleTimeString()}
								</span>
							{/if}
						</h3>
						<div class="space-y-4">
							<div class="text-sm opacity-70">
								Language: {detectLanguage(testText)} | Needs Scripts: {needsScriptGeneration(
									testMessage
								)} | Has Script Data: {hasScriptData(testMessage)}
							</div>
							<MessageBubble
								message={testMessage}
								speaker={testSpeaker}
								translation={translationResult || undefined}
								conversationLanguage={sourceLanguage}
								dispatch={handleTranslation}
							/>
						</div>
					</div>
				</div>

				<!-- Message Schema -->
				<div class="card bg-base-100 shadow-xl">
					<div class="card-body">
						<h3 class="card-title">Message Schema</h3>
						<pre class="max-h-96 overflow-auto rounded bg-base-200 p-4 text-xs">{JSON.stringify(
								testMessage,
								null,
								2
							)}</pre>
					</div>
				</div>

				<!-- Results -->
				{#if translationResult}
					<div class="card bg-base-100 shadow-xl">
						<div class="card-body">
							<h3 class="card-title">Translation Result</h3>
							<pre class="max-h-64 overflow-auto rounded bg-base-200 p-4 text-xs">{JSON.stringify(
									translationResult,
									null,
									2
								)}</pre>
						</div>
					</div>
				{/if}

				{#if scriptResult}
					<div class="card bg-base-100 shadow-xl">
						<div class="card-body">
							<h3 class="card-title">Scripts Result</h3>
							<pre class="max-h-64 overflow-auto rounded bg-base-200 p-4 text-xs">{JSON.stringify(
									scriptResult,
									null,
									2
								)}</pre>
						</div>
					</div>
				{/if}

				{#if furiganaResult}
					<div class="card bg-base-100 shadow-xl">
						<div class="card-body">
							<h3 class="card-title">Furigana Result</h3>
							<pre class="max-h-64 overflow-auto rounded bg-base-200 p-4 text-xs">{JSON.stringify(
									furiganaResult,
									null,
									2
								)}</pre>
						</div>
					</div>
				{/if}

				{#if romanizationResult}
					<div class="card bg-base-100 shadow-xl">
						<div class="card-body">
							<h3 class="card-title">Romanization Result</h3>
							<pre class="max-h-64 overflow-auto rounded bg-base-200 p-4 text-xs">{JSON.stringify(
									romanizationResult,
									null,
									2
								)}</pre>
						</div>
					</div>
				{/if}

				{#if error}
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
						<span>{error}</span>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
