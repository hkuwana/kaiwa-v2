<!-- Dev route for testing analysis page with dummy data -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { conversationStore } from '$lib/stores/conversation.store.svelte';
	import { settingsStore } from '$lib/stores/settings.store.svelte';
	import type { Message, Language } from '$lib/server/db/types';
	import { SvelteDate } from 'svelte/reactivity';

	const TEST_CONVERSATION_ID = 'analysis-test-conversation';

	function buildMessage({
		id,
		role,
		content,
		timestamp,
		sequenceId = null,
		sourceLanguage = null,
		translatedContent = null,
		messageIntent = null
	}: {
		id: string;
		role: Message['role'];
		content: string;
		timestamp: Date;
		sequenceId?: string | null;
		sourceLanguage?: string | null;
		translatedContent?: string | null;
		messageIntent?: Message['messageIntent'];
	}): Message {
		return {
			id,
			conversationId: TEST_CONVERSATION_ID,
			role,
			content,
			timestamp,
			sequenceId,
			translatedContent,
			sourceLanguage,
			targetLanguage: null,
			userNativeLanguage: null,
			romanization: null,
			hiragana: null,
			otherScripts: null,
			translationConfidence: null,
			translationProvider: null,
			translationNotes: null,
			isTranslated: Boolean(translatedContent),
			grammarAnalysis: null,
			vocabularyAnalysis: null,
			pronunciationScore: null,
			audioUrl: null,
			audioDuration: null,
			difficultyLevel: null,
			learningTags: null,
			conversationContext: null,
			messageIntent
		};
	}

	// Create dummy messages for testing
	function createDummyMessages(): Message[] {
		const baseTime = new SvelteDate();
		return [
			buildMessage({
				id: 'msg-1',
				role: 'assistant',
				content: '¡Hola! ¿Cómo estás hoy? Me alegra poder practicar español contigo.',
				timestamp: new SvelteDate(baseTime.getTime() - 300000),
				sourceLanguage: 'es',
				translatedContent: "Hello! How are you today? I'm happy to practice Spanish with you.",
				sequenceId: '1',
				messageIntent: 'greeting'
			}),
			buildMessage({
				id: 'msg-2',
				role: 'user',
				content:
					'Hola, estoy bien, gracias. Quiero practicar mi español porque tengo una entrevista de trabajo la próxima semana.',
				timestamp: new SvelteDate(baseTime.getTime() - 240000),
				sourceLanguage: 'es',
				translatedContent:
					"Hello, I'm fine, thank you. I want to practice my Spanish because I have a job interview next week.",
				sequenceId: '2',
				messageIntent: 'statement'
			}),
			buildMessage({
				id: 'msg-3',
				role: 'assistant',
				content:
					'¡Excelente! Una entrevista de trabajo es muy importante. ¿En qué tipo de empresa vas a trabajar? ¿Qué puesto es?',
				timestamp: new SvelteDate(baseTime.getTime() - 180000),
				sourceLanguage: 'es',
				translatedContent:
					'Excellent! A job interview is very important. What type of company are you going to work for? What position is it?',
				sequenceId: '3',
				messageIntent: 'question'
			}),
			buildMessage({
				id: 'msg-4',
				role: 'user',
				content:
					'Es una empresa de tecnología. El puesto es para desarrollador de software. Estoy un poco nervioso porque necesito hablar español con mis colegas.',
				timestamp: new SvelteDate(baseTime.getTime() - 120000),
				sourceLanguage: 'es',
				translatedContent:
					"It's a technology company. The position is for software developer. I'm a bit nervous because I need to speak Spanish with my colleagues.",
				sequenceId: '4',
				messageIntent: 'statement'
			}),
			buildMessage({
				id: 'msg-5',
				role: 'assistant',
				content:
					'Entiendo perfectamente. Es normal estar nervioso, pero tu español suena muy bien. ¿Cuánto tiempo llevas estudiando español?',
				timestamp: new SvelteDate(baseTime.getTime() - 60000),
				sourceLanguage: 'es',
				translatedContent:
					"I understand perfectly. It's normal to be nervous, but your Spanish sounds very good. How long have you been studying Spanish?",
				sequenceId: '5',
				messageIntent: 'question'
			}),
			buildMessage({
				id: 'msg-6',
				role: 'user',
				content:
					'He estado estudiando por dos años. Me gusta mucho la programación y espero que pueda combinar mis habilidades técnicas con el español.',
				timestamp: new SvelteDate(baseTime.getTime() - 30000),
				sourceLanguage: 'es',
				translatedContent:
					"I've been studying for two years. I really like programming and I hope I can combine my technical skills with Spanish.",
				sequenceId: '6',
				messageIntent: 'statement'
			})
		];
	}

	// Create dummy language
	function createDummyLanguage(): Language {
		return {
			id: 'es',
			code: 'es',
			name: 'Spanish',
			nativeName: 'Español',
			isRTL: false,
			flag: '🇪🇸',
			hasRomanization: true,
			writingSystem: 'latin',
			supportedScripts: ['latin'],
			isSupported: true
		};
	}

	// Test scenario options
	let testScenario = $state<'empty' | 'short' | 'medium' | 'long'>('medium');
	let analysisMode = $state<'quick' | 'full'>('quick');
	let analysisType = $state<'onboarding' | 'regular' | 'scenario-generation'>('regular');

	function generateTestData(scenario: typeof testScenario) {
		const dummyLanguage = createDummyLanguage();
		let messages: Message[] = [];

		switch (scenario) {
			case 'empty':
				messages = [];
				break;
			case 'short':
				messages = createDummyMessages().slice(0, 2);
				break;
			case 'medium':
				messages = createDummyMessages();
				break;
			case 'long': {
				const baseMessages = createDummyMessages();
				const additionalMessages: Message[] = [
					buildMessage({
						id: 'msg-7',
						role: 'assistant',
						content:
							'¡Dos años es bastante tiempo! Seguramente has aprendido mucho. ¿Qué es lo más difícil del español para ti?',
						timestamp: new SvelteDate(),
						sourceLanguage: 'es',
						translatedContent:
							"Two years is quite a long time! You must have learned a lot. What's the most difficult thing about Spanish for you?",
						sequenceId: '7',
						messageIntent: 'question'
					}),
					buildMessage({
						id: 'msg-8',
						role: 'user',
						content:
							'Creo que lo más difícil son los tiempos verbales, especialmente el subjuntivo. También a veces me confundo con ser y estar.',
						timestamp: new SvelteDate(),
						sourceLanguage: 'es',
						translatedContent:
							'I think the most difficult thing is verb tenses, especially the subjunctive. Also sometimes I get confused with ser and estar.',
						sequenceId: '8',
						messageIntent: 'statement'
					})
				];
				messages = [...baseMessages, ...additionalMessages];
				break;
			}
		}

		return { messages, language: dummyLanguage };
	}

	const previewData = $derived(generateTestData(testScenario));
	const previewMessages = $derived(previewData.messages);
	const previewLanguage = $derived(previewData.language);

	function testAnalysis() {
		const { messages, language } = generateTestData(testScenario);

		// Set up the conversation store with test data
		settingsStore.selectedLanguage = language;
		conversationStore.messagesForAnalysis = messages;
		conversationStore.language = language;
		conversationStore.sessionId = `test-session-${Date.now()}`;

		console.log('🧪 Testing analysis with:', {
			scenario: testScenario,
			mode: analysisMode,
			type: analysisType,
			messagesCount: messages.length,
			sessionId: conversationStore.sessionId
		});

		// Navigate to analysis page
		const sessionId = conversationStore.sessionId;
		goto(`/analysis?mode=${analysisMode}&type=${analysisType}&sessionId=${sessionId}`);
	}

	function clearTestData() {
		conversationStore.messagesForAnalysis = [];
		conversationStore.messages = [];
		conversationStore.sessionId = '';
		console.log('🧹 Test data cleared');
	}
