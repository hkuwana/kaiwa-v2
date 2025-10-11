// src/lib/services/timer.service.ts
// Pure functional timer service - no classes, no state, just functions

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

export interface TimerInput {
	config: TimerConfig;
	startTime: number;
	pauseTime: number;
	totalPausedTime: number;
	extensionsUsed: number;
}

export interface TimerResult {
	state: TimerState;
	shouldNotifyWarning: boolean;
	shouldNotifyExpired: boolean;
	shouldNotifyTick: boolean;
	shouldNotifyStateChange: boolean;
}

export interface TimerValidationResult {
	isValid: boolean;
	error?: string;
}

// === TIMER CONFIGURATION FUNCTIONS ===

/**
 * Create a default timer configuration
 * @returns Default timer configuration
 */
export function createDefaultTimerConfig(): TimerConfig {
	return {
		timeoutMs: 2 * 60 * 1000, // 2 minutes default
		warningThresholdMs: 30 * 1000, // 30 seconds warning
		extendable: false,
		maxExtensions: 0,
		extensionDurationMs: 0
	};
}

/**
 * Create a timer configuration with custom settings
 * @param config - Partial configuration to override defaults
 * @returns Complete timer configuration
 */
export function createTimerConfig(config: Partial<TimerConfig>): TimerConfig {
	const defaultConfig = createDefaultTimerConfig();
	return { ...defaultConfig, ...config };
}

/**
 * Validate timer configuration
 * @param config - Timer configuration to validate
 * @returns Validation result
 */
export function validateTimerConfig(config: TimerConfig): TimerValidationResult {
	if (config.timeoutMs <= 0) {
		return { isValid: false, error: 'Timeout must be greater than 0' };
	}
	if (config.warningThresholdMs >= config.timeoutMs) {
		return { isValid: false, error: 'Warning threshold must be less than timeout' };
	}
	if (config.warningThresholdMs < 0) {
		return { isValid: false, error: 'Warning threshold cannot be negative' };
	}
	if (config.extendable && config.maxExtensions <= 0) {
		return { isValid: false, error: 'Max extensions must be greater than 0 when extendable' };
	}
	if (config.extendable && config.extensionDurationMs <= 0) {
		return { isValid: false, error: 'Extension duration must be greater than 0 when extendable' };
	}
	return { isValid: true };
}

// === TIMER STATE FUNCTIONS ===

/**
 * Create initial timer state
 * @param config - Timer configuration
 * @returns Initial timer state
 */
export function createInitialTimerState(config: TimerConfig): TimerState {
	return {
		isActive: false,
		timeRemaining: config.timeoutMs,
		timeElapsed: 0,
		status: 'idle',
		canExtend: config.extendable,
		extensionsUsed: 0
	};
}

/**
 * Calculate timer state based on current time and configuration
 * @param input - Timer input parameters
 * @param currentTime - Current timestamp
 * @returns Timer result with state and notification flags
 */
export function calculateTimerState(input: TimerInput, currentTime: number): TimerResult {
	const { config, startTime, totalPausedTime, extensionsUsed } = input;

	if (startTime === 0) {
		return {
			state: createInitialTimerState(config),
			shouldNotifyWarning: false,
			shouldNotifyExpired: false,
			shouldNotifyTick: false,
			shouldNotifyStateChange: false
		};
	}

	const elapsed = currentTime - startTime - totalPausedTime;
	const remaining = Math.max(0, config.timeoutMs - elapsed);

	let status: TimerState['status'] = 'running';
	let shouldNotifyWarning = false;
	let shouldNotifyExpired = false;

	// Check for warning threshold
	if (remaining <= config.warningThresholdMs && remaining > 0) {
		status = 'warning';
		shouldNotifyWarning = true;
	}

	// Check for expiration
	if (remaining <= 0) {
		status = 'expired';
		shouldNotifyExpired = true;
	}

	const state: TimerState = {
		isActive: true,
		timeRemaining: remaining,
		timeElapsed: elapsed,
		status,
		canExtend: config.extendable && extensionsUsed < config.maxExtensions,
		extensionsUsed
	};

	return {
		state,
		shouldNotifyWarning,
		shouldNotifyExpired,
		shouldNotifyTick: status === 'running',
		shouldNotifyStateChange: true
	};
}

