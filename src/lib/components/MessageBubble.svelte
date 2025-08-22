<!-- src/lib/components/MessageBubble.svelte -->
<script lang="ts">
	import type { Message } from '$lib/server/db/types';
	import { settingsStore } from '$lib/stores/settings.store.svelte';
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
</script>

{#if isUser}
	<!-- User message - chat-end (right side) -->
	<div class="chat-end chat">
		<div class="avatar chat-image">
			<div class="w-10 rounded-full">
				<img alt="User avatar" src={kitsune} />
			</div>
		</div>
		<div class="chat-header">
			You
			<time class="text-xs opacity-50">{formattedTime}</time>
		</div>
		<div class="chat-bubble chat-bubble-primary">{message.content}</div>
		<div class="chat-footer opacity-50">Sent</div>
	</div>
{:else}
	<!-- AI message - chat-start (left side) -->
	<div class="chat-start chat">
		<div class="avatar chat-image">
			<div class="w-10 rounded-full">
				<img alt="AI avatar" src={face} />
			</div>
		</div>
		<div class="chat-header">
			{settingsStore.selectedSpeaker}
			<time class="text-xs opacity-50">{formattedTime}</time>
		</div>
		<div class="chat-bubble">{message.content}</div>
		<div class="chat-footer opacity-50">Delivered</div>
	</div>
{/if}
