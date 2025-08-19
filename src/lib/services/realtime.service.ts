// 📡 RealtimeService - Manages WebRTC connections and real-time communication
// Plain TypeScript class with no Svelte dependencies

import { browser } from '$app/environment';
import type { Message } from '$lib/server/db/types';
import { DummyRealtimeService } from './dummy.service';

export interface RealtimeSession {
	id: string;
	clientSecret: string;
	expiresAt: number;
	config: {
		model: string;
		voice: string;
		language: string;
	};
}

export class RealtimeService {
	private pc: RTCPeerConnection | null = null;
	private dataChannel: RTCDataChannel | null = null;
	private audioElement: HTMLAudioElement | null = null;
	private ephemeralKey: string | null = null;
	private sessionExpiry: number = 0;
	private reconnectTimer: NodeJS.Timeout | null = null;
	private onMessageCallback: (message: Message) => void = () => {};
	private onConnectionStateChangeCallback: (state: RTCPeerConnectionState) => void = () => {};

	constructor() {
		// If we're on the server, throw an error to prevent instantiation
		if (!browser) {
			console.log('🔇 RealtimeService: constructor() called on server');
			return;
		}
	}

	async connectWithSession(
		sessionData: any,
		stream: MediaStream,
		onMessage: (message: Message) => void,
		onConnectionStateChange: (state: RTCPeerConnectionState) => void
	): Promise<void> {
		this.onMessageCallback = onMessage;
		this.onConnectionStateChangeCallback = onConnectionStateChange;

		try {
			// Notify that we're starting to connect
			this.onConnectionStateChangeCallback('connecting');

			// Step 1: Use the session data directly - no need to fetch anything
			this.ephemeralKey = sessionData.client_secret.value;
			this.sessionExpiry = sessionData.client_secret.expires_at;

			// Set up auto-reconnect before expiry (only if we have a valid expiry time)
			if (this.sessionExpiry > Date.now()) {
				this.scheduleReconnect();
			}

			// Continue with connection setup
			await this.setupConnection(stream);
		} catch (error) {
			console.error('❌ Connection failed:', error);
			this.cleanup();
			throw error;
		}
	}

	private async setupConnection(stream: MediaStream): Promise<void> {
		// Step 2: Create peer connection
		this.pc = new RTCPeerConnection({
			iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
		});

		// Step 3: Add the provided audio stream to the peer connection
		stream.getTracks().forEach((track) => {
			this.pc?.addTrack(track, stream);
		});

		// Step 4: Set up audio output
		this.audioElement = document.createElement('audio');
		this.audioElement.autoplay = true;
		this.audioElement.style.display = 'none';
		document.body.appendChild(this.audioElement);

		this.pc.ontrack = (event) => {
			console.log('📡 Received remote audio track');
			if (this.audioElement) {
				this.audioElement.srcObject = event.streams[0];
			}
		};

		this.pc.onconnectionstatechange = () => {
			const state = this.pc?.connectionState;
			console.log('🔌 WebRTC connection state changed:', state);
			if (state) {
				this.onConnectionStateChangeCallback(state);
			}
		};

		this.pc.oniceconnectionstatechange = () => {
			const iceState = this.pc?.iceConnectionState;
			console.log('🧊 ICE connection state changed:', iceState);
		};

		this.pc.onicegatheringstatechange = () => {
			const gatheringState = this.pc?.iceGatheringState;
			console.log('🧊 ICE gathering state changed:', gatheringState);
		};

		// Step 4: Create data channel
		this.dataChannel = this.pc.createDataChannel('oai-events', {
			ordered: true
		});

		this.setupDataChannel();

		// Step 5: Create offer and connect
		await this.negotiateConnection();

		console.log('✅ WebRTC connection established');
	}

