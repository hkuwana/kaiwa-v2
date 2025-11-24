<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import SwipeableCardStack from '$lib/components/SwipeableCardStack.svelte';
	import DynamicLanguageText from '$lib/components/DynamicLanguageText.svelte';
	import MonthlyUsageDisplay from '$lib/components/MonthlyUsageDisplay.svelte';
	import {
		clearAllConversationData,
		clearConversationDataOnly,
		getConversationDataSummary
	} from '$lib/utils/conversation-cleanup';
	import { userManager } from '$lib/stores/user.store.svelte';
	import { usageStore } from '$lib/stores/usage.store.svelte';
	import { settingsStore } from '$lib/stores/settings.store.svelte';
	import { scenarioStore } from '$lib/stores/scenario.store.svelte';
	import { trackABTest } from '$lib/analytics/posthog';
	import type { Language as DataLanguage } from '$lib/data/languages';
	import StageIndicator from '$lib/components/StageIndicator.svelte';
	import { defaultTierConfigs } from '$lib/data/tiers';
	import type { UserTier } from '$lib/data/tiers';
	import { conversationStore } from '$lib/stores/conversation.store.svelte';
	import type { Scenario } from '$lib/data/scenarios';
	import { goto } from '$app/navigation';

	const { data: _data } = $props();

	const user = userManager.user;

	// State for starting conversation
	let isStartingConversation = $state(false);

	// State for dynamic headline with language selection
	let selectedLanguage = $state<DataLanguage | null>(settingsStore.selectedLanguage);

	// Handle scenario query parameter from URL (e.g., from email links)
	onMount(async () => {
		const scenarioId = page.url.searchParams.get('scenario');
		if (scenarioId && browser) {
			// Set the scenario in the store so it's pre-selected
			scenarioStore.setScenarioById(scenarioId);
			selectedScenario = scenarioStore.getSelectedScenario();
		}

		// Initialize usage store for logged-in users
		if (userManager.isLoggedIn && user.id !== 'guest') {
			const tierId = (userManager.effectiveTier || 'free') as UserTier;
			const tierConfig = defaultTierConfigs[tierId] || defaultTierConfigs.free;

			usageStore.setUser(user.id, tierConfig);
			await usageStore.loadUsage();
		}
	});

	// A/B Testing for headlines - Family connection & anxiety-free positioning
	const headlineVariants = {
		// Main control (family connection)
		main: 'Connect with family in their language.',

		// Dynamic language-specific variations
		grandmother: 'dynamic-grandmother',
		practice: 'dynamic-practice',
		connect: 'dynamic-connect'
	};

	// Random headline selection
	let headlineVariant = $state('main');
	let headlineText = $state(headlineVariants.main);
	let useDynamicLanguage = $state(false);
	let dynamicVariant: 'grandmother' | 'practice' | 'connect' = $state('grandmother');

	// Initialize random A/B test on client side
	if (browser) {
		// Test dynamic language variants
		const dynamicVariants = ['grandmother', 'practice', 'connect'] as const;
		const selectedVariant = dynamicVariants[Math.floor(Math.random() * dynamicVariants.length)];

		// Update state
		headlineVariant = selectedVariant;
		useDynamicLanguage = true;
		dynamicVariant = selectedVariant;
		headlineText = `dynamic-${selectedVariant}`;

		// Track which variant the user saw
		const trackingTexts = {
			grandmother: 'Talk to your grandmother in [Language]',
			practice: 'Practice [Language] without fear',
			connect: 'Connect through heart in [Language]'
		};

		trackABTest.headlineVariantShown(selectedVariant, trackingTexts[selectedVariant]);
	}

	// Event handler for dynamic headline language selection
	function handleDynamicLanguageSelect(language: DataLanguage) {
		selectedLanguage = language;
		settingsStore.setLanguage(language);
	}

	// Handle conversation start - manages stores and navigation
	async function handleStartConversation(scenario: Scenario) {
		isStartingConversation = true;

		try {
			// Set the scenario in the scenario store
			scenarioStore.setScenarioById(scenario.id);

			// Generate session ID
			const sessionId = crypto.randomUUID();

			// Get the currently selected language and speaker
			const selectedLanguage = settingsStore.selectedLanguage;
			const selectedSpeaker = settingsStore.selectedSpeaker;

			// Get the current audio mode preference
			const userPrefs = userManager.preferences || {};
			const audioMode = userPrefs.audioInputMode || 'ptt';

			console.log('Starting conversation with:', {
				scenario: scenario.title,
				sessionId,
				language: selectedLanguage?.code,
				speaker: selectedSpeaker,
				audioMode
			});

			// Navigate to conversation page with parameters
			await goto(
				`/conversation?sessionId=${sessionId}&scenario=${scenario.id}&autoStart=true&audioMode=${audioMode}`
			);
		} catch (error) {
			console.error('Error starting conversation:', error);
			isStartingConversation = false;
		}
	}

	// Clear conversation data functions
	function handleClearAllData() {
		// eslint-disable-next-line no-alert
		const confirmed = window.confirm(
			'This will clear ALL your stored data including preferences, settings, and conversation history. Are you sure?'
		);
		if (confirmed) {
			clearAllConversationData();
			console.log('All data cleared! The page will reload.');
			window.location.reload();
		}
	}

	function handleClearConversationData() {
		// eslint-disable-next-line no-alert
		const confirmed = window.confirm(
			'This will clear only conversation-related data, keeping your preferences and settings. Continue?'
		);
		if (confirmed) {
			clearConversationDataOnly();
			console.log('Conversation data cleared!');
		}
	}

	function handleShowDataSummary() {
		const summary = getConversationDataSummary();
		const localStorageCount = Object.keys(summary.localStorage).length;
		const cookiesCount = Object.keys(summary.cookies).length;

		console.log('📊 Conversation Data Summary:', summary);
		console.log(
			`Stored Data Summary:\n\nlocalStorage: ${localStorageCount} items\nCookies: ${cookiesCount} items`
		);
	}
