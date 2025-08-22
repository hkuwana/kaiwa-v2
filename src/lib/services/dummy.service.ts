/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import type { AudioLevel } from './audio.service';
import type { Message } from '$lib/server/db/types';

// Type for MediaStreamConstraints (available globally in browsers)
type MediaStreamConstraints = {
	audio?: boolean | MediaTrackConstraints;
	video?: boolean | MediaTrackConstraints;
};

/**
 * A "no-op" version of the AudioService that runs on the server
 * to prevent SSR errors. It has the same methods, but they do nothing.
 */
export class DummyAudioService {
	async initialize(): Promise<void> {
		// Do nothing on the server
	}

	async getStream(_deviceId?: string): Promise<MediaStream> {
		// Throw an error because this should never be called on the server

		throw new Error('Cannot get audio stream on the server.');
	}

	onLevelUpdate(_callback: (level: AudioLevel) => void): void {
		// Do nothing on the server
	}

	onStreamReady(_callback: (stream: MediaStream) => void): void {
		// Do nothing on the server
	}

	onStreamError(_callback: (error: string) => void): void {
		// Do nothing on the server
	}

	cleanup(): void {
		// Do nothing on the server
	}

	async getAvailableDevices(): Promise<MediaDeviceInfo[]> {
		// Return an empty array on the server
		return [];
	}

	// Get current device ID
	getCurrentDeviceId(): string {
		// Return default on the server
		return 'default';
	}

	// Check if we have an active stream
	hasActiveStream(): boolean {
		// Always false on the server
		return false;
	}

	// Get current stream (for external use)
	getCurrentStream(): MediaStream | null {
		// Always null on the server
		return null;
	}

	// Get current audio level (for immediate use)
	getCurrentAudioLevel(): number {
		// Always 0 on the server

		return 0;
	}

	// Manually trigger audio level update for testing
	triggerLevelUpdate(): void {
		// Do nothing on the server
		return;
	}

	// Test different constraint combinations for mobile compatibility
	async testConstraints(): Promise<{
		success: boolean;
		constraints: MediaStreamConstraints;
		error?: string;
	}> {
		// Do nothing on the server
		return { success: false, constraints: {}, error: 'Cannot test constraints on server' };
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
		_onConnectionStateChange: (state: RTCPeerConnectionState) => void,
		_onTranscription?: (event: any) => void,
		_sessionConfig?: any
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
