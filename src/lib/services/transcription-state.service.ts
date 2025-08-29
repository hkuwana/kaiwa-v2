// src/lib/services/transcription-state.service.ts
// Pure functional service for managing transcription state

export interface TranscriptionState {
	currentTranscript: string;
	isTranscribing: boolean;
}

/**
 * Create initial transcription state
 */
export function createTranscriptionState(): TranscriptionState {
	return {
		currentTranscript: '',
		isTranscribing: false
	};
}

/**
 * Update transcription state for user transcript events
 * @param state - Current transcription state
 * @param text - Transcript text
 * @param isFinal - Whether this is the final transcript
 * @returns Updated transcription state
 */
export function updateForUserTranscript(
	state: TranscriptionState,
	text: string,
	isFinal: boolean
): TranscriptionState {
	if (isFinal) {
		return {
			currentTranscript: '',
			isTranscribing: false
		};
	} else {
		return {
			currentTranscript: text,
			isTranscribing: true
		};
	}
}

/**
 * Clear transcription state (reset to initial state)
 */
export function clearTranscriptionState(): TranscriptionState {
	return createTranscriptionState();
}

/**
 * Handle transcription update logic - determines what actions to take
 * @param transcriptionData - Data from the transcription event
 * @param currentState - Current transcription state
 * @returns Object with new state and action flags
 */
export function processTranscriptionUpdate(
	transcriptionData: {
		type: 'user_transcript' | 'assistant_transcript';
		text: string;
		isFinal: boolean;
		timestamp: Date;
	},
	currentState: TranscriptionState
): {
	newState: TranscriptionState;
	shouldUpdatePlaceholder: boolean;
	shouldFinalizePlaceholder: boolean;
	shouldUpdateStreaming: boolean;
	shouldFinalizeStreaming: boolean;
} {
	if (transcriptionData.type === 'user_transcript') {
		if (transcriptionData.isFinal) {
			return {
				newState: clearTranscriptionState(),
				shouldUpdatePlaceholder: false,
				shouldFinalizePlaceholder: true,
				shouldUpdateStreaming: false,
				shouldFinalizeStreaming: false
			};
		} else {
			return {
				newState: updateForUserTranscript(currentState, transcriptionData.text, false),
				shouldUpdatePlaceholder: true,
				shouldFinalizePlaceholder: false,
				shouldUpdateStreaming: false,
				shouldFinalizeStreaming: false
			};
		}
	} else if (transcriptionData.type === 'assistant_transcript') {
		if (transcriptionData.isFinal) {
			return {
				newState: clearTranscriptionState(),
				shouldUpdatePlaceholder: false,
				shouldFinalizePlaceholder: false,
				shouldUpdateStreaming: false,
				shouldFinalizeStreaming: true
			};
		} else {
			return {
				newState: currentState, // Assistant streaming doesn't affect user transcription state
				shouldUpdatePlaceholder: false,
				shouldFinalizePlaceholder: false,
				shouldUpdateStreaming: true,
				shouldFinalizeStreaming: false
			};
		}
	}

	// Default case - no action needed
	return {
		newState: currentState,
		shouldUpdatePlaceholder: false,
		shouldFinalizePlaceholder: false,
		shouldUpdateStreaming: false,
		shouldFinalizeStreaming: false
	};
}
