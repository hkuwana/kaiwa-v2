<script lang="ts">
	import type { UserPreferences } from '$lib/server/db/types';
	import { DEFAULT_VOICE } from '$lib/types/openai.realtime.types';

	// Mock conversation data with full message object structure
	const mockConversationMessages = [
		{
			id: 'msg-1',
			role: 'user',
			content: 'こんにちは、お元気ですか？',
			timestamp: new Date(Date.now() - 300000),
			language: 'ja',
			conversationId: 'conv-001',
			audioUrl: null,
			transcriptionConfidence: 0.95
		},
		{
			id: 'msg-2',
			role: 'assistant',
			content: "I'm doing well, thank you. I'm learning Japanese for business purposes.",
			timestamp: new Date(Date.now() - 280000),
			language: 'en',
			conversationId: 'conv-001',
			audioUrl: null,
			transcriptionConfidence: null
		},
		{
			id: 'msg-3',
			role: 'user',
			content: 'ビジネスで日本語を学びたいんですね。どのくらいのレベルですか？',
			timestamp: new Date(Date.now() - 260000),
			language: 'ja',
			conversationId: 'conv-001',
			audioUrl: null,
			transcriptionConfidence: 0.92
		},
		{
			id: 'msg-4',
			role: 'assistant',
			content:
				"I'm a beginner, maybe A2 level. I want to be able to have basic business conversations.",
			timestamp: new Date(Date.now() - 240000),
			language: 'en',
			conversationId: 'conv-001',
			audioUrl: null,
			transcriptionConfidence: null
		},
		{
			id: 'msg-5',
			role: 'user',
			content: '素晴らしい目標ですね。どのような場面で日本語を使いたいですか？',
			timestamp: new Date(Date.now() - 220000),
			language: 'ja',
			conversationId: 'conv-001',
			audioUrl: null,
			transcriptionConfidence: 0.89
		},
		{
			id: 'msg-6',
			role: 'assistant',
			content:
				'I need to communicate with Japanese clients and colleagues. Also for business meetings.',
			timestamp: new Date(Date.now() - 200000),
			language: 'en',
			conversationId: 'conv-001',
			audioUrl: null,
			transcriptionConfidence: null
		},
		{
			id: 'msg-7',
			role: 'user',
			content: '会議でのコミュニケーションですね。どのくらいの頻度で練習したいですか？',
			timestamp: new Date(Date.now() - 180000),
			language: 'ja',
			conversationId: 'conv-001',
			audioUrl: null,
			transcriptionConfidence: 0.87
		},
		{
			id: 'msg-8',
			role: 'assistant',
			content: "I'd like to practice 30 minutes every day if possible.",
			timestamp: new Date(Date.now() - 160000),
			language: 'en',
			conversationId: 'conv-001',
			audioUrl: null,
			transcriptionConfidence: null
		}
	];

	// State
	let isSimulating = $state(false);
	let currentStep = $state<'idle' | 'conversation' | 'analysis' | 'results'>('idle');
	let conversationProgress = $state(0);
	let analysisProgress = $state(0);
	let mockResults: Partial<UserPreferences> | null = $state(null);
	let error = $state<string | null>(null);

	// Simulate the full assessment flow
	async function simulateFullAssessment() {
		try {
			isSimulating = true;
			error = null;
			currentStep = 'conversation';
			conversationProgress = 0;

			// Simulate conversation progress
			for (let i = 0; i <= 100; i += 10) {
				conversationProgress = i;
				await new Promise((resolve) => setTimeout(resolve, 200));
			}

			// Move to analysis
			currentStep = 'analysis';
			analysisProgress = 0;

			// Simulate analysis progress
			for (let i = 0; i <= 100; i += 5) {
				analysisProgress = i;
				await new Promise((resolve) => setTimeout(resolve, 100));
			}

			// Generate mock results
			mockResults = generateMockResults();
			currentStep = 'results';
		} catch (err) {
			error = err instanceof Error ? err.message : 'Unknown error occurred';
		} finally {
			isSimulating = false;
		}
	}

	function generateMockResults(): Partial<UserPreferences> {
		// Generate realistic results based on conversation
		const hasBusinessFocus = mockConversationMessages.some(
			(msg) =>
				msg.content.toLowerCase().includes('business') ||
				msg.content.toLowerCase().includes('meeting')
		);
		const hasDailyGoal = mockConversationMessages.some(
			(msg) =>
				msg.content.toLowerCase().includes('30') || msg.content.toLowerCase().includes('daily')
		);

		return {
			id: `dev-assessment-${Date.now()}`,
			userId: 'dev-user',
			targetLanguageId: 'ja',
			learningGoal: hasBusinessFocus ? 'Career' : 'Connection',
			speakingLevel: 25,
			listeningLevel: 30,
			readingLevel: 20,
			writingLevel: 15,
			speakingConfidence: 40,
			specificGoals: hasBusinessFocus
				? ['Business meetings', 'Client communication', 'Professional networking']
				: ['Basic conversations', 'Daily interactions', 'Cultural understanding'],
			challengePreference: 'moderate',
			correctionStyle: 'gentle',
			dailyGoalSeconds: hasDailyGoal ? 30 : 15,
			preferredVoice: DEFAULT_VOICE,
			createdAt: new Date(),
			updatedAt: new Date()
		};
	}

	function resetSimulation() {
		currentStep = 'idle';
		conversationProgress = 0;
		analysisProgress = 0;
		mockResults = null;
		error = null;
	}

	function testAPIEndpoint() {
		// Simulate calling the actual analyze-onboarding API
		const requestBody = {
			conversationMessages: mockConversationMessages.map((msg) => ({
				id: msg.id,
				role: msg.role,
				content: msg.content,
				timestamp: msg.timestamp,
				language: msg.language
			})),
			targetLanguage: 'ja',
			sessionId: 'dev-session-001'
		};

		console.log('Simulating API call to /api/analyze-onboarding:');
		console.log('Request:', requestBody);

		// In a real scenario, this would be:
		// fetch('/api/analyze-onboarding', {
		//   method: 'POST',
		//   headers: { 'Content-Type': 'application/json' },
		//   body: JSON.stringify(requestBody)
		// });
	}
