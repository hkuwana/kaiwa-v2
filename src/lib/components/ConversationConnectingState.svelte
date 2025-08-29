<script lang="ts">
	import LoadingScreen from './LoadingScreen.svelte';

	interface Props {
		audioLevel: number;
		error: string | null;
		onRetry: () => void;
	}

	let { audioLevel, error, onRetry }: Props = $props();
</script>

<LoadingScreen status="connecting" {audioLevel} {error} {onRetry} />
