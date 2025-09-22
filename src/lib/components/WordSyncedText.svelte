<script lang="ts">
	import type { SpeechTiming } from '$lib/server/db/types';

	const { text, timings, activeIndex } = $props<{
		text: string;
		timings?: SpeechTiming[];
		activeIndex?: number;
	}>();

	type Segment = { text: string; highlight: boolean; index: number };

	function getSegments(): Segment[] {
		return buildSegments(text, timings ?? [], activeIndex ?? -1);
	}

	function buildSegments(text: string, timings: SpeechTiming[], activeIndex: number): Segment[] {
		if (!text || !timings.length) {
			return [{ text, highlight: false, index: -1 }];
		}

		const result: Segment[] = [];
		let cursor = 0;

		timings.forEach((timing, index) => {
			const start = Math.max(0, Math.min(text.length, timing.charStart ?? cursor));
			const end = Math.max(start, Math.min(text.length, timing.charEnd ?? start));

			if (cursor < start) {
				result.push({ text: text.slice(cursor, start), highlight: false, index: -1 });
			}

			if (start < end) {
				result.push({
					text: text.slice(start, end),
					highlight: index === activeIndex,
					index
				});
			}

			cursor = end;
		});

		if (cursor < text.length) {
			result.push({ text: text.slice(cursor), highlight: false, index: -1 });
		}

		return result;
	}
</script>

<span class="word-synced" aria-live="polite">
	{#each getSegments() as segment}
		{#if segment.highlight}
			<span class="word-synced__segment word-synced__segment--active" data-token={segment.index}>
				{segment.text}
			</span>
		{:else}
			<span class="word-synced__segment">{segment.text}</span>
		{/if}
	{/each}
</span>

<style>
	.word-synced {
		display: inline;
	}

	.word-synced__segment {
		display: inline;
		transition:
			background-color 120ms ease,
			color 120ms ease;
	}

	.word-synced__segment--active {
		background-color: rgba(34, 197, 94, 0.25);
		color: inherit;
		border-radius: 0.25rem;
	}
</style>
