<script lang="ts">
	import { onMount } from 'svelte';
	import { userManager } from '$lib/stores/user.store.svelte';
	import { posthogManager } from '$lib/client/posthog';
	import { EMAIL_CAMPAIGNS, CAMPAIGN_CATEGORIES } from '$lib/emails/email-campaigns.config';

	let isLoading = $state(false);
	let testResult = $state<string>('');
	let selectedEmail = $state<string>('practice_reminder');
	let showPreview = $state(false);
	let previewHtml = $state<string>('');
	let isLoadingPreview = $state(false);
	let isCronRunning = $state(false);
	let cronResult = $state<string>('');

	const emailTypes = [
		{
			category: '📧 Practice Reminders',
			emails: [
				{
					value: 'practice_reminder',
					label: 'Standard Practice Reminder',
					description: 'Personalized reminder with scenarios and streak info'
				}
			]
		},
		{
			category: '📊 Weekly Reports',
			emails: [
				{
					value: 'progress_report',
					label: 'Weekly Progress Report',
					description: 'Shows conversation count, minutes practiced, languages worked on'
				}
			]
		},
		{
			category: '🗞️ Product Updates',
			emails: [
				{
					value: 'weekly_update',
					label: 'Weekly Update Digest',
					description: 'Summary of new features, fixes, and shout-outs'
				},
				{
					value: 'product_update',
					label: 'Product Feature Announcement',
					description: 'Direct announcement of new features (AI Lesson Plans example)'
				}
			]
		},
		{
			category: '🎯 Coaching Nudges',
			emails: [
				{
					value: 'scenario_inspiration',
					label: 'Scenario Inspiration Pairing',
					description: 'Two scenarios matched to learning goal & challenge preference'
				},
				{
					value: 'community_story',
					label: 'Community Story Spotlight',
					description: 'A real learner win aligned to the user motivation'
				}
			]
		},
		{
			category: '👋 Founder Email Sequence',
			emails: [
				{
					value: 'day1_welcome',
					label: 'Day 1 - Welcome',
					description: 'Warm welcome from founder'
				},
				{
					value: 'day2_checkin',
					label: 'Day 2 - Check-in',
					description: 'Checking in with common concerns'
				},
				{
					value: 'day3_offer',
					label: 'Day 3 - Personal Offer',
					description: 'Calendar link to book a call'
				}
			]
		}
	];

	onMount(() => {
		console.log('📧 Email Testing Page');
		posthogManager.trackEvent('dev_email_page_viewed');
	});

	async function loadPreview() {
		if (!userManager.isLoggedIn) {
			testResult = '❌ Please log in first';
			return;
		}

		isLoadingPreview = true;
		testResult = '';

		try {
			const params = new URLSearchParams({
				emailType: selectedEmail,
				userId: userManager.user?.id || ''
			});

			const response = await fetch(`/dev/email?${params.toString()}`);

			if (response.ok) {
				previewHtml = await response.text();
				showPreview = true;

				posthogManager.trackEvent('dev_email_preview_viewed', {
					emailType: selectedEmail
				});
			} else {
				const errorText = await response.text();
				testResult = `❌ Failed to load preview: ${errorText}`;
			}
		} catch (error) {
			testResult = `❌ Error loading preview: ${error instanceof Error ? error.message : 'Unknown error'}`;
		} finally {
			isLoadingPreview = false;
		}
	}

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

	async function runCronDryRun() {
		if (!userManager.isLoggedIn) {
			cronResult = '❌ Please log in first';
			return;
		}

		isCronRunning = true;
		cronResult = '⏳ Running reminder check-in dry run...';

		try {
			const response = await fetch('/dev/email/cron', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({})
			});

			const data = await response.json();

			if (response.ok) {
				const stats = data.stats || {};
				const previews = stats.dryRunPreviews || [];
				const previewLines = previews
					.slice(0, 5)
					.map(
						(item: { email: string; segment: string; subject: string }) =>
							`• ${item.email} [${item.segment}] → ${item.subject}`
					);
				if (previews.length > 5) {
					previewLines.push(`…and ${previews.length - 5} more`);
				}

				cronResult = [
					'✅ Dry run complete',
					`Would send: ${previews.length}`,
					`Skipped: ${stats.skipped ?? 0}`,
					`Failed: ${stats.failed ?? 0}`,
					previewLines.length ? '\nPreview:' : '',
					previewLines.join('\n')
				]
					.filter(Boolean)
					.join('\n');

				posthogManager.trackEvent('dev_email_cron_dry_run', {
					wouldSend: previews.length
				});
			} else {
				cronResult = `❌ Failed: ${data.error || 'Unknown error'}${
					data.details ? `\n${data.details}` : ''
				}`;
			}
		} catch (error) {
			cronResult = `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
		} finally {
			isCronRunning = false;
		}
	}
</script>

<div class="min-h-screen bg-base-200 p-8">
	<div class="mx-auto max-w-6xl">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="mb-2 text-4xl font-bold">📧 Email System Dashboard</h1>
			<p class="text-base-content/70">
				Manage and test all email campaigns from one central dashboard
			</p>
		</div>

		<!-- CAMPAIGNS OVERVIEW TABLE -->
		<div class="card mb-8 bg-base-100 shadow-xl">
			<div class="card-body">
				<div class="mb-4 flex items-center justify-between">
					<h2 class="card-title">📊 All Email Campaigns</h2>
					<div class="badge badge-primary">{EMAIL_CAMPAIGNS.length} Campaigns</div>
				</div>

				<!-- Campaigns Table -->
				<div class="overflow-x-auto">
					<table class="table table-zebra">
						<thead>
							<tr>
								<th>Campaign</th>
								<th>Category</th>
								<th>Schedule</th>
								<th>Status</th>
								<th>Recipients</th>
							</tr>
						</thead>
						<tbody>
							{#each EMAIL_CAMPAIGNS as campaign (campaign.id)}
								<tr class="hover">
									<td>
										<div class="font-semibold">{campaign.name}</div>
										<div class="text-xs text-base-content/60">{campaign.description}</div>
									</td>
									<td>
										<div class="badge badge-ghost badge-sm">
											{CAMPAIGN_CATEGORIES[campaign.category].icon}
											{CAMPAIGN_CATEGORIES[campaign.category].name}
										</div>
									</td>
									<td>
										<div class="text-sm">{campaign.frequency || campaign.schedule}</div>
									</td>
									<td>
										{#if campaign.status === 'active'}
											<div class="badge badge-success badge-sm">🟢 Active</div>
										{:else if campaign.status === 'paused'}
											<div class="badge badge-warning badge-sm">⏸️ Paused</div>
										{:else}
											<div class="badge badge-ghost badge-sm">📝 Draft</div>
										{/if}
									</td>
									<td class="text-xs text-base-content/60">
										{campaign.estimatedRecipients || 'N/A'}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				<div class="mt-4 text-sm text-base-content/60">
					<strong>Note:</strong> Email campaigns are reaching daily limits on Resend's free tier.
					Consider implementing email preferences and user segmentation to reduce volume.
				</div>
			</div>
		</div>

		<div class="divider">Email Testing</div>

		<!-- Auth Check -->
		{#if !userManager.isLoggedIn}
			<div class="mb-6 alert alert-warning">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6 shrink-0 stroke-current"
					fill="none"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
					/>
				</svg>
				<span>Please log in to test emails</span>
			</div>
		{:else}
			<!-- Main Testing Card -->
			<div class="card mb-6 bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="card-title">Select Email Type</h2>

					<!-- Email Type Selection -->
					<div class="space-y-6">
						{#each emailTypes as category (category.category)}
							<div>
								<h3 class="mb-3 text-lg font-semibold">{category.category}</h3>
								<div class="space-y-2">
									{#each category.emails as email (email.value)}
										<label
											class="flex cursor-pointer items-start gap-3 rounded-lg border border-base-300 p-4 transition-colors hover:bg-base-200"
										>
											<input
												type="radio"
												name="emailType"
												value={email.value}
												bind:group={selectedEmail}
												class="radio mt-1 radio-primary"
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

					<!-- Action Buttons -->
					<div class="mt-6 card-actions justify-end gap-3">
						<button
							class="btn btn-lg btn-secondary"
							onclick={loadPreview}
							disabled={!userManager.isLoggedIn || isLoadingPreview}
						>
							{#if isLoadingPreview}
								<span class="loading loading-spinner"></span>
								Loading...
							{:else}
								👁️ Preview Email
							{/if}
						</button>
						<button
							class="btn btn-lg btn-primary"
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

			<!-- Cron Dry Run -->
			<div class="card mb-6 bg-base-100 shadow-lg">
				<div class="card-body">
					<h2 class="card-title">Cron Jobs</h2>
					<div class="space-y-4">
						<div>
							<h3 class="font-semibold">Available Cron Endpoints:</h3>
							<ul class="mt-2 list-inside list-disc space-y-1 text-sm text-base-content/70">
								<li>
									<code class="rounded bg-base-200 px-2 py-1">/api/cron/send-reminders</code> - Practice
									reminders (Mon/Thu 9 AM UTC)
								</li>
								<li>
									<code class="rounded bg-base-200 px-2 py-1">/api/cron/progress-reports</code> - Weekly
									reports (Saturdays 9 AM UTC)
								</li>
								<li>
									<code class="rounded bg-base-200 px-2 py-1">/api/cron/product-updates</code> - Product
									announcements (on-demand POST)
								</li>
								<li>
									<code class="rounded bg-base-200 px-2 py-1">/api/cron/founder-emails</code> - Day 1-3
									founder sequence (daily)
								</li>
							</ul>
						</div>
						<div class="divider my-0"></div>
						<div>
							<p class="mb-2 text-base-content/70">
								Run a dry run of <code>/api/cron/send-reminders</code> to see which users would receive
								practice reminder emails.
							</p>
						</div>
					</div>

					<div class="mt-4 flex flex-wrap items-center gap-4">
						<button class="btn btn-primary" onclick={runCronDryRun} disabled={isCronRunning}>
							{#if isCronRunning}
								<span class="loading loading-sm loading-spinner"></span>
								<span>Running dry run...</span>
							{:else}
								Run Dry Run
							{/if}
						</button>
						{#if cronResult}
							<pre
								class="mt-2 w-full rounded-lg bg-base-200 p-4 text-sm whitespace-pre-wrap">{cronResult}</pre>
						{/if}
					</div>
				</div>
			</div>

			<!-- Preview Display -->
			{#if showPreview}
				<div class="card mb-6 bg-base-100 shadow-xl">
					<div class="card-body">
						<div class="mb-4 flex items-center justify-between">
							<h2 class="card-title">Email Preview</h2>
							<button class="btn btn-ghost btn-sm" onclick={() => (showPreview = false)}>
								✕ Close Preview
							</button>
						</div>
						<div class="overflow-hidden rounded-lg border border-base-300 bg-white">
							<!-- Safe: previewHtml is email preview HTML generated by our own email templates -->
							<!-- svelte-ignore svelte_no_at_html_tags -->
							{@html previewHtml}
						</div>
						<div class="mt-4 alert alert-info">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								class="h-6 w-6 shrink-0 stroke-current"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								></path>
							</svg>
							<span
								>This preview shows the email with your current user data. Click "Send Test Email"
								to send it to <strong>weijo34@gmail.com</strong></span
							>
						</div>
					</div>
				</div>
			{/if}

			<!-- Result Display -->
			{#if testResult}
				<div class="card mb-6 bg-base-100 shadow-xl">
					<div class="card-body">
						<h2 class="card-title">Result</h2>
						<pre
							class="overflow-x-auto rounded-lg bg-base-200 p-4 text-sm whitespace-pre-wrap">{testResult}</pre>
					</div>
				</div>
			{/if}

			<!-- Info Box -->
			<div class="mt-6 alert alert-info">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					class="h-6 w-6 shrink-0 stroke-current"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					></path>
				</svg>
				<div class="text-sm">
					<div class="font-bold">Email System Overview:</div>
					<ul class="mt-2 list-inside list-disc space-y-1">
						<li>All test emails are sent to <strong>weijo34@gmail.com</strong></li>
						<li>
							<strong>Founder email (Day 1):</strong> Sent immediately on signup (Google or email/password)
						</li>
						<li>
							<strong>Progress reports:</strong> Weekly summary sent Saturdays (only if user practiced
							that week)
						</li>
						<li>
							<strong>Product updates:</strong> Feature announcements sent on-demand via POST to
							<code>/api/cron/product-updates</code>
						</li>
						<li>
							Subject lines are prefixed with <strong>[TEST]</strong> when using this interface
						</li>
						<li>Uses your current user data for personalization</li>
						<li>
							All emails respect user preferences (receiveFounderEmails, receiveProgressReports,
							receiveProductUpdates)
						</li>
					</ul>
				</div>
			</div>

			<!-- Current User Info -->
			<div class="card mt-6 bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="card-title">Current User</h2>
					<div class="space-y-2">
						<div><strong>Name:</strong> {userManager.user?.displayName || 'N/A'}</div>
						<div><strong>Email:</strong> {userManager.user?.email || 'N/A'}</div>
						<div>
							<strong>User ID:</strong>
							<code class="rounded bg-base-200 px-2 py-1 text-xs"
								>{userManager.user?.id || 'N/A'}</code
							>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
