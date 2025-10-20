<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		userId?: string | undefined;
		showTitle?: boolean;
		compact?: boolean;
	}

	let { userId = undefined, showTitle = true, compact = false }: Props = $props();

	let preferences = $state({
		receiveMarketingEmails: true,
		receiveDailyReminderEmails: true,
		receiveProductUpdates: true,
		receiveWeeklyDigest: true,
		receiveSecurityAlerts: true
	});

	let loading = $state(true);
	let saving = $state(false);
	let saveMessage = $state('');
	let saveError = $state('');

	const emailTypes = [
		{
			key: 'receiveMarketingEmails',
			label: 'Marketing Emails',
			description: 'Promotional content, special offers, and product announcements',
			icon: 'icon-[mdi--bullhorn-outline]'
		},
		{
			key: 'receiveDailyReminderEmails',
			label: 'Daily Reminders',
			description: 'Gentle reminders to practice your language learning',
			icon: 'icon-[mdi--calendar-clock]'
		},
		{
			key: 'receiveProductUpdates',
			label: 'Product Updates',
			description: 'New features, improvements, and important changes to Kaiwa',
			icon: 'icon-[mdi--rocket-launch-outline]'
		},
		{
			key: 'receiveWeeklyDigest',
			label: 'Weekly Digest',
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
			const response = await fetch('/api/user/email-preferences', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(preferences)
			});

			if (response.ok) {
				saveMessage = 'Email preferences saved successfully!';
				setTimeout(() => {
					saveMessage = '';
				}, 3000);
			} else {
				const error = await response.json();
				saveError = error.message || 'Failed to save preferences';
			}
		} catch (error) {
			saveError = 'Failed to save preferences';
			console.error('Error saving preferences:', error);
		} finally {
			saving = false;
		}
	}

	function togglePreference(key: keyof typeof preferences) {
		preferences[key] = !preferences[key];
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
		<div class="space-y-4">
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
								on:change={() => togglePreference(emailType.key as keyof typeof preferences)}
								disabled={saving}
							/>
						</div>
					</div>
				</div>
			{/each}
		</div>

		{#if saveMessage}
			<div role="alert" class="alert alert-success mt-4">
				<span class="icon-[mdi--check-circle] h-6 w-6"></span>
				<span>{saveMessage}</span>
			</div>
		{/if}

		{#if saveError}
			<div role="alert" class="alert alert-error mt-4">
				<span class="icon-[mdi--close-circle] h-6 w-6"></span>
				<span>{saveError}</span>
			</div>
		{/if}

		{#if !compact}
			<div role="alert" class="alert alert-info mt-6">
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
