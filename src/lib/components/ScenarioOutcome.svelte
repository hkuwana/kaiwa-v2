<!-- 🎯 Scenario Outcome Component -->
<!-- Displays learning results and feedback after completing a scenario -->

<script lang="ts">
	import type { Scenario, ScenarioOutcome } from '$lib/types';

	const { scenario, outcome, onRetry, onNextScenario, onBackToScenarios } = $props<{
		scenario: Scenario;
		outcome: ScenarioOutcome;
		onRetry: () => void;
		onNextScenario: () => void;
		onBackToScenarios: () => void;
	}>();

	// Derived state
	const overallScore = $derived(
		(outcome.vocabularyUsageScore ?? 0) * 0.4 +
			(outcome.grammarUsageScore ?? 0) * 0.3 +
			(outcome.goalCompletionScore ?? 0) * 0.2 +
			(outcome.pronunciationScore ?? 0) * 0.1
	);
	const performanceLevel = $derived(getPerformanceLevel(overallScore));
	const showCelebration = $derived(overallScore >= 0.8);

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

			<!-- Session Info -->
			<div class="session-info rounded-xl border border-gray-200 bg-gray-50 p-6">
				<div class="space-y-3">
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium text-gray-600">Duration:</span>
						<span class="text-sm font-medium text-gray-800">
							{formatDuration(outcome.duration)}
						</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium text-gray-600">Completed:</span>
						<span class="text-sm font-medium text-gray-800">
							{outcome.completedAt.toLocaleDateString()}
						</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium text-gray-600">Difficulty:</span>
						<span class="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
							{scenario.difficulty}
						</span>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Detailed Scores -->
	<div class="detailed-scores mb-8">
		<h3 class="mb-4 text-xl font-semibold text-gray-800">Performance Breakdown</h3>
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
			<!-- Vocabulary Score -->
			<div class="score-card rounded-lg border border-gray-200 bg-white p-4">
				<div class="mb-2 text-center">
					<div class="text-2xl font-bold {getScoreColor(outcome.vocabularyUsageScore ?? 0)}">
						{Math.round((outcome.vocabularyUsageScore ?? 0) * 100)}%
					</div>
					<div class="text-sm font-medium text-gray-700">Vocabulary</div>
				</div>
				<div class="h-2 w-full rounded-full bg-gray-200">
					<div
						class="h-2 rounded-full transition-all duration-300 {getScoreBackground(
							outcome.vocabularyUsageScore ?? 0
						)}"
						style="width: {(outcome.vocabularyUsageScore ?? 0) * 100}%"
					></div>
				</div>
			</div>

			<!-- Grammar Score -->
			<div class="score-card rounded-lg border border-gray-200 bg-white p-4">
				<div class="mb-2 text-center">
					<div class="text-2xl font-bold {getScoreColor(outcome.grammarUsageScore ?? 0)}">
						{Math.round((outcome.grammarUsageScore ?? 0) * 100)}%
					</div>
					<div class="text-sm font-medium text-gray-700">Grammar</div>
				</div>
				<div class="h-2 w-full rounded-full bg-gray-200">
					<div
						class="h-2 rounded-full transition-all duration-300 {getScoreBackground(
							outcome.grammarUsageScore ?? 0
						)}"
						style="width: {(outcome.grammarUsageScore ?? 0) * 100}%"
					></div>
				</div>
			</div>

			<!-- Goal Completion Score -->
			<div class="score-card rounded-lg border border-gray-200 bg-white p-4">
				<div class="mb-2 text-center">
					<div class="text-2xl font-bold {getScoreColor(outcome.goalCompletionScore ?? 0)}">
						{Math.round((outcome.goalCompletionScore ?? 0) * 100)}%
					</div>
					<div class="text-sm font-medium text-gray-700">Goal Completion</div>
				</div>
				<div class="h-2 w-full rounded-full bg-gray-200">
					<div
						class="h-2 rounded-full transition-all duration-300 {getScoreBackground(
							outcome.goalCompletionScore ?? 0
						)}"
						style="width: {(outcome.goalCompletionScore ?? 0) * 100}%"
					></div>
				</div>
			</div>

			<!-- Pronunciation Score -->
			<div class="score-card rounded-lg border border-gray-200 bg-white p-4">
				<div class="mb-2 text-center">
					<div class="text-2xl font-bold {getScoreColor(outcome.pronunciationScore ?? 0)}">
						{Math.round((outcome.pronunciationScore ?? 0) * 100)}%
					</div>
					<div class="text-sm font-medium text-gray-700">Pronunciation</div>
				</div>
				<div class="h-2 w-full rounded-full bg-gray-200">
					<div
						class="h-2 rounded-full transition-all duration-300 {getScoreBackground(
							outcome.pronunciationScore ?? 0
						)}"
						style="width: {(outcome.pronunciationScore ?? 0) * 100}%"
					></div>
				</div>
			</div>
		</div>
	</div>

	<!-- Learning Summary -->
	<div class="learning-summary mb-8">
		<h3 class="mb-4 text-xl font-semibold text-gray-800">What You Learned</h3>
		<div class="rounded-lg border border-gray-200 bg-gray-50 p-6">
			<div class="mb-4">
				<h4 class="mb-2 font-medium text-gray-700">Scenario Context:</h4>
				<p class="text-sm text-gray-600">{scenario.context}</p>
			</div>
			<div class="mb-4">
				<h4 class="mb-2 font-medium text-gray-700">Your Goal:</h4>
				<p class="text-sm text-gray-600">{scenario.instructions}</p>
			</div>
			{#if scenario.expectedOutcome}
				<div>
					<h4 class="mb-2 font-medium text-gray-700">Expected Outcome:</h4>
					<p class="text-sm text-gray-600">{scenario.expectedOutcome}</p>
				</div>
			{/if}
		</div>
	</div>

	<!-- Action Buttons -->
	<div class="action-buttons flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
		<button
			class="flex-1 rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
			onclick={onRetry}
		>
			🔄 Try Again
		</button>
		<button
			class="flex-1 rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
			onclick={onBackToScenarios}
		>
			📚 Choose Another Scenario
		</button>
		<button
			class="flex-1 rounded-lg bg-blue-500 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-600"
			onclick={onNextScenario}
		>
			🚀 Next Scenario
		</button>
	</div>
</div>

<style>
	.scenario-outcome {
		@apply transition-all duration-200;
	}

	.score-card {
		@apply transition-all duration-200;
	}

	.score-card:hover {
		@apply shadow-md;
	}

	.celebration {
		@apply animate-pulse;
	}
</style>
