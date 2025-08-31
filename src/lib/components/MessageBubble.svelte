<!-- src/lib/components/MessageBubble.svelte -->
<script lang="ts">
	import type { Message } from '$lib/server/db/types';
	import { settingsStore } from '$lib/stores/settings.store.svelte';
	import {
		translateMessage,
		isMessageTranslated,
		getMessageScripts
	} from '$lib/services/translation.service';
	import { translationStore } from '$lib/stores/translation.store.svelte';
	import { getSpeakerById } from '$lib/data/speakers';
	import kitsune from '$lib/assets/kitsune.webp';
	import face from '$lib/assets/Face.webp';

	const { message } = $props<{
		message: Message;
	}>();

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
					const speaker = getSpeakerById(settingsStore.selectedSpeaker);
					return speaker?.voiceName || 'AI';
				})()
	);
	const bubbleClass = $derived(isUser ? 'chat-bubble chat-bubble-primary' : 'chat-bubble');
	const borderClass = $derived(isUser ? 'border-primary/20' : 'border-base-content/20');
	const footerText = $derived(isUser ? 'Sent' : 'Delivered');

	// Translation state
	let isHovered = $state(false);
	let swipeTriggeredShow = $state(false);
	let translationLoading = $derived(translationStore.isTranslating(message.id));
	let showTranslation = $derived(
		isHovered ||
			swipeTriggeredShow ||
			translationStore.isTranslationVisible(message.id) ||
			isMessageTranslated(message)
	);

	// Get available scripts for the message
	const availableScripts = $derived(getMessageScripts(message));

	async function handleTranslation() {
		if (isMessageTranslated(message)) {
			translationStore.toggleTranslation(message.id);
			return;
		}

		translationStore.setTranslating(message.id, true);

		await translateMessage(message, settingsStore.selectedLanguage?.code ?? 'ja', 'en');

		translationStore.setTranslating(message.id, false);
		translationStore.showTranslation(message.id);
		swipeTriggeredShow = true;
	}

	function handleMouseEnter() {
		isHovered = true;
	}

	function handleMouseLeave() {
		isHovered = false;
	}
</script>

<div class="chat {chatClass}" onmouseenter={handleMouseEnter} onmouseleave={handleMouseLeave}>
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
		{message.content}

		<!-- Translation controls -->
		{#if showTranslation && isMessageTranslated(message)}
			<div class="mt-2 border-t {borderClass} pt-2">
				<div class="text-sm opacity-80">
					<strong>Translation:</strong>
					{message.translatedContent}
				</div>
				{#if message.romanization}
					<div class="mt-1 text-xs opacity-60">
						<strong>Romanization:</strong>
						{message.romanization}
					</div>
				{/if}
				{#if message.pinyin}
					<div class="mt-1 text-xs opacity-60">
						<strong>Pinyin:</strong>
						{message.pinyin}
					</div>
				{/if}
				{#if message.hiragana}
					<div class="mt-1 text-xs opacity-60">
						<strong>Hiragana:</strong>
						{message.hiragana}
					</div>
				{/if}
				{#if message.katakana}
					<div class="mt-1 text-xs opacity-60">
						<strong>Katakana:</strong>
						{message.katakana}
					</div>
				{/if}
				{#if message.kanji}
					<div class="mt-1 text-xs opacity-60">
						<strong>Kanji:</strong>
						{message.kanji}
					</div>
				{/if}
				{#if message.hangul}
					<div class="mt-1 text-xs opacity-60">
						<strong>Hangul:</strong>
						{message.hangul}
					</div>
				{/if}
			</div>
		{/if}

		<!-- Translation button -->
		<div class="mt-2 flex justify-end">
			<button
				class="btn btn-ghost btn-xs"
				onclick={handleTranslation}
				disabled={translationLoading}
			>
				{#if translationLoading}
					<span class="loading loading-xs loading-spinner"></span>
				{:else if isMessageTranslated(message)}
					{showTranslation ? 'Hide' : 'Show'} Translation
				{:else}
					Translate
				{/if}
			</button>
		</div>
	</div>
	<div class="chat-footer opacity-50">{footerText}</div>
</div>
