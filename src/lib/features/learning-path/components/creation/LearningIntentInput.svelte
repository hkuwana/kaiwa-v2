<script lang="ts">
	/**
	 * LearningIntentInput - The hero input for creating learning paths
	 *
	 * The main entry point for inline learning path creation.
	 * Captures user intent in natural language and triggers preview generation.
	 */

	interface Props {
		onGenerate: (intent: string) => void;
		loading?: boolean;
		disabled?: boolean;
	}

	let { onGenerate, loading = false, disabled = false }: Props = $props();

	let intent = $state('');
	let showSuggestions = $state(true);

	const suggestions = [
		'Learn Spanish for travel',
		'Business Japanese for professionals',
		'French conversation practice',
		'Korean for K-drama fans',
		'Italian for cooking and dining',
		'German for business meetings'
	];

	function handleSubmit() {
		const trimmedIntent = intent.trim();
		if (trimmedIntent.length >= 5 && !loading) {
			onGenerate(trimmedIntent);
			showSuggestions = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
		}
	}

	function selectSuggestion(suggestion: string) {
		intent = suggestion;
		showSuggestions = false;
		onGenerate(suggestion);
	}
</script>

<div class="intent-input-container">
	<!-- Hero Section -->
	<div class="mb-6 text-center">
		<h2 class="text-2xl font-bold mb-2">What would you like to learn?</h2>
		<p class="text-base-content/70">
			Tell us your goal and we'll create a personalized 30-day learning journey
		</p>
	</div>

	<!-- Input Area -->
	<div class="relative">
		<div class="form-control">
			<input
				type="text"
				bind:value={intent}
				onkeydown={handleKeydown}
				onfocus={() => {
					if (!intent) showSuggestions = true;
				}}
				placeholder="e.g., Learn Japanese for business meetings"
				class="input input-bordered input-lg w-full text-center text-lg"
				class:input-disabled={disabled}
				disabled={disabled || loading}
			/>
		</div>

		{#if loading}
			<div class="mt-6 flex flex-col items-center gap-4">
				<span class="loading loading-spinner loading-lg text-primary"></span>
				<div class="text-center">
					<p class="font-medium">Creating your personalized journey...</p>
					<p class="text-sm text-base-content/60 mt-1">
						Generating syllabus and preview scenarios (~10 seconds)
					</p>
				</div>
			</div>
		{/if}
	</div>

	<!-- Suggestions -->
	{#if showSuggestions && !loading && !intent}
		<div class="mt-6">
			<p class="text-sm text-base-content/60 mb-3 text-center">Popular goals:</p>
			<div class="flex flex-wrap gap-2 justify-center">
				{#each suggestions as suggestion}
					<button
						type="button"
						class="btn btn-sm btn-outline"
						onclick={() => selectSuggestion(suggestion)}
						disabled={loading}
					>
						{suggestion}
					</button>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Submit Button (only show if they've typed something) -->
	{#if intent && !loading}
		<div class="mt-4 flex justify-center">
			<button
				type="button"
				class="btn btn-primary btn-lg"
				onclick={handleSubmit}
				disabled={intent.trim().length < 5 || loading}
			>
				Create My Learning Path
			</button>
		</div>
	{/if}
</div>

<style>
	.intent-input-container {
		max-width: 42rem;
		margin: 0 auto;
	}
</style>
