<script lang="ts">
	/**
	 * WeekSection - Collapsible week section in preview
	 *
	 * Shows a week of the learning path with expand/collapse
	 */

	import type { DayScheduleEntry } from '$lib/server/db/schema/learning-paths';
	import type { Snippet } from 'svelte';

	interface Props {
		weekNumber: number;
		days: DayScheduleEntry[];
		expanded?: boolean;
		children?: Snippet;
	}

	let { weekNumber, days, expanded = false, children }: Props = $props();

	let isExpanded = $state(expanded);

	function toggleExpand() {
		isExpanded = !isExpanded;
	}

	const weekTheme = $derived.by(() => {
		// Group common themes from the week
		const themes = days.map((d) => d.theme).slice(0, 3);
		return themes.join(', ');
	});
</script>

<div class="week-section mb-4">
	<button
		type="button"
		class="w-full flex items-center justify-between p-4 bg-base-200 rounded-lg hover:bg-base-300 transition-colors"
		onclick={toggleExpand}
	>
		<div class="text-left">
			<h3 class="font-semibold text-lg">Week {weekNumber}</h3>
			<p class="text-sm text-base-content/70">{weekTheme}{days.length > 3 ? ', ...' : ''}</p>
		</div>
		<div class="flex items-center gap-2">
			<span class="badge badge-neutral badge-sm">{days.length} days</span>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5 transition-transform"
				class:rotate-180={isExpanded}
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
			</svg>
		</div>
	</button>

	{#if isExpanded}
		<div class="mt-3 space-y-3 pl-4">
			{@render children?.()}
		</div>
	{/if}
</div>

<style>
	.rotate-180 {
		transform: rotate(180deg);
	}
</style>
