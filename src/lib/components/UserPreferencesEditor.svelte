<script lang="ts">
	import { onMount } from 'svelte';
	import type { UserPreferences } from '$lib/server/db/types';
	import { languages } from '$lib/data/languages';

	interface Props {
		userPreferences: UserPreferences;
		onSave?: (preferences: Partial<UserPreferences>) => void;
		compact?: boolean;
	}

	const { userPreferences, onSave, compact = false }: Props = $props();

	// Local state for form inputs
	let localPreferences = $state({ ...userPreferences });
	let saveTimeout: NodeJS.Timeout | null = null;
	let isSaving = $state(false);
	let lastSaved = $state<Date | null>(null);

	// Debounced save function
	const debouncedSave = (updates: Partial<UserPreferences>) => {
		if (saveTimeout) {
			clearTimeout(saveTimeout);
		}

		saveTimeout = setTimeout(async () => {
			await savePreferences(updates);
		}, 300); // 300ms delay
	};

	// Save preferences to server
	const savePreferences = async (updates: Partial<UserPreferences>) => {
		try {
			isSaving = true;
			const response = await fetch('/api/user/preferences', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(updates)
			});

			if (!response.ok) {
				throw new Error('Failed to save preferences');
			}

			lastSaved = new Date();
			onSave?.(updates);
		} catch (error) {
			console.error('Error saving preferences:', error);
		} finally {
			isSaving = false;
		}
	};

	// Handle input changes
	const handleInputChange = (field: keyof UserPreferences, value: string | number | string[]) => {
		(localPreferences as any)[field] = value;
		debouncedSave({ [field]: value });
	};

	// Learning goal options
	const learningGoals = [
		{ value: 'Connection', label: 'Connection' },
		{ value: 'Career', label: 'Career' },
		{ value: 'Travel', label: 'Travel' },
		{ value: 'Academic', label: 'Academic' },
		{ value: 'Culture', label: 'Culture' },
		{ value: 'Growth', label: 'Growth' }
	];

	// Challenge preference options
	const challengePreferences = [
		{ value: 'comfortable', label: 'Comfortable' },
		{ value: 'moderate', label: 'Moderate' },
		{ value: 'challenging', label: 'Challenging' }
	];

	// Correction style options
	const correctionStyles = [
		{ value: 'immediate', label: 'Immediate' },
		{ value: 'gentle', label: 'Gentle' },
		{ value: 'end_of_session', label: 'End of Session' }
	];

	// Convert seconds to minutes for display
	const secondsToMinutes = (seconds: number) => Math.round(seconds / 60);
	const minutesToSeconds = (minutes: number) => minutes * 60;
</script>

