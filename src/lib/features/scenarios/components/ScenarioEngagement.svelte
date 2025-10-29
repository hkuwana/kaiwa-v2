<!-- src/lib/features/scenarios/components/ScenarioEngagement.svelte -->
<script lang="ts">
	import type { Scenario } from '$lib/server/db/types';

	interface Props {
		scenario: Scenario;
		isSaved?: boolean;
		userRating?: number | null;
		onSaveChange?: (isSaved: boolean) => void;
		onRatingChange?: (rating: number) => void;
		isLoading?: boolean;
		size?: 'sm' | 'md' | 'lg';
	}

	const {
		scenario,
		isSaved = false,
		userRating = null,
		onSaveChange,
		onRatingChange,
		isLoading = false,
		size = 'md'
	}: Props = $props();

	let isHovering = $state(false);
	let hoverRating = $state<number | null>(null);
	let isSaving = $state(false);

	const sizeClasses = {
		sm: 'text-xs gap-1',
		md: 'text-sm gap-2',
		lg: 'text-base gap-3'
	};

	const buttonSizeClasses = {
		sm: 'btn-sm',
		md: 'btn-md',
		lg: 'btn-lg'
	};

	const iconSizeClasses = {
		sm: 'h-4 w-4',
		md: 'h-5 w-5',
		lg: 'h-6 w-6'
	};

	async function toggleSave() {
		if (isSaving) return;

		isSaving = true;
		try {
			const url = `/api/scenarios/${scenario.id}/save`;
			const response = await fetch(url, {
				method: isSaved ? 'DELETE' : 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) {
				throw new Error('Failed to update save status');
			}

			const data = await response.json();
			const newSavedState = data.data?.isSaved ?? !isSaved;

			if (onSaveChange) {
				onSaveChange(newSavedState);
			}
		} catch (error) {
			console.error('Error saving scenario:', error);
			alert('Failed to save scenario. Please try again.');
		} finally {
			isSaving = false;
		}
	}

	async function rateScenario(rating: number) {
		if (isLoading || isSaving) return;

		isSaving = true;
		try {
			const response = await fetch(`/api/scenarios/${scenario.id}/rate`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ rating })
			});

			if (!response.ok) {
				throw new Error('Failed to rate scenario');
			}

			const data = await response.json();
			const newRating = data.data?.userRating ?? rating;

			if (onRatingChange) {
				onRatingChange(newRating);
			}
		} catch (error) {
			console.error('Error rating scenario:', error);
			alert('Failed to rate scenario. Please try again.');
		} finally {
			isSaving = false;
		}
	}

	function getStarColor(starRating: number): string {
		const displayRating = hoverRating ?? userRating;

		if (!displayRating) {
			return 'text-neutral-300';
		}

		if (starRating <= displayRating) {
			return 'text-yellow-400';
		}

		return 'text-neutral-300';
	}
</script>

<div class="flex items-center {sizeClasses[size]}">
	<!-- Save Button -->
	<button
		class="btn btn-ghost {buttonSizeClasses[size]} px-2"
		onclick={toggleSave}
		disabled={isSaving || isLoading}
		title={isSaved ? 'Unsave this scenario' : 'Save this scenario'}
		aria-label={isSaved ? 'Unsave scenario' : 'Save scenario'}
	>
		<svg
			class="{iconSizeClasses[size]} {isSaved ? 'fill-current text-error' : ''}"
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
		>
			{#if isSaved}
				<path d="M5 21h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z" />
			{:else}
				<path
					d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2zm-2-18H7v10l5-3 5 3V3z"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				/>
			{/if}
		</svg>
		<span class="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
	</button>

	<!-- Rating Stars -->
	<div class="flex gap-0.5" onmouseenter={() => (isHovering = true)} onmouseleave={() => (isHovering = false)}>
		{#each [1, 2, 3, 4, 5] as starRating (starRating)}
			<button
				class="btn btn-ghost {buttonSizeClasses[size]} px-1 hover:scale-110 transition-transform"
				onclick={() => rateScenario(starRating)}
				onmouseenter={() => (hoverRating = starRating)}
				onmouseleave={() => (hoverRating = null)}
				disabled={isSaving || isLoading}
				title="Rate {starRating} star{starRating !== 1 ? 's' : ''}"
				aria-label="Rate {starRating} star{starRating !== 1 ? 's' : ''}"
			>
				<svg
					class="{iconSizeClasses[size]} {getStarColor(starRating)} transition-colors"
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
				>
					<path
						d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
						fill="currentColor"
					/>
				</svg>
			</button>
		{/each}
	</div>

	<!-- Rating Display Text -->
	{#if userRating}
		<span class="text-xs opacity-70">
			{userRating}
			<span class="hidden sm:inline">/ 5</span>
		</span>
	{/if}

	<!-- Loading State -->
	{#if isSaving}
		<span class="text-xs opacity-50 animate-pulse">Saving...</span>
	{/if}
</div>

<style>
	:global(.btn) {
		min-height: auto;
	}
</style>
