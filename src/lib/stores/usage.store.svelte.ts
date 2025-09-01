// usage.store.svelte.ts
// Combined store for MVP - handles both usage tracking and timer functionality
import type { Tier } from '$lib/server/db/types';
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

export interface UsageData {
	// Current period usage
	secondsUsed: number; // Changed from minutesUsed
	secondsRemaining: number; // Changed from minutesRemaining
	totalAvailableSeconds: number; // Changed from totalAvailableMinutes
	bankedSeconds: number; // Changed from bankedMinutes
	bankedSecondsUsed: number; // Changed from bankedMinutesUsed
	conversationsUsed: number;
	realtimeSessionsUsed: number;

	// Limits from tier
	monthlySeconds: number; // Changed from monthlyMinutes
	monthlyConversations: number;
	monthlyRealtimeSessions: number;
	maxBankedSeconds: number; // Changed from maxBankedMinutes

	// Meta
	currentPeriod: string;
	percentageUsed: number;
	canStartSession: boolean;
	estimatedOverageCharge: number;
	sessionsToday: number;
}

class UsageStore {
	// User info
	userId = $state<string | null>(null);
	tier = $state<Tier | null>(null);

	// Usage data
	usage = $state<UsageData | null>(null);

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

		// Check conversation limits
		if (
			this.tier.monthlyConversations &&
			this.usage.conversationsUsed >= this.tier.monthlyConversations
		) {
			return false;
		}

		// Check realtime session limits
		if (
			this.tier.monthlyRealtimeSessions &&
			this.usage.realtimeSessionsUsed >= this.tier.monthlyRealtimeSessions
		) {
			return false;
		}

		// Seconds can go into overage, so always true for paid users
		return true;
	});

	willIncurOverage = $derived(() => {
		if (!this.usage) return false;
		return this.usage.secondsRemaining <= 0;
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
		return Math.ceil(this.timer.elapsedMs / 1000); // Changed from sessionMinutesUsed, now returns seconds
	});

	// --- Methods ---

	/**
	 * Initialize store with user data
	 */
	setUser(userId: string, tier: Tier) {
		this.userId = userId;
		this.tier = tier;

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
			const response = await fetch(`/api/usage/${this.userId}`);
			if (!response.ok) throw new Error('Failed to load usage');

			const data = await response.json();
			this.usage = data;
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Failed to load usage';
		} finally {
			this.loading = false;
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
		// Changed from minutesUsed, overageMinutes
		if (!this.usage) return;

		// Update local state optimistically
		this.usage = {
			...this.usage,
			secondsUsed: this.usage.secondsUsed + secondsUsed, // Changed from minutesUsed
			secondsRemaining: Math.max(0, this.usage.secondsRemaining - secondsUsed), // Changed from minutesRemaining
			conversationsUsed: this.usage.conversationsUsed + 1,
			realtimeSessionsUsed: this.usage.realtimeSessionsUsed + 1,
			sessionsToday: this.usage.sessionsToday + 1,
			percentageUsed:
				((this.usage.secondsUsed + secondsUsed) / this.usage.totalAvailableSeconds) * 100 // Changed from totalAvailableMinutes
		};

		if (overageSeconds > 0) {
			// Changed from overageMinutes
			this.usage.estimatedOverageCharge = overageSeconds * this.overageRate();
		}
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
		this.loading = false;
		this.error = null;
		this.resetTimer();
	}
}

// Export singleton instance
export const usageStore = new UsageStore();
