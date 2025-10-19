<script lang="ts">
	import MessageBubble from '$lib/features/conversation/components/MessageBubble.svelte';
	import type { Message as ConversationMessage } from '$lib/server/db/types';
	import type { AnalysisSuggestion } from '../types/analysis-suggestion.types';
	import type { AnalysisMessage } from '../services/analysis.service';
	import { slide } from 'svelte/transition';
	import { SvelteDate } from 'svelte/reactivity';

	interface Props {
		message: AnalysisMessage;
		suggestions?: AnalysisSuggestion[];
		conversationLanguage?: string;
		showSuggestions?: boolean;
		audioUrl?: string;
		isPlayingAudio?: boolean;
		onPlayAudio?: (messageId: string) => void;
		onPauseAudio?: (messageId: string) => void;
	}

	const {
		message,
		suggestions = [],
		conversationLanguage: _conversationLanguage = 'en',
		showSuggestions = true,
		audioUrl,
		isPlayingAudio = false,
		onPlayAudio,
		onPauseAudio
	}: Props = $props();

	// Convert AnalysisMessage to full ConversationMessage for MessageBubble
	const bubbleMessage: ConversationMessage = $derived({
		id: message.id,
		conversationId: 'analysis-preview',
		role: message.role,
		content: message.content,
		timestamp:
			message.timestamp instanceof Date
				? message.timestamp
				: message.timestamp
					? new SvelteDate(message.timestamp)
					: new SvelteDate(),
		sequenceId: '1',
		translatedContent: null,
		sourceLanguage: null,
		targetLanguage: null,
		userNativeLanguage: null,
		romanization: null,
		hiragana: null,
		otherScripts: null,
		speechTimings: null,
		translationConfidence: null,
		translationProvider: null,
		translationNotes: null,
		isTranslated: false,
		grammarAnalysis: null,
		vocabularyAnalysis: null,
		pronunciationScore: null,
		audioUrl: audioUrl || null,
		audioDuration: null,
		difficultyLevel: null,
		learningTags: null,
		conversationContext: null,
		messageIntent: null
	});

	// State management using Svelte 5 runes
	let suggestionsOpen = $state(false);
	let _hoveredSuggestion = $state<string | null>(null);

	// Derived states
	const hasSuggestions = $derived(suggestions.length > 0);
	const hasAudio = $derived(!!audioUrl);
	const isFromUser = $derived(message.role === 'user');

	// Count suggestions by severity
	const suggestionCounts = $derived(() => {
		const counts = { info: 0, hint: 0, warning: 0 };
		suggestions.forEach((s) => {
			if (s.severity in counts) {
				counts[s.severity as keyof typeof counts]++;
			}
		});
		return counts;
	});

	// Get badge class based on suggestion severity
	const getSeverityBadgeClass = (severity: string) => {
		switch (severity) {
			case 'info':
				return 'badge-info';
			case 'hint':
				return 'badge-success';
			case 'warning':
				return 'badge-warning';
			default:
				return 'badge-neutral';
		}
	};

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

	const correctedSentence = $derived(generateCorrectedSentence(message.content, suggestions));

	// Event handlers
	function toggleSuggestions() {
		suggestionsOpen = !suggestionsOpen;
	}

	function handlePlayAudio() {
		if (isPlayingAudio) {
			onPauseAudio?.(message.id);
		} else {
			onPlayAudio?.(message.id);
		}
	}
</script>

