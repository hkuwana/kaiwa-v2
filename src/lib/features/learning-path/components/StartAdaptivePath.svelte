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

	// Enhanced form data with much more customization
	let formData = $state({
		// Basic info
		title: '',
		description: '',

		// Learning profile
		cefrLevel: 'A1' as string,
		weekThemeTemplate: 'daily-life' as 'meet-family' | 'daily-life' | 'professional',

		// Detailed goals
		specificSituation: '',
		deadline: '',

		// Skills focus (multiple choice)
		focusAreas: {
			grammar: false,
			vocabulary: false,
			pronunciation: false,
			listening: false,
			questionFormation: false
		},

		// Grammar specifics
		grammarFocus: '',

		// Preferences
		sessionDuration: '10-15' as '5-10' | '10-15' | '15-20',
		feedbackStyle: 'balanced' as 'gentle' | 'balanced' | 'direct',

		// Priority ranking
		skillsPriority: 'speaking' as 'speaking' | 'listening' | 'balanced',

		userGoal: userGoal || ''
	});

	// ============================================================================
	// OPTIONS
	// ============================================================================

	const cefrLevels = [
		{
			value: 'A1',
			label: 'A1 - Beginner',
			description: 'Just starting out',
			details: 'Can understand basic phrases, introduce yourself, ask simple questions'
		},
		{
			value: 'A2',
			label: 'A2 - Elementary',
			description: 'Basic conversations',
			details: 'Can describe simple situations, discuss daily routines, handle basic interactions'
		},
		{
			value: 'B1',
			label: 'B1 - Intermediate',
			description: 'Comfortable with common topics',
			details: 'Can handle most travel situations, express opinions, tell stories in past tense'
		},
		{
			value: 'B2',
			label: 'B2 - Upper Intermediate',
			description: 'Fluent in most situations',
			details: 'Can discuss abstract topics, understand complex texts, argue viewpoints'
		}
	];

	const templates = [
		{
			id: 'daily-life' as const,
			name: '🏠 Daily Life',
			description: 'Talk about your day, routines, and simple plans',
			example: 'Perfect for building confidence with everyday conversations'
		},
		{
			id: 'meet-family' as const,
			name: '👨‍👩‍👧 Meeting Family',
			description: "Prepare to meet your partner's parents or family",
			example: 'Practice introductions, telling your story, and family conversation'
		},
		{
			id: 'professional' as const,
			name: '💼 Professional',
			description: 'Work-related conversations and business language',
			example: 'For meetings, emails, and professional networking'
		}
	];

	const feedbackStyles = [
		{
			value: 'gentle' as const,
			label: 'Gentle Encouragement',
			description: 'Focus on what you did well, gentle corrections'
		},
		{
			value: 'balanced' as const,
			label: 'Balanced',
			description: 'Mix of encouragement and clear corrections'
		},
		{
			value: 'direct' as const,
			label: 'Direct Correction',
			description: 'Immediate, explicit feedback on errors to build correct habits'
		}
	];

	const sessionDurations = [
		{ value: '5-10' as const, label: '5-10 minutes', description: 'Quick daily practice' },
		{ value: '10-15' as const, label: '10-15 minutes', description: 'Standard session' },
		{ value: '15-20' as const, label: '15-20 minutes', description: 'Deep practice' }
	];

	const skillsPriorities = [
		{
			value: 'speaking' as const,
			label: 'Speaking First',
			description: 'Prioritize speaking fluency, then listening'
		},
		{
			value: 'listening' as const,
			label: 'Listening First',
			description: 'Build comprehension before speaking'
		},
		{
			value: 'balanced' as const,
			label: 'Balanced',
			description: 'Equal focus on speaking and listening'
		}
	];

	// ============================================================================
	// DERIVED STATE
	// ============================================================================

	let selectedLevel = $derived(cefrLevels.find((l) => l.value === formData.cefrLevel));
	let selectedTemplate = $derived(templates.find((t) => t.id === formData.weekThemeTemplate));
	let selectedFeedback = $derived(feedbackStyles.find((f) => f.value === formData.feedbackStyle));
	let selectedDuration = $derived(sessionDurations.find((d) => d.value === formData.sessionDuration));
	let selectedPriority = $derived(skillsPriorities.find((p) => p.value === formData.skillsPriority));

	// ============================================================================
	// ACTIONS
	// ============================================================================

	function openModal() {
		isModalOpen = true;
	}

	function closeModal() {
		isModalOpen = false;
	}

	// Build comprehensive description from form inputs
	function buildComprehensiveDescription(): string {
		let desc = formData.description;

		// Add specific situation if provided
		if (formData.specificSituation) {
			desc += `\n\nSpecific situation: ${formData.specificSituation}`;
		}

		// Add deadline if provided
		if (formData.deadline) {
			desc += ` (Deadline: ${formData.deadline})`;
		}

		// Add focus areas
		const focusAreas = Object.entries(formData.focusAreas)
			.filter(([_, enabled]) => enabled)
			.map(([area]) => area);
		if (focusAreas.length > 0) {
			desc += `\n\nFocus areas: ${focusAreas.join(', ')}`;
		}

		// Add grammar focus
		if (formData.grammarFocus) {
			desc += `\n\nGrammar focus: ${formData.grammarFocus}`;
		}

		// Add preferences
		desc += `\n\nPreferences: ${selectedDuration?.label} sessions, ${selectedFeedback?.label} feedback style, ${selectedPriority?.label}`;

		return desc;
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
					description: buildComprehensiveDescription(),
					weekThemeTemplate: formData.weekThemeTemplate,
					cefrLevel: formData.cefrLevel,
					userGoal: formData.userGoal || undefined,
					// Store preferences in userGoal for now (can be expanded to separate fields later)
					metadata: {
						focusAreas: formData.focusAreas,
						grammarFocus: formData.grammarFocus,
						sessionDuration: formData.sessionDuration,
						feedbackStyle: formData.feedbackStyle,
						skillsPriority: formData.skillsPriority
					}
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
<button class="btn btn-lg btn-primary" onclick={openModal}>
	<span class="icon-[mdi--rocket-launch]"></span>
	Start 4-Week Path
</button>

<!-- Modal -->
{#if isModalOpen}
	<div class="modal-open modal">
		<div class="modal-box max-w-5xl max-h-[90vh] overflow-y-auto">
			<h3 class="mb-2 text-2xl font-bold">Create Your Personalized Learning Path</h3>
			<p class="mb-6 text-base-content/70">
				Tell us about your goals and we'll create a flexible 4-week path tailored to your needs.
			</p>

			<form
				class="space-y-6"
				onsubmit={(e) => {
					e.preventDefault();
					createPath();
				}}
			>
				<!-- Section 1: Basic Info -->
				<div class="rounded-lg border-2 border-base-300 p-6">
					<h4 class="mb-4 text-lg font-semibold">Basic Information</h4>

					<div class="space-y-4">
						<!-- Path Title -->
						<div class="form-control">
							<label class="label">
								<span class="label-text font-medium">Path Title</span>
							</label>
							<input
								type="text"
								placeholder="e.g., Dutch for Meeting Lisa's Parents"
								class="input-bordered input"
								bind:value={formData.title}
								required
							/>
						</div>

						<!-- Main Goal -->
						<div class="form-control">
							<label class="label">
								<span class="label-text font-medium">What's your main goal?</span>
							</label>
							<textarea
								placeholder="e.g., I want to have basic conversations with my girlfriend's family without switching to English"
								class="textarea-bordered textarea h-24"
								bind:value={formData.description}
								required
							></textarea>
						</div>

						<!-- Specific Situation -->
						<div class="form-control">
							<label class="label">
								<span class="label-text font-medium">Specific situation (optional)</span>
								<span class="label-text-alt">When/where will you use this?</span>
							</label>
							<input
								type="text"
								placeholder="e.g., Christmas dinner with her parents on Dec 25"
								class="input-bordered input"
								bind:value={formData.specificSituation}
							/>
						</div>

						<!-- Deadline -->
						<div class="form-control">
							<label class="label">
								<span class="label-text font-medium">Deadline (optional)</span>
							</label>
							<input
								type="date"
								class="input-bordered input"
								bind:value={formData.deadline}
							/>
						</div>
					</div>
				</div>

				<!-- Section 2: Your Level -->
				<div class="rounded-lg border-2 border-base-300 p-6">
					<h4 class="mb-4 text-lg font-semibold">Your Current Level</h4>

					<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
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
									class="rounded-lg border-2 p-4 transition"
									class:border-primary={formData.cefrLevel === level.value}
									class:bg-primary/10={formData.cefrLevel === level.value}
									class:border-base-300={formData.cefrLevel !== level.value}
								>
									<div class="flex items-start gap-3">
										<input
											type="radio"
											name="level"
											class="radio mt-1 radio-primary"
											value={level.value}
											bind:group={formData.cefrLevel}
										/>
										<div class="flex-1">
											<div class="font-semibold">{level.label}</div>
											<div class="mt-1 text-sm text-base-content/70">{level.description}</div>
											<div class="mt-2 text-xs text-base-content/50">
												{level.details}
											</div>
										</div>
									</div>
								</div>
							</label>
						{/each}
					</div>

					{#if selectedLevel}
						<div class="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
							<p class="text-sm">
								<span class="font-medium text-primary">{selectedLevel.label}:</span>
								<span class="text-base-content/70">{selectedLevel.details}</span>
							</p>
						</div>
					{/if}
				</div>

				<!-- Section 3: Theme & Focus -->
				<div class="rounded-lg border-2 border-base-300 p-6">
					<h4 class="mb-4 text-lg font-semibold">Theme & Focus Areas</h4>

					<!-- Theme Template -->
					<div class="mb-6">
						<label class="label">
							<span class="label-text font-medium">Choose a Theme</span>
						</label>
						<div class="grid gap-3 md:grid-cols-3">
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
										class:bg-primary/10={formData.weekThemeTemplate === template.id}
										class:border-base-300={formData.weekThemeTemplate !== template.id}
									>
										<div class="text-center">
											<div class="text-2xl mb-2">{template.name.split(' ')[0]}</div>
											<div class="font-semibold">{template.name.substring(2)}</div>
											<div class="mt-2 text-xs text-base-content/60">{template.description}</div>
										</div>
									</div>
								</label>
							{/each}
						</div>
					</div>

					<!-- Focus Areas -->
					<div>
						<label class="label">
							<span class="label-text font-medium">What do you want to focus on?</span>
							<span class="label-text-alt">Select all that apply</span>
						</label>
						<div class="grid grid-cols-2 gap-2 md:grid-cols-3">
							<label class="flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition hover:bg-base-200">
								<input
									type="checkbox"
									class="checkbox checkbox-sm checkbox-primary"
									bind:checked={formData.focusAreas.grammar}
								/>
								<span class="text-sm">Grammar structures</span>
							</label>
							<label class="flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition hover:bg-base-200">
								<input
									type="checkbox"
									class="checkbox checkbox-sm checkbox-primary"
									bind:checked={formData.focusAreas.vocabulary}
								/>
								<span class="text-sm">Vocabulary building</span>
							</label>
							<label class="flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition hover:bg-base-200">
								<input
									type="checkbox"
									class="checkbox checkbox-sm checkbox-primary"
									bind:checked={formData.focusAreas.pronunciation}
								/>
								<span class="text-sm">Pronunciation</span>
							</label>
							<label class="flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition hover:bg-base-200">
								<input
									type="checkbox"
									class="checkbox checkbox-sm checkbox-primary"
									bind:checked={formData.focusAreas.listening}
								/>
								<span class="text-sm">Listening comprehension</span>
							</label>
							<label class="flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition hover:bg-base-200">
								<input
									type="checkbox"
									class="checkbox checkbox-sm checkbox-primary"
									bind:checked={formData.focusAreas.questionFormation}
								/>
								<span class="text-sm">Question formation</span>
							</label>
						</div>
					</div>

					<!-- Grammar Focus Details -->
					<div class="form-control mt-4">
						<label class="label">
							<span class="label-text font-medium">Specific grammar to work on (optional)</span>
							<span class="label-text-alt">e.g., past tense, V2 word order</span>
						</label>
						<textarea
							placeholder="e.g., Past tense formation (hebben/zijn), V2 word order (verb-second), correct placement of adverbs"
							class="textarea-bordered textarea h-20"
							bind:value={formData.grammarFocus}
						></textarea>
					</div>
				</div>

				<!-- Section 4: Learning Preferences -->
				<div class="rounded-lg border-2 border-base-300 p-6">
					<h4 class="mb-4 text-lg font-semibold">Learning Preferences</h4>

					<!-- Session Duration -->
					<div class="mb-6">
						<label class="label">
							<span class="label-text font-medium">Preferred session length</span>
						</label>
						<div class="grid grid-cols-3 gap-2">
							{#each sessionDurations as duration}
								<label class="cursor-pointer">
									<input
										type="radio"
										name="duration"
										class="sr-only"
										value={duration.value}
										bind:group={formData.sessionDuration}
									/>
									<div
										class="rounded-lg border-2 p-3 text-center transition"
										class:border-primary={formData.sessionDuration === duration.value}
										class:bg-primary/10={formData.sessionDuration === duration.value}
										class:border-base-300={formData.sessionDuration !== duration.value}
									>
										<div class="font-semibold">{duration.label}</div>
										<div class="mt-1 text-xs text-base-content/60">{duration.description}</div>
									</div>
								</label>
							{/each}
						</div>
					</div>

					<!-- Feedback Style -->
					<div class="mb-6">
						<label class="label">
							<span class="label-text font-medium">Feedback style</span>
						</label>
						<div class="grid grid-cols-1 gap-2 md:grid-cols-3">
							{#each feedbackStyles as style}
								<label class="cursor-pointer">
									<input
										type="radio"
										name="feedback"
										class="sr-only"
										value={style.value}
										bind:group={formData.feedbackStyle}
									/>
									<div
										class="rounded-lg border-2 p-3 transition"
										class:border-primary={formData.feedbackStyle === style.value}
										class:bg-primary/10={formData.feedbackStyle === style.value}
										class:border-base-300={formData.feedbackStyle !== style.value}
									>
										<div class="font-semibold">{style.label}</div>
										<div class="mt-1 text-xs text-base-content/60">{style.description}</div>
									</div>
								</label>
							{/each}
						</div>
					</div>

					<!-- Skills Priority -->
					<div>
						<label class="label">
							<span class="label-text font-medium">Skills priority</span>
						</label>
						<div class="grid grid-cols-1 gap-2 md:grid-cols-3">
							{#each skillsPriorities as priority}
								<label class="cursor-pointer">
									<input
										type="radio"
										name="priority"
										class="sr-only"
										value={priority.value}
										bind:group={formData.skillsPriority}
									/>
									<div
										class="rounded-lg border-2 p-3 transition"
										class:border-primary={formData.skillsPriority === priority.value}
										class:bg-primary/10={formData.skillsPriority === priority.value}
										class:border-base-300={formData.skillsPriority !== priority.value}
									>
										<div class="font-semibold">{priority.label}</div>
										<div class="mt-1 text-xs text-base-content/60">{priority.description}</div>
									</div>
								</label>
							{/each}
						</div>
					</div>
				</div>

				<!-- Summary Preview -->
				<div class="rounded-lg border-2 border-success/30 bg-success/5 p-6">
					<h4 class="mb-3 text-lg font-semibold text-success">Your Path Summary</h4>
					<div class="space-y-2 text-sm">
						<p><span class="font-medium">Level:</span> {selectedLevel?.label}</p>
						<p><span class="font-medium">Theme:</span> {selectedTemplate?.name}</p>
						<p><span class="font-medium">Sessions:</span> {selectedDuration?.label} ({selectedFeedback?.label} feedback)</p>
						<p><span class="font-medium">Priority:</span> {selectedPriority?.label}</p>
						{#if Object.values(formData.focusAreas).some(v => v)}
							<p>
								<span class="font-medium">Focus:</span>
								{Object.entries(formData.focusAreas)
									.filter(([_, enabled]) => enabled)
									.map(([area]) => area)
									.join(', ')}
							</p>
						{/if}
					</div>
				</div>

				<!-- Actions -->
				<div class="modal-action">
					<button type="button" class="btn btn-ghost" onclick={closeModal} disabled={isCreating}>
						Cancel
					</button>
					<button type="submit" class="btn btn-primary" disabled={isCreating}>
						{isCreating ? 'Creating Your Path...' : 'Create Path'}
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
