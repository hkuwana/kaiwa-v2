<script lang="ts">
	import { onMount } from 'svelte';
	import { dev } from '$app/environment';

	interface Props {
		userId?: string | undefined;
		showTitle?: boolean;
		compact?: boolean;
	}

	let { userId = undefined, showTitle = true, compact = false }: Props = $props();

	let preferences = $state({
		receiveFounderEmails: true,
		receivePracticeReminders: true,
		practiceReminderFrequency: 'weekly' as 'never' | 'daily' | 'weekly',
		preferredReminderDay: 'friday' as
			| 'monday'
			| 'tuesday'
			| 'wednesday'
			| 'thursday'
			| 'friday'
			| 'saturday'
			| 'sunday',
		receiveProductUpdates: true,
		receiveProgressReports: true,
		receiveSecurityAlerts: true
	});

	let loading = $state(true);
	let saving = $state(false);
	let saveMessage = $state('');
	let saveError = $state('');

	const emailTypes = [
		{
			key: 'receiveFounderEmails',
			label: 'Founder Emails',
			description: 'Updates from Hiro on Kaiwa',
			icon: 'icon-[mdi--bullhorn-outline]'
		},
		{
			key: 'receiveProductUpdates',
			label: 'Product Updates',
			description: 'New features, improvements, and important changes to Kaiwa',
			icon: 'icon-[mdi--rocket-launch-outline]'
		},
		{
			key: 'receiveProgressReports',
			label: 'Progress Reports',
			description: 'Weekly summary of your progress and learning insights',
			icon: 'icon-[mdi--chart-bar]'
		},
		{
			key: 'receiveSecurityAlerts',
			label: 'Security Alerts',
			description: 'Important security notifications and account updates',
			icon: 'icon-[mdi--lock-outline]'
		}
	];

	const frequencyOptions = [
		{ value: 'never', label: 'Never' },
		{ value: 'daily', label: 'Daily' },
		{ value: 'weekly', label: 'Weekly' }
	];

	const dayOptions = [
		{ value: 'monday', label: 'Monday' },
		{ value: 'tuesday', label: 'Tuesday' },
		{ value: 'wednesday', label: 'Wednesday' },
		{ value: 'thursday', label: 'Thursday' },
		{ value: 'friday', label: 'Friday' },
		{ value: 'saturday', label: 'Saturday' },
		{ value: 'sunday', label: 'Sunday' }
	];

	onMount(async () => {
		await loadPreferences();
	});

	async function loadPreferences() {
		if (!userId) return;

		try {
			const response = await fetch('/api/user/email-preferences');
			if (response.ok) {
				const data = await response.json();
				preferences = { ...preferences, ...data };
			}
		} catch (error) {
			console.error('Failed to load email preferences:', error);
		} finally {
			loading = false;
		}
	}

	async function savePreferences() {
		if (!userId) return;

		saving = true;
		saveMessage = '';
		saveError = '';

		try {
			console.log('Saving preferences:', preferences);
			const response = await fetch('/api/user/email-preferences', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(preferences)
			});

			if (response.ok) {
				const data = await response.json();
				console.log('Save successful, server returned:', data);
				saveMessage = 'Email preferences saved successfully!';

				setTimeout(() => {
					saveMessage = '';
				}, 3000);

				// Verify preferences in background (don't block UI)
				// This ensures we catch any server-side validation issues
				loadPreferences().catch((err) => {
					console.error('Failed to verify preferences:', err);
					saveError = 'Saved but failed to verify. Please refresh if issues persist.';
				});
			} else {
				const error = await response.json();
				saveError = error.message || 'Failed to save preferences';
				console.error('Save failed:', error);

				// Revert local state to match server on error
				await loadPreferences();
			}
		} catch (error) {
			saveError = 'Failed to save preferences';
			console.error('Error saving preferences:', error);

			// Revert local state to match server on error
			await loadPreferences();
		} finally {
			saving = false;
		}
	}

	function handlePreferenceChange() {
		savePreferences();
	}
</script>

