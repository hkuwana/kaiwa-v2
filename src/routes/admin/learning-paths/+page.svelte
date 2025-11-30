<script lang="ts">
	/**
	 * Admin Dashboard - Learning Paths
	 *
	 * A Jony Ive-inspired admin interface organized into clear phases:
	 *
	 * Phase 1: INTAKE - Capture user requirements (transcript/notes → AI brief)
	 * Phase 2: BUILD - Create the 28-day learning path (auto-triggered)
	 * Phase 3: REVIEW - Calendar view of the path, day-by-day breakdown
	 * Phase 4: ASSIGN - Assign path to user and send notification email
	 * Phase 5: MONITOR - Queue status, scenario generation progress
	 */

	import { onMount } from 'svelte';
	import {
		fillLearningPathBriefPrompt,
		type ScaffoldingLevel
	} from '$lib/data/prompts';

	// Current phase
	let currentPhase = $state<1 | 2 | 3 | 4 | 5>(1);

	// Loading states
	let loading = $state(false);
	let initialLoadComplete = $state(false);
	let generatingPath = $state(false);
	let generationSeconds = $state(0);
	let generationTimer: ReturnType<typeof setInterval> | null = null;

	// Messages
	let message = $state('');
	let messageType = $state<'success' | 'error' | 'info'>('info');

	// Debug: Last API response
	let lastApiResponse = $state<any>(null);
	let lastApiError = $state<string | null>(null);

	// Timeout helper
	const REQUEST_TIMEOUT = 30000;
	const AI_REQUEST_TIMEOUT = 120000; // 2 minutes for AI-heavy operations
	async function fetchWithTimeout(
		url: string,
		options: RequestInit = {},
		timeoutMs = REQUEST_TIMEOUT
	): Promise<Response> {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
		try {
			return await fetch(url, { ...options, signal: controller.signal });
		} finally {
			clearTimeout(timeoutId);
		}
	}

	// ========================================
	// PHASE 1: INTAKE - Capture Requirements
	// ========================================
	let transcriptInput = $state('');
	let transcriptLanguage = $state('ja');
	let transcriptDuration = $state(28);
	let learnerLevel = $state<ScaffoldingLevel>('elementary');
	let generatedBrief = $state('');
	let briefCopied = $state(false);

	// Available scaffolding levels for the dropdown - with friendly labels
	const LEVELS = [
		{
			code: 'beginner' as ScaffoldingLevel,
			label: 'Just starting',
			description: 'Knows hello/goodbye, counting'
		},
		{
			code: 'elementary' as ScaffoldingLevel,
			label: 'Knows basics',
			description: 'Simple sentences, common phrases'
		},
		{
			code: 'intermediate' as ScaffoldingLevel,
			label: 'Can chat a bit',
			description: 'Holds basic conversations'
		},
		{
			code: 'advanced' as ScaffoldingLevel,
			label: 'Pretty fluent',
			description: 'Needs real-world polish'
		}
	];

	// Derived selected level info for the UI
	let selectedLevel = $derived(LEVELS.find((l) => l.code === learnerLevel));

	const LANGUAGES = [
		{ code: 'ja', name: 'Japanese' },
		{ code: 'es', name: 'Spanish' },
		{ code: 'fr', name: 'French' },
		{ code: 'de', name: 'German' },
		{ code: 'ko', name: 'Korean' },
		{ code: 'zh', name: 'Mandarin Chinese' },
		{ code: 'pt', name: 'Portuguese' },
		{ code: 'it', name: 'Italian' }
	];

	function getLanguageName(code: string): string {
		return LANGUAGES.find((l) => l.code === code)?.name || code;
	}

	function getFilledPrompt(): string {
		return fillLearningPathBriefPrompt({
			transcript: transcriptInput,
			language: getLanguageName(transcriptLanguage),
			duration: transcriptDuration
		});
	}

	async function copyPromptToClipboard() {
		try {
			await navigator.clipboard.writeText(getFilledPrompt());
			briefCopied = true;
			showMessage('Prompt copied! Paste into ChatGPT or Claude.', 'success');
			setTimeout(() => (briefCopied = false), 3000);
		} catch {
			showMessage('Failed to copy. Please select and copy manually.', 'error');
		}
	}

	/**
	 * Auto-create the learning path when brief is ready
	 * Skips the manual "Build" phase and goes straight to Review
	 */
	// Map scaffolding level to difficulty range
	function getDifficultyRange(level: ScaffoldingLevel): { min: string; max: string } {
		const ranges: Record<ScaffoldingLevel, { min: string; max: string }> = {
			beginner: { min: 'A1', max: 'A2' },
			elementary: { min: 'A2', max: 'B1' },
			intermediate: { min: 'B1', max: 'B2' },
			advanced: { min: 'B2', max: 'C1' }
		};
		return ranges[level];
	}

	async function proceedToBuild() {
		if (!generatedBrief) {
			showMessage('Please paste the AI-generated brief first.', 'error');
			return;
		}

		// Set the values
		brief = generatedBrief;
		targetLanguage = transcriptLanguage;
		duration = transcriptDuration;

		// Reset debug state
		lastApiResponse = null;
		lastApiError = null;

		// Auto-create the path with progress tracking
		loading = true;
		generatingPath = true;
		generationSeconds = 0;
		generationTimer = setInterval(() => {
			generationSeconds += 1;
		}, 1000);
		showMessage('Creating your learning path...', 'info');

		const difficultyRange = getDifficultyRange(learnerLevel);

		try {
			// Use extended timeout for AI generation (2 minutes)
			const response = await fetchWithTimeout(
				'/api/learning-paths/from-brief',
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						brief: generatedBrief,
						targetLanguage: transcriptLanguage,
						duration: transcriptDuration,
						difficultyRange,
						primarySkill: 'conversation',
						learnerLevel // Pass the scaffolding level
					})
				},
				AI_REQUEST_TIMEOUT
			);

			const result = await response.json();

			// Store for debugging
			lastApiResponse = result;

			if (result.success) {
				createdPath = result.data.path;
				selectedPath = result.data.path;
				showMessage(
					`Created: ${createdPath.title} (${result.data.queuedJobs} scenarios queued)`,
					'success'
				);
				await loadPaths();
				await loadQueueStats();
				// Skip to Review phase
				currentPhase = 3;
			} else {
				lastApiError = result.error || 'Unknown error';
				showMessage(result.error || 'Failed to create path', 'error');
				// Stay on Phase 1 to show debug info, not Phase 2
				// currentPhase = 2;
			}
		} catch (error: any) {
			const errorMsg =
				error.name === 'AbortError'
					? `Request timed out after ${generationSeconds} seconds. The path may still be generating on the server.`
					: error.message;
			lastApiError = errorMsg;
			showMessage(errorMsg, 'error');
			// Stay on Phase 1 to show debug info
			// currentPhase = 2;
		} finally {
			loading = false;
			generatingPath = false;
			if (generationTimer) {
				clearInterval(generationTimer);
				generationTimer = null;
			}
		}
	}

	// ========================================
	// PHASE 2: BUILD - Create Learning Path
	// ========================================
	let targetLanguage = $state('ja');
	let duration = $state(14);
	let brief = $state('');
	let createdPath = $state<any>(null);

	async function createPath() {
		if (!brief.trim()) {
			showMessage('Please enter a brief for the learning path.', 'error');
			return;
		}

		loading = true;
		try {
			const response = await fetchWithTimeout('/api/learning-paths/from-brief', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					brief,
					targetLanguage,
					duration,
					difficultyRange: { min: 'A2', max: 'B1' },
					primarySkill: 'conversation'
				})
			});

			const result = await response.json();

			if (result.success) {
				createdPath = result.data.path;
				showMessage(
					`Created: ${createdPath.title} (${result.data.queuedJobs} scenarios queued)`,
					'success'
				);
				await loadPaths();
				await loadQueueStats();
				currentPhase = 3;
			} else {
				showMessage(result.error || 'Failed to create path', 'error');
			}
		} catch (error: any) {
			showMessage(error.name === 'AbortError' ? 'Request timed out' : error.message, 'error');
		} finally {
			loading = false;
		}
	}

	// ========================================
	// PHASE 3: REVIEW - Calendar View
	// ========================================
	let selectedPath = $state<any>(null);

	function selectPathForReview(path: any) {
		selectedPath = path;
		currentPhase = 3;
	}

	function getWeekNumber(dayIndex: number): number {
		return Math.ceil(dayIndex / 7);
	}

	function getDayOfWeek(dayIndex: number): string {
		const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
		return days[(dayIndex - 1) % 7];
	}

	// ========================================
	// PHASE 4: ASSIGN - Assign to User
	// ========================================
	let assignEmail = $state('');
	let assignNote = $state('');
	let sendEmailNotification = $state(true);

	async function assignPath() {
		if (!selectedPath) {
			showMessage('Please select a path first.', 'error');
			return;
		}
		if (!assignEmail.trim()) {
			showMessage('Please enter an email address.', 'error');
			return;
		}

		loading = true;
		try {
			const response = await fetchWithTimeout(`/api/learning-paths/${selectedPath.id}/assign`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: assignEmail,
					note: assignNote || undefined,
					sendEmail: sendEmailNotification
				})
			});

			const result = await response.json();

			if (result.success) {
				showMessage(
					`Assigned to ${assignEmail}${sendEmailNotification ? ' - Email notification sent!' : ''}`,
					'success'
				);
				assignEmail = '';
				assignNote = '';
			} else {
				showMessage(result.error || 'Failed to assign path', 'error');
			}
		} catch (error: any) {
			showMessage(error.name === 'AbortError' ? 'Request timed out' : error.message, 'error');
		} finally {
			loading = false;
		}
	}

	// ========================================
	// PHASE 5: MONITOR - Queue & Generation
	// ========================================
	let queueStats = $state({ pending: 0, processing: 0, ready: 0, failed: 0 });
	let pendingJobs = $state<any[]>([]);
	let failedJobs = $state<any[]>([]);

	async function loadQueueStats() {
		try {
			const response = await fetchWithTimeout('/api/dev/learning-paths/queue/stats');
			if (response.ok) {
				const result = await response.json();
				queueStats = result.data || result.stats || queueStats;
			}
		} catch (error) {
			console.error('[Admin] Failed to load queue stats:', error);
		}
	}

	async function loadQueueJobs() {
		try {
			const [pendingRes, failedRes] = await Promise.all([
				fetchWithTimeout('/api/dev/learning-paths/queue/jobs?status=pending&limit=20'),
				fetchWithTimeout('/api/dev/learning-paths/queue/jobs?status=failed&limit=20')
			]);

			if (pendingRes.ok) {
				const result = await pendingRes.json();
				pendingJobs = result.data?.jobs || [];
			}
			if (failedRes.ok) {
				const result = await failedRes.json();
				failedJobs = result.data?.jobs || [];
			}
		} catch (error) {
			console.error('[Admin] Failed to load queue jobs:', error);
		}
	}

	async function processQueue() {
		loading = true;
		try {
			const response = await fetch('/api/dev/learning-paths/queue/process', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ limit: 5, dryRun: false })
			});

			const result = await response.json();

			if (result.success) {
				const { processed, succeeded, failed } = result.data || {};
				showMessage(
					`Processed ${processed || 0} jobs (${succeeded || 0} succeeded, ${failed || 0} failed)`,
					'success'
				);
			} else {
				showMessage(result.error || 'Processing failed', 'error');
			}

			await loadQueueStats();
			await loadQueueJobs();
		} catch (error: any) {
			showMessage(error.message, 'error');
		} finally {
			loading = false;
		}
	}

	// ========================================
	// DATA - All Paths
	// ========================================
	let allPaths = $state<any[]>([]);

	async function loadPaths() {
		try {
			const response = await fetchWithTimeout('/api/learning-paths');
			if (response.ok) {
				const result = await response.json();
				allPaths = result.data?.paths || [];
			}
		} catch (error) {
			console.error('[Admin] Failed to load paths:', error);
		}
	}

	async function deletePath(pathId: string) {
		if (!confirm('Delete this path? This cannot be undone.')) return;

		loading = true;
		try {
			await fetchWithTimeout(`/api/learning-paths/${pathId}`, { method: 'DELETE' });
			showMessage('Path deleted', 'success');
			await loadPaths();
			if (selectedPath?.id === pathId) {
				selectedPath = null;
			}
		} catch (error: any) {
			showMessage(error.message, 'error');
		} finally {
			loading = false;
		}
	}

	async function publishAsTemplate(pathId: string) {
		loading = true;
		try {
			const response = await fetchWithTimeout(`/api/learning-paths/${pathId}/share`, {
				method: 'POST'
			});
			const result = await response.json();

			if (result.success) {
				showMessage(`Published at /program/${result.data.template.shareSlug}`, 'success');
				await loadPaths();
			} else {
				showMessage(result.error || 'Failed to publish', 'error');
			}
		} catch (error: any) {
			showMessage(error.message, 'error');
		} finally {
			loading = false;
		}
	}

	// ========================================
	// UTILITIES
	// ========================================
	function showMessage(msg: string, type: 'success' | 'error' | 'info') {
		message = msg;
		messageType = type;
		setTimeout(() => (message = ''), 5000);
	}

	function getPathTitle(pathId: string): string {
		return allPaths.find((p) => p.id === pathId)?.title || pathId;
	}

	// ========================================
	// LIFECYCLE
	// ========================================
	onMount(async () => {
		loading = true;
		try {
			await loadPaths();
			await loadQueueStats();
			initialLoadComplete = true;
		} finally {
			loading = false;
		}
	});

	// Phase descriptions for the header
	const phases = [
		{ num: 1, label: 'Intake', desc: 'Capture requirements' },
		{ num: 2, label: 'Build', desc: 'Create the path' },
		{ num: 3, label: 'Review', desc: 'Calendar view' },
		{ num: 4, label: 'Assign', desc: 'Send to user' },
		{ num: 5, label: 'Monitor', desc: 'Queue status' }
	];
