<script lang="ts">
	import { SvelteDate } from 'svelte/reactivity';

	const { data } = $props();

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'BlogPosting',
		headline: data.metadata.title,
		description: data.metadata.description,
		author: {
			'@type': 'Organization',
			name: data.metadata.author ?? 'Kaiwa Team'
		},
		datePublished: data.metadata.date,
		image: 'https://kaiwa.app/og-image.png'
	};
</script>

<svelte:head>
	<script type="application/ld+json">
JSON.stringify(jsonLd)
	</script>
</svelte:head>

{#if data.content}
	<article class="container mx-auto max-w-4xl px-4 py-8">
		<!-- Header with metadata -->
		<header class="mb-12 border-b-2 border-base-300 pb-8">
			<div class="mb-6">
				<div class="mb-4 flex flex-wrap items-center gap-4 text-sm text-base-content/60">
					<time class="font-medium">
						{new SvelteDate(data.metadata.date).toLocaleDateString('en-US', {
							year: 'numeric',
							month: 'long',
							day: 'numeric'
						})}
					</time>
					<span>•</span>
					<span>{data.metadata.readTime}</span>
					{#if data.metadata.author}
						<span>•</span>
						<span>By {data.metadata.author}</span>
					{/if}
				</div>

				{#if data.metadata.tags && data.metadata.tags.length > 0}
					<div class="mb-4 flex flex-wrap gap-2">
						{#each data.metadata.tags as tag}
							<span class="badge badge-outline badge-sm">{tag}</span>
						{/each}
					</div>
				{/if}
			</div>

			<h1 class="mb-4 text-4xl leading-tight font-bold text-base-content">{data.metadata.title}</h1>

			{#if data.metadata.excerpt}
				<p class="mb-6 text-xl leading-relaxed font-medium text-base-content/70">
					{data.metadata.excerpt}
				</p>
			{/if}
		</header>

		<!-- Markdown content with custom styling -->
		<main class="prose-lg mb-12 prose max-w-none">
			{@render data.content()}
		</main>

		<!-- Footer -->
		<footer class="border-t border-base-300 pt-8">
			<div class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<a href="/blog" class="btn gap-2 btn-outline btn-sm"> ← Back to Blog </a>

				<div class="flex items-center gap-4 text-sm text-base-content/60">
					{#if data.metadata.author}
						<span>Written by {data.metadata.author}</span>
					{/if}
					<time>
						{new SvelteDate(data.metadata.date).toLocaleDateString('en-US', {
							year: 'numeric',
							month: 'long',
							day: 'numeric'
						})}
					</time>
				</div>
			</div>
		</footer>
	</article>
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
			<span>Loading blog post...</span>
		</div>
	</div>
{/if}
