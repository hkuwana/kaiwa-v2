<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';

	const { data } = $props();

	let verificationCode = $state('');
	let error = $state('');
	let success = $state(false);
	let isSubmitting = $state(false);
	let isResending = $state(false);
	let resendCooldown = $state(0);
	let cooldownInterval: ReturnType<typeof setInterval> | null = null;

	onMount(() => {
		// Start cooldown timer if needed
		if (resendCooldown > 0) {
			cooldownInterval = setInterval(() => {
				resendCooldown--;
				if (resendCooldown <= 0) {
					if (cooldownInterval) {
						clearInterval(cooldownInterval);
					}
					cooldownInterval = null;
				}
			}, 1000);
		}

		return () => {
			if (cooldownInterval) {
				clearInterval(cooldownInterval);
			}
		};
	});

	const handleSubmit = async () => {
		if (verificationCode.length !== 6) {
			error = 'Please enter a 6-digit verification code';
			return;
		}

		isSubmitting = true;
		error = '';

		try {
			const response = await fetch('/api/users/verify-email', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ code: verificationCode })
			});

			const result = await response.json();

			if (!response.ok) {
				error = result.error || 'Failed to verify email';
				return;
			}

			success = true;
			setTimeout(() => {
				goto(resolve('/'));
			}, 2000);
		} catch {
			error = 'Network error. Please try again.';
		} finally {
			isSubmitting = false;
		}
	};

	const handleResend = async () => {
		if (resendCooldown > 0) return;

		isResending = true;
		error = '';

		try {
			const response = await fetch('/api/auth/resend-verification', {
				method: 'POST'
			});

			const result = await response.json();

			if (!response.ok) {
				error = result.error || 'Failed to resend verification code';
				return;
			}

			// Start 60-second cooldown
			resendCooldown = 60;
			cooldownInterval = setInterval(() => {
				resendCooldown--;
				if (resendCooldown <= 0) {
					if (cooldownInterval) {
						clearInterval(cooldownInterval);
					}
					cooldownInterval = null;
				}
			}, 1000);
		} catch {
			error = 'Network error. Please try again.';
		} finally {
			isResending = false;
		}
	};

	const handleCodeInput = (event: Event) => {
		const target = event.target as HTMLInputElement;
		let value = target.value.replace(/\D/g, ''); // Remove non-digits

		if (value.length > 6) {
			value = value.slice(0, 6);
		}

		verificationCode = value;
		target.value = value;

		// Auto-submit when 6 digits are entered
		if (value.length === 6) {
			handleSubmit();
		}
	};
</script>

<div class="flex min-h-screen items-center justify-center bg-base-200 px-4 py-12 sm:px-6 lg:px-8">
	<div class="w-full max-w-md space-y-8">
		<div class="text-center">
			<h1 class="text-3xl font-bold text-base-content">Verify Your Email</h1>
			<p class="mt-2 text-sm text-base-content/70">We've sent a 6-digit verification code to</p>
			<p class="font-medium text-primary">{data.user.email}</p>
		</div>

		{#if success}
			<div class="alert alert-success">
				<span class="icon-[mdi--check] h-6 w-6"></span>
				<span>Email verified successfully! Redirecting...</span>
			</div>
		{:else}
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					{#if error}
						<div class="mb-4 alert alert-error">
							<span class="icon-[mdi--close] h-6 w-6"></span>
							<span>{error}</span>
						</div>
					{/if}

					<form
						onsubmit={(e) => {
							e.preventDefault();
							handleSubmit();
						}}
						class="space-y-6"
					>
						<div class="form-control">
							<label for="verification-code" class="label">
								<span class="label-text">Verification Code</span>
							</label>
							<input
								id="verification-code"
								type="text"
								placeholder="000000"
								class="input-bordered input input-lg text-center text-2xl tracking-widest"
								maxlength="6"
								oninput={handleCodeInput}
								disabled={isSubmitting}
								autocomplete="one-time-code"
							/>
							<div class="label">
								<span class="label-text-alt">Enter the 6-digit code from your email</span>
							</div>
						</div>

						<button
							type="submit"
							class="btn w-full btn-primary"
							disabled={isSubmitting || verificationCode.length !== 6}
						>
							{#if isSubmitting}
								<span class="loading loading-sm loading-spinner"></span>
								Verifying...
							{:else}
								Verify Email
							{/if}
						</button>
					</form>

					<div class="divider">or</div>

					<div class="text-center">
						<p class="mb-3 text-sm text-base-content/70">Didn't receive the code?</p>
						<button
							type="button"
							class="btn btn-ghost btn-sm"
							onclick={handleResend}
							disabled={isResending || resendCooldown > 0}
						>
							{#if isResending}
								<span class="loading loading-sm loading-spinner"></span>
								Sending...
							{:else if resendCooldown > 0}
								Resend in {resendCooldown}s
							{:else}
								Resend Code
							{/if}
						</button>
					</div>

					<div class="mt-4 text-center">
						<a href="/auth" class="link text-sm link-primary"> ← Back to Login </a>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
