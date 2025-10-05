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
			<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M6 18L18 6M6 6l12 12"
				/>
			</svg>
		</button>

		<!-- Content -->
		<div class="p-8 text-center">
			<!-- Icon -->
			<div class="mb-4 flex justify-center">
				<div
					class="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary"
				>
					<svg class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
						/>
					</svg>
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
					<svg
						class="mt-0.5 h-5 w-5 flex-shrink-0 text-success"
						fill="currentColor"
						viewBox="0 0 20 20"
					>
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
							clip-rule="evenodd"
						/>
					</svg>
					<div>
						<div class="font-medium">Save Your Progress</div>
						<div class="text-sm text-base-content/60">
							Access your conversation history from any device
						</div>
					</div>
				</div>

				<div class="flex items-start gap-3">
					<svg
						class="mt-0.5 h-5 w-5 flex-shrink-0 text-success"
						fill="currentColor"
						viewBox="0 0 20 20"
					>
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
							clip-rule="evenodd"
						/>
					</svg>
					<div>
						<div class="font-medium">Detailed Grammar & Phrase Analysis</div>
						<div class="text-sm text-base-content/60">
							Get AI-powered suggestions for your messages
						</div>
					</div>
				</div>

				<div class="flex items-start gap-3">
					<svg
						class="mt-0.5 h-5 w-5 flex-shrink-0 text-success"
						fill="currentColor"
						viewBox="0 0 20 20"
					>
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
							clip-rule="evenodd"
						/>
					</svg>
					<div>
						<div class="font-medium">Track Your Growth Over Time</div>
						<div class="text-sm text-base-content/60">
							See your language skills improve with every conversation
						</div>
					</div>
				</div>
			</div>

			<!-- CTA Buttons -->
			<div class="space-y-3">
				<!-- Google Sign Up (Primary) -->
				<button class="btn btn-block btn-lg btn-primary" onclick={handleGoogleSignUp}>
					<svg class="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
						<path
							d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
						/>
						<path
							d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
						/>
						<path
							d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
						/>
						<path
							d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
						/>
					</svg>
					Sign Up with Google
				</button>

				<!-- Email Sign Up (Secondary) -->
				<button class="btn btn-block btn-outline btn-lg" onclick={handleEmailSignUp}>
					<svg class="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
						/>
					</svg>
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