</script>

<div class="container mx-auto max-w-6xl px-4 py-8">
	<!-- Header with Phase Navigation -->
	<div class="mb-8">
		<h1 class="mb-2 text-3xl font-light tracking-tight">Learning Paths</h1>
		<p class="text-base-content/60">Create and manage personalized learning journeys</p>
	</div>

	<!-- Phase Steps -->
	<div class="mb-8">
		<ul class="steps steps-horizontal w-full">
			{#each phases as phase}
				<li
					class="step cursor-pointer transition-colors {currentPhase >= phase.num
						? 'step-primary'
						: ''}"
					onclick={() => (currentPhase = phase.num as 1 | 2 | 3 | 4 | 5)}
				>
					<span class="text-xs">{phase.label}</span>
				</li>
			{/each}
		</ul>
	</div>

	<!-- Message Toast -->
	{#if message}
		<div class="toast toast-end toast-top z-50">
			<div
				class="alert {messageType === 'success'
					? 'alert-success'
					: messageType === 'error'
						? 'alert-error'
						: 'alert-info'}"
			>
				<span>{message}</span>
			</div>
		</div>
	{/if}

	<!-- Quick Stats Bar -->
	<div class="mb-8 flex items-center justify-between rounded-xl bg-base-200 p-4">
		<div class="flex gap-8">
			<div>
				<div class="text-2xl font-semibold">{allPaths.length}</div>
				<div class="text-xs text-base-content/60">Paths</div>
			</div>
			<div>
				<div class="text-2xl font-semibold text-warning">{queueStats.pending}</div>
				<div class="text-xs text-base-content/60">Pending</div>
			</div>
			<div>
				<div class="text-2xl font-semibold text-success">{queueStats.ready}</div>
				<div class="text-xs text-base-content/60">Ready</div>
			</div>
			<div>
				<div class="text-2xl font-semibold text-error">{queueStats.failed}</div>
				<div class="text-xs text-base-content/60">Failed</div>
			</div>
		</div>
		<button
			class="btn btn-ghost btn-sm"
			onclick={() => {
				loadPaths();
				loadQueueStats();
			}}
			disabled={loading}
		>
			<span class="icon-[mdi--refresh] h-4 w-4"></span>
			Refresh
		</button>
	</div>

	<!-- PHASE 1: INTAKE -->
	{#if currentPhase === 1}
		<div class="space-y-6">
			<div class="rounded-2xl border border-base-200 bg-base-100 p-6">
				<h2 class="mb-4 text-xl font-medium">Step 1: Capture User Requirements</h2>
				<p class="mb-6 text-sm text-base-content/60">
					Paste your discovery call transcript or notes. We'll help you structure it into an
					AI-ready brief.
				</p>

				<div class="grid gap-6 lg:grid-cols-2">
					<!-- Left: Input -->
					<div class="space-y-4">
						<div class="grid grid-cols-3 gap-4">
							<div class="form-control">
								<label class="label"><span class="label-text">Target Language</span></label>
								<select class="select-bordered select" bind:value={transcriptLanguage}>
									{#each LANGUAGES as lang}
										<option value={lang.code}>{lang.name}</option>
									{/each}
								</select>
							</div>
							<div class="form-control">
								<label class="label"><span class="label-text">Where are they at?</span></label>
								<select class="select-bordered select" bind:value={learnerLevel}>
									{#each LEVELS as level}
										<option value={level.code}>{level.label}</option>
									{/each}
								</select>
							</div>
							<div class="form-control">
								<label class="label"><span class="label-text">Duration</span></label>
								<select class="select-bordered select" bind:value={transcriptDuration}>
									<option value={14}>14 days (2 weeks)</option>
									<option value={21}>21 days (3 weeks)</option>
									<option value={28}>28 days (4 weeks)</option>
								</select>
							</div>
						</div>

						<!-- Level-specific experience preview -->
						<div class="rounded-lg border border-primary/20 bg-primary/5 p-3">
							<p class="text-sm">
								<span class="font-medium text-primary">{selectedLevel?.label}:</span>
								<span class="text-base-content/70">{selectedLevel?.description}</span>
							</p>
							<p class="mt-1 text-xs text-base-content/60">
								{#if learnerLevel === 'beginner'}
									→ They'll get full translations, simple phrases, and lots of encouragement
								{:else if learnerLevel === 'elementary'}
									→ They'll get translations for new words, 2-3 turn exchanges, gentle corrections
								{:else if learnerLevel === 'intermediate'}
									→ They'll practice natural conversations with hints when stuck
								{:else}
									→ Native-like conversations with slang, idioms, and cultural nuances
								{/if}
							</p>
						</div>

						<!-- What They'll Practice Preview -->
						<div class="rounded-lg bg-base-200/50 p-3">
							<p class="mb-2 text-xs font-medium text-base-content/70">
								What they'll practice over {transcriptDuration} days:
							</p>
							<div class="grid grid-cols-4 gap-2 text-xs">
								<div class="rounded bg-base-100 p-2">
									<div class="font-medium text-primary">Week 1</div>
									<div class="text-base-content/80">Learning key words & phrases</div>
									<div class="mt-1 text-base-content/50 italic">
										"Hello", "Thank you", numbers...
									</div>
								</div>
								<div class="rounded bg-base-100 p-2">
									<div class="font-medium text-primary">Week 2</div>
									<div class="text-base-content/80">Short back-and-forth</div>
									<div class="mt-1 text-base-content/50 italic">
										Ordering coffee, asking prices...
									</div>
								</div>
								<div class="rounded bg-base-100 p-2">
									<div class="font-medium text-primary">Week 3</div>
									<div class="text-base-content/80">Guided conversations</div>
									<div class="mt-1 text-base-content/50 italic">
										Restaurant ordering with hints...
									</div>
								</div>
								<div class="rounded bg-base-100 p-2">
									<div class="font-medium text-primary">Week 4</div>
									<div class="text-base-content/80">Real conversations</div>
									<div class="mt-1 text-base-content/50 italic">
										Full scenarios, handle surprises...
									</div>
								</div>
							</div>
						</div>

						<div class="form-control">
							<label class="label">
								<span class="label-text">Transcript / Notes</span>
							</label>
							<textarea
								class="textarea-bordered textarea h-48 font-mono text-sm"
								bind:value={transcriptInput}
								placeholder="Paste your discovery call transcript or notes here...

Example:
- Robert wants to speak more confidently with strangers in Japan
- Currently intermediate beginner, studied 2 years casually
- Has a trip to Tokyo in 6 weeks
- Nervous about ordering at restaurants, asking for directions"
							></textarea>
						</div>

						<button class="btn w-full btn-primary" onclick={copyPromptToClipboard}>
							{briefCopied ? 'Copied!' : 'Copy AI Prompt'}
						</button>
					</div>

					<!-- Right: Generated Brief -->
					<div class="space-y-4">
						<div class="rounded-lg bg-base-200 p-4">
							<p class="mb-2 text-sm font-medium">After copying the prompt:</p>
							<ol class="list-inside list-decimal space-y-1 text-sm text-base-content/70">
								<li>Paste into ChatGPT or Claude</li>
								<li>Get the generated brief</li>
								<li>Paste it below</li>
							</ol>
						</div>

						<div class="form-control">
							<label class="label">
								<span class="label-text">AI-Generated Brief</span>
							</label>
							<textarea
								class="textarea-bordered textarea h-48"
								bind:value={generatedBrief}
								placeholder="Paste the AI-generated brief here..."
							></textarea>
						</div>

						<button
							class="btn w-full btn-success"
							onclick={proceedToBuild}
							disabled={!generatedBrief || loading}
						>
							{#if generatingPath}
								<span class="loading loading-sm loading-spinner"></span>
								Generating... {generationSeconds}s
							{:else}
								Create Path
							{/if}
						</button>

						<!-- Generation Progress -->
						{#if generatingPath}
							<div class="mt-4 rounded-lg border border-info/20 bg-info/5 p-3">
								<p class="text-sm font-medium text-info">Generating your learning path...</p>
								<p class="text-xs text-base-content/60">
									This typically takes 30-60 seconds. Please wait.
								</p>
								<progress
									class="progress mt-2 w-full progress-info"
									max="60"
									value={Math.min(generationSeconds, 60)}
								></progress>
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Existing Paths Quick Access -->
			{#if allPaths.length > 0}
				<div class="rounded-2xl border border-base-200 bg-base-100 p-6">
					<h3 class="mb-4 font-medium">Or select an existing path to review/assign</h3>
					<div class="grid gap-2">
						{#each allPaths.slice(0, 5) as path}
							<button
								class="flex items-center justify-between rounded-lg bg-base-200 p-3 text-left transition hover:bg-base-300"
								onclick={() => {
									selectedPath = path;
									currentPhase = 3;
								}}
							>
								<div>
									<div class="font-medium">{path.title}</div>
									<div class="text-xs text-base-content/60">
										{path.targetLanguage} - {path.schedule?.length || 0} days - {path.status}
									</div>
								</div>
								<span class="icon-[mdi--chevron-right] h-5 w-5 text-base-content/40"></span>
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Debug: API Response -->
			{#if lastApiError || lastApiResponse}
				<div
					class="rounded-2xl border {lastApiError
						? 'border-error/30'
						: 'border-success/30'} bg-base-100 p-6"
				>
					<div class="mb-4 flex items-center justify-between">
						<h3 class="font-medium {lastApiError ? 'text-error' : 'text-success'}">
							{lastApiError ? 'API Error' : 'API Response'}
						</h3>
						<button
							class="btn btn-ghost btn-xs"
							onclick={() => {
								lastApiResponse = null;
								lastApiError = null;
							}}
						>
							Clear
						</button>
					</div>

					{#if lastApiError}
						<div class="mb-4 rounded-lg bg-error/10 p-3">
							<p class="text-sm font-medium text-error">{lastApiError}</p>
						</div>
					{/if}

					{#if lastApiResponse}
						<div class="space-y-3">
							<div>
								<p class="mb-1 text-xs text-base-content/60">Success:</p>
								<span class="badge {lastApiResponse.success ? 'badge-success' : 'badge-error'}">
									{lastApiResponse.success ? 'Yes' : 'No'}
								</span>
							</div>

							{#if lastApiResponse.data?.path}
								<div>
									<p class="mb-1 text-xs text-base-content/60">Created Path:</p>
									<div class="rounded-lg bg-base-200 p-3">
										<p class="font-medium">{lastApiResponse.data.path.title}</p>
										<p class="mt-1 text-sm text-base-content/70">
											{lastApiResponse.data.path.description}
										</p>
										<div class="mt-2 flex gap-2">
											<span class="badge badge-sm">ID: {lastApiResponse.data.pathId}</span>
											<span class="badge badge-sm"
												>{lastApiResponse.data.path.schedule?.length || 0} days</span
											>
											<span class="badge badge-sm badge-info"
												>{lastApiResponse.data.queuedJobs} jobs queued</span
											>
										</div>
									</div>
								</div>

								<button
									class="btn btn-sm btn-primary"
									onclick={() => {
										selectedPath = lastApiResponse.data.path;
										currentPhase = 3;
									}}
								>
									View This Path
								</button>
							{/if}

							<details class="collapse-arrow collapse rounded-lg bg-base-200">
								<summary class="collapse-title text-xs font-medium">Raw Response</summary>
								<div class="collapse-content">
									<pre
										class="overflow-x-auto text-xs break-words whitespace-pre-wrap">{JSON.stringify(
											lastApiResponse,
											null,
											2
										)}</pre>
								</div>
							</details>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	{/if}

	<!-- PHASE 2: BUILD -->
	{#if currentPhase === 2}
		<div class="rounded-2xl border border-base-200 bg-base-100 p-6">
			<h2 class="mb-4 text-xl font-medium">Step 2: Build the Learning Path</h2>
			<p class="mb-6 text-sm text-base-content/60">
				Review and adjust the brief, then create the personalized learning path.
			</p>

			<div class="grid gap-6 lg:grid-cols-3">
				<div class="form-control">
					<label class="label"><span class="label-text">Target Language</span></label>
					<select class="select-bordered select" bind:value={targetLanguage}>
						{#each LANGUAGES as lang}
							<option value={lang.code}>{lang.name}</option>
						{/each}
					</select>
				</div>
				<div class="form-control">
					<label class="label"><span class="label-text">Duration (days)</span></label>
					<input
						type="number"
						class="input-bordered input"
						bind:value={duration}
						min="3"
						max="30"
					/>
				</div>
				<div class="form-control">
					<label class="label"><span class="label-text">Difficulty Range</span></label>
					<input type="text" class="input-bordered input" value="A2 → B1" disabled />
				</div>
			</div>

			<div class="form-control mt-4">
				<label class="label"><span class="label-text">Brief</span></label>
				<textarea
					class="textarea-bordered textarea h-40"
					bind:value={brief}
					placeholder="Enter the learning path brief..."
				></textarea>
			</div>

			<div class="mt-6 flex justify-end gap-2">
				<button class="btn btn-ghost" onclick={() => (currentPhase = 1)}>Back</button>
				<button class="btn btn-primary" onclick={createPath} disabled={loading}>
					{loading ? 'Creating...' : 'Create Path'}
				</button>
			</div>
		</div>
	{/if}

	<!-- PHASE 3: REVIEW -->
	{#if currentPhase === 3}
		<div class="space-y-6">
			{#if selectedPath || createdPath}
				{@const path = selectedPath || createdPath}
				<div class="rounded-2xl border border-base-200 bg-base-100 p-6">
					<div class="mb-6 flex items-start justify-between">
						<div>
							<h2 class="text-xl font-medium">{path.title}</h2>
							<p class="text-sm text-base-content/60">{path.description}</p>
							<div class="mt-2 flex gap-2">
								<span class="badge">{path.targetLanguage}</span>
								<span class="badge">{path.schedule?.length || 0} days</span>
								<span class="badge badge-{path.status === 'active' ? 'success' : 'neutral'}"
									>{path.status}</span
								>
							</div>
						</div>
						<div class="flex gap-2">
							{#if !path.isTemplate}
								<button class="btn btn-ghost btn-sm" onclick={() => publishAsTemplate(path.id)}
									>Publish</button
								>
							{/if}
							<button class="btn btn-ghost btn-sm btn-error" onclick={() => deletePath(path.id)}
								>Delete</button
							>
						</div>
					</div>

					<!-- Calendar View -->
					<h3 class="mb-4 font-medium">What they'll practice each day</h3>
					<div class="grid gap-4 lg:grid-cols-4">
						{#each [1, 2, 3, 4] as week}
							{@const weekLabel =
								week === 1
									? 'Building blocks'
									: week === 2
										? 'Short exchanges'
										: week === 3
											? 'With guidance'
											: 'Full conversations'}
							<div class="rounded-lg bg-base-200 p-4">
								<h4 class="mb-1 text-sm font-semibold">Week {week}</h4>
								<p class="mb-3 text-xs text-base-content/60">{weekLabel}</p>
								<div class="space-y-2">
									{#each (path.schedule || []).filter((d: any) => getWeekNumber(d.dayIndex) === week) as day}
										<div class="rounded bg-base-100 p-2 text-xs transition hover:shadow-sm">
											<div class="flex items-center justify-between">
												<span class="font-medium text-primary">Day {day.dayIndex}</span>
												<span class="text-base-content/40">{getDayOfWeek(day.dayIndex)}</span>
											</div>
											<p class="mt-1 line-clamp-2 text-base-content/80">
												{day.theme || 'Scenario TBD'}
											</p>
											{#if day.learningObjectives?.length}
												<p class="mt-1 line-clamp-1 text-base-content/50">
													Goal: {day.learningObjectives[0]}
												</p>
											{/if}
										</div>
									{/each}
								</div>
							</div>
						{/each}
					</div>
				</div>

				<div class="flex justify-end gap-2">
					<button
						class="btn btn-ghost"
						onclick={() => {
							selectedPath = null;
							createdPath = null;
							currentPhase = 1;
						}}>Back</button
					>
					<button class="btn btn-primary" onclick={() => (currentPhase = 4)}>Assign to User</button>
				</div>
			{:else}
				<div class="rounded-2xl border border-base-200 bg-base-100 p-6">
					<p class="text-center text-base-content/60">
						No path selected. Go back to select or create a path.
					</p>
					<div class="mt-4 text-center">
						<button class="btn btn-ghost" onclick={() => (currentPhase = 1)}>Back to Intake</button>
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- PHASE 4: ASSIGN -->
	{#if currentPhase === 4}
		<div class="rounded-2xl border border-base-200 bg-base-100 p-6">
			{#if selectedPath || createdPath}
				{@const path = selectedPath || createdPath}
				<h2 class="mb-2 text-xl font-medium">Send to your learner</h2>
				<p class="mb-6 text-sm text-base-content/60">
					Assign this personalized path and optionally send a notification email.
				</p>

				<div class="grid gap-6 lg:grid-cols-2">
					<!-- Left: Path Summary -->
					<div class="space-y-4">
						<div class="rounded-lg bg-base-200 p-4">
							<h3 class="font-medium">{path.title}</h3>
							<p class="mt-1 text-sm text-base-content/70">{path.description}</p>
							<div class="mt-3 flex flex-wrap gap-2">
								<span class="badge">{path.targetLanguage}</span>
								<span class="badge">{path.schedule?.length || 0} days</span>
							</div>
						</div>

						<!-- Quick preview of scenarios -->
						<div class="rounded-lg border border-base-200 p-4">
							<p class="mb-2 text-xs font-medium text-base-content/60">
								Sample scenarios they'll practice:
							</p>
							<ul class="space-y-1 text-sm">
								{#each (path.schedule || []).slice(0, 3) as day}
									<li class="flex items-start gap-2">
										<span class="text-primary">Day {day.dayIndex}:</span>
										<span class="text-base-content/70">{day.theme || 'TBD'}</span>
									</li>
								{/each}
								{#if (path.schedule?.length || 0) > 3}
									<li class="text-base-content/50">...and {path.schedule.length - 3} more days</li>
								{/if}
							</ul>
						</div>
					</div>

					<!-- Right: Assignment Form -->
					<div class="space-y-4">
						<div class="form-control">
							<label class="label"><span class="label-text">Their email address</span></label>
							<input
								type="email"
								class="input-bordered input"
								bind:value={assignEmail}
								placeholder="learner@example.com"
							/>
						</div>

						<div class="form-control">
							<label class="label"
								><span class="label-text">Personal message (optional)</span></label
							>
							<textarea
								class="textarea-bordered textarea"
								bind:value={assignNote}
								placeholder="Hey! I've created this learning path just for you based on our conversation..."
							></textarea>
						</div>

						<label class="flex cursor-pointer items-center gap-3">
							<input
								type="checkbox"
								class="checkbox checkbox-primary"
								bind:checked={sendEmailNotification}
							/>
							<span class="label-text">Send email notification</span>
						</label>

						{#if sendEmailNotification}
							<div class="rounded-lg bg-success/10 p-3 text-sm">
								<p class="font-medium text-success">They'll receive:</p>
								<p class="mt-1 text-base-content/70">
									An email with a link to start their personalized learning journey.
								</p>
							</div>
						{/if}

						<div class="flex justify-end gap-2 pt-4">
							<button class="btn btn-ghost" onclick={() => (currentPhase = 3)}>Back</button>
							<button
								class="btn btn-primary"
								onclick={assignPath}
								disabled={loading || !assignEmail}
							>
								{loading ? 'Sending...' : sendEmailNotification ? 'Send Path' : 'Assign'}
							</button>
						</div>
					</div>
				</div>
			{:else}
				<p class="text-center text-base-content/60">No path selected.</p>
				<div class="mt-4 text-center">
					<button class="btn btn-ghost" onclick={() => (currentPhase = 1)}>Back to Intake</button>
				</div>
			{/if}
		</div>
	{/if}

	<!-- PHASE 5: MONITOR -->
	{#if currentPhase === 5}
		<div class="space-y-6">
			<div class="rounded-2xl border border-base-200 bg-base-100 p-6">
				<div class="mb-6 flex items-center justify-between">
					<div>
						<h2 class="text-xl font-medium">Queue Monitor</h2>
						<p class="text-sm text-base-content/60">Track scenario generation progress</p>
					</div>
					<div class="flex gap-2">
						<button
							class="btn btn-ghost btn-sm"
							onclick={() => {
								loadQueueStats();
								loadQueueJobs();
							}}>Refresh</button
						>
						<button class="btn btn-sm btn-primary" onclick={processQueue} disabled={loading}>
							{loading ? 'Processing...' : 'Process 5 Jobs'}
						</button>
					</div>
				</div>

				<div class="stats w-full bg-base-200">
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
			</div>

			<!-- Pending Jobs -->
			{#if pendingJobs.length > 0}
				<div class="rounded-2xl border border-base-200 bg-base-100 p-6">
					<h3 class="mb-4 font-medium">Pending Jobs ({pendingJobs.length})</h3>
					<div class="space-y-2">
						{#each pendingJobs as job}
							<div class="flex items-center justify-between rounded-lg bg-base-200 p-3">
								<div>
									<div class="font-medium">{getPathTitle(job.pathId)}</div>
									<div class="text-xs text-base-content/60">
										Day {job.dayIndex} - Retries: {job.retryCount || 0}
									</div>
								</div>
								<span class="badge badge-warning">pending</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Failed Jobs -->
			{#if failedJobs.length > 0}
				<div class="rounded-2xl border border-error/20 bg-base-100 p-6">
					<h3 class="mb-4 font-medium text-error">Failed Jobs ({failedJobs.length})</h3>
					<div class="space-y-2">
						{#each failedJobs as job}
							<div class="rounded-lg bg-base-200 p-3">
								<div class="flex items-center justify-between">
									<div class="font-medium">{getPathTitle(job.pathId)}</div>
									<span class="badge badge-error">failed</span>
								</div>
								<div class="text-xs text-base-content/60">Day {job.dayIndex}</div>
								{#if job.lastError}
									<div class="mt-1 text-xs text-error">{job.lastError}</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- All Paths -->
			<div class="rounded-2xl border border-base-200 bg-base-100 p-6">
				<h3 class="mb-4 font-medium">All Paths ({allPaths.length})</h3>
				<div class="space-y-2">
					{#each allPaths as path}
						<div class="flex items-center justify-between rounded-lg bg-base-200 p-3">
							<div>
								<div class="font-medium">{path.title}</div>
								<div class="text-xs text-base-content/60">
									{path.targetLanguage} - {path.schedule?.length || 0} days
								</div>
							</div>
							<div class="flex items-center gap-2">
								<span
									class="badge badge-{path.status === 'active' ? 'success' : 'neutral'} badge-sm"
									>{path.status}</span
								>
								<button class="btn btn-ghost btn-xs" onclick={() => selectPathForReview(path)}
									>View</button
								>
							</div>
						</div>
					{/each}
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
