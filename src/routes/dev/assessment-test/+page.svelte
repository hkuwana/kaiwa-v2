<script lang="ts">
	import { userPreferencesStore } from '$lib/stores/userPreferences.store.svelte';
	import OnboardingResults from '$lib/components/OnboardingResults.svelte';
	import ConversationReviewableState from '$lib/components/ConversationReviewableState.svelte';
	import type { UserPreferences, Message, Language } from '$lib/server/db/types';
	import { DEFAULT_VOICE } from '$lib/types/openai.realtime.types';
	import { createGuestUserPreferences } from '$lib/data/userPreferences';

	// Mock assessment data for testing
	const mockAssessmentResults: Partial<UserPreferences> = {
		id: 'dev-assessment-001',
		userId: 'dev-user',
		targetLanguageId: 'ja',
		learningGoal: 'Career',
		speakingLevel: 35,
		listeningLevel: 45,
		readingLevel: 30,
		writingLevel: 25,
		speakingConfidence: 60,
		specificGoals: ['Business meetings', 'Technical discussions', 'Networking'],
		challengePreference: 'moderate',
		correctionStyle: 'gentle',
		dailyGoalSeconds: 30,
		preferredVoice: DEFAULT_VOICE,
		createdAt: new Date(),
		updatedAt: new Date()
	};

	// Mock language data
	const mockJapaneseLanguage: Language = {
		id: 'ja',
		code: 'ja',
		name: 'Japanese',
		nativeName: '日本語',
		isRTL: false,
		flag: '🇯🇵',
		hasRomanization: true,
		writingSystem: 'chinese',
		supportedScripts: ['hiragana', 'katakana', 'kanji'],
		isSupported: true
	};

	// Mock conversation messages for testing (properly typed)
	const mockConversationMessages: Message[] = [
		{
			id: 'msg-1',
			conversationId: 'conv-dev-test',
			role: 'user',
			content: 'こんにちは、お元気ですか？',
			timestamp: new Date(Date.now() - 300000),
			sequenceId: null,
			translatedContent: null,
			sourceLanguage: 'ja',
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
			messageIntent: 'greeting'
		},
		{
			id: 'msg-2',
			conversationId: 'conv-dev-test',
			role: 'assistant',
			content: "I'm doing well, thank you! How has your Japanese learning been going?",
			timestamp: new Date(Date.now() - 280000),
			sequenceId: null,
			translatedContent: null,
			sourceLanguage: 'en',
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
			messageIntent: 'question'
		},
		{
			id: 'msg-3',
			conversationId: 'conv-dev-test',
			role: 'user',
			content: 'まあまあです。毎日勉強していますが、まだ難しいです。',
			timestamp: new Date(Date.now() - 260000),
			sequenceId: null,
			translatedContent: null,
			sourceLanguage: 'ja',
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
			messageIntent: 'statement'
		},
		{
			id: 'msg-4',
			conversationId: 'conv-dev-test',
			role: 'assistant',
			content: "That's great that you're studying every day! What do you find most challenging?",
			timestamp: new Date(Date.now() - 240000),
			sequenceId: null,
			translatedContent: null,
			sourceLanguage: 'en',
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
			messageIntent: 'question'
		},
		{
			id: 'msg-5',
			conversationId: 'conv-dev-test',
			role: 'user',
			content: '敬語が一番難しいと思います。ビジネスで使うので、とても重要です。',
			timestamp: new Date(Date.now() - 220000),
			sequenceId: null,
			translatedContent: null,
			sourceLanguage: 'ja',
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
			messageIntent: 'statement'
		},
		{
			id: 'msg-6',
			conversationId: 'conv-dev-test',
			role: 'assistant',
			content:
				"Business Japanese is definitely challenging! Keigo (honorific language) takes time to master, but you're on the right track.",
			timestamp: new Date(Date.now() - 200000),
			sequenceId: null,
			translatedContent: null,
			sourceLanguage: 'en',
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
			messageIntent: 'statement'
		}
	];

	const mockAssessmentFullResults = createGuestUserPreferences(mockAssessmentResults);
	const latestAnalysisResults = $derived(() => {
		const results = userPreferencesStore.getAnalysisResults();
		return results ? createGuestUserPreferences(results) : null;
	});

	// State
	let showResults = $state(false);
	let isAnalyzing = $state(false);
	let currentStep = $state<'idle' | 'analyzing' | 'results'>('idle');
	let showConversationReview = $state(false);

	// Test functions
	function startMockAssessment() {
		currentStep = 'analyzing';
		isAnalyzing = true;
		showResults = false;

		// Simulate analysis process
		setTimeout(() => {
			userPreferencesStore.setAnalysisResults(mockAssessmentResults);
			currentStep = 'results';
			isAnalyzing = false;
			showResults = true;
		}, 3000);
	}

	function resetAssessment() {
		currentStep = 'idle';
		isAnalyzing = false;
		showResults = false;
		userPreferencesStore.clearAnalysisResults();
	}

	function handleContinueAfterResults() {
		console.log('Continue after results clicked');
		showResults = false;
	}

	function handleSaveProfile() {
		console.log('Save profile clicked');
		showResults = false;
	}

	// Test different assessment scenarios
	function testBeginnerAssessment() {
		const beginnerResults = {
			...mockAssessmentResults,
			speakingLevel: 15,
			listeningLevel: 20,
			speakingConfidence: 30,
			challengePreference: 'comfortable' as const,
			correctionStyle: 'immediate' as const
		};
		userPreferencesStore.setAnalysisResults(beginnerResults);
		currentStep = 'results';
		showResults = true;
	}

	function testAdvancedAssessment() {
		const advancedResults = {
			...mockAssessmentResults,
			speakingLevel: 85,
			listeningLevel: 90,
			speakingConfidence: 80,
			challengePreference: 'challenging' as const,
			correctionStyle: 'end_of_session' as const
		};
		userPreferencesStore.setAnalysisResults(advancedResults);
		currentStep = 'results';
		showResults = true;
	}

	function testCustomAssessment() {
		const customResults: Partial<UserPreferences> = {
			...mockAssessmentResults,
			learningGoal: 'Travel',
			specificGoals: ['Ordering food', 'Asking directions', 'Shopping'],
			dailyGoalSeconds: 45
		};
		userPreferencesStore.setAnalysisResults(customResults);
		currentStep = 'results';
		showResults = true;
	}

	// Conversation review functions
	function showConversationReviewState() {
		showConversationReview = true;
	}

	function hideConversationReviewState() {
		showConversationReview = false;
	}

	function handleStartNewConversation() {
		console.log('Starting new conversation...');
		hideConversationReviewState();
	}

	function handleAnalyzeConversation() {
		console.log('Analyzing conversation...');
		hideConversationReviewState();
		startMockAssessment();
	}

	function handleGoHome() {
		console.log('Going home...');
		hideConversationReviewState();
	}
