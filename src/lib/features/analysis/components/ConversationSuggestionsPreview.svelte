<script lang="ts">
	import MessageBubble from '$lib/features/conversation/components/MessageBubble.svelte';
	import type { Message as ConversationMessage } from '$lib/server/db/types';
	import type { AnalysisSuggestion } from '../types/analysis-suggestion.types';
	import type { AnalysisMessage } from '../services/analysis.service';
	import { slide } from 'svelte/transition';

	interface Props {
		messages: AnalysisMessage[];
		suggestions: AnalysisSuggestion[];
		conversationLanguage?: string;
		showSuggestions?: boolean;
		audioUrls?: Map<string, string>;
		playingAudioId?: string;
		onPlayAudio?: (messageId: string) => void;
		onPauseAudio?: (messageId: string) => void;
	}

	const {
		messages,
		suggestions,
		conversationLanguage = 'en',
		showSuggestions = true,
		audioUrls = new Map(),
		playingAudioId,
		onPlayAudio,
		onPauseAudio
	}: Props = $props();

	// State management using Svelte 5 runes
	let openSuggestions = $state(new Set<string>());
	let hoveredSuggestions = $state(new Map<string, string>());
	let hasAutoOpened = $state(false);

	// Auto-open first message with suggestions
	$effect(() => {
		if (!hasAutoOpened && messages.length > 0) {
			const firstMessageWithSuggestions = messages.find(
				(m) => getMessageSuggestions(m.id).length > 0
			);
			if (firstMessageWithSuggestions) {
				openSuggestions.add(firstMessageWithSuggestions.id);
				hasAutoOpened = true;
			}
		}
	});

	// Group suggestions by message ID
	const groupedSuggestions = $derived(() => {
		const map = new Map<string, AnalysisSuggestion[]>();
		for (const suggestion of suggestions ?? []) {
			if (!map.has(suggestion.messageId)) {
				map.set(suggestion.messageId, []);
			}
			map.get(suggestion.messageId)!.push(suggestion);
		}
		return map;
	});

	// Get suggestions for a specific message
	const getMessageSuggestions = (messageId: string) => {
		return groupedSuggestions().get(messageId) ?? [];
	};

	// Convert AnalysisMessage to full ConversationMessage for MessageBubble
	const createBubbleMessage = (message: AnalysisMessage): ConversationMessage => ({
		id: message.id,
		conversationId: 'analysis-preview',
		role: message.role,
		content: message.content,
		timestamp:
			message.timestamp instanceof Date
				? message.timestamp
				: message.timestamp
					? new Date(message.timestamp)
					: new Date(),
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
		audioUrl: audioUrls.get(message.id) || null,
		audioDuration: null,
		difficultyLevel: null,
		learningTags: null,
		conversationContext: null,
		messageIntent: null
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

	// Event handlers
	function toggleSuggestions(messageId: string) {
		const newSet = new Set(openSuggestions);
		if (newSet.has(messageId)) {
			newSet.delete(messageId);
		} else {
			newSet.add(messageId);
		}
		openSuggestions = newSet;
	}

	function handlePlayAudio(messageId: string) {
		if (playingAudioId === messageId) {
			onPauseAudio?.(messageId);
		} else {
			onPlayAudio?.(messageId);
		}
	}

	function setHoveredSuggestion(messageId: string, suggestionText: string | null) {
		const newMap = new Map(hoveredSuggestions);
		if (suggestionText) {
			newMap.set(messageId, suggestionText);
		} else {
			newMap.delete(messageId);
		}
		hoveredSuggestions = newMap;
	}
</script>

<div class="suggestions-preview space-y-6">
	{#each messages as message (message.id)}
		{@const messageSuggestions = getMessageSuggestions(message.id)}
		{@const hasSuggestions = messageSuggestions.length > 0}
		{@const isFromUser = message.role === 'user'}
		{@const hasAudio = audioUrls.has(message.id)}
		{@const isPlayingAudio = playingAudioId === message.id}
		{@const suggestionCounts = messageSuggestions.reduce(
			(counts, s) => {
				counts[s.severity as keyof typeof counts] =
					(counts[s.severity as keyof typeof counts] || 0) + 1;
				return counts;
			},
			{ info: 0, hint: 0, warning: 0 }
		)}
		{@const correctedSentence = generateCorrectedSentence(message.content, messageSuggestions)}
		{@const suggestionsOpen = openSuggestions.has(message.id)}
		{@const hoveredSuggestion = hoveredSuggestions.get(message.id)}

		<div class="relative mb-4">
			<div class="flex gap-4 {isFromUser ? 'flex-row-reverse' : 'flex-row'} items-start">
				<!-- Suggestions Panel (conditional) -->
				{#if showSuggestions && hasSuggestions}
					<div class="w-80 flex-shrink-0 {isFromUser ? 'order-2' : 'order-1'}">
						<div class="rounded-lg border border-base-300 bg-base-100 p-4 shadow-sm">
							<!-- Suggestions Toggle Button (WhatsApp retry style) -->
							<div class="mb-2 flex items-center justify-between">
								<span class="text-xs font-medium text-base-content/70">
									{messageSuggestions.length} suggestion{messageSuggestions.length > 1 ? 's' : ''} available
								</span>
								<button
									type="button"
									class="btn btn-circle btn-ghost transition-all duration-200 btn-xs hover:btn-warning {suggestionsOpen
										? 'rotate-45'
										: ''}"
									title={suggestionsOpen ? 'Hide suggestions' : 'Show suggestions'}
									onclick={() => toggleSuggestions(message.id)}
								>
									<span class="text-sm font-bold text-warning">!</span>
								</button>
							</div>

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
										{#each messageSuggestions as suggestion}
											<div
												class="rounded-lg border border-base-300 p-3 transition-all duration-200 hover:shadow-md {suggestion.severity ===
												'warning'
													? 'bg-warning/5 hover:bg-warning/10'
													: suggestion.severity === 'hint'
														? 'bg-success/5 hover:bg-success/10'
														: 'bg-info/5 hover:bg-info/10'}"
												role="button"
												tabindex="0"
												onmouseenter={() =>
													setHoveredSuggestion(message.id, suggestion.originalText)}
												onmouseleave={() => setHoveredSuggestion(message.id, null)}
											>
												<div class="mb-2 flex items-center justify-between">
													<div class="flex items-center gap-2">
														<div
															class="badge badge-xs {getSeverityBadgeClass(suggestion.severity)}"
														>
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
															<span
																class="mt-0.5 icon-[mdi--lightbulb-outline] h-3 w-3 flex-shrink-0"
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
					<div class="relative">
						<!-- Audio Controls (if available) -->
						{#if hasAudio}
							<div class="mb-2 flex justify-{isFromUser ? 'end' : 'start'}">
								<button
									type="button"
									class="btn btn-circle btn-ghost transition-colors duration-200 btn-sm hover:btn-primary"
									title={isPlayingAudio ? 'Pause audio' : 'Play audio'}
									onclick={() => handlePlayAudio(message.id)}
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
						<div class="relative transition-all duration-200 hover:-translate-y-px">
							<MessageBubble message={createBubbleMessage(message)} clickToToggle={true} />

							<!-- Suggestions Indicator Badge -->
							{#if hasSuggestions && !suggestionsOpen}
								<div class="absolute -top-2 -right-2 z-10">
									<div
										class="btn btn-circle animate-pulse shadow-lg btn-xs btn-warning"
										title="Has suggestions"
									>
										<span class="text-xs font-bold text-warning-content">!</span>
									</div>
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>
	{/each}
</div>
