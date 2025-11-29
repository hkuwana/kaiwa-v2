<script lang="ts">
	import type { BlogPost } from '$lib/blog/utils/blogProcessor.js';
	import { createBlogJsonLd, formatDate } from '$lib/blog/utils/blogProcessor.js';
	import { createBreadcrumbJsonLd } from '$lib/seo/jsonld';

	const { post, relatedPosts = [] } = $props<{
		post: BlogPost;
		relatedPosts?: BlogPost[];
	}>();

	// Calculate reading time if not provided
	const readTime = post.metadata.readTime || '5 min read';

	const baseUrl = 'https://trykaiwa.com';
	const postUrl = `${baseUrl}/blog/${post.slug}`;

	const _jsonLd = createBlogJsonLd(post.metadata, postUrl);

	// Create breadcrumb navigation
	// eslint-disable-next-line unused-imports/no-unused-vars
	const breadcrumbJsonLd = createBreadcrumbJsonLd(
		[
			{ name: 'Home', url: '/' },
			{ name: 'Blog', url: '/blog' },
			{ name: post.metadata.title, url: `/blog/${post.slug}` }
		],
		baseUrl
	);
</script>

<svelte:head>
	<script type="application/ld+json">
		{@html JSON.stringify(_jsonLd)}
	</script>
	<script type="application/ld+json">
		{@html JSON.stringify(breadcrumbJsonLd)}
	</script>
</svelte:head>

<article class="container mx-auto max-w-4xl px-4 py-8">
	<!-- Header with metadata -->
	<header class="mb-12 border-b-2 border-base-300 pb-8">
		<div class="mb-6">
			<div class="mb-4 flex flex-wrap items-center gap-4 text-sm text-base-content/60">
				<time class="font-medium">
					{formatDate(post.metadata.date)}
				</time>
				<span>•</span>
				<span>{readTime}</span>
				{#if post.metadata.author}
					<span>•</span>
					<span>By {post.metadata.author}</span>
				{/if}
			</div>

			{#if post.metadata.tags && post.metadata.tags.length > 0}
				<div class="mb-4 flex flex-wrap gap-2">
					{#each post.metadata.tags as tag (tag)}
						<span class="badge badge-outline badge-sm">{tag}</span>
					{/each}
				</div>
			{/if}
		</div>

		<h1 class="mb-4 text-4xl leading-tight font-bold text-base-content">{post.metadata.title}</h1>

		{#if post.metadata.excerpt}
			<p class="mb-6 text-xl leading-relaxed font-medium text-base-content/70">
				{post.metadata.excerpt}
			</p>
		{/if}
	</header>

	<!-- Markdown content with custom styling -->
	<main
		class="prose-lg prose-headings:font-bold prose-headings:text-base-content prose-p:text-base-content/90 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-code:text-primary prose-code:bg-base-200 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-blockquote:border-l-primary prose-blockquote:bg-base-200/50 prose-blockquote:pl-6 prose-blockquote:py-2 mb-12 prose max-w-none"
	>
		{@render post.content()}
	</main>

	<!-- Related Posts -->
	{#if relatedPosts.length > 0}
		<section class="mb-8 border-t border-base-300 pt-8">
			<h2 class="mb-6 text-2xl font-bold text-base-content">Related Posts</h2>
			<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{#each relatedPosts as relatedPost (relatedPost.slug)}
					<div class="card bg-base-100 shadow-md transition-shadow hover:shadow-lg">
						<div class="card-body p-4">
							<h3 class="card-title text-lg">
								<a href="/blog/{relatedPost.slug}" class="link-hover">
									{relatedPost.metadata.title}
								</a>
							</h3>
							{#if relatedPost.metadata.excerpt}
								<p class="mb-2 text-sm text-base-content/70">
									{relatedPost.metadata.excerpt.slice(0, 100)}...
								</p>
							{/if}
							<div class="text-xs text-base-content/60">
								{formatDate(relatedPost.metadata.date)}
							</div>
						</div>
					</div>
				{/each}
			</div>
		</section>
	{/if}

	<!-- Footer -->
	<footer class="border-t border-base-300 pt-8">
		<div class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
			<a href="/blog" class="btn gap-2 btn-outline btn-sm"> ← Back to Blog </a>

			<div class="flex items-center gap-4 text-sm text-base-content/60">
				{#if post.metadata.author}
					<span>Written by {post.metadata.author}</span>
				{/if}
				<time>
					{formatDate(post.metadata.date)}
				</time>
			</div>
		</div>
	</footer>
</article>
