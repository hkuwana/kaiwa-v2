<script>
	import { page } from '$app/state';

	// Get the current page data
	const { data } = $props();

	// Dynamic navigation will be handled by the main docs page
	let currentDoc = '';

	$effect(() => {
		if (page.url.pathname.startsWith('/docs/')) {
			const pathParts = page.url.pathname.split('/');
			currentDoc = pathParts[2] || '';
		}
	});
</script>

<svelte:head>
	<title>Kaiwa Documentation</title>
	<meta name="description" content="Comprehensive documentation for Kaiwa v2" />
</svelte:head>

<div class="min-h-screen bg-base-100">
	<nav class="navbar bg-base-200 shadow-sm">
		<div class="navbar-start">
			<a href="/docs" class="btn btn-ghost text-xl font-bold text-primary">
				📚 Kaiwa Docs
			</a>
		</div>

		{#if currentDoc}
			<div class="navbar-center">
				<div class="text-sm breadcrumbs">
					<ul>
						<li><a href="/docs" class="link link-primary">Home</a></li>
						<li class="text-base-content/70">{currentDoc.replace(/_/g, ' ').replace(/-/g, ' ')}</li>
					</ul>
				</div>
			</div>
		{/if}
	</nav>

	<main class="flex-1">
		<slot />
	</main>
</div>
