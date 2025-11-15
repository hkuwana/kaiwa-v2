<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import UnifiedStartButton from '$lib/components/UnifiedStartButton.svelte';
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
	import type { Scenario, AudioInputMode } from '$lib/server/db/types';
	import StageIndicator from '$lib/components/StageIndicator.svelte';
	import { defaultTierConfigs } from '$lib/data/tiers';
	import type { UserTier } from '$lib/data/tiers';

	const { data } = $props();

	const user = userManager.user;

	// State management for language, speaker, and scenario selection
	let selectedLanguage = $state<DataLanguage | null>(settingsStore.selectedLanguage);
	let selectedSpeaker = $state<string | null>(settingsStore.selectedSpeaker);
	let selectedScenario = $state<Scenario | null>(scenarioStore.getSelectedScenario());
	let selectedAudioMode = $state<AudioInputMode>('ptt'); // Audio input mode preference - default to Push-to-Talk

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

	// Function to track when user clicks start speaking
	function trackStartSpeakingClick() {
		// Get current values to avoid state reference issues
		const currentVariant = headlineVariant;
		const currentText = headlineText;
		const userType = user ? 'logged_in' : 'guest';

		trackABTest.startSpeakingClicked(currentVariant, currentText, userType);
	}

	// Event handlers for component callbacks
	function handleLanguageChange(language: DataLanguage) {
		selectedLanguage = language;
		settingsStore.setLanguageObject(language);
	}

	function handleSpeakerChange(speakerId: string) {
		selectedSpeaker = speakerId;
		settingsStore.setSpeaker(speakerId);
	}

	function handleScenarioChange(scenario: Scenario) {
		scenarioStore.setScenarioById(scenario.id);
		selectedScenario = scenario;
	}

	function handleDynamicLanguageSelect(language: DataLanguage) {
		selectedLanguage = language;
		settingsStore.setLanguageObject(language);
	}

	// Clear conversation data functions
	function handleClearAllData() {
		if (
			confirm(
				'This will clear ALL your stored data including preferences, settings, and conversation history. Are you sure?'
			)
		) {
			clearAllConversationData();
			alert('All data cleared! The page will reload.');
			window.location.reload();
		}
	}

	function handleClearConversationData() {
		if (
			confirm(
				'This will clear only conversation-related data, keeping your preferences and settings. Continue?'
			)
		) {
			clearConversationDataOnly();
			alert('Conversation data cleared!');
		}
	}

	function handleShowDataSummary() {
		const summary = getConversationDataSummary();
		const localStorageCount = Object.keys(summary.localStorage).length;
		const cookiesCount = Object.keys(summary.cookies).length;

		alert(
			`Stored Data Summary:\n\nlocalStorage: ${localStorageCount} items\nCookies: ${cookiesCount} items\n\nCheck console for details.`
		);
		console.log('📊 Conversation Data Summary:', summary);
	}
</script>

<svelte:head>
	<title>Kaiwa - Language Learning Platform</title>
	<meta name="description" content="Practice conversation with AI tutor" />
</svelte:head>

<div
	class="min-h-[100dvh] bg-gradient-to-br from-base-100 to-base-200 px-2 text-base-content sm:px-4"
>
	<header class="flex min-h-[100dvh] box-border items-start justify-center pt-8 sm:pt-20">
		<div class="text-center">
			<!-- Stage Indicator -->
			<div class="mb-3 sm:mb-8">
				<StageIndicator currentStage="selection" />
			</div>

			<div class="max-w-md">
				{#if user.id !== 'guest'}
					<div class="mb-3 text-lg opacity-90 sm:mb-4 sm:text-xl">
						Welcome back, {user ? user.displayName : 'Dev'}!
					</div>
				{:else}
					<h4 class="mb-2 text-xl font-semibold opacity-90 sm:mb-4 sm:text-3xl">
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
					</h4>
				{/if}

				<UnifiedStartButton
					{user}
					{selectedLanguage}
					{selectedSpeaker}
					{selectedScenario}
					{selectedAudioMode}
					onLanguageChange={handleLanguageChange}
					onSpeakerChange={handleSpeakerChange}
					onScenarioChange={handleScenarioChange}
					onStartClick={trackStartSpeakingClick}
					onModeChange={(mode) => (selectedAudioMode = mode)}
				/>
				<!-- Monthly Usage Display - Only show for logged in users -->
				{#if user.id !== 'guest'}
					<div class="mb-6 pt-10">
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
					<div class="mt-8 rounded-lg bg-base-200 p-4">
						<h3 class="mb-3 text-sm font-semibold text-base-content/70">
							🧹 Clear Conversation Data
						</h3>
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
	</header>
</div>
