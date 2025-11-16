import { logger } from '$lib/logger';
import { getTimerSettings, getMaxSessionLength, getMonthlySeconds } from '$lib/data/tiers';
import type { UserTier } from '$lib/server/db/types';
import { track } from '$lib/analytics/posthog';

export interface TimerState {
	isActive: boolean;
	timeRemaining: number;
	timeElapsed: number;
	status: 'idle' | 'running' | 'paused' | 'warning' | 'expired';
	canExtend: boolean;
	extensionsUsed: number;
}

export interface ConversationTimerState {
	timer: TimerState;
	userTier: UserTier;
	showWarning: boolean;
	showExtensionPrompt: boolean;
	canExtend: boolean;
	extensionsUsed: number;
	maxExtensions: number;
}

export interface UsageLimits {
	monthlySeconds: number;
	maxSessionLengthSeconds: number;
	usedSeconds: number;
	remainingSeconds: number;
}

export class ConversationTimerStore {
	// Configuration
	private timeoutMs: number = $state(0);
	private warningThresholdMs: number = $state(0);
	private extensionDurationMs: number = $state(0);
	private maxExtensions: number = $state(0);
	private extendable: boolean = $state(false);

	// Timing state
	private startTime: number = $state(0);
	private totalPausedTime: number = $state(0);
	private pauseStartTime: number = $state(0);

	// Update interval
	private updateInterval: NodeJS.Timeout | null = $state(null);
	private onExpired?: () => void = $state(undefined);

	// Reactive state
	private _state = $state<ConversationTimerState>({
		timer: {
			isActive: false,
			timeRemaining: 0,
			timeElapsed: 0,
			status: 'idle',
			canExtend: false,
			extensionsUsed: 0
		},
		userTier: 'free',
		showWarning: false,
		showExtensionPrompt: false,
		canExtend: false,
		extensionsUsed: 0,
		maxExtensions: 0
	});

	// Usage tracking
	private _usageLimits = $state<UsageLimits>({
		monthlySeconds: 0,
		maxSessionLengthSeconds: 0,
		usedSeconds: 0,
		remainingSeconds: 0
	});

	constructor(userTier: UserTier = 'free') {
		this.configureForUserTier(userTier);
	}

	// Public getters
	get state() {
		return this._state;
	}

	get usageLimits() {
		return this._usageLimits;
	}

	get isRunning() {
		return this._state.timer.status === 'running';
	}

	get isPaused() {
		return this._state.timer.status === 'paused';
	}

	get isExpired() {
		return this._state.timer.status === 'expired';
	}

	get timeRemaining() {
		return this._state.timer.timeRemaining;
	}

	get timeElapsed() {
		return this._state.timer.timeElapsed;
	}

	// Configure for user tier
	configureForUserTier(tier: UserTier): void {
		const settings = getTimerSettings(tier);
		const maxSessionLengthSeconds = getMaxSessionLength(tier);
		const monthlySeconds = getMonthlySeconds(tier);

		if (!settings) {
			logger.warn(`No timer settings found for tier: ${tier}`);
			return;
		}

		this._state.userTier = tier;
		// Convert seconds to milliseconds for internal calculations
		this.timeoutMs = settings.timeoutMs * 1000; // Convert seconds to milliseconds
		this.warningThresholdMs = settings.warningThresholdMs * 1000; // Convert seconds to milliseconds
		this.extensionDurationMs = settings.extensionDurationMs * 1000; // Convert seconds to milliseconds
		this.maxExtensions = settings.maxExtensions || 0;
		this.extendable = settings.extendable || false;

		// Update usage limits
		this._usageLimits = {
			monthlySeconds,
			maxSessionLengthSeconds,
			usedSeconds: 0, // This would come from user's actual usage
			remainingSeconds: monthlySeconds
		};

		// Update state
		this._state.canExtend = this.extendable;
		this._state.maxExtensions = this.maxExtensions;
		this._state.timer.timeRemaining = this.timeoutMs;
		this._state.timer.canExtend = this.extendable;
	}

	// Start the timer
	start(onExpired?: () => void): void {
		logger.info('⏰ Starting conversation timer');

		this.onExpired = onExpired;
		this.startTime = Date.now();
		this.totalPausedTime = 0;
		this.pauseStartTime = 0;

		// Update state
		this._state.timer.isActive = true;
		this._state.timer.status = 'running';
		this._state.timer.extensionsUsed = 0;
		this._state.extensionsUsed = 0;
		this._hidePrompts();

		// Start update loop
		this._startUpdateLoop();

		// Track session start
		try {
			track('conversation_session_started', {
				tier: this._state.userTier
			});
		} catch {
			// Intentionally empty - analytics tracking is non-critical
		}
	}

