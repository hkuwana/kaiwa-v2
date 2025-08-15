// 🚀 Real-time Feature Adapters
// Modern implementations for OpenAI real-time API integration

import type {
	RealtimeSessionPort,
	RealtimeStreamingPort,
	RealtimeEventHandlerPort,
	RealtimeSession,
	RealtimeSessionConfig,
	RealtimeStream
} from './ports';

// 🔌 OpenAI Real-time Session Adapter
export class OpenAIRealtimeSessionAdapter implements RealtimeSessionPort {
	async createSession(config: RealtimeSessionConfig): Promise<RealtimeSession> {
		try {
			const response = await fetch('/api/realtime-session', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					sessionId: config.sessionId,
					model: config.model,
					voice: config.voice,
					language: config.language,
					instructions: config.instructions,
					temperature: config.temperature
				})
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error('Session creation failed:', {
					status: response.status,
					statusText: response.statusText,
					response: errorText
				});
				throw new Error(
					`Session creation failed: ${response.status} ${response.statusText} - ${errorText}`
				);
			}

			const sessionData = await response.json();

			const session: RealtimeSession = {
				id: sessionData.session_id,
				clientSecret: sessionData.client_secret.value,
				expiresAt: new Date(sessionData.client_secret.expires_at).getTime(),
				config,
				status: 'connected',
				createdAt: Date.now()
			};

			return session;
		} catch (error) {
			console.error('Session creation error details:', error);
			throw new Error(`Failed to create realtime session: ${error}`);
		}
	}

	async closeSession(session: RealtimeSession): Promise<void> {
		try {
			// Close the session on OpenAI's side
			const response = await fetch(`https://api.openai.com/v1/realtime/sessions/${session.id}`, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${session.clientSecret}`
				}
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error('Session close failed:', {
					status: response.status,
					statusText: response.statusText,
					response: errorText
				});
			}
		} catch (error) {
			console.error('Session close error:', error);
		}
	}

	async validateSession(session: RealtimeSession): Promise<boolean> {
		try {
			// Check if session is still valid
			const now = Date.now();
			if (now >= session.expiresAt) {
				return false;
			}

			// Test connection to OpenAI
			const response = await fetch(`https://api.openai.com/v1/realtime/sessions/${session.id}`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${session.clientSecret}`
				}
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error('Session validation failed:', {
					status: response.status,
					statusText: response.statusText,
					response: errorText
				});
			}

			return response.ok;
		} catch (error) {
			console.error('Session validation error:', error);
			return false;
		}
	}
}

// 🌊 OpenAI Real-time Streaming Adapter with WebRTC
export class OpenAIRealtimeStreamingAdapter implements RealtimeStreamingPort {
	private activeStreams = new Map<string, RealtimeStream>();
	private peerConnections = new Map<string, RTCPeerConnection>();
	private dataChannels = new Map<string, RTCDataChannel>();
	private eventHandlers: RealtimeEventHandlerPort | null = null;

	constructor(eventHandlers?: RealtimeEventHandlerPort) {
		this.eventHandlers = eventHandlers || null;
	}

