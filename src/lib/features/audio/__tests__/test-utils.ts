// 🧪 Audio Feature Test Utilities
// Mock factories and test helpers for isolated testing

import { vi } from 'vitest';
import type { AudioInputPort, AudioOutputPort, AudioProcessingPort } from '../types';

// 🎤 Mock Audio Input Port
export function createMockAudioInputPort(): AudioInputPort {
	return {
		startRecording: vi.fn().mockResolvedValue(new MediaRecorder()),
		stopRecording: vi.fn().mockResolvedValue(new ArrayBuffer(1024)),
		getDevices: vi.fn().mockResolvedValue([
			{
				deviceId: 'mock-device-1',
				label: 'Mock Microphone 1',
				kind: 'audioinput'
			} as MediaDeviceInfo,
			{
				deviceId: 'mock-device-2',
				label: 'Mock Microphone 2',
				kind: 'audioinput'
			} as MediaDeviceInfo
		])
	};
}

// 🔊 Mock Audio Output Port
export function createMockAudioOutputPort(): AudioOutputPort {
	return {
		play: vi.fn().mockResolvedValue(undefined),
		playFromUrl: vi.fn().mockResolvedValue(undefined),
		stop: vi.fn(),
		setVolume: vi.fn()
	};
}

// 🤖 Mock AI Processing Port
export function createMockAudioProcessingPort(): AudioProcessingPort {
	return {
		transcribe: vi.fn().mockResolvedValue('Mock transcription result'),
		textToSpeech: vi.fn().mockResolvedValue(new ArrayBuffer(2048))
	};
}

// 🎭 Mock MediaRecorder
export function createMockMediaRecorder(): MediaRecorder {
	const mockRecorder = {
		state: 'inactive' as MediaRecorderState,
		mimeType: 'audio/webm;codecs=opus',
		stream: new MediaStream(),
		start: vi.fn(),
		stop: vi.fn(),
		pause: vi.fn(),
		resume: vi.fn(),
		requestData: vi.fn(),
		ondataavailable: null as ((event: MediaRecorderDataAvailableEvent) => void) | null,
		onstop: null as (() => void) | null,
		onerror: null as ((event: MediaRecorderErrorEvent) => void) | null,
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn()
	} as unknown as MediaRecorder;

	// Simulate recording behavior
	mockRecorder.start = vi.fn(() => {
		mockRecorder.state = 'recording';

		// Simulate data available event
		setTimeout(() => {
			if (mockRecorder.ondataavailable) {
				const mockEvent = {
					data: new Blob(['mock audio data'], { type: 'audio/webm' })
				} as MediaRecorderDataAvailableEvent;
				mockRecorder.ondataavailable(mockEvent);
			}
		}, 100);
	});

	mockRecorder.stop = vi.fn(() => {
		mockRecorder.state = 'inactive';

		// Simulate stop event
		setTimeout(() => {
			if (mockRecorder.onstop) {
				mockRecorder.onstop();
			}
		}, 50);
	});

	return mockRecorder;
}

// 🎵 Mock Audio Context
export function createMockAudioContext(): AudioContext {
	const mockContext = {
		sampleRate: 44100,
		currentTime: 0,
		destination: {} as AudioDestinationNode,
		createOscillator: vi.fn(() => ({
			frequency: { setValueAtTime: vi.fn() },
			connect: vi.fn(),
			start: vi.fn(),
			stop: vi.fn()
		})),
		createAnalyser: vi.fn(() => ({
			fftSize: 256,
			frequencyBinCount: 128,
			connect: vi.fn(),
			getByteFrequencyData: vi.fn()
		})),
		createMediaStreamSource: vi.fn(() => ({
			connect: vi.fn()
		})),
		decodeAudioData: vi.fn().mockResolvedValue({
			duration: 1.0,
			sampleRate: 44100,
			numberOfChannels: 2,
			length: 44100
		}),
		createBufferSource: vi.fn(() => ({
			buffer: null,
			connect: vi.fn(),
			start: vi.fn(),
			stop: vi.fn()
		}))
	} as unknown as AudioContext;

	return mockContext;
}

