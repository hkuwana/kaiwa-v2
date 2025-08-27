// audio.store.svelte.ts - Audio store using Svelte 5 runes in a class
import { audioService, type AudioLevel } from '$lib/services/audio.service';
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

	// =====================================
	// DERIVED STATE (using runes)
	// =====================================
	levelPercentage = $derived(Math.round(this.currentLevel.level * 100));
	hasDevices = $derived(this.availableDevices.length > 0);
	canRecord = $derived(this.hasDevices && !this.audioError && this.isInitialized);
	isLevelActive = $derived(this.currentLevel.level > 0.01);
	
	// Device selector helpers
	selectedDevice = $derived(
		this.availableDevices.find(d => d.deviceId === this.selectedDeviceId)
	);
	hasMultipleDevices = $derived(this.availableDevices.length > 1);

	constructor() {
		// Initialize callbacks when the store is created
		if (browser) {
			this.setupCallbacks();
		}
	}

	// =====================================
	// PRIVATE METHODS
	// =====================================
	private setupCallbacks() {
		// Setup service callbacks to update state
		audioService.onLevelUpdate((level: AudioLevel) => {
			this.currentLevel = { ...level };
		});
		
		audioService.onStreamError((error: string) => {
			this.audioError = error;
			this.isRecording = false;
		});
		
		audioService.onStreamReady(() => {
			this.isRecording = true;
			this.audioError = null;
		});
	}

	// =====================================
	// PUBLIC ACTIONS
	// =====================================
	async initialize() {
		if (!browser) return;

		try {
			console.log('🎵 AudioStore: Initializing...');
			await audioService.initialize();
			
			// Get available devices
			const devices = await audioService.getAvailableDevices();
			this.availableDevices = [...devices];
			this.isInitialized = true;
			this.audioError = null;
			
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
		console.log('🔇 AudioStore: Stopping recording');
		audioService.cleanup();
		this.isRecording = false;
		this.currentLevel = { level: 0, timestamp: Date.now() };
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
	}

	// =====================================
	// UTILITY METHODS
	// =====================================
	getCurrentLevel(): number {
		return audioService.getCurrentAudioLevel();
	}

	hasActiveStream(): boolean {
		return audioService.hasActiveStream();
	}

	triggerLevelUpdate() {
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
		return this.availableDevices.find(d => d.deviceId === deviceId);
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
		this.isInitialized = false;
		this.availableDevices = [];
	}
}

// =====================================
// SINGLETON INSTANCE
// =====================================
export const audioStore = new AudioStore();