	async startStreaming(session: RealtimeSession): Promise<RealtimeStream> {
		try {
			console.log('🚀 Starting WebRTC streaming for session:', session);

			// Validate session object
			if (!session || !session.id) {
				throw new Error('Invalid session: missing session ID');
			}

			if (!session.clientSecret) {
				throw new Error('Invalid session: missing client secret');
			}

			console.log(
				'✅ Session validation passed - ID:',
				session.id,
				'Secret length:',
				session.clientSecret.length
			);

			// Create RTCPeerConnection for WebRTC
			const peerConnection = new RTCPeerConnection({
				iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
			});

			console.log('📡 RTCPeerConnection created');

			const stream: RealtimeStream = {
				id: crypto.randomUUID(),
				session,
				isActive: true,
				startTime: Date.now(),
				audioChunksSent: 0,
				lastActivity: Date.now()
			};

			console.log('🌊 Stream object created:', stream.id);

			// Set up data channel for signaling
			const dataChannel = peerConnection.createDataChannel('signaling', {
				ordered: true
			});

			console.log('📨 Data channel created');

			dataChannel.onopen = () => {
				console.log('✅ WebRTC data channel opened');
				this.eventHandlers?.emitConnectionChange('connected');
			};

			dataChannel.onmessage = (event) => {
				console.log('📥 Data channel message received:', event.data);
				this.handleDataChannelMessage(event.data);
			};

			dataChannel.onerror = (error) => {
				console.error('❌ Data channel error:', error);
				this.eventHandlers?.emitError(`Data channel error: ${error}`);
			};

			dataChannel.onclose = () => {
				console.log('🔒 Data channel closed');
				this.eventHandlers?.emitConnectionChange('disconnected');
				stream.isActive = false;
				this.activeStreams.delete(stream.id);
				this.peerConnections.delete(stream.id);
				this.dataChannels.delete(stream.id);
			};

			// Handle ICE candidates
			peerConnection.onicecandidate = async (event) => {
				if (event.candidate) {
					console.log('🧊 ICE candidate generated:', event.candidate);

					// Validate session before sending ICE candidate
					if (!session || !session.id) {
						console.error('❌ Cannot send ICE candidate: invalid session', session);
						return;
					}

					try {
						// Send ICE candidate to OpenAI via HTTP
						const response = await fetch(
							`https://api.openai.com/v1/realtime/sessions/${session.id}/ice-candidate`,
							{
								method: 'POST',
								headers: {
									Authorization: `Bearer ${session.clientSecret}`,
									'Content-Type': 'application/json'
								},
								body: JSON.stringify({
									candidate: event.candidate
								})
							}
						);

						if (!response.ok) {
							const errorText = await response.text();
							console.error('❌ ICE candidate sending failed:', {
								status: response.status,
								statusText: response.statusText,
								response: errorText,
								sessionId: session.id,
								candidate: event.candidate
							});
						} else {
							console.log('✅ ICE candidate sent successfully');
						}
					} catch (error) {
						console.error('❌ Failed to send ICE candidate:', error);
					}
				}
			};

			// Handle connection state changes
			peerConnection.onconnectionstatechange = () => {
				console.log('🔄 WebRTC connection state changed:', peerConnection.connectionState);
				if (peerConnection.connectionState === 'connected') {
					console.log('✅ WebRTC connection established');
					this.eventHandlers?.emitConnectionChange('connected');
				} else if (
					peerConnection.connectionState === 'disconnected' ||
					peerConnection.connectionState === 'failed'
				) {
					console.log('❌ WebRTC connection failed or disconnected');
					this.eventHandlers?.emitConnectionChange('disconnected');
				}
			};

			// Create offer and send to OpenAI
			const offer = await peerConnection.createOffer({
				offerToReceiveAudio: true,
				offerToReceiveVideo: false
			});

			console.log('📤 SDP offer created:', offer.type);

			await peerConnection.setLocalDescription(offer);
			console.log('📋 Local description set');

			// Send offer to OpenAI
			console.log('🌐 Sending offer to OpenAI...');
			const response = await fetch(
				`https://api.openai.com/v1/realtime/sessions/${session.id}/offer`,
				{
					method: 'POST',
					headers: {
						Authorization: `Bearer ${session.clientSecret}`,
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						sdp: offer.sdp,
						type: offer.type
					})
				}
			);

			if (!response.ok) {
				const errorText = await response.text();
				console.error('❌ Offer sending failed:', {
					status: response.status,
					statusText: response.statusText,
					response: errorText,
					sessionId: session.id
				});
				throw new Error(
					`Failed to send offer: ${response.status} ${response.statusText} - ${errorText}`
				);
			}

			const answerData = await response.json();
			console.log('✅ OpenAI answer received:', answerData);

			// Set remote description from OpenAI
			await peerConnection.setRemoteDescription(
				new RTCSessionDescription({
					type: answerData.type,
					sdp: answerData.sdp
				})
			);
			console.log('📋 Remote description set');

			// Store the stream and connections
			this.activeStreams.set(stream.id, stream);
			this.peerConnections.set(stream.id, peerConnection);
			this.dataChannels.set(stream.id, dataChannel);

			console.log('🎉 WebRTC streaming setup complete!');
			console.log('📊 Active streams:', this.activeStreams.size);
			console.log('🔗 Peer connections:', this.peerConnections.size);
			console.log('📨 Data channels:', this.dataChannels.size);

			return stream;
		} catch (error) {
			throw new Error(`Failed to start streaming: ${error}`);
		}
	}

	async stopStreaming(stream: RealtimeStream): Promise<void> {
		try {
			const peerConnection = this.peerConnections.get(stream.id);
			const dataChannel = this.dataChannels.get(stream.id);

			if (dataChannel) {
				dataChannel.close();
				this.dataChannels.delete(stream.id);
			}

			if (peerConnection) {
				peerConnection.close();
				this.peerConnections.delete(stream.id);
			}

			stream.isActive = false;
			this.activeStreams.delete(stream.id);
		} catch (error) {
			console.error('Error stopping streaming:', error);
		}
	}

	async sendAudioChunk(stream: RealtimeStream, chunk: ArrayBuffer): Promise<void> {
		if (!stream.isActive) {
			throw new Error('Stream is not active');
		}

		try {
			const dataChannel = this.dataChannels.get(stream.id);
			if (!dataChannel || dataChannel.readyState !== 'open') {
				throw new Error('Data channel is not open');
			}

			// Send audio chunk via data channel
			dataChannel.send(chunk);

			stream.audioChunksSent++;
			stream.lastActivity = Date.now();
		} catch (error) {
			throw new Error(`Failed to send audio chunk: ${error}`);
		}
	}

	private handleDataChannelMessage(data: unknown): void {
		try {
			// Parse the message data
			let message;
			if (typeof data === 'string') {
				message = JSON.parse(data);
			} else {
				// Handle binary data (audio responses)
				this.eventHandlers?.emitAudioResponse(data as ArrayBuffer);
				return;
			}

			// Handle different message types
			switch (message.type) {
				case 'transcript':
					this.eventHandlers?.emitTranscript(message.payload.text);
					break;
				case 'response':
					this.eventHandlers?.emitResponse(message.payload.text);
					break;
				case 'error':
					this.eventHandlers?.emitError(message.payload.message);
					break;
				case 'session_update':
					// Handle session status updates
					break;
				default:
					console.log('Unknown message type:', message.type);
			}
		} catch (error) {
			console.error('Failed to handle data channel message:', error);
			this.eventHandlers?.emitError(`Message handling error: ${error}`);
		}
	}
}

