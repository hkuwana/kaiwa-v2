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

	let _isHovering = $state(false);
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
			console.error('Failed to save scenario. Please try again.');
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
			console.error('Failed to rate scenario. Please try again.');
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
		<span
			class="{iconSizeClasses[size]} {isSaved
				? 'icon-[mdi--bookmark] text-error'
				: 'icon-[mdi--bookmark-outline]'}"
		></span>
		<span class="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
	</button>

	<!-- Rating Stars -->
	<div
		class="flex gap-0.5"
		onmouseenter={() => (_isHovering = true)}
		onmouseleave={() => (_isHovering = false)}
	>
		{#each [1, 2, 3, 4, 5] as starRating (starRating)}
			<button
				class="btn btn-ghost {buttonSizeClasses[size]} px-1 transition-transform hover:scale-110"
				onclick={() => rateScenario(starRating)}
				onmouseenter={() => (hoverRating = starRating)}
				onmouseleave={() => (hoverRating = null)}
				disabled={isSaving || isLoading}
				title="Rate {starRating} star{starRating !== 1 ? 's' : ''}"
				aria-label="Rate {starRating} star{starRating !== 1 ? 's' : ''}"
			>
				<span
					class="{iconSizeClasses[size]} icon-[mdi--star] {getStarColor(
						starRating
					)} transition-colors"
				></span>
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
		<span class="animate-pulse text-xs opacity-50">Saving...</span>
	{/if}
</div>

<style>
	:global(.btn) {
		min-height: auto;
	}
</style>