</script>

<svelte:head>
	<title>Kaiwa - Practice Real Conversations With Loved Ones</title>
	<meta
		name="description"
		content="Go beyond Duolingo basics. Practice conversations that make your loved ones' faces light up with pride when you speak."
	/>
</svelte:head>

<div
	class="min-h-[100dvh] bg-gradient-to-br from-base-100 to-base-200 px-2 pb-12 text-base-content sm:px-4"
>
	<div class="mx-auto max-w-7xl">
		<!-- Stage Indicator -->
		<div class="mb-3 pt-2 sm:mb-8 sm:flex sm:justify-center sm:pt-8">
			<StageIndicator />
		</div>

		<!-- Welcome Header -->
		<div class="mb-6 text-center sm:mb-8">
			{#if user.id !== 'guest'}
				<div class="mb-3 text-lg opacity-90 sm:mb-4 sm:text-xl">
					Welcome back, {user ? user.displayName : 'Dev'}!
				</div>
			{:else}
				<div class="mb-2 text-xl font-semibold opacity-90 sm:mb-4 sm:text-3xl">
					{#if useDynamicLanguage}
						<DynamicLanguageText
							bind:selectedLanguage
							onLanguageSelect={handleDynamicLanguageSelect}
							variant={dynamicVariant}
							animationInterval={2800}
							interactive={false}
						/>
					{:else}
						{headlineText}
					{/if}
				</div>
			{/if}
		</div>

		<!-- Swipeable Card Stack -->
		<div class="mb-8">
			<SwipeableCardStack onStartConversation={handleStartConversation} />
		</div>

		<!-- Monthly Usage Display - Only show for logged in users -->
		{#if user.id !== 'guest'}
			<div class="mx-auto mb-6 max-w-2xl">
				{#if usageStore.tier && usageStore.usage}
					<MonthlyUsageDisplay
						remainingSeconds={usageStore.secondsRemaining()}
						monthlySeconds={usageStore.tier.monthlySeconds}
						usedSeconds={usageStore.usage.secondsUsed || 0}
						bankedSeconds={usageStore.usage.bankedSeconds || 0}
						tierName={usageStore.tier.name}
						showUpgradeOption={userManager.effectiveTier === 'free'}
						isLoading={usageStore.loading}
						conversationsUsed={usageStore.usage.conversationsUsed || 0}
						realtimeSessionsUsed={usageStore.usage.realtimeSessionsUsed || 0}
						analysesUsed={usageStore.usage.analysesUsed || 0}
						overageSeconds={usageStore.usage.overageSeconds || 0}
					/>
				{:else}
					<MonthlyUsageDisplay
						remainingSeconds={0}
						monthlySeconds={0}
						usedSeconds={0}
						tierName="Free"
						showUpgradeOption={true}
						isLoading={usageStore.loading}
					/>
				{/if}
			</div>
		{/if}

		<!-- Debug/Development Tools -->
		{#if browser && user.id === 'dev'}
			<div class="mx-auto mt-8 max-w-2xl rounded-lg bg-base-200 p-4">
				<h3 class="mb-3 text-sm font-semibold text-base-content/70">🧹 Clear Conversation Data</h3>
				<div class="flex flex-wrap gap-2">
					<button onclick={handleShowDataSummary} class="btn btn-outline btn-sm">
						📊 Show Data Summary
					</button>
					<button onclick={handleClearConversationData} class="btn btn-sm btn-warning">
						🧹 Clear Conversation Data
					</button>
					<button onclick={handleClearAllData} class="btn btn-sm btn-error">
						🗑️ Clear ALL Data
					</button>
				</div>
				<p class="mt-2 text-xs text-base-content/60">
					Use these tools to clear stored conversation data if you're experiencing issues with
					previous sessions.
				</p>
			</div>
		{/if}
	</div>
</div>
