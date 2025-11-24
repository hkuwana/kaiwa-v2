<script lang="ts">
	import { onMount } from 'svelte';

	let { data } = $props();

	const scenarios = data?.scenarioPrompts ?? [];

	onMount(() => {
		document.title = 'Scenario Prompts - Kaiwa Dev';
	});

	// Image generation state
	let isGenerating = $state(false);
	let generationResult = $state<{
		scenarioId: string;
		imageUrl: string;
		error?: string;
	} | null>(null);

	// Selected model
	let selectedModel = $state<'dall-e-3' | 'gpt-image-1'>('dall-e-3');

	// Individual scenario testing
	let selectedTestScenario = $state<string>(scenarios[0]?.id ?? '');
	let lastCopiedScenarioId = $state<string | null>(null);

	// Generate image for a specific scenario
	async function generateScenarioImage(
		scenarioId: string,
		model: 'dall-e-3' | 'gpt-image-1' = selectedModel
	): Promise<boolean> {
		const scenario = scenarios.find((s) => s.id === scenarioId);
		if (!scenario) {
			generationResult = {
				scenarioId,
				imageUrl: '',
				error: 'Scenario not found'
			};
			return false;
		}

		const prompt = scenario.prompt;

		isGenerating = true;
		generationResult = null;

		try {
			const response = await fetch('/dev/scenarios/generate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					scenarioId: scenario.id,
					prompt,
					model
				})
			});

			const result = await response.json();
			isGenerating = false;

			if (result.success) {
				generationResult = {
					scenarioId,
					imageUrl: result.imageUrl
				};
				return true;
			} else {
				generationResult = {
					scenarioId,
					imageUrl: '',
					error: result.error
				};
				return false;
			}
		} catch {
			isGenerating = false;
			generationResult = {
				scenarioId,
				imageUrl: '',
				error: 'Network error'
			};
			return false;
		}
	}

	// Clear results
	function clearResult() {
		generationResult = null;
	}

	// Copy prompt helper
	async function copyPrompt(prompt: string, scenarioId: string) {
		try {
			await navigator.clipboard.writeText(prompt);
			lastCopiedScenarioId = scenarioId;
			setTimeout(() => (lastCopiedScenarioId = null), 1500);
		} catch (error) {
			console.error('Copy failed', error);
		}
	}

	function getScenarioPrompt(scenarioId: string): string {
		if (!scenarioId) return 'Select a scenario to see the prompt.';
		const scenario = scenarios.find((s) => s.id === scenarioId);
		return scenario ? scenario.prompt : 'Scenario not found.';
	}
</script>

<svelte:head>
	<title>Scenario Prompts - Kaiwa Dev</title>
</svelte:head>

