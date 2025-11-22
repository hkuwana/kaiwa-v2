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
	import { SvelteDate } from 'svelte/reactivity';
	import WordSyncedText from '$lib/components/WordSyncedText.svelte';
	import {
		createHighlightedSegments,
		createHighlightedHtml
	} from '$lib/features/analysis/utils/text-highlighting.utils';
	import { userManager } from '$lib/stores/user.store.svelte';

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
	const currentSpeaker = $derived(
		isUser ? null : speaker || getSpeakerById(settingsStore.selectedSpeaker)
	);
	// Conditional values based on message type
	const chatClass = $derived(isUser ? 'chat-end' : 'chat-start');
	const avatarAlt = $derived(
		isUser ? 'User avatar' : currentSpeaker?.characterImageAlt || 'Kaiwa mascot'
	);

	const assistantAvatarSrc = $derived(currentSpeaker?.characterImageUrl || kitsune);

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
	let swipeTriggeredShow = $state(false);
	let manualToggle = $state(false);
	let localToggle = $state(false); // For show/hide translation button toggle
	let showScripts = $state(false); // For showing/hiding furigana and romanization
	const translationLoading = $derived(translationStore.isTranslating(message.id));

	// Determine if a translation exists (availability)
	const hasTranslation = $derived(isMessageTranslated(message) || !!translation?.translatedContent);

	// Translation visibility - button only, no hover
	const showTranslation = $derived(
		(clickToToggle
			? manualToggle
			: localToggle || swipeTriggeredShow || translationStore.isTranslationVisible(message.id)) &&
			hasTranslation
	);

	// Check if content needs script generation - prioritize conversation language
	const needsScripts = $derived(
		conversationLanguage === 'ja' ||
			conversationLanguage === 'ko' ||
			conversationLanguage === 'zh' ||
			detectLanguage(message.content) !== 'other'
	);

	// Check if message has script data (generated after streaming completion)
	const hasScriptDataFlag = $derived(hasScriptData(message));

	// Detect which type of script content we have
	// Prioritize language-specific detection to prevent Japanese/Chinese confusion
	const scriptDisplayType = $derived(() => {
		const lang = detectLanguage(message.content);

		// For Chinese text, prioritize pinyin even if hiragana exists
		if (lang === 'zh' && message.otherScripts?.pinyinRuby) return 'pinyin';

		// For Japanese text, show furigana
		if (lang === 'ja' && (message.hiragana || message.otherScripts?.furigana)) return 'furigana';

		// Fallback to checking what data exists
		if (message.otherScripts?.pinyinRuby) return 'pinyin';
		if (message.hiragana || message.otherScripts?.furigana) return 'furigana';
		if (message.romanization) return 'romanization';
		return null;
	});

	// Get the appropriate script button label based on language
	const scriptButtonLabel = $derived(() => {
		const lang = detectLanguage(message.content);
		if (lang === 'ja') return showScripts ? 'Hide Romaji' : 'Show Romaji';
		if (lang === 'zh') return showScripts ? 'Hide Pinyin' : 'Show Pinyin';
		if (lang === 'ko') return showScripts ? 'Hide Romanization' : 'Show Romanization';
		return showScripts ? 'Hide' : 'Show';
	});

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

	function handleBubbleClick() {
		if (!clickToToggle || !hasTranslation) return;
		if (dispatch) {
			dispatch('toggle', { messageId: message.id });
		} else {
			manualToggle = !manualToggle;
		}
	}
</script>