<div class="user-preferences-editor {compact ? 'text-sm' : ''}">
	{#if !compact}
		<div class="mb-4">
			<h3 class="text-lg font-semibold text-base-content">Learning Preferences</h3>
			{#if lastSaved}
				<p class="text-sm text-base-content/70">
					Last saved: {lastSaved.toLocaleTimeString()}
					{#if isSaving}
						<span class="loading ml-2 loading-xs loading-spinner"></span>
					{/if}
				</p>
			{/if}
		</div>
	{/if}

	<div class="grid gap-4 {compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}">
		<!-- Target Language -->
		<div class="form-control {compact ? 'mb-2' : ''}">
			<label class="label {compact ? 'py-1' : ''}">
				<span class="label-text {compact ? 'text-sm' : ''}">Target Language</span>
			</label>
			<select
				class="select-bordered select w-full"
				bind:value={localPreferences.targetLanguageId}
				onchange={(e) =>
					handleInputChange('targetLanguageId', (e.target as HTMLSelectElement).value)}
			>
				{#each languages.filter((lang) => lang.isSupported) as language}
					<option value={language.id}>
						{language.flag}
						{language.name} ({language.nativeName})
					</option>
				{/each}
			</select>
		</div>

		<!-- Learning Goal -->
		<div class="form-control {compact ? 'mb-2' : ''}">
			<label class="label {compact ? 'py-1' : ''}">
				<span class="label-text {compact ? 'text-sm' : ''}">Learning Goal</span>
			</label>
			<select
				class="select-bordered select w-full"
				bind:value={localPreferences.learningGoal}
				onchange={(e) => handleInputChange('learningGoal', (e.target as HTMLSelectElement).value)}
			>
				{#each learningGoals as goal}
					<option value={goal.value}>{goal.label}</option>
				{/each}
			</select>
		</div>

		<!-- Daily Goal -->
		<div class="form-control {compact ? 'mb-2' : ''}">
			<label class="label {compact ? 'py-1' : ''}">
				<span class="label-text {compact ? 'text-sm' : ''}">Daily Goal (minutes)</span>
			</label>
			<input
				type="number"
				class="input-bordered input w-full"
				min="1"
				max="120"
				value={secondsToMinutes(localPreferences.dailyGoalSeconds)}
				oninput={(e) =>
					handleInputChange(
						'dailyGoalSeconds',
						minutesToSeconds(parseInt((e.target as HTMLInputElement).value) || 30)
					)}
			/>
		</div>

		<!-- Challenge Preference -->
		<div class="form-control {compact ? 'mb-2' : ''}">
			<label class="label {compact ? 'py-1' : ''}">
				<span class="label-text {compact ? 'text-sm' : ''}">Challenge Level</span>
			</label>
			<select
				class="select-bordered select w-full"
				bind:value={localPreferences.challengePreference}
				onchange={(e) =>
					handleInputChange('challengePreference', (e.target as HTMLSelectElement).value)}
			>
				{#each challengePreferences as pref}
					<option value={pref.value}>{pref.label}</option>
				{/each}
			</select>
		</div>

		<!-- Correction Style -->
		<div class="form-control {compact ? 'mb-2' : ''}">
			<label class="label {compact ? 'py-1' : ''}">
				<span class="label-text {compact ? 'text-sm' : ''}">Correction Style</span>
			</label>
			<select
				class="select-bordered select w-full"
				bind:value={localPreferences.correctionStyle}
				onchange={(e) =>
					handleInputChange('correctionStyle', (e.target as HTMLSelectElement).value)}
			>
				{#each correctionStyles as style}
					<option value={style.value}>{style.label}</option>
				{/each}
			</select>
		</div>

		{#if !compact}
			<!-- Speaking Level -->
			<div class="form-control {compact ? 'mb-2' : ''}">
				<label class="label {compact ? 'py-1' : ''}">
					<span class="label-text {compact ? 'text-sm' : ''}">Speaking Level</span>
					<span class="label-text-alt {compact ? 'text-sm' : ''}"
						>{localPreferences.speakingLevel}/100</span
					>
				</label>
				<input
					type="range"
					min="1"
					max="100"
					class="range range-primary"
					bind:value={localPreferences.speakingLevel}
					oninput={(e) =>
						handleInputChange('speakingLevel', parseInt((e.target as HTMLInputElement).value))}
				/>
			</div>

			<!-- Listening Level -->
			<div class="form-control {compact ? 'mb-2' : ''}">
				<label class="label {compact ? 'py-1' : ''}">
					<span class="label-text {compact ? 'text-sm' : ''}">Listening Level</span>
					<span class="label-text-alt {compact ? 'text-sm' : ''}"
						>{localPreferences.listeningLevel}/100</span
					>
				</label>
				<input
					type="range"
					min="1"
					max="100"
					class="range range-primary"
					bind:value={localPreferences.listeningLevel}
					oninput={(e) =>
						handleInputChange('listeningLevel', parseInt((e.target as HTMLInputElement).value))}
				/>
			</div>

			<!-- Reading Level -->
			<div class="form-control {compact ? 'mb-2' : ''}">
				<label class="label {compact ? 'py-1' : ''}">
					<span class="label-text {compact ? 'text-sm' : ''}">Reading Level</span>
					<span class="label-text-alt {compact ? 'text-sm' : ''}"
						>{localPreferences.readingLevel}/100</span
					>
				</label>
				<input
					type="range"
					min="1"
					max="100"
					class="range range-primary"
					bind:value={localPreferences.readingLevel}
					oninput={(e) =>
						handleInputChange('readingLevel', parseInt((e.target as HTMLInputElement).value))}
				/>
			</div>

			<!-- Writing Level -->
			<div class="form-control {compact ? 'mb-2' : ''}">
				<label class="label {compact ? 'py-1' : ''}">
					<span class="label-text {compact ? 'text-sm' : ''}">Writing Level</span>
					<span class="label-text-alt {compact ? 'text-sm' : ''}"
						>{localPreferences.writingLevel}/100</span
					>
				</label>
				<input
					type="range"
					min="1"
					max="100"
					class="range range-primary"
					bind:value={localPreferences.writingLevel}
					oninput={(e) =>
						handleInputChange('writingLevel', parseInt((e.target as HTMLInputElement).value))}
				/>
			</div>

			<!-- Speaking Confidence -->
			<div class="form-control {compact ? 'mb-2' : ''}">
				<label class="label {compact ? 'py-1' : ''}">
					<span class="label-text {compact ? 'text-sm' : ''}">Speaking Confidence</span>
					<span class="label-text-alt {compact ? 'text-sm' : ''}"
						>{localPreferences.speakingConfidence}/100</span
					>
				</label>
				<input
					type="range"
					min="1"
					max="100"
					class="range range-primary"
					bind:value={localPreferences.speakingConfidence}
					oninput={(e) =>
						handleInputChange('speakingConfidence', parseInt((e.target as HTMLInputElement).value))}
				/>
			</div>

			<!-- Specific Goals -->
			<div class="form-control md:col-span-2 {compact ? 'mb-2' : ''}">
				<label class="label {compact ? 'py-1' : ''}">
					<span class="label-text {compact ? 'text-sm' : ''}">Specific Learning Goals</span>
				</label>
				<textarea
					class="textarea-bordered textarea"
					placeholder="Enter your specific learning goals (one per line)"
					value={Array.isArray(localPreferences.specificGoals)
						? localPreferences.specificGoals.join('\n')
						: ''}
					oninput={(e) =>
						handleInputChange(
							'specificGoals',
							(e.target as HTMLTextAreaElement).value.split('\n').filter((g: string) => g.trim())
						)}
				></textarea>
			</div>
		{/if}
	</div>
</div>
