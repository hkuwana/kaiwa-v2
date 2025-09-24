<script lang="ts">
	import BlogLayout from '$lib/blog/components/BlogLayout.svelte';

	const { data } = $props();
</script>

<BlogLayout post={data.post} relatedPosts={data.relatedPosts} />
