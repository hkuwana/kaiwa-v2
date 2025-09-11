<script lang="ts">
	import { enhance } from '$app/forms';
	import posthog from 'posthog-js';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { userManager } from '$lib/stores/user.store.svelte';

	const { data } = $props();

	// Get query parameters from server dat
	const from = $derived(data.from);

	let isLogin = $state(userManager.isLoggedIn ? true : false);
	let email = $state('');
	let password = $state('');
	let error = $state('');
	let pendingAssessment: any = $state(null);

	onMount(() => {
		// Check if we have pending assessment data
		if (typeof window !== 'undefined') {
			const stored = localStorage.getItem('pendingAssessment');
			if (stored) {
				try {
					pendingAssessment = JSON.parse(stored);
				} catch (e) {
					console.warn('Failed to parse pending assessment:', e);
				}
			}
		}
	});

	const toggleMode = () => {
		isLogin = !isLogin;
		error = '';
		if (browser) {
			posthog.capture('auth_mode_toggle', {
				mode: isLogin ? 'login' : 'signup'
			});
		}
	};

	function clearPendingAssessment() {
		if (typeof window !== 'undefined') {
			localStorage.removeItem('pendingAssessment');
			pendingAssessment = null;
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-base-200 px-4 py-12 sm:px-6 lg:px-8">
	<div class="w-full max-w-md space-y-8 rounded-lg bg-base-100 p-8 shadow-lg">
		<!-- Header -->
		<div class="text-center">
			<h2 class="text-3xl font-bold">
				{isLogin ? 'Welcome back ' : 'Sign up to start conversing'}
			</h2>
			<p class="mt-2 text-sm text-base-content/70">
				{isLogin ? "Don't have an account? " : 'Already have an account? '}
				<button onclick={toggleMode} class="font-medium text-primary hover:text-primary/80">
					{isLogin ? 'Sign up' : 'Sign in'}
				</button>
			</p>
		</div>

		<!-- Assessment Data Alert -->
		{#if pendingAssessment && from === 'assessment'}
			<div class="alert alert-info">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6 shrink-0 stroke-current"
					fill="none"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<div>
					<h4 class="text-sm font-bold">Assessment Data Ready</h4>
					<div class="text-xs">Your learning profile will be saved when you create an account</div>
				</div>
			</div>
		{/if}

		<!-- Error Alert -->
		{#if error}
			<div class="alert alert-error">
				<div class="flex-1">
					<p>{error}</p>
				</div>
			</div>
		{/if}

		<!-- Form -->
		<form
			method="POST"
			action="?/{isLogin ? 'login' : 'signup'}"
			use:enhance={() => {
				if (browser) {
					posthog.capture('auth_form_submit', {
						method: isLogin ? 'login' : 'signup'
					});
				}
				return async ({ result, update }) => {
					if (result.type === 'error') {
						error = result.error.message;
						if (browser) {
							posthog.capture('auth_form_error', {
								method: isLogin ? 'login' : 'signup',
								error: result.error.message
							});
						}
					} else {
						if (browser) {
							// Pull attribution from localStorage/cookie
							let shareId: string | null = null;
							try {
								const stored = localStorage.getItem('kaiwa_attribution');
								if (stored) {
									shareId = JSON.parse(stored).shareId || null;
								}
								if (!shareId) {
									const m = document.cookie.match(/(?:^|; )kaiwa_share_id=([^;]*)/);
									shareId = m ? decodeURIComponent(m[1]) : null;
								}
							} catch {}
							let utm: any = {};
							try {
								const stored = localStorage.getItem('kaiwa_attribution');
								if (stored) utm = JSON.parse(stored).utm || {};
							} catch {}
							posthog.capture('auth_form_success', {
								method: isLogin ? 'login' : 'signup',
								share_id: shareId,
								...utm
							});
						}
						await update();
					}
				};
			}}
			class="mt-8 space-y-2"
		>
			<div class="space-y-2">
				<!-- Email -->
				<div class="form-control">
					<label class="floating-label">
						<span>Your Email</span>
						<input
							id="email"
							name="email"
							type="email"
							required
							bind:value={email}
							placeholder="example@yourmail.com"
							class="input input-md w-full"
						/>
					</label>
				</div>
				<!-- Password -->
				<div class="form-control">
					<label class="floating-label">
						<span>Password</span>
						<input
							id="password"
							name="password"
							type="password"
							required
							bind:value={password}
							placeholder="Enter your password"
							class="input input-md w-full"
						/>
					</label>
				</div>
			</div>

			<!-- Submit Button -->
			<button type="submit" class="btn w-full btn-primary">
				{isLogin ? 'Sign in' : 'Create account'}
			</button>

			<div class="divider">or</div>

			<!-- Social Login -->
			<button
				type="button"
				onclick={() => goto('/auth/google')}
				class="btn w-full gap-2 btn-secondary"
			>
				<svg class="h-5 w-5" viewBox="0 0 24 24">
					<path
						fill="currentColor"
						d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
					/>
					<path
						fill="currentColor"
						d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
					/>
					<path
						fill="currentColor"
						d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
					/>
					<path
						fill="currentColor"
						d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
					/>
				</svg>
				Continue with Google
			</button>
		</form>

		<!-- Pending Assessment Data -->
		{#if pendingAssessment}
			<div class="mt-6 rounded-lg bg-base-200 p-4">
				<h4 class="mb-2 text-sm font-semibold">Pending Assessment Data</h4>
				<div class="space-y-1 text-xs">
					<div>
						<strong>Language:</strong>
						{pendingAssessment?.targetLanguageId || 'Unknown'}
					</div>
					<div><strong>Goal:</strong> {pendingAssessment?.learningGoal || 'Unknown'}</div>
					<div>
						<strong>Speaking Level:</strong>
						{pendingAssessment?.speakingLevel || 0}/100
					</div>
					<div>
						<strong>Daily Goal:</strong>
						{pendingAssessment?.dailyGoalSeconds || 0} minutes
					</div>
				</div>
				<button class="btn mt-2 btn-outline btn-sm" onclick={clearPendingAssessment}>
					Clear Data
				</button>
			</div>
		{/if}

		<div class="mt-2 mb-4 text-center text-xs text-base-content/70">
			By continuing, you agree to our
			<a href="/terms" class="text-primary hover:underline">Terms of Service</a>
			and
			<a href="/privacy" class="text-primary hover:underline">Privacy Policy</a>.
		</div>
	</div>
</div>
