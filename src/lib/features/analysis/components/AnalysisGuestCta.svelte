<script lang="ts">
	import { goto } from '$app/navigation';
	import { fade, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	interface Props {
		sessionId?: string;
		onClose?: () => void;
		messageCount?: number;
		conversationDuration?: number;
	}

	const { sessionId, onClose, messageCount = 0, conversationDuration = 0 }: Props = $props();

	function handleGoogleSignUp() {
		// Encode sessionId in redirect URL so we can return user to analysis after auth
		const redirectUrl = sessionId ? `/analysis?sessionId=${sessionId}` : '/dashboard';
		// For Google OAuth, we need to pass the redirect to the /auth/google endpoint
		goto(`/auth/google?redirect=${encodeURIComponent(redirectUrl)}`);
	}

	function handleEmailSignUp() {
		// Encode sessionId in redirect URL so we can return user to analysis after auth
		const redirectUrl = sessionId ? `/analysis?sessionId=${sessionId}` : '/dashboard';
		// For email/password auth, go to auth page with redirect param
		goto(`/auth?redirect=${encodeURIComponent(redirectUrl)}`);
	}

	function handleClose() {
		if (onClose) {
			onClose();
		}
	}
</script>

<!-- Overlay backdrop -->
<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
	transition:fade={{ duration: 200 }}
	onclick={handleClose}
	role="button"
	tabindex="0"
	onkeydown={(e) => e.key === 'Escape' && handleClose()}
>
	<!-- CTA Card -->
	<div
		class="relative w-full max-w-lg overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-base-100 to-secondary/5 shadow-2xl"
		transition:scale={{ duration: 300, easing: cubicOut, start: 0.9 }}
		onclick={(e) => e.stopPropagation()}
		role="dialog"
		tabindex="0"
		onkeydown={(e) => e.key === 'Escape' && handleClose()}
	>
		<!-- Close button -->
		<button
			class="btn absolute top-4 right-4 z-10 btn-circle btn-ghost btn-sm"
			onclick={handleClose}
			aria-label="Close"
		>
			<span class="icon-[mdi--close] h-5 w-5"></span>
		</button>

		<!-- Content -->
		<div class="p-8 text-center">
			<!-- Icon -->
			<div class="mb-4 flex justify-center">
				<div
					class="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary"
				>
					<span class="icon-[mdi--lock] h-8 w-8 text-white"></span>
				</div>
			</div>

			<!-- Headline -->
			<h2 class="mb-2 text-2xl font-bold text-base-content">Login to Unlock In-Depth Analysis</h2>

			<!-- Subheadline -->
			<p class="mb-6 text-base-content/70">
				Great practice session! Sign up to save your progress and unlock detailed feedback on your
				conversation.
			</p>

			<!-- Stats Preview -->
			{#if messageCount > 0 || conversationDuration > 0}
				<div class="mb-6 flex justify-center gap-4">
					{#if messageCount > 0}
						<div class="rounded-lg bg-base-200 px-4 py-2">
							<div class="text-2xl font-bold text-primary">{messageCount}</div>
							<div class="text-xs text-base-content/60">Messages</div>
						</div>
					{/if}
					{#if conversationDuration > 0}
						<div class="rounded-lg bg-base-200 px-4 py-2">
							<div class="text-2xl font-bold text-secondary">{conversationDuration}m</div>
							<div class="text-xs text-base-content/60">Practice Time</div>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Benefits -->
			<div class="mb-6 space-y-3 text-left">
				<div class="flex items-start gap-3">
					                    <span class="icon-[mdi--check-circle] mt-0.5 h-5 w-5 flex-shrink-0 text-success"></span>						<div class="text-sm text-base-content/60">
							Access your conversation history from any device
						</div>
					</div>
				</div>

				<div class="flex items-start gap-3">
					<span class="icon-[mdi--check-circle] mt-0.5 h-5 w-5 flex-shrink-0 text-success"></span>
					<div>
						<div class="font-medium">Detailed Grammar & Phrase Analysis</div>
						<div class="text-sm text-base-content/60">
							Get AI-powered suggestions for your messages
						</div>
					</div>
				</div>

					<span class="icon-[mdi--check-circle] mt-0.5 h-5 w-5 flex-shrink-0 text-success"></span>
			</div>

			<!-- CTA Buttons -->
			<div class="space-y-3">
				<!-- Google Sign Up (Primary) -->
				<button class="btn btn-block btn-lg btn-primary" onclick={handleGoogleSignUp}>
					<span class="icon-[mdi--google] mr-2 h-5 w-5"></span>
					Sign Up with Google
				</button>

				<!-- Email Sign Up (Secondary) -->
				<button class="btn btn-block btn-outline btn-lg" onclick={handleEmailSignUp}>
					<span class="icon-[mdi--email] mr-2 h-5 w-5"></span>
					Sign Up with Email
				</button>
			</div>

			<!-- Secondary text -->
			<p class="mt-3 text-xs text-base-content/50">No credit card required • Takes 30 seconds</p>
		</div>

		<!-- Bottom accent -->
		<div class="h-2 bg-gradient-to-r from-primary via-secondary to-accent"></div>
	</div>
</div>
