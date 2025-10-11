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
			icon: '📢'
		},
		{
			key: 'receiveDailyReminderEmails',
			label: 'Daily Reminders',
			description: 'Gentle reminders to practice your language learning',
			icon: '📅'
		},
		{
			key: 'receiveProductUpdates',
			label: 'Product Updates',
			description: 'New features, improvements, and important changes to Kaiwa',
			icon: '🚀'
		},
		{
			key: 'receiveWeeklyDigest',
			label: 'Weekly Digest',
			description: 'Weekly summary of your progress and learning insights',
			icon: '📊'
		},
		{
			key: 'receiveSecurityAlerts',
			label: 'Security Alerts',
			description: 'Important security notifications and account updates',
			icon: '🔒'
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
		<h3 class="mb-4 text-lg font-semibold text-gray-900">Email Preferences</h3>
	{/if}

	{#if loading}
		<div class="flex items-center justify-center py-8">
			<div class="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600"></div>
			<span class="ml-2 text-gray-600">Loading preferences...</span>
		</div>
	{:else}
		<div class="space-y-4">
			{#each emailTypes as emailType}
				<div
					class="flex items-start space-x-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
				>
					<div class="flex-shrink-0 text-2xl">{emailType.icon}</div>
					<div class="min-w-0 flex-1">
						<div class="flex items-center justify-between">
							<div>
								<h4 class="text-sm font-medium text-gray-900">{emailType.label}</h4>
								{#if !compact}
									<p class="mt-1 text-sm text-gray-500">{emailType.description}</p>
								{/if}
							</div>
							<button
								type="button"
								class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none {preferences[
									emailType.key as keyof typeof preferences
								]
									? 'bg-blue-600'
									: 'bg-gray-200'}"
								role="switch"
								aria-checked={preferences[emailType.key as keyof typeof preferences]}
								aria-label={`Toggle ${emailType.label} email notifications`}
								onclick={() => togglePreference(emailType.key as keyof typeof preferences)}
								disabled={saving}
							>
								<span
									class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {preferences[
										emailType.key as keyof typeof preferences
									]
										? 'translate-x-5'
										: 'translate-x-0'}"
									aria-hidden="true"
								></span>
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>

		{#if saveMessage}
			<div class="mt-4 rounded-md border border-green-200 bg-green-50 p-3">
				<div class="flex">
					<div class="flex-shrink-0">
						<svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
								clip-rule="evenodd"
							/>
						</svg>
					</div>
					<div class="ml-3">
						<p class="text-sm font-medium text-green-800">{saveMessage}</p>
					</div>
				</div>
			</div>
		{/if}

		{#if saveError}
			<div class="mt-4 rounded-md border border-red-200 bg-red-50 p-3">
				<div class="flex">
					<div class="flex-shrink-0">
						<svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
								clip-rule="evenodd"
							/>
						</svg>
					</div>
					<div class="ml-3">
						<p class="text-sm font-medium text-red-800">{saveError}</p>
					</div>
				</div>
			</div>
		{/if}

		{#if !compact}
			<div class="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
				<div class="flex">
					<div class="flex-shrink-0">
						<svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
							<path
								fill-rule="evenodd"
								d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
								clip-rule="evenodd"
							/>
						</svg>
					</div>
					<div class="ml-3">
						<h3 class="text-sm font-medium text-blue-800">About Email Preferences</h3>
						<div class="mt-2 text-sm text-blue-700">
							<p>
								You can change these preferences at any time. We respect your choices and will only
								send you the types of emails you've opted into.
							</p>
						</div>
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
