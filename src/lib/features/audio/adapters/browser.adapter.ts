// 🎵 Audio Feature - Simplified Architecture
// This file has been simplified - see device-manager.ts for the new implementation

export class BrowserAudioAdapter {
	// Legacy placeholder - will be removed
	constructor() {
		console.warn('BrowserAudioAdapter is deprecated. Use AudioDeviceManager instead.');
	}

	async getDevices(): Promise<MediaDeviceInfo[]> {
		return [];
	}

	async startRecording(): Promise<MediaRecorder> {
		throw new Error('BrowserAudioAdapter is deprecated. Use AudioDeviceManager instead.');
	}

	async startRealtimeRecording(): Promise<MediaRecorder> {
		throw new Error('BrowserAudioAdapter is deprecated. Use AudioDeviceManager instead.');
	}

	async stopRecording(): Promise<ArrayBuffer> {
		throw new Error('BrowserAudioAdapter is deprecated. Use AudioDeviceManager instead.');
	}

	dispose(): void {
		// No-op for deprecated adapter
	}
}
