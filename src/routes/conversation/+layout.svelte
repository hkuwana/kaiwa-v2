<script lang="ts">
	import { page } from '$app/state';
	import { conversationStore } from '$lib/stores/conversation.store.svelte';
	import Navigation from '$lib/components/Navigation.svelte';

    let { children, data } = $props();
    
	// Get conversation status to determine if we should hide navigation
	let status = $derived(conversationStore.status);
	let messages = $derived(conversationStore.messages);

	// Hide navigation when in active conversation states
	let shouldHideNavigation = $derived(
		(status === 'connected' || status === 'streaming') && messages.length > 0
	);
</script>

{#if !shouldHideNavigation}
	<Navigation />
{/if}

{@render children?.()}
