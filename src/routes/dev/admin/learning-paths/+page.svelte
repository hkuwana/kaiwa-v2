<script lang="ts">
	/**
	 * Admin Dashboard - Learning Paths
	 *
	 * Comprehensive admin interface for:
	 * - Creating learning paths (preferences/briefs)
	 * - Publishing as public templates
	 * - Assigning paths to users (by email or userId)
	 * - Managing assignments
	 * - Viewing analytics
	 */

	import { onMount } from 'svelte';

	let activeTab = $state('create');
	let loading = $state(false);
	let message = $state('');
	let messageType = $state<'success' | 'error' | 'info'>('info');

	// Create form
	let createMode = $state<'preferences' | 'brief'>('preferences');
	let targetLanguage = $state('ja');
	let presetName = $state("Meeting Your Partner's Parents");
	let presetDescription = $state(
		"Preparing to meet your Japanese partner's parents for the first time"
	);
	let duration = $state(7);
	let brief = $state(
		"A 1-week intensive course for meeting your Japanese partner's parents. Focus on polite conversation, family topics, cultural etiquette, gift-giving customs, and handling formal situations."
	);

	// Data
	let allPaths = $state<any[]>([]);
	let templates = $state<any[]>([]);
	let queueStats = $state({ pending: 0, processing: 0, ready: 0, failed: 0, total: 0 });
	let pendingJobs = $state<any[]>([]);
	let processingJobs = $state<any[]>([]);
	let readyJobs = $state<any[]>([]);
	let failedJobs = $state<any[]>([]);

	// Assignment form
	let selectedPathForAssignment = $state('');
	let assignToEmail = $state('');
	let assignToUserId = $state('');
	let assignmentNote = $state('');

	onMount(() => {
		loadAllData();
	});

	async function loadAllData() {
		await Promise.all([loadPaths(), loadTemplates(), loadQueueData()]);
	}

	async function loadPaths() {
		try {
			const response = await fetch('/api/learning-paths');
			if (response.ok) {
				const result = await response.json();
				allPaths = result.data?.paths || [];
			}
		} catch (error) {
			console.error('Failed to load paths:', error);
		}
	}

	async function loadTemplates() {
		try {
			const response = await fetch('/api/learning-paths?isTemplate=true');
			if (response.ok) {
				const result = await response.json();
				templates = result.data?.paths || [];
			}
		} catch (error) {
			console.error('Failed to load templates:', error);
		}
	}

	async function loadQueueStats() {
		try {
			const response = await fetch('/api/dev/learning-paths/queue/stats');
			if (response.ok) {
				const result = await response.json();
				queueStats = result.data || result.stats || queueStats;
			}
		} catch (error) {
			console.error('Failed to load queue stats:', error);
		}
	}

	async function loadQueueJobs() {
		try {
			const [pendingResponse, processingResponse, readyResponse, failedResponse] =
				await Promise.all([
					fetch('/api/dev/learning-paths/queue/jobs?status=pending&limit=100'),
					fetch('/api/dev/learning-paths/queue/jobs?status=processing&limit=100'),
					fetch('/api/dev/learning-paths/queue/jobs?status=ready&limit=100'),
					fetch('/api/dev/learning-paths/queue/jobs?status=failed&limit=100')
				]);

			if (pendingResponse.ok) {
				const result = await pendingResponse.json();
				pendingJobs = result.data?.jobs || [];
			}

			if (processingResponse.ok) {
				const result = await processingResponse.json();
				processingJobs = result.data?.jobs || [];
				if (processingJobs.length > 0) {
					console.warn('[Admin] Found stuck processing jobs:', processingJobs);
				}
			}

			if (readyResponse.ok) {
				const result = await readyResponse.json();
				readyJobs = result.data?.jobs || [];
			}

			if (failedResponse.ok) {
				const result = await failedResponse.json();
				failedJobs = result.data?.jobs || [];
			}
		} catch (error) {
			console.error('Failed to load queue jobs:', error);
		}
	}

	async function loadQueueData() {
		await Promise.all([loadQueueStats(), loadQueueJobs()]);
	}

	function getPathTitle(pathId: string) {
		return allPaths.find((path) => path.id === pathId)?.title || pathId;
	}

	function formatDateTime(value?: string) {
		if (!value) return '—';
		const date = new Date(value);
		return isNaN(date.getTime()) ? value : date.toLocaleString();
	}

	async function createPath() {
		loading = true;
		message = '';

		const endpoint =
			createMode === 'preferences'
				? '/api/learning-paths/from-preferences'
				: '/api/learning-paths/from-brief';

		const body =
			createMode === 'preferences'
				? {
						userPreferences: {
							targetLanguageId: targetLanguage,
							currentLanguageLevel: 'A2',
							practicalLevel: 'intermediate beginner',
							learningGoal: 'Connection',
							specificGoals: [presetDescription],
							challengePreference: 'moderate',
							correctionStyle: 'gentle'
						},
						presetName,
						presetDescription,
						duration
					}
				: {
						brief,
						targetLanguage,
						duration,
						difficultyRange: { min: 'A2', max: 'B1' },
						primarySkill: 'conversation'
					};

		try {
			const response = await fetch(endpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});

			const result = await response.json();

			if (result.success) {
				message = `✅ Created: ${result.data.path.title} (${result.data.queuedJobs} scenarios queued)`;
				messageType = 'success';
				await loadAllData();
			} else {
				message = `❌ ${result.error}`;
				messageType = 'error';
			}
		} catch (error) {
			message = `❌ ${error instanceof Error ? error.message : 'Unknown error'}`;
			messageType = 'error';
		} finally {
			loading = false;
		}
	}

	async function publishAsTemplate(pathId: string) {
		loading = true;

		try {
			const response = await fetch(`/api/learning-paths/${pathId}/share`, {
				method: 'POST'
			});

			const result = await response.json();

			if (result.success) {
				message = `✅ Published! View at /program/${result.data.template.shareSlug}`;
				messageType = 'success';
				await loadAllData();
			} else {
				message = `❌ ${result.error}`;
				messageType = 'error';
			}
		} catch (error) {
			message = `❌ ${error instanceof Error ? error.message : 'Unknown error'}`;
			messageType = 'error';
		} finally {
			loading = false;
		}
	}

	async function deletePath(pathId: string) {
		if (!confirm('Delete this path?')) return;

		loading = true;
		try {
			await fetch(`/api/learning-paths/${pathId}`, { method: 'DELETE' });
			message = '✅ Deleted';
			messageType = 'success';
			await loadAllData();
		} catch (error) {
			message = `❌ ${error instanceof Error ? error.message : 'Unknown error'}`;
			messageType = 'error';
		} finally {
			loading = false;
		}
	}

	async function assignPath() {
		if (!selectedPathForAssignment) {
			message = '❌ Select a path to assign';
			messageType = 'error';
			return;
		}

		if (!assignToEmail && !assignToUserId) {
			message = '❌ Enter email or user ID';
			messageType = 'error';
			return;
		}

		loading = true;

		try {
			const response = await fetch(`/api/learning-paths/${selectedPathForAssignment}/assign`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: assignToEmail || undefined,
					userId: assignToUserId || undefined,
					note: assignmentNote || undefined
				})
			});

			const result = await response.json();

			if (result.success) {
				message = `✅ Assigned to ${assignToEmail || assignToUserId}`;
				messageType = 'success';
				// Clear form
				assignToEmail = '';
				assignToUserId = '';
				assignmentNote = '';
			} else {
				message = `❌ ${result.error}`;
				messageType = 'error';
			}
		} catch (error) {
			message = `❌ ${error instanceof Error ? error.message : 'Unknown error'}`;
			messageType = 'error';
		} finally {
			loading = false;
		}
	}

	async function resetStuckJobs() {
		if (processingJobs.length === 0) {
			message = 'No stuck jobs to reset';
			messageType = 'info';
			return;
		}

		loading = true;
		console.log('[Admin] Resetting stuck processing jobs...');

		try {
			let resetCount = 0;
			for (const job of processingJobs) {
				// Use the retryJob endpoint to reset to pending
				const response = await fetch(`/api/dev/learning-paths/queue/jobs`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ jobId: job.id, action: 'retry' })
				});
				if (response.ok) resetCount++;
			}

			message = `✅ Reset ${resetCount} stuck jobs to pending`;
			messageType = 'success';
			console.log(`[Admin] Reset ${resetCount} jobs`);
			await loadQueueData();
		} catch (error) {
			console.error('[Admin] Reset failed:', error);
			message = `❌ ${error instanceof Error ? error.message : 'Unknown error'}`;
			messageType = 'error';
		} finally {
			loading = false;
		}
	}

	async function processQueue() {
		loading = true;
		console.log('[Admin] Starting queue processing...');
		try {
			const response = await fetch('/api/dev/learning-paths/queue/process', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ limit: 5, dryRun: false })
			});

			console.log('[Admin] Response status:', response.status);
			const result = await response.json();
			console.log('[Admin] Process result:', result);

			if (result.success) {
				const { processed, succeeded, failed, skipped, errors } = result.data || {};
				message = `✅ Processed ${processed || 0} jobs (${succeeded || 0} succeeded, ${failed || 0} failed, ${skipped || 0} skipped)`;
				messageType = 'success';

				if (errors && errors.length > 0) {
					console.warn('[Admin] Job errors:', errors);
					message += ` - ${errors.length} error(s) logged to console`;
				}
			} else {
				console.error('[Admin] Process failed:', result.error);
				message = `❌ ${result.error}`;
				messageType = 'error';
			}

			await loadQueueData();
		} catch (error) {
			console.error('[Admin] Queue processing error:', error);
			message = `❌ ${error instanceof Error ? error.message : 'Unknown error'}`;
			messageType = 'error';
		} finally {
			loading = false;
			console.log('[Admin] Queue processing complete');
		}
	}
