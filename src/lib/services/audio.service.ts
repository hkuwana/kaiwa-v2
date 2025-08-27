// audioService.ts - Pure functional service, backwards compatible
import { browser } from '$app/environment';

export interface AudioLevel {
	level: number;
	timestamp: number;
}

// =====================================
// PURE FUNCTIONAL UTILITIES
// =====================================

const createConstraints = (deviceId?: string): MediaStreamConstraints => {
	const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
		navigator.userAgent
	);

	if (deviceId) {
		return {
			audio: {
				deviceId: { exact: deviceId },
				echoCancellation: { ideal: true },
				noiseSuppression: { ideal: true },
				autoGainControl: { ideal: true },
				sampleRate: { ideal: isMobile ? 22050 : 44100 },
				channelCount: { ideal: 1 }
			}
		};
	}

	return {
		audio: {
			echoCancellation: { ideal: true },
			noiseSuppression: { ideal: true },
			autoGainControl: { ideal: true },
			sampleRate: { ideal: isMobile ? 22050 : 44100, min: 8000, max: 48000 },
			channelCount: { ideal: 1, min: 1, max: 2 }
		}
	};
};

const calculateAudioLevel = (analyser: AnalyserNode): number => {
	if (!analyser) return 0;

	const dataArray = new Uint8Array(analyser.frequencyBinCount);
	analyser.getByteFrequencyData(dataArray);

	let sum = 0;
	for (let i = 0; i < dataArray.length; i++) {
		sum += dataArray[i] * dataArray[i];
	}
	const rms = Math.sqrt(sum / dataArray.length);
	const normalized = rms / 255;
	const amplified = Math.pow(normalized, 0.5);

	return Math.min(amplified, 1.0);
};

const createAudioAnalyser = async (
	stream: MediaStream
): Promise<{
	audioContext: AudioContext;
	analyser: AnalyserNode;
}> => {
	const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
		navigator.userAgent
	);

	const audioContext = new AudioContext({
		sampleRate: isMobile ? 22050 : 44100,
		latencyHint: 'interactive'
	});

	const analyser = audioContext.createAnalyser();
	analyser.fftSize = 256;
	analyser.smoothingTimeConstant = 0.3;
	analyser.minDecibels = -90;
	analyser.maxDecibels = -10;

	const source = audioContext.createMediaStreamSource(stream);
	source.connect(analyser);

	if (audioContext.state === 'suspended') {
		await audioContext.resume();
	}

	return { audioContext, analyser };
};

const getAudioDevices = async (): Promise<MediaDeviceInfo[]> => {
	try {
		const devices = await navigator.mediaDevices.enumerateDevices();
		return devices.filter((device) => device.kind === 'audioinput');
	} catch (error) {
		console.error('Failed to get audio devices:', error);
		return [];
	}
};

// =====================================
// FUNCTIONAL AUDIO SERVICE CORE
// =====================================

interface AudioServiceState {
	stream: MediaStream | null;
	audioContext: AudioContext | null;
	analyser: AnalyserNode | null;
	levelInterval: number | null;
	currentDeviceId: string;
	lastLevel: number;
}

