<script lang="ts">
	import type { Message, Language } from '$lib/server/db/types';
	import { onMount } from 'svelte';
	import { fade, slide } from 'svelte/transition';

	// Props interface
	interface Props {
		messages: Message[];
		language: Language | null;
		onStartNewConversation: () => void;
		onDetailedAnalysis: () => void;
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
		onDetailedAnalysis,
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
</script>

{#if isVisible && language}
	<div class="modal-open modal" transition:fade={{ duration: 300 }}>
		<div
			class="relative modal-box max-w-2xl px-4 py-5 sm:max-w-4xl sm:px-6 sm:py-8"
			transition:slide={{ duration: 400, delay: 100 }}
		>
			<!-- Close Button - Absolutely Positioned -->
			<button
				class="btn absolute top-5 right-4 btn-circle btn-ghost btn-md sm:top-8 sm:right-6 sm:btn-lg"
				onclick={onClose}
			>
				✕
			</button>

			<!-- Header -->
			<div class="mb-3 flex items-center gap-2 sm:mb-6 sm:gap-3">
				<div class="badge gap-1 badge-sm badge-success sm:gap-2 sm:badge-lg">
					<span class="icon-[mdi--check] h-3 w-3 sm:h-4 sm:w-4"></span>
					<span class="text-xs sm:text-sm">{getAnalysisTypeTitle(analysisType)} Ready</span>
				</div>
			</div>

			<div class="mb-4 text-center sm:mb-6">
				<h1 class="mb-1 text-2xl font-bold sm:mb-2 sm:text-3xl">
					{getAnalysisTypeTitle(analysisType)}
				</h1>
				<p class="text-xs text-base-content/70 sm:text-base">
					Your {language.name} conversation {isHistorical
						? 'from a previous session'
						: 'has been reviewed'}
				</p>
			</div>

			<!-- Quick Stats -->
			{#if conversationStats}
				<div
					class="mb-4 rounded-lg bg-base-100 p-3 shadow sm:mb-6 sm:rounded-xl sm:p-6"
					transition:slide={{ duration: 400, delay: 200 }}
				>
					<h2 class="mb-2 flex items-center text-base font-semibold sm:mb-4 sm:text-xl">
						<span
							class="{getAnalysisTypeIcon(analysisType)} mr-2 h-4 w-4 text-primary sm:h-5 sm:w-5"
						></span>
						<span class="truncate">Overview</span>
					</h2>
					<div class="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-4">
						<div class="stat p-1 sm:p-2">
							<div class="stat-title text-xs sm:text-sm">Messages</div>
							<div class="stat-value text-lg text-primary sm:text-2xl">
								{conversationStats.totalMessages}
							</div>
						</div>
						<div class="stat p-1 sm:p-2">
							<div class="stat-title text-xs sm:text-sm">Your Input</div>
							<div class="stat-value text-lg text-secondary sm:text-2xl">
								{conversationStats.userMessages}
							</div>
						</div>
						<div class="stat p-1 sm:p-2">
							<div class="stat-title text-xs sm:text-sm">Duration</div>
							<div class="stat-value text-lg text-info sm:text-2xl">
								{conversationStats.practiceTime}m
							</div>
						</div>
						<div class="stat p-1 sm:p-2">
							<div class="stat-title text-xs sm:text-sm">
								{['ja', 'ko', 'zh'].includes(language?.code || '') ? 'Chars' : 'Words'}
							</div>
							<div class="stat-value text-lg text-accent sm:text-2xl">
								{['ja', 'ko', 'zh'].includes(language?.code || '')
									? conversationStats.characterCount
									: conversationStats.wordCount}
							</div>
						</div>
					</div>
					{#if conversationStats.translationCount > 0}
						<div class="mt-2 flex justify-center sm:mt-4">
							<div class="badge gap-1 badge-outline badge-sm sm:gap-2 sm:badge-md">
								<span class="icon-[mdi--translate] h-3 w-3 sm:h-4 sm:w-4"></span>
								<span class="text-xs sm:text-sm"
									>{conversationStats.translationCount} translations</span
								>
							</div>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Action Buttons -->
			<div
				class="flex flex-col justify-center gap-2 sm:gap-3"
				transition:slide={{ duration: 400, delay: 300 }}
			>
				<button
					class="btn btn-sm btn-primary sm:btn-lg"
					onclick={() => {
						onDetailedAnalysis();
						onClose();
					}}
				>
					<span class="icon-[mdi--chart-box-outline] h-4 w-4 sm:h-5 sm:w-5"></span>
					Get Further Analysis
				</button>
				<button class="btn btn-outline btn-sm sm:btn-lg" onclick={onGoHome}>
					<span class="icon-[mdi--chat-plus] h-4 w-4 sm:h-5 sm:w-5"></span>
					Try new chat
				</button>
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
