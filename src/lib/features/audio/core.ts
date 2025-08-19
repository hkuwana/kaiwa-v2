// 🎵 Audio Feature - Simplified Architecture
// This file has been simplified - see device-manager.ts for the new implementation

export const audioCore = {
	// Legacy placeholder - will be removed
	initial: () => ({ status: 'idle' }),
	transition: (state: any, action: any) => state,
	effects: () => [],
	derived: {
		isRecording: () => false,
		isPlaying: () => false,
		isProcessing: () => false,
		hasError: () => false,
		canRecord: () => false,
		canPlay: () => false,
		recordingDuration: () => 0
	}
};
