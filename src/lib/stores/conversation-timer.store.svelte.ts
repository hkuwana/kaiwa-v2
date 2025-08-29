import {
	createDefaultTimerConfig,
	createTimerConfig,
	startTimer,
	stopTimer,
	pauseTimer,
	resumeTimer,
	extendTimer,
	resetTimer,
	calculateTimerState,
	formatTimeRemaining,
	formatTimeElapsed,
	isInWarningState,
	isExpired,
	type TimerState,
	type TimerConfig
} from '$lib/services/timer.service';
import { getTimerSettings } from '$lib/data/tiers';
import type { UserTier } from '$lib/server/db/types';

export interface ConversationTimerState {
	// Timer state
	timer: TimerState;

	// User tier information
	userTier: UserTier;
	tierConfig: ReturnType<typeof getTimerSettings>;

	// UI state
	showWarning: boolean;
	showExtensionPrompt: boolean;
	canExtend: boolean;

	// Extension state
	extensionsUsed: number;
	maxExtensions: number;
}

export class ConversationTimerStore {
	// Timer configuration and state
	private timerConfig: TimerConfig;
	private timerInput = {
		startTime: 0,
		pauseTime: 0,
		totalPausedTime: 0,
		extensionsUsed: 0
	};

	// Timer interval for updates
	private timerInterval: NodeJS.Timeout | null = null;

	// Callback for timer expiration
	private expirationCallback: (() => void) | undefined;

