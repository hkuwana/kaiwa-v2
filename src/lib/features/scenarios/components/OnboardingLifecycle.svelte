<script lang="ts">
	import { page } from '$app/state';

	// Get current path from page store
	const currentPath = $derived(page.url.pathname);

	// Simple step tracking
	const steps = $derived(() => {
		const s = [
			{ id: 'select', label: 'Select', done: currentPath !== '/', active: currentPath === '/' },
			{ id: 'practice', label: 'Practice', done: currentPath.startsWith('/analysis'), active: currentPath.startsWith('/conversation') },
			{ id: 'review', label: 'Review', done: false, active: currentPath.startsWith('/analysis') }
		];

		// Add sign up when on analysis
		if (currentPath.startsWith('/analysis')) {
			s.push({ id: 'signup', label: 'Sign Up', done: false, active: false });
		}

		return s;
	});

	const activeStep = $derived(steps().findIndex(s => s.active) + 1);
	const totalSteps = $derived(steps().length);
</script>

{#if currentPath.startsWith('/')}
	<div class="flex items-center justify-center gap-2">
		{#each steps() as step, i (step.id)}
			<div class="flex items-center gap-2">
				<!-- Step Circle -->
				<div
					class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium {step.done
						? 'bg-success text-white'
						: step.active
							? 'bg-primary text-white'
							: 'bg-base-200 text-base-content/60'}"
				>
					{i + 1}
				</div>

				<!-- Divider (except after last step) -->
				{#if i < steps().length - 1}
					<div class="w-6 h-0.5 {step.done ? 'bg-success' : 'bg-base-200'}"></div>
				{/if}
			</div>
		{/each}

		<!-- Sign Up Link -->
		{#if currentPath.startsWith('/analysis')}
			<a href="/auth" class="ml-3 text-xs font-medium text-primary hover:underline">
				Sign Up
			</a>
		{/if}
	</div>
{/if}
