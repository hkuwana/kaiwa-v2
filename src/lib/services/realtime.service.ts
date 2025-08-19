// 📡 RealtimeService - Manages WebRTC connections and real-time communication
// Plain TypeScript class with no Svelte dependencies

export interface Message {
	role: 'user' | 'assistant';
	content: string;
	timestamp: number;
}

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

	async connect(
		sessionUrl: string,
		onMessage: (message: Message) => void,
		onConnectionStateChange: (state: RTCPeerConnectionState) => void
	): Promise<void> {
		this.onMessageCallback = onMessage;
		this.onConnectionStateChangeCallback = onConnectionStateChange;

		try {
			// Step 1: Get ephemeral token
			const tokenData = await this.fetchEphemeralToken();
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
			this.audioElement.style.display = 'none';
			document.body.appendChild(this.audioElement);

			this.pc.ontrack = (event) => {
				console.log('📡 Received remote audio track');
				if (this.audioElement) {
					this.audioElement.srcObject = event.streams[0];
				}
			};

			this.pc.onconnectionstatechange = () => {
				const state = this.pc!.connectionState;
				console.log('🔌 Connection state changed:', state);
				this.onConnectionStateChangeCallback(state);
			};

			// Step 4: Create data channel
			this.dataChannel = this.pc.createDataChannel('oai-events', {
				ordered: true
			});

			this.setupDataChannel();

			// Step 5: Create offer and connect
			await this.negotiateConnection();

			console.log('✅ WebRTC connection established');
		} catch (error) {
			console.error('❌ Connection failed:', error);
			this.cleanup();
			throw error;
		}
	}

	private async fetchEphemeralToken(): Promise<any> {
		const response = await fetch('/api/realtime-session', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				sessionId: crypto.randomUUID(),
				model: 'gpt-4o-realtime-preview-2024-10-01',
				voice: 'alloy'
			})
		});

		if (!response.ok) {
			throw new Error(`Failed to get token: ${response.statusText}`);
		}

		return response.json();
	}

	private setupDataChannel(): void {
		if (!this.dataChannel) return;

		this.dataChannel.onopen = () => {
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

		this.dataChannel.onmessage = (event) => {
			const data = JSON.parse(event.data);
			this.handleServerEvent(data);
		};

		this.dataChannel.onerror = (error) => {
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

		const timeUntilExpiry = this.sessionExpiry - Date.now();
		const reconnectIn = Math.max(0, timeUntilExpiry - 10000);

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
