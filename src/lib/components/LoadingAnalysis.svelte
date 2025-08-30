<script lang="ts">
	import type { Message } from '$lib/server/db/types';
	import { fade } from 'svelte/transition';

	interface Props {
		messages: Message[];
		language: string;
	}

	let { messages, language }: Props = $props();

	// Filter out placeholder messages for display
	let displayMessages = $derived(
		messages.filter(
			(message) =>
				message.content &&
				message.content.trim().length > 0 &&
				!message.content.includes('[Speaking...]') &&
				!message.content.includes('[Transcribing...]')
		)
	);
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-base-100/95 backdrop-blur-sm">
	<div class="max-h-screen w-full max-w-4xl overflow-hidden rounded-lg bg-base-100 shadow-2xl">
		<!-- Header -->
		<div class="border-b border-base-200 bg-base-200/50 p-4">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div class="loading loading-md loading-spinner text-primary"></div>
					<div>
						<h2 class="text-lg font-semibold">Analyzing Your Conversation</h2>
						<p class="text-sm text-base-content/70">
							Creating your personalized learning profile...
						</p>
					</div>
				</div>
				<div class="badge badge-lg badge-primary">
					{language?.toUpperCase() || 'EN'}
				</div>
			</div>
		</div>

		<!-- Content -->
		<div class="flex h-96 flex-col lg:h-[32rem]">
			<!-- Messages Display -->
			<div class="flex-1 overflow-y-auto p-4">
				{#if displayMessages.length > 0}
					<div class="space-y-4">
						{#each displayMessages as message, index (message.id || index)}
							<div
								in:fade={{ duration: 200, delay: index * 100 }}
								class="flex gap-3 {message.role === 'user' ? 'justify-end' : 'justify-start'}"
							>
								{#if message.role === 'assistant'}
									<div
										class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-content"
									>
										<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
											<path
												fill-rule="evenodd"
												d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
												clip-rule="evenodd"
											/>
										</svg>
									</div>
								{/if}

								<div
									class="max-w-xs rounded-lg px-3 py-2 text-sm sm:max-w-md lg:max-w-lg {message.role ===
									'user'
										? 'bg-primary text-primary-content'
										: 'bg-base-200 text-base-content'}"
								>
									{message.content}
								</div>

								{#if message.role === 'user'}
									<div
										class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-base-300 text-base-content"
									>
										<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
											<path
												fill-rule="evenodd"
												d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
												clip-rule="evenodd"
											/>
										</svg>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{:else}
					<div class="flex h-full items-center justify-center">
						<div class="text-center text-base-content/50">
							<svg
								class="mx-auto mb-4 h-12 w-12"
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
							<p class="text-sm">No messages to analyze</p>
						</div>
					</div>
				{/if}
			</div>

			<!-- Progress Bar -->
			<div class="border-t border-base-200 bg-base-200/50 p-4">
				<div class="space-y-2">
					<div class="flex justify-between text-xs text-base-content/70">
						<span>Processing conversation...</span>
						<span>{displayMessages.length} messages</span>
					</div>
					<div class="h-2 w-full overflow-hidden rounded-full bg-base-300">
						<div
							class="h-full w-full animate-pulse bg-gradient-to-r from-primary via-primary/80 to-primary/60"
						></div>
					</div>
					<div class="text-center text-xs text-base-content/50">This may take a few moments...</div>
				</div>
			</div>
		</div>
	</div>
</div>
