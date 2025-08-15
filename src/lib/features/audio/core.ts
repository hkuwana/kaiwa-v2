// 🎵 Audio Feature Core
// Pure functional core following "Functional Core, Imperative Shell" principle

import type { AudioState, AudioAction, AudioEffect } from './types';

// 🎯 Pure functional core - no side effects
export const audioCore = {
	// Initial state
	initial: (): AudioState => ({
		status: 'idle',
		currentAudio: null,
		volume: 0.8,
		recordingSession: null,
		error: null
	}),

	// Pure state transitions
	transition: (state: AudioState, action: AudioAction): AudioState => {
		switch (action.type) {
			case 'START_RECORDING':
				return {
					...state,
					status: 'recording',
					recordingSession: {
						id: crypto.randomUUID(),
						startTime: Date.now(),
						chunks: []
					},
					error: null
				};

			case 'STOP_RECORDING':
				return {
					...state,
					status: 'processing',
					recordingSession: state.recordingSession
						? {
								...state.recordingSession,
								endTime: Date.now()
							}
						: null
				};

			case 'RECORDING_COMPLETE':
				return {
					...state,
					status: 'idle',
					recordingSession: null
				};

			case 'START_PLAYBACK':
				return {
					...state,
					status: 'playing',
					currentAudio: action.audioId,
					error: null
				};

			case 'STOP_PLAYBACK':
				return {
					...state,
					status: 'idle',
					currentAudio: null
				};

			case 'SET_VOLUME':
				return {
					...state,
					volume: Math.max(0, Math.min(1, action.volume))
				};

			case 'AUDIO_ERROR':
				return {
					...state,
					status: 'error',
					error: action.error,
					currentAudio: null
				};

			case 'CLEAR_ERROR':
				return {
					...state,
					error: null,
					status: state.currentAudio ? 'playing' : 'idle'
				};

			default:
				return state;
		}
	},

	// Side effects as data (your principle)
	effects: (state: AudioState, action: AudioAction): AudioEffect[] => {
		switch (action.type) {
			case 'START_RECORDING':
				return [{ type: 'INITIALIZE_RECORDING', deviceId: action.deviceId }];

			case 'STOP_RECORDING':
				return [{ type: 'PROCESS_RECORDING', session: state.recordingSession }];

			case 'START_PLAYBACK':
				return [{ type: 'PLAY_AUDIO', audioId: action.audioId, volume: state.volume }];

			case 'STOP_PLAYBACK':
				return [{ type: 'STOP_AUDIO' }];

			case 'SET_VOLUME':
				return [{ type: 'UPDATE_VOLUME', volume: action.volume }];

			default:
				return [];
		}
	},

	// Derived state computations
	derived: {
		isRecording: (state: AudioState): boolean => state.status === 'recording',
		isPlaying: (state: AudioState): boolean => state.status === 'playing',
		isProcessing: (state: AudioState): boolean => state.status === 'processing',
		hasError: (state: AudioState): boolean => state.error !== null,
		canRecord: (state: AudioState): boolean => state.status === 'idle',
		canPlay: (state: AudioState): boolean => state.status === 'idle',
		recordingDuration: (state: AudioState): number => {
			if (!state.recordingSession?.startTime) return 0;
			const endTime = state.recordingSession.endTime || Date.now();
			return endTime - state.recordingSession.startTime;
		}
	}
};
