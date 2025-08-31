<!-- src/lib/components/LoadingScreen.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly, scale } from 'svelte/transition';
	import { settingsStore } from '$lib/stores/settings.store.svelte';
	import AudioVisualizer from './AudioVisualizer.svelte';
	import type { ConversationStatus } from '$lib/services/conversation.service';
	import AnimatedHeadphones from './AnimatedHeadphones.svelte';
	import { capitalize } from '$lib/utils';

	const {
		status = 'connecting',
		audioLevel = 0,
		error = null,
		onRetry = () => {}
	} = $props<{
		status?: ConversationStatus;
		audioLevel?: number;
		error?: string | null;
		onRetry?: () => void;
	}>();

	// Get current settings
	const selectedSpeaker = $derived(settingsStore.selectedSpeaker);

	// Preparation steps that cycle through during connection
	const preparationSteps = [
		{
			icon: '🎯',
			title: 'Getting ready',
			message: `Connecting to your ${settingsStore.selectedLanguage?.name || 'language'} tutor...`,
			tip: 'This may take a few moments'
		},
		{
			icon: '🤫',
			title: 'Environment check',
			message: 'Optimizing for your speaking session...',
			tip: 'Find a quiet place to practice'
		},
		{
			icon: '🗣️',
			title: 'Almost ready',
			message: 'Preparing your conversation partner...',
			tip: 'Speak naturally and take your time'
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
					tip: currentStep.tip,
					color: 'text-info',
					bgColor: 'bg-info/10',
					borderColor: 'border-info/20'
				};
			case 'connected':
				return {
					title: 'Connected!',
					message: `Ready to practice ${settingsStore.selectedLanguage?.name || 'your language'}!`,
					tip: "Start speaking when you're ready",
					color: 'text-success',
					bgColor: 'bg-success/10',
					borderColor: 'border-success/20'
				};
			case 'error':
				if (isCountryRestrictionError()) {
					return {
						title: 'Service Not Available',
						message: 'Not available in your location',
						tip: 'OpenAI services are restricted in your country/region',
						color: 'text-error',
						bgColor: 'bg-error/10',
						borderColor: 'border-error/20'
					};
				}
				return {
					title: 'Connection Error',
					message: 'Failed to connect',
					tip: 'Check your internet connection and try again',
					color: 'text-error',
					bgColor: 'bg-error/10',
					borderColor: 'border-error/20'
				};
			default:
				return {
					title: 'Preparing...',
					message: 'Setting up your session...',
					tip: '',
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

<div class="flex min-h-screen items-center justify-center p-4">
	<div
		class="card w-full max-w-lg border shadow-2xl {statusConfig.bgColor} {statusConfig.borderColor}"
	>
		<div class="card-body text-center">
			<!-- Language Header -->
			<div class="mb-6">
				<h2 class="mb-2 text-2xl font-bold text-base-content">
					Practicing {settingsStore.selectedLanguage?.name || 'Language'}
				</h2>
				{#if selectedSpeaker}
					<div class="badge badge-outline badge-lg">
						with {capitalize(selectedSpeaker)}
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

			<!-- Audio Visualizer with Pulsing Animation -->

			<!-- Dynamic Status Content -->
			{#if showContent}
				<div
					class="space-y-4 pt-4"
					in:fly={{ y: 20, duration: 300 }}
					out:fly={{ y: -20, duration: 150 }}
				>
					<!-- Status Icon and Title -->
					<div class="space-y-3 text-center">
						{#if status === 'connecting'}
							<div class="text-4xl" in:scale={{ duration: 300 }}>
								{currentStep.icon}
							</div>
						{/if}

						<h3 class="text-xl font-semibold {statusConfig.color}">
							{statusConfig.title}
						</h3>

						<!-- Status Message as Badge -->
						{#if status === 'error'}
							<div class="badge badge-lg text-sm badge-error">
								{statusConfig.message}
							</div>
						{:else}
							<p class="text-base-content/70">
								{statusConfig.message}
							</p>
						{/if}
					</div>

					<!-- Loading Progress (for connecting state) -->
					{#if status === 'connecting'}
						<div class="w-full">
							<progress
								class="progress w-full progress-info"
								value={(currentStepIndex + 1) * 25}
								max="100"
								in:scale={{ duration: 300 }}
							></progress>
							<div class="mt-2 text-xs text-base-content/50">
								Step {currentStepIndex + 1} of {preparationSteps.length}
							</div>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Tips Section -->
			<div class="mt-6">
				<div class="rounded-lg bg-base-100/50 p-4 backdrop-blur-sm">
					<div class="text-center">
						<div class="mb-3">
							{#if status === 'error' && isCountryRestrictionError()}
								<span class="text-2xl">⚠️</span>
							{:else}
								<span class="text-2xl">💡</span>
							{/if}
						</div>
						<h4 class="mb-2 font-medium text-base-content/90">
							{#if status === 'error' && isCountryRestrictionError()}
								Why is this happening?
							{:else}
								Pro Tip
							{/if}
						</h4>
						{#if showContent}
							<p
								class="text-sm text-base-content/70"
								in:fade={{ duration: 300, delay: 150 }}
								out:fade={{ duration: 150 }}
							>
								{statusConfig.tip}
							</p>
						{/if}
					</div>
				</div>
			</div>

			<!-- Error Actions -->
			{#if status === 'error'}
				<div class="mt-6 space-y-3 text-center">
					{#if isCountryRestrictionError()}
						<!-- Country Restriction Error Actions -->
						<div class="space-y-3">
							<div class="alert alert-warning">
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
										d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
									/>
								</svg>
								<span class="font-medium">Location Restriction</span>
							</div>
							<div class="space-y-2 text-sm text-gray-600">
								<p>• Use a VPN to access from a supported location</p>
								<p>• Contact us for enterprise solutions</p>
								<p>• Check back later for availability updates</p>
							</div>
							<button
								onclick={() => (window.location.href = '/')}
								class="btn btn-ghost btn-sm sm:btn-md"
							>
								Back to Home
							</button>
						</div>
					{:else}
						<!-- Regular Error Actions -->
						<div class="space-y-3 sm:space-y-0">
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
				<div class="mt-6" in:scale={{ duration: 400, delay: 200 }}>
					<div class="alert alert-success">
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
								d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<span class="font-medium">Voice chat is now active!</span>
					</div>
					<p class="mt-3 text-sm text-base-content/70">
						The AI will respond when you finish speaking
					</p>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	/* Enhanced animations */
	.card {
		backdrop-filter: blur(10px);
		animation: slideInScale 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

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
