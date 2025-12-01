<script lang="ts">
	import { goto } from '$app/navigation';

	// ============================================================================
	// TYPES
	// ============================================================================

	interface SessionType {
		id: string;
		name: string;
		icon: string;
		description: string;
		category: string;
		durationMinutesMin: number;
		durationMinutesMax: number;
		targetExchanges: number;
	}

	interface ConversationSeed {
		id: string;
		title: string;
		description: string;
		suggestedSessionTypes: string[];
	}

	interface WeekData {
		id: string;
		weekNumber: number;
		theme: string;
		themeDescription: string;
		conversationSeeds: ConversationSeed[];
	}

	interface ProgressData {
		sessionsCompleted: number;
		totalMinutes: number;
		suggestedSessionCount: number;
		minimumSessionCount: number;
	}

	// ============================================================================
	// PROPS
	// ============================================================================

	let {
		pathId,
		week,
		progress,
		sessionTypes
	}: {
		pathId: string;
		week: WeekData;
		progress: ProgressData;
		sessionTypes: SessionType[];
	} = $props();

	// ============================================================================
	// STATE
	// ============================================================================

	let selectedSeed: ConversationSeed | null = $state(null);
	let isStarting = $state(false);

	// ============================================================================
	// COMPUTED
	// ============================================================================

	const progressPercent = $derived(
		Math.min(100, (progress.sessionsCompleted / progress.suggestedSessionCount) * 100)
	);

	// ============================================================================
	// ACTIONS
	// ============================================================================

	async function startSession(sessionTypeId: string, conversationSeedId?: string) {
		if (isStarting) return;

		isStarting = true;

		try {
			const response = await fetch(`/api/learning-paths/${pathId}/sessions`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					sessionTypeId,
					conversationSeedId
				})
			});

			if (!response.ok) {
				throw new Error('Failed to start session');
			}

			const result = await response.json();

			// Navigate to the conversation
			if (result.data.conversationUrl) {
				await goto(result.data.conversationUrl);
			}
		} catch (error) {
			console.error('Error starting session:', error);
			alert('Failed to start session. Please try again.');
		} finally {
			isStarting = false;
		}
	}
</script>

