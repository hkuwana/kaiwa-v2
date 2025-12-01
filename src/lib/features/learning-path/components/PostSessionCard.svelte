<script lang="ts">
	import { goto } from '$app/navigation';

	// ============================================================================
	// PROPS
	// ============================================================================

	let {
		conversationId,
		pathId,
		encouragement = '3 conversations this week.',
		sessionsCompleted = 0,
		totalMinutes = 0,
		onClose
	}: {
		conversationId: string;
		pathId: string;
		encouragement?: string;
		sessionsCompleted?: number;
		totalMinutes?: number;
		onClose?: () => void;
	} = $props();

	// ============================================================================
	// STATE
	// ============================================================================

	let comfortRating = $state<number | null>(null);
	let mood = $state<'great' | 'good' | 'okay' | 'struggling' | null>(null);
	let isSubmitting = $state(false);
	let isCompleted = $state(false);

	// ============================================================================
	// ACTIONS
	// ============================================================================

	async function completeSession() {
		if (isSubmitting) return;

		isSubmitting = true;

		try {
			const response = await fetch(`/api/conversations/${conversationId}/complete-adaptive`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					comfortRating,
					mood
				})
			});

			if (!response.ok) {
				throw new Error('Failed to complete session');
			}

			const result = await response.json();

			// Update local state with server response
			if (result.data.progress) {
				sessionsCompleted = result.data.progress.sessionsCompleted;
				totalMinutes = result.data.progress.totalMinutes;
			}

			if (result.data.encouragement) {
				encouragement = result.data.encouragement;
			}

			isCompleted = true;
		} catch (error) {
			console.error('Error completing session:', error);
			alert('Failed to save session. Please try again.');
		} finally {
			isSubmitting = false;
		}
	}

	function goToWeekDashboard() {
		goto(`/app/learn/${pathId}`);
	}

	function handleClose() {
		if (onClose) {
			onClose();
		} else {
			goToWeekDashboard();
		}
	}
</script>