/**
 * Start timer and return initial state
 * @param config - Timer configuration
 * @param startTime - Start timestamp
 * @returns Timer result
 */
export function startTimer(config: TimerConfig, startTime: number): TimerResult {
	const input: TimerInput = {
		config,
		startTime,
		pauseTime: 0,
		totalPausedTime: 0,
		extensionsUsed: 0
	};

	return calculateTimerState(input, startTime);
}

/**
 * Pause timer and return paused state
 * @param currentState - Current timer state
 * @param pauseTime - Pause timestamp
 * @returns Timer result
 */
export function pauseTimer(currentState: TimerState, _pauseTime: number): TimerResult {
	if (!currentState.isActive || currentState.status === 'paused') {
		return {
			state: currentState,
			shouldNotifyWarning: false,
			shouldNotifyExpired: false,
			shouldNotifyTick: false,
			shouldNotifyStateChange: false
		};
	}

	const pausedState: TimerState = {
		...currentState,
		status: 'paused'
	};

	return {
		state: pausedState,
		shouldNotifyWarning: false,
		shouldNotifyExpired: false,
		shouldNotifyTick: false,
		shouldNotifyStateChange: true
	};
}

/**
 * Resume timer and return resumed state
 * @param currentState - Current timer state
 * @param resumeTime - Resume timestamp
 * @param pauseTime - Previous pause timestamp
 * @param totalPausedTime - Total paused time so far
 * @returns Timer result
 */
export function resumeTimer(
	currentState: TimerState,
	_resumeTime: number,
	_pauseTime: number,
	_totalPausedTime: number
): TimerResult {
	if (!currentState.isActive || currentState.status !== 'paused') {
		return {
			state: currentState,
			shouldNotifyWarning: false,
			shouldNotifyExpired: false,
			shouldNotifyTick: false,
			shouldNotifyStateChange: false
		};
	}

	const resumedState: TimerState = {
		...currentState,
		status: 'running'
	};

	return {
		state: resumedState,
		shouldNotifyWarning: false,
		shouldNotifyExpired: false,
		shouldNotifyTick: true,
		shouldNotifyStateChange: true
	};
}

/**
 * Stop timer and return stopped state
 * @param config - Timer configuration
 * @returns Timer result
 */
export function stopTimer(_config: TimerConfig): TimerResult {
	const stoppedState: TimerState = {
		isActive: false,
		timeRemaining: 0,
		timeElapsed: 0,
		status: 'idle',
		canExtend: false,
		extensionsUsed: 0
	};

	return {
		state: stoppedState,
		shouldNotifyWarning: false,
		shouldNotifyExpired: false,
		shouldNotifyTick: false,
		shouldNotifyStateChange: true
	};
}

/**
 * Reset timer and return reset state
 * @param config - Timer configuration
 * @returns Timer result
 */
export function resetTimer(config: TimerConfig): TimerResult {
	const initialState = createInitialTimerState(config);
	return {
		state: initialState,
		shouldNotifyWarning: false,
		shouldNotifyExpired: false,
		shouldNotifyTick: false,
		shouldNotifyStateChange: true
	};
}

/**
 * Extend timer and return extended state
 * @param currentState - Current timer state
 * @param config - Timer configuration
 * @param additionalMs - Additional milliseconds to add
 * @returns Timer result
 */
