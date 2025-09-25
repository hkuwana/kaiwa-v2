// usage.store.svelte.ts
// Combined store for MVP - handles both usage tracking and timer functionality
import type { Tier, UserUsage } from '$lib/server/db/types';
export interface TimerState {
	isRunning: boolean;
	isPaused: boolean;
	startTime: Date | null;
	pausedAt: Date | null;
	elapsedMs: number;
	remainingMs: number;
	totalDurationMs: number;
	warningTriggered: boolean;
	extensionsUsed: number;
	sessionId: string | null;
	language: string | null;
}

class UsageStore {
	// User info
	userId = $state<string | null>(null);
	tier = $state<Tier | null>(null);

	// Usage data
	usage = $state<UserUsage | null>(null);
	sessionsToday = $state(0);

	totalAvailableSeconds = $derived(() => {
		const monthly = this.tier?.monthlySeconds ?? 0;
		const banked = this.usage?.bankedSeconds ?? 0;
		return monthly + banked;
	});

	secondsRemaining = $derived(() => {
		if (!this.usage || !this.tier) return 0;
		const total = this.totalAvailableSeconds();
		const used = (this.usage.secondsUsed ?? 0) + (this.usage.bankedSecondsUsed ?? 0);
		return Math.max(0, total - used);
	});

	percentageUsed = $derived(() => {
		if (!this.usage || !this.tier) return 0;
		const total = this.totalAvailableSeconds();
		if (total <= 0) return 0;
		const used = (this.usage.secondsUsed ?? 0) + (this.usage.bankedSecondsUsed ?? 0);
		return (used / total) * 100;
	});

	estimatedOverageCharge = $derived(() => {
		const overageSeconds = this.usage?.overageSeconds ?? 0;
		return overageSeconds * this.overageRate();
	});

	// Timer state (embedded for MVP)
	timer = $state<TimerState>({
		isRunning: false,
		isPaused: false,
		startTime: null,
		pausedAt: null,
		elapsedMs: 0,
		remainingMs: 0,
		totalDurationMs: 0,
		warningTriggered: false,
		extensionsUsed: 0,
		sessionId: null,
		language: null
	});

	// UI state
	loading = $state(false);
	error = $state<string | null>(null);

	// --- Derived values for usage ---
	canStartNewSession = $derived(() => {
		if (!this.usage || !this.tier) return false;

		const conversationsUsed = this.usage.conversationsUsed ?? 0;
		const conversationLimit = this.tier.monthlyConversations ?? 0;
		if (conversationLimit > 0 && conversationsUsed >= conversationLimit) {
			return false;
		}

		const realtimeSessionsUsed = this.usage.realtimeSessionsUsed ?? 0;
		const realtimeLimit = this.tier.monthlyRealtimeSessions ?? 0;
		if (realtimeLimit > 0 && realtimeSessionsUsed >= realtimeLimit) {
			return false;
		}

		return true;
	});

	willIncurOverage = $derived(() => {
		if (!this.usage || !this.tier) return false;
		return this.secondsRemaining() <= 0;
	});

	overageRate = $derived(() => {
		if (!this.tier) return 0;
		// Use the overage rate from the tier data
		return (this.tier.overagePricePerMinuteInCents || 10) / 100;
	});

	// --- Derived values for timer ---
	formattedTime = $derived(() => {
		const totalSeconds = Math.floor(this.timer.remainingMs / 1000);
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
	});

	formattedElapsed = $derived(() => {
		const totalSeconds = Math.floor(this.timer.elapsedMs / 1000);
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
	});

	percentageRemaining = $derived(() => {
		if (this.timer.totalDurationMs === 0) return 100;
		return (this.timer.remainingMs / this.timer.totalDurationMs) * 100;
	});

	canExtend = $derived(() => {
		return (
			this.tier?.canExtend &&
			this.timer.extensionsUsed < (this.tier?.maxExtensions || 0) &&
			this.timer.isRunning
		);
	});

	extensionsRemaining = $derived(() => {
		if (!this.tier) return 0;
		return (this.tier.maxExtensions || 0) - this.timer.extensionsUsed;
	});

	isInWarningZone = $derived(() => {
		return this.timer.remainingMs <= (this.tier?.warningThresholdSeconds || 0) * 1000;
	});

	sessionSecondsUsed = $derived(() => {
		return Math.ceil(this.timer.elapsedMs / 1000);
	});

