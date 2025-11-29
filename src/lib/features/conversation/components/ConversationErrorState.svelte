<script lang="ts">
	import { fade } from 'svelte/transition';

	interface Props {
		error: string;
		onRetry: () => void;
		onGoHome: () => void;
	}

	const { error, onRetry, onGoHome }: Props = $props();
</script>

<div
	class="flex min-h-screen items-center justify-center bg-linear-to-br from-base-100 to-base-200"
>
	<div class="container mx-auto max-w-2xl px-4 py-12" in:fade={{ duration: 300 }}>
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body text-center">
				<div
					class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error/10"
				>
					<span class="icon-[mdi--alert] h-8 w-8 text-error"></span>
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
</div>
