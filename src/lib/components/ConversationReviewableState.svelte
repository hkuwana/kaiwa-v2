<script lang="ts">
	import type { Message } from '$lib/server/db/types';
	import type { Language } from '$lib/server/db/types';
	import MessageBubble from './MessageBubble.svelte';
	import { audioStore } from '$lib/stores/audio.store.svelte';
	import { userManager } from '$lib/stores/user.store.svelte';
	import ShareKaiwa from '$lib/components/ShareKaiwa.svelte';
	import { track } from '$lib/analytics/posthog';

	interface Props {
		messages: Message[];
		language: Language;
		onStartNewConversation: () => void;
		onAnalyzeConversation: () => void;
		onGoHome: () => void;
	}

	const { messages, language, onStartNewConversation, onAnalyzeConversation, onGoHome } = $props();

	const audioLevel = $derived(audioStore.getCurrentLevel());

	// Filter out placeholder messages for display
	const displayMessages = $derived(
		messages.filter(
			(message: Message) =>
				message.content &&
				message.content.trim().length > 0 &&
				!message.content.includes('[Speaking...]') &&
				!message.content.includes('[Transcribing...]')
		)
	);

	// Group messages by role for better organization
	const userMessages = $derived(displayMessages.filter((m: Message) => m.role === 'user'));
	const assistantMessages = $derived(
		displayMessages.filter((m: Message) => m.role === 'assistant')
	);

	const isFree = $derived(userManager.isFree);

	function handleUpsellClick() {
		track('upsell_banner_clicked', { source: 'conversation_review', tier: userManager.effectiveTier });
		window.location.href = '/pricing?utm_source=app&utm_medium=upsell&utm_campaign=early_backer';
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-base-100 to-base-200">
	<div class="container mx-auto max-w-4xl px-4 py-8">
		<!-- Header -->
		<div class="mb-8 text-center">
			<div class="mb-4 flex justify-center">
				<div class="badge gap-2 badge-lg badge-success">
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 13l4 4L19 7"
						/>
					</svg>
					Conversation Complete
				</div>
			</div>
			<div class="mb-2 text-3xl font-bold">Review Your Conversation</div>
			<p class="text-lg text-base-content/70">
				Take a look at your {language.name} conversation and decide what to do next
			</p>
		</div>

		<!-- Action Buttons -->
		<div class="mb-8 flex flex-wrap justify-center gap-4">
			<button class="btn gap-2 btn-lg btn-primary" onclick={onAnalyzeConversation}>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
					/>
				</svg>
				Analyze & Get Results
			</button>

			<button class="btn gap-2 btn-outline btn-lg" onclick={onStartNewConversation}>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 6v6m0 0v6m0-6h6m-6 0H6"
					/>
				</svg>
				Start New Conversation
			</button>

			<button class="btn gap-2 btn-ghost btn-lg" onclick={onGoHome}>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
					/>
				</svg>
				Go Home
			</button>
		</div>

		<!-- Conversation Summary -->
		<div class="mb-8 rounded-lg bg-base-100 p-6 shadow-lg">
			<h2 class="mb-4 text-xl font-semibold">Conversation Summary</h2>
			<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
				<div class="stat">
					<div class="stat-title">Total Messages</div>
					<div class="stat-value text-primary">{displayMessages.length}</div>
				</div>
				<div class="stat">
					<div class="stat-title">Your Messages</div>
					<div class="stat-value text-secondary">{userMessages.length}</div>
				</div>
				<div class="stat">
					<div class="stat-title">Tutor Responses</div>
					<div class="stat-value text-accent">{assistantMessages.length}</div>
				</div>
			</div>
		</div>

		<!-- Upsell + Share -->
		<div class="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
			{#if isFree}
				<div class="rounded-2xl border border-base-300/60 bg-base-100/70 p-6 shadow-sm">
					<div class="mb-2 text-lg font-semibold">Early‑backer Plus</div>
					<p class="mb-4 text-base-content/70">Support the mission and unlock more practice time — $5/mo for 12 months.</p>
					<button class="btn btn-primary" onclick={handleUpsellClick}>Support + Unlock</button>
				</div>
			{/if}
			<div>
				<ShareKaiwa source="conversation_review" />
			</div>
		</div>

		<!-- Messages Display -->
		<div class="rounded-lg bg-base-100 p-6 shadow-lg">
			<h2 class="mb-6 text-xl font-semibold">Your Conversation</h2>

			{#if displayMessages.length > 0}
				<div class="space-y-4">
					{#each displayMessages as message (message.id)}
						<MessageBubble {message} conversationLanguage={language?.code} />
					{/each}
				</div>
			{:else}
				<div class="text-center text-base-content/50">
					<svg class="mx-auto mb-4 h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

		<!-- Bottom Action Bar -->
		<div class="mt-8 flex justify-center">
			<div class="flex gap-4">
				<button class="btn btn-primary" onclick={onAnalyzeConversation}>
					Get Your Learning Profile
				</button>
				<button class="btn btn-outline" onclick={onStartNewConversation}> Practice More </button>
			</div>
		</div>
	</div>
</div>
