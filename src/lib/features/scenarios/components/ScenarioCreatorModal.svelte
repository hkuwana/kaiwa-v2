<!-- src/lib/features/scenarios/components/ScenarioCreatorModal.svelte -->
<script lang="ts">
	import {
		customScenarioStore,
		type SaveScenarioResult
	} from '$lib/stores/custom-scenarios.store.svelte';
	import type {
		ScenarioMode,
		ScenarioVisibility
	} from '$lib/services/scenarios/user-scenarios.service';
	import { SvelteSet } from 'svelte/reactivity';

	interface Props {
		open: boolean;
		onClose: () => void;
		onScenarioCreated?: (result: SaveScenarioResult) => void;
		userMemories?: string[];
	}

	const { open, onClose, onScenarioCreated, userMemories = [] }: Props = $props();

	const mode: ScenarioMode = 'character';
	let description = $state('');
	let visibility = $state<ScenarioVisibility>('public');
	let isSaving = $state(false);
	let draftText = $state('');
	let creationMode = $state<'description' | 'memories'>('description');
	let selectedMemories = $state<SvelteSet<number>>(new SvelteSet());

	const draft = $derived(customScenarioStore.draft);
	const limits = $derived(customScenarioStore.limits);

	const _totalSlots = $derived(() => (limits.total > 0 ? limits.total : 3));

	const limitReached = $derived(limits.total > 0 && limits.totalUsed >= limits.total);

	const privateLimit = $derived(limits.private ?? 0);
	const privateLocked = $derived(privateLimit === 0);
	const privateAtCapacity = $derived(privateLimit > 0 && limits.privateUsed >= privateLimit);
	const privateDisabled = $derived(privateLocked || privateAtCapacity);

	const showCharWarning = $derived(description.length >= 600);

	$effect(() => {
		if (!open) {
			resetForm();
		}
	});

	$effect(() => {
		if (draft.result) {
			draftText = JSON.stringify(draft.result, null, 2);
		}
	});

	function resetForm() {
		description = '';
		visibility = 'public';
		isSaving = false;
		creationMode = 'description';
		selectedMemories = new SvelteSet();
		customScenarioStore.resetDraft();
		draftText = '';
	}

	async function generateDraft() {
		if (!description.trim()) return;
		const response = await customScenarioStore.authorDraft({
			description: description.trim(),
			mode
		});

		if (response?.draft) {
			draftText = JSON.stringify(response.draft, null, 2);
		}
	}

	async function generateDraftFromMemories() {
		const selectedMemoriesList = Array.from(selectedMemories).map((i) => userMemories[i]);
		if (selectedMemoriesList.length === 0) return;

		try {
			const response = await fetch('/api/user-scenarios/author-from-memories', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					memories: selectedMemoriesList,
					mode
				})
			});

			if (!response.ok) {
				throw new Error('Failed to generate scenario from memories');
			}

			const data = await response.json();
			if (data?.draft) {
				customScenarioStore.updateDraftResult(data.draft);
				draftText = JSON.stringify(data.draft, null, 2);
			}
		} catch (error) {
			console.error('Error generating scenario from memories:', error);
		}
	}

	function toggleMemorySelection(index: number) {
		const newSelection = new SvelteSet(selectedMemories);
		if (newSelection.has(index)) {
			newSelection.delete(index);
		} else {
			newSelection.add(index);
		}
		selectedMemories = newSelection;
	}

	async function saveScenario() {
		if (!draft.result) return;

		isSaving = true;
		try {
			const result = await customScenarioStore.saveScenario({
				scenario: draft.result,
				visibility
			});

			if (result && onScenarioCreated) {
				onScenarioCreated(result);
			}

			onClose();
			resetForm();
		} catch (error) {
			console.error(error);
		} finally {
			isSaving = false;
		}
	}

	function toggleVisibility() {
		if (visibility === 'public') {
			if (privateDisabled) return;
			visibility = 'private';
		} else {
			visibility = 'public';
		}
	}
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-base-content/60 p-4">
		<div class="card w-full max-w-2xl bg-base-100 shadow-xl">
			<div class="card-body gap-6">
				<header class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<h2 class="text-xl font-semibold">Create a custom scenario</h2>
					</div>
					<button class="btn btn-ghost btn-sm" onclick={onClose} aria-label="Close modal">
						<span class="icon-[mdi--close] h-5 w-5"></span>
					</button>
				</header>

				<!-- Mode Tabs -->
				{#if userMemories.length > 0}
					<div class="tabs-bordered tabs">
						<button
							class="tab {creationMode === 'description' ? 'tab-active' : ''}"
							onclick={() => (creationMode = 'description')}
						>
							<span class="mr-2 icon-[mdi--pencil] h-4 w-4"></span>
							Describe it
						</button>
						<button
							class="tab {creationMode === 'memories' ? 'tab-active' : ''}"
							onclick={() => (creationMode = 'memories')}
						>
							<span class="mr-2 icon-[mdi--lightbulb] h-4 w-4"></span>
							From my memories
						</button>
					</div>
				{/if}

				<section class="space-y-4">
					{#if creationMode === 'description'}
						<div class="form-control">
							<label class="label">
								<span class="label-text font-medium">Describe the moment</span>
								{#if showCharWarning}
									<span class="label-text-alt text-error">{description.length}/600</span>
								{/if}
							</label>
							<textarea
								class="textarea-bordered textarea min-h-[140px] resize-none"
								placeholder="Late-night urgent care. I woke up with sharp stomach pain and need to explain it to the night nurse."
								bind:value={description}
								maxlength={650}
							></textarea>
						</div>

						<div class="flex items-center justify-between rounded-xl border border-base-200 p-4">
							<div class="flex items-center gap-3">
								<div
									class="flex h-10 w-10 items-center justify-center rounded-full bg-base-200/80 text-base-content/80"
								>
									{#if visibility === 'private'}
										<span class="icon-[mdi--lock] h-5 w-5"></span>
									{:else}
										<span class="icon-[mdi--earth] h-5 w-5"></span>
									{/if}
								</div>
								<div>
									<p class="text-sm font-medium">
										{visibility === 'private' ? 'Private scenario' : 'Public scenario'}
									</p>
									<p class="text-xs text-base-content/60">
										{visibility === 'private'
											? 'Visible only to you.'
											: 'Shareable across your account.'}
									</p>
								</div>
							</div>

							<div class="flex items-center gap-3">
								<label class="flex items-center gap-2 text-xs font-medium">
									<span class:opacity-40={visibility === 'private'}>Public</span>
									<input
										type="checkbox"
										class="toggle toggle-sm"
										checked={visibility === 'private'}
										onchange={toggleVisibility}
										disabled={privateDisabled}
									/>
									<span class:opacity-40={visibility === 'public'}>Private</span>
								</label>

								{#if privateLocked}
									<a class="btn gap-2 btn-outline btn-sm" href="/pricing">
										<span class="icon-[mdi--lock] h-4 w-4"></span>
										<span>Unlock</span>
									</a>
								{:else if privateAtCapacity}
									<a class="btn gap-1 btn-ghost btn-xs" href="/pricing">
										<span class="icon-[mdi--lock] h-4 w-4"></span>
										<span class="text-xs">Upgrade</span>
									</a>
								{/if}
							</div>
						</div>
					{:else if creationMode === 'memories'}
						<div class="space-y-4">
							<div class="text-sm text-base-content/70">
								<p class="mb-2">Select memories to create a personalized scenario:</p>
							</div>
							{#if userMemories.length === 0}
								<div
									class="rounded-lg border border-dashed border-base-300 p-4 text-center text-sm text-base-content/60"
								>
									No memories saved yet. Add some to your learner profile first.
								</div>
							{:else}
								<div
									class="max-h-60 space-y-2 overflow-y-auto rounded-lg border border-base-300 p-3"
								>
									{#each userMemories as memory, index (index)}
										<label
											class="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-base-200/50"
										>
											<input
												type="checkbox"
												class="checkbox checkbox-sm"
												checked={selectedMemories.has(index)}
												onchange={() => toggleMemorySelection(index)}
											/>
											<span class="text-sm">{memory}</span>
										</label>
									{/each}
								</div>
							{/if}
						</div>
					{/if}
				</section>

				<section class="space-y-3">
					{#if creationMode === 'description'}
						<button
							class="btn w-full btn-primary"
							onclick={generateDraft}
							disabled={!description.trim() || draft.status === 'authoring'}
						>
							{#if draft.status === 'authoring'}
								<span class="loading loading-sm loading-spinner"></span>
								<span>Calling GPT...</span>
							{:else}
								<span class="icon-[mdi--sparkles] h-5 w-5"></span>
								<span>Generate JSON</span>
							{/if}
						</button>
					{:else if creationMode === 'memories'}
						<button
							class="btn w-full btn-primary"
							onclick={generateDraftFromMemories}
							disabled={selectedMemories.size === 0 ||
								draft.status === 'authoring' ||
								userMemories.length === 0}
						>
							{#if draft.status === 'authoring'}
								<span class="loading loading-sm loading-spinner"></span>
								<span>Generating...</span>
							{:else}
								<span class="icon-[mdi--lightbulb-on] h-5 w-5"></span>
								<span>Generate from memories</span>
							{/if}
						</button>
					{/if}

					{#if draft.error}
						<div class="alert alert-error">
							<span class="icon-[mdi--alert-circle] h-5 w-5"></span>
							<span>{draft.error}</span>
						</div>
					{/if}

					{#if draft.result}
						<div class="rounded-xl border border-base-300 bg-base-200/60 p-4">
							<textarea
								class="textarea-bordered textarea h-56 w-full resize-none font-mono text-sm"
								bind:value={draftText}
								onblur={(event) => {
									try {
										const parsed = JSON.parse(event.currentTarget.value);
										customScenarioStore.updateDraftResult(parsed);
									} catch (error) {
										console.warn('Invalid JSON edit', error);
									}
								}}
							></textarea>
						</div>
					{/if}

					{#if limitReached}
						<div
							class="rounded-xl border border-dashed border-base-300 p-3 text-center text-sm text-base-content/70"
						>
							Limit reached. <a class="link" href="/pricing">Upgrade to add more slots.</a>
						</div>
					{/if}
				</section>

				<footer class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
					<div class="text-xs tracking-wide text-base-content/50 uppercase">JSON preview</div>
					<div class="flex gap-2">
						<button class="btn btn-ghost" onclick={onClose}>Cancel</button>
						<button
							class="btn btn-success"
							onclick={saveScenario}
							disabled={!draft.result || limitReached || isSaving}
						>
							{#if isSaving}
								<span class="loading loading-sm loading-spinner"></span>
								<span>Saving</span>
							{:else}
								<span class="icon-[mdi--content-save] h-5 w-5"></span>
								<span>Save scenario</span>
							{/if}
						</button>
					</div>
				</footer>
			</div>
		</div>
	</div>
{/if}
