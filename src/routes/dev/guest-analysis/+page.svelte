<script lang="ts">
	import QuickAnalysis from '$lib/features/analysis/components/QuickAnalysis.svelte';
	import type { Message, Language } from '$lib/server/db/types';
	import { SvelteDate } from 'svelte/reactivity';

	// Mock language
	const mockLanguage: Language = {
		code: 'ja',
		name: 'Japanese',
		nativeName: '日本語',
		id: 'ja',
		isRTL: true,
		flag: '🇯🇵',
		hasRomanization: false,
		writingSystem: '',
		supportedScripts: null,
		isSupported: false
	};

	// Mock conversation messages
	const mockMessages: Message[] = [
		{
			id: 'msg-1',
			conversationId: 'test-session-123',
			role: 'assistant',
			content: 'こんにちは！今日はどんな話題について話しましょうか？',
			timestamp: new SvelteDate('2024-01-20T10:00:00'),
			sequenceId: '1',
			translatedContent: null,
			sourceLanguage: null,
			targetLanguage: null,
			romanization: null,
			hiragana: null,
			otherScripts: null,
			audioUrl: null,
			userNativeLanguage: null,
			translationConfidence: null,
			translationProvider: null,
			translationNotes: null,
			isTranslated: null,
			grammarAnalysis: undefined,
			vocabularyAnalysis: undefined,
			audioUrlExpiresAt: null,
			audioStorageKey: null,
			audioDurationMs: null,
			audioSizeBytes: null,
			audioFormat: null,
			audioSampleRate: null,
			audioChannels: null,
			audioProcessingState: null,
			audioProcessingError: null,
			audioRetentionExpiresAt: null,
			audioDeletedAt: null,
			pronunciationScore: null,
			fluencyScore: null,
			speechRateWpm: null,
			difficultyLevel: null,
			learningTags: undefined,
			conversationContext: null,
			messageIntent: null
		},
		{
			id: 'msg-2',
			conversationId: 'test-session-123',
			role: 'user',
			content: '料理について話したいです。',
			timestamp: new SvelteDate('2024-01-20T10:00:15'),
			sequenceId: '2',
			translatedContent: null,
			sourceLanguage: null,
			targetLanguage: null,
			romanization: null,
			hiragana: null,
			otherScripts: null,
			audioUrl: null,
			userNativeLanguage: null,
			translationConfidence: null,
			translationProvider: null,
			translationNotes: null,
			isTranslated: null,
			grammarAnalysis: undefined,
			vocabularyAnalysis: undefined,
			audioUrlExpiresAt: null,
			audioStorageKey: null,
			audioDurationMs: null,
			audioSizeBytes: null,
			audioFormat: null,
			audioSampleRate: null,
			audioChannels: null,
			audioProcessingState: null,
			audioProcessingError: null,
			audioRetentionExpiresAt: null,
			audioDeletedAt: null,
			pronunciationScore: null,
			fluencyScore: null,
			speechRateWpm: null,
			difficultyLevel: null,
			learningTags: undefined,
			conversationContext: null,
			messageIntent: null
		},
		{
			id: 'msg-3',
			conversationId: 'test-session-123',
			role: 'assistant',
			content: '素晴らしい！どんな料理が好きですか？',
			timestamp: new SvelteDate('2024-01-20T10:00:30'),
			sequenceId: '3',
			translatedContent: null,
			sourceLanguage: null,
			targetLanguage: null,
			romanization: null,
			hiragana: null,
			otherScripts: null,
			audioUrl: null,
			userNativeLanguage: null,
			translationConfidence: null,
			translationProvider: null,
			translationNotes: null,
			isTranslated: null,
			grammarAnalysis: undefined,
			vocabularyAnalysis: undefined,
			audioUrlExpiresAt: null,
			audioStorageKey: null,
			audioDurationMs: null,
			audioSizeBytes: null,
			audioFormat: null,
			audioSampleRate: null,
			audioChannels: null,
			audioProcessingState: null,
			audioProcessingError: null,
			audioRetentionExpiresAt: null,
			audioDeletedAt: null,
			pronunciationScore: null,
			fluencyScore: null,
			speechRateWpm: null,
			difficultyLevel: null,
			learningTags: undefined,
			conversationContext: null,
			messageIntent: null
		},
		{
			id: 'msg-4',
			conversationId: 'test-session-123',
			role: 'user',
			content: '日本料理が大好きです。特に寿司とラーメンが好きです。',
			timestamp: new SvelteDate('2024-01-20T10:01:00'),
			sequenceId: '4',
			translatedContent: null,
			sourceLanguage: null,
			targetLanguage: null,
			romanization: null,
			hiragana: null,
			otherScripts: null,
			audioUrl: null,
			userNativeLanguage: null,
			translationConfidence: null,
			translationProvider: null,
			translationNotes: null,
			isTranslated: null,
			grammarAnalysis: undefined,
			vocabularyAnalysis: undefined,
			audioUrlExpiresAt: null,
			audioStorageKey: null,
			audioDurationMs: null,
			audioSizeBytes: null,
			audioFormat: null,
			audioSampleRate: null,
			audioChannels: null,
			audioProcessingState: null,
			audioProcessingError: null,
			audioRetentionExpiresAt: null,
			audioDeletedAt: null,
			pronunciationScore: null,
			fluencyScore: null,
			speechRateWpm: null,
			difficultyLevel: null,
			learningTags: undefined,
			conversationContext: null,
			messageIntent: null
		},
		{
			id: 'msg-5',
			conversationId: 'test-session-123',
			role: 'assistant',
			content: 'いいですね！寿司やラーメンは本当に美味しいですよね。家で作ったことはありますか？',
			timestamp: new SvelteDate('2024-01-20T10:01:30'),
			sequenceId: '5',
			translatedContent: null,
			sourceLanguage: null,
			targetLanguage: null,
			romanization: null,
			hiragana: null,
			otherScripts: null,
			audioUrl: null,
			userNativeLanguage: null,
			translationConfidence: null,
			translationProvider: null,
			translationNotes: null,
			isTranslated: null,
			grammarAnalysis: undefined,
			vocabularyAnalysis: undefined,
			audioUrlExpiresAt: null,
			audioStorageKey: null,
			audioDurationMs: null,
			audioSizeBytes: null,
			audioFormat: null,
			audioSampleRate: null,
			audioChannels: null,
			audioProcessingState: null,
			audioProcessingError: null,
			audioRetentionExpiresAt: null,
			audioDeletedAt: null,
			pronunciationScore: null,
			fluencyScore: null,
			speechRateWpm: null,
			difficultyLevel: null,
			learningTags: undefined,
			conversationContext: null,
			messageIntent: null
		},
		{
			id: 'msg-6',
			conversationId: 'test-session-123',
			role: 'user',
			content: 'はい、時々ラーメンを作ります。でも、寿司は難しいです。',
			timestamp: new SvelteDate('2024-01-20T10:02:00'),
			sequenceId: '6',
			translatedContent: null,
			sourceLanguage: null,
			targetLanguage: null,
			romanization: null,
			hiragana: null,
			otherScripts: null,
			audioUrl: null,
			userNativeLanguage: null,
			translationConfidence: null,
			translationProvider: null,
			translationNotes: null,
			isTranslated: null,
			grammarAnalysis: undefined,
			vocabularyAnalysis: undefined,
			audioUrlExpiresAt: null,
			audioStorageKey: null,
			audioDurationMs: null,
			audioSizeBytes: null,
			audioFormat: null,
			audioSampleRate: null,
			audioChannels: null,
			audioProcessingState: null,
			audioProcessingError: null,
			audioRetentionExpiresAt: null,
			audioDeletedAt: null,
			pronunciationScore: null,
			fluencyScore: null,
			speechRateWpm: null,
			difficultyLevel: null,
			learningTags: undefined,
			conversationContext: null,
			messageIntent: null
		}
	];

	// Component state
	let isGuestMode = $state(true);
	let analysisType = $state<'onboarding' | 'regular' | 'scenario-generation'>('regular');
	let sessionId = $state('test-session-123');

	function handleStartNewConversation() {
		alert('Starting new conversation (demo)');
	}

	function handleGoToFullAnalysis() {
		alert('Going to full analysis (demo)');
	}

	function handleGoHome() {
		alert('Going home (demo)');
	}
