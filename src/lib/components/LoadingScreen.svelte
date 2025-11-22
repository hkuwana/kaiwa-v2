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
	import { scenarioStore } from '$lib/stores/scenario.store.svelte';

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
	const currentScenario = $derived(scenarioStore.getSelectedScenario());

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

<div class="flex justify-center p-4 pt-8 sm:pt-20">
	<div
		class="card w-full max-w-lg animate-[slideInScale_0.6s_cubic-bezier(0.34,1.56,0.64,1)] border shadow-2xl backdrop-blur-sm {statusConfig.bgColor} {statusConfig.borderColor}"
	>
		<div class="card-body text-center">
			<!-- Speaker Avatar (Hero) - Animated -->
			{#if currentSpeaker}
				<div class="mb-4 flex flex-col items-center" in:scale={{ duration: 400, delay: 100 }}>
					<!-- Large Pulsing Avatar -->
					<div class="avatar mb-3">
						<div
							class="w-24 rounded-full ring-4 ring-primary/20 ring-offset-2 ring-offset-base-100 sm:w-28 {status ===
							'connecting'
								? 'animate-[breathe_2s_ease-in-out_infinite]'
								: ''}"
						>
							{#if currentSpeaker.characterImageUrl}
								<img
									alt={currentSpeaker.characterImageAlt || `Image of ${currentSpeaker.voiceName}`}
									src={currentSpeaker.characterImageUrl}
									class="object-cover"
									loading="eager"
								/>
							{:else}
								<div
									class="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/30 text-5xl"
								>
									{#if currentSpeaker.gender === 'male'}
										👨
									{:else if currentSpeaker.gender === 'female'}
										👩
									{:else}
										👤
									{/if}
								</div>
							{/if}
						</div>
					</div>

					<!-- Speaker Name -->
					<h3 class="mb-1 text-xl font-semibold text-base-content">
						{currentSpeaker.voiceName}
					</h3>
					<p class="text-sm text-base-content/60">
						{currentSpeaker.dialectName}
						{#if currentSpeaker.region}
							<span class="opacity-50">•</span>
							{currentSpeaker.region}
						{/if}
					</p>
				</div>
			{/if}

			<!-- Language & Scenario Info -->
			<div class="mb-4 space-y-2">
				{#if settingsStore.selectedLanguage}
					<div class="flex items-center justify-center gap-2 text-base-content/70">
						<span class="text-xl">{settingsStore.selectedLanguage.flag || '🌍'}</span>
						<span class="font-medium">{settingsStore.selectedLanguage.name}</span>
					</div>
				{/if}

				{#if currentScenario}
					<div class="flex items-center justify-center gap-2">
						<span class="text-sm text-base-content/60">{currentScenario.title}</span>
					</div>
				{/if}
			</div>

			<!-- Divider -->
			<div class="divider my-2"></div>

			<!-- Premium Headphone Guide -->
			<div class="mb-4 flex justify-center">
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
					class="space-y-3 pt-2"
					in:fly={{ y: 20, duration: 300 }}
					out:fly={{ y: -20, duration: 150 }}
				>
					<!-- Status Title and Message -->
					<div class="space-y-1 text-center">
						<h3 class="text-lg font-semibold {statusConfig.color}">
							{statusConfig.title}
						</h3>

						<p class="text-sm text-base-content/70">
							{statusConfig.message}
						</p>
					</div>
				</div>
			{/if}

			<!-- Loading Progress (always visible when connecting) -->
			{#if status === 'connecting'}
				<div class="w-full px-4 py-3">
					<progress
						class="progress w-full progress-info"
						value={(currentStepIndex + 1) * 25}
						max="100"
						in:scale={{ duration: 300 }}
					></progress>
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

	/* Breathing animation for avatar - like connecting via phone */
	@keyframes breathe {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.08);
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