	// Simplified analysis usage derived values for MVP
	monthlyAnalysisUsed = $derived(() => {
		if (!this.usage) return {};
		return {
			basic: this.usage.basicAnalysesUsed || 0,
			'advanced-grammar': this.usage.advancedGrammarUsed || 0,
			'fluency-analysis': this.usage.fluencyAnalysisUsed || 0,
			'onboarding-profile': this.usage.onboardingProfileUsed || 0,
			'pronunciation-analysis': this.usage.pronunciationAnalysisUsed || 0,
			'speech-rhythm': this.usage.speechRhythmUsed || 0
		};
	});

	totalAnalysesThisMonth = $derived(() => {
		return this.usage?.analysesUsed || 0;
	});

	// --- Methods ---

	/**
	 * Initialize store with user data
	 */
	setUser(userId: string, tier: Tier) {
		this.userId = userId;
		this.tier = tier;
		this.sessionsToday = 0;

		// Initialize timer duration from tier config (convert seconds to milliseconds)
		this.timer.totalDurationMs = (tier.conversationTimeoutSeconds || 0) * 1000;
		this.timer.remainingMs = (tier.conversationTimeoutSeconds || 0) * 1000;
	}

	/**
	 * Load usage data from API
	 */
	async loadUsage() {
		if (!this.userId) return;

		this.loading = true;
		this.error = null;

		try {
			const response = await fetch(`/api/users/${this.userId}/usage`);
			if (!response.ok) throw new Error('Failed to load usage');

			const data = await response.json();
			const usage = data as UserUsage & { sessionsToday?: number };
			this.usage = usage;
			this.sessionsToday = usage.sessionsToday ?? 0;
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Failed to load usage';
		} finally {
			this.loading = false;
		}
	}

	/**
	 * Check if user can use a specific analysis type
	 */
	async checkAnalysisUsage(analysisType: string): Promise<{
		allowed: boolean;
		reason?: string;
		dailyRemaining: number;
		monthlyRemaining: number;
	}> {
		if (!this.userId) {
			return { allowed: false, reason: 'User not authenticated', dailyRemaining: 0, monthlyRemaining: 0 };
		}

		try {
			const response = await fetch('/api/analysis/check-usage', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userId: this.userId,
					analysisType
				})
			});

			if (!response.ok) {
				throw new Error('Failed to check analysis usage');
			}

			const result = await response.json();
			return {
				allowed: result.allowed,
				reason: result.reason,
				dailyRemaining: result.dailyRemaining,
				monthlyRemaining: result.monthlyRemaining
			};
		} catch (error) {
			console.error('Error checking analysis usage:', error);
			return { allowed: false, reason: 'Error checking usage limits', dailyRemaining: 0, monthlyRemaining: 0 };
		}
	}

	/**
	 * Record analysis usage after successful analysis
	 */
	async recordAnalysisUsage(analysisType: string): Promise<void> {
		if (!this.userId) return;

		try {
			const response = await fetch('/api/analysis/record-usage', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userId: this.userId,
					analysisType
				})
			});

			if (response.ok) {
				// Reload usage data to get updated counts
				await this.loadUsage();
			}
		} catch (error) {
			console.error('Error recording analysis usage:', error);
		}
	}

	/**
	 * Update timer state
	 */
	updateTimer(updates: Partial<TimerState>) {
		this.timer = { ...this.timer, ...updates };
	}

	/**
	 * Update usage after a session
	 */
	updateUsageAfterSession(secondsUsed: number, overageSeconds: number = 0) {
		if (!this.usage) return;

		const now = new Date();
		const updatedOverage = (this.usage.overageSeconds ?? 0) + overageSeconds;

		this.usage = {
			...this.usage,
			secondsUsed: (this.usage.secondsUsed ?? 0) + secondsUsed,
			conversationsUsed: (this.usage.conversationsUsed ?? 0) + 1,
			realtimeSessionsUsed: (this.usage.realtimeSessionsUsed ?? 0) + 1,
			overageSeconds: updatedOverage,
			lastConversationAt: now,
			lastRealtimeAt: now,
			updatedAt: now
		};

		this.sessionsToday += 1;
	}

	/**
	 * Reset timer to initial state
	 */
	resetTimer() {
		this.timer = {
			isRunning: false,
			isPaused: false,
			startTime: null,
			pausedAt: null,
			elapsedMs: 0,
			remainingMs: (this.tier?.conversationTimeoutSeconds || 0) * 1000,
			totalDurationMs: (this.tier?.conversationTimeoutSeconds || 0) * 1000,
			warningTriggered: false,
			extensionsUsed: 0,
			sessionId: null,
			language: null
		};
	}

	/**
	 * Clear all state
	 */
	clear() {
		this.userId = null;
		this.tier = null;
		this.usage = null;
		this.sessionsToday = 0;
		this.loading = false;
		this.error = null;
		this.resetTimer();
	}
}

// Export singleton instance
export const usageStore = new UsageStore();
