<script>
	import { page } from '$app/state';
	// @ts-ignore
	
	// Get the current page data
	const { data, children } = $props();


	
	// Dynamic navigation will be handled by the main docs page
	let currentDoc = $state('');
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
			<a href="/docs" class="btn text-xl font-bold text-primary btn-ghost"> 📚 Kaiwa Docs </a>
		</div>

		{#if currentDoc}
			<div class="navbar-center">
				<div class="breadcrumbs text-sm">
					<ul>
						<li><a href="/docs" class="link link-primary">Home</a></li>
						<li class="text-base-content/70">{currentDoc.replace(/_/g, ' ').replace(/-/g, ' ')}</li>
					</ul>
				</div>
			</div>
		{/if}
	</nav>



	<main class="">
		{@render children()}
	</main>
</div>
