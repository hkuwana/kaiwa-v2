<!-- src/lib/components/UnifiedStartButton.svelte -->
<script lang="ts">
	import { scenariosData, sortScenariosByDifficulty, type Scenario } from '$lib/data/scenarios';
	import { goto } from '$app/navigation';
	import { track } from '$lib/analytics/posthog';
	import LanguageSelector from './LanguageSelector.svelte';
	import ScenarioSelector from '$lib/features/scenarios/components/ScenarioSelector.svelte';
	import AdvancedAudioOptions from './AdvancedAudioOptions.svelte';
	import type { Language as DataLanguage } from '$lib/data/languages';
	import type { User } from '$lib/server/db/types';
	import { GUEST_USER } from '$lib/data/user';

	// Props
	interface Props {
		user: User;
		selectedLanguage?: DataLanguage | null;
		selectedSpeaker?: string | null;
		selectedScenario?: Scenario | null;
		selectedAudioMode?: 'vad' | 'ptt';
		onLanguageChange?: (language: DataLanguage) => void;
		onSpeakerChange?: (speakerId: string) => void;
		onScenarioChange?: (scenario: Scenario) => void;
		onStartClick?: () => void;
		onModeChange?: (mode: 'vad' | 'ptt') => void;
		children?: import('svelte').Snippet;
	}

	const {
		user = GUEST_USER,
		selectedLanguage = null,
		children,
		selectedSpeaker = null,
		selectedScenario = null,
		selectedAudioMode = 'ptt', // Default to Push-to-Talk
		onLanguageChange,
		onSpeakerChange,
		onScenarioChange,
		onStartClick,
		onModeChange
	}: Props = $props();

	// Determine if user is a guest
	const isGuest = user.id === 'guest';

	// Available scenarios - show all scenarios
	const availableScenarios = $derived(sortScenariosByDifficulty(scenariosData));

	// Current scenario or default to onboarding
	const currentScenario = $derived(selectedScenario || availableScenarios[0]);

	type ScenarioRole = 'tutor' | 'character' | 'friendly_chat' | 'expert';

	const SCENARIO_ROLE_COPY: Record<
		ScenarioRole,
		{ aria: (languageName: string) => string; button: string }
	> = {
		tutor: {
			aria: (languageName) => `Meet your tutor in ${languageName}`,
			button: 'Start Chat'
		},
		character: {
			aria: (languageName) => `Start a roleplay in ${languageName}`,
			button: 'Start Roleplay'
		},
		friendly_chat: {
			aria: (languageName) => `Start a friendly chat in ${languageName}`,
			button: 'Start Conversation'
		},
		expert: {
			aria: (languageName) => `Start an expert conversation in ${languageName}`,
			button: 'Start Expert Chat'
		}
	};

	const DEFAULT_SCENARIO_COPY = {
		aria: (languageName: string) => `Start practicing in ${languageName}`,
		button: 'Start Practicing'
	};

	function getScenarioRoleCopy(role?: Scenario['role']) {
		if (role && role in SCENARIO_ROLE_COPY) {
			return SCENARIO_ROLE_COPY[role as ScenarioRole];
		}
		return DEFAULT_SCENARIO_COPY;
	}

	const scenarioRoleCopy = $derived(getScenarioRoleCopy(currentScenario?.role));

	// State for button loading
	let isLoading = $state(false);

	// Functions
	function handleLanguageChange(language: DataLanguage) {
		if (onLanguageChange) {
			onLanguageChange(language);
		}
	}

	function handleSpeakerChange(speakerId: string) {
		if (onSpeakerChange) {
			onSpeakerChange(speakerId);
		}
	}

	function handleScenarioChange(scenario: Scenario) {
		if (onScenarioChange) {
			onScenarioChange(scenario);
		}
	}

	async function handleStartClick(_event: MouseEvent) {
		if (isLoading) return;

		if (!selectedLanguage || !currentScenario) return;

		// Track the click event regardless of auth state
		track('start_language_clicked', {
			language: selectedLanguage.code || selectedLanguage.name,
			scenario_id: currentScenario.id,
			requires_login: isGuest
		});

		if (onStartClick) {
			onStartClick();
		}

		if (isGuest) {
			const redirectParams = new URLSearchParams({
				scenario: currentScenario.id,
				autoStart: 'true',
				audioMode: selectedAudioMode
			});
			const params = new URLSearchParams({
				redirect: `/conversation?${redirectParams.toString()}`,
				from: 'conversation-start'
			});
			goto(`/auth?${params.toString()}`);
			return;
		}

		const sessionId = crypto.randomUUID();
		isLoading = true;

		// Navigate with scenario and audio mode parameters
		goto(
			`/conversation?sessionId=${sessionId}&scenario=${currentScenario.id}&autoStart=true&audioMode=${selectedAudioMode}`
		);
	}
</script>

<div class="flex flex-col items-center gap-6">
	<!-- Two Choice Buttons Row -->
	<div class="flex w-full max-w-md flex-col gap-4">
		<!-- Language Selection -->
		<LanguageSelector
			{selectedLanguage}
			{selectedSpeaker}
			onLanguageChange={handleLanguageChange}
			onSpeakerChange={handleSpeakerChange}
			disabled={false}
		/>

		<!-- Scenario Selection -->
		<ScenarioSelector
			scenarios={availableScenarios}
			selectedScenario={currentScenario}
			onScenarioSelect={handleScenarioChange}
			disabled={!selectedLanguage}
			tooltipMessage={!selectedLanguage ? 'Choose your language first' : ''}
			{isGuest}
		/>
	</div>

	<!-- Advanced Audio Options -->
	<div class="w-full max-w-md">
		<AdvancedAudioOptions {onModeChange} />
	</div>

	<div class="w-full max-w-md">
		<button
			onclick={handleStartClick}
			class="group btn w-full btn-lg btn-primary"
			aria-label={selectedLanguage
				? isGuest
					? 'Sign up or log in to start your practice session'
					: scenarioRoleCopy.aria(selectedLanguage.name)
				: 'Choose your language to start'}
		>
			<span class="relative z-10 flex items-center gap-2">
				{#if isLoading}
					<span class="loading loading-sm loading-spinner"></span>
					<span>Preparing...</span>
				{:else if selectedLanguage}
					{#if isGuest}
						<span>Sign up to start</span>
					{:else}
						<span>{scenarioRoleCopy.button}</span>
					{/if}
				{:else}
					<span class="sm:hidden">Choose language</span>
					<span class="hidden sm:inline">Choose your language to start</span>
				{/if}
			</span>
		</button>

		{#if children}
			{@render children()}
		{/if}
	</div>

	{#if isGuest}
		<p class="mt-3 text-center text-sm text-base-content/70">
			Create a free account to unlock a premium analysis per day.
		</p>
	{/if}
</div>
