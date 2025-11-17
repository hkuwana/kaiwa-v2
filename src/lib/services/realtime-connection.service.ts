// RealtimeConnectionService
// Responsibility: Session lifecycle and audio device management
// ~150 lines

import { browser } from '$app/environment';
// eslint-disable-next-line no-restricted-imports
import type { SessionConnection } from '$lib/services/realtime-agents.service';
import { SvelteSet } from 'svelte/reactivity';

export interface AudioOutputDebugInfo {
	isSupported: boolean;
	selectedDeviceId: string | null;
	availableDevices: string[];
	error: string | null;
}

export class RealtimeConnectionService {
	// Public reactive state (will be synced by store)
	isConnected = false;
	selectedOutputDeviceId = 'default';
	availableOutputDevices: MediaDeviceInfo[] = [];
	outputDeviceError: string | null = null;

	// Private state
	private connection: SessionConnection | null = null;
	private sessionId: string = '';
	private sessionReadyListeners = new SvelteSet<() => void>();
	private outputSelectionSupported = false;

	constructor() {
		if (browser) {
			this.detectOutputSelectionSupport();
		}
	}

	private detectOutputSelectionSupport() {
		try {
			const testAudio = document.createElement('audio');
			const candidate = testAudio as unknown as { setSinkId?: (id: string) => Promise<void> };
			this.outputSelectionSupported = typeof candidate.setSinkId === 'function';
			testAudio.remove();
		} catch {
			this.outputSelectionSupported = false;
		}
	}

	/**
	 * Establish a connection with session data and media stream
	 */
	async connect(
		connection: SessionConnection,
		sessionId: string,
		_mediaStream: MediaStream
	): Promise<void> {
		this.connection = connection;
		this.sessionId = sessionId;
		this.isConnected = true;

		// Apply any previously selected output device
		await this.applySelectedOutputDevice();
	}

	/**
	 * Disconnect the session
	 */
	disconnect(): void {
		this.connection = null;
		this.sessionId = '';
		this.isConnected = false;
		this.sessionReadyListeners.clear();
	}

	/**
	 * Refresh available audio output devices
	 */
	async refreshOutputDevices(): Promise<void> {
		try {
			const devices = await navigator.mediaDevices.enumerateDevices();
			this.availableOutputDevices = devices.filter((d) => d.kind === 'audiooutput');
			this.outputDeviceError = null;
		} catch (error) {
			this.outputDeviceError = `Failed to enumerate audio devices: ${error instanceof Error ? error.message : String(error)}`;
			this.availableOutputDevices = [];
		}
	}

	/**
	 * Set the preferred audio output device
	 */
	async setOutputDevice(deviceId: string): Promise<void> {
		if (!this.outputSelectionSupported) {
			this.outputDeviceError = 'Audio output device selection is not supported in this browser';
			return;
		}

		this.selectedOutputDeviceId = deviceId;

		if (this.isConnected) {
			await this.applySelectedOutputDevice();
		}
	}

	/**
	 * Check if output device selection is available
	 */
	canSelectOutputDevice(): boolean {
		return this.outputSelectionSupported;
	}

	/**
	 * Get debug information about audio output
	 */
	getAudioOutputDebugInfo(): AudioOutputDebugInfo {
		return {
			isSupported: this.outputSelectionSupported,
			selectedDeviceId: this.selectedOutputDeviceId,
			availableDevices: this.availableOutputDevices.map((d) => `${d.deviceId}: ${d.label}`),
			error: this.outputDeviceError
		};
	}

	/**
	 * Register a callback for when session is ready
	 */
	onSessionReady(callback: () => void): () => void {
		this.sessionReadyListeners.add(callback);
		return () => this.sessionReadyListeners.delete(callback);
	}

	/**
	 * Fire session ready event
	 */
	fireSessionReady(): void {
		for (const callback of this.sessionReadyListeners) {
			try {
				callback();
			} catch (error) {
				console.error('Error in session ready callback:', error);
			}
		}
	}

	// Private implementation

	private async applySelectedOutputDevice(): Promise<void> {
		if (!this.outputSelectionSupported || !this.connection) {
			return;
		}

		try {
			// Get the audio element from the connection if available
			const audioElements = document.querySelectorAll('audio');
			for (const audio of audioElements) {
				const audioWithSink = audio as HTMLAudioElement & {
					setSinkId?: (deviceId: string) => Promise<void>;
				};
				if ('setSinkId' in audio && typeof audioWithSink.setSinkId === 'function') {
					await audioWithSink.setSinkId(this.selectedOutputDeviceId);
				}
			}
			this.outputDeviceError = null;
		} catch (error) {
			this.outputDeviceError = `Failed to set output device: ${error instanceof Error ? error.message : String(error)}`;
		}
	}
}
