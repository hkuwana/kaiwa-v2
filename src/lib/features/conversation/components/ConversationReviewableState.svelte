<script lang="ts">
	import type { Message, UserPreferences } from '$lib/server/db/types';
	import type { Language } from '$lib/server/db/types';
	import UnifiedConversationBubble from '$lib/features/analysis/components/UnifiedConversationBubble.svelte';
	import OnboardingResults from '$lib/features/scenarios/components/OnboardingResults.svelte';
	import type { AnalysisMessage } from '$lib/features/analysis/services/analysis.service';
	import { userManager } from '$lib/stores/user.store.svelte';
	import { analysisStore } from '$lib/features/analysis/stores/analysis.store.svelte';
	import ShareKaiwa from '$lib/components/ShareKaiwa.svelte';
	import { track } from '$lib/analytics/posthog';
	import { onMount } from 'svelte';

	interface Props {
		messages: Message[];
		language: Language;
		onStartNewConversation: () => void;
		onAnalyzeConversation: () => void;
		onGoHome: () => void;
		analysisResults?: UserPreferences | null;
		showAnalysisResults?: boolean;
	}

	const {
		messages,
		language,
		onStartNewConversation,
		onAnalyzeConversation,
		onGoHome,
		analysisResults = null,
		showAnalysisResults = false
	}: Props = $props();

	// State for mobile-friendly sections and analytics
	let currentSection = $state<'summary' | 'analytics' | 'conversation' | 'results'>('summary');
	let showDeeperAnalytics = $state(false);
	let isAnalyzing = $state(false);
	let showShareModal = $state(false);
	let quotaStatus = $state<{
		canAnalyze: boolean;
		remainingAnalyses: number;
		resetTime: Date;
		tier: string;
		quotaExceeded: boolean;
		upgradeRequired: boolean;
	} | null>(null);

	// Filter out placeholder messages for display
	const displayMessages = $derived(
		messages.filter(
			(message: Message) =>
				message.content &&
				message.content.trim().length > 0 &&
				!message.content.includes('[Speaking...]') &&
				!message.content.includes('[Transcribing...]')
		)
	);

	// Group messages by role for better organization
	const userMessages = $derived(displayMessages.filter((m: Message) => m.role === 'user'));
	const assistantMessages = $derived(
		displayMessages.filter((m: Message) => m.role === 'assistant')
	);

	// Calculate conversation analytics
	const conversationAnalytics = $derived({
		totalMessages: displayMessages.length,
		userMessages: userMessages.length,
		assistantMessages: assistantMessages.length,
		averageWordsPerMessage: Math.round(
			displayMessages.reduce((sum, msg) => sum + msg.content.split(' ').length, 0) /
				displayMessages.length || 0
		),
		conversationDuration:
			displayMessages.length > 0
				? Math.round(
						(displayMessages[displayMessages.length - 1].timestamp.getTime() -
							displayMessages[0].timestamp.getTime()) /
							60000
					)
				: 0,
		languageMix: {
			userLanguage: userMessages.filter((m) => m.sourceLanguage === language.code).length,
			targetLanguage: userMessages.filter((m) => m.sourceLanguage !== language.code).length
		}
	});

	const isFree = $derived(userManager.isFree);

	// Convert Message[] to AnalysisMessage[] for UnifiedConversationBubble
	const analysisMessages = $derived(
		displayMessages.map(
			(message): AnalysisMessage => ({
				id: message.id,
				role: message.role,
				content: message.content,
				timestamp: message.timestamp
			})
		)
	);

	// Keep unified conversation state in sync with current messages for downstream components
	$effect(() => {
		if (analysisMessages.length > 0) {
			analysisStore.setUnifiedConversationMessages(analysisMessages);
		}
	});

	const unifiedConversationState = $derived(analysisStore.unifiedConversation);
	const conversationSuggestions = $derived(unifiedConversationState.suggestions ?? []);
	const unifiedMessages = $derived(
		unifiedConversationState.messages.length ? unifiedConversationState.messages : analysisMessages
	);

	function handleUpsellClick() {
		track('upsell_banner_clicked', {
			source: 'conversation_review',
			tier: userManager.effectiveTier
		});
		window.location.href = '/pricing?utm_source=app&utm_medium=upsell&utm_campaign=early_backer';
	}

	async function handleAnalyzeConversation() {
		// Check quota first if user is logged in
		if (userManager.isLoggedIn) {
			try {
				const quotaCheck = await fetch('/api/analysis/quota-check', {
					method: 'GET',
					headers: { 'Content-Type': 'application/json' }
				});

				if (quotaCheck.ok) {
					const fetchedQuotaStatus = await quotaCheck.json();
					quotaStatus = fetchedQuotaStatus;

					if (!fetchedQuotaStatus.canAnalyze) {
						// Don't proceed with analysis
						return;
					}
				}
			} catch (error) {
				console.warn('Could not check quota:', error);
				// Continue with analysis anyway if quota check fails
			}
		}

		isAnalyzing = true;
		currentSection = 'results';
		track('analyze_conversation_clicked', {
			source: 'conversation_review',
			messageCount: displayMessages.length
		});

		const conversationId =
			displayMessages[0]?.conversationId ||
			`analysis-review-${
				typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
					? crypto.randomUUID()
					: Date.now()
			}`;
		const moduleIds = ['quick-stats', 'grammar-suggestions', 'language-assessment'];

		try {
			await analysisStore.runAnalysis(conversationId, language.code, analysisMessages, moduleIds);
		} catch (error) {
			console.error('Failed to run analysis from review state', error);
		}

		onAnalyzeConversation();
		isAnalyzing = false;
	}

	function handleShowDeeperAnalytics() {
		showDeeperAnalytics = !showDeeperAnalytics;
		track('deeper_analytics_toggled', {
			source: 'conversation_review',
			expanded: showDeeperAnalytics
		});
	}

	function scrollToSection(section: typeof currentSection) {
		currentSection = section;
		const element = document.getElementById(`section-${section}`);
		if (element) {
			element.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}

	// Load quota status on mount if user is logged in
	onMount(async () => {
		if (userManager.isLoggedIn) {
			try {
				const quotaCheck = await fetch('/api/analysis/quota-check');
				if (quotaCheck.ok) {
					quotaStatus = await quotaCheck.json();
				}
			} catch (error) {
				console.warn('Could not load quota status:', error);
			}
		}
	});
</script>

<div class="min-h-screen bg-gradient-to-br from-base-100 to-base-200">
	<!-- Mobile-friendly sticky navigation -->
	<div
		class="sticky top-0 z-10 border-b border-base-300/20 bg-base-100/80 backdrop-blur-sm md:hidden"
	>
		<div class="flex overflow-x-auto px-4 py-2">
			<button
				class="btn btn-sm {currentSection === 'summary'
					? 'btn-primary'
					: 'btn-ghost'} mr-2 flex-shrink-0"
				onclick={() => scrollToSection('summary')}
			>
				Summary
			</button>
			<button
				class="btn btn-sm {currentSection === 'analytics'
					? 'btn-primary'
					: 'btn-ghost'} mr-2 flex-shrink-0"
				onclick={() => scrollToSection('analytics')}
			>
				Analytics
			</button>
			<button
				class="btn btn-sm {currentSection === 'conversation'
					? 'btn-primary'
					: 'btn-ghost'} mr-2 flex-shrink-0"
				onclick={() => scrollToSection('conversation')}
			>
				Messages
			</button>
			<button
				class="btn btn-sm {currentSection === 'results'
					? 'btn-primary'
					: 'btn-ghost'} flex-shrink-0"
				onclick={() => scrollToSection('results')}
			>
				Results
			</button>
		</div>
	</div>

	<div class="container mx-auto max-w-4xl px-4 py-6 md:py-8">
		<!-- Header -->
		<div id="section-summary" class="mb-6 text-center md:mb-8">
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
					Conversation Complete
				</div>
			</div>
			<div class="mb-2 text-2xl font-bold md:text-3xl">Review Your Conversation</div>
			<p class="text-base text-base-content/70 md:text-lg">
				Your {language.name} conversation is ready for review
			</p>
		</div>

		<!-- Quota Status Display -->
		{#if quotaStatus && quotaStatus.quotaExceeded}
			<div class="mb-4 rounded-xl border border-warning/20 bg-warning/10 p-4 text-center md:mb-6">
				<div class="mb-2 flex justify-center">
					<svg class="h-6 w-6 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
						/>
					</svg>
				</div>
				<h3 class="mb-1 font-semibold text-warning">Analysis Limit Reached</h3>
				<p class="mb-3 text-sm text-base-content/70">
					{#if quotaStatus.upgradeRequired}
						You've used your daily analysis. Upgrade to get more analyses!
					{:else}
						You've used your monthly analyses. Quota resets: {quotaStatus.resetTime.toLocaleDateString()}
					{/if}
				</p>
				{#if quotaStatus.upgradeRequired}
					<button class="btn btn-sm btn-warning" onclick={handleUpsellClick}> Upgrade Now </button>
				{/if}
			</div>
		{:else if quotaStatus && userManager.isLoggedIn}
			<div class="mb-4 rounded-xl border border-info/20 bg-info/10 p-3 text-center md:mb-6">
				<p class="text-sm text-info">
					{#if quotaStatus.remainingAnalyses === -1}
						✨ Unlimited analyses available
					{:else}
						{quotaStatus.remainingAnalyses} analysis{quotaStatus.remainingAnalyses === 1
							? ''
							: 'es'} remaining ({quotaStatus.tier} tier)
					{/if}
				</p>
			</div>
		{/if}

		<!-- Primary Action Buttons -->
		<div class="mb-6 flex flex-col justify-center gap-3 sm:flex-row md:mb-8 md:gap-4">
			<button
				class="btn flex-1 gap-2 btn-lg sm:flex-none {quotaStatus?.quotaExceeded
					? 'btn-disabled'
					: 'btn-primary'}"
				onclick={handleAnalyzeConversation}
				disabled={quotaStatus?.quotaExceeded}
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
					/>
				</svg>
				{quotaStatus?.quotaExceeded ? 'Analysis Limit Reached' : 'Get Learning Analysis'}
			</button>

			<button
				class="btn flex-1 gap-2 btn-outline btn-lg sm:flex-none"
				onclick={onStartNewConversation}
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 6v6m0 0v6m0-6h6m-6 0H6"
					/>
				</svg>
				Practice More
			</button>
		</div>

		<!-- Quick Stats -->
		<div class="mb-6 rounded-xl bg-base-100 p-4 shadow-lg md:mb-8 md:p-6">
			<h2 class="mb-4 text-lg font-semibold md:text-xl">Conversation Overview</h2>
			<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
				<div class="stat p-2">
					<div class="stat-title text-xs md:text-sm">Messages</div>
					<div class="stat-value text-lg text-primary md:text-2xl">
						{conversationAnalytics.totalMessages}
					</div>
				</div>
				<div class="stat p-2">
					<div class="stat-title text-xs md:text-sm">Duration</div>
					<div class="stat-value text-lg text-secondary md:text-2xl">
						{conversationAnalytics.conversationDuration}m
					</div>
				</div>
				<div class="stat p-2">
					<div class="stat-title text-xs md:text-sm">Your Input</div>
					<div class="stat-value text-lg text-accent md:text-2xl">
						{conversationAnalytics.userMessages}
					</div>
				</div>
				<div class="stat p-2">
					<div class="stat-title text-xs md:text-sm">Avg Words</div>
					<div class="stat-value text-lg text-info md:text-2xl">
						{conversationAnalytics.averageWordsPerMessage}
					</div>
				</div>
			</div>
		</div>

		<!-- Deeper Analytics Section -->
		<div id="section-analytics" class="mb-6 md:mb-8">
			<div
				class="rounded-xl border border-secondary/20 bg-gradient-to-r from-secondary/5 to-primary/5 p-4 shadow-lg md:p-6"
			>
				<div class="mb-4 flex flex-col items-start justify-between sm:flex-row sm:items-center">
					<h2 class="mb-2 text-lg font-semibold sm:mb-0 md:text-xl">Conversation Insights</h2>
					<button class="btn btn-sm btn-secondary" onclick={handleShowDeeperAnalytics}>
						<svg class="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
							/>
						</svg>
						{showDeeperAnalytics ? 'Hide' : 'Show'} Deeper Analytics
					</button>
				</div>

				{#if showDeeperAnalytics}
					<div class="space-y-4">
						<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
							<div class="rounded-lg bg-base-100/50 p-4">
								<h3 class="mb-2 text-sm font-semibold text-secondary">Language Usage</h3>
								<div class="space-y-1 text-sm">
									<div class="flex justify-between">
										<span>{language.name}:</span>
										<span class="font-medium"
											>{conversationAnalytics.languageMix.userLanguage} messages</span
										>
									</div>
									<div class="flex justify-between">
										<span>English:</span>
										<span class="font-medium"
											>{conversationAnalytics.languageMix.targetLanguage} messages</span
										>
									</div>
								</div>
							</div>
							<div class="rounded-lg bg-base-100/50 p-4">
								<h3 class="mb-2 text-sm font-semibold text-secondary">Participation</h3>
								<div class="space-y-1 text-sm">
									<div class="flex justify-between">
										<span>Your messages:</span>
										<span class="font-medium"
											>{Math.round(
												(conversationAnalytics.userMessages / conversationAnalytics.totalMessages) *
													100
											)}%</span
										>
									</div>
									<div class="flex justify-between">
										<span>Tutor responses:</span>
										<span class="font-medium"
											>{Math.round(
												(conversationAnalytics.assistantMessages /
													conversationAnalytics.totalMessages) *
													100
											)}%</span
										>
									</div>
								</div>
							</div>
						</div>

						<div class="rounded-lg bg-base-100/50 p-4">
							<h3 class="mb-2 text-sm font-semibold text-secondary">
								Ready for Advanced Analysis?
							</h3>
							<p class="mb-3 text-sm text-base-content/70">
								Get detailed feedback on your grammar, vocabulary usage, and personalized learning
								recommendations.
							</p>
							<button class="btn btn-sm btn-primary" onclick={handleAnalyzeConversation}>
								Unlock Full Analysis
							</button>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Messages Display -->
		<div id="section-conversation" class="mb-6 rounded-xl bg-base-100 p-4 shadow-lg md:mb-8 md:p-6">
			<h2 class="mb-4 flex items-center justify-between text-lg font-semibold md:mb-6 md:text-xl">
				<div class="flex items-center">
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
							d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
						/>
					</svg>
					Your Conversation
				</div>
				<button
					class="btn btn-ghost btn-sm"
					onclick={() => (showShareModal = true)}
					title="Share your progress"
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
						/>
					</svg>
					Share
				</button>
			</h2>

			<UnifiedConversationBubble
				messages={unifiedMessages}
				suggestions={conversationSuggestions}
				showSuggestions={true}
			/>
		</div>

		<!-- Analysis Results Section -->
		<div id="section-results" class="mb-6 md:mb-8">
			{#if isAnalyzing}
				<div class="rounded-xl bg-base-100 p-6 text-center shadow-lg md:p-8">
					<div class="mb-4 flex justify-center">
						<div class="loading loading-lg loading-spinner text-primary"></div>
					</div>
					<h2 class="mb-2 text-xl font-bold md:text-2xl">Analyzing Your Conversation</h2>
					<p class="text-base-content/70">Creating your personalized learning insights...</p>
				</div>
			{:else if showAnalysisResults && analysisResults}
				<div class="rounded-xl bg-base-100 p-4 shadow-lg md:p-6">
					<h2 class="mb-4 flex items-center text-lg font-semibold md:text-xl">
						<svg
							class="mr-2 h-5 w-5 text-success"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						Your Learning Analysis
					</h2>
					<OnboardingResults
						results={analysisResults}
						isVisible={true}
						isGuestUser={!userManager.isLoggedIn}
						onDismiss={() => {}}
						onSave={() => {}}
					/>
				</div>
			{/if}
		</div>

		<!-- Upsell Section -->
		{#if isFree}
			<div
				class="mb-6 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 p-4 shadow-lg md:mb-8 md:p-6"
			>
				<div class="text-center">
					<div class="mb-2 text-lg font-semibold md:text-xl">Unlock Your Full Potential</div>
					<p class="mb-4 text-sm text-base-content/70 md:text-base">
						Support Kaiwa and get unlimited practice time, advanced analytics, and more — $5/mo for
						12 months.
					</p>
					<button class="btn btn-primary" onclick={handleUpsellClick}
						>Support + Unlock Features</button
					>
				</div>
			</div>
		{/if}

		<!-- Bottom Action Bar -->
		<div class="flex flex-col justify-center gap-3 sm:flex-row md:gap-4">
			<button class="btn flex-1 btn-primary sm:flex-none" onclick={handleAnalyzeConversation}>
				{analysisResults ? 'View Full Analysis' : 'Get Learning Analysis'}
			</button>
			<button class="btn flex-1 btn-outline sm:flex-none" onclick={onStartNewConversation}>
				Continue Practicing
			</button>
			<button class="btn flex-1 btn-ghost sm:flex-none" onclick={onGoHome}> Back Home </button>
		</div>
	</div>
</div>

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
				<ShareKaiwa source="conversation_review" />
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
