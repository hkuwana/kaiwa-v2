<script lang="ts">
	import { onMount } from 'svelte';
	import {
		getInstructions,
		testModule,
		instructionModules
	} from '$lib/services/instructions.service';
	import type { TestInstructionParams, TestModuleParams, UpdateContext } from '$lib/data/testing';
	import {
		mockUserPreferences,
		mockSessionContexts,
		mockUpdateContexts,
		testScenarios,
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
	import { scenariosData } from '$lib/data/scenarios';

	// ============================================
	// STATE
	// ============================================

	let currentPhase: 'initial' | 'update' | 'closing' = 'initial';
	let currentInstructions = '';
	let selectedLanguage = languages[0];
	let selectedPreferences = mockUserPreferences[0];
	let selectedScenario = scenariosData[0];
	let selectedSessionContext = mockSessionContexts[0];
	let selectedUpdateType:
		| 'topic_change'
		| 'difficulty_adjust'
		| 'engagement_boost'
		| 'correction_needed' = 'topic_change';
	let selectedUpdateContext: UpdateContext = mockUpdateContexts[0];
	let timeRemaining = 30;
	let selectedModuleId = 'personality';

	// ============================================
	// FUNCTIONS
	// ============================================

	function generateInstructions() {
		try {
			const params: TestInstructionParams = {
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
	}

	function testSelectedModule() {
		try {
			const params: TestModuleParams = {
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
	}

	function loadRandomScenario() {
		const random = getRandomTestScenario();
		selectedLanguage = random.params.language;
		selectedPreferences = random.params.preferences;
		selectedScenario = random.params.scenario;
		selectedSessionContext = random.params.sessionContext;
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

	<!-- Phase Selection -->
	<div class="mb-8">
		<h2 class="mb-4 text-xl font-semibold">Phase Selection</h2>
		<div class="mb-4 flex gap-4">
			<button
				class="rounded-lg px-4 py-2 {currentPhase === 'initial'
					? 'bg-blue-500 text-white'
					: 'bg-gray-200'}"
				on:click={() => (currentPhase = 'initial')}
			>
				Initial Instructions
			</button>
			<button
				class="rounded-lg px-4 py-2 {currentPhase === 'update'
					? 'bg-blue-500 text-white'
					: 'bg-gray-200'}"
				on:click={() => (currentPhase = 'update')}
			>
				Update Instructions
			</button>
			<button
				class="rounded-lg px-4 py-2 {currentPhase === 'closing'
					? 'bg-blue-500 text-white'
					: 'bg-gray-200'}"
				on:click={() => (currentPhase = 'closing')}
			>
				Closing Instructions
			</button>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
		<!-- Parameters Panel -->
		<div class="space-y-6">
			<!-- Language Selection -->
			<div class="rounded-lg bg-white p-4 shadow">
				<h3 class="mb-3 text-lg font-semibold">🌍 Language</h3>
				<select
					bind:value={selectedLanguage}
					class="w-full rounded border p-2"
					on:change={generateInstructions}
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
						<label class="mb-1 block text-sm font-medium">Speaking Level (0-100)</label>
						<input
							type="range"
							min="0"
							max="100"
							bind:value={selectedPreferences.speakingLevel}
							class="w-full"
							on:input={generateInstructions}
						/>
						<span class="text-sm text-gray-600">{selectedPreferences.speakingLevel}</span>
					</div>
					<div>
						<label class="mb-1 block text-sm font-medium">Learning Goal</label>
						<select
							bind:value={selectedPreferences.learningGoal}
							class="w-full rounded border p-2"
							on:change={generateInstructions}
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
						<label class="mb-1 block text-sm font-medium">Correction Style</label>
						<select
							bind:value={selectedPreferences.correctionStyle}
							class="w-full rounded border p-2"
							on:change={generateInstructions}
						>
							<option value="immediate">Immediate</option>
							<option value="gentle">Gentle</option>
							<option value="end_of_session">End of Session</option>
						</select>
					</div>
					<div>
						<label class="mb-1 block text-sm font-medium">Total Conversations</label>
						<input
							type="number"
							min="0"
							bind:value={selectedPreferences.totalConversations}
							class="w-full rounded border p-2"
							on:input={generateInstructions}
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
					on:change={generateInstructions}
				>
					{#each scenariosData as scenario}
						<option value={scenario}>{scenario.title} ({scenario.category})</option>
					{/each}
				</select>
			</div>

			<!-- Session Context -->
			<div class="rounded-lg bg-white p-4 shadow">
				<h3 class="mb-3 text-lg font-semibold">📝 Session Context</h3>
				<select
					bind:value={selectedSessionContext}
					class="w-full rounded border p-2"
					on:change={generateInstructions}
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
							<label class="mb-1 block text-sm font-medium">Update Type</label>
							<select
								bind:value={selectedUpdateType}
								class="w-full rounded border p-2"
								on:change={generateInstructions}
							>
								<option value="topic_change">Topic Change</option>
								<option value="difficulty_adjust">Difficulty Adjust</option>
								<option value="engagement_boost">Engagement Boost</option>
								<option value="correction_needed">Correction Needed</option>
							</select>
						</div>
						{#if selectedUpdateType === 'topic_change' && isTopicChange(selectedUpdateContext)}
							<div>
								<label class="mb-1 block text-sm font-medium">New Topic</label>
								<input
									type="text"
									bind:value={selectedUpdateContext.newTopic}
									class="w-full rounded border p-2"
									on:input={generateInstructions}
									placeholder="Enter new topic"
								/>
							</div>
						{:else if selectedUpdateType === 'difficulty_adjust' && isDifficultyAdjust(selectedUpdateContext)}
							<div>
								<label class="mb-1 block text-sm font-medium">Increase Difficulty</label>
								<input
									type="checkbox"
									bind:checked={selectedUpdateContext.increase}
									on:change={generateInstructions}
								/>
							</div>
						{:else if selectedUpdateType === 'engagement_boost' && isEngagementBoost(selectedUpdateContext)}
							<div>
								<label class="mb-1 block text-sm font-medium">Reason</label>
								<input
									type="text"
									bind:value={selectedUpdateContext.reason}
									class="w-full rounded border p-2"
									on:input={generateInstructions}
									placeholder="Enter reason"
								/>
							</div>
						{:else if selectedUpdateType === 'correction_needed' && isCorrectionNeeded(selectedUpdateContext)}
							<div>
								<label class="mb-1 block text-sm font-medium">Error Pattern</label>
								<input
									type="text"
									bind:value={selectedUpdateContext.errorPattern}
									class="w-full rounded border p-2"
									on:input={generateInstructions}
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
						<label class="mb-1 block text-sm font-medium">Time Remaining (seconds)</label>
						<input
							type="number"
							min="0"
							max="60"
							bind:value={timeRemaining}
							class="w-full rounded border p-2"
							on:input={generateInstructions}
						/>
					</div>
				</div>
			{/if}

			<!-- Module Testing -->
			<div class="rounded-lg bg-white p-4 shadow">
				<h3 class="mb-3 text-lg font-semibold">🧩 Module Testing</h3>
				<div class="space-y-3">
					<div>
						<label class="mb-1 block text-sm font-medium">Module ID</label>
						<select bind:value={selectedModuleId} class="w-full rounded border p-2">
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
						on:click={testSelectedModule}
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
						on:click={loadRandomScenario}
						class="w-full rounded bg-purple-500 px-4 py-2 text-white hover:bg-purple-600"
					>
						Load Random Test Scenario
					</button>
					<button
						on:click={loadRandomData}
						class="w-full rounded bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
					>
						Load Random Data
					</button>
					<button
						on:click={generateInstructions}
						class="w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
					>
						Generate Instructions
					</button>
				</div>
			</div>
		</div>

		<!-- Instructions Output -->
		<div class="rounded-lg bg-white p-4 shadow">
			<h3 class="mb-3 text-lg font-semibold">📋 Generated Instructions</h3>
			<div
				class="max-h-96 overflow-y-auto rounded border bg-gray-50 p-4 font-mono text-sm whitespace-pre-wrap"
			>
				{currentInstructions || 'Click "Generate Instructions" to see output...'}
			</div>
		</div>
	</div>

	<!-- Current Parameters Display -->
	<div class="mt-8 rounded-lg bg-white p-4 shadow">
		<h3 class="mb-3 text-lg font-semibold">📊 Current Parameters</h3>
		<div class="grid grid-cols-1 gap-4 text-sm md:grid-cols-2 lg:grid-cols-4">
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
	</div>
</div>

<style>
	.container {
		background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
		min-height: 100vh;
	}
</style>
