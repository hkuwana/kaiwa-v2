<script lang="ts">
	import { onMount } from 'svelte';
	import type { EmailCampaign } from '$lib/emails/email-campaigns.config';

	interface CampaignWithNextSend extends EmailCampaign {
		nextSendTime: Date | null;
	}

	let campaigns = $state<CampaignWithNextSend[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let selectedCampaign = $state<string | null>(null);
	let previewHtml = $state('');
	let previewSubject = $state('');
	let previewLoading = $state(false);
	let testEmail = $state('');
	let testLoading = $state(false);
	let testMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);
	let dryRun = $state(true);

	onMount(async () => {
		await loadCampaigns();
	});

	async function loadCampaigns() {
		try {
			loading = true;
			const response = await fetch('/api/dev/email-dashboard/campaigns');
			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to load campaigns');
			}

			campaigns = data.campaigns;
			error = null;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Unknown error';
			console.error('Error loading campaigns:', err);
		} finally {
			loading = false;
		}
	}

	async function previewCampaign(campaignId: string) {
		try {
			previewLoading = true;
			selectedCampaign = campaignId;
			previewHtml = '';
			previewSubject = '';

			const response = await fetch(`/api/dev/email-dashboard/preview/${campaignId}`);
			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to load preview');
			}

			previewHtml = data.html;
			previewSubject = data.subject;
		} catch (err) {
			console.error('Error previewing campaign:', err);
			alert(err instanceof Error ? err.message : 'Failed to load preview');
		} finally {
			previewLoading = false;
		}
	}

	async function sendTestEmail() {
		if (!selectedCampaign || !testEmail) {
			alert('Please select a campaign and enter a test email address');
			return;
		}

		try {
			testLoading = true;
			testMessage = null;

			const response = await fetch('/api/dev/email-dashboard/test', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					campaignId: selectedCampaign,
					testEmail,
					dryRun
				})
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to send test email');
			}

			testMessage = {
				type: 'success',
				text: dryRun
					? `Dry run successful! Would send to ${testEmail}`
					: `Test email sent to ${testEmail}!`
			};
		} catch (err) {
			testMessage = {
				type: 'error',
				text: err instanceof Error ? err.message : 'Failed to send test email'
			};
		} finally {
			testLoading = false;
		}
	}

	function formatNextSend(nextSendTime: Date | null): string {
		if (!nextSendTime) return 'Manual only';

		const now = new Date();
		const diff = nextSendTime.getTime() - now.getTime();
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));
		const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

		if (days > 0) {
			return `in ${days}d ${hours}h`;
		} else if (hours > 0) {
			return `in ${hours}h`;
		} else {
			return 'soon';
		}
	}

	function getCategoryColor(category: string): string {
		switch (category) {
			case 'engagement':
				return 'badge-primary';
			case 'onboarding':
				return 'badge-success';
			case 'marketing':
				return 'badge-info';
			case 'transactional':
				return 'badge-warning';
			default:
				return 'badge-ghost';
		}
	}

	function getStatusColor(status: string): string {
		switch (status) {
			case 'active':
				return 'text-success';
			case 'scheduled':
				return 'text-warning';
			case 'disabled':
				return 'text-error';
			case 'manual':
				return 'text-info';
			default:
				return 'text-gray-500';
		}
	}
</script>

<div class="container mx-auto p-6 max-w-7xl">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-4xl font-bold mb-2">Email Command Center</h1>
		<p class="text-base-content/60">
			Manage all email campaigns in one place. Preview, test, and monitor scheduled sends.
		</p>
	</div>

	{#if loading}
		<div class="flex justify-center items-center py-12">
			<span class="loading loading-spinner loading-lg"></span>
		</div>
	{:else if error}
		<div class="alert alert-error">
			<span>{error}</span>
			<button class="btn btn-sm" onclick={loadCampaigns}>Retry</button>
		</div>
	{:else}
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- Left Column: Campaign List -->
			<div>
				<div class="card bg-base-200">
					<div class="card-body">
						<h2 class="card-title mb-4">
							Email Campaigns
							<div class="badge badge-ghost">{campaigns.length}</div>
						</h2>

						<div class="space-y-3">
							{#each campaigns as campaign}
								<div
									class="card bg-base-100 hover:bg-base-300 cursor-pointer transition-colors"
									class:ring-2={selectedCampaign === campaign.id}
									class:ring-primary={selectedCampaign === campaign.id}
									onclick={() => previewCampaign(campaign.id)}
								>
									<div class="card-body p-4">
										<div class="flex justify-between items-start mb-2">
											<div>
												<h3 class="font-semibold">{campaign.name}</h3>
												<p class="text-sm text-base-content/60">{campaign.description}</p>
											</div>
											<div class="badge {getCategoryColor(campaign.category)}">
												{campaign.category}
											</div>
										</div>

										<div class="flex justify-between items-center text-sm">
											<div class="flex gap-2 items-center">
												<span class={getStatusColor(campaign.status)}>● {campaign.status}</span>
											</div>
											<div class="text-base-content/60">
												{formatNextSend(campaign.nextSendTime)}
											</div>
										</div>

										{#if campaign.schedule}
											<div class="text-xs text-base-content/40 font-mono">
												{campaign.schedule}
											</div>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>

			<!-- Right Column: Preview & Test -->
			<div class="space-y-6">
				<!-- Preview Panel -->
				<div class="card bg-base-200">
					<div class="card-body">
						<h2 class="card-title">Email Preview</h2>

						{#if previewLoading}
							<div class="flex justify-center items-center py-12">
								<span class="loading loading-spinner loading-md"></span>
							</div>
						{:else if previewHtml}
							<div class="space-y-3">
								<div>
									<label class="label">
										<span class="label-text font-semibold">Subject</span>
									</label>
									<div class="p-3 bg-base-100 rounded-lg">
										{previewSubject}
									</div>
								</div>

								<div>
									<label class="label">
										<span class="label-text font-semibold">Email Content</span>
									</label>
									<div class="bg-white rounded-lg overflow-hidden border border-base-300">
										<iframe
											title="Email Preview"
											srcdoc={previewHtml}
											class="w-full h-96"
											sandbox="allow-same-origin"
										></iframe>
									</div>
								</div>
							</div>
						{:else}
							<div class="text-center py-12 text-base-content/60">
								Select a campaign to preview
							</div>
						{/if}
					</div>
				</div>

				<!-- Test Send Panel -->
				<div class="card bg-base-200">
					<div class="card-body">
						<h2 class="card-title">Test Send</h2>

						{#if testMessage}
							<div class="alert alert-{testMessage.type === 'success' ? 'success' : 'error'}">
								<span>{testMessage.text}</span>
							</div>
						{/if}

						<div class="form-control">
							<label class="label">
								<span class="label-text">Test Email Address</span>
							</label>
							<input
								type="email"
								bind:value={testEmail}
								placeholder="your@email.com"
								class="input input-bordered"
								disabled={!selectedCampaign}
							/>
						</div>

						<div class="form-control">
							<label class="label cursor-pointer">
								<span class="label-text">Dry Run (don't actually send)</span>
								<input type="checkbox" bind:checked={dryRun} class="checkbox" />
							</label>
						</div>

						<button
							class="btn btn-primary"
							onclick={sendTestEmail}
							disabled={!selectedCampaign || !testEmail || testLoading}
						>
							{#if testLoading}
								<span class="loading loading-spinner loading-sm"></span>
							{/if}
							{dryRun ? 'Test (Dry Run)' : 'Send Test Email'}
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
