<!-- src/lib/components/MessageBubble.svelte -->
<script lang="ts">
	import type { Message } from '$lib/server/db/types';
	import type { Speaker } from '$lib/types';
	import { settingsStore } from '$lib/stores/settings.store.svelte';
	import {
		translateMessage,
		isMessageTranslated,
		getMessageScripts
	} from '$lib/services/translation.service';
	import { translationStore } from '$lib/stores/translation.store.svelte';
	import { hasScriptData, detectLanguage } from '$lib/services/scripts.service';
	import { getSpeakerById } from '$lib/data/speakers';
	import { getLanguageEmoji, getLanguageName } from '$lib/data/languages';
	import kitsune from '$lib/assets/kitsune.webp';
	import face from '$lib/assets/Face.webp';
	import { capitalize } from '$lib/utils';

	interface Props {
		message: Message;
		speaker?: Speaker;
		translation?: Partial<Message>;
	}

	const { message, speaker, translation, dispatch } = $props<
		Props & { dispatch?: (event: string, data: any) => void }
	>();

	// Format timestamp
	const formattedTime = $derived(
		new Date(message.timestamp).toLocaleTimeString([], {
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
	const speakerName = $derived(
		isUser
			? 'You'
			: (() => {
					// Use passed speaker prop first, then fall back to settings
					const currentSpeaker = speaker || getSpeakerById(settingsStore.selectedSpeaker);
					return currentSpeaker?.voiceName || 'AI';
				})()
	);
	const bubbleClass = $derived(isUser ? 'chat-bubble chat-bubble-primary' : 'chat-bubble');
	const borderClass = $derived(isUser ? 'border-primary/20' : 'border-base-content/20');

	// Translation state
	let isHovered = $state(false);
	let swipeTriggeredShow = $state(false);
	let translationLoading = $derived(translationStore.isTranslating(message.id));
	let showTranslation = $derived(
		isHovered ||
			swipeTriggeredShow ||
			translationStore.isTranslationVisible(message.id) ||
			isMessageTranslated(message) ||
			!!translation?.translatedContent
	);

	// Check if content needs script generation
	const needsScripts = $derived(detectLanguage(message.content) !== 'other');

	// Check if message has script data (generated after streaming completion)
	const hasScriptDataFlag = $derived(hasScriptData(message));

	// Get available scripts for the message - use passed translation or message data
	const availableScripts = $derived(
		translation
			? {
					...(translation.translatedContent && {
						translatedContent: translation.translatedContent
					}),
					...(translation.romanization && { romanization: translation.romanization }),
					...(translation.hiragana && { hiragana: translation.hiragana }),
					...(translation.otherScripts && { otherScripts: translation.otherScripts })
				}
			: getMessageScripts(message)
	);

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
		isHovered = true;
	}

	function handleMouseLeave() {
		isHovered = false;
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
	<div class={bubbleClass}>
		<!-- Main content with scripts for supported languages -->
		{#if needsScripts && hasScriptDataFlag}
			<div class="space-y-1">
				<!-- Japanese text with furigana display -->
				<div class="text-base">
					{#if message.hiragana}
						<!-- Show furigana overlaid on original text -->
						<div class="furigana-container" style="line-height: 2em;">
							{@html message.hiragana}
						</div>
					{:else}
						<!-- Fallback to original text if no furigana -->
						{message.content}
					{/if}
				</div>
				<!-- Romaji if available -->
				{#if message.romanization}
					<div class="text-sm italic opacity-70">
						{message.romanization}
					</div>
				{/if}
				<!-- English translation if available -->
				{#if translation?.translatedContent || message.translatedContent}
					<div class="text-sm font-medium text-primary">
						{translation?.translatedContent || message.translatedContent}
					</div>
				{/if}
			</div>
		{:else if needsScripts && !hasScriptDataFlag}
			<!-- Japanese content without furigana yet (still streaming) -->
			<div class="space-y-1">
				<div class="text-base">
					{message.content}
				</div>
				<div class="text-sm italic opacity-50">Generating furigana...</div>
			</div>
		{:else}
			<!-- Regular content for non-Japanese -->
			{message.content}
		{/if}

		<!-- Translation Section -->
		{#if showTranslation && (isMessageTranslated(message) || translation?.translatedContent)}
			<!-- Visual separator -->
			<div class="divider my-2 {borderClass}"></div>
			<!-- Romanization for any language -->
			{#if translation?.romanization || message.romanization}
				<div class="text-sm italic opacity-70">
					{translation?.romanization || message.romanization}
				</div>
			{/if}

			<!-- Translation content -->
			<div class="space-y-2">
				<!-- Main translation with language emoji -->
				{#if translation?.translatedContent || message.translatedContent}
					{@const targetLang = translation?.targetLanguage || message.targetLanguage}
					<div class="flex items-start gap-2">
						<div class="text-sm opacity-80">
							{translation?.translatedContent || message.translatedContent}
						</div>
					</div>
				{/if}

				<!-- Japanese-specific scripts -->
				{#if (translation?.targetLanguage || message.targetLanguage) === 'ja' || translation?.hiragana || message.hiragana || translation?.katakana || message.katakana || translation?.kanji || message.kanji}
					<div class="space-y-1">
						<!-- Hiragana -->
						{#if translation?.hiragana || message.hiragana}
							<div class="text-sm opacity-80">
								{@html translation?.hiragana || message.hiragana}
							</div>
						{/if}
					</div>
				{/if}

				<!-- Chinese-specific scripts (pinyin is now stored in romanization) -->
				{#if (translation?.targetLanguage || message.targetLanguage) === 'zh'}
					{#if translation?.romanization || message.romanization}
						<div class="text-sm opacity-80">
							{translation?.romanization || message.romanization}
						</div>
					{/if}
				{/if}

				<!-- Other scripts -->
				{#if translation?.otherScripts || (message.otherScripts && message.targetLanguage === 'ja')}
					{@const otherScripts = translation?.otherScripts || message.otherScripts}
					{#each Object.entries(otherScripts) as [scriptType, scriptValue]}
						<div class="text-sm opacity-80">
							{@html scriptValue}
						</div>
					{/each}
				{/if}
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

<style>
	.furigana-container {
		position: relative;
	}

	.furigana-container rt {
		font-size: 0.7em;
		opacity: 0.8;
	}

	.furigana-container ruby {
		line-height: 1.2;
	}
</style>
