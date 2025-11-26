<script lang="ts">
	/**
	 * ScenarioPreviewCard - Preview individual scenario in the learning path
	 *
	 * Shows:
	 * - Title and difficulty
	 * - Description
	 * - Sample dialogue
	 * - Learning objectives
	 * - Regenerate option
	 */

	import type { ScenarioPreview } from '$lib/server/db/schema/learning-path-previews';

	interface Props {
		scenario: ScenarioPreview;
		dayNumber: number;
		onRegenerate?: () => void;
		isRegenerating?: boolean;
	}

	let { scenario, dayNumber, onRegenerate, isRegenerating = false }: Props = $props();

	const difficultyColor = $derived.by(() => {
		const diff = scenario.difficulty?.toLowerCase() || 'beginner';
		if (diff.includes('beginner') || diff.includes('a1') || diff.includes('a2')) {
			return 'badge-success';
		}
		if (diff.includes('intermediate') || diff.includes('b1') || diff.includes('b2')) {
			return 'badge-warning';
		}
		return 'badge-error';
	});
</script>

<div class="card bg-base-100 shadow-md border border-base-300 hover:shadow-lg transition-shadow">
	<div class="card-body p-5">
		<!-- Header -->
		<div class="flex items-start justify-between gap-3 mb-3">
			<div class="flex-1">
				<div class="flex items-center gap-2 mb-1">
					<span class="badge badge-sm badge-primary">Day {dayNumber}</span>
					<span class="badge badge-sm {difficultyColor}">{scenario.difficulty}</span>
				</div>
				<h3 class="card-title text-lg">{scenario.title}</h3>
			</div>
		</div>

		<!-- Description -->
		<p class="text-sm text-base-content/80 mb-3">
			{scenario.description}
		</p>

		<!-- Sample Dialogue -->
		{#if scenario.sampleDialogue?.ai}
			<div class="bg-base-200 rounded-lg p-3 mb-3">
				<p class="text-xs text-base-content/60 mb-2">Sample dialogue:</p>
				<div class="space-y-2">
					<div class="flex gap-2">
						<div class="badge badge-sm badge-neutral">AI</div>
						<p class="text-sm flex-1">{scenario.sampleDialogue.ai}</p>
					</div>
					{#if scenario.sampleDialogue.user}
						<div class="flex gap-2">
							<div class="badge badge-sm badge-primary">You</div>
							<p class="text-sm flex-1 italic text-base-content/70">
								{scenario.sampleDialogue.user}
							</p>
						</div>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Learning Objectives -->
		{#if scenario.objectives && scenario.objectives.length > 0}
			<div class="mb-3">
				<p class="text-xs text-base-content/60 mb-2">You'll learn:</p>
				<div class="flex flex-wrap gap-1">
					{#each scenario.objectives.slice(0, 3) as objective}
						<span class="badge badge-sm badge-outline">{objective}</span>
					{/each}
					{#if scenario.objectives.length > 3}
						<span class="badge badge-sm badge-ghost">
							+{scenario.objectives.length - 3} more
						</span>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Actions -->
		{#if onRegenerate}
			<div class="card-actions justify-end mt-2 pt-3 border-t border-base-300">
				<button
					type="button"
					class="btn btn-sm btn-ghost gap-2"
					onclick={onRegenerate}
					disabled={isRegenerating}
				>
					{#if isRegenerating}
						<span class="loading loading-spinner loading-xs"></span>
						Regenerating...
					{:else}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
							/>
						</svg>
						Try different scenario
					{/if}
				</button>
			</div>
		{/if}
	</div>
</div>
