<script lang="ts">
	import MessageBubble from '$lib/features/conversation/components/MessageBubble.svelte';
	import SuggestionPanel from './SuggestionPanel.svelte';
	import type { Message as ConversationMessage } from '$lib/server/db/types';
	import type { AnalysisSuggestion } from '../types/analysis-suggestion.types';
	import type { AnalysisMessage } from '../services/analysis.service';
	import { findTextOffsets } from '../utils/text-highlighting.utils';

	interface Props {
		messages: AnalysisMessage[];
		suggestions: AnalysisSuggestion[];
		showSuggestions?: boolean;
		audioUrls?: Map<string, string>;
		playingAudioId?: string;
		onPlayAudio?: (messageId: string) => void;
		onPauseAudio?: (messageId: string) => void;
		// Allow external control of suggestion state
		openSuggestions?: Set<string>;
		onToggleSuggestions?: (messageId: string) => void;
	}

	const {
		messages,
		suggestions,
		showSuggestions = true,
		audioUrls = new Map(),
		playingAudioId,
		onPlayAudio,
		onPauseAudio,
		openSuggestions: externalOpenSuggestions,
		onToggleSuggestions
	}: Props = $props();

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
		timestamp: message.timestamp instanceof Date
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

	// State for suggestion highlighting
	let hoveredSuggestion = $state<string | null>(null);
	let internalOpenSuggestions = $state(new Set<string>());

	// Use external state if provided, otherwise use internal state
	const openSuggestions = $derived(externalOpenSuggestions || internalOpenSuggestions);

	// Event handlers
	function handlePlayAudio(messageId: string) {
		if (playingAudioId === messageId) {
			onPauseAudio?.(messageId);
		} else {
			onPlayAudio?.(messageId);
		}
	}

	function toggleSuggestions(messageId: string) {
		if (onToggleSuggestions) {
			// Use external handler
			onToggleSuggestions(messageId);
		} else {
			// Use internal state
			const newSet = new Set(internalOpenSuggestions);
			if (newSet.has(messageId)) {
				newSet.delete(messageId);
			} else {
				newSet.add(messageId);
			}
			internalOpenSuggestions = newSet;
		}
	}

	function setHoveredSuggestion(suggestionText: string | null) {
		hoveredSuggestion = suggestionText;
	}

	// Calculate highlight offsets for a specific message based on hovered suggestion
	function getHighlightOffsets(message: AnalysisMessage): Array<{ start: number; end: number }> {
		if (!hoveredSuggestion || typeof message.content !== 'string') {
			return [];
		}

		// Only highlight if the hovered suggestion belongs to this specific message
		const messageSuggestions = getMessageSuggestions(message.id);
		const matchingSuggestion = messageSuggestions.find(
			suggestion => suggestion.originalText === hoveredSuggestion
		);

		// If no suggestion for this message matches the hovered text, don't highlight anything
		if (!matchingSuggestion) {
			return [];
		}

		// If the suggestion has precise offsets, use them
		if (matchingSuggestion.offsets) {
			return [matchingSuggestion.offsets];
		}

		// Fallback: search for the text in the message content (only for this message's suggestion)
		return findTextOffsets(message.content, hoveredSuggestion);
	}
</script>

<div class="unified-conversation-bubble space-y-6">
	{#each messages as message (message.id)}
		{@const messageSuggestions = getMessageSuggestions(message.id)}
		{@const hasSuggestions = messageSuggestions.length > 0}
		{@const hasAudio = audioUrls.has(message.id)}
		{@const isPlayingAudio = playingAudioId === message.id}
		{@const isFromUser = message.role === 'user'}
		{@const suggestionsOpen = openSuggestions.has(message.id)}

		<div class="space-y-2">
			<!-- Audio Controls (if available) -->
			{#if hasAudio}
				<div class="flex justify-{isFromUser ? 'end' : 'start'}">
					<button
						type="button"
						class="btn btn-circle btn-sm btn-ghost hover:btn-primary transition-colors duration-200"
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
			<MessageBubble
				message={createBubbleMessage(message)}
				clickToToggle={true}
				highlightOffsets={getHighlightOffsets(message)}
			/>

			<!-- Suggestions Toggle Button (underneath MessageBubble, only for user messages with suggestions) -->
			{#if showSuggestions && hasSuggestions && isFromUser}
				<div class="flex justify-end">
					<button
						type="button"
						class="btn btn-sm btn-outline btn-warning gap-2"
						onclick={() => toggleSuggestions(message.id)}
					>
						<span class="icon-[mdi--lightbulb] w-4 h-4"></span>
						{#if suggestionsOpen}
							Hide suggestions
							<span class="icon-[mdi--chevron-up] w-4 h-4"></span>
						{:else}
							Show suggestions ({messageSuggestions.length})
							<span class="icon-[mdi--chevron-down] w-4 h-4"></span>
						{/if}
					</button>
				</div>
			{/if}

			<!-- Suggestions Panel (underneath when toggled) -->
			{#if showSuggestions && hasSuggestions && isFromUser}
				<div class="flex justify-end">
					<div class="w-full max-w-2xl">
						<SuggestionPanel
							suggestions={messageSuggestions}
							originalText={message.content}
							isVisible={suggestionsOpen}
							onHoverSuggestion={setHoveredSuggestion}
						/>
					</div>
				</div>
			{/if}

		 
		</div>
	{/each}
</div>