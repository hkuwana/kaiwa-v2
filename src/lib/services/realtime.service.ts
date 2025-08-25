// src/lib/services/realtime.service.ts
// Pure functional realtime service - no classes, no state, just functions

import { browser } from '$app/environment';
import type {
	ServerEvent,
	ClientEvent,
	ConversationItemInputAudioTranscriptionCompletedEvent,
	ResponseAudioTranscriptDeltaEvent,
	ResponseAudioTranscriptDoneEvent,
	ConversationItemCreatedEvent,
	ResponseContentPartDoneEvent,
	TextContent,
	SessionConfig
} from '$lib/types/openai.realtime.types';

// Simple connection state interface
export interface RealtimeConnection {
	peerConnection: RTCPeerConnection;
	dataChannel: RTCDataChannel;
	audioElement: HTMLAudioElement;
	sessionKey: string;
	expiresAt: number;
}

// Simple result types for processed events
export interface MessageEventData {
	role: 'user' | 'assistant';
	content: string;
	timestamp: Date;
}

export interface TranscriptionEventData {
	type: 'user_transcript' | 'assistant_transcript';
	text: string;
	isFinal: boolean;
	timestamp: Date;
}

export type ProcessedEventResult =
	| { type: 'message'; data: MessageEventData }
	| { type: 'transcription'; data: TranscriptionEventData }
	| { type: 'connection_state'; data: { state: string } }
	| { type: 'ignore'; data: null };

// === CONNECTION FUNCTIONS ===

export async function createConnection(
	sessionData: { client_secret: { value: string; expires_at: number } },
	audioStream: MediaStream,
	model: string = 'gpt-4o-mini-realtime-preview-2024-12-17'
): Promise<RealtimeConnection | null> {
	if (!browser) {
		console.warn('createConnection can only be called in the browser');
		return null;
	}

	const pc = new RTCPeerConnection({
		iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
	});

	// Add user audio
	audioStream.getTracks().forEach((track) => pc.addTrack(track, audioStream));

	// Create audio output element
	const audioElement = document.createElement('audio');
	audioElement.autoplay = true;
	audioElement.style.display = 'none';
	document.body.appendChild(audioElement);

	// Handle AI audio output
	pc.ontrack = (event) => {
		audioElement.srcObject = event.streams[0];
	};

	// Create data channel for events
	const dataChannel = pc.createDataChannel('oai-events', { ordered: true });

	// Perform SDP negotiation
	const offer = await pc.createOffer();
	await pc.setLocalDescription(offer);

	const response = await fetch(`https://api.openai.com/v1/realtime?model=${model}`, {
		method: 'POST',
		body: offer.sdp,
		headers: {
			Authorization: `Bearer ${sessionData.client_secret.value}`,
			'Content-Type': 'application/sdp'
		}
	});

	if (!response.ok) {
		throw new Error(`WebRTC connection failed: ${response.status}`);
	}

	const answerSdp = await response.text();
	await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });

	return {
		peerConnection: pc,
		dataChannel,
		audioElement,
		sessionKey: sessionData.client_secret.value,
		expiresAt: sessionData.client_secret.expires_at
	};
}

export function closeConnection(connection: RealtimeConnection): void {
	if (connection.dataChannel.readyState === 'open') {
		connection.dataChannel.close();
	}
	connection.peerConnection.close();
	connection.audioElement.remove();
}

// === EVENT FUNCTIONS ===

export function sendEvent(connection: RealtimeConnection, event: ClientEvent): void {
	if (connection.dataChannel.readyState === 'open') {
		connection.dataChannel.send(JSON.stringify(event));
	} else {
		console.warn('Cannot send event: data channel not open');
	}
}

export function createTextMessage(text: string): ClientEvent {
	return {
		type: 'conversation.item.create',
		item: {
			id: crypto.randomUUID(),
			type: 'message',
			role: 'user',
			content: [{ type: 'input_text', text }]
		}
	};
}

export function createResponse(modalities: ('text' | 'audio')[] = ['text', 'audio']): ClientEvent {
	return {
		type: 'response.create',
		response: { modalities }
	};
}

