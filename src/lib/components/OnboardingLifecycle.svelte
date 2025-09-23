<script lang="ts">
	import { page } from '$app/state';

	interface LifecycleStep {
		id: string;
		title: string;
		description: string;
		path: string;
		isCompleted: boolean;
		isCurrent: boolean;
	}

	// Props
	interface Props {
		completedSteps?: string[];
		showRetentionHints?: boolean;
		variant?: 'minimal' | 'detailed' | 'floating';
	}

	let { completedSteps = [], showRetentionHints = true, variant = 'detailed' }: Props = $props();

	// Get current path from page store
	const currentPath = $derived(page.url.pathname);

	// Define the onboarding lifecycle steps
	const lifecycleSteps = $derived([
		{
			id: 'setup',
			title: 'Setup',
			description: 'Choose your scenario and language',
			icon: 'mdi--cog',
			isCompleted: completedSteps.includes('setup') || currentPath !== '/',
			isCurrent: currentPath === '/'
		},
		{
			id: 'conversation',
			title: 'Practice',
			description: 'Real conversation practice',
			icon: 'mdi--message-text',
			isCompleted: completedSteps.includes('conversation'),
			isCurrent: currentPath.startsWith('/conversation')
		},
		{
			id: 'analysis',
			title: 'Analysis',
			description: 'Personalized insights & feedback',
			icon: 'mdi--chart-line',
			isCompleted: completedSteps.includes('analysis'),
			isCurrent: currentPath.startsWith('/analysis')
		}
	]);

	const currentStepIndex = $derived(lifecycleSteps.findIndex((step) => step.isCurrent));

	const nextStep = $derived(
		currentStepIndex < lifecycleSteps.length - 1 ? lifecycleSteps[currentStepIndex + 1] : null
	);

	const progressPercentage = $derived(((currentStepIndex + 1) / lifecycleSteps.length) * 100);

	// Retention messages based on current step
	const retentionMessages = {
		setup: "Don't worry, the conversation is just 5 minutes!",
		conversation: 'Almost done! Your personalized analysis is being prepared...',
		analysis: "🎉 You've reached the wow moment! Share your results."
	};

	const currentRetentionMessage = $derived(
		lifecycleSteps[currentStepIndex]?.id
			? retentionMessages[lifecycleSteps[currentStepIndex].id as keyof typeof retentionMessages]
			: null
	);
</script>

{#if variant === 'minimal'}
	<!-- Minimal Progress Bar -->
	<div class="h-2 w-full rounded-full bg-base-200">
		<div
			class="h-2 rounded-full bg-primary transition-all duration-500"
			style="width: {progressPercentage}%"
		></div>
	</div>
	<div class="mt-1 text-center text-xs text-base-content/60">
		Step {currentStepIndex + 1} of {lifecycleSteps.length}
	</div>
{:else if variant === 'floating'}
	<!-- Floating Widget -->
	<div class="fixed right-4 bottom-4 z-50 max-w-sm">
		<div class="card border border-primary/20 bg-base-100 shadow-xl">
			<div class="card-body p-4">
				<div class="mb-2 flex items-center justify-between">
					<h4 class="text-sm font-semibold">Your Progress</h4>
					<div class="text-xs font-medium text-primary">
						{Math.round(progressPercentage)}%
					</div>
				</div>

				<div class="mb-3 h-2 w-full rounded-full bg-base-200">
					<div
						class="h-2 rounded-full bg-primary transition-all duration-500"
						style="width: {progressPercentage}%"
					></div>
				</div>

				{#if nextStep && showRetentionHints}
					<div class="text-xs text-base-content/70">
						<strong>Next:</strong>
						{nextStep.title} - {nextStep.description}
					</div>
				{/if}

				{#if currentRetentionMessage && showRetentionHints}
					<div class="mt-2 flex items-center gap-1 text-xs font-medium text-primary">
						<span class="icon-[mdi--lightbulb] h-3 w-3"></span>
						{currentRetentionMessage}
					</div>
				{/if}
			</div>
		</div>
	</div>
{:else}
	<!-- Detailed View -->
	<div class="mx-auto w-full max-w-4xl">
		<!-- Progress Header -->
		<div class="mb-6">
			<div class="mb-2 flex items-center justify-between">
				<h3 class="text-lg font-semibold">Learning Journey</h3>
				<div class="text-sm font-medium text-primary">
					{Math.round(progressPercentage)}% Complete
				</div>
			</div>

			<div class="h-3 w-full rounded-full bg-base-200">
				<div
					class="h-3 rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-700"
					style="width: {progressPercentage}%"
				></div>
			</div>
		</div>

		<!-- DaisyUI Steps -->
		<ul class="steps steps-vertical mb-6 w-full lg:steps-horizontal">
			{#each lifecycleSteps as step}
				<li
					class="step {step.isCompleted
						? 'step-primary'
						: step.isCurrent
							? 'step-secondary'
							: 'step-neutral'}"
				>
					<div class="flex flex-col items-center gap-2 lg:flex-row lg:items-start lg:gap-4">
						<span class="icon-[{step.icon}] h-6 w-6 flex-shrink-0"></span>
						<div class="text-center lg:text-left">
							<div
								class="flex flex-wrap items-center justify-center gap-2 font-semibold lg:justify-start"
							>
								{step.title}
								{#if step.isCurrent}
									<div class="badge badge-sm badge-secondary">Current</div>
								{:else if step.isCompleted}
									<div class="badge badge-sm badge-success">Complete</div>
								{/if}
							</div>
							<div class="text-sm text-base-content/70">{step.description}</div>
						</div>
					</div>
				</li>
			{/each}
		</ul>

		<!-- Retention Messages -->
		{#if showRetentionHints && currentRetentionMessage}
			<div class="mb-6 alert alert-info">
				<svg class="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
					<path
						fill-rule="evenodd"
						d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
						clip-rule="evenodd"
					></path>
				</svg>
				<div>
					<h4 class="flex items-center gap-2 font-semibold">
						<span class="icon-[mdi--lightbulb] h-4 w-4"></span>
						Tip
					</h4>
					<p class="text-sm">{currentRetentionMessage}</p>
				</div>
			</div>
		{/if}

		<!-- Next Step Preview -->
		{#if nextStep && showRetentionHints}
			<div class="card mb-6 bg-base-200">
				<div class="card-body p-4">
					<h4 class="flex items-center gap-2 text-sm font-semibold">
						<span class="icon-[mdi--target] h-4 w-4"></span>
						Coming Up Next
					</h4>
					<p class="text-sm text-base-content/70">
						<strong>{nextStep.title}:</strong>
						{nextStep.description}
					</p>
				</div>
			</div>
		{/if}

		<!-- Completion Message -->
		{#if currentStepIndex === lifecycleSteps.length - 1}
			<div class="card border border-success/20 bg-gradient-to-r from-success/10 to-primary/10">
				<div class="card-body">
					<h4 class="card-title flex items-center gap-2 text-success">
						<span class="icon-[mdi--party-popper] h-5 w-5"></span>
						Journey Complete!
					</h4>
					<p class="text-base-content/80">
						You've experienced the full Kaiwa learning cycle. Ready to practice again or try a new
						scenario?
					</p>
				</div>
			</div>
		{/if}
	</div>
{/if}
