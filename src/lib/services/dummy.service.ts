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
 * A "no-op" version of the RealtimeCoordinatorService that runs on the server
 * to prevent SSR errors. It has the same methods, but they do nothing.
 */
export class DummyRealtimeCoordinatorService {
	async connectWithSession(
		_sessionData: any,
		_stream: MediaStream,
		_onMessage: (message: Message) => void,
		_onConnectionStateChange: (state: RTCPeerConnectionState) => void,
		_onTranscription?: (event: any) => void,
		_sessionConfig?: any
	): Promise<void> {
		// Do nothing on the server
		console.log('🔇 DummyRealtimeCoordinatorService: connectWithSession() called on server');
		return;
	}

	sendEvent(event: any): void {
		// Do nothing on the server
		console.log('🔇 DummyRealtimeCoordinatorService: sendEvent() called on server');
		return;
	}

	sendMessage(content: string): void {
		// Do nothing on the server
		console.log('🔇 DummyRealtimeCoordinatorService: sendMessage() called on server');
		return;
	}

	createResponse(modalities: string[] = ['text', 'audio']): void {
		// Do nothing on the server
		console.log('🔇 DummyRealtimeCoordinatorService: createResponse() called on server');
		return;
	}

	pauseStreaming(): void {
		console.log('🔇 DummyRealtimeCoordinatorService: pauseStreaming() called on server');
	}

	resumeStreaming(): void {
		console.log('🔇 DummyRealtimeCoordinatorService: resumeStreaming() called on server');
	}

	getConnectionStatus(): {
		peerConnectionState: string;
		dataChannelState: string;
		isStreamingPaused: boolean;
		hasLocalStream: boolean;
	} {
		console.log('🔇 DummyRealtimeCoordinatorService: getConnectionStatus() called on server');
		return {
			peerConnectionState: 'disconnected',
			dataChannelState: 'closed',
			isStreamingPaused: false,
			hasLocalStream: false
		};
	}

	isConnected(): boolean {
		// Always false on the server
		console.log('🔇 DummyRealtimeCoordinatorService: isConnected() called on server');
		return false;
	}

	getConnectionState(): string {
		// Always disconnected on the server
		console.log('🔇 DummyRealtimeCoordinatorService: getConnectionState() called on server');
		return 'disconnected';
	}

	getStreamingPausedState(): boolean {
		console.log('🔇 DummyRealtimeCoordinatorService: getStreamingPausedState() called on server');
		return false;
	}

	getAudioLevel(): number {
		console.log('🔇 DummyRealtimeCoordinatorService: getAudioLevel() called on server');
		return 0;
	}

	updateAudioLevel(level: number): void {
		console.log('🔇 DummyRealtimeCoordinatorService: updateAudioLevel() called on server');
	}

	async testAudioConstraints() {
		console.log('🔇 DummyRealtimeCoordinatorService: testAudioConstraints() called on server');
		return { success: false, error: 'Cannot test constraints on server' };
	}

	async getAvailableDevices(): Promise<MediaDeviceInfo[]> {
		console.log('🔇 DummyRealtimeCoordinatorService: getAvailableDevices() called on server');
		return [];
	}

	async switchAudioDevice(deviceId: string): Promise<boolean> {
		console.log('🔇 DummyRealtimeCoordinatorService: switchAudioDevice() called on server');
		return false;
	}

	disconnect(): void {
		console.log('🔇 DummyRealtimeCoordinatorService: disconnect() called on server');
	}

	forceDisconnect(): void {
		console.log('🧹 DummyRealtimeCoordinatorService: forceDisconnect() called on server');
	}

	getSessionConfig(): any {
		console.log('🔇 DummyRealtimeCoordinatorService: getSessionConfig() called on server');
		return null;
	}

	getAudioStatus(): any {
		console.log('🔇 DummyRealtimeCoordinatorService: getAudioStatus() called on server');
		return {
			hasLocalStream: false,
			isStreamingPaused: false,
			audioLevel: 0,
			trackCount: 0
		};
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
		console.log('🔇 DummyRealtimeService: disconnect() called on server');
	}

	forceDisconnect(): void {
		console.log('🧹 DummyRealtimeService: forceDisconnect() called on server');
	}

	// Add missing methods to match the interface
	pauseStreaming(): void {
		console.log('🔇 DummyRealtimeService: pauseStreaming() called on server');
	}

	resumeStreaming(): void {
		console.log('🔇 DummyRealtimeService: resumeStreaming() called on server');
	}

	isStreamingPaused(): boolean {
		console.log('🔇 DummyRealtimeService: isStreamingPaused() called on server');
		return false;
	}

	getStreamingPausedState(): boolean {
		console.log('🔇 DummyRealtimeService: getStreamingPausedState() called on server');
		return false;
	}

	getConnectionStatus(): {
		peerConnectionState: string;
		dataChannelState: string;
		isStreamingPaused: boolean;
		hasLocalStream: boolean;
	} {
		console.log('🔇 DummyRealtimeService: getConnectionStatus() called on server');
		return {
			peerConnectionState: 'disconnected',
			dataChannelState: 'closed',
			isStreamingPaused: false,
			hasLocalStream: false
		};
	}
}
