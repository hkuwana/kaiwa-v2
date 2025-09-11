// audio.store.svelte.ts - Audio store using Svelte 5 runes in a class
import {
	audioService,
	type AudioLevel,
	type PermissionState,
	createUserFriendlyError
} from '$lib/services/audio.service';
import { browser } from '$app/environment';

export class AudioStore {
	// =====================================
	// STATE (using runes)
	// =====================================
	isRecording = $state<boolean>(false);
	currentLevel = $state<AudioLevel>({ level: 0, timestamp: 0 });
	selectedDeviceId = $state<string>('default');
	availableDevices = $state<MediaDeviceInfo[]>([]);
	audioError = $state<string | null>(null);
	isInitialized = $state<boolean>(false);
	permissionState = $state<PermissionState | null>(null);
	userFriendlyError = $state<ReturnType<typeof createUserFriendlyError> | null>(null);

	// =====================================
	// DERIVED STATE (using runes)
	// =====================================
	levelPercentage = $derived(Math.round(this.currentLevel.level * 100));
	hasDevices = $derived(this.availableDevices.length > 0);
	canRecord = $derived(
		this.hasDevices &&
			!this.audioError &&
			this.isInitialized &&
			this.permissionState?.state !== 'denied'
	);
	isLevelActive = $derived(this.currentLevel.level > 0.01);
	hasPermission = $derived(this.permissionState?.state === 'granted');
	needsPermission = $derived(
		this.permissionState?.state === 'denied' || this.permissionState?.state === 'prompt'
	);
	canRetryPermission = $derived(this.permissionState?.canRetry === true);

	// Device selector helpers
	selectedDevice = $derived(
		this.availableDevices.find((d) => d.deviceId === this.selectedDeviceId)
	);
	hasMultipleDevices = $derived(this.availableDevices.length > 1);

	constructor() {
		if (browser) {
			// Set up permission and error callbacks
			audioService.onPermissionUpdate((permission: PermissionState) => {
				this.permissionState = { ...permission };
			});

			audioService.onUserFriendlyError((error: ReturnType<typeof createUserFriendlyError>) => {
				this.userFriendlyError = { ...error };
				this.audioError = error.message;
			});
		}
	}

	// =====================================
	// PUBLIC ACTIONS
	// =====================================
	async initialize() {
		if (!browser) return;

		try {
			console.log('🎵 AudioStore: Initializing...');
			await audioService.initialize();

			// Check permissions first
			const permission = await audioService.checkPermissions();
			console.log('🔒 AudioStore: Permission state:', permission);

			// Get available devices
			const devices = await audioService.getAvailableDevices();
			this.availableDevices = [...devices];
			this.isInitialized = true;
			this.audioError = null;
			this.userFriendlyError = null;

			console.log('✅ AudioStore: Initialized with', devices.length, 'devices');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Audio initialization failed';
			this.audioError = message;
			console.error('❌ AudioStore: Initialization failed:', error);
		}
	}

	async startRecording(deviceId?: string) {
		if (!browser) return;

		try {
			console.log('🎵 AudioStore: Starting recording with device:', deviceId || 'default');
			this.audioError = null;

			await audioService.getStream(deviceId);

			// Set up callbacks after getting the stream
			audioService.onLevelUpdate((level: AudioLevel) => {
				this.currentLevel = { ...level };
			});

			audioService.onStreamReady(() => {
				this.isRecording = true;
				this.audioError = null;
				console.log('✅ AudioStore: Stream ready, isRecording =', this.isRecording);
			});

			audioService.onStreamError((error: string) => {
				this.audioError = error;
				this.isRecording = false;
				console.log('❌ AudioStore: Stream error, isRecording =', this.isRecording);
			});

			if (deviceId) {
				this.selectedDeviceId = deviceId;
			}

			console.log('✅ AudioStore: Recording started');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to start recording';
			this.audioError = message;
			console.error('❌ AudioStore: Failed to start recording:', error);
		}
	}

	stopRecording() {
		console.log('🔇 AudioStore: Stopping recording, isRecording was:', this.isRecording);
		audioService.cleanup();
		this.isRecording = false;
		this.currentLevel = { level: 0, timestamp: Date.now() };
		console.log('🔇 AudioStore: Recording stopped, isRecording now:', this.isRecording);
	}

	async refreshDevices() {
		if (!browser) return;

		try {
			console.log('🔄 AudioStore: Refreshing devices');
			const devices = await audioService.getAvailableDevices();
			this.availableDevices = [...devices];
			console.log('✅ AudioStore: Refreshed devices:', devices.length);
		} catch (error) {
			console.error('❌ AudioStore: Failed to refresh devices:', error);
		}
	}

	clearError() {
		this.audioError = null;
		this.userFriendlyError = null;
	}

	// =====================================
	// PERMISSION METHODS
	// =====================================
	async checkPermissions(): Promise<PermissionState> {
		if (!browser)
			return { state: 'unknown', canRetry: false, userFriendlyMessage: 'Not in browser' };
		return await audioService.checkPermissions();
	}

	async requestPermissionGracefully(): Promise<{
		success: boolean;
		stream?: MediaStream;
		error?: ReturnType<typeof createUserFriendlyError>;
	}> {
		if (!browser) return { success: false };

		this.audioError = null;
		this.userFriendlyError = null;

		const result = await audioService.requestPermissionGracefully();

		if (result.success && result.stream) {
			this.isRecording = true;
		}

		return result;
	}

	// =====================================
	// UTILITY METHODS
	// =====================================
	getCurrentLevel(): number {
		return this.currentLevel.level;
	}

	hasActiveStream(): boolean {
		return this.isRecording;
	}

	triggerLevelUpdate() {
		// Trigger a real audio level update from the service
		audioService.triggerLevelUpdate();
	}

	// Get access to the underlying functional service
	getCore() {
		return audioService.getCore();
	}

	// Get current MediaStream (needed for realtime connection)
	getCurrentStream(): MediaStream | null {
		return audioService.getCurrentStream();
	}

	// Test audio constraints
	async testConstraints() {
		return audioService.testConstraints();
	}

	// Get device by ID
	getDevice(deviceId: string): MediaDeviceInfo | undefined {
		return this.availableDevices.find((d) => d.deviceId === deviceId);
	}

	// Switch to a specific device
	async switchToDevice(deviceId: string) {
		const wasRecording = this.isRecording;

		if (wasRecording) {
			this.stopRecording();
		}

		this.selectedDeviceId = deviceId;

		if (wasRecording) {
			await this.startRecording(deviceId);
		}
	}

	// Reset the entire store
	reset() {
		this.stopRecording();
		this.selectedDeviceId = 'default';
		this.audioError = null;
		this.userFriendlyError = null;
		this.permissionState = null;
		this.isInitialized = false;
		this.availableDevices = [];
	}
}

// =====================================
// SINGLETON INSTANCE
// =====================================
export const audioStore = new AudioStore();
