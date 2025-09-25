<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	type ModuleMeta = {
		id: string;
		label: string;
		description: string;
		modality: 'text' | 'audio';
		tier?: 'free' | 'pro' | 'premium';
		requiresAudio: boolean;
	};

	let modules = $state<ModuleMeta[]>([]);
	let selectedModuleIds = $state<Set<string>>(new Set());
	let conversationId = $state('dev-conversation');
	let languageCode = $state('en');
	let messages = $state(
		[
			{
				id: 'msg-1',
				role: 'user' as const,
				content: "I'm trying to explain my plan but I keep using the wrong tense."
			},
			{
				id: 'msg-2',
				role: 'assistant' as const,
				content: 'No worries. Tell me what happened yesterday so we can fix the tense.'
			},
			{
				id: 'msg-3',
				role: 'user' as const,
				content: 'Yesterday I go to the store and buyed some ingredients.'
			}
		]
	);

	let isLoading = $state(false);
	let lastRun: any = $state(null);
	let errorMessage = $state<string | null>(null);

	onMount(async () => {
		await loadModules();
	});

	async function loadModules() {
		try {
			const response = await fetch('/api/analysis/modules');
			if (!response.ok) throw new Error('Failed to load modules');

			const data = await response.json();
			modules = data.modules;

			selectedModuleIds = new Set(modules.filter((module: ModuleMeta) => module.modality === 'text').map((module) => module.id));
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Failed to load modules';
		}
	}

	async function runAnalysis() {
		isLoading = true;
		errorMessage = null;
		lastRun = null;

		try {
			const response = await fetch('/api/analysis/run', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					conversationId,
					languageCode,
					moduleIds: Array.from(selectedModuleIds),
					messages
				})
			});

			const data = await response.json();

			if (!response.ok || !data.success) {
				throw new Error(data?.error || 'Analysis failed');
			}

			lastRun = data.run;
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Analysis failed';
		} finally {
			isLoading = false;
		}
	}

	function toggleModule(id: string) {
		const next = new Set(selectedModuleIds);
		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}
		selectedModuleIds = next;
	}

	function goToAnalysisPage() {
		goto(`/analysis?mode=full&type=regular&sessionId=${conversationId}`);
	}
</script>

<div class="min-h-screen bg-base-200 py-10">
	<div class="mx-auto max-w-5xl space-y-8 px-4">
		<header class="rounded-lg bg-base-100 p-6 shadow">
			<h1 class="text-2xl font-semibold">Analysis Pipeline Sandbox</h1>
			<p class="mt-2 text-base-content/70">
				Run the new server-side analysis pipeline with synthetic conversation data. Select modules and see
				the raw output that would feed the UI.
			</p>
		</header>

		<section class="rounded-lg bg-base-100 p-6 shadow">
			<h2 class="text-xl font-semibold">Conversation Sample</h2>
			<div class="mt-4 space-y-4">
				<label class="form-control w-full">
					<div class="label">Conversation ID</div>
					<input class="input input-bordered" bind:value={conversationId} />
				</label>
				<label class="form-control w-full">
					<div class="label">Language Code</div>
					<input class="input input-bordered" bind:value={languageCode} />
				</label>

				<div class="grid gap-4 md:grid-cols-2">
					{#each messages as message, index}
						<div class="rounded border border-base-300 bg-base-100 p-4">
							<div class="mb-2 text-xs uppercase tracking-wide text-primary">{message.role}</div>
							<textarea
								class="textarea textarea-bordered w-full"
								rows="3"
								bind:value={messages[index].content}
							></textarea>
						</div>
					{/each}
				</div>
			</div>
		</section>

		<section class="rounded-lg bg-base-100 p-6 shadow">
			<h2 class="text-xl font-semibold">Modules</h2>
			{#if modules.length === 0}
				<p class="mt-2 text-base-content/70">Loading modules…</p>
			{:else}
				<div class="mt-4 grid gap-4 md:grid-cols-2">
					{#each modules as module}
						<label class="flex cursor-pointer flex-col gap-2 rounded border border-base-300 p-4">
							<div class="flex items-center justify-between gap-3">
								<span class="font-medium">{module.label}</span>
								<input
									type="checkbox"
									class="toggle"
									checked={selectedModuleIds.has(module.id)}
									on:change={() => toggleModule(module.id)}
								/>
							</div>
							<p class="text-sm text-base-content/70">{module.description}</p>
							<div class="text-xs text-base-content/50">
								Modality: {module.modality} {module.tier ? `• Tier: ${module.tier}` : ''}
							</div>
						</label>
					{/each}
				</div>
			{/if}
		</section>

		<section class="rounded-lg bg-base-100 p-6 shadow">
			<div class="flex flex-wrap items-center gap-4">
				<button class="btn btn-primary" onclick={runAnalysis} disabled={isLoading}>
					{isLoading ? 'Running analysis…' : 'Run Analysis'}
				</button>
				<button class="btn btn-ghost" onclick={goToAnalysisPage}>Open Analysis Page</button>
			</div>

			{#if errorMessage}
				<p class="mt-4 rounded bg-error/20 p-3 text-error">{errorMessage}</p>
			{/if}

			{#if lastRun}
				<div class="mt-6 space-y-4">
					<h3 class="font-semibold">Module Results</h3>
					{#each lastRun.moduleResults as moduleResult}
						<div class="rounded border border-base-300 p-4">
							<div class="text-sm font-semibold uppercase tracking-wide text-base-content/70">
								{moduleResult.moduleId}
							</div>
							<p class="mt-2 text-base-content">{moduleResult.summary}</p>
							{#if moduleResult.recommendations?.length}
								<ul class="mt-3 list-disc space-y-1 pl-5 text-sm text-base-content/70">
									{#each moduleResult.recommendations as recommendation}
										<li>{recommendation}</li>
									{/each}
								</ul>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</section>
	</div>
</div>
