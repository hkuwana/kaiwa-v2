<script lang="ts">
	import { SvelteDate } from 'svelte/reactivity';

	const { data } = $props();
</script>

<svelte:head>
	<title>Blog - Kaiwa</title>
	<meta
		name="description"
		content="Insights, updates, and thoughts on conversation practice, language learning, and AI-powered education."
	/>
</svelte:head>

<div class="blog-container">
	<header class="blog-header">
		<h1>Kaiwa Blog</h1>
		<p>Insights on conversation practice, language learning, and AI-powered education</p>
	</header>

	{#if data.posts.length > 0}
		<div class="blog-grid">
			{#each data.posts as post}
				<article class="blog-card">
					<div class="blog-card-content">
						<div class="blog-meta">
							<time class="blog-date"
								>{new SvelteDate(post.date).toLocaleDateString('en-US', {
									year: 'numeric',
									month: 'long',
									day: 'numeric'
								})}</time
							>
							<span class="blog-read-time">{post.readTime}</span>
						</div>

						<h2 class="blog-title">
							<a href={post.path}>{post.title}</a>
						</h2>

						{#if post.excerpt}
							<p class="blog-excerpt">{post.excerpt}</p>
						{/if}

						<div class="blog-footer">
							<div class="blog-author">By {post.author}</div>

							{#if post.tags.length > 0}
								<div class="blog-tags">
									{#each post.tags as tag}
										<span class="blog-tag">{tag}</span>
									{/each}
								</div>
							{/if}
						</div>

						<a href={post.path} class="blog-read-more"> Read more → </a>
					</div>
				</article>
			{/each}
		</div>
	{:else}
		<div class="empty-state">
			<div class="empty-icon">✍️</div>
			<h2>No blog posts yet</h2>
			<p>We're working on some great content. Check back soon!</p>
		</div>
	{/if}
</div>

<style>
	.blog-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	.blog-header {
		text-align: center;
		margin-bottom: 4rem;
	}

	.blog-header h1 {
		font-size: 3rem;
		color: #1f2937;
		margin-bottom: 1rem;
		font-weight: bold;
	}

	.blog-header p {
		font-size: 1.25rem;
		color: #6b7280;
		max-width: 600px;
		margin: 0 auto;
		line-height: 1.6;
	}

	.blog-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
		gap: 2rem;
	}

	.blog-card {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 1rem;
		overflow: hidden;
		transition: all 0.3s ease;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.blog-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
		border-color: #3b82f6;
	}

	.blog-card-content {
		padding: 2rem;
	}

	.blog-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		font-size: 0.875rem;
		color: #6b7280;
	}

	.blog-date {
		font-weight: 500;
	}

	.blog-read-time {
		background: #f3f4f6;
		padding: 0.25rem 0.5rem;
		border-radius: 0.375rem;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.blog-title {
		margin: 0 0 1rem 0;
		font-size: 1.5rem;
		font-weight: 700;
		line-height: 1.3;
	}

	.blog-title a {
		color: #1f2937;
		text-decoration: none;
		transition: color 0.2s ease;
	}

	.blog-title a:hover {
		color: #3b82f6;
	}

	.blog-excerpt {
		color: #4b5563;
		line-height: 1.6;
		margin-bottom: 1.5rem;
	}

	.blog-footer {
		margin-bottom: 1.5rem;
	}

	.blog-author {
		font-size: 0.875rem;
		color: #6b7280;
		margin-bottom: 0.75rem;
		font-weight: 500;
	}

	.blog-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.blog-tag {
		background: #e0f2fe;
		color: #0369a1;
		padding: 0.25rem 0.5rem;
		border-radius: 0.375rem;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.blog-read-more {
		color: #3b82f6;
		font-weight: 600;
		text-decoration: none;
		font-size: 0.875rem;
		transition: color 0.2s ease;
	}

	.blog-read-more:hover {
		color: #2563eb;
	}

	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		color: #6b7280;
	}

	.empty-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.empty-state h2 {
		font-size: 1.5rem;
		color: #374151;
		margin-bottom: 0.5rem;
	}

	.empty-state p {
		font-size: 1rem;
		line-height: 1.5;
	}

	@media (max-width: 768px) {
		.blog-container {
			padding: 1rem;
		}

		.blog-header {
			margin-bottom: 2rem;
		}

		.blog-header h1 {
			font-size: 2rem;
		}

		.blog-grid {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}

		.blog-card-content {
			padding: 1.5rem;
		}

		.blog-meta {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}
	}
</style>
