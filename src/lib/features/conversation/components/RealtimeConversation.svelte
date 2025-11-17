<script lang="ts">
	import type { Language } from '$lib/server/db/types';

	interface Props {
		language: Language | null;
		voice: string | null;
		autoStart?: boolean;
	}

	const { language, voice, autoStart = false }: Props = $props();
</script>

<div class="p-8 text-center">
	<div class="mb-4 text-2xl font-bold">Real-time Conversation</div>
	<p class="mb-4 text-lg">Language: {language?.name || 'Unknown'}</p>
	<p class="mb-4 text-lg">Voice: {voice || 'Default'}</p>
	<p class="mb-4 text-lg">Auto-start: {autoStart ? 'Yes' : 'No'}</p>
	<p class="text-base-content/60">This component is under development.</p>
</div>
