<script lang="ts">
	import { page } from '$app/state';

	// Props - simplified for v1
	interface Props {
		variant?: 'mobile' | 'desktop' | 'compact';
	}

	let { variant = 'mobile' }: Props = $props();

	// Get current path from page store
	const currentPath = $derived(page.url.pathname);

	// Hardcoded props for v1
	const showOnlyOnRoutes = ['/'];

	// Define the onboarding lifecycle steps with symbols and one-word labels
	const lifecycleSteps = $derived(() => {
		const baseSteps = [
			{
				id: 'select',
				title: 'Select',
				symbol: '🎯',
				isCompleted: currentPath !== '/',
				isCurrent: currentPath === '/'
			},
			{
				id: 'conversation',
				title: 'Conversation',
				symbol: '💬',
				isCompleted: currentPath.startsWith('/analysis'),
				isCurrent: currentPath.startsWith('/conversation')
			},
			{
				id: 'analysis',
				title: 'Analysis',
				symbol: '📊',
				isCompleted: false,
				isCurrent: currentPath.startsWith('/analysis')
			}
		];

		// Add sign up step when on analysis route
		if (currentPath.startsWith('/analysis')) {
			baseSteps.push({
				id: 'signup',
				title: 'Sign Up',
				symbol: '🔐',
				isCompleted: false,
				isCurrent: false
			});
		}

		return baseSteps;
	});

	const progressPercentage = $derived(
		(() => {
			const steps = lifecycleSteps();
			const completedCount = steps.filter((step) => step.isCompleted).length;
			return (completedCount / steps.length) * 100;
		})()
	);

	// Route-based visibility logic
	const shouldShow = $derived(() => {
		if (showOnlyOnRoutes.length > 0) {
			return showOnlyOnRoutes.some((route) => currentPath.startsWith(route));
		}
		return true;
	});
</script>

{#if shouldShow()}
	{#if variant === 'mobile'}
		<!-- Mobile Variant - Vertical Steps with Symbols -->
		<div class="mx-auto w-full max-w-sm">
			<ul class="steps steps-vertical w-full">
				{#each lifecycleSteps() as step (step.id)}
					<li
						class="step {step.isCompleted
							? 'step-success'
							: step.isCurrent
								? 'step-primary'
								: 'step-neutral'}"
					>
						<div class="flex items-center gap-3">
							<span class="text-xl">{step.symbol}</span>
							<div class="text-left">
								<div class="text-sm font-medium">{step.title}</div>
								{#if step.id === 'signup'}
									<a href="/auth" class="text-xs text-primary hover:underline">Get started</a>
								{/if}
							</div>
						</div>
					</li>
				{/each}
			</ul>
		</div>
	{:else if variant === 'desktop'}
		<!-- Desktop Variant - Horizontal Steps with Progress Bar -->
		<div class="mx-auto w-full max-w-2xl">
			<!-- Progress Bar -->
			<div class="mb-4">
				<div class="h-2 w-full rounded-full bg-base-200">
					<div
						class="h-2 rounded-full bg-success transition-all duration-500"
						style="width: {progressPercentage}%"
					></div>
				</div>
			</div>

			<!-- Horizontal Steps -->
			<ul class="steps steps-horizontal w-full">
				{#each lifecycleSteps() as step (step.id)}
					<li
						class="step {step.isCompleted
							? 'step-success'
							: step.isCurrent
								? 'step-primary'
								: 'step-neutral'}"
					>
						<div class="flex flex-col items-center gap-2">
							<span class="text-2xl">{step.symbol}</span>
							<div class="text-center">
								<div class="text-sm font-medium">{step.title}</div>
								{#if step.id === 'signup'}
									<a href="/auth" class="text-xs text-primary hover:underline">Get started</a>
								{/if}
							</div>
						</div>
					</li>
				{/each}
			</ul>
		</div>
	{:else if variant === 'compact'}
		<!-- Compact Variant - Minimal Icons Only -->
		<div class="flex items-center justify-center gap-4">
			{#each lifecycleSteps() as step (step.id)}
				<div
					class="flex flex-col items-center gap-1 {step.isCompleted
						? 'text-success'
						: step.isCurrent
							? 'text-primary'
							: 'text-base-content/40'}"
				>
					<span class="text-lg">{step.symbol}</span>
					<div class="text-xs font-medium">{step.title}</div>
					{#if step.id === 'signup'}
						<a href="/auth" class="text-xs text-primary hover:underline">Sign up</a>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
{/if}
