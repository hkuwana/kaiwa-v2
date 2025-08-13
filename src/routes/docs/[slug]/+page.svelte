<script lang="ts">
	import { page } from '$app/state';
	import { error } from '@sveltejs/kit';

	// Get the slug from the URL
	const slug = page.params.slug;

	// The DocContent will be loaded by the +page.js load function
	export let data;
</script>

<svelte:head>
	<title>{data.title || slug} - Kaiwa Docs</title>
	<meta name="description" content={data.description || `Documentation for ${slug}`} />
</svelte:head>

<div class="doc-content">
	{#if data.content}
		<svelte:component this={data.content} />
	{:else}
		<div class="loading">Loading document...</div>
	{/if}
</div>

<style>
	.doc-content {
		width: 100%;
	}

	.loading {
		text-align: center;
		padding: 2rem;
		font-style: italic;
		color: #666;
	}
</style>
