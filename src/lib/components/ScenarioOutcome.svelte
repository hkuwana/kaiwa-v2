<!-- 🎯 Scenario Outcome Component -->
<!-- Displays learning results and feedback after completing a scenario -->

<script lang="ts">
	import type { LearningScenario, ScenarioOutcome } from '$lib/kernel/learning';

	// Props
	export let scenario: LearningScenario;
	export let outcome: ScenarioOutcome;
	export let onRetry: () => void;
	export let onNextScenario: () => void;
	export let onBackToScenarios: () => void;

	// Derived state
	let overallScore = $derived(
		(outcome.vocabularyUsageScore * 0.4 +
			outcome.grammarUsageScore * 0.3 +
			outcome.goalCompletionScore * 0.2 +
			outcome.pronunciationScore * 0.1)
	);
	let performanceLevel = $derived(getPerformanceLevel(overallScore));
	let showCelebration = $derived(overallScore >= 0.8);

	// Functions
	function getPerformanceLevel(score: number): string {
		if (score >= 0.9) return 'Exceptional';
		if (score >= 0.8) return 'Excellent';
		if (score >= 0.7) return 'Good';
		if (score >= 0.6) return 'Fair';
		if (score >= 0.5) return 'Needs Improvement';
		return 'Requires Practice';
	}

	function getScoreColor(score: number): string {
		if (score >= 0.8) return 'text-green-600';
		if (score >= 0.6) return 'text-yellow-600';
		return 'text-red-600';
	}

	function getScoreBackground(score: number): string {
		if (score >= 0.8) return 'bg-green-100';
		if (score >= 0.6) return 'bg-yellow-100';
		return 'bg-red-100';
	}

	function getPerformanceEmoji(score: number): string {
		if (score >= 0.9) return '🏆';
		if (score >= 0.8) return '🎉';
		if (score >= 0.7) return '👍';
		if (score >= 0.6) return '😊';
		if (score >= 0.5) return '🤔';
		return '📚';
	}

	function formatDuration(seconds: number): string {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
	}
</script>

<div
	class="scenario-outcome mx-auto max-w-4xl rounded-xl border border-gray-200 bg-white p-8 shadow-lg"
