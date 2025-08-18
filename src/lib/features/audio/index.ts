// 🎤 Audio Feature Public API
// Clean interface for other features to use audio capabilities

export * from './types';
export * from './core';
export * from './orchestrator';
export * from './events';

// Export adapters
export { BrowserAudioAdapter } from './adapters/browser.adapter';
export { HowlerAudioAdapter } from './adapters/howler.adapter';
export { OpenAIAudioAdapter } from './adapters/openai.adapter';

import type { AudioInputPort, AudioOutputPort, AudioProcessingPort, AudioState } from './types';
import { AudioOrchestrator } from './orchestrator';
import { BrowserAudioAdapter } from './adapters/browser.adapter';
import { HowlerAudioAdapter } from './adapters/howler.adapter';
import { OpenAIAudioAdapter } from './adapters/openai.adapter';

// Main audio service using the new architecture
export class AudioService {
	private orchestrator: AudioOrchestrator;

	constructor(
		inputAdapter?: AudioInputPort,
		outputAdapter?: AudioOutputPort,
		processingAdapter?: AudioProcessingPort
	) {
		// Use provided adapters or create defaults
		const input = inputAdapter || new BrowserAudioAdapter();
		const output = outputAdapter || new HowlerAudioAdapter();
		const processing = processingAdapter || new OpenAIAudioAdapter(); // Will use relative URLs by default

		this.orchestrator = new AudioOrchestrator(input, output, processing);
	}

	// Delegate all public methods to the orchestrator
	async startRecording(deviceId?: string): Promise<void> {
		return this.orchestrator.startRecording(deviceId);
	}

	async startRealtimeRecording(deviceId?: string): Promise<void> {
		return this.orchestrator.startRealtimeRecording(deviceId);
	}

	async stopRecording(): Promise<void> {
		return this.orchestrator.stopRecording();
	}

	async playAudio(audioData: ArrayBuffer): Promise<void> {
		// Convert ArrayBuffer to blob URL for playback
		const blob = new Blob([audioData], { type: 'audio/wav' });
		const url = URL.createObjectURL(blob);

		try {
			await this.orchestrator.playFromUrl(url);
		} finally {
			URL.revokeObjectURL(url);
		}
	}

	async playFromUrl(url: string): Promise<void> {
		return this.orchestrator.playFromUrl(url);
	}

	async stopPlayback(): Promise<void> {
		return this.orchestrator.stopPlayback();
	}

	// 🎯 AI Processing
	async transcribe(audio: ArrayBuffer): Promise<string> {
		return this.orchestrator.transcribe(audio);
	}

	async textToSpeech(text: string): Promise<ArrayBuffer> {
		return this.orchestrator.textToSpeech(text);
	}

	// 🎯 Device management
	async getAudioDevices(): Promise<MediaDeviceInfo[]> {
		return this.orchestrator.getAudioDevices();
	}

	// 🎯 Volume control
	async setVolume(volume: number): Promise<void> {
		return this.orchestrator.setVolume(volume);
	}

	// 🎯 State access
	getState(): AudioState {
		return this.orchestrator.getState();
	}

	// 🎯 Derived state access
	get isRecording(): boolean {
		return this.orchestrator.isRecording;
	}

	get isPlaying(): boolean {
		return this.orchestrator.isPlaying;
	}

	get isProcessing(): boolean {
		return this.orchestrator.isProcessing;
	}

	// 🎯 Realtime streaming support
	getOrchestrator(): AudioOrchestrator {
		return this.orchestrator;
	}

	// 🎯 Event system for realtime integration
	on(eventName: string, handler: (data: unknown) => void): void {
		this.orchestrator.on(eventName, handler);
	}

	off(eventName: string, handler: (data: unknown) => void): void {
		this.orchestrator.off(eventName, handler);
	}

	get hasError(): boolean {
		return this.orchestrator.hasError;
	}

	get canRecord(): boolean {
		return this.orchestrator.canRecord;
	}

	get canPlay(): boolean {
		return this.orchestrator.canPlay;
	}

	get volume(): number {
		return this.orchestrator.volume;
	}

	get error(): string | null {
		return this.orchestrator.error;
	}

	// 🎯 Error handling
	async clearError(): Promise<void> {
		return this.orchestrator.clearError();
	}

	// 🎯 Cleanup
	dispose(): void {
		this.orchestrator.dispose();
	}
}

// 🎯 Default audio service instance
export const audioService = new AudioService();

// 🎯 Factory function for custom configurations
export function createAudioService(
	inputAdapter?: AudioInputPort,
	outputAdapter?: AudioOutputPort,
	processingAdapter?: AudioProcessingPort,
	baseUrl?: string
): AudioService {
	// If baseUrl is provided, create a new OpenAI adapter with it
	let processing = processingAdapter;
	if (baseUrl && !processingAdapter) {
		processing = new OpenAIAudioAdapter(baseUrl);
	}

	return new AudioService(inputAdapter, outputAdapter, processing);
}
