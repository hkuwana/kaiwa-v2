<script lang="ts">
	import BlogList from '$lib/blog/components/BlogList.svelte';

	const { data } = $props();
</script>

<BlogList {...data} />
