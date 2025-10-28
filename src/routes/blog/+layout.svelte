<script>
	import { page } from '$app/state';

	// Get the current page data
	const { children } = $props();

	// Dynamic navigation will be handled by the main blog page
	let currentPost = $state('');
	$effect(() => {
		if (page.url.pathname.startsWith('/blog/')) {
			const pathParts = page.url.pathname.split('/');
			currentPost = pathParts[2] || '';
		}
	});
</script>

<svelte:head>
	<title>Kaiwa Blog — Daily Language Practice Tips & Conversation Insights</title>
	<meta
		name="description"
		content="Learn how to master language conversation in 5 minutes a day. Expert insights on daily practice habits, scenario-based learning, and building speaking confidence with your AI language partner."
	/>
</svelte:head>

<div class="min-h-screen bg-base-100">
	<nav class="navbar bg-base-200 shadow-sm">
		<div class="navbar-start">
			<a href="/blog" class="btn text-xl font-bold text-primary btn-ghost"> ✍️ Kaiwa Blog </a>
		</div>

		{#if currentPost}
			<div class="navbar-center">
				<div class="breadcrumbs text-sm">
					<ul>
						<li><a href="/blog" class="link link-primary">Blog</a></li>
						<li class="text-base-content/70">
							{currentPost.replace(/_/g, ' ').replace(/-/g, ' ')}
						</li>
					</ul>
				</div>
			</div>
		{/if}

		<div class="navbar-end">
			<a href="/" class="btn btn-ghost btn-sm"> ← Home </a>
		</div>
	</nav>

	<main>
		{@render children()}
	</main>
</div>
