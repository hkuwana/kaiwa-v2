<script lang="ts">
	import type { BlogPost } from '../utils/blogProcessor.js';
	import { formatDate } from '../utils/blogProcessor.js';

	const { post } = $props<{ post: BlogPost }>();
</script>

<article class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-300">
	<div class="card-body">
		<div class="flex flex-wrap items-center gap-2 text-sm text-base-content/60 mb-3">
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

		<h2 class="card-title text-xl font-bold hover:text-primary transition-colors">
			<a href="/blog/{post.slug}" class="link-hover">
				{post.metadata.title}
			</a>
		</h2>

		{#if post.metadata.excerpt}
			<p class="text-base-content/80 leading-relaxed mb-4">
				{post.metadata.excerpt}
			</p>
		{/if}

		{#if post.metadata.tags && post.metadata.tags.length > 0}
			<div class="flex flex-wrap gap-2 mb-4">
				{#each post.metadata.tags as tag}
					<span class="badge badge-outline badge-sm">{tag}</span>
				{/each}
			</div>
		{/if}

		<div class="card-actions justify-end">
			<a href="/blog/{post.slug}" class="btn btn-primary btn-sm">
				Read More
			</a>
		</div>
	</div>
</article>