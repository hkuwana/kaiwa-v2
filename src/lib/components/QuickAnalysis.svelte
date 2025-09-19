<script lang="ts">
	import type { Message, Language } from '$lib/server/db/types';
	import { onMount } from 'svelte';
	import { fade, slide } from 'svelte/transition';

	interface Props {
		messages: Message[];
		language: Language;
		onStartNewConversation: () => void;
		onGoToFullAnalysis: () => void;
		onGoHome: () => void;
		analysisType?: 'onboarding' | 'regular' | 'scenario-generation';
	}

	const {
		messages,
		language,
		onStartNewConversation,
		onGoToFullAnalysis,
		onGoHome,
		analysisType = 'regular'
	} = $props();

	let isVisible = $state(false);
	let showShareModal = $state(false);
	let quickInsights = $state<string[]>([]);
	let conversationStats = $state<{
		totalMessages: number;
		userMessages: number;
		estimatedLevel: string;
		keyTopics: string[];
		practiceTime: number;
	} | null>(null);

	// Filter out placeholder messages
	const displayMessages = $derived(
		messages.filter(
			(message: Message) =>
				message.content &&
				message.content.trim().length > 0 &&
				!message.content.includes('[Speaking...]') &&
				!message.content.includes('[Transcribing...]')
		)
	);

	const userMessages = $derived(displayMessages.filter((m: Message) => m.role === 'user'));

	onMount(() => {
		// Show component with animation
		setTimeout(() => {
			isVisible = true;
		}, 100);

		// Generate quick analysis immediately
		generateQuickAnalysis();
	});

	function generateQuickAnalysis() {
		// Calculate basic stats
		const totalMessages = displayMessages.length;
		const userMessageCount = userMessages.length;
		const practiceTime =
			displayMessages.length > 0
				? Math.round(
						(displayMessages[displayMessages.length - 1].timestamp.getTime() -
							displayMessages[0].timestamp.getTime()) /
							60000
					)
				: 0;

		// Extract key topics from conversation
		const allContent = userMessages
			.map((m: Message) => m.content)
			.join(' ')
			.toLowerCase();
		const keyTopics = extractKeyTopics(allContent);

		// Estimate level based on message complexity
		const estimatedLevel = estimateLevel(userMessages);

		conversationStats = {
			totalMessages,
			userMessages: userMessageCount,
			estimatedLevel,
			keyTopics,
			practiceTime
		};

		// Generate quick insights based on analysis type
		quickInsights = generateInsights(analysisType, conversationStats);
	}

	function extractKeyTopics(content: string): string[] {
		const topicKeywords = [
			'work',
			'job',
			'career',
			'business',
			'meeting',
			'travel',
			'vacation',
			'trip',
			'hotel',
			'flight',
			'food',
			'restaurant',
			'cooking',
			'family',
			'friends',
			'hobby',
			'sport',
			'music',
			'movie',
			'shopping',
			'health'
		];

		return topicKeywords.filter((keyword) => content.includes(keyword)).slice(0, 3);
	}

	function estimateLevel(userMessages: Message[]): string {
		if (userMessages.length === 0) return 'beginner';

		const avgWordsPerMessage =
			userMessages.reduce((sum, msg) => sum + msg.content.split(' ').length, 0) /
			userMessages.length;

		if (avgWordsPerMessage < 3) return 'beginner';
		if (avgWordsPerMessage < 8) return 'intermediate';
		return 'advanced';
	}

	function generateInsights(type: string, stats: typeof conversationStats): string[] {
		if (!stats) return [];

		switch (type) {
			case 'onboarding':
				return [
					`Great start! You exchanged ${stats.totalMessages} messages in ${language.name}`,
					`Your conversation style suggests ${stats.estimatedLevel} level`,
					`Ready for personalized learning recommendations`,
					'Custom scenarios will be suggested based on your interests'
				];

			case 'scenario-generation':
				return [
					`Conversation topics: ${stats.keyTopics.length > 0 ? stats.keyTopics.join(', ') : 'general conversation'}`,
					`We can create ${Math.min(stats.keyTopics.length + 2, 5)} custom scenarios for you`,
					`Your ${stats.estimatedLevel} level conversations are perfect for targeted practice`,
					'Scenarios will match your interests and skill level'
				];

			default: // regular
				return [
					`Completed ${stats.userMessages} exchanges in ${stats.practiceTime} minutes`,
					`Conversation covered: ${stats.keyTopics.length > 0 ? stats.keyTopics.join(', ') : 'general topics'}`,
					`Your ${stats.estimatedLevel} level responses show consistent progress`,
					'Ready for detailed grammar and vocabulary analysis'
				];
		}
	}

	function getAnalysisTypeTitle(type: string): string {
		switch (type) {
			case 'onboarding':
				return 'Welcome Analysis';
			case 'scenario-generation':
				return 'Scenario Suggestions';
			default:
				return 'Quick Analysis';
		}
	}

	function getAnalysisTypeIcon(type: string): string {
		switch (type) {
			case 'onboarding':
				return 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z';
			case 'scenario-generation':
				return 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547A8.014 8.014 0 004 21h16a8.014 8.014 0 00-.244-5.572z';
			default:
				return 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z';
		}
	}

	function getCtaText(type: string): string {
		switch (type) {
			case 'onboarding':
				return 'Get Your Learning Profile';
			case 'scenario-generation':
				return 'Generate Custom Scenarios';
			default:
				return 'Get Full Analysis';
		}
	}
</script>

