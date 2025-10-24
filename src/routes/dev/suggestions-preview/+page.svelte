<script lang="ts">
	import UnifiedConversationBubble from '$lib/features/analysis/components/UnifiedConversationBubble.svelte';
	import type { AnalysisMessage } from '$lib/features/analysis/services/analysis.service';
	import type { AnalysisSuggestion } from '$lib/features/analysis/types/analysis-suggestion.types';
	import { SvelteDate } from 'svelte/reactivity';

	// Test Scenario 1: Grammar and hint suggestions
	const scenario1Messages: AnalysisMessage[] = [
		{
			id: 'msg-1',
			role: 'user',
			content: 'I goes to the store yesterday and buy some foods.',
			timestamp: new SvelteDate()
		},
		{
			id: 'msg-2',
			role: 'assistant',
			content: 'That sounds great! What kind of food did you buy?',
			timestamp: new SvelteDate()
		}
	];

	const scenario1Suggestions: AnalysisSuggestion[] = [
		{
			id: 'sug-1',
			ruleId: 'verb-tense',
			category: 'Grammar',
			severity: 'warning',
			messageId: 'msg-1',
			originalText: 'I goes',
			suggestedText: 'I went',
			explanation: 'Use past tense "went" when talking about yesterday',
			example: 'I went to the park yesterday.'
		},
		{
			id: 'sug-2',
			ruleId: 'verb-agreement',
			category: 'Grammar',
			severity: 'warning',
			messageId: 'msg-1',
			originalText: 'buy',
			suggestedText: 'bought',
			explanation: 'Past tense verbs should match the time indicator "yesterday"',
			example: 'Yesterday I bought a new book.'
		},
		{
			id: 'sug-3',
			ruleId: 'word-choice',
			category: 'Vocabulary',
			severity: 'hint',
			messageId: 'msg-1',
			originalText: 'some foods',
			suggestedText: 'some food',
			explanation: '"Food" is usually uncountable in English',
			example: 'I bought some food at the market.'
		}
	];

	// Test Scenario 2: Pronunciation and fluency suggestions
	const scenario2Messages: AnalysisMessage[] = [
		{
			id: 'msg-3',
			role: 'user',
			content: '¿Cómo estás? Me llamo María y soy de México.',
			timestamp: new SvelteDate()
		},
		{
			id: 'msg-4',
			role: 'assistant',
			content: '¡Hola María! Mucho gusto. Yo soy tu asistente de español.',
			timestamp: new SvelteDate()
		}
	];

	const scenario2Suggestions: AnalysisSuggestion[] = [
		{
			id: 'sug-4',
			ruleId: 'pronunciation',
			category: 'Pronunciation',
			severity: 'info',
			messageId: 'msg-3',
			originalText: 'México',
			suggestedText: 'México',
			explanation: 'Remember to roll the "rr" sound in Spanish words',
			example: 'Practice: México, perro, carro'
		},
		{
			id: 'sug-5',
			ruleId: 'fluency',
			category: 'Fluency',
			severity: 'hint',
			messageId: 'msg-3',
			originalText: 'Me llamo María',
			suggestedText: 'Soy María',
			explanation: 'In casual conversation, "Soy María" sounds more natural',
			example: '¡Hola! Soy Carlos, ¿y tú?'
		}
	];

	// Test Scenario 3: Mixed suggestions with different severities
	const scenario3Messages: AnalysisMessage[] = [
		{
			id: 'msg-5',
			role: 'user',
			content: 'Could you helping me with this problem? It are very difficult.',
			timestamp: new SvelteDate()
		},
		{
			id: 'msg-6',
			role: 'assistant',
			content: "Of course! I'd be happy to help you with that.",
			timestamp: new SvelteDate()
		},
		{
			id: 'msg-7',
			role: 'user',
			content: 'Thanks! You is very kind person.',
			timestamp: new SvelteDate()
		}
	];

	const scenario3Suggestions: AnalysisSuggestion[] = [
		{
			id: 'sug-6',
			ruleId: 'modal-verb',
			category: 'Grammar',
			severity: 'warning',
			messageId: 'msg-5',
			originalText: 'Could you helping',
			suggestedText: 'Could you help',
			explanation: 'After modal verbs like "could", use the base form of the verb',
			example: 'Could you help me? Can you come?'
		},
		{
			id: 'sug-7',
			ruleId: 'subject-verb',
			category: 'Grammar',
			severity: 'warning',
			messageId: 'msg-5',
			originalText: 'It are',
			suggestedText: 'It is',
			explanation: 'Singular subjects like "it" need singular verbs like "is"',
			example: 'It is cold. The book is interesting.'
		},
		{
			id: 'sug-8',
			ruleId: 'subject-verb-agreement',
			category: 'Grammar',
			severity: 'warning',
			messageId: 'msg-7',
			originalText: 'You is',
			suggestedText: 'You are',
			explanation: 'Always use "are" with "you", never "is"',
			example: 'You are nice. You are my friend.'
		},
		{
			id: 'sug-9',
			ruleId: 'article-usage',
			category: 'Grammar',
			severity: 'hint',
			messageId: 'msg-7',
			originalText: 'very kind person',
			suggestedText: 'a very kind person',
			explanation: 'Use "a" or "an" before singular countable nouns',
			example: 'You are a good teacher. She is an artist.'
		}
	];

	let selectedScenario = $state<'scenario1' | 'scenario2' | 'scenario3'>('scenario1');
	let showSuggestions = $state(true);

	const currentMessages = $derived(() => {
		switch (selectedScenario) {
			case 'scenario1':
				return scenario1Messages;
			case 'scenario2':
				return scenario2Messages;
			case 'scenario3':
				return scenario3Messages;
		}
	});

	const currentSuggestions = $derived(() => {
		switch (selectedScenario) {
			case 'scenario1':
				return scenario1Suggestions;
			case 'scenario2':
				return scenario2Suggestions;
			case 'scenario3':
				return scenario3Suggestions;
		}
	});

	const scenarioTitles = {
		scenario1: 'Grammar & Vocabulary (English)',
		scenario2: 'Pronunciation & Fluency (Spanish)',
		scenario3: 'Mixed Severity Suggestions (English)'
	};
