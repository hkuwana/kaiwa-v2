<script lang="ts">
	import LoadingScreen from './LoadingScreen.svelte';

	interface Props {
		audioLevel: number;
		error: string | null;
		onRetry: () => void;
	}

	const { audioLevel, error, onRetry }: Props = $props();
</script>

<LoadingScreen status="connecting" {audioLevel} {error} {onRetry} />