const createAudioServiceCore = () => {
	const state: AudioServiceState = {
		stream: null,
		audioContext: null,
		analyser: null,
		levelInterval: null,
		currentDeviceId: 'default',
		lastLevel: 0
	};

	// Event callbacks (functional approach)
	let onLevelUpdate: (level: AudioLevel) => void = () => {};
	let onStreamReady: (stream: MediaStream) => void = () => {};
	let onStreamError: (error: string) => void = () => {};

	const cleanup = () => {
		if (state.levelInterval) {
			clearInterval(state.levelInterval);
			state.levelInterval = null;
		}
		if (state.stream) {
			state.stream.getTracks().forEach((track) => track.stop());
			state.stream = null;
		}
		if (state.audioContext) {
			state.audioContext.close();
			state.audioContext = null;
		}
		state.analyser = null;
		state.lastLevel = 0;
	};

	const startLevelMonitoring = () => {
		if (!state.analyser) return;

		const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
			navigator.userAgent
		);
		const updateInterval = isMobile ? 100 : 50;

		state.levelInterval = window.setInterval(() => {
			if (state.analyser) {
				const level = calculateAudioLevel(state.analyser);
				if (Math.abs(level - state.lastLevel) > 0.01) {
					state.lastLevel = level;
					onLevelUpdate({ level, timestamp: Date.now() });
				}
			}
		}, updateInterval);
	};

	return {
		// Core operations
		async initialize(): Promise<void> {
			if (!browser) return;

			console.log('🎵 AudioService: Initializing...');
			console.log('📱 Browser capabilities:', {
				mediaDevices: !!navigator.mediaDevices,
				getUserMedia: !!navigator.mediaDevices?.getUserMedia,
				enumerateDevices: !!navigator.mediaDevices?.enumerateDevices,
				userAgent: navigator.userAgent,
				platform: navigator.platform
			});

			const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
				navigator.userAgent
			);
			console.log('📱 Device type:', isMobile ? 'Mobile' : 'Desktop');

			navigator.mediaDevices.addEventListener('devicechange', () => {
				console.log('🎵 AudioService: Device change detected');
			});

			try {
				const devices = await getAudioDevices();
				console.log('🎵 AudioService: Available audio input devices:', devices.length);
				devices.forEach((device, index) => {
					console.log(`  ${index + 1}. ${device.label || 'Unknown device'} (${device.deviceId})`);
				});
			} catch (error) {
				console.warn(
					'⚠️ AudioService: Could not enumerate devices (permissions not granted):',
					error
				);
			}

			console.log('✅ AudioService: Initialization complete');
		},

		async getStream(deviceId?: string): Promise<MediaStream> {
			try {
				cleanup();

				console.log('🎵 AudioService: Starting getStream...');
				console.log('📱 Device info:', {
					userAgent: navigator.userAgent,
					platform: navigator.platform,
					mobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
						navigator.userAgent
					)
				});

				const constraints = createConstraints(deviceId);
				console.log('🎵 AudioService: Using constraints:', JSON.stringify(constraints, null, 2));

				console.log('🎵 AudioService: Calling getUserMedia...');
				state.stream = await navigator.mediaDevices.getUserMedia(constraints);

				console.log('✅ AudioService: Stream obtained successfully!');
				console.log('🎵 Stream details:', {
					id: state.stream.id,
					tracks: state.stream.getTracks().map((track) => ({
						id: track.id,
						kind: track.kind,
						enabled: track.enabled,
						muted: track.muted,
						readyState: track.readyState
					}))
				});

				state.currentDeviceId = deviceId || 'default';

				// Setup audio level monitoring
				try {
					const { audioContext, analyser } = await createAudioAnalyser(state.stream);
					state.audioContext = audioContext;
					state.analyser = analyser;
					startLevelMonitoring();
					console.log('✅ AudioService: Audio level monitoring setup complete');
				} catch (error) {
					console.error('❌ AudioService: Failed to setup audio level monitoring:', error);
				}

				onStreamReady(state.stream);
				return state.stream;
			} catch (error) {
				console.error('❌ AudioService: getStream failed:', error);

				// Try fallback constraints for mobile devices
				if (error instanceof Error && error.message.includes('Invalid constraint')) {
					console.log('🔄 AudioService: Trying fallback constraints for mobile...');
					try {
						const fallbackConstraints = { audio: { echoCancellation: { ideal: false } } };
						console.log(
							'🔄 AudioService: Using fallback constraints:',
							JSON.stringify(fallbackConstraints, null, 2)
						);

						state.stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
						console.log('✅ AudioService: Fallback constraints worked!');

						state.currentDeviceId = deviceId || 'default';

						try {
							const { audioContext, analyser } = await createAudioAnalyser(state.stream);
							state.audioContext = audioContext;
							state.analyser = analyser;
							startLevelMonitoring();
						} catch (analyserError) {
							console.warn('⚠️ AudioService: Fallback audio analyser setup failed:', analyserError);
						}

						onStreamReady(state.stream);
						return state.stream;
					} catch (fallbackError) {
						console.error('❌ AudioService: Fallback constraints also failed:', fallbackError);
					}
				}

				const errorMessage = error instanceof Error ? error.message : 'Unknown error';
				onStreamError(errorMessage);
				throw new Error(`Failed to get audio stream: ${errorMessage}`);
			}
		},

		cleanup,

		// Getters
		getCurrentLevel: () => (state.analyser ? calculateAudioLevel(state.analyser) : 0),
		getCurrentDeviceId: () => state.currentDeviceId,
		hasActiveStream: () => state.stream !== null,
		getCurrentStream: () => state.stream,
		getAvailableDevices: getAudioDevices,

		// Event handlers
		setLevelUpdateCallback: (callback: (level: AudioLevel) => void) => {
			onLevelUpdate = callback;
		},
		setStreamReadyCallback: (callback: (stream: MediaStream) => void) => {
			onStreamReady = callback;
		},
		setStreamErrorCallback: (callback: (error: string) => void) => {
			onStreamError = callback;
		},

		// Testing utilities
		triggerLevelUpdate: () => {
			if (state.analyser) {
				const level = calculateAudioLevel(state.analyser);
				console.log('🔊 Manual audio level trigger:', level.toFixed(4));
				onLevelUpdate({ level, timestamp: Date.now() });
			}
		},

		async testConstraints(): Promise<{
			success: boolean;
			constraints: MediaStreamConstraints;
			error?: string;
		}> {
			const constraintSets = [
				{
					audio: {
						echoCancellation: { ideal: false },
						noiseSuppression: { ideal: false },
						autoGainControl: { ideal: false }
					}
				},
				{
					audio: {
						echoCancellation: { ideal: true },
						noiseSuppression: { ideal: true },
						autoGainControl: { ideal: true }
					}
				},
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
					stream.getTracks().forEach((track) => track.stop());
					return { success: true, constraints };
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					console.log(`❌ AudioService: Constraint set ${i + 1} failed:`, errorMessage);
					if (i === constraintSets.length - 1) {
						return { success: false, constraints, error: errorMessage };
					}
				}
			}

			return {
				success: false,
				constraints: constraintSets[0],
				error: 'All constraint sets failed'
			};
		}
	};
};

