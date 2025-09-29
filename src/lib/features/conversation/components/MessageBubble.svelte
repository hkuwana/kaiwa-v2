<!-- src/lib/components/MessageBubble.svelte -->
<script lang="ts">
	import type { Message, SpeechTiming } from '$lib/server/db/types';
	import type { Speaker } from '$lib/types';
	import { settingsStore } from '$lib/stores/settings.store.svelte';
	import { translateMessage, isMessageTranslated } from '$lib/services/translation.service';
	import { translationStore } from '$lib/stores/translation.store.svelte';
	import { hasScriptData, detectLanguage } from '$lib/services/scripts.service';
	import { getSpeakerById } from '$lib/data/speakers';
	import { getLanguageEmoji } from '$lib/data/languages';
	import kitsune from '$lib/assets/kitsune.webp';
	import face from '$lib/assets/Face.webp';
	import { SvelteDate } from 'svelte/reactivity';
	import WordSyncedText from '$lib/components/WordSyncedText.svelte';
	import {
		createHighlightedSegments,
		createHighlightedHtml
	} from '$lib/features/analysis/utils/text-highlighting.utils';

	interface Props {
		message: Message;
		speaker?: Speaker;
		translation?: Partial<Message>;
		// When true, users toggle translation visibility by clicking the bubble (no hover)
		clickToToggle?: boolean;
		wordTimings?: SpeechTiming[];
		activeWordIndex?: number;
		// For highlighting specific text segments (e.g., for analysis suggestions)
		highlightOffsets?: Array<{ start: number; end: number }>;
	}

	const {
		message,
		speaker,
		translation,
		clickToToggle = false,
		wordTimings = [],
		activeWordIndex = -1,
		highlightOffsets = [],
		dispatch
	} = $props<
		Props & {
			dispatch?: (
				event: string,
				data: {
					messageId: string;
					message: Message;
					speaker?: Speaker;
				}
			) => void;
		}
	>();

	// Format timestamp
	const formattedTime = $derived(
		new SvelteDate(message.timestamp).toLocaleTimeString([], {
			hour: '2-digit',
			minute: '2-digit'
		})
	);

	// Determine if message is from user or AI
	const isUser = $derived(message.role === 'user');

	// Conditional values based on message type
	const chatClass = $derived(isUser ? 'chat-end' : 'chat-start');
	const avatarSrc = $derived(isUser ? kitsune : face);
	const avatarAlt = $derived(isUser ? 'User avatar' : 'AI avatar');
	const currentSpeaker = $derived(
		isUser ? null : speaker || getSpeakerById(settingsStore.selectedSpeaker)
	);

	const speakerName = $derived(isUser ? 'You' : currentSpeaker?.voiceName || 'AI');

	// Derive conversation language from speaker
	const conversationLanguage = $derived(
		currentSpeaker?.language || settingsStore.selectedLanguage?.code || 'en'
	);
	const bubbleClass = $derived(isUser ? 'chat-bubble chat-bubble-primary' : 'chat-bubble');
	const borderClass = $derived(isUser ? 'border-primary/20' : 'border-base-content/20');
	const hasWordHighlights = $derived(
		!isUser && wordTimings.length > 0 && typeof message.content === 'string'
	);
	const normalizedActiveWordIndex = $derived(
		hasWordHighlights && activeWordIndex >= 0
			? Math.min(activeWordIndex, wordTimings.length - 1)
			: -1
	);

	// Create highlighted content when highlight offsets are provided
	const highlightedContent = $derived(() => {
		if (!highlightOffsets.length || typeof message.content !== 'string') {
			return null;
		}
		const segments = createHighlightedSegments(message.content, highlightOffsets);
		return createHighlightedHtml(
			segments,
			'bg-warning/50 text-warning-content font-semibold rounded px-2 py-1 shadow-sm'
		);
	});

	// Translation state
	let isHovered = $state(false);
	let swipeTriggeredShow = $state(false);
	let manualToggle = $state(false);
	const translationLoading = $derived(translationStore.isTranslating(message.id));

	// Determine if a translation exists (availability)
	const hasTranslation = $derived(isMessageTranslated(message) || !!translation?.translatedContent);

	// Raw visibility state before checking availability
	const rawVisibility = $derived(
		clickToToggle
			? manualToggle
			: isHovered || swipeTriggeredShow || translationStore.isTranslationVisible(message.id)
	);

	// Final visibility respects availability
	let showTranslation = $derived(rawVisibility && hasTranslation);

	// Check if content needs script generation - prioritize conversation language
	const needsScripts = $derived(
		conversationLanguage === 'ja' ||
			conversationLanguage === 'ko' ||
			conversationLanguage === 'zh' ||
			detectLanguage(message.content) !== 'other'
	);

	// Check if message has script data (generated after streaming completion)
	const hasScriptDataFlag = $derived(hasScriptData(message));

	async function handleTranslation() {
		// Dispatch translation request to parent
		if (dispatch) {
			dispatch('translate', {
				messageId: message.id,
				message: message,
				speaker: speaker
			});
			return; // Let parent handle the translation
		}

		// If no parent handler, fall back to local translation
		if (isMessageTranslated(message)) {
			translationStore.toggleTranslation(message.id);
			return;
		}

		translationStore.setTranslating(message.id, true);

		try {
			// Use the client translation service
			await translateMessage(message, settingsStore.selectedLanguage?.code ?? 'ja', 'en');

			translationStore.showTranslation(message.id);
		} catch (error) {
			console.error('Translation error:', error);
		} finally {
			translationStore.setTranslating(message.id, false);
			swipeTriggeredShow = true;
		}
	}

	function handleMouseEnter() {
		if (!clickToToggle) isHovered = true;
	}

	function handleMouseLeave() {
		if (!clickToToggle) isHovered = false;
	}

	function handleBubbleClick() {
		if (!clickToToggle || !hasTranslation) return;
		if (dispatch) {
			dispatch('toggle', { messageId: message.id });
		} else {
			manualToggle = !manualToggle;
		}
	}
