// 📡 WebRTC Connection
// Manages ONLY WebRTC connection, NOT business logic

import { audioDeviceManager } from '$lib/features/audio/device-manager';

export class WebRTCConnection {
	private pc: RTCPeerConnection | null = null;
	private dc: RTCDataChannel | null = null;
	private audioElement: HTMLAudioElement | null = null;
	private ephemeralKey: string | null = null;
	private sessionExpiry: number = 0;
	private reconnectTimer: NodeJS.Timeout | null = null;
	private onMessageCallback?: (event: any) => void;

	async connect(voice = 'alloy', deviceId?: string): Promise<void> {
		try {
			// Step 1: Get ephemeral token
			const tokenData = await this.fetchEphemeralToken(voice);
			this.ephemeralKey = tokenData.client_secret.value;
			this.sessionExpiry = tokenData.client_secret.expires_at;

			// Set up auto-reconnect before expiry (50 seconds)
			this.scheduleReconnect();

			// Step 2: Create peer connection
			this.pc = new RTCPeerConnection({
				iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
			});

			// Step 3: Set up audio output
			this.audioElement = document.createElement('audio');
			this.audioElement.autoplay = true;
			this.audioElement.style.display = 'none'; // Hidden element
			document.body.appendChild(this.audioElement);

			this.pc.ontrack = (event) => {
				console.log('📡 Received remote audio track');
				if (this.audioElement) {
					this.audioElement.srcObject = event.streams[0];
				}
			};

			// Step 4: Get audio stream from device manager
			const audioStream = await audioDeviceManager.getStream(deviceId);
			const audioTrack = audioStream.getTracks()[0];
			this.pc.addTrack(audioTrack, audioStream);

			// Step 5: Create data channel
			this.dc = this.pc.createDataChannel('oai-events', {
				ordered: true
			});

			this.setupDataChannel();

			// Step 6: Create offer and connect
			await this.negotiateConnection();

			console.log('✅ WebRTC connection established');
		} catch (error) {
			console.error('❌ Connection failed:', error);
			this.cleanup();
			throw error;
		}
	}

	private async fetchEphemeralToken(voice: string): Promise<any> {
		const response = await fetch('/api/realtime-session', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				sessionId: crypto.randomUUID(),
				model: 'gpt-4o-realtime-preview-2024-10-01',
				voice
			})
		});

		if (!response.ok) {
			throw new Error(`Failed to get token: ${response.statusText}`);
		}

		return response.json();
	}

	private setupDataChannel(): void {
		if (!this.dc) return;

		this.dc.onopen = () => {
			console.log('📡 Data channel opened');
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

		this.dc.onmessage = (event) => {
			const data = JSON.parse(event.data);
			this.handleServerEvent(data);
		};

		this.dc.onerror = (error) => {
			console.error('❌ Data channel error:', error);
		};
	}

	private async negotiateConnection(): Promise<void> {
		if (!this.pc || !this.ephemeralKey) return;

		const offer = await this.pc.createOffer();
		await this.pc.setLocalDescription(offer);

		const baseUrl = 'https://api.openai.com/v1/realtime';
		const model = 'gpt-4o-realtime-preview-2024-10-01';

		const response = await fetch(`${baseUrl}?model=${model}`, {
			method: 'POST',
			body: offer.sdp,
			headers: {
				Authorization: `Bearer ${this.ephemeralKey}`,
				'Content-Type': 'application/sdp'
			}
		});

		if (!response.ok) {
			throw new Error(`SDP exchange failed: ${response.statusText}`);
		}

		const answerSdp = await response.text();
		await this.pc.setRemoteDescription({
			type: 'answer',
			sdp: answerSdp
		});
	}

	sendEvent(event: any): void {
		if (this.dc?.readyState === 'open') {
			this.dc.send(JSON.stringify(event));
		}
	}

	// Set callback for handling server events
	onMessage(callback: (event: any) => void): void {
		this.onMessageCallback = callback;
	}

	private handleServerEvent(event: any): void {
		if (this.onMessageCallback) {
			this.onMessageCallback(event);
		}
		console.log('📨 Server event:', event.type, event);
	}

	private scheduleReconnect(): void {
		// Clear existing timer
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
		}

		// Reconnect 10 seconds before expiry
		const timeUntilExpiry = this.sessionExpiry - Date.now();
		const reconnectIn = Math.max(0, timeUntilExpiry - 10000);

		this.reconnectTimer = setTimeout(() => {
			console.log('🔄 Token expiring, reconnecting...');
			this.reconnect();
		}, reconnectIn);
	}

	private async reconnect(): Promise<void> {
		const currentVoice = 'alloy'; // Store this
		const currentDevice = audioDeviceManager.getCurrentDeviceId();

		this.cleanup();
		await this.connect(currentVoice, currentDevice);
	}

	// Check connection status
	isConnected(): boolean {
		return this.pc?.connectionState === 'connected' && this.dc?.readyState === 'open';
	}

	// Get connection state
	getConnectionState(): string {
		return this.pc?.connectionState || 'disconnected';
	}

	cleanup(): void {
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}
		if (this.dc) {
			this.dc.close();
			this.dc = null;
		}
		if (this.pc) {
			this.pc.close();
			this.pc = null;
		}
		if (this.audioElement) {
			this.audioElement.remove();
			this.audioElement = null;
		}
		audioDeviceManager.cleanup();
	}
}

export const webrtcConnection = new WebRTCConnection();
