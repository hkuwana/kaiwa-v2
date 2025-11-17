// audioService.ts - Pure functional service, backwards compatible
import { browser } from '$app/environment';

export interface AudioLevel {
	level: number;
	timestamp: number;
}

// =====================================
// PERMISSION HANDLING UTILITIES
// =====================================

export interface PermissionState {
	state: 'granted' | 'denied' | 'prompt' | 'unknown';
	canRetry: boolean;
	userFriendlyMessage: string;
}

const checkAudioPermission = async (): Promise<PermissionState> => {
	try {
		if (!navigator.permissions) {
			return {
				state: 'unknown',
				canRetry: true,
				userFriendlyMessage: 'Permission status unknown - will try to request access'
			};
		}

		const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });

		switch (permission.state) {
			case 'granted':
				return {
					state: 'granted',
					canRetry: false,
					userFriendlyMessage: 'Microphone access granted'
				};
			case 'denied':
				return {
					state: 'denied',
					canRetry: false,
					userFriendlyMessage:
						"Microphone access denied. Please click the microphone icon in your browser's address bar to allow access."
				};
			case 'prompt':
				return {
					state: 'prompt',
					canRetry: true,
					userFriendlyMessage: 'Will request microphone access'
				};
			default:
				return {
					state: 'unknown',
					canRetry: true,
					userFriendlyMessage: 'Permission status unknown - will try to request access'
				};
		}
	} catch (error) {
		console.warn('🔒 Permission check failed:', error);
		return {
			state: 'unknown',
			canRetry: true,
			userFriendlyMessage: 'Could not check permission status - will try to request access'
		};
	}
};

const createUserFriendlyError = (
	error: Error
): {
	type: 'permission' | 'device' | 'constraint' | 'security' | 'unknown';
	title: string;
	message: string;
	canRetry: boolean;
	suggestions: string[];
} => {
	const errorName = error.name;
	const errorMessage = error.message.toLowerCase();

	// Permission denied errors
	if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
		return {
			type: 'permission',
			title: 'Microphone Access Denied',
			message: 'We need access to your microphone for voice conversations.',
			canRetry: true,
			suggestions: [
				"Click the microphone icon in your browser's address bar",
				'Select "Allow" when prompted for microphone access',
				"Check your browser settings if the icon isn't visible",
				"Make sure your microphone isn't being used by another app"
			]
		};
	}

	// Device not found errors
	if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
		return {
			type: 'device',
			title: 'No Microphone Found',
			message: "We couldn't find a microphone on your device.",
			canRetry: true,
			suggestions: [
				'Check that your microphone is properly connected',
				'Try refreshing the page',
				"Check your device's audio settings",
				"Make sure other apps aren't using your microphone"
			]
		};
	}

	// Device in use errors
	if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
		return {
			type: 'device',
			title: 'Microphone Unavailable',
			message: 'Your microphone appears to be in use by another application.',
			canRetry: true,
			suggestions: [
				'Close other apps that might be using your microphone',
				'Try refreshing the page',
				'Restart your browser',
				'Check for other browser tabs using your microphone'
			]
		};
	}

	// Constraint errors
	if (errorName === 'OverconstrainedError' || errorName === 'ConstraintNotSatisfiedError') {
		return {
			type: 'constraint',
			title: 'Audio Configuration Issue',
			message: "Your microphone doesn't support the required audio settings.",
			canRetry: true,
			suggestions: [
				"We'll try with simplified audio settings",
				'Check if your microphone drivers are up to date',
				'Try a different microphone if available'
			]
		};
	}

	// Security context errors
	if (errorMessage.includes('secure') || errorMessage.includes('https')) {
		return {
			type: 'security',
			title: 'Secure Connection Required',
			message: 'Microphone access requires a secure connection (HTTPS).',
			canRetry: false,
			suggestions: ["Make sure you're using HTTPS", 'Contact support if this problem persists']
		};
	}

	// Generic error
	return {
		type: 'unknown',
		title: 'Audio Setup Failed',
		message: 'An unexpected error occurred while setting up audio.',
		canRetry: true,
		suggestions: [
			'Try refreshing the page',
			'Check your browser settings',
			'Make sure your microphone is working',
			'Contact support if this problem persists'
		]
	};
};

// =====================================
// PURE FUNCTIONAL UTILITIES
// =====================================