	// Store state
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
		tierConfig: getTimerSettings('free'),
		showWarning: false,
		showExtensionPrompt: false,
		canExtend: false,
		extensionsUsed: 0,
		maxExtensions: 0
	});

	constructor(userTier: UserTier = 'free') {
		// Initialize timer configuration
		this.timerConfig = createDefaultTimerConfig();

		// Configure for user tier
		this.configureForUserTier(userTier);
	}

	// Public getters
	get state() {
		return this._state;
	}

	get timer() {
		return this._state.timer;
	}

	get userTier() {
		return this._state.userTier;
	}

	get canExtend() {
		return this._state.canExtend;
	}

	get showWarning() {
		return this._state.showWarning;
	}

	get showExtensionPrompt() {
		return this._state.showExtensionPrompt;
	}

	// Configure timer for specific user tier
	configureForUserTier(tier: UserTier): void {
		this._state.userTier = tier;
		const timerSettings = getTimerSettings(tier);

		if (timerSettings) {
			// Configure timer with tier settings
			this.timerConfig = createTimerConfig(timerSettings);

			// Update store state
			this._state.canExtend = timerSettings.extendable;
			this._state.maxExtensions = timerSettings.maxExtensions;
			this._state.extensionsUsed = 0;

			// Reset timer input
			this.timerInput.extensionsUsed = 0;

			console.log(`⏰ Conversation timer configured for ${tier} tier`);
		} else {
			console.warn(`⚠️ No timer settings found for tier: ${tier}`);
		}
	}

	// Start conversation timer
	start(callback?: () => void): void {
		// Stop any existing interval
		this._stopTimerInterval();

		// Store callback for timer expiration
		this.expirationCallback = callback;

		// Start timer using functional service
		const startTime = Date.now();
		this.timerInput.startTime = startTime;
		this.timerInput.pauseTime = 0;
		this.timerInput.totalPausedTime = 0;
		this.timerInput.extensionsUsed = 0;

		const result = startTimer(this.timerConfig, startTime);
		this._state.timer = result.state;

		// Start timer interval for updates
		this._startTimerInterval();

		console.log('⏰ Conversation timer started');
	}

	// Stop conversation timer
	stop(): void {
		// Stop timer interval
		this._stopTimerInterval();

		// Stop timer using functional service
		const result = stopTimer(this.timerConfig);
		this._state.timer = result.state;

		// Clear expiration callback
		this.expirationCallback = undefined;

		this._hideAllPrompts();
		console.log('⏰ Conversation timer stopped');
	}

	// Pause timer (e.g., when user switches tabs)
	pause(): void {
		if (this._state.timer.status !== 'running') return;

		const pauseTime = Date.now();
		this.timerInput.pauseTime = pauseTime;

		const result = pauseTimer(this._state.timer, pauseTime);
		this._state.timer = result.state;
	}

	// Resume timer
	resume(): void {
		if (this._state.timer.status !== 'paused') return;

		const resumeTime = Date.now();
		const totalPausedTime =
			this.timerInput.totalPausedTime + (resumeTime - this.timerInput.pauseTime);
		this.timerInput.totalPausedTime = totalPausedTime;

		const result = resumeTimer(
			this._state.timer,
			resumeTime,
			this.timerInput.pauseTime,
			totalPausedTime
		);
		this._state.timer = result.state;
	}

	// Reset timer
	reset(): void {
		// Stop timer interval
		this._stopTimerInterval();

		// Reset timer using functional service
		const result = resetTimer(this.timerConfig);
		this._state.timer = result.state;

		// Reset timer input
		this.timerInput.startTime = 0;
		this.timerInput.pauseTime = 0;
		this.timerInput.totalPausedTime = 0;
		this.timerInput.extensionsUsed = 0;

		// Clear expiration callback
		this.expirationCallback = undefined;

		this._hideAllPrompts();
		this._state.extensionsUsed = 0;
	}

	// Extend conversation
	extend(additionalMs?: number): boolean {
		const result = extendTimer(this._state.timer, this.timerConfig, additionalMs);

		if (result.state !== this._state.timer) {
			this._state.timer = result.state;
			this.timerInput.extensionsUsed = result.state.extensionsUsed;
			this._hideAllPrompts();
			return true;
		}

		return false;
	}

	// Extend with default tier extension duration
	extendDefault(): boolean {
		const timerSettings = getTimerSettings(this._state.userTier);
		if (timerSettings) {
			return this.extend(timerSettings.extensionDurationMs);
		}
		return false;
	}

	// Get formatted time strings
	getTimeRemaining(): string {
		return formatTimeRemaining(this._state.timer.timeRemaining);
	}

	getTimeElapsed(): string {
		return formatTimeElapsed(this._state.timer.timeElapsed);
	}

	// Check timer states
	isInWarningState(): boolean {
		return isInWarningState(this._state.timer.timeRemaining, this.timerConfig.warningThresholdMs);
	}

	isExpired(): boolean {
		return isExpired(this._state.timer.timeRemaining);
	}

	// Get debug information
	getDebugInfo() {
		return {
			storeState: this._state,
			timerConfig: this.timerConfig,
			timerInput: this.timerInput,
			hasInterval: !!this.timerInterval
		};
	}

	// Cleanup
	cleanup(): void {
		this._stopTimerInterval();
		this.expirationCallback = undefined;
		console.log('🧹 Conversation timer store cleaned up');
	}

	// Private methods
	private _startTimerInterval(): void {
		if (this.timerInterval) return;

		this.timerInterval = setInterval(() => {
			const now = Date.now();
			const timerInput = {
				config: this.timerConfig,
				...this.timerInput
			};

			const result = calculateTimerState(timerInput, now);
			this._state.timer = result.state;

			// Handle notifications
			if (result.shouldNotifyWarning) {
				console.log('⚠️ Timer warning triggered');
				this._state.showWarning = true;
			}

			if (result.shouldNotifyExpired) {
				console.log('⏰ Timer expired - ending conversation');
				this._state.showExtensionPrompt = true;

				// Execute expiration callback if provided
				if (this.expirationCallback) {
					try {
						this.expirationCallback();
					} catch (error) {
						console.error('Error executing timer expiration callback:', error);
					}
				}

				// Stop the interval when expired
				this._stopTimerInterval();
			}

			// Update extension state
			this._state.extensionsUsed = result.state.extensionsUsed;
			this._state.canExtend =
				result.state.canExtend && result.state.extensionsUsed < this._state.maxExtensions;

			// Update warning and extension prompt states
			this._state.showWarning = result.state.status === 'warning';
			this._state.showExtensionPrompt = result.state.status === 'expired';
		}, 100); // Update every 100ms for smooth countdown
	}

	private _stopTimerInterval(): void {
		if (this.timerInterval) {
			clearInterval(this.timerInterval);
			this.timerInterval = null;
		}
	}

	private _hideAllPrompts(): void {
		this._state.showWarning = false;
		this._state.showExtensionPrompt = false;
	}
}

// Export a factory function
export function createConversationTimerStore(userTier: UserTier = 'free'): ConversationTimerStore {
	return new ConversationTimerStore(userTier);
}
