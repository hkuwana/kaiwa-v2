export interface TimerConfig {
	timeoutMs: number;
	warningThresholdMs: number;
	extendable: boolean;
	maxExtensions: number;
	extensionDurationMs: number;
}

export interface TimerState {
	isActive: boolean;
	timeRemaining: number;
	timeElapsed: number;
	status: 'idle' | 'running' | 'paused' | 'warning' | 'expired';
	canExtend: boolean;
	extensionsUsed: number;
}


export class TimerService {
	// Timer state
	private _state: TimerState = {
		isActive: false,
		timeRemaining: 0,
		timeElapsed: 0,
		status: 'idle',
		canExtend: false,
		extensionsUsed: 0
	};

	// Timer configuration
	private _config: TimerConfig = {
		timeoutMs: 2 * 60 * 1000, // 2 minutes default
		warningThresholdMs: 30 * 1000, // 30 seconds warning
		extendable: false,
		maxExtensions: 0,
		extensionDurationMs: 0
	};

	// Internal timer management
	private _timer: NodeJS.Timeout | null = null;
	private _startTime: number = 0;
	private _pauseTime: number = 0;
	private _totalPausedTime: number = 0;

	// Event callbacks
	private _onWarning: (() => void) | null = null;
	private _onExpired: (() => void) | null = null;
	private _onTick: ((timeRemaining: number) => void) | null = null;
	private _onStateChange: ((state: TimerState) => void) | null = null;

	constructor(config?: Partial<TimerConfig>) {
		if (config) {
			this._config = { ...this._config, ...config };
		}
	}

	// Public getters for current state
	get state(): TimerState {
		return { ...this._state }; // Return copy to prevent external mutation
	}

	get config(): TimerConfig {
		return { ...this._config }; // Return copy to prevent external mutation
	}

	// Configure timer with new settings
	configure(config: TimerConfig): void {
		this._config = { ...config };
		console.log(
			`⏰ Timer configured: ${this._config.timeoutMs / 1000}s timeout, extendable: ${this._config.extendable}`
		);
	}

	// Start the timer
	start(): void {
		if (this._state.isActive) {
			console.warn('⚠️ Timer already running');
			return;
		}

		this._startTime = Date.now();
		this._totalPausedTime = 0;
		this._state = {
			...this._state,
			isActive: true,
			timeRemaining: this._config.timeoutMs,
			timeElapsed: 0,
			status: 'running',
			canExtend: this._config.extendable,
			extensionsUsed: 0
		};

		this._startTicking();
		this._notifyStateChange();
		console.log(`⏰ Timer started: ${this._config.timeoutMs / 1000}s remaining`);
	}

	// Stop the timer
	stop(): void {
		this._state = {
			...this._state,
			isActive: false,
			status: 'idle',
			timeRemaining: 0,
			timeElapsed: 0
		};
		this._stopTicking();
		this._notifyStateChange();
		console.log('⏹️ Timer stopped');
	}

	// Pause the timer
	pause(): void {
		if (!this._state.isActive || this._state.status === 'paused') {
			return;
		}

		this._pauseTime = Date.now();
		this._state.status = 'paused';
		this._stopTicking();
		this._notifyStateChange();
		console.log('⏸️ Timer paused');
	}

	// Resume the timer
	resume(): void {
		if (!this._state.isActive || this._state.status !== 'paused') {
			return;
		}

		const pauseDuration = Date.now() - this._pauseTime;
		this._totalPausedTime += pauseDuration;
		this._state.status = 'running';
		this._startTicking();
		this._notifyStateChange();
		console.log('▶️ Timer resumed');
	}

	// Reset the timer
	reset(): void {
		this.stop();
		this._state.timeRemaining = this._config.timeoutMs;
		this._startTime = 0;
		this._pauseTime = 0;
		this._totalPausedTime = 0;
		this._state.extensionsUsed = 0;
		console.log('🔄 Timer reset');
	}

