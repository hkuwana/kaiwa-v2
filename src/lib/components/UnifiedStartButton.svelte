<!-- src/lib/components/UnifiedStartButton.svelte -->
<script lang="ts">
	import { scenariosData } from '$lib/data/scenarios';
	import { goto } from '$app/navigation';
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

	// Available scenarios - guests only get onboarding
	const availableScenarios = $derived(
		isGuest ? scenariosData.filter((s) => s.id === 'onboarding-welcome') : scenariosData
	);

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

<div class="flex flex-col items-center gap-6 text-base-content">
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
			disabled={isGuest}
		/>
	</div>

	<div class="w-full max-w-md">
		<button
			onclick={handleStartClick}
			disabled={!selectedLanguage}
			class="group btn w-full btn-lg btn-primary"
			aria-label={selectedLanguage
				? `Start ${currentScenario?.category?.charAt(0).toUpperCase() + currentScenario?.category?.slice(1) || 'Learning'} in ${selectedLanguage.name}`
				: 'Select a language first'}
		>
			<span class="relative z-10 flex items-center gap-2">
				{#if selectedLanguage}
					Start {currentScenario?.category?.charAt(0).toUpperCase() +
						currentScenario?.category?.slice(1) || 'Learning'} in {selectedLanguage.name}
				{:else}
					Loading...
				{/if}
			</span>

			<!-- Subtle highlight effect -->
			<div
				class="absolute inset-0 -translate-x-full -skew-x-12 transform bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full"
			></div>
		</button>

		<!-- Login prompt for guests -->
		{#if isGuest}
			<div class="mt-4 text-center">
				<p class="mb-2 text-sm opacity-70">Log In to choose scenarios</p>
				<button class="btn btn-outline btn-sm" onclick={handleLoginRedirect}>
					🔐 Sign Up / Login
				</button>
			</div>
		{/if}
	</div>
</div>