// 📡 Real-time Event Handler Adapter
export class RealTimeEventHandlerAdapter implements RealtimeEventHandlerPort {
	private transcriptCallbacks: ((transcript: string) => void)[] = [];
	private responseCallbacks: ((response: string) => void)[] = [];
	private audioResponseCallbacks: ((audioChunk: ArrayBuffer) => void)[] = [];
	private errorCallbacks: ((error: string) => void)[] = [];
	private connectionCallbacks: ((status: 'connected' | 'disconnected') => void)[] = [];

	onTranscript(callback: (transcript: string) => void): void {
		this.transcriptCallbacks.push(callback);
	}

	onResponse(callback: (response: string) => void): void {
		this.responseCallbacks.push(callback);
	}

	onAudioResponse(callback: (audioChunk: ArrayBuffer) => void): void {
		this.audioResponseCallbacks.push(callback);
	}

	onError(callback: (error: string) => void): void {
		this.errorCallbacks.push(callback);
	}

	onConnectionChange(callback: (status: 'connected' | 'disconnected') => void): void {
		this.connectionCallbacks.push(callback);
	}

	// Internal methods to trigger events
	emitTranscript(transcript: string): void {
		this.transcriptCallbacks.forEach((callback) => callback(transcript));
	}

	emitResponse(response: string): void {
		this.responseCallbacks.forEach((callback) => callback(response));
	}

	emitAudioResponse(audioChunk: ArrayBuffer): void {
		this.audioResponseCallbacks.forEach((callback) => callback(audioChunk));
	}

	emitError(error: string): void {
		this.errorCallbacks.forEach((callback) => callback(error));
	}

	emitConnectionChange(status: 'connected' | 'disconnected'): void {
		this.connectionCallbacks.forEach((callback) => callback(status));
	}
}

// 🎯 Default adapter configuration
export const realtimeAdapters = {
	session: new OpenAIRealtimeSessionAdapter(),
	streaming: new OpenAIRealtimeStreamingAdapter(), // Will be recreated with event handlers in service
	events: new RealTimeEventHandlerAdapter()
};
