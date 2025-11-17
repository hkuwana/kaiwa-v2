<script lang="ts">
	interface UpdateItem {
		title: string;
		summary: string;
		linkLabel?: string;
		linkUrl?: string;
	}

	interface DigestContent {
		updates: UpdateItem[];
		productHighlights: UpdateItem[];
		upcoming: UpdateItem[];
		intro?: string;
		subject?: string;
	}

	let content: DigestContent = $state({
		updates: [{ title: '', summary: '', linkLabel: '', linkUrl: '' }],
		productHighlights: [],
		upcoming: [],
		intro: '',
		subject: ''
	});

	let sendStatus: 'idle' | 'sending' | 'success' | 'error' = $state('idle');
	let statusMessage = $state('');
	let previewHtml = $state('');

	function addUpdate(section: 'updates' | 'productHighlights' | 'upcoming') {
		content[section] = [
			...content[section],
			{ title: '', summary: '', linkLabel: '', linkUrl: '' }
		];
	}

	function removeUpdate(section: 'updates' | 'productHighlights' | 'upcoming', index: number) {
		content[section] = content[section].filter((_, i) => i !== index);
	}

	async function generatePreview() {
		try {
			const response = await fetch('/api/admin/weekly-digest/preview', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(content)
			});

			if (!response.ok) throw new Error('Failed to generate preview');

			const data = await response.json();
			previewHtml = data.html;
		} catch (error) {
			console.error('Preview error:', error);
			statusMessage = 'Failed to generate preview';
		}
	}

	async function sendDigest() {
		const confirmed = window.confirm(
			'Send weekly digest to all subscribers? This cannot be undone.'
		);
		if (!confirmed) {
			return;
		}

		sendStatus = 'sending';
		statusMessage = 'Sending weekly digest...';

		try {
			const response = await fetch('/api/admin/weekly-digest/send', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(content)
			});

			if (!response.ok) {
				throw new Error('Failed to send digest');
			}

			const data = await response.json();
			sendStatus = 'success';
			statusMessage = `Successfully sent to ${data.sent} users! (${data.skipped} skipped)`;
		} catch (error) {
			sendStatus = 'error';
			statusMessage = `Error: ${error}`;
		}
	}

	async function copyScriptContent() {
		const scriptContent = generateScriptContent();
		await navigator.clipboard.writeText(scriptContent);
		console.log('Script content copied! Paste it into scripts/send-weekly-digest.ts');
	}

	function generateScriptContent(): string {
		return `const THIS_WEEKS_CONTENT: WeeklyDigestOptions = {
	updates: ${JSON.stringify(content.updates, null, 2)},
	productHighlights: ${JSON.stringify(content.productHighlights.length > 0 ? content.productHighlights : undefined, null, 2)},
	upcoming: ${JSON.stringify(content.upcoming.length > 0 ? content.upcoming : undefined, null, 2)},
	intro: ${content.intro ? `"${content.intro}"` : 'undefined'},
	subject: ${content.subject ? `"${content.subject}"` : 'undefined'}
};`;
	}
</script>