>
	<!-- Header with Celebration -->
	<div class="header mb-8 text-center">
		{#if showCelebration}
			<div class="celebration mb-4">
				<div class="mb-4 text-6xl">🎉</div>
				<h2 class="mb-2 text-3xl font-bold text-green-600">Scenario Complete!</h2>
				<p class="text-lg text-green-700">Congratulations on finishing {scenario.title}!</p>
			</div>
		{:else}
			<div class="completion mb-4">
				<div class="mb-4 text-5xl">{getPerformanceEmoji(overallScore)}</div>
				<h2 class="mb-2 text-3xl font-bold text-gray-800">Scenario Complete</h2>
				<p class="text-lg text-gray-600">You've finished {scenario.title}</p>
			</div>
		{/if}
	</div>

	<!-- Performance Overview -->
	<div class="performance-overview mb-8">
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
			<!-- Overall Score -->
			<div
				class="overall-score rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-6"
			>
				<div class="text-center">
					<div class="mb-2 text-4xl font-bold text-blue-600">
						{Math.round(overallScore * 100)}%
					</div>
					<div class="mb-2 text-lg font-medium text-blue-700">
						{performanceLevel}
					</div>
					<div class="text-sm text-blue-600">Overall Performance</div>
				</div>
			</div>

			<!-- Goal Achievement -->
			<div
				class="goal-achievement rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-green-100 p-6"
			>
				<div class="text-center">
					<div class="mb-2 text-4xl">
						{outcome.wasGoalAchieved ? '🎯' : '⏳'}
					</div>
					<div class="mb-2 text-lg font-medium text-green-700">
						{outcome.wasGoalAchieved ? 'Goal Achieved!' : 'Goal In Progress'}
					</div>
					<div class="text-sm text-green-600">
						{Math.round(outcome.goalCompletionScore * 100)}% Complete
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Detailed Scores -->
	<div class="detailed-scores mb-8">
		<h3 class="mb-4 text-xl font-semibold text-gray-800">Detailed Assessment</h3>
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
			<!-- Vocabulary Score -->
			<div
				class="score-card {getScoreBackground(outcome.vocabularyUsageScore)} rounded-lg border p-4"
			>
				<div class="text-center">
					<div class="text-2xl font-bold {getScoreColor(outcome.vocabularyUsageScore)} mb-1">
						{Math.round(outcome.vocabularyUsageScore * 100)}%
					</div>
					<div class="mb-2 text-sm font-medium text-gray-700">Vocabulary</div>
					<div class="text-xs text-gray-600">
						{outcome.usedTargetVocabulary.length} / {scenario.targetVocabulary.length} words used
					</div>
				</div>
			</div>

			<!-- Grammar Score -->
			<div class="score-card {getScoreBackground(outcome.grammarUsageScore)} rounded-lg border p-4">
				<div class="text-center">
					<div class="text-2xl font-bold {getScoreColor(outcome.grammarUsageScore)} mb-1">
						{Math.round(outcome.grammarUsageScore * 100)}%
					</div>
					<div class="mb-2 text-sm font-medium text-gray-700">Grammar</div>
					<div class="text-xs text-gray-600">
						{scenario.targetGrammar || 'Not specified'}
					</div>
				</div>
			</div>

			<!-- Goal Completion Score -->
			<div
				class="score-card {getScoreBackground(outcome.goalCompletionScore)} rounded-lg border p-4"
			>
				<div class="text-center">
					<div class="text-2xl font-bold {getScoreColor(outcome.goalCompletionScore)} mb-1">
						{Math.round(outcome.goalCompletionScore * 100)}%
					</div>
					<div class="mb-2 text-sm font-medium text-gray-700">Goal Completion</div>
					<div class="text-xs text-gray-600">
						{outcome.wasGoalAchieved ? 'Completed' : 'In Progress'}
					</div>
				</div>
			</div>

			<!-- Session Stats -->
			<div class="score-card rounded-lg border border-gray-200 bg-gray-50 p-4">
				<div class="text-center">
					<div class="mb-1 text-2xl font-bold text-gray-600">
						{formatDuration(outcome.durationSeconds)}
					</div>
					<div class="mb-2 text-sm font-medium text-gray-700">Duration</div>
					<div class="text-xs text-gray-600">
						{outcome.exchangeCount} exchanges
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Vocabulary Analysis -->
	<div class="vocabulary-analysis mb-8">
		<h3 class="mb-4 text-xl font-semibold text-gray-800">Vocabulary Usage</h3>
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
			<!-- Used Vocabulary -->
			<div class="used-vocabulary">
				<h4 class="mb-3 text-lg font-medium text-green-700">✅ Words You Used</h4>
				<div class="flex flex-wrap gap-2">
					{#each outcome.usedTargetVocabulary as word}
						<span class="rounded-lg bg-green-100 px-3 py-2 text-sm font-medium text-green-800">
							{word}
						</span>
					{/each}
					{#if outcome.usedTargetVocabulary.length === 0}
						<span class="text-sm text-gray-400">No target vocabulary used</span>
					{/if}
				</div>
			</div>

			<!-- Missed Vocabulary -->
			<div class="missed-vocabulary">
				<h4 class="mb-3 text-lg font-medium text-orange-700">📚 Words to Practice</h4>
				<div class="flex flex-wrap gap-2">
					{#each outcome.missedTargetVocabulary as word}
						<span class="rounded-lg bg-orange-100 px-3 py-2 text-sm font-medium text-orange-800">
							{word}
						</span>
					{/each}
					{#if outcome.missedTargetVocabulary.length === 0}
						<span class="text-sm text-green-600">All vocabulary mastered! 🎉</span>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- AI Feedback -->
	<div class="ai-feedback mb-8">
		<h3 class="mb-4 text-xl font-semibold text-gray-800">AI Feedback</h3>
		<div class="rounded-lg border border-blue-200 bg-blue-50 p-6">
			<div class="flex items-start space-x-3">
				<div class="text-2xl">🤖</div>
				<div class="flex-1">
					<p class="mb-4 leading-relaxed text-gray-800">{outcome.aiFeedback}</p>

					{#if outcome.suggestions.length > 0}
						<div class="suggestions">
							<h4 class="mb-2 font-medium text-gray-700">Improvement Suggestions:</h4>
							<ul class="space-y-2">
								{#each outcome.suggestions as suggestion}
									<li class="flex items-start space-x-2 text-sm text-gray-700">
										<span class="mt-1 text-blue-500">💡</span>
										<span>{suggestion}</span>
									</li>
								{/each}
							</ul>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- Action Buttons -->
	<div class="action-buttons space-y-4 text-center">
		<div class="flex flex-col justify-center gap-4 sm:flex-row">
			<button
				class="rounded-lg bg-blue-500 px-8 py-3 font-medium text-white transition-colors hover:bg-blue-600"
				onclick={onRetry}
			>
				🔄 Practice Again
			</button>

			<button
				class="rounded-lg bg-green-500 px-8 py-3 font-medium text-white transition-colors hover:bg-green-600"
				onclick={onNextScenario}
			>
				➡️ Next Scenario
			</button>

			<button
				class="rounded-lg bg-gray-500 px-8 py-3 font-medium text-white transition-colors hover:bg-gray-600"
				onclick={onBackToScenarios}
			>
				📚 Choose Another
			</button>
		</div>

		<p class="text-sm text-gray-500">Keep practicing to improve your skills!</p>
	</div>

	<!-- Session Summary -->
	<div class="session-summary mt-8 border-t border-gray-200 pt-6">
		<h3 class="mb-3 text-lg font-medium text-gray-700">Session Summary</h3>
		<div class="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
			<div class="text-center">
				<div class="font-medium text-gray-600">Duration</div>
				<div class="text-gray-800">{formatDuration(outcome.durationSeconds)}</div>
			</div>
			<div class="text-center">
				<div class="font-medium text-gray-600">Exchanges</div>
				<div class="text-gray-800">{outcome.exchangeCount}</div>
			</div>
			<div class="text-center">
				<div class="font-medium text-gray-600">Vocabulary Used</div>
				<div class="text-gray-800">
					{outcome.usedTargetVocabulary.length}/{scenario.targetVocabulary.length}
				</div>
			</div>
			<div class="text-center">
				<div class="font-medium text-gray-600">Overall Score</div>
				<div class="text-gray-800">{Math.round(overallScore * 100)}%</div>
			</div>
		</div>
	</div>
</div>

<style>
	.scenario-outcome {
		@apply mx-auto max-w-5xl;
	}

	.score-card {
		@apply transition-all duration-200;
	}

	.score-card:hover {
		@apply -translate-y-1 transform;
	}

	.celebration {
		@apply animate-bounce;
	}

	.used-vocabulary span,
	.missed-vocabulary span {
		@apply transition-all duration-200;
	}

	.used-vocabulary span:hover,
	.missed-vocabulary span:hover {
		@apply scale-105 transform;
	}
</style>
