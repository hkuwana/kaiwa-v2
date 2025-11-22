<!-- src/routes/demo/language-showcase/+page.svelte -->
<!-- Demo page for the new LanguageScenarioShowcase component -->
<script lang="ts">
	import LanguageScenarioShowcase from '$lib/components/LanguageScenarioShowcase.svelte';
	import { settingsStore } from '$lib/stores/settings.store.svelte';
</script>

<svelte:head>
	<title>Language & Scenario Showcase | Kaiwa</title>
	<meta
		name="description"
		content="Choose your language and explore featured scenarios with Kaiwa"
	/>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-base-200 to-base-300 py-12">
	<div class="container mx-auto px-4">
		<!-- Header -->
		<div class="mb-12 text-center">
			<h1 class="mb-4 text-4xl font-bold text-base-content sm:text-5xl">
				Start Your Language Journey
			</h1>
			<p class="text-lg text-base-content/70">
				Pick a language you want to practice and explore our featured conversation scenarios
			</p>
		</div>

		<!-- Main Showcase Component -->
		<LanguageScenarioShowcase />

		<!-- CTA Section -->
		{#if settingsStore.selectedLanguage}
			<div class="mt-12 text-center">
				<button class="btn btn-primary btn-lg shadow-lg">
					Start Learning {settingsStore.selectedLanguage.name}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 7l5 5m0 0l-5 5m5-5H6"
						/>
					</svg>
				</button>
				<p class="mt-4 text-sm text-base-content/60">
					🎯 Your scenario will automatically adapt to your skill level
				</p>
			</div>
		{:else}
			<div class="mt-12 text-center">
				<div class="alert alert-info mx-auto max-w-md shadow-lg">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						class="h-6 w-6 shrink-0 stroke-current"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						></path>
					</svg>
					<span>Choose a language above to get started!</span>
				</div>
			</div>
		{/if}

		<!-- Features Grid -->
		<div class="mt-16 grid gap-6 md:grid-cols-3">
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body items-center text-center">
					<div class="text-4xl">🎯</div>
					<h3 class="card-title">Choose Language</h3>
					<p class="text-base-content/70">
						Pick from 17+ languages with native speakers and multiple dialects
					</p>
				</div>
			</div>

			<div class="card bg-base-100 shadow-xl">
				<div class="card-body items-center text-center">
					<div class="text-4xl">🎪</div>
					<h3 class="card-title">Explore Scenarios</h3>
					<p class="text-base-content/70">
						Browse through featured scenarios that adapt to your level automatically
					</p>
				</div>
			</div>

			<div class="card bg-base-100 shadow-xl">
				<div class="card-body items-center text-center">
					<div class="text-4xl">🚀</div>
					<h3 class="card-title">Start Speaking</h3>
					<p class="text-base-content/70">
						Jump into real conversations and build confidence from day one
					</p>
				</div>
			</div>
		</div>

		<!-- Debug Info (only in development) -->
		{#if import.meta.env.DEV}
			<div class="mt-12">
				<div class="collapse collapse-arrow bg-base-200">
					<input type="checkbox" />
					<div class="collapse-title text-sm font-medium text-base-content/50">
						🔧 Debug Info (Dev Only)
					</div>
					<div class="collapse-content">
						<pre class="text-xs">{JSON.stringify(
								{
									selectedLanguage: settingsStore.selectedLanguage,
									selectedSpeaker: settingsStore.selectedSpeaker
								},
								null,
								2
							)}</pre>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
