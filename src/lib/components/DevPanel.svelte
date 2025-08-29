<!-- src/lib/components/DevPanel.svelte -->
<script lang="ts">
	import { dev } from '$app/environment';

	interface Props {
		status: string;
		messagesCount: number;
		audioLevel: number;
		isGuestUser: boolean;
		hasAnalysisResults: boolean;
		isAnalyzing: boolean;
		timeInSeconds: number;
		position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
	}

	let {
		status,
		messagesCount,
		audioLevel,
		isGuestUser,
		hasAnalysisResults,
		isAnalyzing,
		timeInSeconds,
		position = 'bottom-right'
	}: Props = $props();

	// Only show in dev mode
	let shouldShow = $derived(dev);

	// Position classes
	let positionClasses = $derived(
		{
			'top-right': 'top-4 right-4',
			'top-left': 'top-4 left-4',
			'bottom-right': 'bottom-4 right-4',
			'bottom-left': 'bottom-4 left-4'
		}[position]
	);
</script>

{#if shouldShow}
	<div class="pointer-events-none fixed z-50 {positionClasses} max-w-full sm:max-w-none">
		<div
			class="pointer-events-auto card border border-warning/30 bg-warning/10 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl"
		>
			<div class="card-body p-3">
				<div class="mb-2 flex items-center gap-2 border-b border-warning/30 pb-2">
					<span
						class="rounded bg-warning px-2 py-1 text-xs font-bold tracking-wider text-warning-content uppercase"
						>DEV</span
					>
					<span class="text-xs font-semibold text-warning">Debug Info</span>
				</div>

				<div class="space-y-1 font-mono text-xs">
					<div class="flex items-center justify-between gap-2">
						<span class="font-medium text-base-content/70">Status:</span>
						<span class="min-w-8 rounded bg-base-300 px-2 py-1 text-center text-base-content"
							>{status}</span
						>
					</div>

					<div class="flex items-center justify-between gap-2">
						<span class="font-medium text-base-content/70">Messages:</span>
						<span class="min-w-8 rounded bg-base-300 px-2 py-1 text-center text-base-content"
							>{messagesCount}</span
						>
					</div>

					<div class="flex items-center justify-between gap-2">
						<span class="font-medium text-base-content/70">Audio:</span>
						<span class="min-w-8 rounded bg-base-300 px-2 py-1 text-center text-base-content"
							>{audioLevel.toFixed(2)}</span
						>
					</div>

					<div class="flex items-center justify-between gap-2">
						<span class="font-medium text-base-content/70">Guest:</span>
						<span class="min-w-8 rounded bg-base-300 px-2 py-1 text-center text-base-content"
							>{isGuestUser ? 'Yes' : 'No'}</span
						>
					</div>

					<div class="flex items-center justify-between gap-2">
						<span class="font-medium text-base-content/70">Analysis:</span>
						<span class="min-w-8 rounded bg-base-300 px-2 py-1 text-center text-base-content"
							>{hasAnalysisResults ? 'Yes' : 'No'}</span
						>
					</div>

					<div class="flex items-center justify-between gap-2">
						<span class="font-medium text-base-content/70">Analyzing:</span>
						<span class="min-w-8 rounded bg-base-300 px-2 py-1 text-center text-base-content"
							>{isAnalyzing ? 'Yes' : 'No'}</span
						>
					</div>

					<div class="flex items-center justify-between gap-2">
						<span class="font-medium text-base-content/70">Time Left:</span>
						<span class="min-w-8 rounded bg-base-300 px-2 py-1 text-center text-base-content"
							>{Math.floor(timeInSeconds / 60)}:{(timeInSeconds % 60)
								.toString()
								.padStart(2, '0')}</span
						>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
