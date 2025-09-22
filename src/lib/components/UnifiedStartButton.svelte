<!-- src/lib/components/UnifiedStartButton.svelte -->
<script lang="ts">
	import { scenariosData } from '$lib/data/scenarios';
	import { goto } from '$app/navigation';
	import { track } from '$lib/analytics/posthog';
	import LanguageSelector from './LanguageSelector.svelte';
	import ScenarioSelector from './ScenarioSelector.svelte';
	import type { Language as DataLanguage } from '$lib/data/languages';
	import type { User, Scenario } from '$lib/server/db/types';
	import { getTopSpeakerForScenario, getSpeakersByLanguage } from '$lib/data/speakers';
	import { GUEST_USER } from '$lib/data/user';

	// Props
	interface Props {
		user: User;
		selectedLanguage?: DataLanguage | null;
		selectedSpeaker?: string | null;
		selectedScenario?: Scenario | null;
		onLanguageChange?: (language: DataLanguage) => void;
		onSpeakerChange?: (speakerId: string) => void;
		onScenarioChange?: (scenario: Scenario) => void;
		onStartClick?: () => void;
		children?: import('svelte').Snippet;
	}

	const {
		user = GUEST_USER,
		selectedLanguage = null,
		children,
		selectedSpeaker = null,
		selectedScenario = null,
		onLanguageChange,
		onSpeakerChange,
		onScenarioChange,
		onStartClick
	}: Props = $props();

	// Determine if user is a guest
	const isGuest = user.id === 'guest';

	// Available scenarios - show all scenarios
	const availableScenarios = $derived(scenariosData);

	// Current scenario or default to onboarding
	const currentScenario = $derived(selectedScenario || scenariosData[0]);

	// Auto-pick a best-fitting speaker when language + scenario are set
	$effect(() => {
		if (!selectedLanguage || !currentScenario || !onSpeakerChange) return;

		// If current selectedSpeaker is not from the chosen language, or not set, choose best
		const speakersForLang = getSpeakersByLanguage(selectedLanguage.code);
		const speakerIsValid =
			!!selectedSpeaker && speakersForLang.some((s) => s.id === selectedSpeaker);

		if (!speakerIsValid) {
			const best = getTopSpeakerForScenario(currentScenario, selectedLanguage.code);
			if (best && best.id !== selectedSpeaker) {
				onSpeakerChange(best.id);
			}
		}
	});

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

	async function handleStartClick(event: MouseEvent) {
		if (isLoading) return;

		const sessionId = crypto.randomUUID();
		if (selectedLanguage && currentScenario) {
			isLoading = true;

			// Track the click event
			track('start_language_clicked', {
				language: selectedLanguage.code || selectedLanguage.name,
				scenario_id: currentScenario.id
			});
			if (onStartClick) {
				onStartClick();
			}

			// Navigate with scenario parameter
			goto(`/conversation?sessionId=${sessionId}&scenario=${currentScenario.id}&autoStart=true`);
		}
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

	<div class="w-full max-w-md">
		<button
			onclick={handleStartClick}
			class="group btn w-full btn-lg btn-primary"
			aria-label={selectedLanguage
				? currentScenario?.category === 'onboarding'
					? `Meet your guide in ${selectedLanguage.name}`
					: `Start ${
							currentScenario?.category?.charAt(0).toUpperCase() +
								(currentScenario?.category?.slice(1) || '') || 'Learning'
						} in ${selectedLanguage.name}`
				: 'Choose your language to start'}
		>
			<span class="relative z-10 flex items-center gap-2">
				{#if isLoading}
					<span class="loading loading-sm loading-spinner"></span>
					<span>Preparing...</span>
				{:else if selectedLanguage}
					{#if currentScenario?.category === 'onboarding'}
						<span>Start Chat</span>
					{:else}
						<span
							>Start {currentScenario?.category?.charAt(0).toUpperCase() +
								(currentScenario?.category?.slice(1) || '')}
						</span>
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
</div>
