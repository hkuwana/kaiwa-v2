<script lang="ts">
	const { data } = $props();
</script>

<svelte:head>
	<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "BlogPosting",
			"headline": data.metadata.title,
			"description": data.metadata.description,
			"author": {
				"@type": "Organization",
				"name": data.metadata.author || "Kaiwa Team"
			},
			"datePublished": data.metadata.date,
			"image": `https://kaiwa.app/og-image.png`
		}
	</script>
</svelte:head>

{#if data.content}
	<article class="container mx-auto max-w-4xl px-4 py-8">
		<!-- Header with metadata -->
		<header class="mb-12 border-b-2 border-base-300 pb-8">
			<div class="mb-6">
				<div class="mb-4 flex flex-wrap items-center gap-4 text-sm text-base-content/60">
					<time class="font-medium">
						{new Date(data.metadata.date).toLocaleDateString('en-US', {
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
						{new Date(data.metadata.date).toLocaleDateString('en-US', {
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

<style>
	:global(.prose) {
		color: inherit;
		max-width: none;
	}

	:global(.prose h1) {
		font-size: 2rem;
		font-weight: 700;
		margin-top: 2rem;
		margin-bottom: 1rem;
		color: inherit;
	}

	:global(.prose h2) {
		font-size: 1.5rem;
		font-weight: 600;
		margin-top: 2rem;
		margin-bottom: 1rem;
		color: inherit;
	}

	:global(.prose h3) {
		font-size: 1.25rem;
		font-weight: 600;
		margin-top: 1.5rem;
		margin-bottom: 0.75rem;
		color: inherit;
	}

	:global(.prose p) {
		margin-bottom: 1.5rem;
		line-height: 1.7;
		color: inherit;
	}

	:global(.prose ul, .prose ol) {
		margin-bottom: 1.5rem;
		padding-left: 1.5rem;
	}

	:global(.prose li) {
		margin-bottom: 0.5rem;
		line-height: 1.6;
	}

	:global(.prose a) {
		color: #3b82f6;
		text-decoration: underline;
		text-decoration-color: #3b82f6;
		text-underline-offset: 2px;
		transition: all 0.2s ease;
	}

	:global(.prose a:hover) {
		color: #2563eb;
		text-decoration-color: #2563eb;
	}

	:global(.prose blockquote) {
		border-left: 4px solid #e5e7eb;
		padding-left: 1rem;
		margin: 1.5rem 0;
		font-style: italic;
		color: #6b7280;
	}

	:global(.prose code) {
		background: #f3f4f6;
		padding: 0.125rem 0.25rem;
		border-radius: 0.25rem;
		font-size: 0.875em;
		font-weight: 600;
		color: #1f2937;
	}

	:global(.prose pre) {
		background: #1f2937;
		color: #f9fafb;
		padding: 1rem;
		border-radius: 0.5rem;
		margin: 1.5rem 0;
		overflow-x: auto;
	}

	:global(.prose pre code) {
		background: none;
		padding: 0;
		color: inherit;
		font-weight: normal;
	}

	:global(.prose img) {
		border-radius: 0.5rem;
		margin: 2rem 0;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	:global(.prose hr) {
		border: none;
		border-top: 1px solid #e5e7eb;
		margin: 2rem 0;
	}
</style>
