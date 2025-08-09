<script lang="ts">
	import type { Message } from '$lib/kernel/index.js';
	import { formatTimestamp } from '$lib/utils/index.js';

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
		class="max-h-96 w-full max-w-2xl space-y-3 overflow-y-auto rounded-lg bg-white p-4 shadow-md {isCompact
			? 'text-sm'
			: ''}"
	>
		{#each messages as message, i (message.timestamp + message.role)}
			<div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}">
				<div
					class="max-w-xs rounded-lg px-4 py-3 transition-all hover:shadow-sm lg:max-w-md {message.role ===
					'user'
						? 'bg-blue-500 text-white'
						: 'border border-gray-200 bg-gray-100 text-gray-800'}"
				>
					<div class="mb-1 flex items-center justify-between">
						<p class="text-xs font-medium opacity-75">
							{message.role === 'user' ? 'You' : 'AI Tutor'}
						</p>
						{#if !isCompact}
							<span class="text-xs opacity-50">
								{formatTimestamp(message.timestamp)}
							</span>
						{/if}
					</div>
					<p class="leading-relaxed">{message.content}</p>
				</div>
			</div>
		{/each}
	</div>
{:else}
	<div class="py-8 text-center text-gray-500">
		<p class="text-lg">👋 Ready to start your first conversation?</p>
		<p class="mt-2 text-sm">Click the microphone button below to begin speaking</p>
	</div>
{/if}
