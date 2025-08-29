<script lang="ts">
	import { fade } from 'svelte/transition';

	interface Props {
		error: string;
		onRetry: () => void;
		onGoHome: () => void;
	}

	let { error, onRetry, onGoHome }: Props = $props();
</script>

<div class="container mx-auto max-w-2xl px-4 py-12" in:fade={{ duration: 300 }}>
	<div class="card bg-base-100 shadow-xl">
		<div class="card-body text-center">
			<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error/10">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-8 w-8 text-error"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z"
					/>
				</svg>
			</div>

			<h2 class="card-title justify-center text-2xl text-error">Connection Error</h2>

			<p class="mb-6 text-base-content/70">
				{error}
			</p>

			<div class="card-actions justify-center gap-4">
				<button onclick={onRetry} class="btn btn-primary"> Try Again </button>
				<button onclick={onGoHome} class="btn btn-outline"> Go Home </button>
			</div>
		</div>
	</div>
</div>
