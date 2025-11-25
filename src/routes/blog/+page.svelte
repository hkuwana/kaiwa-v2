<script lang="ts">
	import BlogList from '$lib/blog/components/BlogList.svelte';

	const { data } = $props();
</script>

<svelte:head>
	{#if data.jsonLd}
		<script type="application/ld+json">
			{@html JSON.stringify(data.jsonLd)}
		</script>
	{/if}
</svelte:head>

<BlogList {...data} />
