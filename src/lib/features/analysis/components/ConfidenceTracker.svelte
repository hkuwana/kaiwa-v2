<script lang="ts">
	interface ConfidenceData {
		currentScore: number;
		previousScore?: number;
		trend: 'increasing' | 'stable' | 'decreasing';
		level: 'low' | 'medium' | 'high';
		indicators: string[];
		milestones: Array<{
			name: string;
			achieved: boolean;
			description: string;
		}>;
		encouragement: string;
		nextSteps: string[];
	}

	interface Props {
		confidenceData: ConfidenceData;
		showDetails?: boolean;
	}

	let { confidenceData, showDetails = $bindable(false) }: Props = $props();

	// Calculate confidence change
	const confidenceChange = confidenceData.previousScore
		? confidenceData.currentScore - confidenceData.previousScore
		: 0;

	// Get appropriate color scheme based on level
	const getConfidenceColors = (level: string) => {
		switch (level) {
			case 'high':
				return {
					bg: 'bg-success/10',
					border: 'border-success/20',
					text: 'text-success-content',
					icon: 'text-success'
				};
			case 'medium':
				return {
					bg: 'bg-warning/10',
					border: 'border-warning/20',
					text: 'text-warning-content',
					icon: 'text-warning'
				};
			case 'low':
				return {
					bg: 'bg-info/10',
					border: 'border-info/20',
					text: 'text-info-content',
					icon: 'text-info'
				};
			default:
				return {
					bg: 'bg-base-200',
					border: 'border-base-300',
					text: 'text-base-content',
					icon: 'text-base-content'
				};
		}
	};

	const colors = getConfidenceColors(confidenceData.level);

	// Confidence level descriptions
	const levelDescriptions = {
		high: "You're speaking with great confidence! 🌟",
		medium: 'Building confidence steadily 💪',
		low: 'Taking brave first steps 🌱'
	};
</script>

<div class="confidence-tracker rounded-lg {colors.bg} {colors.border} border p-6">
	<!-- Header with confidence score and trend -->
	<div class="mb-4 flex items-center justify-between">
		<div class="flex items-center gap-3">
			<div class="rounded-full bg-white/20 p-2">
				{#if confidenceData.level === 'high'}
					<svg class="h-6 w-6 {colors.icon}" fill="currentColor" viewBox="0 0 20 20">
						<path
							d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
						></path>
					</svg>
				{:else if confidenceData.level === 'medium'}
					<svg class="h-6 w-6 {colors.icon}" fill="currentColor" viewBox="0 0 20 20">
						<path
							d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"
						></path>
					</svg>
				{:else}
					<svg class="h-6 w-6 {colors.icon}" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z"
							clip-rule="evenodd"
						></path>
					</svg>
				{/if}
			</div>
			<div>
				<h3 class="font-semibold {colors.text} text-lg">
					Confidence Level: {confidenceData.currentScore}%
				</h3>
				<p class="text-sm {colors.text} opacity-80">
					{levelDescriptions[confidenceData.level]}
				</p>
			</div>
		</div>

		<!-- Trend indicator -->
		{#if confidenceData.previousScore !== undefined}
			<div class="flex items-center gap-2">
				{#if confidenceChange > 0}
					<svg class="h-5 w-5 text-success" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z"
							clip-rule="evenodd"
						></path>
					</svg>
					<span class="font-medium text-success">+{confidenceChange}</span>
				{:else if confidenceChange < 0}
					<svg class="h-5 w-5 text-warning" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 112 0v11.586l2.293-2.293a1 1 0 011.414 0z"
							clip-rule="evenodd"
						></path>
					</svg>
					<span class="font-medium text-warning">{confidenceChange}</span>
				{:else}
					<svg class="h-5 w-5 text-base-content/60" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
							clip-rule="evenodd"
						></path>
					</svg>
					<span class="font-medium text-base-content/60">Stable</span>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Progress bar -->
	<div class="mb-4">
		<div class="flex justify-between text-sm {colors.text} mb-1 opacity-70">
			<span>Confidence Progress</span>
			<span>{confidenceData.currentScore}/100</span>
		</div>
		<div class="h-3 w-full rounded-full bg-white/20">
			<div
				class="h-3 rounded-full transition-all duration-500"
				class:bg-success={confidenceData.level === 'high'}
				class:bg-warning={confidenceData.level === 'medium'}
				class:bg-info={confidenceData.level === 'low'}
				style="width: {confidenceData.currentScore}%"
			></div>
		</div>
	</div>

	<!-- Encouragement message -->
	<div class="mb-4 rounded bg-white/10 p-3">
		<p class="text-sm {colors.text} font-medium">
			💬 {confidenceData.encouragement}
		</p>
	</div>

	<!-- Toggle details -->
	<button
		class="btn btn-ghost btn-sm {colors.text} mb-4"
		onclick={() => (showDetails = !showDetails)}
	>
		{showDetails ? 'Hide' : 'Show'} Details
		<svg
			class="h-4 w-4 transition-transform"
			class:rotate-180={showDetails}
			fill="currentColor"
			viewBox="0 0 20 20"
		>
			<path
				fill-rule="evenodd"
				d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
				clip-rule="evenodd"
			></path>
		</svg>
	</button>

	{#if showDetails}
		<div class="space-y-4">
			<!-- Confidence indicators -->
			<div>
				<h4 class="font-medium {colors.text} mb-2 flex items-center gap-2">
					<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a1 1 0 00-1 1v3a1 1 0 102 0v-3a1 1 0 00-1-1z"
							clip-rule="evenodd"
						></path>
					</svg>
					What we noticed about your confidence:
				</h4>
				<ul class="space-y-1">
					{#each confidenceData.indicators as indicator (indicator)}
						<li class="flex items-start gap-2 text-sm {colors.text} opacity-80">
							<span class="mt-0.5 text-success">✓</span>
							<span>{indicator}</span>
						</li>
					{/each}
				</ul>
			</div>

			<!-- Milestones -->
			<div>
				<h4 class="font-medium {colors.text} mb-2 flex items-center gap-2">
					<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
						<path
							d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
						></path>
					</svg>
					Confidence Milestones:
				</h4>
				<div class="grid gap-2">
					{#each confidenceData.milestones as milestone (milestone.name)}
						<div class="flex items-center gap-3 rounded bg-white/10 p-2">
							<div
								class="flex h-5 w-5 items-center justify-center rounded-full"
								class:bg-success={milestone.achieved}
								class:bg-base-300={!milestone.achieved}
							>
								{#if milestone.achieved}
									<svg class="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
										<path
											fill-rule="evenodd"
											d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
											clip-rule="evenodd"
										></path>
									</svg>
								{/if}
							</div>
							<div class="flex-1">
								<div
									class="text-sm font-medium {colors.text}"
									class:opacity-60={!milestone.achieved}
								>
									{milestone.name}
								</div>
								<div class="text-xs {colors.text} opacity-60">
									{milestone.description}
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Next steps -->
			<div>
				<h4 class="font-medium {colors.text} mb-2 flex items-center gap-2">
					<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
							clip-rule="evenodd"
						></path>
					</svg>
					Next steps to build confidence:
				</h4>
				<ul class="space-y-1">
					{#each confidenceData.nextSteps as step (step)}
						<li class="flex items-start gap-2 text-sm {colors.text} opacity-80">
							<span class="mt-0.5 text-primary">→</span>
							<span>{step}</span>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	{/if}
</div>

<style>
	.confidence-tracker {
		transition: all 0.3s ease;
	}

	.confidence-tracker:hover {
		transform: translateY(-1px);
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
	}
</style>