<div class="email-preferences {compact ? 'compact' : ''}">
	{#if showTitle}
		<h3 class="mb-4 text-lg font-semibold">Email Preferences</h3>
	{/if}

	{#if loading}
		<div class="flex items-center justify-center py-8">
			<div class="h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
			<span class="ml-2">Loading preferences...</span>
		</div>
	{:else}
		{#if dev}
			<!-- Debug info showing current state (dev only) -->
			<div class="mb-6 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
				<p class="font-mono text-xs">
					Current state: {JSON.stringify(preferences, null, 2)}
				</p>
			</div>
		{/if}

		<div class="space-y-4">
			<!-- Practice Reminders Section with Frequency Control -->
			<div
				class="rounded-lg border-2 border-primary/20 bg-base-100 p-4 transition-colors hover:bg-base-200"
			>
				<div class="mb-3 flex items-start space-x-3">
					<div class="flex-shrink-0 text-2xl">
						<span class="icon-[mdi--calendar-clock] h-6 w-6"></span>
					</div>
					<div class="flex-1">
						<h4 class="text-sm font-medium">Practice Reminders</h4>
						{#if !compact}
							<p class="mt-1 text-sm text-base-content/70">
								Choose when you'd like gentle reminders to practice your language learning
							</p>
						{/if}
					</div>
				</div>

				<div class="ml-9 space-y-3">
					<!-- Frequency Selector -->
					<div>
						<label for="reminder-frequency" class="mb-1 block text-xs font-medium text-base-content/70">
							Frequency
						</label>
						<select
							id="reminder-frequency"
							class="select select-bordered w-full max-w-xs"
							bind:value={preferences.practiceReminderFrequency}
							onchange={handlePreferenceChange}
							disabled={saving}
						>
							{#each frequencyOptions as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
					</div>

					<!-- Day Selector (only show if weekly is selected) -->
					{#if preferences.practiceReminderFrequency === 'weekly'}
						<div>
							<label for="reminder-day" class="mb-1 block text-xs font-medium text-base-content/70">
								Preferred Day
							</label>
							<select
								id="reminder-day"
								class="select select-bordered w-full max-w-xs"
								bind:value={preferences.preferredReminderDay}
								onchange={handlePreferenceChange}
								disabled={saving}
							>
								{#each dayOptions as option}
									<option value={option.value}>{option.label}</option>
								{/each}
							</select>
						</div>
					{/if}

					<!-- Helpful hint based on selection -->
					<div class="rounded-lg bg-base-200 p-3 text-xs text-base-content/70">
						{#if preferences.practiceReminderFrequency === 'never'}
							<span class="icon-[mdi--information] mr-1 inline-block h-4 w-4"></span>
							You won't receive any practice reminders
						{:else if preferences.practiceReminderFrequency === 'daily'}
							<span class="icon-[mdi--fire] mr-1 inline-block h-4 w-4"></span>
							You'll receive daily reminders with scenario recommendations
						{:else if preferences.practiceReminderFrequency === 'weekly'}
							<span class="icon-[mdi--calendar-check] mr-1 inline-block h-4 w-4"></span>
							You'll receive a reminder every {preferences.preferredReminderDay} with personalized scenarios
						{/if}
					</div>
				</div>
			</div>

			{#each emailTypes as emailType (emailType.key)}
				<div
					class="flex items-start space-x-3 rounded-lg border border-base-200 bg-base-100 p-4 transition-colors hover:bg-base-200"
				>
					<div class="flex-shrink-0 text-2xl">
						<span class="{emailType.icon} h-6 w-6"></span>
					</div>
					<div class="min-w-0 flex-1">
						<div class="flex items-center justify-between">
							<div>
								<h4 class="text-sm font-medium">{emailType.label}</h4>
								{#if !compact}
									<p class="mt-1 text-sm text-base-content/70">{emailType.description}</p>
								{/if}
							</div>
							<input
								type="checkbox"
								class="toggle toggle-primary"
								bind:checked={preferences[emailType.key as keyof typeof preferences]}
								aria-label={`Toggle ${emailType.label} email notifications`}
								onchange={handlePreferenceChange}
								disabled={saving}
							/>
						</div>
					</div>
				</div>
			{/each}
		</div>

		{#if saveMessage}
			<div role="alert" class="mt-4 alert alert-success">
				<span class="icon-[mdi--check-circle] h-6 w-6"></span>
				<span>{saveMessage}</span>
			</div>
		{/if}

		{#if saveError}
			<div role="alert" class="mt-4 alert alert-error">
				<span class="icon-[mdi--close-circle] h-6 w-6"></span>
				<span>{saveError}</span>
			</div>
		{/if}

		{#if !compact}
			<div role="alert" class="mt-6 alert alert-info">
				<span class="icon-[mdi--information] h-5 w-5"></span>
				<div>
					<h3 class="font-bold">About Email Preferences</h3>
					<div class="text-xs">
						You can change these preferences at any time. We respect your choices and will only send
						you the types of emails you've opted into.
					</div>
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.email-preferences.compact .space-y-4 > * {
		margin-bottom: 0.75rem;
	}

	.email-preferences.compact .space-y-4 > *:last-child {
		margin-bottom: 0;
	}
</style>