<div class="week-dashboard">
	<!-- Week Header -->
	<div class="week-header">
		<h1 class="week-title">
			Week {week.weekNumber}: {week.theme}
		</h1>
		<p class="week-description">{week.themeDescription}</p>
	</div>

	<!-- Progress Section -->
	<div class="progress-card">
		<h2 class="progress-title">Progress this week</h2>

		<div class="progress-bar-container">
			<div class="progress-bar">
				<div class="progress-fill" style="width: {progressPercent}%"></div>
			</div>
			<p class="progress-text">
				{progress.sessionsCompleted} of {progress.suggestedSessionCount} suggested sessions
			</p>
		</div>

		<div class="progress-stats">
			<div class="stat">
				<span class="stat-value">{Math.round(progress.totalMinutes)}</span>
				<span class="stat-label">minutes practiced</span>
			</div>
		</div>
	</div>

	<!-- Session Types -->
	<div class="session-types-section">
		<h2 class="section-title">Pick a session:</h2>

		<div class="session-types-grid">
			{#each sessionTypes as sessionType}
				<button
					class="session-type-card"
					onclick={() => startSession(sessionType.id, selectedSeed?.id)}
					disabled={isStarting}
				>
					<div class="session-icon">{sessionType.icon}</div>
					<div class="session-name">{sessionType.name}</div>
					<div class="session-duration">
						{sessionType.durationMinutesMin}-{sessionType.durationMinutesMax} min
					</div>
					<div class="session-description">{sessionType.description}</div>
				</button>
			{/each}
		</div>
	</div>

	<!-- Conversation Seeds (Optional) -->
	{#if week.conversationSeeds && week.conversationSeeds.length > 0}
		<div class="seeds-section">
			<h2 class="section-title">Or choose a conversation topic:</h2>

			<div class="seeds-list">
				{#each week.conversationSeeds as seed}
					<button
						class="seed-card"
						class:selected={selectedSeed?.id === seed.id}
						onclick={() => {
							selectedSeed = selectedSeed?.id === seed.id ? null : seed;
						}}
					>
						<div class="seed-title">{seed.title}</div>
						<div class="seed-description">{seed.description}</div>
					</button>
				{/each}
			</div>

			{#if selectedSeed}
				<p class="seed-hint">Now pick a session type above to start with this topic</p>
			{/if}
		</div>
	{/if}
</div>

<style>
	.week-dashboard {
		max-width: 900px;
		margin: 0 auto;
		padding: 2rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.week-header {
		text-align: center;
	}

	.week-title {
		font-size: 2rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
		color: var(--text-primary, #1f2937);
	}

	.week-description {
		font-size: 1.125rem;
		color: var(--text-secondary, #6b7280);
		max-width: 600px;
		margin: 0 auto;
	}

	.progress-card {
		background: var(--card-bg, white);
		border-radius: 1rem;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.progress-title {
		font-size: 1.25rem;
		font-weight: 500;
		margin-bottom: 1rem;
		color: var(--text-primary, #1f2937);
	}

	.progress-bar-container {
		margin-bottom: 1rem;
	}

	.progress-bar {
		width: 100%;
		height: 0.75rem;
		background: var(--gray-200, #e5e7eb);
		border-radius: 9999px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #3b82f6, #8b5cf6);
		transition: width 0.3s ease;
	}

	.progress-text {
		margin-top: 0.5rem;
		font-size: 0.875rem;
		color: var(--text-secondary, #6b7280);
	}

	.progress-stats {
		display: flex;
		gap: 2rem;
		margin-top: 1rem;
	}

	.stat {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--text-primary, #1f2937);
	}

	.stat-label {
		font-size: 0.875rem;
		color: var(--text-secondary, #6b7280);
	}

	.session-types-section,
	.seeds-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.section-title {
		font-size: 1.25rem;
		font-weight: 500;
		color: var(--text-primary, #1f2937);
	}

	.session-types-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1rem;
	}

	.session-type-card {
		background: var(--card-bg, white);
		border: 2px solid var(--border, #e5e7eb);
		border-radius: 1rem;
		padding: 1.5rem;
		text-align: center;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.session-type-card:hover:not(:disabled) {
		border-color: var(--primary, #3b82f6);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.session-type-card:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.session-icon {
		font-size: 2rem;
		margin-bottom: 0.5rem;
	}

	.session-name {
		font-size: 1.125rem;
		font-weight: 600;
		margin-bottom: 0.25rem;
		color: var(--text-primary, #1f2937);
	}

	.session-duration {
		font-size: 0.875rem;
		color: var(--text-secondary, #6b7280);
		margin-bottom: 0.5rem;
	}

	.session-description {
		font-size: 0.875rem;
		color: var(--text-secondary, #6b7280);
		line-height: 1.4;
	}

	.seeds-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.seed-card {
		background: var(--card-bg, white);
		border: 2px solid var(--border, #e5e7eb);
		border-radius: 0.75rem;
		padding: 1rem 1.5rem;
		text-align: left;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.seed-card:hover {
		border-color: var(--primary-light, #93c5fd);
	}

	.seed-card.selected {
		border-color: var(--primary, #3b82f6);
		background: var(--primary-bg, #eff6ff);
	}

	.seed-title {
		font-size: 1rem;
		font-weight: 500;
		margin-bottom: 0.25rem;
		color: var(--text-primary, #1f2937);
	}

	.seed-description {
		font-size: 0.875rem;
		color: var(--text-secondary, #6b7280);
	}

	.seed-hint {
		text-align: center;
		font-size: 0.875rem;
		color: var(--primary, #3b82f6);
		font-style: italic;
		margin-top: 0.5rem;
	}

	@media (max-width: 640px) {
		.week-dashboard {
			padding: 1rem;
		}

		.week-title {
			font-size: 1.5rem;
		}

		.session-types-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
