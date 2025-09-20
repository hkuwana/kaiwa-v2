<!-- Dev Analysis Testing Route -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { executeOnboardingAnalysis } from '$lib/services/onboarding-manager.service';
	import type { Message, Language, UserPreferences } from '$lib/server/db/types';
	import { languages } from '$lib/data/languages';
	import { SvelteDate } from 'svelte/reactivity';

	const ANALYSIS_CONVERSATION_ID = 'analysis-dev-conversation';

	function createMessage({
		id,
		role,
		content,
		messageIntent = null
	}: {
		id: string;
		role: Message['role'];
		content: string;
		messageIntent?: Message['messageIntent'];
	}): Message {
		return {
			id,
			conversationId: ANALYSIS_CONVERSATION_ID,
			role,
			content,
			timestamp: new SvelteDate(),
			sequenceId: null,
			translatedContent: null,
			sourceLanguage: null,
			targetLanguage: null,
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
			messageIntent
		};
	}

	// Mock data for testing
	const dummyMessages: Message[] = [
		createMessage({
			id: '1',
			role: 'user',
			content:
				'Hello, my name is Sarah. I want to learn Japanese because my boyfriend is Japanese and I want to talk to his family.',
			messageIntent: 'statement'
		}),
		createMessage({
			id: '2',
			role: 'assistant',
			content: "That's wonderful! How long have you been studying Japanese?",
			messageIntent: 'question'
		}),
		createMessage({
			id: '3',
			role: 'user',
			content:
				"Um, I started about six months ago but I'm still very nervous. I can read some hiragana but speaking is scary.",
			messageIntent: 'statement'
		}),
		createMessage({
			id: '4',
			role: 'assistant',
			content: "That's completely normal! What situations worry you most about speaking Japanese?",
			messageIntent: 'question'
		}),
		createMessage({
			id: '5',
			role: 'user',
			content:
				"Meeting his parents for the first time. I want to make a good impression and show respect, but I don't want to mess up basic greetings.",
			messageIntent: 'statement'
		})
	];

	// State
	let isAnalyzing = $state(false);
	let analysisResult = $state<any>(null);
	let analysisError = $state<string | null>(null);
	let selectedLanguage = $state<Language>(languages.find((l) => l.code === 'ja') || languages[0]);
	let analysisSteps = $state<string[]>([]);
	let rawAIResponse = $state<string>('');
	let storedMemories = $state<string[]>([]);
	let lastPreferenceUpdate = $state<Partial<UserPreferences> | null>(null);

	// Mock preferences provider for testing
	const mockPreferencesProvider = {
		isGuest: () => true,
		getPreference: <K extends keyof UserPreferences>(key: K) => {
			if (key === 'memories') {
				return storedMemories as unknown as UserPreferences[K];
			}

			const defaults: Partial<UserPreferences> = {
				successfulExchanges: 0,
				speakingLevel: 25,
				listeningLevel: 30,
				learningGoal: 'Connection',
				favoriteScenarioIds: [],
				memories: storedMemories
			};
			return defaults[key] as UserPreferences[K];
		},
		updatePreferences: async (updates: Partial<UserPreferences>) => {
			console.log('Mock: Would update preferences with:', updates);
			if (Array.isArray(updates.memories)) {
				storedMemories = updates.memories as string[];
			}
			lastPreferenceUpdate = updates;
			analysisResult = { ...analysisResult, ...updates };
		}
	};

	async function runAnalysis() {
		isAnalyzing = true;
		analysisError = null;
		analysisResult = null;
		analysisSteps = [];
		rawAIResponse = '';

		try {
			analysisSteps = [...analysisSteps, '🚀 Starting analysis pipeline...'];

			const sessionId = crypto.randomUUID();
			analysisSteps = [...analysisSteps, `📋 Session ID: ${sessionId}`];
			analysisSteps = [
				...analysisSteps,
				`🗣️ Analyzing ${dummyMessages.filter((m) => m.role === 'user').length} user messages`
			];
			analysisSteps = [
				...analysisSteps,
				`🌍 Target language: ${selectedLanguage.name} (${selectedLanguage.code})`
			];

			// Call the actual analysis pipeline
			const result = await executeOnboardingAnalysis(
				selectedLanguage,
				dummyMessages,
				sessionId,
				mockPreferencesProvider
			);

			if (result.success) {
				analysisSteps = [...analysisSteps, '✅ Analysis completed successfully!'];
				analysisSteps = [...analysisSteps, '🎯 Extracting user preferences...'];

				// Get the updated result from our mock provider
				const finalResult = analysisResult;
				analysisSteps = [
					...analysisSteps,
					`📊 Found ${Object.keys(finalResult || {}).length} preference updates`
				];

				analysisSteps = [
					...analysisSteps,
					storedMemories.length > 0
						? `🧠 Stored memories (${storedMemories.length}): ${storedMemories.join(', ')}`
						: '🧠 Stored memories: none (analysis payload did not include memories)'
				];
			} else {
				analysisError = result.error || 'Analysis failed';
				analysisSteps = [...analysisSteps, `❌ Analysis failed: ${analysisError}`];
			}
		} catch (error) {
			analysisError = error instanceof Error ? error.message : 'Unknown error';
			analysisSteps = [...analysisSteps, `💥 Exception: ${analysisError}`];
		} finally {
			isAnalyzing = false;
		}
	}
</script>

<svelte:head>
	<title>Dev: Analysis Testing - Kaiwa</title>
</svelte:head>

