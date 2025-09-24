<!-- src/lib/components/AudioPermissionPrompt.svelte -->
<script lang="ts">
	import { fade, fly, scale } from 'svelte/transition';
	import { audioStore } from '$lib/stores/audio.store.svelte';

	import { createUserFriendlyError } from '$lib/services/audio.service';

	const {
		onPermissionGranted = () => {},
		onSkip = () => {},
		showSkipOption = true
	} = $props<{
		onPermissionGranted?: () => void;
		onSkip?: () => void;
		showSkipOption?: boolean;
	}>();

	let isRequesting = $state(false);
	let requestError = $state<ReturnType<typeof createUserFriendlyError> | null>(null);

	// Get permission state from audio store
	const permissionState = $derived(audioStore.permissionState);
	const userFriendlyError = $derived(audioStore.userFriendlyError);

	// Determine what to show based on permission state
	const shouldShow = $derived(
		permissionState?.state === 'denied' ||
			permissionState?.state === 'prompt' ||
			permissionState?.state === 'unknown' ||
			userFriendlyError?.type === 'permission'
	);

	async function requestPermission() {
		isRequesting = true;
		requestError = null;

		try {
			const result = await audioStore.requestPermissionGracefully();

			if (result.success) {
				onPermissionGranted();
			} else {
				requestError = result.error || null;
			}
		} catch (error) {
			console.error('Permission request failed:', error);
			requestError = {
				type: 'unknown',
				title: 'Request Failed',
				message: 'Unable to request microphone permission',
				canRetry: true,
				suggestions: ['Try refreshing the page', 'Check your browser settings']
			};
		} finally {
			isRequesting = false;
		}
	}

	// Get browser-specific instructions
	function getBrowserInstructions() {
		const userAgent = navigator.userAgent.toLowerCase();

		if (userAgent.includes('chrome')) {
			return {
				browser: 'Chrome/Arc',
				steps: [
					'Look for the microphone icon in your address bar',
					'Click it and select "Always allow"',
					'If no icon appears, refresh this page first'
				]
			};
		} else if (userAgent.includes('firefox')) {
			return {
				browser: 'Firefox',
				steps: [
					'Look for the microphone icon in your address bar',
					'Click it and select "Allow"',
					'Choose "Remember this decision" if available'
				]
			};
		} else if (userAgent.includes('safari')) {
			return {
				browser: 'Safari',
				steps: [
					'Check Safari menu → Settings → Websites → Microphone',
					'Set this site to "Allow"',
					'Then refresh this page'
				]
			};
		} else {
			return {
				browser: 'Your browser',
				steps: [
					'Look for a microphone icon in your address bar',
					'Click it and allow microphone access',
					'Refresh this page if needed'
				]
			};
		}
	}

	const browserInfo = getBrowserInstructions();
	const displayError = $derived(requestError || userFriendlyError);
</script>

{#if shouldShow}
	<div
		class="card border border-warning/20 bg-warning/5 shadow-lg"
		in:fly={{ y: 20, duration: 300 }}
		out:fade={{ duration: 200 }}
	>
		<div class="card-body">
			<!-- Header -->
			<div class="mb-4 text-center">
				<div class="mb-2 text-4xl">🎤</div>
				<h3 class="text-xl font-semibold text-base-content">Microphone Access Needed</h3>
				<p class="mt-2 text-base-content/70">
					We need access to your microphone for voice conversations
				</p>
			</div>

			<!-- Permission State Info -->
			{#if permissionState}
				<div class="mb-4">
					<div class="alert {permissionState.state === 'denied' ? 'alert-warning' : 'alert-info'}">
						<div class="flex items-center gap-2">
							{#if permissionState.state === 'denied'}
								<span class="text-warning">⚠️</span>
								<span class="font-medium">Permission Denied</span>
							{:else if permissionState.state === 'prompt'}
								<span class="text-info">🔔</span>
								<span class="font-medium">Permission Required</span>
							{:else}
								<span class="text-info">❓</span>
								<span class="font-medium">Unknown Status</span>
							{/if}
						</div>
					</div>
				</div>
			{/if}

			<!-- Action Buttons -->
			<div class="mb-4 space-y-3">
				{#if permissionState?.state !== 'denied'}
					<!-- For prompt/unknown states, show request button -->
					<button
						class="btn w-full btn-primary {isRequesting ? 'loading' : ''}"
						onclick={requestPermission}
						disabled={isRequesting}
					>
						{#if isRequesting}
							Requesting Access...
						{:else}
							Request Microphone Access
						{/if}
					</button>
				{:else}
					<!-- For denied state, show manual instructions -->
					<div class="rounded-lg border bg-base-100 p-4">
						<h4 class="mb-2 flex items-center gap-2 font-medium text-base-content">
							<span class="text-sm">🔧</span>
							Manual Setup for {browserInfo.browser}
						</h4>
						<ol class="list-inside list-decimal space-y-1 text-sm text-base-content/70">
							{#each browserInfo.steps as step (step)}
								<li>{step}</li>
							{/each}
						</ol>
					</div>

					<button
						class="btn w-full btn-outline btn-primary"
						onclick={() => window.location.reload()}
					>
						I've Updated Settings - Reload Page
					</button>
				{/if}
			</div>

			<!-- Error Display -->
			{#if displayError}
				<div class="mb-4" in:scale={{ duration: 200 }}>
					<div class="alert alert-error">
						<div>
							<h4 class="font-medium">{displayError.title}</h4>
							<p class="mt-1 text-sm">{displayError.message}</p>
						</div>
					</div>

					{#if displayError.suggestions.length > 0}
						<details class="collapse-arrow collapse mt-2 bg-base-100">
							<summary class="collapse-title text-sm font-medium"> Troubleshooting Tips </summary>
							<div class="collapse-content text-sm">
								<ul class="list-inside list-disc space-y-1 text-base-content/70">
									{#each displayError.suggestions as suggestion (suggestion)}
										<li>{suggestion}</li>
									{/each}
								</ul>
							</div>
						</details>
					{/if}
				</div>
			{/if}

			<!-- Skip Option -->
			{#if showSkipOption}
				<div class="divider text-sm text-base-content/50">or</div>
				<button class="btn w-full btn-ghost btn-sm" onclick={onSkip}>
					Continue without voice (text only)
				</button>
				<p class="mt-2 text-center text-xs text-base-content/50">
					You can enable voice later in settings
				</p>
			{/if}
		</div>
	</div>
{/if}
