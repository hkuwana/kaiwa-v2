<script lang="ts">
	import { onMount } from 'svelte';
	import { userManager } from '$lib/stores/user.store.svelte';
	import { posthogManager } from '$lib/client/posthog';

	let isSending = $state(false);
	let result = $state<string>('');
	let previewHtml = $state<string>('');
	let isLoadingPreview = $state(false);
	let weeklyUpdate = $state<any>(null);
	let availableUpdates = $state<any[]>([]);
	let selectedUpdateDate = $state<string>('');

	onMount(() => {
		console.log('📧 Weekly Email Dev Page');
		posthogManager.trackEvent('dev_weekly_email_page_viewed');
		loadAvailableUpdates();
	});

	async function loadAvailableUpdates() {
		try {
			const response = await fetch('/api/dev/weekly-email/available-updates');
			const data = await response.json();
			availableUpdates = data.updates || [];

			if (availableUpdates.length > 0) {
				selectedUpdateDate = availableUpdates[0].date;
				await loadPreview();
			}
		} catch (error) {
			console.error('Error loading available updates:', error);
			result = `Error loading updates: ${error}`;
		}
	}

	async function loadPreview() {
		if (!selectedUpdateDate) return;

		isLoadingPreview = true;
		try {
			const response = await fetch(`/api/dev/weekly-email/preview?date=${selectedUpdateDate}`);
			const data = await response.json();

			if (data.success) {
				previewHtml = data.html;
				weeklyUpdate = data.weeklyUpdate;
			} else {
				result = `Preview error: ${data.error}`;
			}
		} catch (error) {
			console.error('Error loading preview:', error);
			result = `Preview error: ${error}`;
		} finally {
			isLoadingPreview = false;
		}
	}

	async function sendTestEmail() {
		if (!selectedUpdateDate) return;

		isSending = true;
		try {
			const response = await fetch('/api/dev/weekly-email/send-test', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ date: selectedUpdateDate })
			});

			const data = await response.json();

			if (data.success) {
				result = `✅ Test email sent successfully!\n\nSubject: ${data.subject}\nSent to: ${data.sentTo}\n\nPreview available in your inbox.`;
			} else {
				result = `❌ Error: ${data.error}`;
			}
		} catch (error) {
			console.error('Error sending test email:', error);
			result = `❌ Error: ${error}`;
		} finally {
			isSending = false;
		}
	}

	async function sendToAllSubscribers() {
		if (!selectedUpdateDate) return;

		if (!confirm('Are you sure you want to send this to ALL subscribers? This cannot be undone.')) {
			return;
		}

		isSending = true;
		try {
			const response = await fetch('/api/dev/weekly-email/send-all', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ date: selectedUpdateDate })
			});

			const data = await response.json();

			if (data.success) {
				result = `🎉 Weekly product updates sent successfully!\n\n📊 Stats:\n- Sent: ${data.sent}\n- Skipped: ${data.skipped}\n- Errors: ${data.errors?.length || 0}\n\nDate: ${data.weeklyUpdateDate}`;
			} else {
				result = `❌ Error: ${data.error}`;
			}
		} catch (error) {
			console.error('Error sending to all subscribers:', error);
			result = `❌ Error: ${error}`;
		} finally {
			isSending = false;
		}
	}

	async function createNewUpdate() {
		try {
			const response = await fetch('/api/dev/weekly-email/create-new', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});

			const data = await response.json();

			if (data.success) {
				result = `✅ New weekly update file created!\n\nFile: ${data.filename}\nLocation: ${data.filePath}\n\nYou can now edit the file and refresh this page to see it.`;
				await loadAvailableUpdates();
			} else {
				result = `❌ Error: ${data.error}`;
			}
		} catch (error) {
			console.error('Error creating new update:', error);
			result = `❌ Error: ${error}`;
		}
	}
</script>

