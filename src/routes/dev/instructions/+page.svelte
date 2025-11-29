<script lang="ts">
	import { onMount } from 'svelte';
	import {
		createComposer,
		PARAMETER_PRESETS,
		mergeParameters,
		type InstructionParameters,
		type SpeakingSpeed
	} from '$lib/services/instructions';
	import { languages } from '$lib/data/languages';
	import { scenariosData } from '$lib/data/scenarios';
	import { speakersData } from '$lib/data/speakers';
	import { userManager } from '$lib/stores/user.store.svelte';
	import { userPreferencesStore } from '$lib/stores/user-preferences.store.svelte';
	import type { UserPreferences } from '$lib/server/db/types';

	// ============================================
	// STATE
	// ============================================

	let selectedLanguage = $state(languages[0]);
	let selectedScenario = $state(scenariosData[0]);
	let currentInstructions = $state('');
	let autoAdapt = $state(false);
	let errorCount = $state(0);
	let successStreak = $state(0);
	let userPreferences = $state<UserPreferences | null>(null);
	let isLoadingPreferences = $state(true);

	const getSpeakersForLanguage = (languageId: string) =>
		speakersData.filter((speaker) => speaker.languageId === languageId);

	let availableSpeakers = $derived(getSpeakersForLanguage(selectedLanguage.id));
	let selectedSpeakerId = $state('');
	let selectedSpeaker = $derived(
		availableSpeakers.find((speaker) => speaker.id === selectedSpeakerId) || null
	);

	// Instruction Parameters
	// Default to a tutor-friendly preset when the default scenario is a tutor
	// Note: Initial value only - params is mutated later via bind:value and function calls
	let params = $state<InstructionParameters>({
		...PARAMETER_PRESETS.tutor_explicit
	});

	let composer = $state<ReturnType<typeof createComposer> | null>(null);

	// ============================================
	// FUNCTIONS
	// ============================================

	function presetForScenario() {
		// Choose a sensible default preset by role
		const role = selectedScenario?.role || 'friendly_chat';
		let base = PARAMETER_PRESETS.intermediate;
		if (role === 'tutor') base = PARAMETER_PRESETS.tutor_explicit;
		else if (role === 'friendly_chat') base = PARAMETER_PRESETS.conversation_partner;
		else if (role === 'character') base = PARAMETER_PRESETS.conversation_partner;
		else if (role === 'expert') base = PARAMETER_PRESETS.advanced;

		// Merge any scenario parameter hints to keep coherence (e.g., code_switching)
		if (selectedScenario?.id === 'beginner-confidence-bridge') {
			return mergeParameters(base, { languageMixingPolicy: 'code_switching' });
		}
		return base;
	}

	async function hydratePreferences() {
		try {
			await userPreferencesStore.initialize();
			const currentUserId = userManager.user?.id;
			if (currentUserId && currentUserId !== 'guest') {
				await userPreferencesStore.syncFromServer(currentUserId);
			}

			userPreferences = userPreferencesStore.getPreferences();
			if (userPreferences?.targetLanguageId) {
				const preferredLanguage =
					languages.find((lang) => lang.id === userPreferences?.targetLanguageId) ||
					selectedLanguage;
				selectedLanguage = preferredLanguage;
			}

			initializeComposer();
		} catch (error) {
			console.warn('Failed to load user preferences for instruction composer', error);
		} finally {
			isLoadingPreferences = false;
		}
	}

	function buildComposer() {
		if (!userPreferences) return;
		const mergedPreferences: Partial<UserPreferences> = {
			...userPreferences,
			targetLanguageId: selectedLanguage.id
		};

		composer = createComposer({
			user: userManager.user,
			language: selectedLanguage,
			preferences: mergedPreferences,
			scenario: selectedScenario,
			parameters: params,
			speaker: selectedSpeaker ?? undefined,
			compact: false
		});
	}

	function initializeComposer() {
		if (!userPreferences) return;
		// Auto-apply defaults when scenario changes for coherent behavior
		params = presetForScenario();

		const newSpeakers = getSpeakersForLanguage(selectedLanguage.id);
		availableSpeakers = newSpeakers;

		if (selectedSpeaker && newSpeakers.some((speaker) => speaker.id === selectedSpeaker?.id)) {
			selectedSpeakerId = selectedSpeaker.id;
		} else if (newSpeakers.length > 0) {
			selectedSpeakerId = newSpeakers[0].id;
		} else {
			selectedSpeakerId = '';
		}

		selectedSpeaker = newSpeakers.find((speaker) => speaker.id === selectedSpeakerId) || null;

		buildComposer();
		generateInstructions();
	}

	function handleSpeakerChange(id: string) {
		if (!userPreferences) return;
		selectedSpeakerId = id;
		selectedSpeaker = availableSpeakers.find((speaker) => speaker.id === id) || null;
		buildComposer();
		generateInstructions();
	}

	function generateInstructions() {
		if (!composer) return;
		currentInstructions = composer.compose();
	}

	function updateParameter<K extends keyof InstructionParameters>(
		key: K,
		value: InstructionParameters[K]
	) {
		params[key] = value;
		if (!composer) return;
		currentInstructions = composer.updateParameters({ [key]: value });
	}

	function loadPreset(presetName: keyof typeof PARAMETER_PRESETS) {
		params = { ...PARAMETER_PRESETS[presetName] };
		if (!composer) return;
		currentInstructions = composer.updateParameters(params);
	}

	function simulateError() {
		errorCount++;
		successStreak = 0;

		if (autoAdapt && errorCount >= 3) {
			// Auto-adapt: make it easier
			params = {
				...params,
				speakingSpeed: 'slow',
				sentenceLength: 'short',
				scaffoldingLevel: 'heavy',
				pauseFrequency: 'frequent',
				encouragementFrequency: 'frequent'
			};
			if (composer) {
				currentInstructions = composer.updateParameters(params);
			}
			errorCount = 0;
			console.log('📉 Auto-adapted to easier settings');
		}
	}

	function simulateSuccess() {
		successStreak++;
		errorCount = 0;

		if (autoAdapt && successStreak >= 5) {
			// Auto-adapt: make it harder
			const currentSpeed = params.speakingSpeed;
			const speedLevels: SpeakingSpeed[] = ['very_slow', 'slow', 'normal', 'fast', 'native'];
			const currentIndex = speedLevels.indexOf(currentSpeed);
			const nextSpeed = speedLevels[Math.min(currentIndex + 1, speedLevels.length - 1)];

			params = {
				...params,
				speakingSpeed: nextSpeed,
				vocabularyComplexity: 'advanced',
				scaffoldingLevel: 'light'
			};
			if (composer) {
				currentInstructions = composer.updateParameters(params);
			}
			successStreak = 0;
			console.log('📈 Auto-adapted to harder settings');
		}
	}

	function resetCounters() {
		errorCount = 0;
		successStreak = 0;
	}

	function copyToClipboard() {
		navigator.clipboard.writeText(currentInstructions);
		console.log('✅ Instructions copied to clipboard!');
	}

	function copyForChatGPT() {
		const wrapped = `You are an AI conversation partner. Follow the instructions below exactly. Do not explain the rules; just behave accordingly.\n\n${currentInstructions}`;
		navigator.clipboard.writeText(wrapped);
		console.log('✅ ChatGPT-formatted prompt copied!');
	}

	function copyForGemini() {
		const wrapped = `System prompt for role behavior:\n\n${currentInstructions}\n\nBehavioral note: Keep responses concise as specified.`;
		navigator.clipboard.writeText(wrapped);
		console.log('✅ Gemini-formatted prompt copied!');
	}

	// ============================================
	// LIFECYCLE
	// ============================================

	onMount(() => {
		hydratePreferences();
	});
