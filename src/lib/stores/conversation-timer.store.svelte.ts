import {
	createTimerService,
	type TimerService,
	type TimerState
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
	// Internal timer service
	private timerService: TimerService;

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
		// Create timer service with default config
		this.timerService = createTimerService();

		// Set up timer service callbacks
		this._setupTimerCallbacks();

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
			// Configure timer service with tier settings
			this.timerService.configure(timerSettings);

			// Update store state
			this._state.canExtend = timerSettings.extendable;
			this._state.maxExtensions = timerSettings.maxExtensions;
			this._state.extensionsUsed = 0;

			console.log(`⏰ Conversation timer configured for ${tier} tier`);
		} else {
			console.warn(`⚠️ No timer settings found for tier: ${tier}`);
		}
	}

	// Start conversation timer
	start(): void {
		this.timerService.start();
		this._updateTimerState();
		console.log('⏰ Conversation timer started');
	}

	// Stop conversation timer
	stop(): void {
		this.timerService.stop();
		this._updateTimerState();
		this._hideAllPrompts();
		console.log('⏰ Conversation timer stopped');
	}

	// Pause timer (e.g., when user switches tabs)
	pause(): void {
		this.timerService.pause();
		this._updateTimerState();
	}

	// Resume timer
	resume(): void {
		this.timerService.resume();
		this._updateTimerState();
	}

	// Reset timer
	reset(): void {
		this.timerService.reset();
		this._updateTimerState();
		this._hideAllPrompts();
		this._state.extensionsUsed = 0;
	}

	// Extend conversation
	extend(additionalMs?: number): boolean {
		const success = this.timerService.extend(additionalMs);
		if (success) {
			this._updateTimerState();
			this._hideAllPrompts();
			this._state.extensionsUsed = this.timerService.state.extensionsUsed;
		}
		return success;
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
		return this.timerService.getFormattedTimeRemaining();
	}

	getTimeElapsed(): string {
		return this.timerService.getFormattedTimeElapsed();
	}

	// Check timer states
	isInWarningState(): boolean {
		return this.timerService.isInWarningState();
	}

	isExpired(): boolean {
		return this.timerService.isExpired();
	}

	// Get debug information
	getDebugInfo() {
		return {
			storeState: this._state,
			timerService: this.timerService.getDebugInfo()
		};
	}

	// Cleanup
	cleanup(): void {
		this.timerService.cleanup();
		console.log('🧹 Conversation timer store cleaned up');
	}

	// Private methods
	private _setupTimerCallbacks(): void {
		// Warning callback
		this.timerService.onWarning(() => {
			console.log('⚠️ Timer warning triggered');
			this._state.showWarning = true;
			this._updateTimerState();
		});

		// Expired callback
		this.timerService.onExpired(() => {
			console.log('⏰ Timer expired - ending conversation');
			this._state.showExtensionPrompt = true;
			this._updateTimerState();
		});

		// Tick callback
		this.timerService.onTick((_timeRemaining: number) => {
			// Update timer state on every tick
			this._updateTimerState();
		});

		// State change callback
		this.timerService.onStateChange((_timerState: TimerState) => {
			this._updateTimerState();
		});
	}

	private _updateTimerState(): void {
		const timerState = this.timerService.state;
		this._state.timer = { ...timerState };

		// Update warning state
		this._state.showWarning = timerState.status === 'warning';

		// Update extension prompt state
		this._state.showExtensionPrompt = timerState.status === 'expired';

		// Update extension state
		this._state.extensionsUsed = timerState.extensionsUsed;
		this._state.canExtend =
			timerState.canExtend && timerState.extensionsUsed < this._state.maxExtensions;
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
