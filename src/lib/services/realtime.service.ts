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
		instructions?: string;
		turnDetection?: {
			type: 'server_vad';
			threshold: number;
			prefix_padding_ms: number;
			silence_duration_ms: number;
		};
		inputAudioTranscription?: {
			model: string;
			language: string;
		};
	};
}

export interface TranscriptionEvent {
	type: 'user_transcript' | 'assistant_transcript';
	text: string;
	isFinal: boolean;
	timestamp: Date;
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
	private onTranscriptionCallback: (event: TranscriptionEvent) => void = () => {};
	private sessionConfig: RealtimeSession['config'] | null = null;

	constructor() {
		// If we're on the server, throw an error to prevent instantiation
		if (!browser) {
			console.log('🔇 RealtimeService: constructor() called on server');
			return;
		}
	}

	async connectWithSession(
		sessionData: {
			client_secret: {
				value: string;
				expires_at: number;
			};
			session_id: string;
		},
		stream: MediaStream,
		onMessage: (message: Message) => void,
		onConnectionStateChange: (state: RTCPeerConnectionState) => void,
		onTranscription?: (event: TranscriptionEvent) => void,
		sessionConfig?: RealtimeSession['config']
	): Promise<void> {
		this.onMessageCallback = onMessage;
		this.onConnectionStateChangeCallback = onConnectionStateChange;
		this.onTranscriptionCallback = onTranscription || (() => {});
		this.sessionConfig = sessionConfig || null;

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
		// Step 2: Create peer connection with proper configuration for OpenAI Realtime API
		this.pc = new RTCPeerConnection({
			iceServers: [
				{ urls: 'stun:stun.l.google.com:19302' },
				{ urls: 'stun:stun1.l.google.com:19302' }
			],
			// Enable audio processing for real-time communication
			iceCandidatePoolSize: 10
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

		// Set up event handlers
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

		// Step 5: Create data channel
		this.dataChannel = this.pc.createDataChannel('oai-events', {
			ordered: true
		});

		this.setupDataChannel();

		// Step 6: Create offer and connect
		await this.negotiateConnection();

		console.log('✅ WebRTC connection established');
	}

	private setupDataChannel(): void {
		if (!this.dataChannel) return;

		this.dataChannel.onopen = () => {
			console.log('📡 Data channel opened - connection fully established!');
			// Notify that we're fully connected
			this.onConnectionStateChangeCallback('connected');

			const initialConfig = {
				type: 'session.update',
				session: {
					modalities: ['text', 'audio'],
					instructions: this.sessionConfig?.instructions || 'You are a helpful language tutor.',
					input_audio_format: 'pcm16',
					output_audio_format: 'pcm16',
					input_audio_transcription: {
						model: 'whisper-1', // Enable input transcription
						language:
							this.sessionConfig?.inputAudioTranscription?.language ||
							this.sessionConfig?.language ||
							'en'
					},
					turn_detection: this.sessionConfig?.turnDetection || {
						type: 'server_vad',
						threshold: 0.5,
						prefix_padding_ms: 300,
						silence_duration_ms: 500
					}
				}
			};
			console.log('📡 Sending initial configuration:', initialConfig);
			// Send initial configuration
			this.sendEvent(initialConfig);
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
			const model = 'gpt-4o-mini-realtime-preview-2024-12-17';

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

	sendEvent(event: Record<string, unknown>): void {
		if (this.dataChannel?.readyState === 'open') {
			this.dataChannel.send(JSON.stringify(event));
		}
	}

	send(data: object): void {
		if (this.dataChannel?.readyState === 'open') {
			this.dataChannel.send(JSON.stringify(data));
		}
	}

	private handleServerEvent(event: {
		error(arg0: string, error: string): unknown;
		delta?: string;
		type: string;
		message?: { role: string; content: string };
		transcript?: string;
		item?: {
			role: string;
			content: string | Array<{ type: string; text?: string; input_text?: string }>;
		};
		part?: { type: string; text?: string };
	}): void {
		console.log('📨 Server event:', event.type, event);

		// Handle different types of server events
		switch (event.type) {
			// New: Handle user speech transcription events
			case 'input_audio_buffer.speech_started':
				console.log('🎤 User started speaking');
				break;

			case 'input_audio_buffer.speech_stopped':
				console.log('🎤 User stopped speaking');
				break;

			case 'conversation.item.input_audio_transcription.completed':
				// Final user transcription
				if (event.transcript) {
					console.log('📝 User transcript:', event.transcript);
					this.onTranscriptionCallback({
						type: 'user_transcript',
						text: event.transcript,
						isFinal: true,
						timestamp: new Date()
					});

					// Also create a message for the chat history
					const userMessage: Message = {
						role: 'user',
						content: event.transcript,
						timestamp: new Date(),
						id: '',
						conversationId: '',
						audioUrl: null
					};
					this.onMessageCallback(userMessage);
				}
				break;

			case 'conversation.item.input_audio_transcription.failed':
				console.error('❌ User transcription failed:', event.error);
				break;

			// Enhanced: Handle assistant speech transcription
			case 'response.audio_transcript.delta':
				// Streaming assistant transcription
				console.log('📝 Audio transcript delta received:', event);
				if (event.delta) {
					console.log('📝 Processing delta:', event.delta);
					this.onTranscriptionCallback({
						type: 'assistant_transcript',
						text: event.delta,
						isFinal: false,
						timestamp: new Date()
					});
				}
				break;

			case 'response.audio_transcript.done':
				// Final assistant transcription
				if (event.transcript) {
					console.log('📝 Assistant transcript:', event.transcript);
					this.onTranscriptionCallback({
						type: 'assistant_transcript',
						text: event.transcript,
						isFinal: true,
						timestamp: new Date()
					});
					// Note: Message is added via the transcription callback, not here
				}
				break;

			// ... existing cases ...
			case 'message': {
				const message: Message = {
					role: event.message?.role === 'assistant' ? 'assistant' : 'user',
					content: event.message?.content || '',
					timestamp: new Date(),
					id: '',
					conversationId: '',
					audioUrl: null
				};
				this.onMessageCallback(message);
				break;
			}

			case 'conversation.item.created': {
				if (event.item && event.item.content) {
					const role = event.item.role === 'user' ? 'user' : 'assistant';
					let content = '';

					if (Array.isArray(event.item.content)) {
						content = event.item.content
							.filter(
								(part: { type: string; text?: string; input_text?: string }) =>
									part.type === 'text' || part.type === 'input_text'
							)
							.map(
								(part: { type: string; text?: string; input_text?: string }) =>
									part.text || part.input_text
							)
							.join(' ');
					} else if (typeof event.item.content === 'string') {
						content = event.item.content;
					}

					if (content) {
						const itemMessage: Message = {
							role,
							content,
							timestamp: new Date(),
							id: '',
							conversationId: '',
							audioUrl: null
						};
						this.onMessageCallback(itemMessage);
					}
				}
				break;
			}

			case 'response.content_part.done': {
				if (event.part && event.part.type === 'text' && event.part.text) {
					const contentMessage: Message = {
						role: 'assistant',
						content: event.part.text,
						timestamp: new Date(),
						id: '',
						conversationId: '',
						audioUrl: null
					};
					this.onMessageCallback(contentMessage);
				}
				break;
			}

			case 'response.content_part.delta': {
				// Handle streaming content parts (including audio content)
				if (event.part) {
					console.log('📝 Content part delta:', event.part);

					// Handle different content part types
					if (event.part.type === 'text' && event.part.text) {
						// Text content - could be streaming text response
						console.log('📝 Text content delta:', event.part.text);
					} else if (event.part.type === 'audio') {
						// Audio content - this is what we need for audio parts
						console.log('🎵 Audio content delta:', event.part);
					}
				}
				break;
			}

			case 'response.audio.done': {
				// Handle audio completion event
				console.log('🎵 Audio response completed:', event);
				// You can add additional audio completion logic here if needed
				break;
			}

			case 'response.output_item.done': {
				// Handle output item completion
				console.log('📤 Output item completed:', event);
				// You can add additional output completion logic here if needed
				break;
			}

			case 'response.done': {
				// Handle overall response completion
				console.log('✅ Response completed:', event);
				// You can add additional response completion logic here if needed
				break;
			}

			case 'output_audio_buffer.ready': {
				// Handle audio buffer ready event
				console.log('🎵 Audio buffer ready:', event);
				break;
			}

			case 'output_audio_buffer.done': {
				// Handle audio buffer completion
				console.log('🎵 Audio buffer done:', event);
				break;
			}

			default:
				if (
					event.type &&
					!event.type.startsWith('rate_limits.') &&
					!event.type.startsWith('output_audio_buffer.')
				) {
					console.log('⚠️ Unhandled event type:', event.type);
				}
				break;
		}
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
