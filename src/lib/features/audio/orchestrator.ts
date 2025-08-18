// 🎵 Audio Feature Orchestrator
// Coordinates the functional core with imperative adapters following "Orchestrator Pattern"

import { audioCore } from './core';
import type { AudioState, AudioAction, AudioEffect } from './types';
import type { AudioInputPort, AudioOutputPort, AudioProcessingPort } from './types';
import { BrowserAudioAdapter } from './adapters/browser.adapter';
import { HowlerAudioAdapter } from './adapters/howler.adapter';
import { OpenAIAudioAdapter } from './adapters/openai.adapter';
import type { EventBus } from '$lib/shared/events/eventBus';
import { EventBusFactory } from '$lib/shared/events/eventBus';
import { audioEvents } from './events';
// Keep this orchestrator pure TypeScript (no Svelte runes/imports)

export class AudioOrchestrator {
	private state: AudioState;
	private inputAdapter: AudioInputPort;
	private outputAdapter: AudioOutputPort;
	private processingAdapter: AudioProcessingPort;
	private currentRecorder?: MediaRecorder;
	private bus: EventBus;

	constructor(
		inputAdapter: AudioInputPort = new BrowserAudioAdapter(),
		outputAdapter: AudioOutputPort = new HowlerAudioAdapter(),
		processingAdapter: AudioProcessingPort = new OpenAIAudioAdapter(),
		bus?: EventBus
	) {
		this.state = audioCore.initial();
		this.inputAdapter = inputAdapter;
		this.outputAdapter = outputAdapter;
		this.processingAdapter = processingAdapter;
		this.bus = bus ?? EventBusFactory.create('memory');
	}

	// 🎯 Main dispatch method - follows your orchestrator pattern
	async dispatch(action: AudioAction): Promise<void> {
		try {
			// 1. Update state (pure function)
			this.state = audioCore.transition(this.state, action);

			// 2. Execute side effects (imperative shell)
			const effects = audioCore.effects(this.state, action);
			await Promise.all(effects.map((effect) => this.executeEffect(effect)));
		} catch (error) {
			// Handle errors by updating state
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			this.state = audioCore.transition(this.state, { type: 'AUDIO_ERROR', error: errorMessage });

			// Emit typed error event through the shared bus and local handlers
			const payload = { message: errorMessage, timestamp: Date.now() };
			this.bus.emit(audioEvents.error, payload);
			this.emitEvent(audioEvents.error, payload);
		}
	}

	// 🎯 Execute side effects (imperative shell)
	private async executeEffect(effect: AudioEffect): Promise<void> {
		switch (effect.type) {
			case 'INITIALIZE_RECORDING':
				await this.initializeRecording(effect.deviceId);
				break;

			case 'PROCESS_RECORDING':
				await this.processRecording(effect.session);
				break;

			case 'PLAY_AUDIO':
				await this.playAudio(effect.audioId, effect.volume);
				break;

			case 'STOP_AUDIO':
				await this.stopAudio();
				break;

			case 'UPDATE_VOLUME':
				await this.updateVolume(effect.volume);
				break;
		}
	}

