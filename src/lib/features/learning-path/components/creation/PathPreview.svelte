<script lang="ts">
	/**
	 * PathPreview - Complete preview of generated learning path
	 *
	 * Shows:
	 * - Title and description
	 * - Week 1 expanded with full scenario previews
	 * - Weeks 2-4 collapsed (expandable)
	 * - Adjust/refine controls
	 * - Start learning CTA
	 */

	import type { PreviewSession } from '$lib/features/learning-path/services/PreviewGeneratorService.server';
	import WeekSection from './WeekSection.svelte';
	import DayDetail from './DayDetail.svelte';

	interface Props {
		preview: PreviewSession;
		onStart: () => void;
		onBack: () => void;
		onRefine?: (prompt: string) => void;
		onRegenerate?: (dayNumber: number) => void;
		regeneratingDay?: number | null;
	}

	let { preview, onStart, onBack, onRefine, onRegenerate, regeneratingDay = null }: Props = $props();

	let showRefinement = $state(false);
	let refinementPrompt = $state('');

	// Group schedule by weeks
	const weeklySchedule = $derived.by(() => {
		const weeks: Array<{ number: number; days: typeof preview.schedule }> = [];
		for (let i = 0; i < 4; i++) {
			const weekDays = preview.schedule.filter(
				(day) => day.dayIndex > i * 7 && day.dayIndex <= (i + 1) * 7
			);
			if (weekDays.length > 0) {
				weeks.push({ number: i + 1, days: weekDays });
			}
		}
		return weeks;
	});

	function handleRefine() {
		if (refinementPrompt.trim() && onRefine) {
			onRefine(refinementPrompt.trim());
			showRefinement = false;
			refinementPrompt = '';
		}
	}

	const refinementSuggestions = [
		'Make it more conversational and casual',
		'Focus more on business vocabulary',
		'Slower pace, add more beginner content',
		'Add more cultural context to scenarios'
	];
</script>

<div class="preview-container max-w-5xl mx-auto">
	<!-- Header with back button -->
	<div class="mb-6 flex items-center justify-between">
		<button type="button" class="btn btn-ghost btn-sm gap-2" onclick={onBack}>
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
					d="M10 19l-7-7m0 0l7-7m-7 7h18"
				/>
			</svg>
			Start Over
		</button>

		{#if onRefine}
			<button
				type="button"
				class="btn btn-outline btn-sm gap-2"
				onclick={() => (showRefinement = !showRefinement)}
			>
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
						d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
					/>
				</svg>
				Adjust Journey
			</button>
		{/if}
	</div>

	<!-- Refinement Panel -->
	{#if showRefinement}
		<div class="card bg-base-200 mb-6">
			<div class="card-body">
				<h3 class="card-title text-lg">Adjust Your Journey</h3>
				<p class="text-sm text-base-content/70">
					Describe how you'd like to modify this learning path
				</p>

				<textarea
					bind:value={refinementPrompt}
					placeholder="e.g., Make week 1 more casual and beginner-friendly"
					class="textarea textarea-bordered w-full"
					rows="3"
				></textarea>

				<div class="flex flex-wrap gap-2 mb-3">
					<p class="text-xs text-base-content/60 w-full">Quick suggestions:</p>
					{#each refinementSuggestions as suggestion}
						<button
							type="button"
							class="btn btn-xs btn-outline"
							onclick={() => (refinementPrompt = suggestion)}
						>
							{suggestion}
						</button>
					{/each}
				</div>

				<div class="card-actions justify-end">
					<button
						type="button"
						class="btn btn-ghost btn-sm"
						onclick={() => {
							showRefinement = false;
							refinementPrompt = '';
						}}
					>
						Cancel
					</button>
					<button
						type="button"
						class="btn btn-primary btn-sm"
						onclick={handleRefine}
						disabled={!refinementPrompt.trim()}
					>
						Refine Journey
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Preview Header -->
	<div class="text-center mb-8">
		<h1 class="text-3xl font-bold mb-3">{preview.title}</h1>
		<p class="text-lg text-base-content/80 max-w-2xl mx-auto">{preview.description}</p>
		<div class="flex gap-2 justify-center mt-4">
			<span class="badge badge-lg badge-primary">
				{preview.targetLanguage.toUpperCase()}
			</span>
			<span class="badge badge-lg badge-outline">{preview.schedule.length} Days</span>
		</div>
	</div>

	<!-- Weekly Schedule -->
	<div class="space-y-4 mb-8">
		{#each weeklySchedule as week, index}
			<WeekSection weekNumber={week.number} days={week.days} expanded={index === 0}>
				{#each week.days as day}
					<DayDetail
						{day}
						scenario={preview.scenarios[day.dayIndex.toString()]}
						onRegenerate={onRegenerate
							? () => onRegenerate(day.dayIndex)
							: undefined}
						isRegenerating={regeneratingDay === day.dayIndex}
					/>
				{/each}
			</WeekSection>
		{/each}
	</div>

	<!-- CTA Footer -->
	<div class="sticky bottom-0 bg-base-100 border-t border-base-300 p-4 -mx-4">
		<div class="flex gap-3 justify-center max-w-2xl mx-auto">
			<button type="button" class="btn btn-outline" onclick={onBack}>
				← Start Over
			</button>
			<button type="button" class="btn btn-primary btn-lg flex-1" onclick={onStart}>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
					/>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				Start Your First Lesson
			</button>
		</div>
	</div>
</div>

<style>
	.preview-container {
		animation: fadeIn 0.3s ease-in;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