</script>

<svelte:head>
	<title>API Simulation Testing - Dev Panel</title>
	<meta name="description" content="Test the assessment API flow and simulation" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-base-100 to-base-200 p-6">
	<div class="container mx-auto max-w-4xl">
		<div class="mb-8">
			<h1 class="mb-2 text-3xl font-bold text-primary">API Simulation Testing</h1>
			<p class="text-base-content/70">
				Test the complete assessment flow including API simulation and conversation analysis
			</p>
		</div>

		{#if currentStep === 'idle'}
			<div class="card mb-6 bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="card-title text-xl">Simulate Full Assessment Flow</h2>
					<p class="mb-4 text-base-content/70">
						This will simulate the complete flow: conversation → analysis → results
					</p>
					<button
						class="btn btn-lg btn-primary"
						onclick={simulateFullAssessment}
						disabled={isSimulating}
					>
						{isSimulating ? 'Simulating...' : 'Start Full Simulation'}
					</button>
				</div>
			</div>

			<!-- Message Objects Display -->
			<div class="card mb-6 bg-base-100 shadow-xl">
				<div class="card-body">
					<h3 class="card-title text-lg">Message Objects Structure</h3>
					<p class="mb-4 text-base-content/70">
						These are the actual message objects with full structure that would be sent to the API:
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
						{[...new Set(mockConversationMessages.map((m) => m.language))].join(', ')} |
						<strong>Roles:</strong>
						{[...new Set(mockConversationMessages.map((m) => m.role))].join(', ')} |
						<strong>Conversation ID:</strong>
						{mockConversationMessages[0]?.conversationId}
					</div>
					<button class="btn mt-3 btn-outline btn-sm" onclick={testAPIEndpoint}>
						Test API Endpoint (Console)
					</button>
				</div>
			</div>

			<!-- API Request Structure -->
			<div class="card mb-6 bg-base-100 shadow-xl">
				<div class="card-body">
					<h3 class="card-title text-lg">API Request Structure</h3>
					<p class="mb-4 text-base-content/70">
						This is what the API request body would look like:
					</p>
					<div class="rounded-lg bg-base-200 p-4">
						<pre class="text-xs whitespace-pre-wrap">{JSON.stringify(
								{
									conversationMessages: mockConversationMessages.map((msg) => ({
										id: msg.id,
										role: msg.role,
										content: msg.content,
										timestamp: msg.timestamp,
										language: msg.language
									})),
									targetLanguage: 'ja',
									sessionId: 'dev-session-001'
								},
								null,
								2
							)}</pre>
					</div>
				</div>
			</div>
		{/if}

		{#if currentStep === 'conversation'}
			<div class="card mb-6 bg-base-100 shadow-xl">
				<div class="card-body text-center">
					<h2 class="card-title justify-center text-xl">Simulating Conversation</h2>
					<p class="mb-4 text-base-content/70">Recording and processing conversation messages...</p>
					<div class="mb-4 h-4 w-full rounded-full bg-base-200">
						<div
							class="h-4 rounded-full bg-primary transition-all duration-300 ease-out"
							style="width: {conversationProgress}%"
						></div>
					</div>
					<div class="text-sm text-base-content/60">
						Progress: {conversationProgress}%
					</div>
				</div>
			</div>
		{/if}

		{#if currentStep === 'analysis'}
			<div class="card mb-6 bg-base-100 shadow-xl">
				<div class="card-body text-center">
					<div
						class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"
					>
						<div class="loading loading-lg loading-spinner text-primary"></div>
					</div>
					<h2 class="card-title justify-center text-xl">Analyzing Conversation</h2>
					<p class="mb-4 text-base-content/70">
						AI is analyzing your conversation to create your learning profile...
					</p>
					<div class="mb-4 h-4 w-full rounded-full bg-base-200">
						<div
							class="h-4 rounded-full bg-secondary transition-all duration-300 ease-out"
							style="width: {analysisProgress}%"
						></div>
					</div>
					<div class="text-sm text-base-content/60">
						Analysis Progress: {analysisProgress}%
					</div>
				</div>
			</div>
		{/if}

		{#if currentStep === 'results' && mockResults}
			<div class="card mb-6 bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="mb-4 card-title text-xl">Assessment Results Generated</h2>
					<div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
						<div class="space-y-2">
							<div><strong>Learning Goal:</strong> {mockResults.learningGoal}</div>
							<div><strong>Speaking Level:</strong> {mockResults.speakingLevel}/100</div>
							<div><strong>Listening Level:</strong> {mockResults.listeningLevel}/100</div>
							<div><strong>Confidence:</strong> {mockResults.speakingConfidence}%</div>
						</div>
						<div class="space-y-2">
							<div><strong>Challenge Preference:</strong> {mockResults.challengePreference}</div>
							<div><strong>Correction Style:</strong> {mockResults.correctionStyle}</div>
							<div><strong>Daily Goal:</strong> {mockResults.dailyGoalSeconds} minutes</div>
							<div><strong>Specific Goals:</strong></div>
							<div class="flex flex-wrap gap-1">
								{#each mockResults.specificGoals || [] as goal}
									<span class="badge badge-outline badge-xs">{goal}</span>
								{/each}
							</div>
						</div>
					</div>
					<div class="flex gap-2">
						<button class="btn btn-outline btn-sm" onclick={resetSimulation}>
							Reset Simulation
						</button>
						<button class="btn btn-sm btn-primary" onclick={() => simulateFullAssessment()}>
							Run Again
						</button>
					</div>
				</div>
			</div>
		{/if}

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
				<span>Error: {error}</span>
			</div>
		{/if}

		<!-- Debug Info -->
		<div class="card mt-6 bg-base-100 shadow-xl">
			<div class="card-body">
				<h3 class="card-title text-lg">Simulation State</h3>
				<div class="space-y-2 text-sm">
					<div><strong>Current Step:</strong> {currentStep}</div>
					<div><strong>Is Simulating:</strong> {isSimulating}</div>
					<div><strong>Conversation Progress:</strong> {conversationProgress}%</div>
					<div><strong>Analysis Progress:</strong> {analysisProgress}%</div>
					<div><strong>Has Results:</strong> {mockResults ? 'Yes' : 'No'}</div>
				</div>
			</div>
		</div>
	</div>
</div>
