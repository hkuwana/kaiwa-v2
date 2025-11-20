<script lang="ts">
	interface ConfidenceData {
		currentScore: number;
		previousScore?: number;
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
					<span class="icon-[mdi--star] h-6 w-6 {colors.icon}"></span>
				{:else if confidenceData.level === 'medium'}
					<span class="icon-[mdi--account] h-6 w-6 {colors.icon}"></span>
				{:else}
					<span class="icon-[mdi--arrow-right] h-6 w-6 {colors.icon}"></span>
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
					<span class="icon-[mdi--arrow-up] h-5 w-5 text-success"></span>
					<span class="font-medium text-success">+{confidenceChange}</span>
				{:else if confidenceChange < 0}
					<span class="icon-[mdi--arrow-down] h-5 w-5 text-warning"></span>
					<span class="font-medium text-warning">{confidenceChange}</span>
				{:else}
					<span class="icon-[mdi--minus] h-5 w-5 text-base-content/60"></span>
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
		<span
			class="icon-[mdi--chevron-down] h-4 w-4 transition-transform"
			class:rotate-180={showDetails}
		></span>
	</button>

	{#if showDetails}
		<div class="space-y-4">
			<!-- Confidence indicators -->
			<div>
				<h4 class="font-medium {colors.text} mb-2 flex items-center gap-2">
					<span class="icon-[mdi--information] h-4 w-4"></span>
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
					<span class="icon-[mdi--star] h-4 w-4"></span>
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
									<span class="icon-[mdi--check] h-3 w-3 text-white"></span>
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
					<span class="icon-[mdi--arrow-right] h-4 w-4"></span>
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