const createConstraints = (deviceId?: string): MediaStreamConstraints => {
	const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
		navigator.userAgent
	);
	const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);

	// For Safari, avoid deviceId constraints as they can cause OverconstrainedError
	if (deviceId && deviceId !== 'default' && !isSafari) {
		return {
			audio: {
				deviceId: { ideal: deviceId },
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
	permissionState: PermissionState | null;
	lastError: ReturnType<typeof createUserFriendlyError> | null;
}

const createAudioServiceCore = () => {
	const state: AudioServiceState = {
		stream: null,
		audioContext: null,
		analyser: null,
		levelInterval: null,
		currentDeviceId: 'default',
		lastLevel: 0,
		permissionState: null,
		lastError: null
	};

	// Event callbacks (functional approach)
	let onLevelUpdate: (level: AudioLevel) => void = () => {};
	let onStreamReady: (stream: MediaStream) => void = () => {};
	let onStreamError: (error: string) => void = () => {};
	let onPermissionUpdate: (permission: PermissionState) => void = () => {};
	let onUserFriendlyError: (error: ReturnType<typeof createUserFriendlyError>) => void = () => {};

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
				console.log('🎵 AudioService: DeviceId requested:', deviceId);
				console.log('🎵 AudioService: User agent:', navigator.userAgent);

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

				// Update permission state after successful stream
				state.permissionState = {
					state: 'granted',
					canRetry: false,
					userFriendlyMessage: 'Microphone access granted'
				};
				onPermissionUpdate(state.permissionState);

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

				// Create user-friendly error information
				const userFriendlyError = createUserFriendlyError(error as Error);
				state.lastError = userFriendlyError;
				console.log('🚨 User-friendly error:', userFriendlyError);
				onUserFriendlyError(userFriendlyError);

				// Try progressive fallbacks for constraint errors
				if (
					userFriendlyError.type === 'constraint' ||
					(error instanceof Error && error.message.includes('Invalid constraint'))
				) {
					console.log('🔄 AudioService: Trying progressive fallback constraints...');

					const fallbackStrategies = [
						// Strategy 1: Simplified constraints with echo cancellation off
						{ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } },
						// Strategy 2: Just basic audio
						{ audio: true },
						// Strategy 3: Mobile-optimized
						{ audio: { channelCount: 1, sampleRate: 16000 } }
					];

					for (let i = 0; i < fallbackStrategies.length; i++) {
						try {
							const fallbackConstraints = fallbackStrategies[i];
							console.log(
								`🔄 AudioService: Trying fallback strategy ${i + 1}:`,
								JSON.stringify(fallbackConstraints, null, 2)
							);

							state.stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
							console.log(`✅ AudioService: Fallback strategy ${i + 1} worked!`);

							state.currentDeviceId = deviceId || 'default';
							state.lastError = null; // Clear error on success

							try {
								const { audioContext, analyser } = await createAudioAnalyser(state.stream);
								state.audioContext = audioContext;
								state.analyser = analyser;
								startLevelMonitoring();
							} catch (analyserError) {
								console.warn(
									'⚠️ AudioService: Fallback audio analyser setup failed:',
									analyserError
								);
							}

							onStreamReady(state.stream);
							return state.stream;
						} catch (fallbackError) {
							console.log(`❌ AudioService: Fallback strategy ${i + 1} failed:`, fallbackError);
							continue;
						}
					}
				}

				// If all fallbacks failed, provide clear error guidance
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
		getPermissionState: () => state.permissionState,
		getLastError: () => state.lastError,

		// Permission utilities
		async checkPermissions(): Promise<PermissionState> {
			state.permissionState = await checkAudioPermission();
			onPermissionUpdate(state.permissionState);
			return state.permissionState;
		},

		async requestPermissionGracefully(): Promise<{
			success: boolean;
			stream?: MediaStream;
			error?: ReturnType<typeof createUserFriendlyError>;
		}> {
			const _core = this;
			try {
				const stream = await this.getStream();
				return { success: true, stream };
			} catch (error) {
				return {
					success: false,
					error: state.lastError || createUserFriendlyError(error as Error)
				};
			}
		},

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
		setPermissionUpdateCallback: (callback: (permission: PermissionState) => void) => {
			onPermissionUpdate = callback;
		},
		setUserFriendlyErrorCallback: (
			callback: (error: ReturnType<typeof createUserFriendlyError>) => void
		) => {
			onUserFriendlyError = callback;
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

	onPermissionUpdate(callback: (permission: PermissionState) => void): void {
		this.core.setPermissionUpdateCallback(callback);
	}

	onUserFriendlyError(callback: (error: ReturnType<typeof createUserFriendlyError>) => void): void {
		this.core.setUserFriendlyErrorCallback(callback);
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

	// New permission-related methods
	getPermissionState(): PermissionState | null {
		return this.core.getPermissionState();
	}

	getLastError(): ReturnType<typeof createUserFriendlyError> | null {
		return this.core.getLastError();
	}

	async checkPermissions(): Promise<PermissionState> {
		return this.core.checkPermissions();
	}

	async requestPermissionGracefully(): Promise<{
		success: boolean;
		stream?: MediaStream;
		error?: ReturnType<typeof createUserFriendlyError>;
	}> {
		return this.core.requestPermissionGracefully();
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
	onPermissionUpdate() {}
	onUserFriendlyError() {}
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
	getPermissionState(): PermissionState | null {
		return null;
	}
	getLastError(): ReturnType<typeof createUserFriendlyError> | null {
		return null;
	}
	async checkPermissions(): Promise<PermissionState> {
		return { state: 'unknown', canRetry: false, userFriendlyMessage: 'Not available in SSR' };
	}
	async requestPermissionGracefully(): Promise<{
		success: boolean;
		stream?: MediaStream;
		error?: ReturnType<typeof createUserFriendlyError>;
	}> {
		return { success: false };
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
export {
	createConstraints,
	calculateAudioLevel,
	getAudioDevices,
	checkAudioPermission,
	createUserFriendlyError
};
