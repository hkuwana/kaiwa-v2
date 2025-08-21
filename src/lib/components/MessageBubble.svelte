<!-- src/lib/components/MessageBubble.svelte -->
<script lang="ts">
	import type { Message } from '$lib/server/db/types';

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
	<div class="chat chat-end">
		<div class="chat-image avatar">
			<div class="w-10 rounded-full">
				<img
					alt="User avatar"
					src="https://img.daisyui.com/images/profile/demo/anakeen@192.webp"
				/>
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
	<div class="chat chat-start">
		<div class="chat-image avatar">
			<div class="w-10 rounded-full">
				<img
					alt="AI avatar"
					src="https://img.daisyui.com/images/profile/demo/kenobee@192.webp"
				/>
			</div>
		</div>
		<div class="chat-header">
			AI Assistant
			<time class="text-xs opacity-50">{formattedTime}</time>
		</div>
		<div class="chat-bubble">{message.content}</div>
		<div class="chat-footer opacity-50">Delivered</div>
	</div>
{/if}