</script>

<svelte:head>
	<title>Conversation Suggestions Preview Test</title>
</svelte:head>

<div class="min-h-screen bg-base-200 p-6">
	<div class="container mx-auto max-w-6xl">
		<div class="mb-6">
			<h1 class="mb-2 text-3xl font-bold">🔍 Conversation Suggestions Preview</h1>
			<p class="text-base-content/70">
				Test the UnifiedConversationBubble component with side-by-side correction panels and
				different types of language learning suggestions
			</p>
		</div>

		<!-- Scenario Selector -->
		<div class="card mb-6 bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title">Test Scenarios</h2>
				<div class="flex flex-wrap items-center gap-4">
					<div class="tabs-boxed tabs">
						<button
							class="tab {selectedScenario === 'scenario1' ? 'tab-active' : ''}"
							onclick={() => (selectedScenario = 'scenario1')}
						>
							Scenario 1
						</button>
						<button
							class="tab {selectedScenario === 'scenario2' ? 'tab-active' : ''}"
							onclick={() => (selectedScenario = 'scenario2')}
						>
							Scenario 2
						</button>
						<button
							class="tab {selectedScenario === 'scenario3' ? 'tab-active' : ''}"
							onclick={() => (selectedScenario = 'scenario3')}
						>
							Scenario 3
						</button>
					</div>
					<div class="form-control">
						<label class="label cursor-pointer">
							<span class="label-text mr-2">Show Suggestions</span>
							<input type="checkbox" class="toggle toggle-primary" bind:checked={showSuggestions} />
						</label>
					</div>
				</div>
			</div>
		</div>

		<!-- Current Scenario Info -->
		<div class="card mb-6 bg-base-100 shadow-xl">
			<div class="card-body">
				<h3 class="card-title text-lg">{scenarioTitles[selectedScenario]}</h3>
				<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
					<div class="stat">
						<div class="stat-title">Messages</div>
						<div class="stat-value text-xl">{currentMessages().length}</div>
					</div>
					<div class="stat">
						<div class="stat-title">Suggestions</div>
						<div class="stat-value text-xl">{currentSuggestions().length}</div>
					</div>
					<div class="stat">
						<div class="stat-title">Suggestion Types</div>
						<div class="stat-value text-sm">
							{#each [...new Set(currentSuggestions().map((s) => s.severity))] as severity, i (i)}
								<div
									class="badge badge-xs {severity === 'warning'
										? 'badge-warning'
										: severity === 'hint'
											? 'badge-success'
											: 'badge-info'} mr-1"
								>
									{severity}
								</div>
							{/each}
						</div>
					</div>
				</div>

				<!-- Scenario Details -->
				{#if selectedScenario === 'scenario1'}
					<div class="mt-4">
						<h4 class="font-semibold">Scenario 1: Grammar & Vocabulary</h4>
						<p class="text-sm text-base-content/70">
							Tests grammar corrections (warning badges) and vocabulary improvements (hint badges).
							Shows multiple suggestions on a single message with different categories.
						</p>
						<div class="mt-2 rounded bg-base-200/50 p-2 text-xs">
							<strong>Example:</strong> "I goes to the store yesterday and buy some foods." → "I went
							to the store yesterday and bought some food."
						</div>
					</div>
				{:else if selectedScenario === 'scenario2'}
					<div class="mt-4">
						<h4 class="font-semibold">Scenario 2: Pronunciation & Fluency</h4>
						<p class="text-sm text-base-content/70">
							Tests pronunciation tips (info badges) and fluency suggestions (hint badges) for
							Spanish conversation. Demonstrates different language learning aspects.
						</p>
					</div>
				{:else if selectedScenario === 'scenario3'}
					<div class="mt-4">
						<h4 class="font-semibold">Scenario 3: Mixed Severity</h4>
						<p class="text-sm text-base-content/70">
							Shows multiple messages with various suggestion types and severities. Tests the full
							range of badge colors and suggestion categories.
						</p>
					</div>
				{/if}
			</div>
		</div>

		<!-- Preview Component -->
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h3 class="card-title">Preview</h3>
				<div class="mt-4">
					<UnifiedConversationBubble
						messages={currentMessages()}
						suggestions={currentSuggestions()}
						{showSuggestions}
					/>
				</div>
			</div>
		</div>

		<!-- Badge Reference -->
		<div class="card mt-6 bg-base-100 shadow-xl">
			<div class="card-body">
				<h3 class="card-title">Badge Reference</h3>
				<div class="flex flex-wrap gap-2">
					<div class="badge badge-info">info</div>
					<div class="badge badge-success">hint</div>
					<div class="badge badge-warning">warning</div>
					<div class="badge badge-neutral">other</div>
				</div>
			</div>
		</div>

		<!-- Navigation -->
		<div class="mt-6 flex justify-center">
			<a href="/dev" class="btn btn-outline">← Back to Dev Tools</a>
		</div>
	</div>
</div>
