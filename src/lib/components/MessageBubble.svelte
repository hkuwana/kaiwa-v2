<!-- src/lib/components/MessageBubble.svelte -->
<script lang="ts">
	import type { Message } from '$lib/server/db/types';
	import type { MessageWithTranslation } from '$lib/types/translation';
	import { settingsStore } from '$lib/stores/settings.store.svelte';
	import { translateMessage, isMessageTranslated } from '$lib/services/translation.service';
	import { translationStore } from '$lib/stores/translation.store.svelte';
	import kitsune from '$lib/assets/kitsune.webp';
	import face from '$lib/assets/Face.webp';

	const { message } = $props<{
		message: MessageWithTranslation;
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

	// Translation state
	let isHovered = $state(false);
	let swipeTriggeredShow = $state(false);
	let translationLoading = $derived(translationStore.isTranslating(message.id));
	let showTranslation = $derived(
		isHovered ||
		swipeTriggeredShow ||
		translationStore.isTranslationVisible(message.id) ||
		(message.translationMetadata !== undefined && Boolean(message.translationMetadata.translation))
	);

	async function handleTranslation() {
		if (message.translationMetadata) {
			translationStore.toggleTranslation(message.id);
			return;
		}

		translationStore.setTranslating(message.id, true);
		
		await translateMessage(
			message,
			settingsStore.selectedLanguage?.code ?? 'ja',
			'en'
		);
		
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

{#if isUser}
	<!-- User message - chat-end (right side) -->
	<div class="chat-end chat" on:mouseenter={handleMouseEnter} on:mouseleave={handleMouseLeave}>
		<div class="avatar chat-image">
			<div class="w-10 rounded-full">
				<img alt="User avatar" src={kitsune} />
			</div>
		</div>
		<div class="chat-header">
			You
			<time class="text-xs opacity-50">{formattedTime}</time>
		</div>
		<div class="chat-bubble chat-bubble-primary">
			{message.content}
			
			<!-- Translation controls -->
			{#if showTranslation && message.translationMetadata}
				<div class="mt-2 pt-2 border-t border-primary/20">
					<div class="text-sm opacity-80">
						<strong>Translation:</strong> {message.translationMetadata.translation}
					</div>
					{#if message.translationMetadata.romanization}
						<div class="text-xs opacity-60 mt-1">
							<strong>Romanization:</strong> {message.translationMetadata.romanization}
						</div>
					{/if}
					{#if message.translationMetadata.pinyin}
						<div class="text-xs opacity-60 mt-1">
							<strong>Pinyin:</strong> {message.translationMetadata.pinyin}
						</div>
					{/if}
				</div>
			{/if}
			
			<!-- Translation button -->
			<div class="mt-2 flex justify-end">
				<button
					class="btn btn-xs btn-ghost"
					on:click={handleTranslation}
					disabled={translationLoading}
				>
					{#if translationLoading}
						<span class="loading loading-spinner loading-xs"></span>
					{:else if isMessageTranslated(message)}
						{showTranslation ? 'Hide' : 'Show'} Translation
					{:else}
						Translate
					{/if}
				</button>
			</div>
		</div>
		<div class="chat-footer opacity-50">Sent</div>
	</div>
{:else}
	<!-- AI message - chat-start (left side) -->
	<div class="chat-start chat" on:mouseenter={handleMouseEnter} on:mouseleave={handleMouseLeave}>
		<div class="avatar chat-image">
			<div class="w-10 rounded-full">
				<img alt="AI avatar" src={face} />
			</div>
		</div>
		<div class="chat-header">
			{settingsStore.selectedSpeaker}
			<time class="text-xs opacity-50">{formattedTime}</time>
		</div>
		<div class="chat-bubble">
			{message.content}
			
			<!-- Translation controls -->
			{#if showTranslation && message.translationMetadata}
				<div class="mt-2 pt-2 border-t border-base-content/20">
					<div class="text-sm opacity-80">
						<strong>Translation:</strong> {message.translationMetadata.translation}
					</div>
					{#if message.translationMetadata.romanization}
						<div class="text-xs opacity-60 mt-1">
							<strong>Romanization:</strong> {message.translationMetadata.romanization}
						</div>
					{/if}
					{#if message.translationMetadata.pinyin}
						<div class="text-xs opacity-60 mt-1">
							<strong>Pinyin:</strong> {message.translationMetadata.pinyin}
						</div>
					{/if}
				</div>
			{/if}
			
			<!-- Translation button -->
			<div class="mt-2 flex justify-end">
				<button
					class="btn btn-xs btn-ghost"
					on:click={handleTranslation}
					disabled={translationLoading}
				>
					{#if translationLoading}
						<span class="loading loading-spinner loading-xs"></span>
					{:else if isMessageTranslated(message)}
						{showTranslation ? 'Hide' : 'Show'} Translation
					{:else}
						Translate
					{/if}
				</button>
			</div>
		</div>
		<div class="chat-footer opacity-50">Delivered</div>
	</div>
{/if}