{#if isVisible}
	<div
		class="min-h-screen bg-gradient-to-br from-base-100 to-base-200"
		transition:fade={{ duration: 300 }}
	>
		<div class="container mx-auto max-w-4xl px-4 py-6">
			<!-- Header -->
			<div class="mb-6 text-center" transition:slide={{ duration: 400, delay: 100 }}>
				<div class="mb-4 flex justify-center">
					<div class="badge gap-2 badge-lg badge-success">
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							/>
						</svg>
						{getAnalysisTypeTitle(analysisType)} Ready
					</div>
				</div>
				<h1 class="mb-2 text-3xl font-bold">{getAnalysisTypeTitle(analysisType)}</h1>
				<p class="text-lg text-base-content/70">
					Your {language.name} conversation has been reviewed
				</p>
			</div>

			<!-- Quick Stats -->
			{#if conversationStats}
				<div
					class="mb-6 rounded-xl bg-base-100 p-6 shadow-lg"
					transition:slide={{ duration: 400, delay: 200 }}
				>
					<h2 class="mb-4 flex items-center text-xl font-semibold">
						<svg
							class="mr-2 h-5 w-5 text-primary"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d={getAnalysisTypeIcon(analysisType)}
							/>
						</svg>
						Conversation Overview
					</h2>
					<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
						<div class="stat p-2">
							<div class="stat-title text-sm">Messages</div>
							<div class="stat-value text-2xl text-primary">{conversationStats.totalMessages}</div>
						</div>
						<div class="stat p-2">
							<div class="stat-title text-sm">Your Input</div>
							<div class="stat-value text-2xl text-secondary">{conversationStats.userMessages}</div>
						</div>
						<div class="stat p-2">
							<div class="stat-title text-sm">Level</div>
							<div class="stat-value text-xl text-accent capitalize">
								{conversationStats.estimatedLevel}
							</div>
						</div>
						<div class="stat p-2">
							<div class="stat-title text-sm">Duration</div>
							<div class="stat-value text-2xl text-info">{conversationStats.practiceTime}m</div>
						</div>
					</div>
				</div>
			{/if}

			<!-- Quick Insights -->
			<div
				class="mb-6 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 p-6 shadow-lg"
				transition:slide={{ duration: 400, delay: 300 }}
			>
				<h2 class="mb-4 text-xl font-semibold">Quick Insights</h2>
				<div class="space-y-3">
					{#each quickInsights as insight, i}
						<div
							class="flex items-start gap-3"
							transition:slide={{ duration: 300, delay: 400 + i * 100 }}
						>
							<div
								class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/20"
							>
								<span class="text-xs font-bold text-primary">{i + 1}</span>
							</div>
							<p class="text-sm text-base-content/80">{insight}</p>
						</div>
					{/each}
				</div>
			</div>

			<!-- Call to Action -->
			<div class="mb-6 text-center" transition:slide={{ duration: 400, delay: 600 }}>
				<div class="rounded-xl bg-base-100 p-6 shadow-lg">
					<h3 class="mb-3 text-lg font-semibold">Ready for More?</h3>
					<p class="mb-4 text-base-content/70">
						{#if analysisType === 'onboarding'}
							Get your complete learning profile with personalized recommendations and goals.
						{:else if analysisType === 'scenario-generation'}
							Generate custom practice scenarios based on your conversation topics and interests.
						{:else}
							Get detailed feedback on grammar, vocabulary, pronunciation, and personalized
							recommendations.
						{/if}
					</p>
					<div class="flex flex-col justify-center gap-3 sm:flex-row">
						<button class="btn btn-lg btn-primary" onclick={onGoToFullAnalysis}>
							<svg class="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d={getAnalysisTypeIcon(analysisType)}
								/>
							</svg>
							{getCtaText(analysisType)}
						</button>
						<button class="btn btn-outline btn-lg" onclick={onStartNewConversation}>
							<svg class="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 6v6m0 0v6m0-6h6m-6 0H6"
								/>
							</svg>
							Practice More
						</button>
						<button class="btn btn-ghost btn-lg" onclick={() => (showShareModal = true)}>
							<svg class="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
								/>
							</svg>
							Share
						</button>
					</div>
				</div>
			</div>

			<!-- Secondary Actions -->
			<div class="flex justify-center">
				<button class="btn btn-ghost" onclick={onGoHome}> ← Back to Home </button>
			</div>
		</div>
	</div>
{/if}

<!-- Share Modal -->
{#if showShareModal}
	<div class="modal-open modal">
		<div class="modal-box">
			<div class="mb-4 flex items-center justify-between">
				<h3 class="text-lg font-bold">Share Your Progress</h3>
				<button class="btn btn-circle btn-ghost btn-sm" onclick={() => (showShareModal = false)}>
					✕
				</button>
			</div>

			<div class="py-4">
				<!-- Import ShareKaiwa component -->
				<div class="rounded-lg bg-base-200 p-6 text-center">
					<h4 class="mb-2 font-medium">🎉 Great work on your {language.name} practice!</h4>
					<p class="mb-4 text-sm text-base-content/70">
						You completed {conversationStats?.userMessages || 0} exchanges
						{#if conversationStats?.keyTopics.length}
							covering {conversationStats.keyTopics.join(', ')}
						{/if}
					</p>
					<div class="flex flex-wrap justify-center gap-2">
						<div class="badge badge-primary">{conversationStats?.totalMessages || 0} messages</div>
						<div class="badge badge-secondary">
							{conversationStats?.estimatedLevel || 'beginner'} level
						</div>
						{#if conversationStats?.practiceTime}
							<div class="badge badge-accent">{conversationStats.practiceTime}min practice</div>
						{/if}
					</div>
				</div>
			</div>

			<div class="modal-action">
				<button class="btn" onclick={() => (showShareModal = false)}>Close</button>
			</div>
		</div>
		<div class="modal-backdrop" onclick={() => (showShareModal = false)}></div>
	</div>
{/if}
