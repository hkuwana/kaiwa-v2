// 🎵 AudioService - Handles audio device management and audio processing
// Plain TypeScript class with no Svelte dependencies

import { browser } from '$app/environment';
import { DummyAudioService } from './dummy.service';

export interface AudioLevel {
	level: number;
	timestamp: number;
}

export class AudioService {
	private currentStream: MediaStream | null = null;
	private currentDeviceId: string = 'default';
	private audioContext: AudioContext | null = null;
	private analyser: AnalyserNode | null = null;
	private levelInterval: number | null = null;
	private onLevelUpdateCallback: (level: AudioLevel) => void = () => {};
	private onStreamReadyCallback: (stream: MediaStream) => void = () => {};
	private onStreamErrorCallback: (error: string) => void = () => {};

	async initialize(): Promise<void> {
		if (browser) {
			// Listen for device changes
			navigator.mediaDevices.addEventListener('devicechange', () => {
				this.detectDeviceChange();
			});
		}
	}

	async getStream(deviceId?: string): Promise<MediaStream> {
		try {
			// Clean up existing stream
			this.cleanup();

			const constraints: MediaStreamConstraints = {
				audio: deviceId
					? { deviceId: { exact: deviceId } }
					: {
							echoCancellation: true,
							noiseSuppression: true,
							autoGainControl: true
						}
			};

			this.currentStream = await navigator.mediaDevices.getUserMedia(constraints);
			this.currentDeviceId = deviceId || 'default';

			// Set up audio level monitoring
			this.setupAudioLevelMonitoring(this.currentStream);

			// Call success callback
			this.onStreamReadyCallback(this.currentStream);

			return this.currentStream;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			this.onStreamErrorCallback(errorMessage);
			throw new Error(`Failed to get audio stream: ${errorMessage}`);
		}
	}

	private setupAudioLevelMonitoring(stream: MediaStream): void {
		this.audioContext = new AudioContext();
		this.analyser = this.audioContext.createAnalyser();
		const source = this.audioContext.createMediaStreamSource(stream);
		source.connect(this.analyser);

		// Monitor levels every 100ms
		this.levelInterval = window.setInterval(() => {
			const level = this.getCurrentLevel();
			this.onLevelUpdateCallback({
				level,
				timestamp: Date.now()
			});
		}, 100);
	}

	private getCurrentLevel(): number {
		if (!this.analyser) return 0;

		const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
		this.analyser.getByteFrequencyData(dataArray);

		const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
		return average / 255; // Normalize to 0-1
	}

	private async detectDeviceChange(): Promise<void> {
		const devices = await this.getAvailableDevices();
		const currentExists = devices.some((d) => d.deviceId === this.currentDeviceId);

		if (!currentExists && devices.length > 0) {
			// Current device was removed, switch to default
			const defaultDevice = devices[0];
			console.log('Audio device changed to:', defaultDevice.label);
		}
	}

	// Set callbacks for external use
	onLevelUpdate(callback: (level: AudioLevel) => void): void {
		this.onLevelUpdateCallback = callback;
	}

	onStreamReady(callback: (stream: MediaStream) => void): void {
		this.onStreamReadyCallback = callback;
	}

	onStreamError(callback: (error: string) => void): void {
		this.onStreamErrorCallback = callback;
	}

	cleanup(): void {
		if (this.levelInterval) {
			clearInterval(this.levelInterval);
			this.levelInterval = null;
		}
		if (this.currentStream) {
			this.currentStream.getTracks().forEach((track) => track.stop());
			this.currentStream = null;
		}
		if (this.audioContext) {
			this.audioContext.close();
			this.audioContext = null;
		}
		this.analyser = null;
	}

	async getAvailableDevices(): Promise<MediaDeviceInfo[]> {
		try {
			const devices = await navigator.mediaDevices.enumerateDevices();
			return devices.filter((device) => device.kind === 'audioinput');
		} catch (error) {
			console.error('Failed to get audio devices:', error);
			return [];
		}
	}

	// Get current device ID
	getCurrentDeviceId(): string {
		return this.currentDeviceId;
	}

	// Check if we have an active stream
	hasActiveStream(): boolean {
		return this.currentStream !== null;
	}

	// Get current stream (for external use)
	getCurrentStream(): MediaStream | null {
		return this.currentStream;
	}

	// Get current audio level (for immediate use)
	getCurrentAudioLevel(): number {
		return this.getCurrentLevel();
	}
}


// Export an instance that automatically chooses the right service
export const audioService = browser ? new AudioService() : new DummyAudioService();
