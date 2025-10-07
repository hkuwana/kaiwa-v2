<script lang="ts">
	import { onMount } from 'svelte';
	import { getInstructions, testModule } from '$lib/services/instructions.service';
	import type { TestInstructionParams, TestModuleParams, UpdateContext } from '$lib/data/testing';
	import {
		mockUserPreferences,
		mockSessionContexts,
		mockUpdateContexts,
		getRandomTestScenario,
		getRandomLanguage,
		getRandomPreferences,
		getRandomScenario,
		getRandomSessionContext,
		getRandomUpdateContext,
		isTopicChange,
		isDifficultyAdjust,
		isEngagementBoost,
		isCorrectionNeeded
	} from '$lib/data/testing';
	import { languages } from '$lib/data/languages';
	import { scenariosData, type ScenarioWithHints } from '$lib/data/scenarios';
	import { userManager } from '$lib/stores/user.store.svelte';

	const instructionFlowDiagram = String.raw`
                 +-------------------------+
                 |  getInstructions(phase) |
                 +-----------+-------------+
                             |
        +--------------------+-----------------------+
        |                                            |
        v                                            v
+---------------+                           +-----------------------------+
| Phase: initial|                           | Phase: update / closing     |
+-------+-------+                           +-----------+-----------------+
        |                                               |
        |                                               |
        v                                               v
+---------------------------+                +---------------------------+
| ModuleComposer.compose()  |                | Phase specific generators  |
| (applies to all phases)   |                | - generateUpdateInstructions|
+-----------+---------------+                | - generateClosingInstructions|
            |                                 +-------------+-------------+
            |                                               |
            v                                               v
    +------------------+                             +-------------------+
    | Instruction Mods |                             | Update / Closing  |
    | (priority sorted)|                             | templates         |
    +---------+--------+                             +-------------------+
              |
              v
  +-----------------------------+
  | Core Modules pull from      |
  |-----------------------------|
  | User (db.users)             |
  | UserPreferences (db.user_*) |
  | Scenario (db.scenarios)     |
  | SessionContext (runtime)    |
  | Speaker (db.speakers)       |
  | Language (db.languages)     |
  +-----------------------------+
              |
              v
   +----------------------------+
   | Onboarding Branch?         |
   +-------------+--------------+
                 |
        +--------+---------+
        |                  |
        v                  v
+---------------+   +--------------------------+
| First-time or |   | Returning user (no       |
| scenario=onbd |   | onboarding block)        |
+-------+-------+   +-----------+--------------+
        |                       |
        v                       v
+------------------------------+        +-------------------------------+
| buildOnboardingBlock()       |        | RETURNING USER WELCOME block  |
|  - intro section             |        +-------------------------------+
|  - goal discovery            |
|  - level sensing             |
|  - momentum builder          |
|  - non-negotiable vibes      |
+---------------+--------------+
                |
                v
      +--------------------+
      | Combined output    |
      +--------------------+
                |
                v
      +--------------------+
      | Realtime prompt    |
      +--------------------+

Supplementary Path (Scenario-first)
-----------------------------------

Scenario input + base data --> generateScenarioInstructions()
    |                                  |
    |                                  v
    |                         +---------------------+
    |                         | Base instructions   |
    |                         +---------+-----------+
    |                                   |
    |                                   v
    |                        +--------------------------+
    |                        | Onboarding condition?    |
    |                        +-----------+--------------+
    |                                    |
    |            yes --------------------+---------------- no
    |             |                                          |
    v             v                                          v
initialMessage + onboarding block            Scenario-specific additions`;

	const instructionFlowLegend = String.raw`
Legend
------
User fields → db.users                Scenario → db.scenarios
Preferences → db.user_preferences     Speaker → db.speakers
Language → db.languages               SessionContext → runtime context`;

	// ============================================
	// STATE
	// ============================================

	let currentPhase: 'initial' | 'update' | 'closing' = $state('initial');
	let currentInstructions = $state('');
	let selectedLanguage = $state(languages[0]);
	let selectedPreferences = $state(mockUserPreferences[0]);
	let selectedScenario = $state(scenariosData[0]);
	let selectedSessionContext = $state(mockSessionContexts[0]);
	let selectedUpdateType:
		| 'topic_change'
		| 'difficulty_adjust'
		| 'engagement_boost'
		| 'correction_needed' = $state('topic_change');
	let selectedUpdateContext: UpdateContext = $state(mockUpdateContexts[0]);
	let timeRemaining = $state(30);
	let selectedModuleId = $state('personality');
	const defaultComparisonScenario =
		scenariosData.find((scenario) => scenario.id !== scenariosData[0]?.id) || null;
	let compareMode = $state(false);
	let comparisonScenario = $state(defaultComparisonScenario);
	let comparisonInstructions = $state('');
	const comparisonOptions = $derived(
		scenariosData.filter((scenario) => scenario.id !== selectedScenario?.id)
	) as ScenarioWithHints[];

	// ============================================
	// FUNCTIONS
	// ============================================

	function generateInstructions() {
		try {
			const params: TestInstructionParams = {
				user: userManager.user,
				language: selectedLanguage,
				preferences: selectedPreferences,
				scenario: selectedScenario,
				sessionContext: selectedSessionContext
			};

			if (currentPhase === 'update') {
				params.updateType = selectedUpdateType;
				params.updateContext = selectedUpdateContext;
			} else if (currentPhase === 'closing') {
				params.timeRemaining = timeRemaining;
			}

			currentInstructions = getInstructions(currentPhase, params);
		} catch (error) {
			currentInstructions = `Error: ${error instanceof Error ? error.message : String(error)}`;
		}

		if (compareMode) {
			ensureComparisonScenario();
			syncComparisonInstructions();
		} else {
			comparisonInstructions = '';
		}
	}

	function testSelectedModule() {
		try {
			const params: TestModuleParams = {
				user: userManager.user,
				moduleId: selectedModuleId,
				language: selectedLanguage,
				preferences: selectedPreferences,
				scenario: selectedScenario,
				sessionContext: selectedSessionContext
			};

			currentInstructions = testModule(selectedModuleId, params);
		} catch (error) {
			currentInstructions = `Error: ${error instanceof Error ? error.message : String(error)}`;
		}

		if (compareMode) {
			if (comparisonScenario) {
				try {
					const comparisonParams: TestModuleParams = {
						user: userManager.user,
						moduleId: selectedModuleId,
						language: selectedLanguage,
						preferences: selectedPreferences,
						scenario: comparisonScenario,
						sessionContext: selectedSessionContext
					};
					comparisonInstructions = testModule(selectedModuleId, comparisonParams);
				} catch (error) {
					comparisonInstructions = `Error: ${error instanceof Error ? error.message : String(error)}`;
				}
			} else {
				comparisonInstructions = 'Select a second scenario to compare module output.';
			}
		} else {
			comparisonInstructions = '';
		}
	}

	function loadRandomScenario() {
		const random = getRandomTestScenario();
		selectedLanguage = random.params.language;
		selectedPreferences = random.params.preferences;
		selectedScenario = random.params.scenario;
		selectedSessionContext = random.params.sessionContext;
		generateInstructions();
	}

	function ensureComparisonScenario() {
		if (!compareMode) return;
		if (!comparisonScenario || comparisonScenario.id === selectedScenario.id) {
			comparisonScenario = comparisonOptions[0] ?? null;
		}
	}

	function syncComparisonInstructions() {
		if (!compareMode) {
			comparisonInstructions = '';
			return;
		}

		ensureComparisonScenario();

		if (!comparisonScenario) {
			comparisonInstructions = 'Select a second scenario to compare.';
			return;
		}

		try {
			const params: TestInstructionParams = {
				user: userManager.user,
				language: selectedLanguage,
				preferences: selectedPreferences,
				scenario: comparisonScenario,
				sessionContext: selectedSessionContext
			};

			if (currentPhase === 'update') {
				params.updateType = selectedUpdateType;
				params.updateContext = selectedUpdateContext;
			} else if (currentPhase === 'closing') {
				params.timeRemaining = timeRemaining;
			}

			comparisonInstructions = getInstructions(currentPhase, params);
		} catch (error) {
			comparisonInstructions = `Error: ${error instanceof Error ? error.message : String(error)}`;
		}
	}

	function handleCompareToggle(enabled: boolean) {
		if (enabled) {
			ensureComparisonScenario();
			syncComparisonInstructions();
		} else {
			comparisonInstructions = '';
		}
	}

	function swapScenarios() {
		if (!comparisonScenario) return;
		const previousPrimary = selectedScenario;
		selectedScenario = comparisonScenario;
		comparisonScenario = previousPrimary;
		generateInstructions();
	}

	function loadRandomData() {
		selectedLanguage = getRandomLanguage();
		selectedPreferences = getRandomPreferences();
		selectedScenario = getRandomScenario();
		selectedSessionContext = getRandomSessionContext();
		selectedUpdateContext = getRandomUpdateContext();
		generateInstructions();
	}

	// ============================================
	// LIFECYCLE
	// ============================================

	onMount(() => {
		generateInstructions();
	});
