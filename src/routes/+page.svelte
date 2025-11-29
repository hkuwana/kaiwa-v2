<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import SwipeableCardStack from '$lib/components/SwipeableCardStack.svelte';
	import NavLanguageSwitcher from '$lib/components/NavLanguageSwitcher.svelte';
	import DynamicLanguageText from '$lib/components/DynamicLanguageText.svelte';
	import {
		clearAllConversationData,
		clearConversationDataOnly,
		getConversationDataSummary
	} from '$lib/utils/conversation-cleanup';
	import { userManager } from '$lib/stores/user.store.svelte';
	import { usageStore } from '$lib/stores/usage.store.svelte';
	import { settingsStore } from '$lib/stores/settings.store.svelte';
	import { scenarioStore } from '$lib/stores/scenario.store.svelte';
	import { trackABTest, trackEngagement } from '$lib/analytics/posthog';
	import type { Language as DataLanguage } from '$lib/data/languages';
	import StageIndicator from '$lib/components/StageIndicator.svelte';
	import { defaultTierConfigs } from '$lib/data/tiers';
	import type { UserTier } from '$lib/data/tiers';
	import type { Scenario } from '$lib/data/scenarios';
	import { goto } from '$app/navigation';
	import { selectScenario } from '$lib/services/scenarios/scenario-interaction.service';
	import { userPreferencesStore } from '$lib/stores/user-preferences.store.svelte';

	const { data } = $props();

	const user = userManager.user;

	// State for starting conversation
	let isStartingConversation = $state(false);

	// State for dynamic headline with language selection
	let selectedLanguage = $state<DataLanguage | null>(settingsStore.selectedLanguage);

	let selectedScenario: Scenario | null = $state(null);

	// Reference to language switcher component
	let languageSwitcherComponent: NavLanguageSwitcher;

	// Handler to open language switcher
	function handleOpenLanguageSwitcher() {
		// Get the button from the component and click it to open the modal
		const button = document.querySelector(
			'[aria-haspopup="dialog"][title="Change language and speaker"]'
		) as HTMLButtonElement;
		if (button) {
			button.click();
		}
	}

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

	const headlineTrackingTexts: Record<'grandmother' | 'practice' | 'connect', string> = {
		grandmother: 'Talk to your grandmother in [Language]',
		practice: 'Practice [Language] without fear',
		connect: 'Connect through heart in [Language]'
	};

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
		trackABTest.headlineVariantShown(selectedVariant, headlineTrackingTexts[selectedVariant]);
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
			const userType: 'logged_in' | 'guest' = user.id === 'guest' ? 'guest' : 'logged_in';
			const audioMode = userPreferencesStore.getPreference('audioInputMode') || 'ptt';
			const currentLanguage = selectedLanguage || settingsStore.selectedLanguage;
			const currentSpeaker = settingsStore.selectedSpeaker;

			// Record scenario selection through central service for analytics
			selectScenario(scenario, scenarioStore, {
				source: 'home_swipe_stack',
				trackEvent: true,
				navigateTo: undefined
			});

			// Track home conversation start click (generic conversion event)
			trackEngagement.homeConversationStartClicked({
				scenario_id: scenario.id,
				scenario_title: scenario.title,
				scenario_role: scenario.role,
				scenario_difficulty: scenario.difficulty,
				language_id: currentLanguage?.id || null,
				language_code: currentLanguage?.code || null,
				audio_mode: audioMode,
				user_type: userType,
				is_guest: user.id === 'guest',
				headline_variant: headlineVariant,
				headline_text: headlineText
			});

			// Track A/B test conversion separately for guests
			if (user.id === 'guest') {
				const trackingHeadline =
					headlineTrackingTexts[dynamicVariant] !== undefined
						? headlineTrackingTexts[dynamicVariant]
						: headlineText;

				trackABTest.startSpeakingClicked(dynamicVariant, trackingHeadline, 'guest');
			}

			// Generate session ID
			const sessionId = crypto.randomUUID();

			console.log('Starting conversation with:', {
				scenario: scenario.title,
				sessionId,
				language: currentLanguage?.code,
				speaker: currentSpeaker,
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
	{#if data.jsonLd}
		<script type="application/ld+json">
			{@html JSON.stringify(data.jsonLd)}
		</script>
	{/if}
</svelte:head>

<div
	class="min-h-[100dvh] bg-linear-to-br from-base-100 to-base-200 px-2 pb-12 text-base-content sm:px-4"
>
	<div class="mx-auto max-w-7xl">
		<!-- Stage Indicator -->
		<div class="mb-3 hidden pt-2 sm:mb-8 sm:flex sm:justify-center sm:pt-8">
			<StageIndicator />
		</div>

		<!-- Warm Header - Stacked vertically -->
		<div class="mb-6 text-center">
			{#if user.id !== 'guest'}
				<!-- Logged in users: Warm welcome -->
				<div class="text-base text-base-content/70 sm:text-lg">Welcome back,</div>
				<div class="text-lg font-semibold sm:text-xl">
					{user ? user.displayName : 'Dev'}
				</div>

				<!-- Usage info directly underneath name -->
				{#if usageStore.tier && usageStore.usage}
					<a
						href="/profile"
						class="mt-1 inline-flex items-center gap-1.5 text-sm text-base-content/60 hover:text-primary transition-colors"
						title="View usage details"
					>
						<span class="icon-[mdi--clock-outline] h-4 w-4"></span>
						<span>{Math.floor(usageStore.secondsRemaining() / 60)} minutes remaining</span>
						<span class="opacity-50">·</span>
						<span class="capitalize">{usageStore.tier.name} Plan</span>
					</a>
				{/if}
			{:else}
				<!-- Guest users: Dynamic headline -->
				<div class="text-lg font-semibold sm:text-2xl">
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

		<!-- HERO: Swipeable Card Stack -->
		<div class="mb-4">
			<SwipeableCardStack
				onStartConversation={handleStartConversation}
				onChooseLanguage={handleOpenLanguageSwitcher}
			/>
		</div>

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

	<!-- Hidden Language Switcher Component (modal only) -->
	<div class="hidden">
		<NavLanguageSwitcher bind:this={languageSwitcherComponent} />
	</div>
</div>
