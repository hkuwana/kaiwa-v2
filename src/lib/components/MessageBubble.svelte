<!-- src/lib/components/MessageBubble.svelte -->
<script lang="ts">
	import type { Message } from '$lib/types/conversation';

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

<div class="message-bubble {isUser ? 'user' : 'ai'}">
	<div class="message-header">
		<span class="role-indicator">
			{isUser ? '👤 You' : '🤖 AI'}
		</span>
		<span class="timestamp">{formattedTime}</span>
	</div>

	<div class="message-content">
		{message.content}
	</div>
</div>

<style>
	.message-bubble {
		margin: 1rem 0;
		padding: 1rem;
		border-radius: 16px;
		max-width: 80%;
		position: relative;
		animation: messageSlideIn 0.3s ease-out;
	}

	@keyframes messageSlideIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.message-bubble.user {
		background: #3b82f6;
		color: white;
		margin-left: auto;
		border-bottom-right-radius: 4px;
	}

	.message-bubble.ai {
		background: #f8fafc;
		color: #1e293b;
		border: 1px solid #e2e8f0;
		margin-right: auto;
		border-bottom-left-radius: 4px;
	}

	.message-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
	}

	.role-indicator {
		font-weight: 600;
		opacity: 0.9;
	}

	.timestamp {
		opacity: 0.7;
		font-size: 0.75rem;
	}

	.message-content {
		line-height: 1.5;
		word-wrap: break-word;
	}

	/* Mobile responsiveness */
	@media (max-width: 640px) {
		.message-bubble {
			max-width: 90%;
			padding: 0.75rem;
		}

		.message-header {
			font-size: 0.75rem;
		}

		.timestamp {
			font-size: 0.625rem;
		}
	}
</style>