	// 🎯 Recording operations
	private async initializeRecording(deviceId?: string): Promise<void> {
		try {
			this.currentRecorder = await this.inputAdapter.startRecording(deviceId);
		} catch (error) {
			throw new Error(
				`Failed to initialize recording: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	// 🎯 Realtime recording operations
	async startRealtimeRecording(deviceId?: string): Promise<void> {
		try {
			// Set up chunk callback to emit events
			const onChunk = (chunk: ArrayBuffer) => {
				// Emit via shared bus (typed event)
				this.bus.emit(audioEvents.chunk, chunk);
				// Back-compat: emit to local handlers
				this.emitEvent(audioEvents.chunk, chunk);
			};

			// Use the browser adapter's realtime recording
			const browserAdapter = this.inputAdapter ;
			if (browserAdapter.startRealtimeRecording) {
				this.currentRecorder = await browserAdapter.startRealtimeRecording(deviceId, onChunk);
			} else {
				// Fallback to regular recording
				this.currentRecorder = await this.inputAdapter.startRecording(deviceId);
			}

			// Update state
			this.state = audioCore.transition(this.state, { type: 'START_RECORDING', deviceId });
		} catch (error) {
			throw new Error(
				`Failed to start realtime recording: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	private async processRecording(session: any): Promise<void> {
		if (!this.currentRecorder) {
			throw new Error('No active recording to process');
		}

		try {
			this.currentRecorder = undefined;

			// Mark recording as complete
			await this.dispatch({ type: 'RECORDING_COMPLETE' });

			// Emit event for other features
			const payload = {
				sessionId: session?.id || 'unknown',
				duration: audioCore.derived.recordingDuration(this.state),
				timestamp: Date.now()
			};
			this.bus.emit(audioEvents.recordingStopped, payload);
			// Back-compat: emit to local handlers
			this.emitEvent(audioEvents.recordingStopped, payload);
		} catch (error) {
			throw new Error(
				`Failed to process recording: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	// 🎯 Playback operations
	private async playAudio(audioId: string, volume: number): Promise<void> {
		try {
			console.log('🎵 Playing audio:', audioId, 'with volume:', volume);
			await this.outputAdapter.playFromUrl(audioId);

			// Emit event
			const payload = { audioId, timestamp: Date.now() };
			this.bus.emit(audioEvents.playbackStarted, payload);
			// Back-compat: emit to local handlers
			this.emitEvent(audioEvents.playbackStarted, payload);
		} catch (error) {
			throw new Error(
				`Failed to play audio: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	private async stopAudio(): Promise<void> {
		try {
			this.outputAdapter.stop();
		} catch (error) {
			throw new Error(
				`Failed to stop audio: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	private async updateVolume(volume: number): Promise<void> {
		try {
			this.outputAdapter.setVolume(volume);

			// Emit event
			const payload = { volume, timestamp: Date.now() };
			this.bus.emit(audioEvents.volumeChanged, payload);
			// Back-compat: emit to local handlers
			this.emitEvent(audioEvents.volumeChanged, payload);
		} catch (error) {
			throw new Error(
				`Failed to update volume: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	// 🎯 Public API methods
	async startRecording(deviceId?: string): Promise<void> {
		await this.dispatch({ type: 'START_RECORDING', deviceId });
	}

	async stopRecording(): Promise<void> {
		await this.dispatch({ type: 'STOP_RECORDING' });
	}

	async playFromUrl(url: string): Promise<void> {
		await this.dispatch({ type: 'START_PLAYBACK', audioId: url });
	}

	async stopPlayback(): Promise<void> {
		await this.dispatch({ type: 'STOP_PLAYBACK' });
	}

	async setVolume(volume: number): Promise<void> {
		await this.dispatch({ type: 'SET_VOLUME', volume });
	}

	async clearError(): Promise<void> {
		await this.dispatch({ type: 'CLEAR_ERROR' });
	}

	// 🎯 AI Processing methods
	async transcribe(audio: ArrayBuffer): Promise<string> {
		return this.processingAdapter.transcribe(audio);
	}

	async textToSpeech(text: string): Promise<ArrayBuffer> {
		return this.processingAdapter.textToSpeech(text);
	}

	async streamTextToSpeech(
		text: string,
		onChunk: (chunk: ArrayBuffer) => void,
		onComplete: () => void,
		onError: (error: Error) => void
	): Promise<void> {
		// Type assertion for the streaming method
		const streamingAdapter = this.processingAdapter as any;
		if (streamingAdapter.streamTextToSpeech) {
			await streamingAdapter.streamTextToSpeech(text, onChunk, onComplete, onError);
		} else {
			// Fallback to non-streaming
			const audio = await this.textToSpeech(text);
			onChunk(audio);
			onComplete();
		}
	}

	// 🎯 Device management
	async getAudioDevices(): Promise<MediaDeviceInfo[]> {
		return this.inputAdapter.getDevices();
	}

	// 🎯 State access
	getState(): AudioState {
		return this.state;
	}

	// 🎯 Realtime streaming support
	getCurrentStream(): MediaStream | null {
		return this.currentRecorder?.stream || null;
	}

	// 🎯 Event system for realtime integration
	private eventHandlers = new Map<string, Array<(data: unknown) => void>>();

	on(eventName: string, handler: (data: unknown) => void): void {
		const handlers = this.eventHandlers.get(eventName) || [];
		handlers.push(handler);
		this.eventHandlers.set(eventName, handlers);
	}

	off(eventName: string, handler: (data: unknown) => void): void {
		const handlers = this.eventHandlers.get(eventName) || [];
		const index = handlers.indexOf(handler);
		if (index > -1) {
			handlers.splice(index, 1);
		}
	}

	private emitEvent(eventName: string, data: unknown): void {
		const handlers = this.eventHandlers.get(eventName) || [];
		handlers.forEach((handler) => handler(data));
	}

	// 🎯 Derived state access
	get isRecording(): boolean {
		return audioCore.derived.isRecording(this.state);
	}

	get isPlaying(): boolean {
		return audioCore.derived.isPlaying(this.state);
	}

	get isProcessing(): boolean {
		return audioCore.derived.isProcessing(this.state);
	}

	get hasError(): boolean {
		return audioCore.derived.hasError(this.state);
	}

	get canRecord(): boolean {
		return audioCore.derived.canRecord(this.state);
	}

	get canPlay(): boolean {
		return audioCore.derived.canPlay(this.state);
	}

	get volume(): number {
		return this.state.volume;
	}

	get error(): string | null {
		return this.state.error;
	}

	// 🎯 Event system integration (simplified for now)
	// Removed ad-hoc window event emission; use shared EventBus instead.

	// 🎯 Cleanup
	dispose(): void {
		if (this.currentRecorder) {
			this.inputAdapter.stopRecording(this.currentRecorder).catch(() => {});
		}
		this.outputAdapter.stop();
	}
}
