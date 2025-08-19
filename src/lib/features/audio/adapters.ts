// 🎵 Audio Feature - Simplified Architecture
// This file has been simplified - see device-manager.ts for the new implementation

export interface AudioInputPort {
	// Legacy interface - will be removed
	getDevices(): Promise<MediaDeviceInfo[]>;
}

export interface AudioOutputPort {
	// Legacy interface - will be removed
	playFromUrl(url: string): Promise<void>;
	stop(): void;
	setVolume(volume: number): Promise<void>;
}

export interface AudioProcessingPort {
	// Legacy interface - will be removed
	transcribe(audio: ArrayBuffer): Promise<string>;
	textToSpeech(text: string): Promise<ArrayBuffer>;
}

// Legacy exports - will be removed
export { BrowserAudioAdapter } from './adapters/browser.adapter';
export { HowlerAudioAdapter } from './adapters/howler.adapter';
export { OpenAIAudioAdapter } from './adapters/openai.adapter';
