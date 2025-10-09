<!-- VirtualizedMessageList.svelte - Performance optimized message display -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { Message } from '$lib/server/db/types';
	import MessageBubble from './MessageBubble.svelte';
	import { autoScrollToBottom } from '$lib/actions/auto-scroll-to-bottom';

	type VirtualizedMessage = Message & { virtualIndex: number };

	interface _Props {
		messages: Message[];
		conversationLanguage?: string;
		maxHeight?: string;
		autoScroll?: boolean;
	}

	const {
		messages,
		conversationLanguage,
		maxHeight = '50vh',
		autoScroll = true
	}: _Props = $props();

	let container = $state<HTMLDivElement | null>(null);
	let scrollPosition = $state(0);
	let containerHeight = $state(0);
	let isUserScrolling = $state(false);
	let scrollTimeout: ReturnType<typeof setTimeout>;

	// Performance: Only render visible messages for very long conversations
	const itemHeight = 80; // Approximate height per message
	const bufferSize = 5; // Extra items to render outside viewport

	let visibleMessages = $state<(Message | VirtualizedMessage)[]>(messages);

	$effect(() => {
		if (messages.length <= 50) {
			visibleMessages = messages;
			return;
		}

		const startIndex = Math.max(0, Math.floor(scrollPosition / itemHeight) - bufferSize);
		const endIndex = Math.min(
			messages.length,
			Math.ceil((scrollPosition + containerHeight) / itemHeight) + bufferSize
		);

		visibleMessages = messages.slice(startIndex, endIndex).map(
			(message: Message, index: number): VirtualizedMessage => ({
				...message,
				virtualIndex: startIndex + index
			})
		);
	});

	// Auto-scroll to bottom when new messages arrive
	function handleScroll() {
		if (!container) return;

		scrollPosition = container.scrollTop;

		// Detect if user is manually scrolling
		isUserScrolling = true;
		clearTimeout(scrollTimeout);
		scrollTimeout = setTimeout(() => {
			isUserScrolling = false;
		}, 1000);
	}

	function scrollToBottom() {
		if (container) {
			container.scrollTo({
				top: container.scrollHeight,
				behavior: 'smooth'
			});
		}
	}

	function handleResize() {
		if (container) {
			containerHeight = container.clientHeight;
		}
	}

	onMount(() => {
		if (container) {
			containerHeight = container.clientHeight;
			// Initial scroll to bottom
			setTimeout(() => scrollToBottom(), 100);
		}

		window.addEventListener('resize', handleResize);
	});

	onDestroy(() => {
		clearTimeout(scrollTimeout);
		window.removeEventListener('resize', handleResize);
	});
</script>

<div class="relative">
	{#if messages.length > 0}
		<div class="mb-3 flex items-center justify-between text-sm text-base-content/60">
			<span>{messages.length} message{messages.length === 1 ? '' : 's'}</span>
			{#if messages.length > 50}
				<span class="badge badge-sm badge-info">Optimized view</span>
			{/if}
		</div>

		<div
			bind:this={container}
			onscroll={handleScroll}
			use:autoScrollToBottom={{
				enabled: autoScroll && !isUserScrolling && messages.length > 0,
				trigger: messages[messages.length - 1]?.id,
				delayMs: 100
			}}
			class="from-base-50 relative overflow-y-auto scroll-smooth rounded-lg border border-base-300 bg-gradient-to-b to-base-100"
			style="max-height: {maxHeight};"
		>
			{#if messages.length > 50}
				<!-- Virtual scrolling for long conversations -->
				<div style="height: {messages.length * itemHeight}px; position: relative;">
					{#each visibleMessages as message (message.id)}
						{@const virtualizedMessage = message as VirtualizedMessage}
						<div
							class="absolute w-full px-4 py-2"
							style="top: {virtualizedMessage.virtualIndex * itemHeight}px; height: {itemHeight}px;"
						>
							<MessageBubble message={virtualizedMessage} {conversationLanguage} />
						</div>
					{/each}
				</div>
			{:else}
				<!-- Normal rendering for shorter conversations -->
				<div class="space-y-3 p-4">
					{#each messages as message, index (message.id)}
						<div
							class="animate-[fadeInUp_0.3s_ease-out_forwards] transition-all duration-200 ease-in-out hover:-translate-y-px"
							style="animation-delay: {Math.min(index * 50, 1000)}ms"
						>
							<MessageBubble {message} {conversationLanguage} />
						</div>
					{/each}
				</div>
			{/if}

			<!-- Scroll to bottom button -->
			{#if messages.length > 10}
				<div class="pointer-events-none sticky right-2 bottom-2 flex justify-end">
					<button
						class="btn pointer-events-auto btn-circle opacity-70 shadow-lg btn-sm btn-primary hover:opacity-100"
						onclick={scrollToBottom}
						title="Scroll to bottom"
						aria-label="Scroll to bottom"
					>
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 14l-7 7m0 0l-7-7m7 7V3"
							/>
						</svg>
					</button>
				</div>
			{/if}
		</div>
	{:else}
		<div
			class="rounded-lg border border-dashed border-base-300 py-12 text-center text-base-content/50"
		>
			<svg
				class="mx-auto mb-4 h-12 w-12 text-base-content/30"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
				/>
			</svg>
			<p class="text-sm">No messages to display</p>
		</div>
	{/if}
</div>

<style>
	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Custom scrollbar */
	:global(.overflow-y-auto) {
		scrollbar-width: thin;
		scrollbar-color: rgb(203 213 225) transparent;
	}

	:global(.overflow-y-auto::-webkit-scrollbar) {
		width: 6px;
	}

	:global(.overflow-y-auto::-webkit-scrollbar-track) {
		background: transparent;
	}

	:global(.overflow-y-auto::-webkit-scrollbar-thumb) {
		background-color: rgb(203 213 225);
		border-radius: 3px;
	}

	:global(.overflow-y-auto::-webkit-scrollbar-thumb:hover) {
		background-color: rgb(148 163 184);
	}
</style>