<div class="container mx-auto max-w-6xl p-8">
	<div class="mb-8">
		<h1 class="text-4xl font-bold">Weekly Digest Admin</h1>
		<p class="mt-2 text-base-content/70">Compose and send weekly updates to all subscribed users</p>
	</div>

	<div class="grid gap-8 lg:grid-cols-2">
		<!-- Editor Panel -->
		<div class="space-y-6">
			<!-- Subject & Intro -->
			<div class="card bg-base-200">
				<div class="card-body">
					<h2 class="card-title">Email Settings</h2>

					<div class="form-control">
						<label class="label">
							<span class="label-text">Subject (optional - defaults to "Kaiwa Weekly Update")</span>
						</label>
						<input
							type="text"
							bind:value={content.subject}
							placeholder="Kaiwa Weekly Update – Jan 20, 2025"
							class="input-bordered input"
						/>
					</div>

					<div class="form-control">
						<label class="label">
							<span class="label-text">Intro Message (optional)</span>
						</label>
						<textarea
							bind:value={content.intro}
							placeholder="Here's what we shipped this week..."
							class="textarea-bordered textarea"
							rows="3"
						></textarea>
					</div>
				</div>
			</div>

			<!-- Updates Section -->
			<div class="card bg-base-200">
				<div class="card-body">
					<div class="flex items-center justify-between">
						<h2 class="card-title">What Shipped (Required)</h2>
						<button class="btn btn-sm btn-primary" onclick={() => addUpdate('updates')}>
							+ Add Update
						</button>
					</div>

					{#each content.updates as update, i (update.linkUrl)}
						<div class="space-y-2 rounded-lg border border-base-300 p-4">
							<div class="flex items-center justify-between">
								<span class="font-medium">Update {i + 1}</span>
								{#if content.updates.length > 1}
									<button class="btn btn-xs btn-error" onclick={() => removeUpdate('updates', i)}>
										Remove
									</button>
								{/if}
							</div>

							<input
								type="text"
								bind:value={update.title}
								placeholder="Feature title"
								class="input-bordered input input-sm w-full"
							/>
							<textarea
								bind:value={update.summary}
								placeholder="Brief summary (1-2 sentences)"
								class="textarea-bordered textarea w-full textarea-sm"
								rows="2"
							></textarea>
							<div class="grid grid-cols-2 gap-2">
								<input
									type="text"
									bind:value={update.linkLabel}
									placeholder="Link text (optional)"
									class="input-bordered input input-sm"
								/>
								<input
									type="text"
									bind:value={update.linkUrl}
									placeholder="URL (optional)"
									class="input-bordered input input-sm"
								/>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Product Highlights -->
			<div class="card bg-base-200">
				<div class="card-body">
					<div class="flex items-center justify-between">
						<h2 class="card-title">Product Highlights (Optional)</h2>
						<button class="btn btn-sm btn-secondary" onclick={() => addUpdate('productHighlights')}>
							+ Add Highlight
						</button>
					</div>

					{#each content.productHighlights as highlight, i (i)}
						<div class="space-y-2 rounded-lg border border-base-300 p-4">
							<div class="flex items-center justify-between">
								<span class="font-medium">Highlight {i + 1}</span>
								<button
									class="btn btn-xs btn-error"
									onclick={() => removeUpdate('productHighlights', i)}
								>
									Remove
								</button>
							</div>

							<input
								type="text"
								bind:value={highlight.title}
								placeholder="Highlight title"
								class="input-bordered input input-sm w-full"
							/>
							<textarea
								bind:value={highlight.summary}
								placeholder="Brief summary"
								class="textarea-bordered textarea w-full textarea-sm"
								rows="2"
							></textarea>
						</div>
					{/each}
				</div>
			</div>

			<!-- Coming Up -->
			<div class="card bg-base-200">
				<div class="card-body">
					<div class="flex items-center justify-between">
						<h2 class="card-title">Coming Up Next (Optional)</h2>
						<button class="btn btn-sm btn-accent" onclick={() => addUpdate('upcoming')}>
							+ Add Upcoming
						</button>
					</div>

					{#each content.upcoming as item, i (i)}
						<div class="space-y-2 rounded-lg border border-base-300 p-4">
							<div class="flex items-center justify-between">
								<span class="font-medium">Item {i + 1}</span>
								<button class="btn btn-xs btn-error" onclick={() => removeUpdate('upcoming', i)}>
									Remove
								</button>
							</div>

							<input
								type="text"
								bind:value={item.title}
								placeholder="What's coming"
								class="input-bordered input input-sm w-full"
							/>
							<textarea
								bind:value={item.summary}
								placeholder="Brief teaser"
								class="textarea-bordered textarea w-full textarea-sm"
								rows="2"
							></textarea>
						</div>
					{/each}
				</div>
			</div>

			<!-- Actions -->
			<div class="card bg-base-200">
				<div class="card-body">
					<h2 class="card-title">Actions</h2>

					<div class="flex flex-wrap gap-2">
						<button class="btn btn-info" onclick={generatePreview}> 👁️ Preview Email </button>

						<button class="btn btn-neutral" onclick={copyScriptContent}> 📋 Copy to Script </button>

						<button
							class="btn btn-success"
							onclick={sendDigest}
							disabled={sendStatus === 'sending' ||
								content.updates.length === 0 ||
								!content.updates[0].title}
						>
							{#if sendStatus === 'sending'}
								<span class="loading loading-spinner"></span>
								Sending...
							{:else}
								📧 Send Digest Now
							{/if}
						</button>
					</div>

					{#if statusMessage}
						<div
							class="alert"
							class:alert-success={sendStatus === 'success'}
							class:alert-error={sendStatus === 'error'}
						>
							{statusMessage}
						</div>
					{/if}

					<div class="text-sm opacity-70">
						<p class="font-medium">💡 Recommended Workflow:</p>
						<ol class="ml-4 list-decimal space-y-1">
							<li>Fill in this week's updates</li>
							<li>Click "Preview Email" to see how it looks</li>
							<li>Click "Copy to Script" and paste into scripts/send-weekly-digest.ts</li>
							<li>Commit the script changes so cron picks it up Sunday</li>
						</ol>
					</div>
				</div>
			</div>
		</div>

		<!-- Preview Panel -->
		<div class="sticky top-8">
			<div class="card bg-base-200">
				<div class="card-body">
					<h2 class="card-title">Email Preview</h2>

					{#if previewHtml}
						<div class="overflow-auto rounded border border-base-300 bg-white">
							<!-- svelte-ignore no-at-html-tags -->
							<!-- Safe: previewHtml is weekly digest email HTML generated by our own email templates -->
							{@html previewHtml}
						</div>
					{:else}
						<div class="flex h-96 items-center justify-center text-base-content/50">
							Click "Preview Email" to see how it will look
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	:global(.alert) {
		margin-top: 1rem;
	}
</style>
