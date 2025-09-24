<script lang="ts">
	import LoadingScreen from '$lib/components/LoadingScreen.svelte';

	interface Props {
		error: string | null;
		onRetry: () => void;
		onPermissionGranted?: () => void;
		onSkipAudio?: () => void;
	}

	const { error, onRetry, onPermissionGranted, onSkipAudio }: Props = $props();
</script>

<LoadingScreen status="connecting" {error} {onRetry} {onPermissionGranted} {onSkipAudio} />