	// Stop the timer
	stop(): void {
		logger.info('⏰ Stopping conversation timer');
		// Capture duration before reset
		const durationSeconds = this.getTimeElapsedSeconds();
		try {
			track('conversation_session_ended', {
				reason: 'stopped',
				duration_seconds: durationSeconds,
				tier: this._state.userTier
			});
		} catch {
			// Intentionally empty - analytics tracking is non-critical
		}
		this._stopUpdateLoop();
		this._resetState();
		this.onExpired = undefined;
	}

	// Pause the timer
	pause(): void {
		if (this._state.timer.status !== 'running') return;

		logger.info('⏰ Pausing timer');
		this.pauseStartTime = Date.now();
		this._state.timer.status = 'paused';
	}

	// Resume the timer
	resume(): void {
		if (this._state.timer.status !== 'paused') return;

		logger.info('⏰ Resuming timer');
		if (this.pauseStartTime > 0) {
			this.totalPausedTime += Date.now() - this.pauseStartTime;
			this.pauseStartTime = 0;
		}
		this._state.timer.status = 'running';
	}

	// Reset the timer
	reset(): void {
		this._stopUpdateLoop();
		this._resetInternalState();
		this._resetState();
		this.onExpired = undefined;
	}

	// Format time remaining as MM:SS
	formatTimeRemaining(): string {
		const minutes = Math.floor(this._state.timer.timeRemaining / 60000);
		const seconds = Math.floor((this._state.timer.timeRemaining % 60000) / 1000);
		return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	}

	// Format time elapsed as MM:SS
	formatTimeElapsed(): string {
		const minutes = Math.floor(this._state.timer.timeElapsed / 60000);
		const seconds = Math.floor((this._state.timer.timeElapsed % 60000) / 1000);
		return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	}

	// Get time remaining in seconds
	getTimeRemainingSeconds(): number {
		return Math.floor(this._state.timer.timeRemaining / 1000);
	}

	// Get time elapsed in seconds
	getTimeElapsedSeconds(): number {
		return Math.floor(this._state.timer.timeElapsed / 1000);
	}

	// Get time remaining in milliseconds
	getTimeRemainingMs(): number {
		return this._state.timer.timeRemaining;
	}

	// Get time elapsed in milliseconds
	getTimeElapsedMs(): number {
		return this._state.timer.timeElapsed;
	}

	// Format time in seconds
	formatTimeInSeconds(timeMs: number): string {
		const seconds = Math.floor(timeMs / 1000);
		return `${seconds}s`;
	}

	// Format time in minutes and seconds
	formatTimeInMinutes(timeMs: number): string {
		const minutes = Math.floor(timeMs / 60000);
		const seconds = Math.floor((timeMs % 60000) / 1000);
		return `${minutes}m ${seconds}s`;
	}

	// Check if session time is within limits
	isWithinSessionLimits(): boolean {
		const sessionTimeSeconds = this.getTimeElapsedSeconds();
		return sessionTimeSeconds <= this._usageLimits.maxSessionLengthSeconds;
	}

	// Check if monthly time is within limits
	isWithinMonthlyLimits(): boolean {
		return this._usageLimits.remainingSeconds > 0;
	}

	// Update usage (call this when timer stops)
	updateUsage(): void {
		const usedSeconds = this.getTimeElapsedSeconds();
		this._usageLimits.usedSeconds += usedSeconds;
		this._usageLimits.remainingSeconds = Math.max(
			0,
			this._usageLimits.monthlySeconds - this._usageLimits.usedSeconds
		);
	}

	// Replace usage snapshot with authoritative values from the server
	syncUsageLimits(limits: Partial<UsageLimits>): void {
		const monthlySeconds =
			limits.monthlySeconds !== undefined
				? Math.max(0, limits.monthlySeconds)
				: this._usageLimits.monthlySeconds;

		const maxSessionLengthSeconds =
			limits.maxSessionLengthSeconds !== undefined
				? Math.max(0, limits.maxSessionLengthSeconds)
				: this._usageLimits.maxSessionLengthSeconds;

		const usedSeconds =
			limits.usedSeconds !== undefined
				? Math.max(0, limits.usedSeconds)
				: this._usageLimits.usedSeconds;

		const remainingSeconds =
			limits.remainingSeconds !== undefined
				? Math.max(0, limits.remainingSeconds)
				: Math.max(0, monthlySeconds - usedSeconds);

		this._usageLimits = {
			monthlySeconds,
			maxSessionLengthSeconds,
			usedSeconds,
			remainingSeconds
		};
	}

	// Cleanup
	cleanup(): void {
		logger.info('🧹 Cleaning up conversation timer');
		this._stopUpdateLoop();
		this.onExpired = undefined;
	}

