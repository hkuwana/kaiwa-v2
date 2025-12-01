<script lang="ts">
	import { goto } from '$app/navigation';

	// ============================================================================
	// PROPS
	// ============================================================================

	let {
		targetLanguage,
		userGoal = ''
	}: {
		targetLanguage: string;
		userGoal?: string;
	} = $props();

	// ============================================================================
	// STATE
	// ============================================================================

	let isModalOpen = $state(false);
	let isCreating = $state(false);
	let formData = $state({
		title: '',
		description: '',
		weekThemeTemplate: 'daily-life' as 'meet-family' | 'daily-life' | 'professional',
		cefrLevel: 'A2' as string,
		userGoal: userGoal || ''
	});

	// ============================================================================
	// TEMPLATE OPTIONS
	// ============================================================================

	const templates = [
		{
			id: 'daily-life' as const,
			name: 'Daily Life',
			description: 'Talk about your day, routines, and simple plans',
			example: 'Perfect for building confidence with everyday conversations'
		},
		{
			id: 'meet-family' as const,
			name: 'Meeting Family',
			description: 'Prepare to meet your partner\'s parents or family',
			example: 'Practice introductions, telling your story, and family conversation'
		},
		{
			id: 'professional' as const,
			name: 'Professional',
			description: 'Work-related conversations and business language',
			example: 'For meetings, emails, and professional networking'
		}
	];

	const cefrLevels = [
		{ value: 'A1', label: 'A1 - Beginner', description: 'Just starting out' },
		{ value: 'A2', label: 'A2 - Elementary', description: 'Basic conversations' },
		{ value: 'B1', label: 'B1 - Intermediate', description: 'Comfortable with common topics' },
		{ value: 'B2', label: 'B2 - Upper Intermediate', description: 'Fluent in most situations' }
	];

	// ============================================================================
	// ACTIONS
	// ============================================================================

	function openModal() {
		isModalOpen = true;
	}

	function closeModal() {
		isModalOpen = false;
	}

	async function createPath() {
		if (isCreating) return;

		isCreating = true;

		try {
			const response = await fetch('/api/learning-paths/adaptive', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					targetLanguage,
					title: formData.title,
					description: formData.description,
					weekThemeTemplate: formData.weekThemeTemplate,
					cefrLevel: formData.cefrLevel,
					userGoal: formData.userGoal || undefined
				})
			});

			if (!response.ok) {
				throw new Error('Failed to create path');
			}

			const result = await response.json();

			// Navigate to the new path
			if (result.data.path) {
				await goto(`/path/${result.data.path.id}`);
			}
		} catch (error) {
			console.error('Error creating adaptive path:', error);
			alert('Failed to create learning path. Please try again.');
		} finally {
			isCreating = false;
		}
	}
</script>

<!-- Trigger Button -->
<button class="btn btn-primary btn-lg" onclick={openModal}>
	<span class="icon-[mdi--rocket-launch]"></span>
	Start 4-Week Path
</button>

<!-- Modal -->
{#if isModalOpen}
	<div class="modal modal-open">
		<div class="modal-box max-w-2xl">
			<h3 class="text-2xl font-bold mb-2">Start Your 4-Week Learning Path</h3>
			<p class="text-base-content/70 mb-6">
				Flexible weekly themes that adapt to your progress. No rigid schedules—just 5-10 minute
				conversations.
			</p>

			<form class="space-y-6" onsubmit={(e) => {
				e.preventDefault();
				createPath();
			}}>
				<!-- Path Title -->
				<div class="form-control">
					<label class="label">
						<span class="label-text font-medium">Path Title</span>
					</label>
					<input
						type="text"
						placeholder="e.g., Dutch for Meeting Lisa's Parents"
						class="input input-bordered"
						bind:value={formData.title}
						required
					/>
				</div>

				<!-- Description -->
				<div class="form-control">
					<label class="label">
						<span class="label-text font-medium">Description</span>
					</label>
					<textarea
						placeholder="What's your goal for this learning path?"
						class="textarea textarea-bordered h-24"
						bind:value={formData.description}
						required
					></textarea>
				</div>

				<!-- Theme Template -->
				<div class="form-control">
					<label class="label">
						<span class="label-text font-medium">Choose a Theme</span>
					</label>
					<div class="grid gap-3">
						{#each templates as template}
							<label class="cursor-pointer">
								<input
									type="radio"
									name="theme"
									class="sr-only"
									value={template.id}
									bind:group={formData.weekThemeTemplate}
								/>
								<div
									class="rounded-lg border-2 p-4 transition"
									class:border-primary={formData.weekThemeTemplate === template.id}
									class:bg-primary/5={formData.weekThemeTemplate === template.id}
									class:border-base-300={formData.weekThemeTemplate !== template.id}
								>
									<div class="flex items-start gap-3">
										<input
											type="radio"
											name="theme"
											class="radio radio-primary mt-1"
											value={template.id}
											bind:group={formData.weekThemeTemplate}
										/>
										<div class="flex-1">
											<div class="font-semibold">{template.name}</div>
											<div class="text-sm text-base-content/70 mt-1">{template.description}</div>
											<div class="text-xs text-base-content/50 mt-2 italic">
												{template.example}
											</div>
										</div>
									</div>
								</div>
							</label>
						{/each}
					</div>
				</div>

				<!-- CEFR Level -->
				<div class="form-control">
					<label class="label">
						<span class="label-text font-medium">Your Current Level</span>
					</label>
					<div class="grid grid-cols-2 gap-2">
						{#each cefrLevels as level}
							<label class="cursor-pointer">
								<input
									type="radio"
									name="level"
									class="sr-only"
									value={level.value}
									bind:group={formData.cefrLevel}
								/>
								<div
									class="rounded-lg border-2 p-3 text-center transition"
									class:border-primary={formData.cefrLevel === level.value}
									class:bg-primary/5={formData.cefrLevel === level.value}
									class:border-base-300={formData.cefrLevel !== level.value}
								>
									<div class="font-semibold">{level.label}</div>
									<div class="text-xs text-base-content/60 mt-1">{level.description}</div>
								</div>
							</label>
						{/each}
					</div>
				</div>

				<!-- User Goal (Optional) -->
				<div class="form-control">
					<label class="label">
						<span class="label-text font-medium">Specific Goal (Optional)</span>
					</label>
					<input
						type="text"
						placeholder="e.g., Be ready for the family dinner on Christmas"
						class="input input-bordered"
						bind:value={formData.userGoal}
					/>
					<label class="label">
						<span class="label-text-alt">This helps personalize your conversation seeds</span>
					</label>
				</div>

				<!-- Actions -->
				<div class="modal-action">
					<button type="button" class="btn btn-ghost" onclick={closeModal} disabled={isCreating}>
						Cancel
					</button>
					<button type="submit" class="btn btn-primary" disabled={isCreating}>
						{isCreating ? 'Creating...' : 'Create Path'}
					</button>
				</div>
			</form>
		</div>
		<div class="modal-backdrop" onclick={closeModal}></div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		z-index: -1;
	}
</style>
