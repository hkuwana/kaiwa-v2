<script lang="ts">
	/**
	 * DayDetail - Individual day in the preview
	 *
	 * Shows day theme and scenario preview if available
	 */

	import type { DayScheduleEntry } from '$lib/server/db/schema/learning-paths';
	import type { ScenarioPreview } from '$lib/server/db/schema/learning-path-previews';
	import ScenarioPreviewCard from './ScenarioPreviewCard.svelte';

	interface Props {
		day: DayScheduleEntry;
		scenario?: ScenarioPreview;
		onRegenerate?: () => void;
		isRegenerating?: boolean;
	}

	let { day, scenario, onRegenerate, isRegenerating = false }: Props = $props();
</script>

<div class="day-detail">
	{#if scenario}
		<!-- Full scenario preview -->
		<ScenarioPreviewCard
			{scenario}
			dayNumber={day.dayIndex}
			{onRegenerate}
			{isRegenerating}
		/>
	{:else}
		<!-- Just the day info (for days without preview scenarios) -->
		<div class="card bg-base-100 border border-base-300">
			<div class="card-body p-4">
				<div class="flex items-center gap-2">
					<span class="badge badge-sm badge-ghost">Day {day.dayIndex}</span>
					<h4 class="font-medium">{day.theme}</h4>
				</div>
				{#if day.description}
					<p class="text-sm text-base-content/70">{day.description}</p>
				{/if}
				<p class="text-xs text-base-content/50">
					Difficulty: {day.difficulty}
				</p>
			</div>
		</div>
	{/if}
</div>
