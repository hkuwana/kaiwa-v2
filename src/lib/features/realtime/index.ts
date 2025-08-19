// 🚀 Real-time Feature Public API
// Clean interface for other features to use real-time capabilities

export * from './ports';
export * from './adapters';
export * from './events';

import { realtimeAdapters, OpenAIRealtimeStreamingAdapter } from './adapters';
import type { RealtimeSession, RealtimeStream, RealtimeSessionConfig } from './ports';
import type { EventBus } from '$lib/shared/events/eventBus';
import { EventBusFactory } from '$lib/shared/events/eventBus';

// 🎯 Main real-time service
export class RealtimeService {
	private streamingAdapter: typeof realtimeAdapters.streaming;

	constructor(
		private session = realtimeAdapters.session,
		streaming = realtimeAdapters.streaming,
		private events = realtimeAdapters.events,
		private bus?: EventBus
	) {
		// Create a new streaming adapter instance with event bus
		this.streamingAdapter = new OpenAIRealtimeStreamingAdapter(
			bus || EventBusFactory.create('memory')
		);
	}

	// Session management
	async createSession(config: RealtimeSessionConfig) {
		return this.session.createSession(config);
	}

	async closeSession(session: RealtimeSession) {
		return this.session.closeSession();
	}

	async validateSession(session: RealtimeSession) {
		return this.session.validateSession(session);
	}

	// Streaming operations
	async startStreaming(session: RealtimeSession, audioStream?: MediaStream) {
		return this.streamingAdapter.startStreaming(session, audioStream);
	}

	async stopStreaming(stream: RealtimeStream) {
		return this.streamingAdapter.stopStreaming(stream);
	}

	async sendAudioChunk(stream: RealtimeStream, chunk: ArrayBuffer) {
		return this.streamingAdapter.sendAudioChunk(stream, chunk);
	}

	// Event handling
	onTranscript(callback: (transcript: string) => void) {
		this.events.onTranscript(callback);
	}

	onResponse(callback: (response: string) => void) {
		this.events.onResponse(callback);
	}

	onAudioResponse(callback: (audioChunk: ArrayBuffer) => void) {
		this.events.onAudioResponse(callback);
	}

	onError(callback: (error: string) => void) {
		this.events.onError(callback);
	}

	onConnectionChange(callback: (status: 'connected' | 'disconnected') => void) {
		this.events.onConnectionChange(callback);
	}

	// Internal event emission (for testing and internal use)
	emitTranscript(transcript: string) {
		this.events.emitTranscript(transcript);
	}

	emitResponse(response: string) {
		this.events.emitResponse(response);
	}

	emitAudioResponse(audioChunk: ArrayBuffer) {
		this.events.emitAudioResponse(audioChunk);
	}

	emitError(error: string) {
		this.events.emitError(error);
	}

	emitConnectionChange(status: 'connected' | 'disconnected') {
		this.events.emitConnectionChange(status);
	}
}

// 🎯 Default real-time service instance
export const realtimeService = new RealtimeService();