// 🔌 Mock MediaStream
export function createMockMediaStream(): MediaStream {
	const mockStream = {
		id: 'mock-stream-id',
		active: true,
		getTracks: vi.fn(() => [
			{
				kind: 'audio',
				enabled: true,
				stop: vi.fn()
			}
		]),
		getAudioTracks: vi.fn(() => [
			{
				kind: 'audio',
				enabled: true,
				stop: vi.fn()
			}
		])
	} as unknown as MediaStream;

	return mockStream;
}

// 🎯 Mock Audio Service
export function createMockAudioService() {
	return {
		startRecording: vi.fn().mockResolvedValue(undefined),
		stopRecording: vi.fn().mockResolvedValue(undefined),
		playAudio: vi.fn().mockResolvedValue(undefined),
		playFromUrl: vi.fn().mockResolvedValue(undefined),
		stopPlayback: vi.fn().mockResolvedValue(undefined),
		transcribe: vi.fn().mockResolvedValue('Mock transcript'),
		textToSpeech: vi.fn().mockResolvedValue(new ArrayBuffer(1024)),
		setVolume: vi.fn().mockResolvedValue(undefined),
		getState: vi.fn().mockReturnValue({
			status: 'idle',
			currentAudio: null,
			volume: 0.8,
			recordingSession: null,
			error: null
		}),
		getAudioDevices: vi.fn().mockResolvedValue([
			{
				deviceId: 'mock-device-1',
				label: 'Mock Microphone 1',
				kind: 'audioinput'
			} as MediaDeviceInfo
		]),
		isRecording: false,
		isPlaying: false,
		isProcessing: false,
		hasError: false,
		canRecord: true,
		canPlay: true,
		volume: 0.8,
		error: null,
		clearError: vi.fn().mockResolvedValue(undefined),
		dispose: vi.fn()
	};
}

// 🧪 Test Data Generators
export function generateMockAudioBuffer(size: number = 1024): ArrayBuffer {
	const buffer = new ArrayBuffer(size);
	const view = new Uint8Array(buffer);

	// Fill with some mock audio data
	for (let i = 0; i < size; i++) {
		view[i] = Math.floor(Math.random() * 256);
	}

	return buffer;
}

export function generateMockAudioBlob(size: number = 1024): Blob {
	const buffer = generateMockAudioBuffer(size);
	return new Blob([buffer], { type: 'audio/webm' });
}

export function generateMockAudioUrl(): string {
	return 'blob:mock-audio-url-' + Math.random().toString(36).substring(7);
}

// 🎭 Test Event Simulators
export function simulateRecordingStart(recorder: MediaRecorder): void {
	if (recorder.ondataavailable) {
		const mockEvent = {
			data: new Blob(['mock audio chunk'], { type: 'audio/webm' })
		} as MediaRecorderDataAvailableEvent;
		recorder.ondataavailable(mockEvent);
	}
}

export function simulateRecordingStop(recorder: MediaRecorder): void {
	if (recorder.onstop) {
		recorder.onstop();
	}
}

export function simulateRecordingError(
	recorder: MediaRecorder,
	error: string = 'Mock recording error'
): void {
	if (recorder.onerror) {
		const mockEvent = {
			error: new MediaRecorderErrorEvent('error', { error: new Error(error) })
		} as MediaRecorderErrorEvent;
		recorder.onerror(mockEvent);
	}
}

// 🔍 Test Assertions
export function expectAudioState(state: any, expectedStatus: string): void {
	expect(state).toBeDefined();
	expect(state.status).toBe(expectedStatus);
}

export function expectRecordingSession(session: any): void {
	expect(session).toBeDefined();
	expect(session.id).toBeDefined();
	expect(session.startTime).toBeGreaterThan(0);
	expect(Array.isArray(session.chunks)).toBe(true);
}

export function expectNoError(state: any): void {
	expect(state.error).toBeNull();
}

export function expectError(state: any, expectedError?: string): void {
	expect(state.error).toBeDefined();
	if (expectedError) {
		expect(state.error).toBe(expectedError);
	}
}

// 🧹 Test Cleanup
export function cleanupMocks(): void {
	vi.clearAllMocks();
}

export function resetMockTimers(): void {
	vi.useRealTimers();
}

export function setupMockTimers(): void {
	vi.useFakeTimers();
}
