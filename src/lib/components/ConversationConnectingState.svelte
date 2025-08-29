<script lang="ts">
	import { fade } from 'svelte/transition';
	import LoadingScreen from '$lib/components/LoadingScreen.svelte';

	interface Props {
		audioLevel: number;
		error: string | null;
		onRetry: () => void;
	}

	let { audioLevel, error, onRetry }: Props = $props();

	const status = $derived(error ? 'error' : 'connecting');
</script>

<div class="min-h-screen bg-gradient-to-br from-base-100 to-base-200" in:fade={{ duration: 300 }}>
	<div class="container mx-auto px-4">
		<LoadingScreen {status} {audioLevel} {error} {onRetry} />
	</div>
</div>
