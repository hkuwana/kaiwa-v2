<script lang="ts">
	import type { Message, Language } from '$lib/server/db/types';
	import { onMount } from 'svelte';
	import { fade, slide } from 'svelte/transition';
	import AnalysisGuestCta from './AnalysisGuestCta.svelte';

	// Props interface (not used as variable name)
	interface _Props {
		messages: Message[];
		language: Language;
		onStartNewConversation: () => void;
		onDetailedAnalysis: () => void;
		onGoHome: () => void;
		analysisType?: 'onboarding' | 'regular' | 'scenario-generation';
		isGuestUser?: boolean;
		expandable?: boolean;
		isHistorical?: boolean;
		sessionId?: string;
	}

	const {
		messages,
		language,
		onStartNewConversation,
		onDetailedAnalysis,
		onGoHome,
		analysisType = 'regular',
		isGuestUser = false,
		expandable = true,
		isHistorical = false,
		sessionId
	}: _Props = $props();

	let isVisible = $state(false);
	let showShareModal = $state(false);
	let showGuestCta = $state(isGuestUser);
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
						<span class="icon-[mdi--check] h-4 w-4"></span>
						{getAnalysisTypeTitle(analysisType)} Ready
					</div>
				</div>
				{#if isHistorical}
					<div class="mb-3 flex justify-center">
						<div class="badge gap-2 badge-lg badge-info">
							<span class="icon-[mdi--clock-outline] h-4 w-4"></span>
							Historical Conversation
						</div>
					</div>
				{/if}
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
				class="mb-6 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 p-6 shadow-lg {isGuestUser
					? 'relative'
					: ''}"
				transition:slide={{ duration: 400, delay: 300 }}
			>
				<h2 class="mb-4 text-xl font-semibold">Quick Insights</h2>
				<div class="space-y-3">
					{#each quickInsights.slice(0, isGuestUser ? 2 : quickInsights.length) as insight, i (i)}
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
					{#if isGuestUser && quickInsights.length > 2}
						<!-- Blurred remaining insights -->
						{#each quickInsights.slice(2) as insight, i (i + 2)}
							<div
								class="flex items-start gap-3 blur-sm"
								transition:slide={{ duration: 300, delay: 400 + (i + 2) * 100 }}
							>
								<div
									class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/20"
								>
									<span class="text-xs font-bold text-primary">{i + 3}</span>
								</div>
								<p class="text-sm text-base-content/80">{insight}</p>
							</div>
						{/each}
					{/if}
				</div>
				{#if isGuestUser}
					<!-- Lock overlay for guests -->
					<div
						class="absolute right-0 bottom-0 left-0 flex items-center justify-center rounded-b-xl bg-gradient-to-t from-base-200/95 to-transparent pt-8 pb-4"
					>
						<button
							class="btn btn-sm btn-primary"
							onclick={() => (showGuestCta = true)}
							aria-label="Unlock full insights"
						>
							<span class="mr-2 icon-[mdi--lock] h-4 w-4"></span>
							Unlock {quickInsights.length - 2} More Insights
						</button>
					</div>
				{/if}
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
							<button class="btn btn-lg btn-primary" onclick={() => (showGuestCta = true)}>
								<span class="mr-2 icon-[mdi--lock] h-5 w-5"></span>
								Login to Unlock Detailed Analysis
							</button>
						{:else if expandable}
							<button class="btn btn-lg btn-primary" onclick={onDetailedAnalysis}>
								<span class="{getAnalysisTypeIcon(analysisType)} mr-2 h-5 w-5"></span>
								{getCtaText(analysisType)}
							</button>
						{:else}
							<div class="alert alert-info">
								<span class="icon-[mdi--information] h-6 w-6 shrink-0 stroke-current"></span>
								<span>End your conversation to access your learning profile</span>
							</div>
						{/if}
						<button class="btn btn-outline btn-lg" onclick={onStartNewConversation}>
							<span class="mr-2 h-5 w-5 {isHistorical ? 'icon-[mdi--eye]' : 'icon-[mdi--plus]'}"
							></span>
							{isHistorical ? 'View Conversation' : 'Practice More'}
						</button>
						{#if !isGuestUser}
							<button class="btn btn-ghost btn-lg" onclick={() => (showShareModal = true)}>
								<span class="mr-2 icon-[mdi--share-variant] h-5 w-5"></span>
								Share
							</button>
						{/if}
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

<!-- Guest CTA Modal -->
{#if showGuestCta}
	<AnalysisGuestCta
		{sessionId}
		messageCount={conversationStats?.totalMessages}
		conversationDuration={conversationStats?.practiceTime}
		onClose={() => (showGuestCta = false)}
	/>
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
		<div
			class="modal-backdrop"
			onclick={() => (showShareModal = false)}
			role="button"
			tabindex="0"
			onkeydown={(e) => e.key === 'Escape' && (showShareModal = false)}
		></div>
	</div>
{/if}
