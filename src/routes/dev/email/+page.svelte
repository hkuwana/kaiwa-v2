<script lang="ts">
	import { onMount } from 'svelte';
	import { userManager } from '$lib/stores/user.store.svelte';
	import { posthogManager } from '$lib/client/posthog';

	let isLoading = $state(false);
	let testResult = $state<string>('');
	let selectedEmail = $state<string>('practice_reminder');

	const emailTypes = [
		{
			category: '📧 Practice Reminders',
			emails: [
				{ value: 'practice_reminder', label: 'Standard Practice Reminder', description: 'Personalized reminder with scenarios and streak info' }
			]
		},
		{
			category: '👋 Founder Email Sequence',
			emails: [
				{ value: 'day1_welcome', label: 'Day 1 - Welcome', description: 'Warm welcome from founder' },
				{ value: 'day2_checkin', label: 'Day 2 - Check-in', description: 'Checking in with common concerns' },
				{ value: 'day3_offer', label: 'Day 3 - Personal Offer', description: 'Cal.com link to book a call' }
			]
		},
		{
			category: '🎯 Segmented Reminders',
			emails: [
				{ value: 'segmented_new_user', label: 'New User', description: 'Welcome message showing what\'s possible' },
				{ value: 'segmented_slightly_inactive', label: 'Slightly Inactive (1-3 days)', description: 'Gentle nudge to practice' },
				{ value: 'segmented_moderately_inactive', label: 'Moderately Inactive (3-7 days)', description: 'Motivation boost' },
				{ value: 'segmented_highly_inactive', label: 'Highly Inactive (7-30 days)', description: 'Re-engagement with what\'s new' },
				{ value: 'segmented_dormant', label: 'Dormant (30+ days)', description: 'Win-back campaign' }
			]
		}
	];

	onMount(() => {
		console.log('📧 Email Testing Page');
		posthogManager.trackEvent('dev_email_page_viewed');
	});

	async function sendTestEmail() {
		if (!userManager.isLoggedIn) {
			testResult = '❌ Please log in first';
			return;
		}

		isLoading = true;
		testResult = '⏳ Sending test email...';

		try {
			const response = await fetch('/dev/email', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					emailType: selectedEmail,
					userId: userManager.user?.id
				})
			});

			const data = await response.json();

			if (response.ok) {
				testResult = `✅ ${data.message}\n\nSubject: ${data.subject}\nEmail ID: ${data.emailId}`;
				posthogManager.trackEvent('dev_email_test_sent', {
					emailType: selectedEmail
				});
			} else {
				testResult = `❌ Failed: ${data.error}\n${data.details || ''}`;
			}
		} catch (error) {
			testResult = `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="min-h-screen bg-base-200 p-8">
	<div class="max-w-4xl mx-auto">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-4xl font-bold mb-2">📧 Email Testing</h1>
			<p class="text-base-content/70">
				Test all email templates by sending them to <strong class="text-primary">weijo34@gmail.com</strong>
			</p>
		</div>

		<!-- Auth Check -->
		{#if !userManager.isLoggedIn}
			<div class="alert alert-warning mb-6">
				<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
				</svg>
				<span>Please log in to test emails</span>
			</div>
		{:else}
			<!-- Main Testing Card -->
			<div class="card bg-base-100 shadow-xl mb-6">
				<div class="card-body">
					<h2 class="card-title">Select Email Type</h2>

					<!-- Email Type Selection -->
					<div class="space-y-6">
						{#each emailTypes as category}
							<div>
								<h3 class="font-semibold text-lg mb-3">{category.category}</h3>
								<div class="space-y-2">
									{#each category.emails as email}
										<label class="flex items-start gap-3 p-4 border border-base-300 rounded-lg hover:bg-base-200 cursor-pointer transition-colors">
											<input
												type="radio"
												name="emailType"
												value={email.value}
												bind:group={selectedEmail}
												class="radio radio-primary mt-1"
											/>
											<div class="flex-1">
												<div class="font-medium">{email.label}</div>
												<div class="text-sm text-base-content/60">{email.description}</div>
											</div>
										</label>
									{/each}
								</div>
							</div>
						{/each}
					</div>

					<!-- Send Button -->
					<div class="card-actions justify-end mt-6">
						<button
							class="btn btn-primary btn-lg"
							onclick={sendTestEmail}
							disabled={isLoading || !userManager.isLoggedIn}
						>
							{#if isLoading}
								<span class="loading loading-spinner"></span>
								Sending...
							{:else}
								📨 Send Test Email
							{/if}
						</button>
					</div>
				</div>
			</div>

			<!-- Result Display -->
			{#if testResult}
				<div class="card bg-base-100 shadow-xl">
					<div class="card-body">
						<h2 class="card-title">Result</h2>
						<pre class="whitespace-pre-wrap text-sm bg-base-200 p-4 rounded-lg overflow-x-auto">{testResult}</pre>
					</div>
				</div>
			{/if}

			<!-- Info Box -->
			<div class="alert alert-info mt-6">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
				</svg>
				<div class="text-sm">
					<div class="font-bold">Test Email Features:</div>
					<ul class="list-disc list-inside mt-2 space-y-1">
						<li>All test emails are sent to <strong>weijo34@gmail.com</strong></li>
						<li>Subject lines are prefixed with <strong>[TEST]</strong></li>
						<li>Banner at the top indicates it's a test email</li>
						<li>Uses your current user data for personalization</li>
					</ul>
				</div>
			</div>

			<!-- Current User Info -->
			<div class="card bg-base-100 shadow-xl mt-6">
				<div class="card-body">
					<h2 class="card-title">Current User</h2>
					<div class="space-y-2">
						<div><strong>Name:</strong> {userManager.user?.displayName || 'N/A'}</div>
						<div><strong>Email:</strong> {userManager.user?.email || 'N/A'}</div>
						<div><strong>User ID:</strong> <code class="text-xs bg-base-200 px-2 py-1 rounded">{userManager.user?.id || 'N/A'}</code></div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