</script>

<svelte:head>
	<title>Guest Analysis Playground - Kaiwa Dev</title>
</svelte:head>

<div class="min-h-screen bg-base-200">
	<!-- Dev Controls -->
	<div class="bg-base-100 p-4 shadow-lg">
		<div class="container mx-auto max-w-4xl">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-2xl font-bold">Guest Analysis Playground</h1>
					<p class="text-sm text-base-content/70">Test the guest conversion flow with mock data</p>
				</div>
				<a href="/dev" class="btn btn-ghost btn-sm">← Back to Dev Menu</a>
			</div>

			<!-- Controls -->
			<div class="mt-4 flex flex-wrap gap-4">
				<!-- Guest Mode Toggle -->
				<div class="form-control">
					<label class="label cursor-pointer gap-2">
						<span class="label-text">Guest Mode</span>
						<input type="checkbox" class="toggle toggle-primary" bind:checked={isGuestMode} />
					</label>
				</div>

				<!-- Analysis Type Selector -->
				<div class="form-control">
					<label class="label">
						<span class="label-text">Analysis Type</span>
					</label>
					<select class="select-bordered select select-sm" bind:value={analysisType}>
						<option value="regular">Regular</option>
						<option value="onboarding">Onboarding</option>
						<option value="scenario-generation">Scenario Generation</option>
					</select>
				</div>

				<!-- Session ID Input -->
				<div class="form-control">
					<label class="label">
						<span class="label-text">Session ID</span>
					</label>
					<input
						type="text"
						class="input-bordered input input-sm w-64"
						bind:value={sessionId}
						placeholder="test-session-123"
					/>
				</div>
			</div>

			<!-- Status Indicator -->
			<div class="mt-4">
				<div class="alert {isGuestMode ? 'alert-warning' : 'alert-success'}">
					<svg
						class="h-6 w-6 shrink-0 stroke-current"
						fill="none"
						viewBox="0 0 24 24"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						></path>
					</svg>
					<div>
						<h3 class="font-bold">
							{isGuestMode ? '👤 Guest User Mode' : '✅ Authenticated User Mode'}
						</h3>
						<div class="text-xs">
							{#if isGuestMode}
								You'll see limited insights (2 of 4) with unlock CTAs
							{:else}
								You'll see full analysis with all insights and features
							{/if}
						</div>
					</div>
				</div>
			</div>

			<!-- Expected Behavior -->
			<div class="mt-4">
				<details class="collapse-arrow collapse bg-base-200">
					<summary class="collapse-title text-sm font-medium">Expected Behavior</summary>
					<div class="collapse-content space-y-2 text-sm">
						{#if isGuestMode}
							<h4 class="font-semibold text-warning">Guest Mode:</h4>
							<ul class="list-inside list-disc space-y-1">
								<li>Quick insights section shows only 2 insights (rest are blurred)</li>
								<li>Lock overlay button: "Unlock X More Insights"</li>
								<li>Main CTA button: "Login to Unlock Full Analysis"</li>
								<li>No "Share" button visible</li>
								<li>Clicking any unlock button shows the modal popup</li>
								<li>Modal has conversation stats and 3 key benefits</li>
								<li>
									"Sign Up Free " redirects to /auth/google?redirect=/analysis?sessionId={sessionId}
								</li>
							</ul>
						{:else}
							<h4 class="font-semibold text-success">Authenticated Mode:</h4>
							<ul class="list-inside list-disc space-y-1">
								<li>All 4 quick insights visible</li>
								<li>No lock overlays</li>
								<li>"Get Full Analysis" button visible</li>
								<li>"Share" button visible</li>
								<li>No guest CTA modals</li>
							</ul>
						{/if}
					</div>
				</details>
			</div>
		</div>
	</div>

	<!-- QuickAnalysis Preview -->
	<QuickAnalysis
		messages={mockMessages}
		language={mockLanguage}
		onStartNewConversation={handleStartNewConversation}
		onGoToFullAnalysis={handleGoToFullAnalysis}
		onGoHome={handleGoHome}
		{analysisType}
		isGuestUser={isGuestMode}
		{sessionId}
	/>
</div>