<div class="conversation-message-wrapper mb-4">
	<div class="flex gap-4 {isFromUser ? 'flex-row-reverse' : 'flex-row'} items-start">
		<!-- Suggestions Panel (conditional) -->
		{#if showSuggestions && hasSuggestions}
			<div class="w-80 flex-shrink-0 {isFromUser ? 'order-2' : 'order-1'}">
				<div class="suggestions-panel">
					<!-- Suggestions Header -->
					<button
						type="button"
						class="btn mb-2 w-full transition-all duration-200 btn-outline btn-xs hover:btn-primary"
						title="{suggestions.length} suggestion{suggestions.length > 1 ? 's' : ''} available"
						onclick={toggleSuggestions}
					>
						<span class="icon-[mdi--lightbulb] h-3 w-3"></span>
						<div class="flex items-center gap-1">
							{#if suggestionCounts().warning > 0}
								<span class="badge badge-xs badge-warning">{suggestionCounts().warning}</span>
							{/if}
							{#if suggestionCounts().hint > 0}
								<span class="badge badge-xs badge-success">{suggestionCounts().hint}</span>
							{/if}
							{#if suggestionCounts().info > 0}
								<span class="badge badge-xs badge-info">{suggestionCounts().info}</span>
							{/if}
						</div>
						{suggestionsOpen ? 'Hide' : 'Show'} Suggestions
					</button>

					{#if suggestionsOpen}
						<div class="space-y-3" transition:slide={{ duration: 300 }}>
							<!-- Full Corrected Sentence Preview -->
							{#if correctedSentence && correctedSentence !== message.content}
								<div class="rounded-lg border-2 border-success/30 bg-success/5 p-3">
									<div class="mb-2 flex items-center gap-2">
										<span class="icon-[mdi--check-circle] h-4 w-4 text-success"></span>
										<span class="text-sm font-medium text-success">Corrected:</span>
									</div>
									<p class="text-sm font-medium text-base-content">"{correctedSentence}"</p>
								</div>
							{/if}

							<!-- Individual Suggestions -->
							<div class="space-y-2">
								{#each suggestions as suggestion (suggestion.originalText + suggestion.suggestedText)}
									<div
										class="rounded-lg border border-base-300 p-3 transition-all duration-200 hover:shadow-md {suggestion.severity ===
										'warning'
											? 'bg-warning/5 hover:bg-warning/10'
											: suggestion.severity === 'hint'
												? 'bg-success/5 hover:bg-success/10'
												: 'bg-info/5 hover:bg-info/10'}"
										role="button"
										tabindex="0"
										onmouseenter={() => (_hoveredSuggestion = suggestion.originalText)}
										onmouseleave={() => (_hoveredSuggestion = null)}
									>
										<div class="mb-2 flex items-center justify-between">
											<div class="flex items-center gap-2">
												<div class="badge badge-xs {getSeverityBadgeClass(suggestion.severity)}">
													{suggestion.severity}
												</div>
												<span class="text-xs font-medium text-base-content/70"
													>{suggestion.category}</span
												>
											</div>
										</div>
										<p class="mb-2 text-sm text-base-content/80">{suggestion.explanation}</p>
										<div class="flex flex-wrap items-center gap-2 text-sm">
											<span class="text-base-content/60">
												"<span class="line-through decoration-error/50 decoration-2"
													>{suggestion.originalText}</span
												>"
											</span>
											<span class="icon-[mdi--arrow-right] h-4 w-4 text-base-content/40"></span>
											<span class="font-medium text-success">
												"<span class="rounded bg-success/20 px-2 py-0.5"
													>{suggestion.suggestedText}</span
												>"
											</span>
										</div>
										{#if suggestion.example}
											<div class="mt-2 border-t border-base-content/10 pt-2">
												<p class="flex items-start gap-1 text-xs text-base-content/60 italic">
													<span class="mt-0.5 icon-[mdi--lightbulb-outline] h-3 w-3 flex-shrink-0"
													></span>
													<span>{suggestion.example}</span>
												</p>
											</div>
										{/if}
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			</div>
		{:else if showSuggestions}
			<!-- Empty space to maintain layout when no suggestions -->
			<div class="w-80 flex-shrink-0 {isFromUser ? 'order-2' : 'order-1'}"></div>
		{/if}

		<!-- Message Bubble Container -->
		<div class="flex-1 {isFromUser ? 'order-1' : 'order-2'}">
			<div class="message-bubble-container">
				<!-- Audio Controls (if available) -->
				{#if hasAudio}
					<div class="mb-2 flex justify-{isFromUser ? 'end' : 'start'}">
						<button
							type="button"
							class="btn btn-circle btn-ghost transition-colors duration-200 btn-sm hover:btn-primary"
							title={isPlayingAudio ? 'Pause audio' : 'Play audio'}
							onclick={handlePlayAudio}
						>
							{#if isPlayingAudio}
								<span class="icon-[mdi--pause] h-4 w-4"></span>
							{:else}
								<span class="icon-[mdi--play] h-4 w-4"></span>
							{/if}
						</button>
					</div>
				{/if}

				<!-- Message Bubble -->
				<div class="message-bubble-wrapper">
					<MessageBubble message={bubbleMessage} clickToToggle={true} />
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.conversation-message-wrapper {
		position: relative;
	}

	.suggestions-panel {
		background: var(--fallback-b1, oklch(var(--b1) / 1));
		border-radius: 0.5rem;
		padding: 1rem;
		border: 1px solid var(--fallback-b3, oklch(var(--b3) / 1));
	}

	.message-bubble-container {
		position: relative;
	}

	.message-bubble-wrapper {
		transition: all 0.2s ease;
	}

	.message-bubble-wrapper:hover {
		transform: translateY(-1px);
	}
</style>