</script>

<svelte:head>
	<title>Analysis Test - Dev Tools</title>
</svelte:head>

<div class="min-h-screen bg-base-200 p-6">
	<div class="container mx-auto max-w-4xl">
		<div class="mb-6">
			<h1 class="mb-2 text-3xl font-bold">🧪 Analysis Testing Tool</h1>
			<p class="text-base-content/70">
				Test the analysis page with different conversation scenarios
			</p>
		</div>

		<div class="grid gap-6 md:grid-cols-2">
			<!-- Test Configuration -->
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="card-title">Test Configuration</h2>

					<!-- Test Scenario -->
					<div class="form-control">
						<label class="label" for="analysis-test-conversation-length">
							<span class="label-text font-semibold">Conversation Length</span>
						</label>
						<select
							id="analysis-test-conversation-length"
							class="select-bordered select"
							bind:value={testScenario}
						>
							<option value="empty">Empty (0 messages)</option>
							<option value="short">Short (2 messages)</option>
							<option value="medium">Medium (6 messages)</option>
							<option value="long">Long (8 messages)</option>
						</select>
					</div>

					<!-- Analysis Mode -->
					<fieldset class="form-control">
						<legend class="label-text font-semibold">Analysis Mode</legend>
						<div class="flex gap-2">
							<label class="label cursor-pointer">
								<input type="radio" bind:group={analysisMode} value="quick" class="radio" />
								<span class="label-text ml-2">Quick</span>
							</label>
							<label class="label cursor-pointer">
								<input type="radio" bind:group={analysisMode} value="full" class="radio" />
								<span class="label-text ml-2">Full</span>
							</label>
						</div>
					</fieldset>

					<!-- Analysis Type -->
					<div class="form-control">
						<label class="label" for="analysis-test-analysis-type">
							<span class="label-text font-semibold">Analysis Type</span>
						</label>
						<select
							id="analysis-test-analysis-type"
							class="select-bordered select"
							bind:value={analysisType}
						>
							<option value="onboarding">Onboarding</option>
							<option value="regular">Regular</option>
							<option value="scenario-generation">Scenario Generation</option>
						</select>
					</div>

					<!-- Actions -->
					<div class="mt-4 card-actions justify-end">
						<button class="btn btn-outline" onclick={clearTestData}> Clear Data </button>
						<button class="btn btn-primary" onclick={testAnalysis}> Test Analysis </button>
					</div>
				</div>
			</div>

			<!-- Preview -->
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="card-title">Preview</h2>

					<div class="space-y-3">
						<div class="stat">
							<div class="stat-title">Messages</div>
							<div class="stat-value text-2xl">{previewMessages.length}</div>
						</div>

						<div class="stat">
							<div class="stat-title">Language</div>
							<div class="stat-value text-xl">{previewLanguage.name} {previewLanguage.flag}</div>
						</div>

						<div class="stat">
							<div class="stat-title">User Messages</div>
							<div class="stat-value text-xl">
								{previewMessages.filter((m) => m.role === 'user').length}
							</div>
						</div>
					</div>

					{#if previewMessages.length > 0}
						<div class="divider">Sample Messages</div>
						<div class="max-h-48 space-y-2 overflow-y-auto">
							{#each previewMessages.slice(0, 3) as message}
								<div class="chat {message.role === 'user' ? 'chat-end' : 'chat-start'}">
									<div
										class="chat-bubble chat-bubble-{message.role === 'user'
											? 'primary'
											: 'secondary'} text-xs"
									>
										{message.content.slice(0, 50)}{message.content.length > 50 ? '...' : ''}
									</div>
								</div>
							{/each}
							{#if previewMessages.length > 3}
								<div class="text-center text-xs opacity-50">
									...and {previewMessages.length - 3} more messages
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Direct Links -->
		<div class="card mt-6 bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title">Quick Access</h2>
				<div class="flex flex-wrap gap-2">
					<a
						href="/analysis?mode=quick&type=regular&sessionId=test-empty"
						class="btn btn-outline btn-sm"
					>
						Empty Analysis
					</a>
					<a
						href="/analysis?mode=quick&type=onboarding&sessionId=test-onboarding"
						class="btn btn-outline btn-sm"
					>
						Onboarding Test
					</a>
					<a
						href="/analysis?mode=full&type=regular&sessionId=test-full"
						class="btn btn-outline btn-sm"
					>
						Full Analysis Test
					</a>
					<a href="/conversation" class="btn btn-sm btn-primary"> Back to Conversation </a>
				</div>
			</div>
		</div>
	</div>
</div>