	private setupDataChannel(): void {
		if (!this.dataChannel) return;

		this.dataChannel.onopen = () => {
			console.log('📡 Data channel opened - connection fully established!');
			// Notify that we're fully connected
			this.onConnectionStateChangeCallback('connected');

			// Send initial configuration
			this.sendEvent({
				type: 'session.update',
				session: {
					modalities: ['text', 'audio'],
					instructions: 'You are a helpful language tutor.',
					input_audio_format: 'pcm16',
					output_audio_format: 'pcm16',
					turn_detection: {
						type: 'server_vad',
						threshold: 0.5,
						prefix_padding_ms: 300,
						silence_duration_ms: 500
					}
				}
			});
		};

		this.dataChannel.onmessage = (event) => {
			const data = JSON.parse(event.data);
			this.handleServerEvent(data);
		};

		this.dataChannel.onerror = (error) => {
			console.error('❌ Data channel error:', error);
			this.onConnectionStateChangeCallback('failed');
		};

		this.dataChannel.onclose = () => {
			console.log('📡 Data channel closed');
			this.onConnectionStateChangeCallback('closed');
		};
	}

	private async negotiateConnection(): Promise<void> {
		if (!this.pc || !this.ephemeralKey) return;

		try {
			console.log('📡 Creating WebRTC offer...');
			const offer = await this.pc.createOffer();
			await this.pc.setLocalDescription(offer);
			console.log('📡 Local description set, offer created');

			// Connect directly to OpenAI's realtime endpoint as per their docs
			const baseUrl = 'https://api.openai.com/v1/realtime';
			const model = 'gpt-4o-realtime-preview-2024-10-01';

			console.log('📡 Sending SDP offer to OpenAI...');
			const response = await fetch(`${baseUrl}?model=${model}`, {
				method: 'POST',
				body: offer.sdp,
				headers: {
					Authorization: `Bearer ${this.ephemeralKey}`,
					'Content-Type': 'application/sdp'
				}
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error('❌ SDP exchange failed:', response.status, errorText);
				throw new Error(`SDP exchange failed: ${response.status} - ${errorText}`);
			}

			const answerSdp = await response.text();
			console.log('📡 Received SDP answer from OpenAI');

			await this.pc.setRemoteDescription({
				type: 'answer',
				sdp: answerSdp
			});
			console.log('📡 Remote description set, connection negotiation complete');
		} catch (error) {
			console.error('❌ Connection negotiation failed:', error);
			throw error;
		}
	}

	sendEvent(event: any): void {
		if (this.dataChannel?.readyState === 'open') {
			this.dataChannel.send(JSON.stringify(event));
		}
	}

	send(data: object): void {
		if (this.dataChannel?.readyState === 'open') {
			this.dataChannel.send(JSON.stringify(data));
		}
	}

	private handleServerEvent(event: any): void {
		// Handle different types of server events
		if (event.type === 'message') {
			const message: Message = {
				role: event.message.role || 'assistant',
				content: event.message.content || '',
				timestamp: Date.now()
			};
			this.onMessageCallback(message);
		}
		console.log('📨 Server event:', event.type, event);
	}

	private scheduleReconnect(): void {
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
		}

		// Only schedule reconnect if we have a valid expiry time
		if (this.sessionExpiry <= Date.now()) {
			console.log('⚠️ Session already expired, not scheduling reconnect');
			return;
		}

		const timeUntilExpiry = this.sessionExpiry - Date.now();
		const reconnectIn = Math.max(0, timeUntilExpiry - 10000); // 10 seconds before expiry

		console.log(
			`🔄 Scheduling reconnect in ${Math.round(reconnectIn / 1000)}s (expires in ${Math.round(timeUntilExpiry / 1000)}s)`
		);

		this.reconnectTimer = setTimeout(() => {
			console.log('🔄 Token expiring, reconnecting...');
			this.reconnect();
		}, reconnectIn);
	}

	private async reconnect(): Promise<void> {
		// For MVP, just cleanup and let the UI handle reconnection
		this.cleanup();
	}

	isConnected(): boolean {
		return this.pc?.connectionState === 'connected' && this.dataChannel?.readyState === 'open';
	}

	getConnectionState(): string {
		return this.pc?.connectionState || 'disconnected';
	}

	disconnect(): void {
		this.cleanup();
	}

	private cleanup(): void {
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}
		if (this.dataChannel) {
			this.dataChannel.close();
			this.dataChannel = null;
		}
		if (this.pc) {
			this.pc.close();
			this.pc = null;
		}
		if (this.audioElement) {
			this.audioElement.remove();
			this.audioElement = null;
		}
	}
}

// Export an instance that automatically chooses the right service
export const realtimeService = browser ? new RealtimeService() : new DummyRealtimeService();
