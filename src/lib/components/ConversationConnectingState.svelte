<script lang="ts">
	import LoadingScreen from './LoadingScreen.svelte';

	interface Props {
		audioLevel: number;
		error: string | null;
		onRetry: () => void;
		onPermissionGranted?: () => void;
		onSkipAudio?: () => void;
	}

	const { audioLevel, error, onRetry, onPermissionGranted, onSkipAudio }: Props = $props();
</script>

<LoadingScreen
	status="connecting"
	{audioLevel}
	{error}
	{onRetry}
	{onPermissionGranted}
	{onSkipAudio}
/>
