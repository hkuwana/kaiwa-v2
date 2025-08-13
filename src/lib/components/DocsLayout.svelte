<script lang="ts">
	export let title = '';
	export let description = '';
	export let author = '';
	export let date = '';
	export let tags: string[] = [];
	export let layout = 'default';

	// Get metadata from frontmatter
	export let metadata = {};
</script>

<div class="container mx-auto max-w-4xl px-4 py-8">
	<!-- Header -->
	<header class="mb-12 border-b-2 border-base-300 pb-8">
		{#if title}
			<h1 class="mb-4 text-4xl font-bold text-base-content leading-tight">{title}</h1>
		{/if}

		{#if description}
			<p class="mb-6 text-xl text-base-content/70 leading-relaxed">{description}</p>
		{/if}

		{#if author || date}
			<div class="mb-4 flex gap-4 text-sm text-base-content/60">
				{#if author}
					<span>By {author}</span>
				{/if}
				{#if date}
					<span>{new Date(date).toLocaleDateString()}</span>
				{/if}
			</div>
		{/if}

		{#if tags && tags.length > 0}
			<div class="flex gap-2 flex-wrap">
				{#each tags as tag}
					<span class="badge badge-outline badge-sm">{tag}</span>
				{/each}
			</div>
		{/if}
	</header>

	<!-- Content -->
	<main class="prose prose-lg max-w-none mb-12">
		<slot />
	</main>

	<!-- Footer -->
	<footer class="border-t border-base-300 pt-8">
		<div class="flex justify-start">
			<a href="/docs" class="btn btn-link btn-sm gap-2">
				← Back to Docs
			</a>
		</div>
	</footer>
</div>

<style>
	/* Global styles for markdown content */
	:global(.prose h1) {
		@apply text-3xl font-bold text-base-content mt-12 mb-6 pb-2 border-b-2 border-base-300;
	}

	:global(.prose h2) {
		@apply text-2xl font-semibold text-base-content mt-10 mb-4;
	}

	:global(.prose h3) {
		@apply text-xl font-semibold text-base-content mt-8 mb-3;
	}

	:global(.prose h4) {
		@apply text-lg font-semibold text-base-content mt-6 mb-2;
	}

	:global(.prose p) {
		@apply mb-6 leading-relaxed;
	}

	:global(.prose ul, .prose ol) {
		@apply mb-6 pl-8;
	}

	:global(.prose li) {
		@apply mb-2 leading-relaxed;
	}

	:global(.prose code) {
		@apply bg-base-200 text-error px-2 py-1 rounded font-mono text-sm font-medium;
	}

	:global(.prose pre) {
		@apply bg-neutral text-neutral-content p-6 rounded-lg overflow-x-auto my-6 border border-neutral-focus;
	}

	:global(.prose pre code) {
		@apply bg-transparent text-inherit p-0 font-normal;
	}

	:global(.prose blockquote) {
		@apply border-l-4 border-primary bg-primary/10 p-6 my-6 rounded-r-lg text-primary-content;
	}

	:global(.prose blockquote p) {
		@apply mb-0;
	}

	:global(.prose table) {
		@apply w-full border-collapse my-6 border border-base-300 rounded-lg overflow-hidden;
	}

	:global(.prose th, .prose td) {
		@apply border border-base-300 p-3 text-left;
	}

	:global(.prose th) {
		@apply bg-base-200 font-semibold text-base-content;
	}

	:global(.prose tr:nth-child(even)) {
		@apply bg-base-200;
	}

	:global(.prose a) {
		@apply text-primary font-medium transition-colors;
	}

	:global(.prose a:hover) {
		@apply text-primary-focus underline;
	}

	:global(.prose img) {
		@apply max-w-full h-auto rounded-lg my-6;
	}

	:global(.prose hr) {
		@apply border-none border-t-2 border-base-300 my-8;
	}
</style>
