<script lang="ts">
	import { onMount } from 'svelte';

	let candidates: Array<{ email: string; displayName: string; createdAt: string }> = [];
	let selectedEmails: Set<string> = new Set();
	let loading = false;
	let message = '';
	let emailTemplate = `Hi {name},

I'm finalizing Kaiwa's Product Advisory Board and you came to mind.

I have 10 people committed, but 2 final spots. I looked back and saw you signed up to learn {language}, and thought this might be perfect.

PAB members get:
✅ Free unlimited access to Kaiwa
✅ Monthly 1-hour meetings with me + other members
✅ Direct influence on what features we build
✅ Early access to everything

Time commitment: ~1 hour/month for meetings + light feedback as you use the app.

I need to finalize the roster in the next 24 hours so we can kick off next week.

Interested? Just reply "I'm in" and I'll send the details.

No worries if not - I'll keep you in the loop for future opportunities!

Thanks,
Hiro
Kaiwa Founder

P.S. Even if PAB isn't for you, I'd love to hear how your language learning is going!`;

	onMount(async () => {
		await loadCandidates();
	});

	async function loadCandidates() {
		loading = true;
		try {
			const res = await fetch('/dev/pab-invite?/candidates');
			const data = await res.json();
			candidates = data.candidates || [];
		} catch (error) {
			message = 'Error loading candidates: ' + error;
		} finally {
			loading = false;
		}
	}

	function toggleEmail(email: string) {
		if (selectedEmails.has(email)) {
			selectedEmails.delete(email);
		} else {
			selectedEmails.add(email);
		}
		selectedEmails = selectedEmails; // trigger reactivity
	}

	async function sendInvites() {
		if (selectedEmails.size === 0) {
			message = 'Please select at least one candidate';
			return;
		}

		if (
			!confirm(
				`Send invites to ${selectedEmails.size} people? This will use your Resend email quota.`
			)
		) {
			return;
		}

		loading = true;
		message = '';

		try {
			const res = await fetch('/dev/pab-invite', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					emails: Array.from(selectedEmails),
					template: emailTemplate
				})
			});

			const data = await res.json();

			if (res.ok) {
				message = `✅ Successfully sent invites to ${data.sent} people!`;
				selectedEmails.clear();
				selectedEmails = selectedEmails;
			} else {
				message = `❌ Error: ${data.error}`;
			}
		} catch (error) {
			message = `❌ Error sending invites: ${error}`;
		} finally {
			loading = false;
		}
	}
</script>

<div class="container">
	<h1>📧 PAB Final 2 Slots - Invite Tool</h1>

	<div class="warning">
		<strong>⚠️ Important:</strong> This tool sends real emails using Resend. Use carefully!
	</div>

	<div class="section">
		<h2>Step 1: Review Candidates</h2>
		<p>These are recent, active users who might be good PAB candidates:</p>

		{#if loading && candidates.length === 0}
			<p>Loading candidates...</p>
		{:else if candidates.length === 0}
			<p>No candidates found. Check your database query.</p>
		{:else}
			<table>
				<thead>
					<tr>
						<th>Select</th>
						<th>Name</th>
						<th>Email</th>
						<th>Signed Up</th>
					</tr>
				</thead>
				<tbody>
					{#each candidates as candidate}
						<tr>
							<td>
								<input
									type="checkbox"
									checked={selectedEmails.has(candidate.email)}
									on:change={() => toggleEmail(candidate.email)}
								/>
							</td>
							<td>{candidate.displayName || 'N/A'}</td>
							<td>{candidate.email}</td>
							<td>{new Date(candidate.createdAt).toLocaleDateString()}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}

		<p><strong>Selected: {selectedEmails.size}</strong></p>
	</div>

	<div class="section">
		<h2>Step 2: Customize Email Template</h2>
		<p>
			Available variables: <code>{'{name}'}</code>, <code>{'{language}'}</code>
		</p>

		<textarea bind:value={emailTemplate} rows="20"></textarea>
	</div>

	<div class="section">
		<h2>Step 3: Send Invites</h2>

		<button on:click={sendInvites} disabled={loading || selectedEmails.size === 0}>
			{#if loading}
				Sending...
			{:else}
				📨 Send Invites to {selectedEmails.size} People
			{/if}
		</button>

		{#if message}
			<div class="message" class:success={message.includes('✅')} class:error={message.includes('❌')}>
				{message}
			</div>
		{/if}
	</div>

	<div class="section">
		<h2>💡 Recommendations</h2>
		<ul>
			<li>
				<strong>For 2 spots:</strong> Email 8-10 people (expect ~20-30% response rate)
			</li>
			<li><strong>Personalize:</strong> Edit template to reference specific details about each person</li>
			<li>
				<strong>Better approach:</strong> Copy emails and send individually from your personal email
				for maximum impact
			</li>
			<li><strong>Timing:</strong> Send between 9-10am for best open rates</li>
		</ul>
	</div>
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		font-family: system-ui, -apple-system, sans-serif;
	}

	.warning {
		background: #fef3c7;
		border: 2px solid #f59e0b;
		border-radius: 8px;
		padding: 1rem;
		margin: 1rem 0;
	}

	.section {
		margin: 2rem 0;
		padding: 1.5rem;
		background: #f8f9fa;
		border-radius: 8px;
	}

	h1 {
		color: #1e40af;
		margin-bottom: 1rem;
	}

	h2 {
		color: #374151;
		margin-bottom: 1rem;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		background: white;
		border-radius: 8px;
		overflow: hidden;
	}

	th,
	td {
		padding: 0.75rem;
		text-align: left;
		border-bottom: 1px solid #e5e7eb;
	}

	th {
		background: #f3f4f6;
		font-weight: 600;
	}

	tr:hover {
		background: #f9fafb;
	}

	textarea {
		width: 100%;
		padding: 1rem;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-family: 'Courier New', monospace;
		font-size: 14px;
	}

	button {
		background: #2563eb;
		color: white;
		padding: 1rem 2rem;
		border: none;
		border-radius: 8px;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
	}

	button:hover:not(:disabled) {
		background: #1d4ed8;
	}

	button:disabled {
		background: #9ca3af;
		cursor: not-allowed;
	}

	.message {
		margin-top: 1rem;
		padding: 1rem;
		border-radius: 8px;
	}

	.message.success {
		background: #d1fae5;
		color: #065f46;
	}

	.message.error {
		background: #fee2e2;
		color: #991b1b;
	}

	code {
		background: #e5e7eb;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-family: 'Courier New', monospace;
	}
</style>