</script>

<svelte:head>
	<title>Dev Instructions - Instructions Service Testing</title>
</svelte:head>

<div class="container mx-auto max-w-6xl p-6">
	<h1 class="mb-6 text-center text-3xl font-bold">🧪 Instructions Service Testing</h1>

	<section class="mb-8 rounded-lg bg-white p-4 shadow">
		<h2 class="mb-4 text-2xl font-semibold">Instruction Flow Map</h2>
		<pre class="overflow-auto font-mono text-xs leading-relaxed whitespace-pre">
			{instructionFlowDiagram}
		</pre>
		<pre class="mt-4 font-mono text-xs whitespace-pre-wrap text-gray-600">
			{instructionFlowLegend}
		</pre>
	</section>

	<!-- Phase Selection -->
	<div class="mb-8">
		<h2 class="mb-4 text-xl font-semibold">Phase Selection</h2>
		<div class="mb-4 flex gap-4">
			<button
				class="rounded-lg px-4 py-2 {currentPhase === 'initial'
					? 'bg-blue-500 text-white'
					: 'bg-gray-200'}"
				onclick={() => (currentPhase = 'initial')}
			>
				Initial Instructions
			</button>
			<button
				class="rounded-lg px-4 py-2 {currentPhase === 'update'
					? 'bg-blue-500 text-white'
					: 'bg-gray-200'}"
				onclick={() => (currentPhase = 'update')}
			>
				Update Instructions
			</button>
			<button
				class="rounded-lg px-4 py-2 {currentPhase === 'closing'
					? 'bg-blue-500 text-white'
					: 'bg-gray-200'}"
				onclick={() => (currentPhase = 'closing')}
			>
				Closing Instructions
			</button>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
		<!-- Parameters Panel -->
		<div class="space-y-6">
			<!-- Language Selection -->
			<div class="rounded-lg bg-white p-4 shadow">
				<h3 class="mb-3 text-lg font-semibold">🌍 Language</h3>
				<select
					bind:value={selectedLanguage}
					class="w-full rounded border p-2"
					onchange={generateInstructions}
				>
					{#each languages as language}
						<option value={language}>{language.flag} {language.name}</option>
					{/each}
				</select>
			</div>

			<!-- User Preferences -->
			<div class="rounded-lg bg-white p-4 shadow">
				<h3 class="mb-3 text-lg font-semibold">👤 User Preferences</h3>
				<div class="space-y-3">
					<div>
						<label for="speaking-level" class="mb-1 block text-sm font-medium"
							>Speaking Level (0-100)</label
						>
						<input
							id="speaking-level"
							type="range"
							min="0"
							max="100"
							bind:value={selectedPreferences.speakingLevel}
							class="w-full"
							oninput={generateInstructions}
						/>
						<span class="text-sm text-gray-600">{selectedPreferences.speakingLevel}</span>
					</div>
					<div>
						<label for="learning-goal" class="mb-1 block text-sm font-medium">Learning Goal</label>
						<select
							id="learning-goal"
							bind:value={selectedPreferences.learningGoal}
							class="w-full rounded border p-2"
							onchange={generateInstructions}
						>
							<option value="Connection">Connection</option>
							<option value="Career">Career</option>
							<option value="Travel">Travel</option>
							<option value="Academic">Academic</option>
							<option value="Culture">Culture</option>
							<option value="Growth">Growth</option>
						</select>
					</div>
					<div>
						<label for="correction-style" class="mb-1 block text-sm font-medium"
							>Correction Style</label
						>
						<select
							id="correction-style"
							bind:value={selectedPreferences.correctionStyle}
							class="w-full rounded border p-2"
							onchange={generateInstructions}
						>
							<option value="immediate">Immediate</option>
							<option value="gentle">Gentle</option>
							<option value="end_of_session">End of Session</option>
						</select>
					</div>
					<div>
						<label for="total-conversations" class="mb-1 block text-sm font-medium"
							>Total Conversations</label
						>
						<input
							id="total-conversations"
							type="number"
							min="0"
							bind:value={selectedPreferences.successfulExchanges}
							class="w-full rounded border p-2"
							oninput={generateInstructions}
						/>
					</div>
				</div>
			</div>

			<!-- Scenario Selection -->
			<div class="rounded-lg bg-white p-4 shadow">
				<h3 class="mb-3 text-lg font-semibold">🎯 Scenario</h3>
				<select
					bind:value={selectedScenario}
					class="w-full rounded border p-2"
					onchange={generateInstructions}
				>
					{#each scenariosData as scenario}
						<option value={scenario}>{scenario.title} ({scenario.category})</option>
					{/each}
				</select>
			</div>

			<div class="rounded-lg bg-white p-4 shadow">
				<div class="flex items-center justify-between gap-2">
					<h3 class="text-lg font-semibold">🆚 Scenario Comparison</h3>
					<label class="flex items-center gap-2 text-sm font-medium">
						<span>Compare</span>
						<input
							type="checkbox"
							class="toggle toggle-sm"
							bind:checked={compareMode}
							onchange={() => handleCompareToggle(compareMode)}
							aria-label="Toggle scenario comparison"
						/>
					</label>
				</div>
				{#if compareMode}
					<div class="mt-4 space-y-3">
						{#if comparisonOptions.length > 0}
							<select
								bind:value={comparisonScenario}
								class="w-full rounded border p-2"
								onchange={() => syncComparisonInstructions()}
							>
								{#each comparisonOptions as scenario (scenario.id)}
									<option value={scenario}>{scenario.title} ({scenario.category})</option>
								{/each}
							</select>
							<button
								class="w-full rounded bg-gray-800 px-4 py-2 text-white hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
								onclick={swapScenarios}
								disabled={!comparisonScenario}
							>
								Swap with Primary Scenario
							</button>
						{:else}
							<p
								class="rounded border border-dashed border-gray-300 bg-gray-50 p-3 text-sm text-gray-600"
							>
								Add at least one more active scenario to enable side-by-side comparison.
							</p>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Session Context -->
			<div class="rounded-lg bg-white p-4 shadow">
				<h3 class="mb-3 text-lg font-semibold">📝 Session Context</h3>
				<select
					bind:value={selectedSessionContext}
					class="w-full rounded border p-2"
					onchange={generateInstructions}
				>
					{#each mockSessionContexts as context}
						<option value={context}>{context.currentTopic} ({context.timeElapsed}s)</option>
					{/each}
				</select>
			</div>

			<!-- Phase-specific Parameters -->
			{#if currentPhase === 'update'}
				<div class="rounded-lg bg-white p-4 shadow">
					<h3 class="mb-3 text-lg font-semibold">🔄 Update Parameters</h3>
					<div class="space-y-3">
						<div>
							<label for="update-type" class="mb-1 block text-sm font-medium">Update Type</label>
							<select
								id="update-type"
								bind:value={selectedUpdateType}
								class="w-full rounded border p-2"
								onchange={generateInstructions}
							>
								<option value="topic_change">Topic Change</option>
								<option value="difficulty_adjust">Difficulty Adjust</option>
								<option value="engagement_boost">Engagement Boost</option>
								<option value="correction_needed">Correction Needed</option>
							</select>
						</div>
						{#if selectedUpdateType === 'topic_change' && isTopicChange(selectedUpdateContext)}
							<div>
								<label for="new-topic" class="mb-1 block text-sm font-medium">New Topic</label>
								<input
									id="new-topic"
									type="text"
									bind:value={selectedUpdateContext.newTopic}
									class="w-full rounded border p-2"
									oninput={generateInstructions}
									placeholder="Enter new topic"
								/>
							</div>
						{:else if selectedUpdateType === 'difficulty_adjust' && isDifficultyAdjust(selectedUpdateContext)}
							<div>
								<label for="increase-difficulty" class="mb-1 block text-sm font-medium"
									>Increase Difficulty</label
								>
								<input
									id="increase-difficulty"
									type="checkbox"
									bind:checked={selectedUpdateContext.increase}
									onchange={generateInstructions}
								/>
							</div>
						{:else if selectedUpdateType === 'engagement_boost' && isEngagementBoost(selectedUpdateContext)}
							<div>
								<label for="reason" class="mb-1 block text-sm font-medium">Reason</label>
								<input
									id="reason"
									type="text"
									bind:value={selectedUpdateContext.reason}
									class="w-full rounded border p-2"
									oninput={generateInstructions}
									placeholder="Enter reason"
								/>
							</div>
						{:else if selectedUpdateType === 'correction_needed' && isCorrectionNeeded(selectedUpdateContext)}
							<div>
								<label for="error-pattern" class="mb-1 block text-sm font-medium"
									>Error Pattern</label
								>
								<input
									id="error-pattern"
									type="text"
									bind:value={selectedUpdateContext.errorPattern}
									class="w-full rounded border p-2"
									oninput={generateInstructions}
									placeholder="Enter error pattern"
								/>
							</div>
						{/if}
					</div>
				</div>
			{:else if currentPhase === 'closing'}
				<div class="rounded-lg bg-white p-4 shadow">
					<h3 class="mb-3 text-lg font-semibold">⏰ Closing Parameters</h3>
					<div>
						<label for="time-remaining" class="mb-1 block text-sm font-medium"
							>Time Remaining (seconds)</label
						>
						<input
							id="time-remaining"
							type="number"
							min="0"
							max="60"
							bind:value={timeRemaining}
							class="w-full rounded border p-2"
							oninput={generateInstructions}
						/>
					</div>
				</div>
			{/if}

			<!-- Module Testing -->
			<div class="rounded-lg bg-white p-4 shadow">
				<h3 class="mb-3 text-lg font-semibold">🧩 Module Testing</h3>
				<div class="space-y-3">
					<div>
						<label for="module-id" class="mb-1 block text-sm font-medium">Module ID</label>
						<select id="module-id" bind:value={selectedModuleId} class="w-full rounded border p-2">
							<option value="personality">personality</option>
							<option value="pace">pace</option>
							<option value="complexity">complexity</option>
							<option value="corrections">corrections</option>
							<option value="goal-focus">goal-focus</option>
							<option value="scenario-context">scenario-context</option>
							<option value="audio-handling">audio-handling</option>
							<option value="anti-patterns">anti-patterns</option>
						</select>
					</div>
					<button
						onclick={testSelectedModule}
						class="w-full rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
					>
						Test Module
					</button>
				</div>
			</div>

			<!-- Quick Actions -->
			<div class="rounded-lg bg-white p-4 shadow">
				<h3 class="mb-3 text-lg font-semibold">⚡ Quick Actions</h3>
				<div class="space-y-2">
					<button
						onclick={loadRandomScenario}
						class="w-full rounded bg-purple-500 px-4 py-2 text-white hover:bg-purple-600"
					>
						Load Random Test Scenario
					</button>
					<button
						onclick={loadRandomData}
						class="w-full rounded bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
					>
						Load Random Data
					</button>
					<button
						onclick={generateInstructions}
						class="w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
					>
						Generate Instructions
					</button>
				</div>
			</div>
		</div>

		<div class="space-y-6">
			<div class="rounded-lg bg-white p-4 shadow xl:sticky xl:top-6">
				<h3 class="mb-3 text-lg font-semibold">📊 Current Parameters</h3>
				<div class="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
					<div>
						<strong>Language:</strong>
						{selectedLanguage.name} ({selectedLanguage.code})
					</div>
					<div>
						<strong>Level:</strong>
						{selectedPreferences.speakingLevel}/100
					</div>
					<div>
						<strong>Goal:</strong>
						{selectedPreferences.learningGoal}
					</div>
					<div>
						<strong>Corrections:</strong>
						{selectedPreferences.correctionStyle}
					</div>
					<div>
						<strong>Scenario:</strong>
						{selectedScenario.title}
					</div>
					<div>
						<strong>Topic:</strong>
						{selectedSessionContext.currentTopic}
					</div>
					<div>
						<strong>Time Elapsed:</strong>
						{selectedSessionContext.timeElapsed}s
					</div>
					<div>
						<strong>Phase:</strong>
						{currentPhase}
					</div>
				</div>

				{#if compareMode}
					<div class="mt-4 rounded border border-dashed border-gray-300 p-3 text-sm">
						{#if comparisonScenario}
							<p class="mb-1 font-semibold">Comparison Scenario</p>
							<p>
								<strong>Scenario:</strong>
								{comparisonScenario.title}
							</p>
							<p>
								<strong>Category:</strong>
								{comparisonScenario.category}
							</p>
						{:else}
							<p class="text-gray-500">Select another scenario to enable comparison output.</p>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>

	<section class="mt-10 space-y-4">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<h2 class="text-2xl font-semibold">📋 Generated Instructions</h2>
			<div class="text-sm text-gray-600">
				{#if compareMode && comparisonScenario}
					Comparing "{selectedScenario.title}" ↔ "{comparisonScenario.title}"
				{:else if compareMode}
					Select another scenario to compare with "{selectedScenario.title}".
				{:else}
					Current scenario: {selectedScenario.title}
				{/if}
			</div>
		</div>

		{#if compareMode && comparisonScenario}
			<div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
				<article class="rounded-lg bg-white p-4 shadow">
					<header class="mb-3">
						<h3 class="text-lg font-semibold">{selectedScenario.title}</h3>
						<p class="text-xs tracking-wide text-gray-500 uppercase">
							{selectedScenario.category}
						</p>
					</header>
					<div
						class="min-h-[28rem] overflow-x-auto rounded border bg-gray-50 p-4 font-mono text-sm whitespace-pre-wrap"
					>
						{currentInstructions || 'Click "Generate Instructions" to see output...'}
					</div>
				</article>
				<article class="rounded-lg bg-white p-4 shadow">
					<header class="mb-3">
						<h3 class="text-lg font-semibold">{comparisonScenario.title}</h3>
						<p class="text-xs tracking-wide text-gray-500 uppercase">
							{comparisonScenario.category}
						</p>
					</header>
					<div
						class="min-h-[28rem] overflow-x-auto rounded border bg-gray-50 p-4 font-mono text-sm whitespace-pre-wrap"
					>
						{comparisonInstructions || 'Adjust parameters or regenerate to view comparison.'}
					</div>
				</article>
			</div>
		{:else}
			<article class="rounded-lg bg-white p-4 shadow">
				<header class="mb-3">
					<h3 class="text-lg font-semibold">{selectedScenario.title}</h3>
					<p class="text-xs tracking-wide text-gray-500 uppercase">{selectedScenario.category}</p>
				</header>
				<div
					class="min-h-[32rem] overflow-x-auto rounded border bg-gray-50 p-4 font-mono text-sm whitespace-pre-wrap"
				>
					{currentInstructions || 'Click "Generate Instructions" to see output...'}
				</div>
			</article>

			{#if compareMode && !comparisonScenario}
				<p class="text-sm text-red-500">
					No additional scenarios available for comparison. Add another scenario to compare outputs.
				</p>
			{/if}
		{/if}
	</section>
</div>

<style>
	.container {
		background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
		min-height: 100vh;
	}
</style>
