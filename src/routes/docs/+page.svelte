<script lang="ts">
	const { data } = $props();
</script>

<svelte:head>
	<title>Documentation - Kaiwa</title>
	<meta
		name="description"
		content="Comprehensive documentation for Kaiwa v2, including architecture, API reference, deployment guides, and more."
	/>
	{#if data.jsonLd}
		<script type="application/ld+json">
			{@html JSON.stringify(data.jsonLd)}
		</script>
	{/if}
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-12 sm:py-16">
	<header class="space-y-3 text-center">
		<p class="text-sm font-semibold tracking-[0.12em] text-primary/70 uppercase">Docs</p>
		<h1 class="text-4xl font-bold text-primary sm:text-5xl">Kaiwa Documentation</h1>
		<p class="mx-auto max-w-3xl text-lg text-base-content/70">
			Comprehensive guides and references for developers building with Kaiwa v2
		</p>
	</header>

	<div class="mt-10 grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 xl:grid-cols-3">
		{#each data.docs as doc (doc.slug)}
			<a
				href={doc.path}
				class="group flex h-full items-start gap-4 rounded-2xl border border-base-300 bg-base-100 p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-primary hover:shadow-xl"
			>
				<div
					class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl text-primary"
				>
					📚
				</div>
				<div class="flex-1 space-y-2">
					<div class="flex items-center justify-between gap-3">
						<h3 class="text-lg font-semibold text-base-content transition group-hover:text-primary">
							{doc.title}
						</h3>
						<span class="text-xl text-primary transition group-hover:translate-x-1">→</span>
					</div>
					<p class="text-sm text-base-content/70">{doc.description}</p>
				</div>
			</a>
		{/each}
	</div>
</div>