	// Private methods
	private _startUpdateLoop(): void {
		if (this.updateInterval) return;

		this.updateInterval = setInterval(() => {
			this._updateTimerState();
		}, 100); // Update every 100ms for smooth UI
	}

	private _stopUpdateLoop(): void {
		if (this.updateInterval) {
			clearInterval(this.updateInterval);
			this.updateInterval = null;
		}
	}

	private _updateTimerState(): void {
		if (!this._state.timer.isActive || this._state.timer.status === 'paused') {
			return;
		}

		const now = Date.now();
		const elapsed = now - this.startTime - this.totalPausedTime;
		const remaining = Math.max(0, this.timeoutMs - elapsed);

		// Debug logging every 5 seconds
		if (elapsed % 5000 < 100) {
			logger.info('⏰ Timer update:', {
				elapsed,
				remaining,
				startTime: this.startTime,
				timeoutMs: this.timeoutMs,
				isActive: this._state.timer.isActive,
				status: this._state.timer.status
			});
		}

		// Update times
		this._state.timer.timeElapsed = elapsed;
		this._state.timer.timeRemaining = remaining;

		// Check status
		if (remaining <= 0) {
			// Expired
			this._state.timer.status = 'expired';
			this._state.showExtensionPrompt = true;
			this._stopUpdateLoop();

			logger.info('⏰ Timer expired!');
			// Track expiry with duration
			try {
				track('conversation_session_ended', {
					reason: 'expired',
					duration_seconds: this.getTimeElapsedSeconds(),
					tier: this._state.userTier
				});
			} catch {
				// Intentionally empty - analytics tracking is non-critical
			}
			if (this.onExpired) {
				try {
					this.onExpired();
				} catch (error) {
					logger.error('Error in timer expiration callback:', error);
				}
			}
		} else if (remaining <= this.warningThresholdMs) {
			// Warning state
			if (this._state.timer.status !== 'warning') {
				this._state.timer.status = 'warning';
				this._state.showWarning = true;
				logger.info('⚠️ Timer warning state');
			}
		}
	}

	private _resetState(): void {
		this._state.timer = {
			isActive: false,
			timeRemaining: this.timeoutMs,
			timeElapsed: 0,
			status: 'idle',
			canExtend: this.extendable,
			extensionsUsed: 0
		};
		this._state.extensionsUsed = 0;
		this._hidePrompts();
	}

	private _resetInternalState(): void {
		this.startTime = 0;
		this.totalPausedTime = 0;
		this.pauseStartTime = 0;
	}

	private _hidePrompts(): void {
		this._state.showWarning = false;
		this._state.showExtensionPrompt = false;
	}
}

// Factory function
export function createConversationTimerStore(userTier: UserTier = 'free'): ConversationTimerStore {
	return new ConversationTimerStore(userTier);
}

// Utility functions for working with time units
export const TimeUtils = {
	// Convert seconds to milliseconds
	secondsToMs: (seconds: number): number => seconds * 1000,

	// Convert milliseconds to seconds
	msToSeconds: (ms: number): number => Math.floor(ms / 1000),

	// Convert minutes to milliseconds
	minutesToMs: (minutes: number): number => minutes * 60 * 1000,

	// Convert milliseconds to minutes
	msToMinutes: (ms: number): number => Math.floor(ms / 60000),

	// Format time in different units
	formatTime: (timeMs: number, unit: 'ms' | 'seconds' | 'minutes' | 'auto' = 'auto'): string => {
		switch (unit) {
			case 'ms':
				return `${timeMs}ms`;
			case 'seconds':
				return `${Math.floor(timeMs / 1000)}s`;
			case 'minutes': {
				const minutes = Math.floor(timeMs / 60000);
				const seconds = Math.floor((timeMs % 60000) / 1000);
				return `${minutes}m ${seconds}s`;
			}
			case 'auto':
			default: {
				if (timeMs < 1000) return `${timeMs}ms`;
				if (timeMs < 60000) return `${Math.floor(timeMs / 1000)}s`;
				const mins = Math.floor(timeMs / 60000);
				const secs = Math.floor((timeMs % 60000) / 1000);
				return `${mins}m ${secs}s`;
			}
		}
	},

	// Parse time string to milliseconds
	parseTime: (timeString: string): number => {
		// Handle formats like "5m 30s", "5m", "30s", "90s"
		const match = timeString.match(/(?:(\d+)m\s*)?(?:(\d+)s)?/);
		if (!match) return 0;

		const minutes = parseInt(match[1] || '0', 10);
		const seconds = parseInt(match[2] || '0', 10);

		return (minutes * 60 + seconds) * 1000;
	}
};
