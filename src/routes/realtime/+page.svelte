<script lang="ts">
	import RealtimeConversation from '$lib/features/conversation/components/RealtimeConversation.svelte';

	const { data } = $props();
</script>

<svelte:head>
	<title>Real-time Conversation - Kaiwa</title>
	<meta name="description" content="Practice languages in real-time with AI" />
</svelte:head>

<RealtimeConversation
	language={data.defaultLanguage}
	voice={data.defaultVoice}
	autoStart={data.autoStartConversation}
/>