</script>

<div
	class="chat {chatClass}"
	role="listitem"
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
>
	<div class="avatar chat-image">
		<div class="w-10 rounded-full">
			<img alt={avatarAlt} src={avatarSrc} />
		</div>
	</div>
	<div class="chat-header">
		{speakerName}
		<time class="text-xs opacity-50">{formattedTime}</time>
	</div>
	<div
		class={bubbleClass}
		role="button"
		tabindex="0"
		onclick={handleBubbleClick}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				handleBubbleClick();
			}
		}}
	>
		<!-- Main content with scripts for supported languages -->
		{#if needsScripts && hasScriptDataFlag}
			<div class="space-y-1">
				<!-- Japanese text with furigana display -->
				{#if message.hiragana}
					<div class="text-base">
						<!-- Show furigana overlaid on original text -->
						<div class="relative" style="line-height: 2em;">
							{@html message.hiragana}
						</div>
					</div>
				{:else}
					<!-- Korean or other text without furigana -->
					<div class="text-base">
						{#if highlightedContent()}
							{@html highlightedContent()}
						{:else}
							{message.content}
						{/if}
					</div>
				{/if}

				<!-- Romanization (for any language) -->
				{#if message.romanization}
					<div class="text-sm italic opacity-70">
						{message.romanization}
					</div>
				{/if}
			</div>
		{:else if needsScripts && !hasScriptDataFlag && !message.content}
			<!-- Content without scripts yet (still streaming) -->
			<div class="space-y-1">
				<div class="text-sm italic opacity-50">Generating scripts...</div>
			</div>
		{:else}
			<div class="text-base">
				<!-- Regular content for non-Japanese -->
				{#if hasWordHighlights}
					<WordSyncedText
						text={message.content}
						timings={wordTimings}
						activeIndex={normalizedActiveWordIndex}
					/>
				{:else if highlightedContent()}
					{@html highlightedContent()}
				{:else}
					{message.content}
				{/if}
			</div>
		{/if}

		<!-- Translation Section (only show if different from main scripts or if no scripts shown above) -->
		{#if showTranslation && (isMessageTranslated(message) || translation?.translatedContent) && (!needsScripts || !hasScriptDataFlag)}
			<!-- Visual separator -->
			<div class="divider my-2 {borderClass}"></div>

			<!-- Translation content -->
			<div class="space-y-2">
				<!-- Main translation with language emoji -->
				{#if translation?.translatedContent || message.translatedContent}
					<div class="flex items-start">
						<div class=" text-sm font-medium">
							{translation?.translatedContent || message.translatedContent}
						</div>
					</div>
				{/if}

				<!-- Romanization for any language (only if not already shown above) -->
				{#if translation?.romanization || message.romanization}
					<div class="text-sm italic opacity-70">
						{translation?.romanization || message.romanization}
					</div>
				{/if}

				<!-- Japanese-specific scripts (only if not already shown above) -->
				{#if (translation?.targetLanguage || message.targetLanguage) === 'ja' || translation?.hiragana || message.hiragana}
					<div class="space-y-1">
						<!-- Hiragana -->
						{#if translation?.hiragana || message.hiragana}
							<div class="text-sm opacity-80">
								{@html translation?.hiragana || message.hiragana}
							</div>
						{/if}
					</div>
				{/if}

				<!-- Other scripts -->
				{#if translation?.otherScripts || message.otherScripts}
					{@const otherScripts = translation?.otherScripts || message.otherScripts}
					{#each Object.entries(otherScripts) as [, scriptValue]}
						<div class="text-sm opacity-80">
							<!-- eslint-disable-next-line svelte/no-at-html-tags -->
							{@html scriptValue}
						</div>
					{/each}
				{/if}
			</div>
		{:else if showTranslation && (translation?.translatedContent || message.translatedContent)}
			<!-- Show only translation text when scripts are already displayed above -->

			<div class="text-sm font-medium text-base-content/90">
				{translation?.translatedContent || message.translatedContent}
			</div>
		{/if}
	</div>
	<div class="chat-footer flex items-center justify-between opacity-50">
		<!-- Translation button -->
		{#if !isMessageTranslated(message) && !translation?.translatedContent}
			<!-- Translate button -->
			<button
				class="btn flex h-6 min-h-0 items-center gap-1 rounded-full px-2 btn-ghost btn-xs hover:bg-base-300/50"
				onclick={handleTranslation}
				disabled={translationLoading}
				title="Translate Message"
			>
				{#if translationLoading}
					<span class="loading loading-xs loading-spinner"></span>
				{:else}
					<svg
						class="h-3 w-3"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
						></path>
					</svg>
					<span class="text-xs">Translate</span>
				{/if}
			</button>
		{:else}
			<!-- Show/Hide translation button -->
			<button
				class="btn flex h-6 min-h-0 items-center gap-1 rounded-full px-2 btn-ghost btn-xs hover:bg-base-300/50"
				onclick={() => (showTranslation = !showTranslation)}
				disabled={translationLoading}
				title={showTranslation ? 'Hide Translation' : 'Show Translation'}
			>
				{#if translationLoading}
					<span class="loading loading-xs loading-spinner"></span>
				{:else}
					<span class="text-sm">
						{getLanguageEmoji(translation?.targetLanguage || message.targetLanguage || 'en')}
					</span>
					<span class="text-xs">
						{showTranslation ? 'Hide' : 'Show'}
					</span>
				{/if}
			</button>
		{/if}
	</div>
</div>