export function createSessionUpdate(config: SessionConfig): ClientEvent {
	return {
		type: 'session.update',
		session: {
			modalities: ['text', 'audio'],
			instructions: config.instructions || 'You are a helpful assistant.',
			input_audio_format: 'pcm16',
			output_audio_format: 'pcm16',
			voice: config.voice || 'alloy',
			input_audio_transcription: config.input_audio_transcription
				? {
						model: 'whisper-1',
						language: config.input_audio_transcription.language
					}
				: undefined,
			turn_detection: config.turn_detection || {
				type: 'server_vad',
				threshold: 0.5,
				prefix_padding_ms: 300,
				silence_duration_ms: 500
			}
		}
	};
}

// === EVENT PROCESSING ===

export function processServerEvent(event: ServerEvent): ProcessedEventResult {
	switch (event.type) {
		case 'conversation.item.input_audio_transcription.completed': {
			const transcriptionEvent = event as ConversationItemInputAudioTranscriptionCompletedEvent;
			return {
				type: 'transcription',
				data: {
					type: 'user_transcript',
					text: transcriptionEvent.transcript,
					isFinal: true,
					timestamp: new Date()
				}
			};
		}

		case 'response.audio_transcript.delta': {
			const deltaEvent = event as ResponseAudioTranscriptDeltaEvent;
			return {
				type: 'transcription',
				data: {
					type: 'assistant_transcript',
					text: deltaEvent.delta,
					isFinal: false,
					timestamp: new Date()
				}
			};
		}

		case 'response.audio_transcript.done': {
			const doneEvent = event as ResponseAudioTranscriptDoneEvent;
			return {
				type: 'transcription',
				data: {
					type: 'assistant_transcript',
					text: doneEvent.transcript,
					isFinal: true,
					timestamp: new Date()
				}
			};
		}

		case 'conversation.item.created': {
			const createdEvent = event as ConversationItemCreatedEvent;
			if (createdEvent.item.type === 'message' && createdEvent.item.role === 'assistant') {
				// Type guard to ensure we only get text content
				const textParts = createdEvent.item.content.filter(
					(part): part is TextContent => part.type === 'text'
				);

				const content = textParts.map((part) => part.text).join(' ');

				if (content) {
					return {
						type: 'message',
						data: {
							role: 'assistant',
							content,
							timestamp: new Date()
						}
					};
				}
			}
			return { type: 'ignore', data: null };
		}

		case 'response.content_part.done': {
			const partEvent = event as ResponseContentPartDoneEvent;
			if (partEvent.part.type === 'text') {
				const textPart = partEvent.part as TextContent;
				return {
					type: 'message',
					data: {
						role: 'assistant',
						content: textPart.text,
						timestamp: new Date()
					}
				};
			}
			return { type: 'ignore', data: null };
		}

		case 'session.created':
		case 'session.updated':
			return {
				type: 'connection_state',
				data: { state: 'session_ready' }
			};

		case 'error':
			return {
				type: 'connection_state',
				data: { state: 'error' }
			};

		default:
			return { type: 'ignore', data: null };
	}
}

// === AUDIO CONTROL FUNCTIONS ===

export function pauseAudioInput(stream: MediaStream): void {
	stream.getAudioTracks().forEach((track) => (track.enabled = false));
}

export function resumeAudioInput(stream: MediaStream): void {
	stream.getAudioTracks().forEach((track) => (track.enabled = true));
}

export function stopAudioStream(stream: MediaStream): void {
	stream.getTracks().forEach((track) => track.stop());
}

// === CONNECTION STATUS FUNCTIONS ===

export function getConnectionStatus(connection: RealtimeConnection | null): {
	isConnected: boolean;
	connectionState: string;
	dataChannelState: string;
	sessionExpired: boolean;
} {
	if (!connection) {
		return {
			isConnected: false,
			connectionState: 'disconnected',
			dataChannelState: 'closed',
			sessionExpired: false
		};
	}

	return {
		isConnected:
			connection.peerConnection.connectionState === 'connected' &&
			connection.dataChannel.readyState === 'open',
		connectionState: connection.peerConnection.connectionState,
		dataChannelState: connection.dataChannel.readyState,
		sessionExpired: connection.expiresAt <= Date.now()
	};
}
