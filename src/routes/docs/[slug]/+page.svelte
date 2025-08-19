<script lang="ts">
	import { page } from '$app/state';
	import { error } from '@sveltejs/kit';

	// Get the slug from the URL
	const slug = page.params.slug;

	// The DocContent will be loaded by the +page.js load function
	const { data } = $props();
</script>

<svelte:head>
	<title>{data.title || slug} - Kaiwa Docs</title>
	<meta name="description" content={data.description || `Documentation for ${slug}`} />
</svelte:head>

{#if data.content}
	<div class="container mx-auto max-w-4xl px-4 py-8">
		<!-- Header with metadata -->
		<header class="mb-12 border-b-2 border-base-300 pb-8">
			{#if data.title}
				<h1 class="mb-4 text-4xl leading-tight font-bold text-base-content">{data.title}</h1>
			{/if}

			{#if data.description}
				<p class="mb-6 text-xl leading-relaxed text-base-content/70">{data.description}</p>
			{/if}

			{#if data.metadata?.author || data.metadata?.date}
				<div class="mb-4 flex gap-4 text-sm text-base-content/60">
					{#if data.metadata?.author}
						<span>By {data.metadata.author}</span>
					{/if}
					{#if data.metadata?.date}
						<span>{new Date(data.metadata.date).toLocaleDateString()}</span>
					{/if}
				</div>
			{/if}

			{#if data.metadata?.tags && data.metadata.tags.length > 0}
				<div class="flex flex-wrap gap-2">
					{#each data.metadata.tags as tag}
						<span class="badge badge-outline badge-sm">{tag}</span>
					{/each}
				</div>
			{/if}
		</header>

		<!-- Markdown content with custom styling -->
		<main class="mb-12">
			{@render data.content()}
		</main>

		<!-- Footer -->
		<footer class="border-t border-base-300 pt-8">
			<div class="flex justify-start">
				<a href="/docs" class="btn gap-2 btn-link btn-sm"> ← Back to Docs </a>
			</div>
		</footer>
	</div>
{:else}
	<div class="container mx-auto max-w-4xl px-4 py-8">
		<div class="alert alert-info">
			<svg class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
			<span>Loading document...</span>
		</div>
	</div>
{/if}
