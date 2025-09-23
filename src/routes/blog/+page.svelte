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

<div class="container mx-auto max-w-5xl px-4 py-8 sm:py-12">
	<header class="mb-12 text-center">
		<h1 class="text-4xl font-bold tracking-tight text-base-content sm:text-5xl">Kaiwa Blog</h1>
		<p class="mx-auto mt-4 max-w-2xl text-lg text-base-content/70">
			Insights on conversation practice, language learning, and AI-powered education
		</p>
	</header>

	{#if data.posts.length > 0}
		<div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
			{#each data.posts as post}
				<article
					class="card-compact group card transform-gpu bg-base-100 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
				>
					<div class="card-body">
						<div class="mb-3 flex items-center justify-between text-sm text-base-content/60">
							<time class="font-medium"
								>{new SvelteDate(post.date).toLocaleDateString('en-US', {
									year: 'numeric',
									month: 'long',
									day: 'numeric'
								})}</time
							>
							<span class="badge badge-ghost badge-sm">{post.readTime}</span>
						</div>

						<h2 class="card-title text-lg leading-snug font-bold">
							<a href={post.path} class="link-primary link-hover">{post.title}</a>
						</h2>

						{#if post.excerpt}
							<p class="mt-2 text-base-content/70">{post.excerpt}</p>
						{/if}

						<div class="mt-4 card-actions items-center justify-between">
							<div class="text-sm text-base-content/60">By {post.author}</div>
							<a href={post.path} class="btn btn-link no-underline btn-sm group-hover:underline">
								Read more
								<svg
									class="h-4 w-4 transition-transform group-hover:translate-x-1"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M17 8l4 4m0 0l-4 4m4-4H3"
									></path>
								</svg>
							</a>
						</div>

						{#if post.tags.length > 0}
							<div class="mt-4 flex flex-wrap gap-2 border-t border-base-300 pt-4">
								{#each post.tags as tag}
									<span class="badge badge-outline badge-sm badge-primary">{tag}</span>
								{/each}
							</div>
						{/if}
					</div>
				</article>
			{/each}
		</div>
	{:else}
		<div class="py-16 text-center text-base-content/60">
			<div class="mb-4 text-5xl">✍️</div>
			<h2 class="text-2xl font-semibold text-base-content">No blog posts yet</h2>
			<p class="mt-2">We're working on some great content. Check back soon!</p>
		</div>
	{/if}
</div>
