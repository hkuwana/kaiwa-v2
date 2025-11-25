<script lang="ts">
	import { enhance } from '$app/forms';
	import posthog from 'posthog-js';
	import { browser, dev } from '$app/environment';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { userManager } from '$lib/stores/user.store.svelte';

	const { data } = $props();

	// Get query parameters from server data
	const from = $derived(data.from);
	const newsletter = $derived(data.newsletter);
	const emailAuthEnabled = dev;

	interface PendingAssessment {
		targetLanguageId?: string;
		learningGoal?: string;
		speakingLevel?: number;
		dailyGoalSeconds?: number;
	}

	let isLogin = $state(userManager.isLoggedIn ? true : false);
	let email = $state('');
	let password = $state('');
	let error = $state('');
	let pendingAssessment = $state<PendingAssessment | null>(null);
	let agreedToTerms = $state(false);
	let showEmailForm = $state(false);

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
			{#if showEmailForm}
				<p class="mt-2 text-sm text-base-content/70">
					{isLogin ? "Don't have an account? " : 'Already have an account? '}
					<button onclick={toggleMode} class="font-medium text-primary hover:text-primary/80">
						{isLogin ? 'Sign up' : 'Sign in'}
					</button>
				</p>
			{/if}
		</div>

		<!-- Assessment Data Alert -->
		{#if pendingAssessment && from === 'assessment'}
			<div class="alert alert-info">
				<span class="icon-[mdi--information-outline] h-6 w-6 shrink-0 stroke-current"></span>
				<div>
					<h4 class="text-sm font-bold">Assessment Data Ready</h4>
					<div class="text-xs">Your learning profile will be saved when you create an account</div>
				</div>
			</div>
		{/if}

		<!-- Newsletter Signup Alert -->
		{#if newsletter}
			<div class="alert alert-success">
				<span class="icon-[mdi--email-outline] h-6 w-6 shrink-0 stroke-current"></span>
				<div>
					<h4 class="text-sm font-bold">📧 Join Our Newsletter</h4>
					<div class="text-xs">
						Create an account to subscribe and get language learning tips & updates
					</div>
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

		<!-- Social Login -->
		<button
			type="button"
			onclick={() => goto('/auth/google')}
			class="btn w-full gap-2"
			style="background-color: #4285F4; color: white;"
		>
			<span class="icon-[mdi--google] h-5 w-5"></span>
			Continue with Google
		</button>

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

		<!-- Terms and Conditions Checkbox -->
		{#if !isLogin}
			<div class="form-control mt-4">
				<label class="label cursor-pointer items-start">
					<span class="label-text text-xs"
						>By signing up, I agree to the
						<a href="/terms" class="link link-primary">Terms of Service</a>
						and
						<a href="/privacy" class="link link-primary">Privacy Policy</a>.</span
					>
				</label>
			</div>
		{/if}
	</div>
</div>