</script>

<svelte:head>
	<title>Assessment & Conversation Review Testing - Dev Panel</title>
	<meta
		name="description"
		content="Test the assessment flow, onboarding results, and conversation review state"
	/>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-base-100 to-base-200 p-6">
	<div class="container mx-auto max-w-4xl">
		<div class="mb-8">
			<h1 class="mb-2 text-3xl font-bold text-primary">
				Assessment & Conversation Review Testing Panel
			</h1>
			<p class="text-base-content/70">
				Test the onboarding assessment flow, results display, and conversation review state UX
			</p>
		</div>

		<!-- Message Objects Display -->
		<div class="card mb-6 bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title text-xl">Message Objects Used in Assessment</h2>
				<p class="mb-4 text-base-content/70">
					These are the actual message objects that would be sent to the assessment API:
				</p>
				<div class="max-h-96 overflow-y-auto rounded-lg bg-base-200 p-4">
					<pre class="text-xs whitespace-pre-wrap">{JSON.stringify(
							mockConversationMessages,
							null,
							2
						)}</pre>
				</div>
				<div class="mt-3 text-sm text-base-content/60">
					<strong>Message Count:</strong>
					{mockConversationMessages.length} |
					<strong>Languages:</strong>
					{[...new Set(mockConversationMessages.map((m) => m.sourceLanguage).filter(Boolean))].join(
						', '
					)} |
					<strong>Roles:</strong>
					{[...new Set(mockConversationMessages.map((m) => m.role))].join(', ')}
				</div>
			</div>
		</div>

		<div class="card mb-6 bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title text-xl">Test Conversation Review State</h2>
				<p class="mb-4 text-base-content/70">
					Test the ConversationReviewableState component that shows after a conversation ends
				</p>
				<button class="btn btn-lg btn-secondary" onclick={showConversationReviewState}>
					Show Conversation Review
				</button>
			</div>
		</div>

		<div class="card mb-6 bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title text-xl">Test Assessment Flow</h2>
				<p class="mb-4 text-base-content/70">
					Click the button below to simulate the assessment process and see the results
				</p>
				<button class="btn btn-lg btn-primary" onclick={startMockAssessment}>
					Start Mock Assessment
				</button>
			</div>
		</div>

		<div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<h3 class="card-title text-lg">Beginner Profile</h3>
					<p class="mb-3 text-sm text-base-content/70">
						Test with low skill levels and comfortable challenge preference
					</p>
					<button class="btn btn-outline btn-sm" onclick={testBeginnerAssessment}>
						Test Beginner
					</button>
				</div>
			</div>

			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<h3 class="card-title text-lg">Advanced Profile</h3>
					<p class="mb-3 text-sm text-base-content/70">
						Test with high skill levels and challenging preferences
					</p>
					<button class="btn btn-outline btn-sm" onclick={testAdvancedAssessment}>
						Test Advanced
					</button>
				</div>
			</div>

			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<h3 class="card-title text-lg">Travel Focus</h3>
					<p class="mb-3 text-sm text-base-content/70">
						Test with travel-specific goals and preferences
					</p>
					<button class="btn btn-outline btn-sm" onclick={testCustomAssessment}>
						Test Travel
					</button>
				</div>
			</div>
		</div>

		{#if currentStep === 'analyzing'}
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body text-center">
					<div
						class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"
					>
						<div class="loading loading-lg loading-spinner text-primary"></div>
					</div>
					<h2 class="card-title justify-center text-2xl">Creating Your Learning Profile</h2>
					<p class="mb-6 text-base-content/70">
						We're analyzing our conversation to understand your learning style, goals, and current
						level. This helps us create the perfect personalized experience for you.
					</p>
					<div class="space-y-2 text-sm">
						<div class="flex items-center justify-center gap-2">
							<div class="loading loading-sm loading-dots"></div>
							<span>Assessing your language skills...</span>
						</div>
						<div class="flex items-center justify-center gap-2 text-base-content/50">
							<span>Understanding your goals...</span>
						</div>
						<div class="flex items-center justify-center gap-2 text-base-content/50">
							<span>Personalizing your experience...</span>
						</div>
					</div>
					<button class="btn mt-4 btn-outline btn-sm" onclick={resetAssessment}> Reset </button>
				</div>
			</div>
		{/if}

		{#if showResults && currentStep === 'results'}
			<div class="card mb-6 bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="mb-4 card-title text-xl">Assessment Results Ready</h2>
					<div class="flex gap-2">
						<button class="btn btn-outline btn-sm" onclick={resetAssessment}>
							Reset Assessment
						</button>
						<button class="btn btn-outline btn-sm" onclick={() => startMockAssessment()}>
							Run Again
						</button>
					</div>
				</div>
			</div>
		{/if}

		{#if showResults}
			<OnboardingResults
				results={latestAnalysisResults || mockAssessmentFullResults}
				isVisible={true}
				isGuestUser={true}
				onDismiss={handleContinueAfterResults}
				onSave={handleSaveProfile}
			/>
		{/if}

		{#if showConversationReview}
			<div class="card mb-6 bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="mb-4 card-title text-xl">Conversation Review State Active</h2>
					<div class="mb-4 flex gap-2">
						<button class="btn btn-outline btn-sm" onclick={hideConversationReviewState}>
							Hide Review State
						</button>
						<button
							class="btn btn-outline btn-sm"
							onclick={() => {
								hideConversationReviewState();
								showConversationReviewState();
							}}
						>
							Refresh State
						</button>
					</div>
				</div>
			</div>
			<ConversationReviewableState
				messages={mockConversationMessages}
				language={mockJapaneseLanguage}
				onStartNewConversation={handleStartNewConversation}
				onAnalyzeConversation={handleAnalyzeConversation}
				onGoHome={handleGoHome}
				analysisResults={latestAnalysisResults}
				showAnalysisResults={showResults}
			/>
		{/if}

		<!-- Debug Info -->
		<div class="card mt-6 bg-base-100 shadow-xl">
			<div class="card-body">
				<h3 class="card-title text-lg">Debug Information</h3>
				<div class="space-y-2 text-sm">
					<div><strong>Current Step:</strong> {currentStep}</div>
					<div><strong>Is Analyzing:</strong> {isAnalyzing}</div>
					<div><strong>Show Results:</strong> {showResults}</div>
					<div><strong>Show Conversation Review:</strong> {showConversationReview}</div>
					<div>
						<strong>Has Analysis Results:</strong>
						{userPreferencesStore.hasCurrentAnalysisResults}
					</div>
					<div>
						<strong>Is Currently Analyzing:</strong>
						{userPreferencesStore.isCurrentlyAnalyzing}
					</div>
					<div><strong>Mock Messages Count:</strong> {mockConversationMessages.length}</div>
					<div>
						<strong>Mock Language:</strong>
						{mockJapaneseLanguage.name} ({mockJapaneseLanguage.code})
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