</script>

<div class="container mx-auto max-w-7xl px-4 py-6">
	<!-- Header -->
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">⚙️ Learning Paths Admin</h1>
			<p class="text-base-content/70">Create, manage, and assign learning paths</p>
		</div>
		<div class="stats shadow">
			<div class="stat px-4 py-2">
				<div class="stat-title text-xs">Total Paths</div>
				<div class="stat-value text-2xl">{allPaths.length}</div>
			</div>
			<div class="stat px-4 py-2">
				<div class="stat-title text-xs">Templates</div>
				<div class="stat-value text-2xl">{templates.length}</div>
			</div>
			<div class="stat px-4 py-2">
				<div class="stat-title text-xs">Queue</div>
				<div class="stat-value text-2xl text-warning">{queueStats.pending}</div>
			</div>
		</div>
	</div>

	<!-- Message -->
	{#if message}
		<div
			class="alert alert-{messageType === 'success'
				? 'success'
				: messageType === 'error'
					? 'error'
					: 'info'} mb-4"
		>
			{message}
		</div>
	{/if}

	<!-- Tabs -->
	<div class="tabs-boxed mb-4 tabs">
		<button
			class="tab {activeTab === 'create' ? 'tab-active' : ''}"
			onclick={() => (activeTab = 'create')}
		>
			Create
		</button>
		<button
			class="tab {activeTab === 'paths' ? 'tab-active' : ''}"
			onclick={() => (activeTab = 'paths')}
		>
			All Paths
		</button>
		<button
			class="tab {activeTab === 'templates' ? 'tab-active' : ''}"
			onclick={() => (activeTab = 'templates')}
		>
			Templates
		</button>
		<button
			class="tab {activeTab === 'assign' ? 'tab-active' : ''}"
			onclick={() => (activeTab = 'assign')}
		>
			Assign
		</button>
		<button
			class="tab {activeTab === 'queue' ? 'tab-active' : ''}"
			onclick={() => {
				activeTab = 'queue';
				loadQueueData();
			}}
		>
			Queue
		</button>
	</div>

	<!-- Create Tab -->
	{#if activeTab === 'create'}
		<div class="card bg-base-200">
			<div class="card-body">
				<div class="mb-4 flex gap-4">
					<button
						class="btn btn-sm {createMode === 'preferences' ? 'btn-primary' : 'btn-outline'}"
						onclick={() => (createMode = 'preferences')}
					>
						From Preferences
					</button>
					<button
						class="btn btn-sm {createMode === 'brief' ? 'btn-primary' : 'btn-outline'}"
						onclick={() => (createMode = 'brief')}
					>
						From Brief
					</button>
				</div>

				{#if createMode === 'preferences'}
					<div class="grid gap-4 md:grid-cols-2">
						<div class="form-control">
							<label class="label"><span class="label-text">Language</span></label>
							<select class="select-bordered select" bind:value={targetLanguage}>
								<option value="ja">Japanese</option>
								<option value="es">Spanish</option>
								<option value="fr">French</option>
								<option value="de">German</option>
							</select>
						</div>
						<div class="form-control">
							<label class="label"><span class="label-text">Duration</span></label>
							<input
								type="number"
								class="input-bordered input"
								bind:value={duration}
								min="3"
								max="30"
							/>
						</div>
						<div class="form-control md:col-span-2">
							<label class="label"><span class="label-text">Preset Name</span></label>
							<input type="text" class="input-bordered input" bind:value={presetName} />
						</div>
						<div class="form-control md:col-span-2">
							<label class="label"><span class="label-text">Description</span></label>
							<textarea class="textarea-bordered textarea" bind:value={presetDescription}
							></textarea>
						</div>
					</div>
				{:else}
					<div class="grid gap-4 md:grid-cols-2">
						<div class="form-control">
							<label class="label"><span class="label-text">Language</span></label>
							<select class="select-bordered select" bind:value={targetLanguage}>
								<option value="ja">Japanese</option>
								<option value="es">Spanish</option>
								<option value="fr">French</option>
							</select>
						</div>
						<div class="form-control">
							<label class="label"><span class="label-text">Duration</span></label>
							<input
								type="number"
								class="input-bordered input"
								bind:value={duration}
								min="3"
								max="30"
							/>
						</div>
						<div class="form-control md:col-span-2">
							<label class="label"><span class="label-text">Creator Brief</span></label>
							<textarea class="textarea-bordered textarea h-32" bind:value={brief}></textarea>
						</div>
					</div>
				{/if}

				<div class="mt-4 card-actions justify-end">
					<button class="btn btn-primary" onclick={createPath} disabled={loading}>
						{loading ? 'Creating...' : 'Create Path'}
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- All Paths Tab -->
	{#if activeTab === 'paths'}
		<div class="space-y-2">
			{#each allPaths as path}
				<div class="card-compact card bg-base-200">
					<div class="card-body">
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<h3 class="font-bold">{path.title}</h3>
								<p class="text-sm text-base-content/70">{path.description}</p>
								<div class="mt-2 flex gap-2">
									<span class="badge badge-sm">{path.targetLanguage}</span>
									<span class="badge badge-sm">{path.schedule?.length} days</span>
									<span
										class="badge badge-sm badge-{path.status === 'active' ? 'success' : 'neutral'}"
										>{path.status}</span
									>
									{#if path.isTemplate}<span class="badge badge-sm badge-secondary">Template</span
										>{/if}
								</div>
							</div>
							<div class="flex gap-2">
								{#if !path.isTemplate}
									<button class="btn btn-outline btn-xs" onclick={() => publishAsTemplate(path.id)}
										>Publish</button
									>
								{:else}
									<a href="/program/{path.shareSlug}" target="_blank" class="btn btn-xs btn-primary"
										>View</a
									>
								{/if}
								<button class="btn btn-outline btn-xs btn-error" onclick={() => deletePath(path.id)}
									>Delete</button
								>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Templates Tab -->
	{#if activeTab === 'templates'}
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each templates as template}
				<div class="card bg-base-200 shadow-sm">
					<div class="card-body">
						<h3 class="card-title text-base">{template.title}</h3>
						<p class="line-clamp-2 text-sm text-base-content/70">{template.description}</p>
						<div class="mt-2 flex gap-2">
							<span class="badge badge-xs">{template.targetLanguage}</span>
							<span class="badge badge-xs">{template.schedule?.length} days</span>
						</div>
						<div class="mt-4 card-actions justify-end">
							<a href="/program/{template.shareSlug}" target="_blank" class="btn btn-xs btn-primary"
								>View</a
							>
							<button
								class="btn btn-outline btn-xs btn-error"
								onclick={() => deletePath(template.id)}>Delete</button
							>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Assign Tab -->
	{#if activeTab === 'assign'}
		<div class="card bg-base-200">
			<div class="card-body">
				<h2 class="card-title">Assign Path to User</h2>

				<div class="form-control">
					<label class="label"><span class="label-text">Select Path</span></label>
					<select class="select-bordered select" bind:value={selectedPathForAssignment}>
						<option value="">Choose a path...</option>
						{#each allPaths as path}
							<option value={path.id}>{path.title} ({path.schedule?.length} days)</option>
						{/each}
					</select>
				</div>

				<div class="divider">OR</div>

				<div class="grid gap-4 md:grid-cols-2">
					<div class="form-control">
						<label class="label"><span class="label-text">User Email</span></label>
						<input
							type="email"
							class="input-bordered input"
							bind:value={assignToEmail}
							placeholder="user@example.com"
						/>
					</div>
					<div class="form-control">
						<label class="label"><span class="label-text">User ID</span></label>
						<input
							type="text"
							class="input-bordered input"
							bind:value={assignToUserId}
							placeholder="uuid"
						/>
					</div>
				</div>

				<div class="form-control">
					<label class="label"><span class="label-text">Note (optional)</span></label>
					<textarea
						class="textarea-bordered textarea"
						bind:value={assignmentNote}
						placeholder="Internal note about this assignment"
					></textarea>
				</div>

				<div class="card-actions justify-end">
					<button class="btn btn-primary" onclick={assignPath} disabled={loading}>
						{loading ? 'Assigning...' : 'Assign Path'}
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Queue Tab -->
	{#if activeTab === 'queue'}
		<div class="space-y-4">
			<div class="stats w-full shadow">
				<div class="stat">
					<div class="stat-title">Pending</div>
					<div class="stat-value text-warning">{queueStats.pending}</div>
				</div>
				<div class="stat">
					<div class="stat-title">Processing</div>
					<div class="stat-value text-info">{queueStats.processing}</div>
				</div>
				<div class="stat">
					<div class="stat-title">Ready</div>
					<div class="stat-value text-success">{queueStats.ready}</div>
				</div>
				<div class="stat">
					<div class="stat-title">Failed</div>
					<div class="stat-value text-error">{queueStats.failed}</div>
				</div>
			</div>

			<div class="card bg-base-200">
				<div class="card-body">
					<div class="mb-4 flex items-center justify-between">
						<h3 class="card-title">Queued Learning Paths</h3>
						<div class="card-actions">
							<button class="btn btn-sm btn-outline" onclick={loadQueueData}>Refresh</button>
						</div>
					</div>

					<div class="grid gap-4 lg:grid-cols-2">
						<!-- Pending Jobs -->
						<div>
							<div class="mb-2 flex items-center justify-between">
								<h4 class="font-semibold">Pending ({pendingJobs.length})</h4>
								<span class="badge badge-warning badge-sm">pending</span>
							</div>

							{#if pendingJobs.length === 0}
								<p class="text-sm text-base-content/70">No pending queue items.</p>
							{:else}
								<ul class="max-h-48 divide-y divide-base-300 overflow-y-auto">
									{#each pendingJobs as job}
										<li class="py-2">
											<div class="flex items-start justify-between gap-4">
												<div>
													<p class="font-semibold">{getPathTitle(job.pathId)}</p>
													<p class="text-xs text-base-content/70">
														Day {job.dayIndex} • Retries: {job.retryCount || 0}
													</p>
												</div>
												<div class="text-right text-xs text-base-content/70">
													<span class="badge badge-warning badge-sm mb-1">pending</span>
												</div>
											</div>
										</li>
									{/each}
								</ul>
							{/if}
						</div>

						<!-- Processing Jobs (Stuck) -->
						<div>
							<div class="mb-2 flex items-center justify-between">
								<h4 class="font-semibold">Processing ({processingJobs.length})</h4>
								<span class="badge badge-info badge-sm">processing</span>
							</div>

							{#if processingJobs.length === 0}
								<p class="text-sm text-base-content/70">No jobs currently processing.</p>
							{:else}
								<div class="alert alert-warning mb-2 py-2 text-sm">
									These jobs may be stuck. Use "Reset Stuck Jobs" to retry.
								</div>
								<ul class="max-h-48 divide-y divide-base-300 overflow-y-auto">
									{#each processingJobs as job}
										<li class="py-2">
											<div class="flex items-start justify-between gap-4">
												<div>
													<p class="font-semibold">{getPathTitle(job.pathId)}</p>
													<p class="text-xs text-base-content/70">
														Day {job.dayIndex} • Started {formatDateTime(job.lastProcessedAt)}
													</p>
													{#if job.lastError}
														<p class="text-xs text-error">{job.lastError}</p>
													{/if}
												</div>
												<div class="text-right text-xs text-base-content/70">
													<span class="badge badge-info badge-sm mb-1">processing</span>
												</div>
											</div>
										</li>
									{/each}
								</ul>
							{/if}
						</div>

						<!-- Ready Jobs -->
						<div>
							<div class="mb-2 flex items-center justify-between">
								<h4 class="font-semibold">Ready ({readyJobs.length})</h4>
								<span class="badge badge-success badge-sm">ready</span>
							</div>

							{#if readyJobs.length === 0}
								<p class="text-sm text-base-content/70">No ready queue items.</p>
							{:else}
								<ul class="max-h-48 divide-y divide-base-300 overflow-y-auto">
									{#each readyJobs as job}
										<li class="py-2">
											<div class="flex items-start justify-between gap-4">
												<div>
													<p class="font-semibold">{getPathTitle(job.pathId)}</p>
													<p class="text-xs text-base-content/70">Day {job.dayIndex}</p>
												</div>
												<div class="text-right text-xs text-base-content/70">
													<span class="badge badge-success badge-sm mb-1">ready</span>
												</div>
											</div>
										</li>
									{/each}
								</ul>
							{/if}
						</div>

						<!-- Failed Jobs -->
						<div>
							<div class="mb-2 flex items-center justify-between">
								<h4 class="font-semibold">Failed ({failedJobs.length})</h4>
								<span class="badge badge-error badge-sm">failed</span>
							</div>

							{#if failedJobs.length === 0}
								<p class="text-sm text-base-content/70">No failed jobs.</p>
							{:else}
								<ul class="max-h-48 divide-y divide-base-300 overflow-y-auto">
									{#each failedJobs as job}
										<li class="py-2">
											<div class="flex items-start justify-between gap-4">
												<div>
													<p class="font-semibold">{getPathTitle(job.pathId)}</p>
													<p class="text-xs text-base-content/70">
														Day {job.dayIndex} • Retries: {job.retryCount || 0}
													</p>
													{#if job.lastError}
														<p class="max-w-xs truncate text-xs text-error" title={job.lastError}>
															{job.lastError}
														</p>
													{/if}
												</div>
												<div class="text-right text-xs text-base-content/70">
													<span class="badge badge-error badge-sm mb-1">failed</span>
												</div>
											</div>
										</li>
									{/each}
								</ul>
							{/if}
						</div>
					</div>
				</div>
			</div>

			<div class="card bg-base-200">
				<div class="card-body">
					<h3 class="card-title">Process Queue</h3>
					<p class="text-sm text-base-content/70">Manually trigger queue processing for testing</p>
					<div class="card-actions flex-wrap">
						<button class="btn btn-primary" onclick={processQueue} disabled={loading}>
							{loading ? 'Processing...' : 'Process 5 Jobs'}
						</button>
						<button class="btn btn-outline" onclick={loadQueueData} disabled={loading}>
							Refresh Queue
						</button>
						{#if processingJobs.length > 0}
							<button class="btn btn-warning" onclick={resetStuckJobs} disabled={loading}>
								Reset {processingJobs.length} Stuck Job{processingJobs.length > 1 ? 's' : ''}
							</button>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
