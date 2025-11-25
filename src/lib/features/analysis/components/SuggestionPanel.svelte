<script lang="ts">
	import type { AnalysisSuggestion } from '../types/analysis-suggestion.types';
	import { slide } from 'svelte/transition';

	interface Props {
		suggestions: AnalysisSuggestion[];
		originalText: string;
		isVisible?: boolean;
		onHoverSuggestion?: (suggestionText: string | null) => void;
	}

	const { suggestions, originalText, isVisible = false, onHoverSuggestion }: Props = $props();

	// Generate full corrected sentence by applying all suggestions
	const generateCorrectedSentence = (
		originalContent: string,
		messageSuggestions: AnalysisSuggestion[]
	) => {
		let correctedContent = originalContent;

		// Sort suggestions by position (if available) or by original text length (longest first)
		const sortedSuggestions = [...messageSuggestions].sort((a, b) => {
			if (a.offsets && b.offsets) {
				return b.offsets.start - a.offsets.start; // Apply from end to start
			}
			// Fallback: longer original text first to avoid partial matches
			return b.originalText.length - a.originalText.length;
		});

		// Apply each suggestion
		for (const suggestion of sortedSuggestions) {
			// Use global replace to handle multiple occurrences
			const regex = new RegExp(escapeRegExp(suggestion.originalText), 'g');
			correctedContent = correctedContent.replace(regex, suggestion.suggestedText);
		}

		return correctedContent;
	};

	// Helper function to escape special regex characters
	const escapeRegExp = (string: string) => {
		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	};

	// Derived values
	const correctedSentence = $derived(generateCorrectedSentence(originalText, suggestions));

	// Event handlers
	function handleHoverSuggestion(suggestionText: string | null) {
		onHoverSuggestion?.(suggestionText);
	}
</script>

{#if suggestions.length > 0 && isVisible}
	<div
		class="card border border-base-300 bg-base-100 shadow-xl"
		transition:slide={{ duration: 300 }}
	>
		<div class="card-body p-4">
			<!-- Header -->
			<div class="mb-3 flex items-center gap-2">
				<div class="badge badge-sm badge-warning">
					<span class="mr-1 icon-[mdi--lightbulb] h-3 w-3"></span>
					{suggestions.length} suggestion{suggestions.length > 1 ? 's' : ''}
				</div>
			</div>

			<!-- Full Corrected Sentence Preview -->
			{#if correctedSentence && correctedSentence !== originalText}
				<div class="mb-4 alert alert-success">
					<span class="icon-[mdi--check-circle] h-5 w-5"></span>
					<div class="flex flex-col">
						<div class="font-semibold">Corrected version:</div>
						<div class="text-sm opacity-90">"{correctedSentence}"</div>
					</div>
				</div>
			{/if}

			<!-- Individual Suggestions -->
			<div class="space-y-2">
				{#each suggestions as suggestion (suggestion.originalText + suggestion.suggestedText)}
					{@const alertType =
						suggestion.severity === 'warning'
							? 'alert-warning'
							: suggestion.severity === 'hint'
								? 'alert-success'
								: 'alert-info'}
					<div
						class="alert {alertType} cursor-pointer alert-outline px-4 py-3"
						role="button"
						tabindex="0"
						onmouseenter={() => handleHoverSuggestion(suggestion.originalText)}
						onmouseleave={() => handleHoverSuggestion(null)}
					>
						<div class="min-w-0 flex-1">
							<!-- Explanation as main text -->
							<div class="mb-2 text-sm font-medium">{suggestion.explanation}</div>

							<!-- Compact change preview and example in one line -->
							<div class="flex flex-wrap items-center gap-2 text-xs">
								<div class="flex items-center gap-1">
									<span class="line-through opacity-60">{suggestion.originalText}</span>
									<span class="icon-[mdi--arrow-right] h-3 w-3 opacity-40"></span>
									<span class="font-semibold">{suggestion.suggestedText}</span>
								</div>
								{#if suggestion.example}
									<span class="opacity-75">•</span>
									<span class="italic opacity-75">{suggestion.example}</span>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
{/if}
