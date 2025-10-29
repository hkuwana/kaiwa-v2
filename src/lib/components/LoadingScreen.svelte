<!-- src/lib/components/LoadingScreen.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { fly, scale } from 'svelte/transition';
	import { settingsStore } from '$lib/stores/settings.store.svelte';
	import type { ConversationStatus } from '$lib/services/conversation.service';
	import AnimatedHeadphones from '$lib/features/audio/components/AnimatedHeadphones.svelte';
	import AudioPermissionPrompt from '$lib/features/audio/components/AudioPermissionPrompt.svelte';
	import { getSpeakerById } from '$lib/data/speakers';
	import { audioStore } from '$lib/stores/audio.store.svelte';

	const {
		status = 'connecting',
		error = null,
		onRetry = () => {},
		onPermissionGranted = () => {},
		onSkipAudio = () => {}
	} = $props<{
		status?: ConversationStatus;
		error?: string | null;
		onRetry?: () => void;
		onPermissionGranted?: () => void;
		onSkipAudio?: () => void;
	}>();

	// Get current settings
	const selectedSpeaker = $derived(settingsStore.selectedSpeaker);
	const currentSpeaker = $derived(selectedSpeaker ? getSpeakerById(selectedSpeaker) : null);

	// Check if we should show audio permission prompt
	const shouldShowPermissionPrompt = $derived(
		status === 'connecting' &&
			audioStore.permissionState &&
			(audioStore.permissionState.state === 'denied' ||
				audioStore.permissionState.state === 'prompt' ||
				audioStore.userFriendlyError?.type === 'permission')
	);

	// Preparation steps that cycle through during connection
	const preparationSteps = [
		{
			title: 'Connecting',
			message: 'Setting up'
		},
		{
			title: 'Optimizing',
			message: 'Almost ready'
		},
		{
			title: 'Ready',
			message: 'Go ahead'
		}
	];

	let currentStepIndex = $state(0);
	let showContent = $state(true);

	// Cycle through preparation steps
	onMount(() => {
		const interval = setInterval(() => {
			if (status === 'connecting') {
				showContent = false;

				setTimeout(() => {
					currentStepIndex = (currentStepIndex + 1) % preparationSteps.length;
					showContent = true;
				}, 150); // Brief pause for transition
			}
		}, 2500);

		return () => clearInterval(interval);
	});

	const currentStep = $derived(preparationSteps[currentStepIndex]);

	const getStatusConfig = () => {
		switch (status) {
			case 'connecting':
				return {
					title: currentStep.title,
					message: currentStep.message,
					color: 'text-info',
					bgColor: 'bg-info/10',
					borderColor: 'border-info/20'
				};
			case 'connected':
				return {
					title: 'Ready',
					message: 'You can start speaking',
					color: 'text-success',
					bgColor: 'bg-success/10',
					borderColor: 'border-success/20'
				};
			case 'error':
				if (isCountryRestrictionError()) {
					return {
						title: 'Service Not Available',
						message: 'This service is not available in your region',
						color: 'text-error',
						bgColor: 'bg-error/10',
						borderColor: 'border-error/20'
					};
				}
				return {
					title: 'Connection Failed',
					message: 'Please try again',
					color: 'text-error',
					bgColor: 'bg-error/10',
					borderColor: 'border-error/20'
				};
			default:
				return {
					title: 'Preparing',
					message: 'Setting up',
					color: 'text-base-content',
					bgColor: 'bg-base-200',
					borderColor: 'border-base-300'
				};
		}
	};

	const statusConfig = $derived(getStatusConfig());

	// Check if this is a country restriction error
	function isCountryRestrictionError() {
		if (!error) return false;

		// Handle both string and object errors
		const errorMessage =
			typeof error === 'string' ? error : error.message || error.error || JSON.stringify(error);

		return (
			errorMessage.includes('Country, region, or territory not supported') ||
			errorMessage.includes('403') ||
			(errorMessage.toLowerCase().includes('country') &&
				errorMessage.toLowerCase().includes('not supported'))
		);
	}
