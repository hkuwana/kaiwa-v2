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

	// Detect browser for specific instructions
	function getBrowserName() {
		const ua = navigator.userAgent;
		if (ua.includes('Chrome') && !ua.includes('Edge')) return 'Chrome';
		if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
		if (ua.includes('Edge')) return 'Edge';
		if (ua.includes('Firefox')) return 'Firefox';
		return 'browser';
	}

	// Browser-specific instruction based on permission state
	function getInstruction() {
		const browserName = getBrowserName();
		if (permissionState?.state === 'denied') {
			return `Microphone is blocked. Check your browser settings to enable it and refresh.`;
		}
		if (browserName === 'Safari') {
			return 'Safari requires microphone access. You\'ll be asked to enable it in System Preferences.';
		}
		if (browserName === 'Firefox') {
			return 'Firefox will ask for microphone permission. Please allow it to continue.';
		}
		return 'Your browser will ask for microphone access. Please allow it.';
	}

	const instruction = $derived(getInstruction());
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
				<h3 class="text-lg font-semibold text-base-content">Enable Microphone</h3>
				<p class="mt-2 text-sm text-base-content/70">
					{instruction}
				</p>
			</div>

			<!-- Action Buttons -->
			<div class="space-y-2">
				{#if permissionState?.state !== 'denied'}
					<button
						class="btn w-full btn-primary {isRequesting ? 'loading' : ''}"
						onclick={requestPermission}
						disabled={isRequesting}
					>
						{#if isRequesting}
							Requesting...
						{:else}
							Enable Microphone
						{/if}
					</button>
				{:else}
					<button
						class="btn w-full btn-outline btn-primary"
						onclick={() => window.location.reload()}
					>
						Refresh
					</button>
				{/if}

				{#if showSkipOption}
					<button class="btn w-full btn-ghost btn-sm" onclick={onSkip}> Skip for now </button>
				{/if}
			</div>

			<!-- Browser Compatibility Note -->
			<div class="mt-4 rounded-lg bg-info/10 p-3 text-sm text-info">
				<p class="font-semibold">💡 Tip: Use Chrome, Firefox, or Edge for best audio performance</p>
				<p class="mt-1 text-xs opacity-80">
					Some browsers or extensions may restrict microphone access. If you're still having issues, try a different browser or check your extension settings.
				</p>
			</div>

			<!-- Error Display -->
			{#if displayError}
				<div class="mt-4" in:scale={{ duration: 200 }}>
					<div class="alert alert-error">
						<p class="text-sm">{displayError.message}</p>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