</script>

<svelte:head>
	<title>Agile Instructions - Parameter Controls</title>
</svelte:head>

<div class="container mx-auto max-w-7xl p-6">
	<div class="mb-6 text-center">
		<h1 class="text-3xl font-bold">🎛️ Agile Instruction System</h1>
		<p class="mt-2 text-gray-600">Real-time parameter adjustments for OpenAI Realtime API</p>
	</div>

	<!-- Auto-Adaptation Toggle -->
	<div class="mb-6 rounded-lg bg-linear-to-br from-blue-50 to-purple-50 p-4 shadow">
		<div class="flex items-center justify-between">
			<div>
				<h3 class="text-lg font-semibold">🤖 Auto-Adaptation</h3>
				<p class="text-sm text-gray-600">Automatically adjust difficulty based on performance</p>
			</div>
			<label class="flex items-center gap-3">
				<span class="text-sm font-medium">{autoAdapt ? 'Enabled' : 'Disabled'}</span>
				<input type="checkbox" class="toggle toggle-primary" bind:checked={autoAdapt} />
			</label>
		</div>

		{#if autoAdapt}
			<div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
				<div class="rounded bg-white p-3 shadow-sm">
					<div class="text-2xl font-bold text-red-500">{errorCount}</div>
					<div class="text-sm text-gray-600">Consecutive Errors</div>
					<div class="mt-1 text-xs text-gray-500">→ Easier at 3</div>
				</div>
				<div class="rounded bg-white p-3 shadow-sm">
					<div class="text-2xl font-bold text-green-500">{successStreak}</div>
					<div class="text-sm text-gray-600">Success Streak</div>
					<div class="mt-1 text-xs text-gray-500">→ Harder at 5</div>
				</div>
				<div class="flex flex-col gap-2">
					<button
						onclick={simulateError}
						class="rounded bg-red-500 px-3 py-2 text-sm text-white hover:bg-red-600"
					>
						Simulate Error
					</button>
					<button
						onclick={simulateSuccess}
						class="rounded bg-green-500 px-3 py-2 text-sm text-white hover:bg-green-600"
					>
						Simulate Success
					</button>
				</div>
			</div>
		{/if}
	</div>

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-[400px_1fr]">
		<!-- PARAMETER CONTROLS -->
		<div class="space-y-4">
			<!-- Quick Presets -->
			<div class="rounded-lg bg-white p-4 shadow">
				<h3 class="mb-3 text-lg font-semibold">⚡ Quick Presets</h3>
				<div class="grid grid-cols-2 gap-2">
					<button
						onclick={() => loadPreset('absolute_beginner')}
						class="rounded bg-blue-100 px-3 py-2 text-sm hover:bg-blue-200"
					>
						Absolute Beginner
					</button>
					<button
						onclick={() => loadPreset('beginner')}
						class="rounded bg-green-100 px-3 py-2 text-sm hover:bg-green-200"
					>
						Beginner
					</button>
					<button
						onclick={() => loadPreset('intermediate')}
						class="rounded bg-yellow-100 px-3 py-2 text-sm hover:bg-yellow-200"
					>
						Intermediate
					</button>
					<button
						onclick={() => loadPreset('advanced')}
						class="rounded bg-orange-100 px-3 py-2 text-sm hover:bg-orange-200"
					>
						Advanced
					</button>
					<button
						onclick={() => loadPreset('tutor_explicit')}
						class="rounded bg-purple-100 px-3 py-2 text-sm hover:bg-purple-200"
					>
						Tutor Mode
					</button>
					<button
						onclick={() => loadPreset('conversation_partner')}
						class="rounded bg-pink-100 px-3 py-2 text-sm hover:bg-pink-200"
					>
						Conversation
					</button>
				</div>
			</div>

			<!-- Speaking Dynamics -->
			<div class="rounded-lg bg-white p-4 shadow">
				<h3 class="mb-3 text-lg font-semibold">🗣️ Speaking Dynamics</h3>
				<div class="space-y-4">
					<!-- Speaking Speed -->
					<div>
						<label class="mb-2 block text-sm font-medium">
							Speaking Speed
							<span class="text-xs text-gray-500">({params.speakingSpeed})</span>
						</label>
						<select
							bind:value={params.speakingSpeed}
							onchange={() => updateParameter('speakingSpeed', params.speakingSpeed)}
							class="w-full rounded border p-2 text-sm"
						>
							<option value="very_slow">Very Slow (40%)</option>
							<option value="slow">Slow (60%)</option>
							<option value="normal">Normal (70%)</option>
							<option value="fast">Fast (80%)</option>
							<option value="native">Native (85%)</option>
						</select>
					</div>

					<!-- Sentence Length -->
					<div>
						<label class="mb-2 block text-sm font-medium">
							Sentence Length
							<span class="text-xs text-gray-500">({params.sentenceLength})</span>
						</label>
						<select
							bind:value={params.sentenceLength}
							onchange={() => updateParameter('sentenceLength', params.sentenceLength)}
							class="w-full rounded border p-2 text-sm"
						>
							<option value="very_short">Very Short (3-5 words)</option>
							<option value="short">Short (5-8 words)</option>
							<option value="medium">Medium (8-12 words)</option>
							<option value="long">Long (12-15 words)</option>
							<option value="native">Native (variable)</option>
						</select>
					</div>

					<!-- Pause Frequency -->
					<div>
						<label class="mb-2 block text-sm font-medium">
							Pause Frequency
							<span class="text-xs text-gray-500">({params.pauseFrequency})</span>
						</label>
						<select
							bind:value={params.pauseFrequency}
							onchange={() => updateParameter('pauseFrequency', params.pauseFrequency)}
							class="w-full rounded border p-2 text-sm"
						>
							<option value="frequent">Frequent (2-3s)</option>
							<option value="moderate">Moderate (1-2s)</option>
							<option value="minimal">Minimal</option>
						</select>
					</div>
				</div>
			</div>

			<!-- Complexity Controls -->
			<div class="rounded-lg bg-white p-4 shadow">
				<h3 class="mb-3 text-lg font-semibold">📚 Complexity</h3>
				<div class="space-y-4">
					<!-- Target CEFR -->
					<div>
						<label class="mb-2 block text-sm font-medium">
							Target CEFR Level
							<span class="text-xs text-gray-500">({params.targetCEFR})</span>
						</label>
						<select
							bind:value={params.targetCEFR}
							onchange={() => updateParameter('targetCEFR', params.targetCEFR)}
							class="w-full rounded border p-2 text-sm"
						>
							<option value="A1">A1 - Beginner</option>
							<option value="A2">A2 - Elementary</option>
							<option value="B1">B1 - Intermediate</option>
							<option value="B2">B2 - Upper-Intermediate</option>
							<option value="C1">C1 - Advanced</option>
							<option value="C2">C2 - Expert</option>
						</select>
					</div>

					<!-- Vocabulary -->
					<div>
						<label class="mb-2 block text-sm font-medium">
							Vocabulary
							<span class="text-xs text-gray-500">({params.vocabularyComplexity})</span>
						</label>
						<select
							bind:value={params.vocabularyComplexity}
							onchange={() => updateParameter('vocabularyComplexity', params.vocabularyComplexity)}
							class="w-full rounded border p-2 text-sm"
						>
							<option value="basic">Basic (top 500)</option>
							<option value="everyday">Everyday (top 2000)</option>
							<option value="advanced">Advanced (top 5000)</option>
							<option value="specialized">Specialized</option>
						</select>
					</div>

					<!-- Grammar -->
					<div>
						<label class="mb-2 block text-sm font-medium">
							Grammar
							<span class="text-xs text-gray-500">({params.grammarComplexity})</span>
						</label>
						<select
							bind:value={params.grammarComplexity}
							onchange={() => updateParameter('grammarComplexity', params.grammarComplexity)}
							class="w-full rounded border p-2 text-sm"
						>
							<option value="simple">Simple (A1-A2)</option>
							<option value="intermediate">Intermediate (B1-B2)</option>
							<option value="advanced">Advanced (C1)</option>
							<option value="native">Native (C2)</option>
						</select>
					</div>
				</div>
			</div>

			<!-- Support & Corrections -->
			<div class="rounded-lg bg-white p-4 shadow">
				<h3 class="mb-3 text-lg font-semibold">🤝 Support & Corrections</h3>
				<div class="space-y-4">
					<!-- Scaffolding -->
					<div>
						<label class="mb-2 block text-sm font-medium">
							Scaffolding Level
							<span class="text-xs text-gray-500">({params.scaffoldingLevel})</span>
						</label>
						<select
							bind:value={params.scaffoldingLevel}
							onchange={() => updateParameter('scaffoldingLevel', params.scaffoldingLevel)}
							class="w-full rounded border p-2 text-sm"
						>
							<option value="heavy">Heavy - Lots of Help</option>
							<option value="medium">Medium - Some Help</option>
							<option value="light">Light - Minimal Help</option>
							<option value="none">None - Full Immersion</option>
						</select>
					</div>

					<!-- Correction Style -->
					<div>
						<label class="mb-2 block text-sm font-medium">
							Correction Style
							<span class="text-xs text-gray-500">({params.correctionStyle})</span>
						</label>
						<select
							bind:value={params.correctionStyle}
							onchange={() => updateParameter('correctionStyle', params.correctionStyle)}
							class="w-full rounded border p-2 text-sm"
						>
							<option value="explicit">Explicit - Direct Teaching</option>
							<option value="recast">Recast - Natural Echo</option>
							<option value="minimal">Minimal - Only Blocking</option>
							<option value="none">None - Pure Conversation</option>
						</select>
					</div>

					<!-- Language Mixing -->
					<div>
						<label class="mb-2 block text-sm font-medium">
							Language Mixing
							<span class="text-xs text-gray-500">({params.languageMixingPolicy})</span>
						</label>
						<select
							bind:value={params.languageMixingPolicy}
							onchange={() => updateParameter('languageMixingPolicy', params.languageMixingPolicy)}
							class="w-full rounded border p-2 text-sm"
						>
							<option value="code_switching">Code-Switching - Mix freely</option>
							<option value="bilingual_support">Bilingual Support</option>
							<option value="flexible">Flexible - Some help</option>
							<option value="strict_immersion">Strict Immersion</option>
						</select>
					</div>
				</div>
			</div>

			<!-- Context Selection -->
			<div class="rounded-lg bg-white p-4 shadow">
				<h3 class="mb-3 text-lg font-semibold">🎯 Context</h3>
				<div class="space-y-3">
					<div>
						<label class="mb-2 block text-sm font-medium">Language</label>
						<select
							bind:value={selectedLanguage}
							onchange={initializeComposer}
							class="w-full rounded border p-2 text-sm"
						>
							{#each languages as lang (lang.id)}
								<option value={lang}>{lang.flag} {lang.name}</option>
							{/each}
						</select>
					</div>

					<div>
						<label class="mb-2 block text-sm font-medium">Scenario</label>
						<select
							bind:value={selectedScenario}
							onchange={initializeComposer}
							class="w-full rounded border p-2 text-sm"
						>
							{#each scenariosData as scenario (scenario.id)}
								<option value={scenario}>{scenario.title}</option>
							{/each}
						</select>
					</div>

					<div>
						<label class="mb-2 block text-sm font-medium">Speaker / Dialect</label>
						{#if availableSpeakers.length > 0}
							<select
								bind:value={selectedSpeakerId}
								onchange={(event) =>
									handleSpeakerChange((event.currentTarget as HTMLSelectElement).value)}
								class="w-full rounded border p-2 text-sm"
							>
								{#each availableSpeakers as speaker (speaker.id)}
									<option value={speaker.id}>
										{speaker.speakerEmoji}
										{speaker.voiceName} — {speaker.region}
										({speaker.dialectName})
									</option>
								{/each}
							</select>
							<p class="mt-1 text-xs text-gray-500">
								Regional cues and dialect info are injected into the prompt automatically.
							</p>
						{:else}
							<div class="rounded bg-gray-100 p-2 text-sm text-gray-500">
								No speaker data yet for {selectedLanguage.name}. Using a generic voice profile.
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Actions -->
			<div class="rounded-lg bg-white p-4 shadow">
				<h3 class="mb-3 text-lg font-semibold">⚙️ Actions</h3>
				<div class="space-y-2">
					<button
						onclick={generateInstructions}
						class="w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
					>
						🔄 Regenerate
					</button>
					<button
						onclick={copyToClipboard}
						class="w-full rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
					>
						📋 Copy to Clipboard
					</button>
					<button
						onclick={resetCounters}
						class="w-full rounded bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
					>
						🔄 Reset Counters
					</button>
				</div>
			</div>
		</div>

		<!-- OUTPUT -->
		<div class="space-y-4">
			<!-- Current Parameters Summary -->
			<div class="rounded-lg bg-white p-4 shadow">
				<h3 class="mb-3 text-lg font-semibold">📊 Current Settings</h3>
				<div class="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
					<div>
						<span class="font-medium">Speaker:</span>
						{selectedSpeaker
							? `${selectedSpeaker.voiceName} (${selectedSpeaker.region ?? 'Standard'})`
							: 'Generic voice'}
					</div>
					<div>
						<span class="font-medium">Speed:</span>
						{params.speakingSpeed}
					</div>
					<div>
						<span class="font-medium">Length:</span>
						{params.sentenceLength}
					</div>
					<div>
						<span class="font-medium">CEFR:</span>
						{params.targetCEFR}
					</div>
					<div>
						<span class="font-medium">Scaffolding:</span>
						{params.scaffoldingLevel}
					</div>
					<div>
						<span class="font-medium">Vocab:</span>
						{params.vocabularyComplexity}
					</div>
					<div>
						<span class="font-medium">Grammar:</span>
						{params.grammarComplexity}
					</div>
					<div>
						<span class="font-medium">Corrections:</span>
						{params.correctionStyle}
					</div>
					<div>
						<span class="font-medium">Mixing:</span>
						{params.languageMixingPolicy.replace('_', ' ')}
					</div>
				</div>
			</div>

			<!-- Generated Instructions -->
			<div class="rounded-lg bg-white p-4 shadow">
				<div class="mb-3 flex items-center justify-between">
					<h3 class="text-lg font-semibold">📋 Generated Instructions</h3>
					<div class="flex gap-2">
						<button class="btn btn-ghost btn-xs" title="Copy plain" onclick={copyToClipboard}>
							<span class="icon-[mdi--content-copy] h-3 w-3"></span>
							<span class="ml-1">Copy</span>
						</button>
						<button class="btn btn-ghost btn-xs" title="Copy for ChatGPT" onclick={copyForChatGPT}>
							<span class="icon-[mdi--robot] h-3 w-3"></span>
							<span class="ml-1">ChatGPT</span>
						</button>
						<button class="btn btn-ghost btn-xs" title="Copy for Gemini" onclick={copyForGemini}>
							<span class="icon-[mdi--star-four-points] h-3 w-3"></span>
							<span class="ml-1">Gemini</span>
						</button>
					</div>
				</div>
				{#if isLoadingPreferences}
					<div class="mb-2 text-xs text-gray-500">Loading your saved preferences and memories…</div>
				{/if}
				<div
					class="max-h-[800px] overflow-y-auto rounded border bg-gray-50 p-4 font-mono text-xs whitespace-pre-wrap"
				>
					{currentInstructions || 'Loading instructions...'}
				</div>
				<div class="mt-3 text-xs text-gray-500">
					Instructions length: {currentInstructions.length} characters
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.container {
		background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
		min-height: 100vh;
	}
</style>
