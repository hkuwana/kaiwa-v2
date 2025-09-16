<!-- Dev Analysis Testing Route -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { executeOnboardingAnalysis } from '$lib/services/onboarding-manager.service';
	import type { Message, Language, UserPreferences } from '$lib/server/db/types';
	import { languages } from '$lib/data/languages';

	// Mock data for testing
	const dummyMessages: Message[] = [
		{
			id: '1',
			role: 'user',
			content: 'Hello, my name is Sarah. I want to learn Japanese because my boyfriend is Japanese and I want to talk to his family.',
			timestamp: new Date(),
			conversationId: 'test-conversation',
			sequenceId: null,
			translatedContent: null,
			sourceLanguage: null,
			targetLanguage: null,
			translationData: null,
			furiganaData: null,
			romanizationData: null,
			contextualNotes: null,
			difficultyLevel: null,
			vocabularyLevel: null,
			grammarComplexity: null,
			culturalContext: null,
			emotionalTone: null,
			messageIntent: null,
			isSummarized: false,
			isError: false
		},
		{
			id: '2',
			role: 'assistant',
			content: 'That\'s wonderful! How long have you been studying Japanese?',
			timestamp: new Date(),
			conversationId: 'test-conversation',
			sequenceId: null,
			translatedContent: null,
			sourceLanguage: null,
			targetLanguage: null,
			translationData: null,
			furiganaData: null,
			romanizationData: null,
			contextualNotes: null,
			difficultyLevel: null,
			vocabularyLevel: null,
			grammarComplexity: null,
			culturalContext: null,
			emotionalTone: null,
			messageIntent: null,
			isSummarized: false,
			isError: false
		},
		{
			id: '3',
			role: 'user',
			content: 'Um, I started about six months ago but I\'m still very nervous. I can read some hiragana but speaking is scary.',
			timestamp: new Date(),
			conversationId: 'test-conversation',
			sequenceId: null,
			translatedContent: null,
			sourceLanguage: null,
			targetLanguage: null,
			translationData: null,
			furiganaData: null,
			romanizationData: null,
			contextualNotes: null,
			difficultyLevel: null,
			vocabularyLevel: null,
			grammarComplexity: null,
			culturalContext: null,
			emotionalTone: null,
			messageIntent: null,
			isSummarized: false,
			isError: false
		},
		{
			id: '4',
			role: 'assistant',
			content: 'That\'s completely normal! What situations worry you most about speaking Japanese?',
			timestamp: new Date(),
			conversationId: 'test-conversation',
			sequenceId: null,
			translatedContent: null,
			sourceLanguage: null,
			targetLanguage: null,
			translationData: null,
			furiganaData: null,
			romanizationData: null,
			contextualNotes: null,
			difficultyLevel: null,
			vocabularyLevel: null,
			grammarComplexity: null,
			culturalContext: null,
			emotionalTone: null,
			messageIntent: null,
			isSummarized: false,
			isError: false
		},
		{
			id: '5',
			role: 'user',
			content: 'Meeting his parents for the first time. I want to make a good impression and show respect, but I don\'t want to mess up basic greetings.',
			timestamp: new Date(),
			conversationId: 'test-conversation',
			sequenceId: null,
			translatedContent: null,
			sourceLanguage: null,
			targetLanguage: null,
			translationData: null,
			furiganaData: null,
			romanizationData: null,
			contextualNotes: null,
			difficultyLevel: null,
			vocabularyLevel: null,
			grammarComplexity: null,
			culturalContext: null,
			emotionalTone: null,
			messageIntent: null,
			isSummarized: false,
			isError: false
		}
	];

	// State
	let isAnalyzing = $state(false);
	let analysisResult = $state<any>(null);
	let analysisError = $state<string | null>(null);
	let selectedLanguage = $state<Language>(languages.find(l => l.code === 'ja') || languages[0]);
	let analysisSteps = $state<string[]>([]);
	let rawAIResponse = $state<string>('');

	// Mock preferences provider for testing
	const mockPreferencesProvider = {
		isGuest: () => true,
		getPreference: <K extends keyof UserPreferences>(key: K) => {
			const defaults: Partial<UserPreferences> = {
				successfulExchanges: 0,
				speakingLevel: 25,
				listeningLevel: 30,
				learningGoal: 'Connection'
			};
			return defaults[key] as UserPreferences[K];
		},
		updatePreferences: async (updates: Partial<UserPreferences>) => {
			console.log('Mock: Would update preferences with:', updates);
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
			analysisSteps = [...analysisSteps, `🗣️ Analyzing ${dummyMessages.filter(m => m.role === 'user').length} user messages`];
			analysisSteps = [...analysisSteps, `🌍 Target language: ${selectedLanguage.name} (${selectedLanguage.code})`];

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
				analysisSteps = [...analysisSteps, `📊 Found ${Object.keys(finalResult || {}).length} preference updates`];

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

	// Auto-run analysis on mount for quick testing
	onMount(() => {
		// Auto-run after a short delay to see the loading state
		setTimeout(runAnalysis, 1000);
	});
</script>

<svelte:head>
	<title>Dev: Analysis Testing - Kaiwa</title>
</svelte:head>

<div class="min-h-screen bg-base-200 p-4">
	<div class="container mx-auto max-w-6xl">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-base-content">🧪 Analysis Pipeline Testing</h1>
			<p class="mt-2 text-base-content/70">Test the onboarding analysis with dummy conversation data</p>
		</div>

		<div class="grid gap-6 lg:grid-cols-2">
			<!-- Left Column: Input & Controls -->
			<div class="space-y-6">
				<!-- Language Selection -->
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h2 class="card-title text-lg">🌍 Language Selection</h2>
						<select
							class="select select-bordered w-full"
							bind:value={selectedLanguage}
							disabled={isAnalyzing}
						>
							{#each languages.filter(l => l.isSupported) as lang}
								<option value={lang}>{lang.name} ({lang.code})</option>
							{/each}
						</select>
					</div>
				</div>

				<!-- Dummy Messages -->
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h2 class="card-title text-lg">💬 Test Conversation</h2>
						<div class="space-y-3 max-h-96 overflow-y-auto">
							{#each dummyMessages as message}
								<div class="p-3 rounded-lg {message.role === 'user' ? 'bg-primary/10 ml-4' : 'bg-base-200 mr-4'}">
									<div class="text-xs font-medium opacity-70 mb-1">
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
						<button
							class="btn btn-primary w-full"
							onclick={runAnalysis}
							disabled={isAnalyzing}
						>
							{#if isAnalyzing}
								<span class="loading loading-spinner loading-sm"></span>
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
						<div class="space-y-2 max-h-64 overflow-y-auto">
							{#each analysisSteps as step}
								<div class="text-sm font-mono bg-base-200 p-2 rounded">
									{step}
								</div>
							{/each}

							{#if isAnalyzing}
								<div class="text-sm font-mono bg-info/10 text-info p-2 rounded flex items-center gap-2">
									<span class="loading loading-spinner loading-xs"></span>
									Processing...
								</div>
							{/if}
						</div>
					</div>
				</div>

				<!-- Analysis Results -->
				{#if analysisResult}
					<div class="card bg-base-100 shadow-lg">
						<div class="card-body">
							<h2 class="card-title text-lg">🎯 Analysis Results</h2>
							<div class="space-y-3">
								{#each Object.entries(analysisResult) as [key, value]}
									<div class="flex justify-between items-center">
										<span class="font-medium text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
										<span class="text-sm bg-primary/10 px-2 py-1 rounded">
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
							<div class="text-xs font-mono bg-base-200 p-3 rounded max-h-48 overflow-y-auto">
								{rawAIResponse}
							</div>
						</div>
					</div>
				{/if}

				<!-- Error Display -->
				{#if analysisError}
					<div class="alert alert-error">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
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