<div class="min-h-screen bg-base-100 p-8">
	<div class="container mx-auto max-w-4xl">
		<div class="mb-8">
			<h1 class="mb-4 text-4xl font-bold">Ghibli Background Prompts</h1>
			<p class="mb-2 text-lg opacity-75">
				Browse every active scenario, grab the Ghibli-inspired background prompt, and optionally
				test a live generation (no forced aspect ratio).
			</p>
		</div>

		<!-- Live Image Generation -->
		<section class="mb-12">
			<h2 class="mb-6 text-3xl font-bold text-success">🤖 Live Image Generation</h2>

			<!-- Model Selector -->
			<div class="card mb-6 border border-info/20 bg-base-200 p-4">
				<h3 class="mb-3 font-bold">🤖 Model Selection</h3>
				<div class="form-control">
					<label class="label cursor-pointer">
						<span class="label-text">
							<strong>DALL-E 3</strong> - Stable, widely available ($0.08 per HD image)
						</span>
						<input
							type="radio"
							name="model"
							class="radio checked:bg-blue-500"
							bind:group={selectedModel}
							value="dall-e-3"
						/>
					</label>
				</div>
				<div class="form-control">
					<label class="label cursor-pointer">
						<span class="label-text">
							<strong>GPT-Image-1</strong> - Better instruction following (Preview, variable cost)
						</span>
						<input
							type="radio"
							name="model"
							class="radio checked:bg-green-500"
							bind:group={selectedModel}
							value="gpt-image-1"
						/>
					</label>
				</div>
				<div class="mt-2 text-sm opacity-70">
					Current selection: <strong>{selectedModel}</strong>
				</div>
			</div>

			<!-- Individual Scenario Testing -->
			<div class="card mb-6 border border-success/20 bg-base-200 p-4">
				<h3 class="mb-3 font-bold">🎨 Test Individual Scenario</h3>
				<p class="mb-4 text-sm opacity-75">
					Select a scenario and generate an image to test the prompt.
				</p>

				<div class="grid gap-4 md:grid-cols-2">
					<!-- Scenario Selector -->
					<div class="form-control">
						<label class="label">
							<span class="label-text font-semibold">Select Scenario</span>
						</label>
						<select class="select-bordered select" bind:value={selectedTestScenario}>
							<option value="">Choose a scenario...</option>
							{#each scenarios as scenario (scenario.id)}
								<option value={scenario.id}>
									{scenario.title}
								</option>
							{/each}
						</select>
					</div>

					<!-- Generate Button -->
					<div class="form-control">
						<label class="label">
							<span class="label-text font-semibold">Action</span>
						</label>
						<button
							class="btn btn-success"
							disabled={isGenerating || !selectedTestScenario}
							onclick={() => {
								if (selectedTestScenario) generateScenarioImage(selectedTestScenario);
							}}
						>
							{isGenerating ? 'Generating...' : '✨ Generate Image ($0.08)'}
						</button>
					</div>
				</div>

				<!-- Prompt Preview -->
				{#if selectedTestScenario}
					<details class="collapse-arrow collapse mt-4 border border-base-300 bg-base-100">
						<summary class="collapse-title text-sm font-medium"> Preview Current Prompt </summary>
						<div class="collapse-content">
							<pre class="mt-2 overflow-x-auto rounded bg-base-300 p-4 text-xs">{getScenarioPrompt(
									selectedTestScenario
								)}</pre>
						</div>
					</details>
				{/if}
			</div>

			<button class="btn ml-2 btn-outline" onclick={clearResult} disabled={isGenerating}>
				Clear Result
			</button>

			{#if generationResult}
				<div class="mt-6">
					<h3 class="mb-4 text-2xl font-bold">Generation Result</h3>
					<div class="card border border-success/20 bg-base-200 shadow-xl">
						<div class="card-body">
							<h3 class="card-title text-lg">
								{scenarios.find((s) => s.id === generationResult.scenarioId)?.title}
							</h3>

							{#if isGenerating}
								<div class="flex items-center justify-center py-8">
									<span class="loading loading-lg loading-spinner"></span>
								</div>
							{:else if generationResult.error}
								<div class="alert alert-error">
									<p class="text-sm">❌ {generationResult.error}</p>
								</div>
							{:else if generationResult.imageUrl}
								<div class="mt-4">
									<img
										src={generationResult.imageUrl}
										alt={`Generated image for ${scenarios.find((s) => s.id === generationResult.scenarioId)?.title}`}
										class="w-full rounded-lg"
										loading="lazy"
									/>
									<div class="mt-2 flex flex-wrap gap-2">
										<button
											class="btn btn-xs btn-primary"
											onclick={() => window.open(generationResult.imageUrl, '_blank')}
										>
											📂 Open Full Size
										</button>
									</div>
								</div>
							{/if}
						</div>
					</div>
				</div>
			{/if}
		</section>

		<!-- Scenario Prompts -->
		<section class="mb-12">
			<h2 class="mb-2 text-3xl font-bold text-accent">Scenario Backgrounds</h2>
			<p class="mb-6 text-sm opacity-75">
				{scenarios.length} active scenarios loaded. Copy the Ghibli prompt and paste into your image
				tool, or test a generation above.
			</p>
			<div class="grid gap-6 md:grid-cols-2">
				{#each scenarios as item (item.title)}
					<div class="card border border-accent/20 bg-base-200 shadow-xl">
						<div class="card-body space-y-3">
							<div class="flex items-start justify-between gap-3">
								<div>
									<h3 class="card-title text-lg">{item.title}</h3>
									<p class="text-sm opacity-75">{item.description}</p>
									<div class="mt-2 flex flex-wrap gap-2 text-xs opacity-70">
										<span class="badge badge-outline">{item.role}</span>
										<span class="badge badge-outline">{item.difficulty}</span>
										{#if item.tags?.length}
											<span class="badge badge-outline">{item.tags.slice(0, 3).join(', ')}</span>
										{/if}
									</div>
								</div>
								<button
									class="btn btn-outline btn-xs"
									aria-label="Copy prompt"
									onclick={() => copyPrompt(item.prompt, item.id)}
								>
									{lastCopiedScenarioId === item.id ? 'Copied!' : 'Copy'}
								</button>
							</div>
							<div class="mt-1">
								<textarea
									class="textarea-bordered textarea h-48 w-full text-sm"
									readonly
									value={item.prompt}
								></textarea>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</section>
	</div>
</div>
