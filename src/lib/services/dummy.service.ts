/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import type { AudioLevel } from './audio.service';
import type { Message } from '$lib/server/db/types';

/**
 * A "no-op" version of the AudioService that runs on the server
 * to prevent SSR errors. It has the same methods, but they do nothing.
 */
export class DummyAudioService {
	async initialize(): Promise<void> {
		// Do nothing on the server
		console.log('🔇 DummyAudioService: initialize() called on server');
	}

	async getStream(_deviceId?: string): Promise<MediaStream> {
		// Throw an error because this should never be called on the server
		console.error('🔇 DummyAudioService: getStream() was called on the server.');
		throw new Error('Cannot get audio stream on the server.');
	}

	onLevelUpdate(_callback: (level: AudioLevel) => void): void {
		// Do nothing on the server
		console.log('🔇 DummyAudioService: onLevelUpdate() called on server');
	}

	onStreamReady(_callback: (stream: MediaStream) => void): void {
		// Do nothing on the server
		console.log('🔇 DummyAudioService: onStreamReady() called on server');
	}

	onStreamError(_callback: (error: string) => void): void {
		// Do nothing on the server
		console.log('🔇 DummyAudioService: onStreamError() called on server');
	}

	cleanup(): void {
		// Do nothing on the server
		console.log('🔇 DummyAudioService: cleanup() called on server');
	}

	async getAvailableDevices(): Promise<MediaDeviceInfo[]> {
		// Return an empty array on the server
		console.log('🔇 DummyAudioService: getAvailableDevices() called on server');
		return [];
	}

	// Get current device ID
	getCurrentDeviceId(): string {
		// Return default on the server
		console.log('🔇 DummyAudioService: getCurrentDeviceId() called on server');
		return 'default';
	}

	// Check if we have an active stream
	hasActiveStream(): boolean {
		// Always false on the server
		console.log('🔇 DummyAudioService: hasActiveStream() called on server');
		return false;
	}

	// Get current stream (for external use)
	getCurrentStream(): MediaStream | null {
		// Always null on the server
		console.log('🔇 DummyAudioService: getCurrentStream() called on server');
		return null;
	}

	// Get current audio level (for immediate use)
	getCurrentAudioLevel(): number {
		// Always 0 on the server
		console.log('🔇 DummyAudioService: getCurrentAudioLevel() called on server');
		return 0;
	}
}

/**
 * A "no-op" version of the RealtimeService that runs on the server
 * to prevent SSR errors. It has the same methods, but they do nothing.
 */
export class DummyRealtimeService {
	async connectWithSession(
		_sessionData: any,
		_stream: MediaStream,
		_onMessage: (message: Message) => void,
		_onConnectionStateChange: (state: RTCPeerConnectionState) => void
	): Promise<void> {
		// Do nothing on the server
		console.log('🔇 DummyRealtimeService: connectWithSession() called on server');

		return;
	}

	sendEvent(event: any): void {
		// Do nothing on the server
		console.log('🔇 DummyRealtimeService: sendEvent() called on server');
		return;
	}

	send(data: object): void {
		// Do nothing on the server
		console.log('🔇 DummyRealtimeService: send() called on server');
		return;
	}

	isConnected(): boolean {
		// Always false on the server
		console.log('🔇 DummyRealtimeService: isConnected() called on server');
		return false;
	}

	getConnectionState(): string {
		// Always disconnected on the server
		console.log('🔇 DummyRealtimeService: getConnectionState() called on server');
		return 'disconnected';
	}

	disconnect(): void {
		// Do nothing on the server
		console.log('🔇 DummyRealtimeService: disconnect() called on server');
		return;
	}
}
