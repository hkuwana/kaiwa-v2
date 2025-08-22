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
	private lastLevel: number = 0; // Added for level monitoring

	async initialize(): Promise<void> {
		if (browser) {
			console.log('🎵 AudioService: Initializing...');
			console.log('📱 Browser capabilities:', {
				mediaDevices: !!navigator.mediaDevices,
				getUserMedia: !!navigator.mediaDevices?.getUserMedia,
				enumerateDevices: !!navigator.mediaDevices?.enumerateDevices,
				userAgent: navigator.userAgent,
				platform: navigator.platform
			});

			// Check if we're on a mobile device
			const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
				navigator.userAgent
			);
			console.log('📱 Device type:', isMobile ? 'Mobile' : 'Desktop');

			// Listen for device changes
			navigator.mediaDevices.addEventListener('devicechange', () => {
				console.log('🎵 AudioService: Device change detected');
				this.detectDeviceChange();
			});

			// Try to enumerate devices to check permissions
			try {
				const devices = await navigator.mediaDevices.enumerateDevices();
				const audioInputs = devices.filter((device) => device.kind === 'audioinput');
				console.log('🎵 AudioService: Available audio input devices:', audioInputs.length);
				audioInputs.forEach((device, index) => {
					console.log(`  ${index + 1}. ${device.label || 'Unknown device'} (${device.deviceId})`);
				});
			} catch (error) {
				console.warn(
					'⚠️ AudioService: Could not enumerate devices (permissions not granted):',
					error
				);
			}

			console.log('✅ AudioService: Initialization complete');
		}
	}

	async getStream(deviceId?: string): Promise<MediaStream> {
		try {
			// Clean up existing stream
			this.cleanup();

			// Enhanced logging for debugging
			console.log('🎵 AudioService: Starting getStream...');
			console.log('📱 Device info:', {
				userAgent: navigator.userAgent,
				platform: navigator.platform,
				mobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
					navigator.userAgent
				)
			});

			// Mobile-friendly constraints
			let constraints: MediaStreamConstraints;

			if (deviceId) {
				// Specific device selected
				constraints = {
					audio: {
						deviceId: { exact: deviceId },
						// Mobile-friendly audio settings
						echoCancellation: { ideal: true },
						noiseSuppression: { ideal: true },
						autoGainControl: { ideal: true },
						sampleRate: { ideal: 44100 },
						channelCount: { ideal: 1 }
					}
				};
			} else {
				// Default constraints - mobile-friendly
				constraints = {
					audio: {
						// Use ideal values instead of exact for better mobile compatibility
						echoCancellation: { ideal: true },
						noiseSuppression: { ideal: true },
						autoGainControl: { ideal: true },
						// Mobile-friendly sample rate and channel count
						sampleRate: { ideal: 44100, min: 8000, max: 48000 },
						channelCount: { ideal: 1, min: 1, max: 2 }
					}
				};
			}

			console.log('🎵 AudioService: Using constraints:', JSON.stringify(constraints, null, 2));

			// Try to get the stream
			console.log('🎵 AudioService: Calling getUserMedia...');
			this.currentStream = await navigator.mediaDevices.getUserMedia(constraints);
			console.log('✅ AudioService: Stream obtained successfully!');
			console.log('🎵 Stream details:', {
				id: this.currentStream.id,
				tracks: this.currentStream.getTracks().map((track) => ({
					id: track.id,
					kind: track.kind,
					enabled: track.enabled,
					muted: track.muted,
					readyState: track.readyState
				}))
			});

			this.currentDeviceId = deviceId || 'default';

			// Set up audio level monitoring
			await this.setupAudioLevelMonitoring(this.currentStream);

			// Call success callback
			this.onStreamReadyCallback(this.currentStream);

			return this.currentStream;
		} catch (error) {
			console.error('❌ AudioService: getStream failed:', error);
			console.error('❌ Error details:', {
				name: error instanceof Error ? error.name : 'Unknown',
				message: error instanceof Error ? error.message : 'Unknown error',
				stack: error instanceof Error ? error.stack : 'No stack trace'
			});

			// Try fallback constraints for mobile devices
			if (error instanceof Error && error.message.includes('Invalid constraint')) {
				console.log('🔄 AudioService: Trying fallback constraints for mobile...');
				try {
					const fallbackConstraints: MediaStreamConstraints = {
						audio: {
							// Minimal constraints that should work on most devices
							echoCancellation: { ideal: false },
							noiseSuppression: { ideal: false },
							autoGainControl: { ideal: false }
						}
					};

					console.log(
						'🔄 AudioService: Using fallback constraints:',
						JSON.stringify(fallbackConstraints, null, 2)
					);
					this.currentStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
					console.log('✅ AudioService: Fallback constraints worked!');

					this.currentDeviceId = deviceId || 'default';
					await this.setupAudioLevelMonitoring(this.currentStream);
					this.onStreamReadyCallback(this.currentStream);
					return this.currentStream;
				} catch (fallbackError) {
					console.error('❌ AudioService: Fallback constraints also failed:', fallbackError);
				}
			}

			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			this.onStreamErrorCallback(errorMessage);
			throw new Error(`Failed to get audio stream: ${errorMessage}`);
		}
	}

	private async setupAudioLevelMonitoring(stream: MediaStream): Promise<void> {
		// Clean up any existing monitoring
		if (this.levelInterval) {
			clearInterval(this.levelInterval);
			this.levelInterval = null;
		}
		if (this.audioContext) {
			this.audioContext.close();
		}

		try {
			// Mobile-friendly AudioContext configuration
			const audioContextOptions: AudioContextOptions = {
				// Use lower sample rate on mobile for better performance
				sampleRate: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
					navigator.userAgent
				)
					? 22050
					: 44100,
				latencyHint: 'interactive'
			};

			console.log('🎵 AudioService: Creating AudioContext with options:', audioContextOptions);
			this.audioContext = new AudioContext(audioContextOptions);
			this.analyser = this.audioContext.createAnalyser();

			// Mobile-friendly analyser configuration
			this.analyser.fftSize = 256; // Keep this for mobile compatibility
			this.analyser.smoothingTimeConstant = 0.3;
			this.analyser.minDecibels = -90;
			this.analyser.maxDecibels = -10;

			const source = this.audioContext.createMediaStreamSource(stream);
			source.connect(this.analyser);

			// Mobile-friendly AudioContext handling
			if (this.audioContext.state === 'suspended') {
				console.log('🎵 AudioService: AudioContext suspended, attempting to resume...');
				try {
					await this.audioContext.resume();
					console.log('✅ AudioService: AudioContext resumed successfully');
				} catch (resumeError) {
					console.warn('⚠️ AudioService: Failed to resume AudioContext:', resumeError);
				}
			}

			// Mobile-friendly level monitoring (less frequent to save battery)
			const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
				navigator.userAgent
			);
			const updateInterval = isMobile ? 100 : 50; // 100ms on mobile, 50ms on desktop

			console.log(
				`🎵 AudioService: Setting up level monitoring with ${updateInterval}ms interval (mobile: ${isMobile})`
			);

			this.levelInterval = window.setInterval(() => {
				const level = this.getCurrentLevel();
				// Only update if there's a significant change to avoid unnecessary re-renders
				if (Math.abs(level - this.lastLevel) > 0.01) {
					this.lastLevel = level;
					this.onLevelUpdateCallback({
						level,
						timestamp: Date.now()
					});
				}
			}, updateInterval);

			console.log('✅ AudioService: Audio level monitoring setup complete');
		} catch (error) {
			console.error('❌ AudioService: Failed to setup audio level monitoring:', error);
			// Don't throw - audio can still work without level monitoring
		}
	}

	private getCurrentLevel(): number {
		if (!this.analyser) return 0;

		const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
		this.analyser.getByteFrequencyData(dataArray);

		// Use RMS (Root Mean Square) for better level representation
		let sum = 0;
		for (let i = 0; i < dataArray.length; i++) {
			sum += dataArray[i] * dataArray[i];
		}
		const rms = Math.sqrt(sum / dataArray.length);

		// Apply some amplification and smoothing for better visual feedback
		const normalized = rms / 255;
		const amplified = Math.pow(normalized, 0.5); // Square root for better sensitivity

		return Math.min(amplified, 1.0);
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
		this.lastLevel = 0; // Reset last level on cleanup
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

	// Manually trigger audio level update for testing
	triggerLevelUpdate(): void {
		if (this.analyser && this.onLevelUpdateCallback) {
			const level = this.getCurrentLevel();
			console.log('🔊 Manual audio level trigger:', level.toFixed(4));
			this.onLevelUpdateCallback({
				level,
				timestamp: Date.now()
			});
		}
	}

	// Test different constraint combinations for mobile compatibility
	async testConstraints(): Promise<{
		success: boolean;
		constraints: MediaStreamConstraints;
		error?: string;
	}> {
		const constraintSets = [
			// Set 1: Minimal constraints
			{
				audio: {
					echoCancellation: { ideal: false },
					noiseSuppression: { ideal: false },
					autoGainControl: { ideal: false }
				}
			},
			// Set 2: Basic constraints
			{
				audio: {
					echoCancellation: { ideal: true },
					noiseSuppression: { ideal: true },
					autoGainControl: { ideal: true }
				}
			},
			// Set 3: Mobile-optimized constraints
			{
				audio: {
					echoCancellation: { ideal: true },
					noiseSuppression: { ideal: true },
					autoGainControl: { ideal: true },
					sampleRate: { ideal: 22050, min: 8000, max: 48000 },
					channelCount: { ideal: 1, min: 1, max: 2 }
				}
			}
		];

		console.log('🧪 AudioService: Testing constraint combinations for mobile compatibility...');

		for (let i = 0; i < constraintSets.length; i++) {
			const constraints = constraintSets[i];
			console.log(
				`🧪 AudioService: Testing constraint set ${i + 1}:`,
				JSON.stringify(constraints, null, 2)
			);

			try {
				const stream = await navigator.mediaDevices.getUserMedia(constraints);
				console.log(`✅ AudioService: Constraint set ${i + 1} succeeded!`);
				stream.getTracks().forEach((track) => track.stop()); // Clean up test stream

				return { success: true, constraints };
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Unknown error';
				console.log(`❌ AudioService: Constraint set ${i + 1} failed:`, errorMessage);

				// If this is the last set and it failed, return the error
				if (i === constraintSets.length - 1) {
					return {
						success: false,
						constraints,
						error: errorMessage
					};
				}
			}
		}

		return { success: false, constraints: constraintSets[0], error: 'All constraint sets failed' };
	}
}

// Export an instance that automatically chooses the right service
export const audioService = browser ? new AudioService() : new DummyAudioService();