export function extendTimer(
	currentState: TimerState,
	config: TimerConfig,
	additionalMs?: number
): TimerResult {
	if (!config.extendable) {
		return {
			state: currentState,
			shouldNotifyWarning: false,
			shouldNotifyExpired: false,
			shouldNotifyTick: false,
			shouldNotifyStateChange: false
		};
	}

	if (!currentState.isActive) {
		return {
			state: currentState,
			shouldNotifyWarning: false,
			shouldNotifyExpired: false,
			shouldNotifyTick: false,
			shouldNotifyStateChange: false
		};
	}

	if (currentState.extensionsUsed >= config.maxExtensions) {
		return {
			state: currentState,
			shouldNotifyWarning: false,
			shouldNotifyExpired: false,
			shouldNotifyTick: false,
			shouldNotifyStateChange: false
		};
	}

	const extensionAmount = additionalMs || config.extensionDurationMs;
	const extendedState: TimerState = {
		...currentState,
		timeRemaining: currentState.timeRemaining + extensionAmount,
		extensionsUsed: currentState.extensionsUsed + 1,
		canExtend: config.extendable && currentState.extensionsUsed + 1 < config.maxExtensions
	};

	return {
		state: extendedState,
		shouldNotifyWarning: false,
		shouldNotifyExpired: false,
		shouldNotifyTick: false,
		shouldNotifyStateChange: true
	};
}

// === UTILITY FUNCTIONS ===

/**
 * Format time remaining as MM:SS string
 * @param timeRemainingMs - Time remaining in milliseconds
 * @returns Formatted time string
 */
export function formatTimeRemaining(timeRemainingMs: number): string {
	const minutes = Math.floor(timeRemainingMs / 60000);
	const seconds = Math.floor((timeRemainingMs % 60000) / 1000);
	return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format time elapsed as MM:SS string
 * @param timeElapsedMs - Time elapsed in milliseconds
 * @returns Formatted time string
 */
export function formatTimeElapsed(timeElapsedMs: number): string {
	const minutes = Math.floor(timeElapsedMs / 60000);
	const seconds = Math.floor((timeElapsedMs % 60000) / 1000);
	return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Check if timer is in warning state
 * @param timeRemainingMs - Time remaining in milliseconds
 * @param warningThresholdMs - Warning threshold in milliseconds
 * @returns True if in warning state
 */
export function isInWarningState(timeRemainingMs: number, warningThresholdMs: number): boolean {
	return timeRemainingMs <= warningThresholdMs && timeRemainingMs > 0;
}

/**
 * Check if timer is expired
 * @param timeRemainingMs - Time remaining in milliseconds
 * @returns True if expired
 */
export function isExpired(timeRemainingMs: number): boolean {
	return timeRemainingMs <= 0;
}

/**
 * Check if timer can be extended
 * @param config - Timer configuration
 * @param extensionsUsed - Number of extensions already used
 * @returns True if can be extended
 */
export function canExtend(config: TimerConfig, extensionsUsed: number): boolean {
	return config.extendable && extensionsUsed < config.maxExtensions;
}

/**
 * Calculate total paused time
 * @param pauseTime - When timer was paused
 * @param resumeTime - When timer was resumed
 * @param previousTotalPaused - Previous total paused time
 * @returns Total paused time in milliseconds
 */
export function calculateTotalPausedTime(
	pauseTime: number,
	resumeTime: number,
	previousTotalPaused: number
): number {
	if (pauseTime === 0 || resumeTime === 0) {
		return previousTotalPaused;
	}

	const pauseDuration = resumeTime - pauseTime;
	return previousTotalPaused + pauseDuration;
}

/**
 * Get debug information for timer
 * @param input - Timer input parameters
 * @param currentState - Current timer state
 * @param currentTime - Current timestamp
 * @returns Debug information object
 */
export function getTimerDebugInfo(
	input: TimerInput,
	currentState: TimerState,
	currentTime: number
): {
	state: TimerState;
	config: TimerConfig;
	internal: {
		startTime: number;
		pauseTime: number;
		totalPausedTime: number;
		currentTime: number;
	};
} {
	return {
		state: currentState,
		config: input.config,
		internal: {
			startTime: input.startTime,
			pauseTime: input.pauseTime,
			totalPausedTime: input.totalPausedTime,
			currentTime
		}
	};
}
