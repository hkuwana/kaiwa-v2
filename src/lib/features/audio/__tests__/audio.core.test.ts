// 🧪 Audio Core Unit Tests
// Test the pure functional core in isolation

import { describe, it, expect, beforeEach } from 'vitest';
import { audioCore } from '../core';
import type { AudioState, AudioAction } from '../types';

describe('Audio Core', () => {
	let initialState: AudioState;

	beforeEach(() => {
		initialState = audioCore.initial();
	});

	describe('initial state', () => {
		it('should create initial state with correct defaults', () => {
			expect(initialState.status).toBe('idle');
			expect(initialState.currentAudio).toBeNull();
			expect(initialState.volume).toBe(0.8);
			expect(initialState.recordingSession).toBeNull();
			expect(initialState.error).toBeNull();
		});
	});

	describe('state transitions', () => {
		it('should transition from idle to recording', () => {
			const action: AudioAction = { type: 'START_RECORDING' };
			const newState = audioCore.transition(initialState, action);

			expect(newState.status).toBe('recording');
			expect(newState.recordingSession).toBeDefined();
			expect(newState.recordingSession?.id).toBeDefined();
			expect(newState.recordingSession?.startTime).toBeGreaterThan(0);
			expect(newState.error).toBeNull();
		});

		it('should transition from recording to processing', () => {
			const recordingState = audioCore.transition(initialState, { type: 'START_RECORDING' });
			const action: AudioAction = { type: 'STOP_RECORDING' };
			const newState = audioCore.transition(recordingState, action);

			expect(newState.status).toBe('processing');
			expect(newState.recordingSession?.endTime).toBeDefined();
		});

		it('should transition from processing to idle after recording complete', () => {
			const recordingState = audioCore.transition(initialState, { type: 'START_RECORDING' });
			const processingState = audioCore.transition(recordingState, { type: 'STOP_RECORDING' });
			const action: AudioAction = { type: 'RECORDING_COMPLETE' };
			const newState = audioCore.transition(processingState, action);

			expect(newState.status).toBe('idle');
			expect(newState.recordingSession).toBeNull();
		});

		it('should transition to playing state', () => {
			const action: AudioAction = { type: 'START_PLAYBACK', audioId: 'test-audio.mp3' };
			const newState = audioCore.transition(initialState, action);

			expect(newState.status).toBe('playing');
			expect(newState.currentAudio).toBe('test-audio.mp3');
			expect(newState.error).toBeNull();
		});

		it('should transition from playing to idle', () => {
			const playingState = audioCore.transition(initialState, {
				type: 'START_PLAYBACK',
				audioId: 'test-audio.mp3'
			});
			const action: AudioAction = { type: 'STOP_PLAYBACK' };
			const newState = audioCore.transition(playingState, action);

			expect(newState.status).toBe('idle');
			expect(newState.currentAudio).toBeNull();
		});

		it('should update volume correctly', () => {
			const action: AudioAction = { type: 'SET_VOLUME', volume: 0.5 };
			const newState = audioCore.transition(initialState, action);

			expect(newState.volume).toBe(0.5);
		});

		it('should clamp volume to valid range', () => {
			const tooHighAction: AudioAction = { type: 'SET_VOLUME', volume: 1.5 };
			const tooHighState = audioCore.transition(initialState, tooHighAction);
			expect(tooHighState.volume).toBe(1.0);

			const tooLowAction: AudioAction = { type: 'SET_VOLUME', volume: -0.5 };
			const tooLowState = audioCore.transition(initialState, tooLowAction);
			expect(tooLowState.volume).toBe(0.0);
		});

		it('should handle audio errors', () => {
			const action: AudioAction = { type: 'AUDIO_ERROR', error: 'Failed to play audio' };
			const newState = audioCore.transition(initialState, action);

			expect(newState.status).toBe('error');
			expect(newState.error).toBe('Failed to play audio');
			expect(newState.currentAudio).toBeNull();
		});

		it('should clear errors', () => {
			const errorState = audioCore.transition(initialState, {
				type: 'AUDIO_ERROR',
				error: 'Test error'
			});
			const action: AudioAction = { type: 'CLEAR_ERROR' };
			const newState = audioCore.transition(errorState, action);

			expect(newState.error).toBeNull();
			expect(newState.status).toBe('idle');
		});
	});

	describe('effects generation', () => {
		it('should generate recording effects', () => {
			const action: AudioAction = { type: 'START_RECORDING' };
			const effects = audioCore.effects(initialState, action);

			expect(effects).toContainEqual({
				type: 'INITIALIZE_RECORDING',
				deviceId: undefined
			});
		});

		it('should generate processing effects', () => {
			const recordingState = audioCore.transition(initialState, { type: 'START_RECORDING' });
			const action: AudioAction = { type: 'STOP_RECORDING' };
			const effects = audioCore.effects(recordingState, action);

			expect(effects).toContainEqual({
				type: 'PROCESS_RECORDING',
				session: recordingState.recordingSession
			});
		});

		it('should generate playback effects', () => {
			const action: AudioAction = { type: 'START_PLAYBACK', audioId: 'test.mp3' };
			const effects = audioCore.effects(initialState, action);

			expect(effects).toContainEqual({
				type: 'PLAY_AUDIO',
				audioId: 'test.mp3',
				volume: 0.8
			});
		});

		it('should generate stop effects', () => {
			const playingState = audioCore.transition(initialState, {
				type: 'START_PLAYBACK',
				audioId: 'test.mp3'
			});
			const action: AudioAction = { type: 'STOP_PLAYBACK' };
			const effects = audioCore.effects(playingState, action);

			expect(effects).toContainEqual({
				type: 'STOP_AUDIO'
			});
		});

		it('should generate volume effects', () => {
			const action: AudioAction = { type: 'SET_VOLUME', volume: 0.6 };
			const effects = audioCore.effects(initialState, action);

			expect(effects).toContainEqual({
				type: 'UPDATE_VOLUME',
				volume: 0.6
			});
		});

		it('should return empty effects for actions without side effects', () => {
			const action: AudioAction = { type: 'RECORDING_COMPLETE' };
			const effects = audioCore.effects(initialState, action);

			expect(effects).toEqual([]);
		});
	});

	describe('derived state', () => {
		it('should correctly identify recording state', () => {
			const recordingState = audioCore.transition(initialState, { type: 'START_RECORDING' });

			expect(audioCore.derived.isRecording(recordingState)).toBe(true);
			expect(audioCore.derived.isRecording(initialState)).toBe(false);
		});

		it('should correctly identify playing state', () => {
			const playingState = audioCore.transition(initialState, {
				type: 'START_PLAYBACK',
				audioId: 'test.mp3'
			});

			expect(audioCore.derived.isPlaying(playingState)).toBe(true);
			expect(audioCore.derived.isPlaying(initialState)).toBe(false);
		});

		it('should correctly identify processing state', () => {
			const recordingState = audioCore.transition(initialState, { type: 'START_RECORDING' });
			const processingState = audioCore.transition(recordingState, { type: 'STOP_RECORDING' });

			expect(audioCore.derived.isProcessing(processingState)).toBe(true);
			expect(audioCore.derived.isProcessing(initialState)).toBe(false);
		});

		it('should correctly identify error state', () => {
			const errorState = audioCore.transition(initialState, {
				type: 'AUDIO_ERROR',
				error: 'Test error'
			});

			expect(audioCore.derived.hasError(errorState)).toBe(true);
			expect(audioCore.derived.hasError(initialState)).toBe(false);
		});

		it('should correctly identify when recording is allowed', () => {
			expect(audioCore.derived.canRecord(initialState)).toBe(true);

			const recordingState = audioCore.transition(initialState, { type: 'START_RECORDING' });
			expect(audioCore.derived.canRecord(recordingState)).toBe(false);
		});

		it('should correctly identify when playback is allowed', () => {
			expect(audioCore.derived.canPlay(initialState)).toBe(true);

			const playingState = audioCore.transition(initialState, {
				type: 'START_PLAYBACK',
				audioId: 'test.mp3'
			});
			expect(audioCore.derived.canPlay(playingState)).toBe(false);
		});

		it('should calculate recording duration correctly', () => {
			const recordingState = audioCore.transition(initialState, { type: 'START_RECORDING' });

			// Wait a bit to simulate time passing
			setTimeout(() => {
				const processingState = audioCore.transition(recordingState, { type: 'STOP_RECORDING' });
				const duration = audioCore.derived.recordingDuration(processingState);

				expect(duration).toBeGreaterThan(0);
			}, 100);
		});

		it('should return 0 duration for no recording session', () => {
			const duration = audioCore.derived.recordingDuration(initialState);
			expect(duration).toBe(0);
		});
	});

	describe('immutability', () => {
		it('should not mutate original state', () => {
			const action: AudioAction = { type: 'START_RECORDING' };
			const newState = audioCore.transition(initialState, action);

			expect(newState).not.toBe(initialState);
			expect(initialState.status).toBe('idle');
			expect(newState.status).toBe('recording');
		});

		it('should create new objects for nested state', () => {
			const action: AudioAction = { type: 'START_RECORDING' };
			const newState = audioCore.transition(initialState, action);

			expect(newState.recordingSession).not.toBe(initialState.recordingSession);
			expect(initialState.recordingSession).toBeNull();
			expect(newState.recordingSession).toBeDefined();
		});
	});
});
