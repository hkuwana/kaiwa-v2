import { getTimerSettings } from '$lib/data/tiers';
import type { UserTier } from '$lib/server/db/types';

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
	private extensionsUsed: number = $state(0);

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

	constructor(userTier: UserTier = 'free') {
		this.configureForUserTier(userTier);
	}

	// Public getters
	get state() {
		return this._state;
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

		if (!settings) {
			console.warn(`No timer settings found for tier: ${tier}`);
			return;
		}

		this._state.userTier = tier;
		this.timeoutMs = settings.timeoutMs || 2 * 60 * 1000; // 2 min default
		this.warningThresholdMs = settings.warningThresholdMs || 30 * 1000; // 30s default
		this.extensionDurationMs = settings.extensionDurationMs || 60 * 1000; // 1 min default
		this.maxExtensions = settings.maxExtensions || 0;
		this.extendable = settings.extendable || false;

		// Update state
		this._state.canExtend = this.extendable;
		this._state.maxExtensions = this.maxExtensions;
		this._state.timer.timeRemaining = this.timeoutMs;
		this._state.timer.canExtend = this.extendable;

		console.log(`⏰ Timer configured for ${tier}:`, {
			timeout: this.timeoutMs,
			warning: this.warningThresholdMs,
			extendable: this.extendable,
			maxExtensions: this.maxExtensions
		});
	}

	// Start the timer
	start(onExpired?: () => void): void {
		console.log('⏰ Starting conversation timer');

		this.onExpired = onExpired;
		this.startTime = Date.now();
		this.totalPausedTime = 0;
		this.pauseStartTime = 0;
		this.extensionsUsed = 0;

		// Update state
		this._state.timer.isActive = true;
		this._state.timer.status = 'running';
		this._state.timer.extensionsUsed = 0;
		this._state.extensionsUsed = 0;
		this._hidePrompts();

		// Start update loop
		this._startUpdateLoop();
	}

	// Stop the timer
	stop(): void {
		console.log('⏰ Stopping conversation timer');

		this._stopUpdateLoop();
		this._resetState();
		this.onExpired = undefined;
	}

	// Pause the timer
	pause(): void {
		if (this._state.timer.status !== 'running') return;

		console.log('⏰ Pausing timer');
		this.pauseStartTime = Date.now();
		this._state.timer.status = 'paused';
	}

	// Resume the timer
	resume(): void {
		if (this._state.timer.status !== 'paused') return;

		console.log('⏰ Resuming timer');
		if (this.pauseStartTime > 0) {
			this.totalPausedTime += Date.now() - this.pauseStartTime;
			this.pauseStartTime = 0;
		}
		this._state.timer.status = 'running';
	}

	// Reset the timer
	reset(): void {
		console.log('⏰ Resetting timer');

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

	// Cleanup
	cleanup(): void {
		console.log('🧹 Cleaning up conversation timer');
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
			console.log('⏰ Timer update:', {
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

			console.log('⏰ Timer expired!');
			if (this.onExpired) {
				try {
					this.onExpired();
				} catch (error) {
					console.error('Error in timer expiration callback:', error);
				}
			}
		} else if (remaining <= this.warningThresholdMs) {
			// Warning state
			if (this._state.timer.status !== 'warning') {
				this._state.timer.status = 'warning';
				this._state.showWarning = true;
				console.log('⚠️ Timer warning state');
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
		this.extensionsUsed = 0;
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
