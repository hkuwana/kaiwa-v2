<script lang="ts">
	const { data } = $props();
</script>

<svelte:head>
	<title>Documentation - Kaiwa</title>
	<meta
		name="description"
		content="Comprehensive documentation for Kaiwa v2, including architecture, API reference, deployment guides, and more."
	/>
</svelte:head>

<div class="container mx-auto max-w-7xl px-4 py-8">
	<header class="mb-12 text-center">
		<h1 class="mb-4 text-5xl font-bold text-base-content">Kaiwa Documentation</h1>
		<p class="mx-auto max-w-2xl text-xl text-base-content/70">
			Comprehensive guides and references for developers building with Kaiwa v2
		</p>
	</header>

	<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
		{#each data.docs as doc}
			<a href={doc.path} class="card bg-base-100 shadow-lg transition-all hover:shadow-xl hover:-translate-y-1">
				<div class="card-body">
					<div class="flex items-start gap-4">
						<div class="text-3xl">📚</div>
						<div class="flex-1">
							<h3 class="card-title text-lg font-semibold text-base-content">{doc.title}</h3>
							<p class="text-base-content/70">{doc.description}</p>
						</div>
						<div class="text-2xl text-base-content/50 transition-colors group-hover:text-primary">→</div>
					</div>
				</div>
			</a>
		{/each}
	</div>
</div>