	// Extend the timer
	extend(additionalMs?: number): boolean {
		if (!this._config.extendable) {
			console.warn('⚠️ Timer extension not allowed');
			return false;
		}

		if (!this._state.isActive) {
			console.warn('⚠️ Cannot extend inactive timer');
			return false;
		}

		if (this._state.extensionsUsed >= this._config.maxExtensions) {
			console.warn('⚠️ Maximum extensions reached');
			return false;
		}

		const extensionAmount = additionalMs || this._config.extensionDurationMs;
		this._state.timeRemaining += extensionAmount;
		this._state.extensionsUsed++;

		this._notifyStateChange();
		console.log(
			`⏰ Timer extended by ${extensionAmount / 1000}s (${this._state.extensionsUsed}/${this._config.maxExtensions} used)`
		);
		return true;
	}

	// Set event callbacks
	onWarning(callback: () => void): void {
		this._onWarning = callback;
	}

	onExpired(callback: () => void): void {
		this._onExpired = callback;
	}

	onTick(callback: (timeRemaining: number) => void): void {
		this._onTick = callback;
	}

	onStateChange(callback: (state: TimerState) => void): void {
		this._onStateChange = callback;
	}

	// Get formatted time strings
	getFormattedTimeRemaining(): string {
		const minutes = Math.floor(this._state.timeRemaining / 60000);
		const seconds = Math.floor((this._state.timeRemaining % 60000) / 1000);
		return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	}

	getFormattedTimeElapsed(): string {
		const minutes = Math.floor(this._state.timeElapsed / 60000);
		const seconds = Math.floor((this._state.timeElapsed % 60000) / 1000);
		return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	}

	// Check timer states
	isInWarningState(): boolean {
		return (
			this._state.timeRemaining <= this._config.warningThresholdMs && this._state.timeRemaining > 0
		);
	}

	isExpired(): boolean {
		return this._state.timeRemaining <= 0;
	}

	canExtend(): boolean {
		return this._config.extendable && this._state.extensionsUsed < this._config.maxExtensions;
	}

	// Get debug information
	getDebugInfo(): {
		state: TimerState;
		config: TimerConfig;
		internal: {
			startTime: number;
			pauseTime: number;
			totalPausedTime: number;
			timerActive: boolean;
		};
	} {
		return {
			state: this._state,
			config: this._config,
			internal: {
				startTime: this._startTime,
				pauseTime: this._pauseTime,
				totalPausedTime: this._totalPausedTime,
				timerActive: !!this._timer
			}
		};
	}

	// Private methods
	private _startTicking(): void {
		if (this._timer) return;

		this._timer = setInterval(() => {
			if (this._state.status !== 'running') return;

			const now = Date.now();
			const elapsed = now - this._startTime - this._totalPausedTime;
			const remaining = Math.max(0, this._config.timeoutMs - elapsed);

			this._state.timeRemaining = remaining;
			this._state.timeElapsed = elapsed;

			// Call tick callback
			if (this._onTick) {
				this._onTick(remaining);
			}

			// Check for warning threshold
			if (this.isInWarningState() && this._state.status === 'running') {
				this._state.status = 'warning';
				this._notifyStateChange();
				if (this._onWarning) {
					this._onWarning();
				}
				console.log('⚠️ Timer warning threshold reached');
			}

			// Check for expiration
			if (this.isExpired()) {
				this._state.status = 'expired';
				this.stop();
				if (this._onExpired) {
					this._onExpired();
				}
				console.log('⏰ Timer expired');
			}
		}, 100); // Update every 100ms for smooth countdown
	}

	private _stopTicking(): void {
		if (this._timer) {
			clearInterval(this._timer);
			this._timer = null;
		}
	}

	private _notifyStateChange(): void {
		if (this._onStateChange) {
			this._onStateChange({ ...this._state });
		}
	}

	// Cleanup method
	cleanup(): void {
		this.stop();
		this._onWarning = null;
		this._onExpired = null;
		this._onTick = null;
		this._onStateChange = null;
		console.log('🧹 Timer service cleaned up');
	}
}

// Export a factory function for easy creation
export function createTimerService(config?: Partial<TimerConfig>): TimerService {
	return new TimerService(config);
}
