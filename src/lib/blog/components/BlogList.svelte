<script lang="ts">
	import type { BlogPost } from '$lib/blog/utils/blogProcessor.js';
	import BlogCard from './BlogCard.svelte';

	const {
		posts,
		currentPage = 1,
		totalPages = 1,
		hasNextPage = false,
		hasPrevPage = false
	} = $props<{
		posts: BlogPost[];
		currentPage?: number;
		totalPages?: number;
		hasNextPage?: boolean;
		hasPrevPage?: boolean;
	}>();

	function getPageUrl(page: number): string {
		return page === 1 ? '/blog' : `/blog?page=${page}`;
	}
</script>

<div class="container mx-auto max-w-6xl px-4 py-8">
	<!-- Header -->
	<header class="mb-12 text-center">
		<h1 class="mb-4 text-4xl font-bold text-base-content">Kaiwa Blog</h1>
		<p class="text-xl text-base-content/70">
			Insights on conversation practice, language learning, and AI-powered education
		</p>
	</header>

	<!-- Blog Posts Grid -->
	{#if posts.length > 0}
		<div class="mb-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
			{#each posts as post (post.slug)}
				<BlogCard {post} />
			{/each}
		</div>

		<!-- Pagination -->
		{#if totalPages > 1}
			<div class="flex items-center justify-center gap-4">
				{#if hasPrevPage}
					<a href={getPageUrl(currentPage - 1)} class="btn btn-outline"> ← Previous </a>
				{/if}

				<div class="flex items-center gap-2">
					{#each Array(totalPages) as _, i (i)}
						{@const page = i + 1}
						{#if page === currentPage}
							<span class="btn btn-sm btn-primary">{page}</span>
						{:else if Math.abs(page - currentPage) <= 2 || page === 1 || page === totalPages}
							<a href={getPageUrl(page)} class="btn btn-ghost btn-sm">
								{page}
							</a>
						{:else if Math.abs(page - currentPage) === 3}
							<span class="text-base-content/50">...</span>
						{/if}
					{/each}
				</div>

				{#if hasNextPage}
					<a href={getPageUrl(currentPage + 1)} class="btn btn-outline"> Next → </a>
				{/if}
			</div>
		{/if}
	{:else}
		<div class="py-16 text-center">
			<div class="mb-4 text-6xl">📝</div>
			<h2 class="mb-2 text-2xl font-bold">No blog posts yet</h2>
			<p class="text-base-content/70">Check back soon for new content!</p>
		</div>
	{/if}
</div>
