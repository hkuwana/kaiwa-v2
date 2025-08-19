<script lang="ts">
	import type { Message } from '$lib/types/conversation';
	import { formatTimestamp } from '$lib/utils/index';

	interface Props {
		messages?: Message[];
		isCompact?: boolean;
	}

	let { messages = [], isCompact = false }: Props = $props();

	let scrollContainer = $state<HTMLElement>();

	// Auto-scroll to bottom when new messages arrive
	$effect(() => {
		if (messages.length > 0 && scrollContainer) {
			setTimeout(() => {
				if (scrollContainer) {
					scrollContainer.scrollTop = scrollContainer.scrollHeight;
				}
			}, 100);
		}
	});
</script>

{#if messages.length > 0}
	<div
		bind:this={scrollContainer}
		class="chat-start chat max-h-96 w-full max-w-2xl space-y-3 overflow-y-auto {isCompact
			? 'text-sm'
			: ''}"
	>
		{#each messages as message, i (message.timestamp + message.role)}
			{#if message.role === 'user'}
				<div class="chat-end chat">
					<div class="chat-bubble chat-bubble-primary">
						<div class="mb-1 flex items-center justify-between">
							<p class="text-xs font-medium opacity-75">You</p>
							{#if !isCompact}
								<span class="text-xs opacity-50">
									{formatTimestamp(message.timestamp)}
								</span>
							{/if}
						</div>
						<p class="leading-relaxed">{message.content}</p>
					</div>
				</div>
			{:else}
				<div class="chat-start chat">
					<div class="avatar chat-image">
						<div
							class="flex w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-content"
						>
							AI
						</div>
					</div>
					<div class="chat-bubble chat-bubble-secondary">
						<div class="mb-1 flex items-center justify-between">
							<p class="text-xs font-medium opacity-75">AI Tutor</p>
							{#if !isCompact}
								<span class="text-xs opacity-50">
									{formatTimestamp(message.timestamp)}
								</span>
							{/if}
						</div>
						<p class="leading-relaxed">{message.content}</p>
					</div>
				</div>
			{/if}
		{/each}
	</div>
{:else}
	<div class="py-8 text-center">
		<div class="hero-content text-center">
			<div class="max-w-md">
				<div class="mb-4 text-6xl">👋</div>
				<h3 class="mb-2 text-lg font-semibold">Ready to start your first conversation?</h3>
				<p class="text-sm opacity-70">Click the microphone button below to begin speaking</p>
			</div>
		</div>
	</div>
{/if}
