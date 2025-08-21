import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AudioService } from './audio.service';

// Mock the global navigator object for the test environment
const mockGetUserMedia = vi.fn();
const mockEnumerateDevices = vi.fn();
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();

// Mock MediaStream and related APIs
const mockMediaStream = {
	id: 'mock-stream-id',
	getTracks: () => [],
	active: true
};

const mockAudioContext = {
	createAnalyser: vi.fn(() => ({
		frequencyBinCount: 256,
		getByteFrequencyData: vi.fn()
	})),
	createMediaStreamSource: vi.fn(() => ({
		connect: vi.fn()
	})),
	close: vi.fn()
};

const mockAnalyser = {
	frequencyBinCount: 256,
	getByteFrequencyData: vi.fn()
};

const mockDevices = [
	{ deviceId: 'device1', label: 'Microphone 1', kind: 'audioinput' },
	{ deviceId: 'device2', label: 'Microphone 2', kind: 'audioinput' }
];

// Mock window.setInterval and clearInterval
const mockSetInterval = vi.fn(() => 123);
const mockClearInterval = vi.fn();

// Mock crypto.randomUUID
const mockRandomUUID = vi.fn(() => 'mock-uuid');

describe('AudioService', () => {
	let audioService: AudioService;

	beforeEach(() => {
		// Reset all mocks
		vi.clearAllMocks();

		// Mock global objects
		global.navigator = {
			mediaDevices: {
				getUserMedia: mockGetUserMedia,
				enumerateDevices: mockEnumerateDevices,
				addEventListener: mockAddEventListener,
				removeEventListener: mockRemoveEventListener
			}
		} as any;

		global.window = {
			setInterval: mockSetInterval,
			clearInterval: mockClearInterval
		} as any;

		global.AudioContext = vi.fn(() => mockAudioContext) as any;
		global.crypto = { randomUUID: mockRandomUUID } as any;

		// Mock the analyser creation
		mockAudioContext.createAnalyser.mockReturnValue(mockAnalyser);

		audioService = new AudioService();
	});

	afterEach(() => {
		// Clean up any intervals
		audioService.cleanup();
	});

	describe('getStream', () => {
		it('should request and return a media stream with default constraints', async () => {
			mockGetUserMedia.mockResolvedValue(mockMediaStream);

			const stream = await audioService.getStream();

			expect(mockGetUserMedia).toHaveBeenCalledWith({
				audio: {
					echoCancellation: true,
					noiseSuppression: true,
					autoGainControl: true
				}
			});
			expect(stream).toEqual(mockMediaStream);
		});

		it('should request stream with specific device ID', async () => {
			mockGetUserMedia.mockResolvedValue(mockMediaStream);

			await audioService.getStream('device1');

			expect(mockGetUserMedia).toHaveBeenCalledWith({
				audio: { deviceId: { exact: 'device1' } }
			});
		});

		it('should handle getUserMedia errors gracefully', async () => {
			const errorMessage = 'Permission denied';
			mockGetUserMedia.mockRejectedValue(new Error(errorMessage));

			await expect(audioService.getStream()).rejects.toThrow(
				'Failed to get audio stream: Permission denied'
			);
		});

		it('should call onStreamReady callback when stream is obtained', async () => {
			mockGetUserMedia.mockResolvedValue(mockMediaStream);
			const mockCallback = vi.fn();
			audioService.onStreamReady(mockCallback);

			await audioService.getStream();

			expect(mockCallback).toHaveBeenCalledWith(mockMediaStream);
		});

		it('should call onStreamError callback when stream fails', async () => {
			const errorMessage = 'Permission denied';
			mockGetUserMedia.mockRejectedValue(new Error(errorMessage));
			const mockCallback = vi.fn();
			audioService.onStreamError(mockCallback);

			await expect(audioService.getStream()).rejects.toThrow();

			expect(mockCallback).toHaveBeenCalledWith('Permission denied');
		});
	});

	describe('getAvailableDevices', () => {
		it('should return available audio input devices', async () => {
			mockEnumerateDevices.mockResolvedValue(mockDevices);

			const devices = await audioService.getAvailableDevices();

			expect(mockEnumerateDevices).toHaveBeenCalled();
			expect(devices).toEqual(mockDevices.filter((d) => d.kind === 'audioinput'));
		});

		it('should handle enumerateDevices errors', async () => {
			mockEnumerateDevices.mockRejectedValue(new Error('Failed to enumerate devices'));

			await expect(audioService.getAvailableDevices()).rejects.toThrow(
				'Failed to enumerate devices'
			);
		});
	});

	describe('audio level monitoring', () => {
		it('should set up audio level monitoring when stream is obtained', async () => {
			mockGetUserMedia.mockResolvedValue(mockMediaStream);
			const mockCallback = vi.fn();
			audioService.onLevelUpdate(mockCallback);

			await audioService.getStream();

			expect(mockSetInterval).toHaveBeenCalled();
			expect(mockAudioContext.createAnalyser).toHaveBeenCalled();
			expect(mockAudioContext.createMediaStreamSource).toHaveBeenCalledWith(mockMediaStream);
		});

		it('should call onLevelUpdate callback with audio level data', async () => {
			mockGetUserMedia.mockResolvedValue(mockMediaStream);
			const mockCallback = vi.fn();
			audioService.onLevelUpdate(mockCallback);

			await audioService.getStream();

			// Simulate the interval callback
			const intervalCallback = mockSetInterval.mock.calls[0][0];
			intervalCallback();

			expect(mockCallback).toHaveBeenCalledWith({
				level: expect.any(Number),
				timestamp: expect.any(Number)
			});
		});
	});

	describe('cleanup', () => {
		it('should stop all tracks and clear intervals', async () => {
			const mockTrack = { stop: vi.fn() };
			const mockStream = {
				...mockMediaStream,
				getTracks: () => [mockTrack]
			};
			mockGetUserMedia.mockResolvedValue(mockStream);

			await audioService.getStream();
			audioService.cleanup();

			expect(mockTrack.stop).toHaveBeenCalled();
			expect(mockClearInterval).toHaveBeenCalled();
		});
	});

	describe('device change detection', () => {
		it('should listen for device changes on initialization', async () => {
			await audioService.initialize();

			expect(mockAddEventListener).toHaveBeenCalledWith('devicechange', expect.any(Function));
		});

		it('should handle device changes gracefully', async () => {
			mockEnumerateDevices.mockResolvedValue(mockDevices);
			await audioService.initialize();

			// Simulate device change
			const deviceChangeHandler = mockAddEventListener.mock.calls[0][1];
			await deviceChangeHandler();

			expect(mockEnumerateDevices).toHaveBeenCalled();
		});
	});

	describe('callback management', () => {
		it('should set and call onStreamReady callback', () => {
			const mockCallback = vi.fn();
			audioService.onStreamReady(mockCallback);

			// Simulate stream ready
			const streamReadyCallback = audioService['onStreamReadyCallback'];
			streamReadyCallback(mockMediaStream);

			expect(mockCallback).toHaveBeenCalledWith(mockMediaStream);
		});

		it('should set and call onStreamError callback', () => {
			const mockCallback = vi.fn();
			audioService.onStreamError(mockCallback);

			// Simulate stream error
			const streamErrorCallback = audioService['onStreamErrorCallback'];
			streamErrorCallback('Test error');

			expect(mockCallback).toHaveBeenCalledWith('Test error');
		});

		it('should set and call onLevelUpdate callback', () => {
			const mockCallback = vi.fn();
			audioService.onLevelUpdate(mockCallback);

			// Simulate level update
			const levelUpdateCallback = audioService['onLevelUpdateCallback'];
			levelUpdateCallback({ level: 0.5, timestamp: Date.now() });

			expect(mockCallback).toHaveBeenCalledWith({ level: 0.5, timestamp: expect.any(Number) });
		});
	});
});
