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

<div class="docs-container">
	<header class="docs-header">
		<h1>Kaiwa Documentation</h1>
		<p>Comprehensive guides and references for developers building with Kaiwa v2</p>
	</header>

	<div class="docs-grid">
		{#each data.docs as doc}
			<a href={doc.path} class="doc-card">
				<div class="doc-icon">📚</div>
				<div class="doc-content">
					<h3>{doc.title}</h3>
					<p>{doc.description}</p>
				</div>
				<div class="doc-arrow">→</div>
			</a>
		{/each}
	</div>
</div>

<style>
	.docs-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	.docs-header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.docs-header h1 {
		font-size: 3rem;
		color: #1f2937;
		margin-bottom: 1rem;
	}

	.docs-header p {
		font-size: 1.25rem;
		color: #6b7280;
		max-width: 600px;
		margin: 0 auto;
	}

	.docs-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
		gap: 1.5rem;
	}

	.doc-card {
		display: flex;
		align-items: center;
		padding: 1.5rem;
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 0.75rem;
		text-decoration: none;
		color: inherit;
		transition: all 0.2s ease;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.doc-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		border-color: #3b82f6;
	}

	.doc-icon {
		font-size: 2rem;
		margin-right: 1rem;
		flex-shrink: 0;
	}

	.doc-content {
		flex: 1;
	}

	.doc-content h3 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0 0 0.5rem 0;
	}

	.doc-content p {
		color: #6b7280;
		margin: 0;
		line-height: 1.5;
	}

	.doc-arrow {
		font-size: 1.5rem;
		color: #9ca3af;
		margin-left: 1rem;
		transition: color 0.2s ease;
	}

	.doc-card:hover .doc-arrow {
		color: #3b82f6;
	}

	@media (max-width: 768px) {
		.docs-container {
			padding: 1rem;
		}

		.docs-header h1 {
			font-size: 2rem;
		}

		.docs-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
