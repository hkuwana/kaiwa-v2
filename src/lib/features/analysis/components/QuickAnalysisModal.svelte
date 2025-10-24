<script lang="ts">
	import type { Message, Language } from '$lib/server/db/types';
	import { onMount } from 'svelte';
	import { fade, slide } from 'svelte/transition';

	// Props interface
	interface Props {
		messages: Message[];
		language: Language | null;
		onStartNewConversation: () => void;
		onGoToFullAnalysis: () => void;
		onGoHome: () => void;
		onClose: () => void;
		analysisType?: 'onboarding' | 'regular' | 'scenario-generation';
		isGuestUser?: boolean;
		isHistorical?: boolean;
		sessionId?: string;
	}

	const {
		messages,
		language,
		onStartNewConversation,
		onGoToFullAnalysis,
		onGoHome,
		onClose,
		analysisType = 'regular',
		isGuestUser = false,
		isHistorical = false,
		sessionId
	}: Props = $props();

	let isVisible = $state(false);
	let quickInsights = $state<string[]>([]);
	let conversationStats = $state<{
		totalMessages: number;
		userMessages: number;
		keyTopics: string[];
		practiceTime: number;
		wordCount: number;
		characterCount: number;
		translationCount: number;
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

		// Generate quick analysis immediately if language is available
		if (language) {
			generateQuickAnalysis();
		}
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

		// Calculate word and character counts
		const userContent = userMessages.map((m: Message) => m.content).join(' ');
		const wordCount = userContent.split(/\s+/).filter((word) => word.length > 0).length;
		const characterCount = userContent.length;

		// Count translation usage (messages with translatedContent)
		const translationCount = userMessages.filter((m: Message) => m.translatedContent).length;

		// Extract key topics from conversation
		const allContent = userContent.toLowerCase();
		const keyTopics = extractKeyTopics(allContent);

		conversationStats = {
			totalMessages,
			userMessages: userMessageCount,
			keyTopics,
			practiceTime,
			wordCount,
			characterCount,
			translationCount
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

	function generateInsights(type: string, stats: typeof conversationStats): string[] {
		if (!stats || !language) return [];

		const isCharacterBased = ['ja', 'ko', 'zh'].includes(language.code);
		const contentMetric = isCharacterBased
			? `${stats.characterCount} characters`
			: `${stats.wordCount} words`;

		switch (type) {
			case 'onboarding':
				return [
					`Great start! You exchanged ${stats.totalMessages} messages in ${language.name}`,
					`You used ${contentMetric} in your responses`,
					`Ready for personalized learning recommendations`,
					'Custom scenarios will be suggested based on your interests'
				];

			case 'scenario-generation':
				return [
					`Conversation topics: ${stats.keyTopics.length > 0 ? stats.keyTopics.join(', ') : 'general conversation'}`,
					`We can create ${Math.min(stats.keyTopics.length + 2, 5)} custom scenarios for you`,
					`Your conversation style shows consistent engagement`,
					'Scenarios will match your interests and skill level'
				];

			default: // regular
				return [
					`Completed ${stats.userMessages} exchanges in ${stats.practiceTime} minutes`,
					`Conversation covered: ${stats.keyTopics.length > 0 ? stats.keyTopics.join(', ') : 'general topics'}`,
					`You used ${contentMetric} with ${stats.translationCount} translations`,
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
				return 'icon-[mdi--account]';
			case 'scenario-generation':
				return 'icon-[mdi--lightbulb-on-outline]';
			default:
				return 'icon-[mdi--chart-bar]';
		}
	}

	function getCtaText(type: string): string {
		switch (type) {
			case 'onboarding':
				return isGuestUser ? 'Create Account to Save Profile' : 'Get Your Learning Profile';
			case 'scenario-generation':
				return 'Generate Custom Scenarios';
			default:
				return 'Get Full Analysis';
		}
	}
</script>

{#if isVisible && language}
	<div class="modal-open modal" transition:fade={{ duration: 300 }}>
		<div class="modal-box max-w-4xl" transition:slide={{ duration: 400, delay: 100 }}>
			<!-- Header -->
			<div class="mb-6 flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div class="badge gap-2 badge-lg badge-success">
						<span class="icon-[mdi--check] h-4 w-4"></span>
						{getAnalysisTypeTitle(analysisType)} Ready
					</div>
					{#if isHistorical}
						<div class="badge gap-2 badge-lg badge-info">
							<span class="icon-[mdi--clock-outline] h-4 w-4"></span>
							Historical Conversation
						</div>
					{/if}
				</div>
				<button class="btn btn-circle btn-ghost btn-sm" onclick={onClose}> ✕ </button>
			</div>

			<div class="mb-6 text-center">
				<h1 class="mb-2 text-3xl font-bold">{getAnalysisTypeTitle(analysisType)}</h1>
				<p class="text-lg text-base-content/70">
					Your {language.name} conversation {isHistorical
						? 'from a previous session'
						: 'has been reviewed'}
				</p>
			</div>

			<!-- Quick Stats -->
			{#if conversationStats}
				<div
					class="mb-6 rounded-xl bg-base-100 p-6 shadow-lg"
					transition:slide={{ duration: 400, delay: 200 }}
				>
					<h2 class="mb-4 flex items-center text-xl font-semibold">
						<span class="{getAnalysisTypeIcon(analysisType)} mr-2 h-5 w-5 text-primary"></span>
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
							<div class="stat-title text-sm">Duration</div>
							<div class="stat-value text-2xl text-info">{conversationStats.practiceTime}m</div>
						</div>
						<div class="stat p-2">
							<div class="stat-title text-sm">
								{['ja', 'ko', 'zh'].includes(language?.code || '') ? 'Characters' : 'Words'}
							</div>
							<div class="stat-value text-2xl text-accent">
								{['ja', 'ko', 'zh'].includes(language?.code || '')
									? conversationStats.characterCount
									: conversationStats.wordCount}
							</div>
						</div>
					</div>
					{#if conversationStats.translationCount > 0}
						<div class="mt-4 flex justify-center">
							<div class="badge gap-2 badge-outline">
								<span class="icon-[mdi--translate] h-4 w-4"></span>
								{conversationStats.translationCount} translations used
							</div>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Quick Insights -->
			<div
				class="mb-6 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 p-6 shadow-lg"
				transition:slide={{ duration: 400, delay: 300 }}
			>
				<h2 class="mb-4 text-xl font-semibold">Quick Insights</h2>
				<div class="space-y-3">
					{#each quickInsights as insight, i (i)}
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
							{#if isGuestUser}
								Create an account to save your learning profile with personalized recommendations
								and goals.
							{:else}
								Get your complete learning profile with personalized recommendations and goals.
							{/if}
						{:else if analysisType === 'scenario-generation'}
							Generate custom practice scenarios based on your conversation topics and interests.
						{:else if isGuestUser}
							Sign up to get detailed feedback on grammar, vocabulary, and personalized
							recommendations.
						{:else}
							Get detailed feedback on grammar, vocabulary, pronunciation, and personalized
							recommendations.
						{/if}
					</p>
					<div class="flex flex-col justify-center gap-3 sm:flex-row">
						{#if isGuestUser}
							<!-- Guest user sees login CTA -->
							<button class="btn btn-lg btn-primary" onclick={onGoToFullAnalysis}>
								<span class="mr-2 icon-[mdi--lock] h-5 w-5"></span>
								Login to Unlock Full Analysis
							</button>
						{:else}
							<button class="btn btn-lg btn-primary" onclick={onGoToFullAnalysis}>
								<span class="{getAnalysisTypeIcon(analysisType)} mr-2 h-5 w-5"></span>
								{getCtaText(analysisType)}
							</button>
						{/if}
						<button class="btn btn-outline btn-lg" onclick={onGoHome}>
							<span class="mr-2 icon-[mdi--home] h-5 w-5"></span>
							Go Home
						</button>
					</div>
				</div>
			</div>

			<!-- Secondary Actions -->
			<div class="flex justify-center">
				<button class="btn btn-ghost" onclick={onGoHome}> ← Back to Home </button>
			</div>
		</div>
		<div
			class="modal-backdrop"
			onclick={onClose}
			role="button"
			tabindex="0"
			onkeydown={(e) => e.key === 'Escape' && onClose()}
		></div>
	</div>
{/if}