<div class="min-h-screen bg-base-200 p-4">
	<div class="container mx-auto max-w-6xl">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-base-content">🧪 Analysis Pipeline Testing</h1>
			<p class="mt-2 text-base-content/70">
				Test the onboarding analysis with dummy conversation data
			</p>
		</div>

		<div class="grid gap-6 lg:grid-cols-2">
			<!-- Left Column: Input & Controls -->
			<div class="space-y-6">
				<!-- Language Selection -->
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h2 class="card-title text-lg">🌍 Language Selection</h2>
						<select
							class="select-bordered select w-full"
							bind:value={selectedLanguage}
							disabled={isAnalyzing}
						>
							{#each languages.filter((l) => l.isSupported) as lang}
								<option value={lang}>{lang.name} ({lang.code})</option>
							{/each}
						</select>
					</div>
				</div>

				<!-- Dummy Messages -->
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h2 class="card-title text-lg">💬 Test Conversation</h2>
						<div class="max-h-96 space-y-3 overflow-y-auto">
							{#each dummyMessages as message}
								<div
									class="rounded-lg p-3 {message.role === 'user'
										? 'ml-4 bg-primary/10'
										: 'mr-4 bg-base-200'}"
								>
									<div class="mb-1 text-xs font-medium opacity-70">
										{message.role === 'user' ? '👤 User' : '🤖 Assistant'}
									</div>
									<div class="text-sm">{message.content}</div>
								</div>
							{/each}
						</div>
					</div>
				</div>

				<!-- Controls -->
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h2 class="card-title text-lg">🎮 Controls</h2>
						<button class="btn w-full btn-primary" onclick={runAnalysis} disabled={isAnalyzing}>
							{#if isAnalyzing}
								<span class="loading loading-sm loading-spinner"></span>
								Analyzing...
							{:else}
								🔄 Run Analysis
							{/if}
						</button>
					</div>
				</div>
			</div>

			<!-- Right Column: Results & Pipeline -->
			<div class="space-y-6">
				<!-- Analysis Steps -->
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h2 class="card-title text-lg">📋 Analysis Pipeline</h2>
						<div class="max-h-64 space-y-2 overflow-y-auto">
							{#each analysisSteps as step}
								<div class="rounded bg-base-200 p-2 font-mono text-sm">
									{step}
								</div>
							{/each}

							{#if isAnalyzing}
								<div
									class="flex items-center gap-2 rounded bg-info/10 p-2 font-mono text-sm text-info"
								>
									<span class="loading loading-xs loading-spinner"></span>
									Processing...
								</div>
							{/if}
						</div>
					</div>
				</div>

				<!-- Stored Memories Preview -->
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h2 class="card-title text-lg">🧠 Stored Memories</h2>
						{#if storedMemories.length > 0}
							<ul class="space-y-2 text-sm">
								{#each storedMemories as memory, index}
									<li class="flex items-start gap-2 rounded bg-base-200 p-2">
										<span class="text-xs opacity-70">#{index + 1}</span>
										<span>{memory}</span>
									</li>
								{/each}
							</ul>
						{:else}
							<p class="text-sm opacity-70">
								No memories stored yet. Run the analysis to populate them.
							</p>
						{/if}
					</div>
				</div>

				<!-- Last Preference Update -->
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h2 class="card-title text-lg">📦 Last Preference Update Payload</h2>
						{#if lastPreferenceUpdate}
							<pre class="max-h-48 overflow-y-auto rounded bg-base-200 p-3 text-xs">
								{JSON.stringify(lastPreferenceUpdate, null, 2)}
							</pre>
						{:else}
							<p class="text-sm opacity-70">No updates captured yet.</p>
						{/if}
					</div>
				</div>

				<!-- Analysis Results -->
				{#if analysisResult}
					<div class="card bg-base-100 shadow-lg">
						<div class="card-body">
							<h2 class="card-title text-lg">🎯 Analysis Results</h2>
							<div class="space-y-3">
								{#each Object.entries(analysisResult) as [key, value]}
									<div class="flex items-center justify-between">
										<span class="text-sm font-medium capitalize"
											>{key.replace(/([A-Z])/g, ' $1')}:</span
										>
										<span class="rounded bg-primary/10 px-2 py-1 text-sm">
											{typeof value === 'object' ? JSON.stringify(value) : String(value)}
										</span>
									</div>
								{/each}
							</div>
						</div>
					</div>
				{/if}

				<!-- Raw AI Response -->
				{#if rawAIResponse}
					<div class="card bg-base-100 shadow-lg">
						<div class="card-body">
							<h2 class="card-title text-lg">🤖 Raw AI Response</h2>
							<div class="max-h-48 overflow-y-auto rounded bg-base-200 p-3 font-mono text-xs">
								{rawAIResponse}
							</div>
						</div>
					</div>
				{/if}

				<!-- Error Display -->
				{#if analysisError}
					<div class="alert alert-error">
						<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							></path>
						</svg>
						<div>
							<h3 class="font-medium">Analysis Error</h3>
							<div class="text-sm">{analysisError}</div>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Back to Dev -->
		<div class="mt-8 text-center">
			<a href="/dev" class="btn btn-outline">← Back to Dev Tools</a>
		</div>
	</div>
</div>

<style>
	/* Custom scrollbar for better UX */
	.overflow-y-auto::-webkit-scrollbar {
		width: 6px;
	}
	.overflow-y-auto::-webkit-scrollbar-track {
		background: hsl(var(--b2));
	}
	.overflow-y-auto::-webkit-scrollbar-thumb {
		background: hsl(var(--bc) / 0.3);
		border-radius: 3px;
	}
</style>
