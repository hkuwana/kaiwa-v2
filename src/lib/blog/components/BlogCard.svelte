<script lang="ts">
	import type { BlogPost } from '$lib/blog/utils/blogProcessor.js';
	import { formatDate } from '$lib/blog/utils/blogProcessor.js';

	const { post } = $props<{ post: BlogPost }>();
</script>

<article class="card bg-base-100 shadow-xl transition-shadow duration-300 hover:shadow-2xl">
	<div class="card-body">
		<div class="mb-3 flex flex-wrap items-center gap-2 text-sm text-base-content/60">
			<time class="font-medium">
				{formatDate(post.metadata.date)}
			</time>
			{#if post.metadata.readTime}
				<span>•</span>
				<span>{post.metadata.readTime}</span>
			{/if}
			{#if post.metadata.author}
				<span>•</span>
				<span>By {post.metadata.author}</span>
			{/if}
		</div>

		<h2 class="card-title text-xl font-bold transition-colors hover:text-primary">
			<a href="/blog/{post.slug}" class="link-hover">
				{post.metadata.title}
			</a>
		</h2>

		{#if post.metadata.excerpt}
			<p class="mb-4 leading-relaxed text-base-content/80">
				{post.metadata.excerpt}
			</p>
		{/if}

		{#if post.metadata.tags && post.metadata.tags.length > 0}
			<div class="mb-4 flex flex-wrap gap-2">
				{#each post.metadata.tags as tag (tag)}
					<span class="badge badge-outline badge-sm">{tag}</span>
				{/each}
			</div>
		{/if}

		<div class="card-actions justify-end">
			<a href="/blog/{post.slug}" class="btn btn-sm btn-primary"> Read More </a>
		</div>
	</div>
</article>