<div class="container">
	<h1>📧 Weekly Product Updates</h1>
	<p class="subtitle">Preview, format, and send your weekly product update emails</p>

	{#if !userManager.isLoggedIn}
		<div class="error">
			<p>Please log in to access this page.</p>
		</div>
	{:else}
		<div class="controls">
			<div class="control-group">
				<label for="update-select">Select Weekly Update:</label>
				<select id="update-select" bind:value={selectedUpdateDate} on:change={loadPreview}>
					{#each availableUpdates as update}
						<option value={update.date}
							>{update.date} - {update.updates?.length || 0} updates</option
						>
					{/each}
				</select>
				<button on:click={loadPreview} disabled={isLoadingPreview}>
					{isLoadingPreview ? 'Loading...' : '🔄 Refresh Preview'}
				</button>
			</div>

			<div class="control-group">
				<button on:click={createNewUpdate} class="create-btn"> 📝 Create New Weekly Update </button>
			</div>
		</div>

		{#if weeklyUpdate}
			<div class="update-info">
				<h3>📄 Weekly Update: {weeklyUpdate.date}</h3>
				<div class="stats">
					<span>Updates: {weeklyUpdate.updates?.length || 0}</span>
					<span>Highlights: {weeklyUpdate.highlights?.length || 0}</span>
					<span>Upcoming: {weeklyUpdate.upcoming?.length || 0}</span>
					<span>Notes: {weeklyUpdate.notes ? 'Yes' : 'No'}</span>
				</div>
			</div>
		{/if}

		{#if previewHtml}
			<div class="preview-section">
				<h3>📧 Email Preview</h3>
				<div class="preview-container">
					{@html previewHtml}
				</div>
			</div>
		{/if}

		<div class="actions">
			<button on:click={sendTestEmail} disabled={isSending || !selectedUpdateDate} class="test-btn">
				{isSending ? 'Sending...' : '📨 Send Test Email'}
			</button>
			<button
				on:click={sendToAllSubscribers}
				disabled={isSending || !selectedUpdateDate}
				class="send-btn"
			>
				{isSending ? 'Sending...' : '🚀 Send to All Subscribers'}
			</button>
		</div>

		{#if result}
			<div class="result">
				<pre>{result}</pre>
			</div>
		{/if}
	{/if}
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	h1 {
		color: #1f2937;
		margin-bottom: 0.5rem;
	}

	.subtitle {
		color: #6b7280;
		margin-bottom: 2rem;
	}

	.error {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #dc2626;
		padding: 1rem;
		border-radius: 8px;
	}

	.controls {
		background: #f9fafb;
		padding: 1.5rem;
		border-radius: 12px;
		margin-bottom: 2rem;
	}

	.control-group {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.control-group:last-child {
		margin-bottom: 0;
	}

	label {
		font-weight: 600;
		color: #374151;
		min-width: 150px;
	}

	select {
		padding: 0.5rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 14px;
		min-width: 200px;
	}

	button {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 6px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.create-btn {
		background: #3b82f6;
		color: white;
	}

	.create-btn:hover:not(:disabled) {
		background: #2563eb;
	}

	.update-info {
		background: #eff6ff;
		border: 1px solid #bfdbfe;
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 2rem;
	}

	.update-info h3 {
		margin: 0 0 0.5rem 0;
		color: #1e40af;
	}

	.stats {
		display: flex;
		gap: 1rem;
		font-size: 14px;
		color: #374151;
	}

	.stats span {
		background: white;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
	}

	.preview-section {
		margin-bottom: 2rem;
	}

	.preview-section h3 {
		margin-bottom: 1rem;
		color: #1f2937;
	}

	.preview-container {
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		overflow: hidden;
		background: white;
	}

	.actions {
		display: flex;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.test-btn {
		background: #10b981;
		color: white;
	}

	.test-btn:hover:not(:disabled) {
		background: #059669;
	}

	.send-btn {
		background: #dc2626;
		color: white;
	}

	.send-btn:hover:not(:disabled) {
		background: #b91c1c;
	}

	.result {
		background: #f3f4f6;
		border: 1px solid #d1d5db;
		padding: 1rem;
		border-radius: 8px;
	}

	.result pre {
		margin: 0;
		white-space: pre-wrap;
		font-family:
			'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
		font-size: 14px;
		line-height: 1.5;
	}
</style>
