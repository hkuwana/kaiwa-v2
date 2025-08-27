<!-- src/lib/components/LoadingScreen.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { fly, fade, scale } from 'svelte/transition';
	import { settingsStore } from '$lib/stores/settings.store.svelte';
	import { capitalizeFirstLetter } from '$lib/utils';
	import AudioVisualizer from './AudioVisualizer.svelte';
	import type { conversationStatus } from '$lib/stores/conversation.store.svelte';

	const {
		status = 'connecting',
		audioLevel = 0,
		error = null,
		onRetry = () => {}
	} = $props<{
		status?: typeof conversationStatus;
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
				return {
					title: 'Connection Error',
					message: error || 'Failed to connect to your language tutor',
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
</script>

<div class="flex min-h-[70vh] items-center justify-center p-4">
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
						with {capitalizeFirstLetter(selectedSpeaker)}
					</div>
				{/if}
			</div>

			<!-- Audio Visualizer with Pulsing Animation -->
			<div class="mb-6 flex justify-center">
				<div class="relative">
					<!-- Pulsing background effect -->
					<div
						class="absolute inset-0 scale-110 animate-ping rounded-full opacity-20"
						class:bg-info={status === 'connecting'}
						class:bg-success={status === 'connected'}
						class:bg-error={status === 'error'}
					></div>

					<!-- Audio visualizer -->
					<div class="relative z-10 p-4">
						{#if status === 'connected'}
							<AudioVisualizer {audioLevel} />
						{:else}
							<!-- Custom loading animation for connecting state -->
							<div class="flex h-16 w-16 items-center justify-center">
								<div
									class="loading loading-lg loading-ring {status === 'error'
										? 'text-error'
										: 'text-primary'}"
								></div>
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Dynamic Status Content -->
			{#if showContent}
				<div
					class="space-y-4"
					in:fly={{ y: 20, duration: 300 }}
					out:fly={{ y: -20, duration: 150 }}
				>
					<!-- Status Icon and Title -->
					<div class="space-y-2">
						{#if status === 'connecting'}
							<div class="text-4xl" in:scale={{ duration: 300 }}>
								{currentStep.icon}
							</div>
						{/if}

						<h3 class="text-xl font-semibold {statusConfig.color}">
							{statusConfig.title}
						</h3>
						<p class="text-base-content/70">
							{statusConfig.message}
						</p>
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
					<div class="flex items-start gap-3">
						<div class="text-xl">💡</div>
						<div class="flex-1 text-left">
							<h4 class="font-medium text-base-content/90">Pro Tip</h4>
							{#if showContent}
								<p
									class="mt-1 text-sm text-base-content/70"
									in:fade={{ duration: 300, delay: 150 }}
									out:fade={{ duration: 150 }}
								>
									{statusConfig.tip}
								</p>
							{/if}
						</div>
					</div>
				</div>
			</div>

			<!-- Error Actions -->
			{#if status === 'error'}
				<div class="mt-6 space-y-3">
					<button
						onclick={onRetry}
						class="btn btn-outline btn-error"
						in:scale={{ duration: 300, delay: 200 }}
					>
						Try Again
					</button>
					<button onclick={() => (window.location.href = '/')} class="btn btn-ghost btn-sm">
						Back to Home
					</button>
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
