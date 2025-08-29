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

<div class="container mx-auto px-4" in:fade={{ duration: 300 }}>
	<LoadingScreen {status} {audioLevel} {error} {onRetry} />
</div>