<div class="chat {chatClass}" role="listitem">
	<div class="avatar chat-image">
		<div class="w-10 rounded-full">
			{#if isUser}
				{#if userManager.user.avatarUrl}
					<img alt={avatarAlt} src={userManager.user.avatarUrl} loading="lazy" />
				{:else}
					<!-- Show user initials if no avatar -->
					<div
						class="flex h-full w-full items-center justify-center rounded-full bg-primary text-primary-content"
					>
						<span class="text-lg font-semibold"
							>{userManager.user.displayName?.slice(0, 1).toUpperCase() || 'U'}</span
						>
					</div>
				{/if}
			{:else}
				<img alt={avatarAlt} src={assistantAvatarSrc} loading="lazy" />
			{/if}
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
				<!-- Display script overlay (Furigana for Japanese, Pinyin for Chinese) -->
				{#if scriptDisplayType() === 'furigana' && message.hiragana}
					<!-- Japanese text with furigana display -->
					<div class="text-base">
						<div class="relative" style="line-height: 2em;">
							{@html message.hiragana}
						</div>
					</div>
					<!-- Romanization (only visible when showScripts is true) -->
					{#if message.romanization && showScripts}
						<div class="text-sm italic opacity-70">
							{message.romanization}
						</div>
					{/if}
				{:else if scriptDisplayType() === 'pinyin' && message.otherScripts?.pinyinRuby}
					<!-- Chinese text with pinyin display -->
					<div class="text-base">
						<div class="relative" style="line-height: 2em;">
							<!-- Safe: pinyinRuby contains sanitized pinyin ruby markup generated server-side -->
							{@html message.otherScripts.pinyinRuby}
						</div>
					</div>
					<!-- Plain romanization (only visible when showScripts is true) -->
					{#if message.romanization && showScripts}
						<div class="text-sm italic opacity-70">
							{message.romanization}
						</div>
					{/if}
				{:else if message.romanization}
					<!-- Show romanization if ruby markup not yet available (only when showScripts is true) -->
					{#if showScripts}
						<div class="text-sm italic opacity-70">
							{message.romanization}
						</div>
					{:else}
						<!-- Show original content when scripts not visible -->
						<div class="text-base">
							{#if highlightedContent()}
								<!-- Safe: highlightedContent() returns sanitized HTML for text highlighting -->
								{@html highlightedContent()}
							{:else}
								{message.content}
							{/if}
						</div>
					{/if}
				{:else}
					<!-- Other text without script overlays -->
					<div class="text-base">
						{#if highlightedContent()}
							<!-- Safe: highlightedContent() returns sanitized HTML for text highlighting -->
							{@html highlightedContent()}
						{:else}
							{message.content}
						{/if}
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
					<!-- Safe: highlightedContent() returns sanitized HTML for text highlighting -->
					{@html highlightedContent()}
				{:else}
					{message.content}
				{/if}
			</div>
		{/if}

		<!-- Translation Section - Always show translation text when available -->
		{#if showTranslation && (translation?.translatedContent || message.translatedContent)}
			<!-- Visual separator -->
			<div class="divider my-2 {borderClass}"></div>

			<!-- Translation content -->
			<div class="text-sm font-medium text-base-content/90">
				{translation?.translatedContent || message.translatedContent}
			</div>
		{/if}
	</div>
	<div class="chat-footer flex items-center gap-2 opacity-50">
		<!-- Scripts toggle button (for messages with scripts) - Dynamic label based on language -->
		{#if needsScripts && hasScriptDataFlag && message.romanization}
			<button
				class="btn flex h-6 min-h-0 items-center gap-1 rounded-full px-2 btn-ghost btn-xs hover:bg-base-300/50"
				onclick={() => (showScripts = !showScripts)}
				title={scriptButtonLabel()}
			>
				<span class="text-xs">
					{scriptButtonLabel()}
				</span>
			</button>
		{/if}

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
					<span class="icon-[mdi--translate] h-3 w-3"></span>
					<span class="text-xs">Translate</span>
				{/if}
			</button>
		{:else}
			<!-- Show/Hide translation button -->
			<button
				class="btn flex h-6 min-h-0 items-center gap-1 rounded-full px-2 btn-ghost btn-xs hover:bg-base-300/50"
				onclick={() => (localToggle = !localToggle)}
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
