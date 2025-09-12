<!-- src/lib/components/UnifiedStartButton.svelte -->
<script lang="ts">
	import { scenariosData } from '$lib/data/scenarios';
	import { goto } from '$app/navigation';
	import { track } from '$lib/analytics/posthog';
	import LanguageSelector from './LanguageSelector.svelte';
	import ScenarioSelector from './ScenarioSelector.svelte';
	import type { Language as DataLanguage } from '$lib/data/languages';
	import type { User, Scenario } from '$lib/server/db/types';

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
	}

	const {
		user,
		selectedLanguage = null,
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

	function handleStartClick(event: MouseEvent) {
		const sessionId = crypto.randomUUID();
		if (selectedLanguage && currentScenario) {
			// Track the click event
			track('start_language_clicked', {
				language: selectedLanguage.code || selectedLanguage.name,
				scenario_id: currentScenario.id
			});
			if (onStartClick) {
				onStartClick();
			}

			// Add immediate visual feedback
			const button = event?.currentTarget as HTMLButtonElement;
			if (button) {
				button.classList.add('loading');
				button.disabled = true;
			}

			// Navigate with scenario parameter
			goto(`/conversation?sessionId=${sessionId}&scenario=${currentScenario.id}&autoStart=true`);
		}
	}

	function handleLoginRedirect() {
		goto('/auth');
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
			disabled={!selectedLanguage}
			class="group btn w-full btn-lg btn-primary"
			aria-label={selectedLanguage
				? `Start ${currentScenario?.category?.charAt(0).toUpperCase() + currentScenario?.category?.slice(1) || 'Learning'} in ${selectedLanguage.name}`
				: 'Choose your language to start'}
		>
			<span class="relative z-10 flex items-center gap-2">
				{#if selectedLanguage}
					<span class=""
						>Start {currentScenario?.category?.charAt(0).toUpperCase() +
							(currentScenario?.category?.slice(1) || '')}
					</span>
				{:else}
					<span class="sm:hidden">Choose language</span>
					<span class="hidden sm:inline">Choose your language to start</span>
				{/if}
			</span>

			<!-- Subtle highlight effect -->
			<div
				class="absolute inset-0 -translate-x-full -skew-x-12 transform bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full"
			></div>
		</button>

		<!-- Guest CTA removed in favor of top nav Sign Up button -->
	</div>
</div>