</script>

<div class="flex justify-center p-4 pt-20">
	<div
		class="card w-full max-w-lg animate-[slideInScale_0.6s_cubic-bezier(0.34,1.56,0.64,1)] border shadow-2xl backdrop-blur-sm {statusConfig.bgColor} {statusConfig.borderColor}"
	>
		<div class="card-body text-center">
			<!-- Language Header -->
			<div class="mb-6">
				<h2 class="mb-2 text-2xl font-bold text-base-content">
					Practicing {settingsStore.selectedLanguage?.name || 'Language'}
				</h2>
				{#if currentSpeaker}
					<div class="badge badge-outline badge-lg">
						with {currentSpeaker.voiceName}
					</div>
				{/if}
			</div>

			<!-- Premium Headphone Guide -->
			<div class="mb-6 flex justify-center">
				<AnimatedHeadphones
					animation="wiggle"
					size="md"
					showTooltip={true}
					tooltipText="Use earphones for best experience"
					className="md:hidden"
				/>
				<AnimatedHeadphones
					animation="wiggle"
					size="xl"
					showTooltip={true}
					tooltipText="Use earphones for best experience"
					className="hidden md:block"
				/>
			</div>

			<!-- Audio Permission Prompt -->
			{#if shouldShowPermissionPrompt}
				<div class="mb-6">
					<AudioPermissionPrompt {onPermissionGranted} onSkip={onSkipAudio} showSkipOption={true} />
				</div>
			{/if}

			<!-- Audio Visualizer with Pulsing Animation -->

			<!-- Dynamic Status Content -->
			{#if showContent}
				<div
					class="space-y-4 pt-4"
					in:fly={{ y: 20, duration: 300 }}
					out:fly={{ y: -20, duration: 150 }}
				>
					<!-- Status Title and Message -->
					<div class="space-y-2 text-center">
						<h3 class="text-xl font-semibold {statusConfig.color}">
							{statusConfig.title}
						</h3>

						<p class="text-sm text-base-content/70">
							{statusConfig.message}
						</p>
					</div>

					<!-- Loading Progress (for connecting state) -->
					{#if status === 'connecting'}
						<div class="w-full pt-2">
							<progress
								class="progress w-full progress-info"
								value={(currentStepIndex + 1) * 25}
								max="100"
								in:scale={{ duration: 300 }}
							></progress>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Error Actions -->
			{#if status === 'error'}
				<div class="mt-6 space-y-3 text-center">
					{#if isCountryRestrictionError()}
						<!-- Country Restriction Error Actions -->
						<div class="space-y-3">
							<p class="text-sm text-gray-600">Try using a VPN</p>
							<button
								onclick={() => (window.location.href = '/')}
								class="btn btn-ghost btn-sm sm:btn-md"
							>
								Back to Home
							</button>
						</div>
					{:else}
						<!-- Regular Error Actions -->
						<div class="space-y-2 sm:space-y-0">
							<button
								onclick={onRetry}
								class="btn btn-outline btn-sm btn-error sm:btn-md"
								in:scale={{ duration: 300, delay: 200 }}
							>
								Try Again
							</button>
							<button
								onclick={() => (window.location.href = '/')}
								class="btn btn-ghost btn-sm sm:btn-md"
							>
								Back to Home
							</button>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Ready State Action -->
			{#if status === 'connected'}
				<div class="mt-4 pt-2" in:scale={{ duration: 400, delay: 200 }}>
					<p class="text-xs text-base-content/60">Speak naturally. Pause to get a response.</p>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	@keyframes slideInScale {
		from {
			opacity: 0;
			transform: translateY(30px) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	/* Smooth progress animation */
	.progress::-webkit-progress-value {
		transition: width 0.3s ease;
	}

	.progress::-moz-progress-bar {
		transition: width 0.3s ease;
	}
</style>