<div class="post-session-card">
	{#if !isCompleted}
		<!-- Rating Collection -->
		<div class="card-content">
			<h2 class="card-title">How did that feel?</h2>

			<!-- Comfort Rating -->
			<div class="rating-section">
				<p class="rating-label">How comfortable were you?</p>
				<div class="comfort-buttons">
					{#each [1, 2, 3, 4, 5] as rating}
						<button
							class="comfort-button"
							class:selected={comfortRating === rating}
							onclick={() => (comfortRating = rating)}
						>
							{rating}
						</button>
					{/each}
				</div>
				<div class="comfort-labels">
					<span>Not at all</span>
					<span>Very comfortable</span>
				</div>
			</div>

			<!-- Mood Selection -->
			<div class="mood-section">
				<p class="rating-label">How are you feeling?</p>
				<div class="mood-buttons">
					<button
						class="mood-button"
						class:selected={mood === 'great'}
						onclick={() => (mood = 'great')}
					>
						😊 Great
					</button>
					<button
						class="mood-button"
						class:selected={mood === 'good'}
						onclick={() => (mood = 'good')}
					>
						🙂 Good
					</button>
					<button
						class="mood-button"
						class:selected={mood === 'okay'}
						onclick={() => (mood = 'okay')}
					>
						😐 Okay
					</button>
					<button
						class="mood-button"
						class:selected={mood === 'struggling'}
						onclick={() => (mood = 'struggling')}
					>
						😓 Struggling
					</button>
				</div>
			</div>

			<!-- Actions -->
			<div class="actions">
				<button class="btn btn-secondary" onclick={handleClose} disabled={isSubmitting}>
					Skip
				</button>
				<button class="btn btn-primary" onclick={completeSession} disabled={isSubmitting}>
					{isSubmitting ? 'Saving...' : 'Done'}
				</button>
			</div>
		</div>
	{:else}
		<!-- Success Message -->
		<div class="card-content success">
			<div class="success-icon">✓</div>
			<h2 class="encouragement">{encouragement}</h2>

			<div class="week-stats">
				<div class="stat">
					<span class="stat-value">{sessionsCompleted}</span>
					<span class="stat-label">conversations this week</span>
				</div>
				<div class="stat">
					<span class="stat-value">{Math.round(totalMinutes)}</span>
					<span class="stat-label">minutes practiced</span>
				</div>
			</div>

			<button class="btn btn-primary btn-full" onclick={goToWeekDashboard}>
				Back to Week Dashboard
			</button>
		</div>
	{/if}
</div>

<style>
	.post-session-card {
		background: var(--card-bg, white);
		border-radius: 1rem;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
		max-width: 500px;
		margin: 2rem auto;
	}

	.card-content {
		padding: 2rem;
	}

	.card-content.success {
		text-align: center;
	}

	.card-title {
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 1.5rem;
		text-align: center;
		color: var(--text-primary, #1f2937);
	}

	.rating-section,
	.mood-section {
		margin-bottom: 1.5rem;
	}

	.rating-label {
		font-size: 1rem;
		font-weight: 500;
		margin-bottom: 0.75rem;
		color: var(--text-primary, #1f2937);
	}

	.comfort-buttons {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
		margin-bottom: 0.5rem;
	}

	.comfort-button {
		width: 3rem;
		height: 3rem;
		border: 2px solid var(--border, #e5e7eb);
		border-radius: 0.5rem;
		background: var(--card-bg, white);
		font-size: 1.125rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.comfort-button:hover {
		border-color: var(--primary, #3b82f6);
		transform: scale(1.05);
	}

	.comfort-button.selected {
		border-color: var(--primary, #3b82f6);
		background: var(--primary, #3b82f6);
		color: white;
	}

	.comfort-labels {
		display: flex;
		justify-content: space-between;
		font-size: 0.75rem;
		color: var(--text-secondary, #6b7280);
	}

	.mood-buttons {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
	}

	.mood-button {
		padding: 0.75rem 1rem;
		border: 2px solid var(--border, #e5e7eb);
		border-radius: 0.75rem;
		background: var(--card-bg, white);
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.mood-button:hover {
		border-color: var(--primary, #3b82f6);
	}

	.mood-button.selected {
		border-color: var(--primary, #3b82f6);
		background: var(--primary-bg, #eff6ff);
	}

	.actions {
		display: flex;
		gap: 1rem;
		margin-top: 2rem;
	}

	.success-icon {
		width: 4rem;
		height: 4rem;
		margin: 0 auto 1rem;
		background: #10b981;
		color: white;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 2rem;
		font-weight: bold;
	}

	.encouragement {
		font-size: 1.25rem;
		font-weight: 500;
		margin-bottom: 1.5rem;
		color: var(--text-primary, #1f2937);
	}

	.week-stats {
		display: flex;
		gap: 2rem;
		justify-content: center;
		margin-bottom: 2rem;
		padding: 1.5rem;
		background: var(--gray-50, #f9fafb);
		border-radius: 0.75rem;
	}

	.stat {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.stat-value {
		font-size: 2rem;
		font-weight: 600;
		color: var(--primary, #3b82f6);
	}

	.stat-label {
		font-size: 0.875rem;
		color: var(--text-secondary, #6b7280);
	}

	.btn {
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		flex: 1;
	}

	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-primary {
		background: var(--primary, #3b82f6);
		color: white;
		border: none;
	}

	.btn-primary:hover:not(:disabled) {
		background: var(--primary-dark, #2563eb);
	}

	.btn-secondary {
		background: transparent;
		color: var(--text-secondary, #6b7280);
		border: 2px solid var(--border, #e5e7eb);
	}

	.btn-secondary:hover:not(:disabled) {
		border-color: var(--text-secondary, #6b7280);
	}

	.btn-full {
		width: 100%;
	}

	@media (max-width: 640px) {
		.post-session-card {
			margin: 1rem;
		}

		.card-content {
			padding: 1.5rem;
		}

		.mood-buttons {
			grid-template-columns: 1fr;
		}
	}
</style>