// =====================================
// BACKWARDS COMPATIBLE CLASS WRAPPER
// =====================================

export class AudioService {
	private core = createAudioServiceCore();

	// Original API - fully backwards compatible
	async initialize(): Promise<void> {
		return this.core.initialize();
	}

	async getStream(deviceId?: string): Promise<MediaStream> {
		return this.core.getStream(deviceId);
	}

	cleanup(): void {
		this.core.cleanup();
	}

	async getAvailableDevices(): Promise<MediaDeviceInfo[]> {
		return this.core.getAvailableDevices();
	}

	onLevelUpdate(callback: (level: AudioLevel) => void): void {
		this.core.setLevelUpdateCallback(callback);
	}

	onStreamReady(callback: (stream: MediaStream) => void): void {
		this.core.setStreamReadyCallback(callback);
	}

	onStreamError(callback: (error: string) => void): void {
		this.core.setStreamErrorCallback(callback);
	}

	getCurrentDeviceId(): string {
		return this.core.getCurrentDeviceId();
	}

	hasActiveStream(): boolean {
		return this.core.hasActiveStream();
	}

	getCurrentStream(): MediaStream | null {
		return this.core.getCurrentStream();
	}

	getCurrentAudioLevel(): number {
		return this.core.getCurrentLevel();
	}

	triggerLevelUpdate(): void {
		this.core.triggerLevelUpdate();
	}

	async testConstraints() {
		return this.core.testConstraints();
	}

	// =====================================
	// NEW FUNCTIONAL API METHODS
	// =====================================

	// Get the functional core for advanced usage
	getCore() {
		return this.core;
	}

	// Promise-based level monitoring
	async getLevelStream(): Promise<ReadableStream<AudioLevel>> {
		return new ReadableStream({
			start: (controller) => {
				this.onLevelUpdate((level) => {
					controller.enqueue(level);
				});
			}
		});
	}

	// Async iterator for levels
	async *levelIterator(): AsyncIterableIterator<AudioLevel> {
		let resolve: (value: AudioLevel) => void;
		let promise = new Promise<AudioLevel>((r) => (resolve = r));

		this.onLevelUpdate((level) => {
			resolve(level);
			promise = new Promise<AudioLevel>((r) => (resolve = r));
		});

		while (this.hasActiveStream()) {
			yield await promise;
		}
	}

	// Functional composition helpers
	pipe<T>(fn: (service: AudioService) => T): T {
		return fn(this);
	}

	// Create a new service instance with different configuration
	static create(): AudioService {
		return new AudioService();
	}
}

// Dummy service for SSR
class DummyAudioService {
	async initialize() {}
	async getStream(): Promise<MediaStream> {
		throw new Error('Audio not available in SSR');
	}
	cleanup() {}
	async getAvailableDevices() {
		return [];
	}
	onLevelUpdate() {}
	onStreamReady() {}
	onStreamError() {}
	getCurrentDeviceId() {
		return 'default';
	}
	hasActiveStream() {
		return false;
	}
	getCurrentStream() {
		return null;
	}
	getCurrentAudioLevel() {
		return 0;
	}
	triggerLevelUpdate() {}
	async testConstraints() {
		return { success: false, constraints: { audio: true } };
	}
	getCore() {
		return null;
	}
	async getLevelStream(): Promise<ReadableStream<AudioLevel>> {
		return new ReadableStream({ start: () => {} });
	}
	async *levelIterator() {}
	pipe<T>(fn: (service: unknown) => T): T {
		return fn(this);
	}
	static create() {
		return new DummyAudioService();
	}
}

// =====================================
// EXPORTS
// =====================================

// Original singleton export (fully backwards compatible)
export const audioService = browser ? new AudioService() : new DummyAudioService();

// Factory function for multiple instances
export const createAudioService = () => (browser ? new AudioService() : new DummyAudioService());

// Export utilities for advanced usage
export { createConstraints, calculateAudioLevel, getAudioDevices };
