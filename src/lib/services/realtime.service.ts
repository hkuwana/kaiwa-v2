// src/lib/services.ts
// Pure functional realtime service - no classes, no state, just functions
//
// 🚨 MIGRATION NOTICE: This service is being migrated to use @openai/agents-realtime
// For new implementations, use: ./realtime-agents.service.ts
// For migration guide, see: ./migration-guide.example.ts

// ============================================
// MIGRATION EXPORTS (Use these for new code)
// ============================================
export { realtimeCompatibilityService as modernRealtimeService } from './realtime-agents.service';

import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
// Prefer official types from @openai/agents-realtime where available
import type {
	RealtimeClientMessage as ClientEvent,
	RealtimeSessionConfig as SessionConfig,
	TransportEvent as ServerEvent,
	TransportLayerTranscriptDelta as ResponseAudioTranscriptDeltaEvent
} from '@openai/agents-realtime';
// Keep local fallback types for events not covered by the official package
import {
	type ResponseAudioTranscriptDoneEvent,
	type ConversationItemCreatedEvent,
	type ResponseContentPartDoneEvent,
	type TextContent,
	type ConversationItemInputAudioTranscriptionCompletedEvent
} from '$lib/types/openai.realtime.types';
import { env as publicEnv } from '$env/dynamic/public';
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

/**
 * Create a connection to the OpenAI Realtime API
 * @param sessionData - The session data
 * @param audioStream - The audio stream
 * @param model - The model to use
 * @returns The connection
 */
export async function createConnection(
	sessionData: { client_secret: { value: string; expires_at: number } },
	audioStream: MediaStream,
	model: string = env.PUBLIC_OPEN_AI_MODEL || publicEnv.PUBLIC_OPEN_AI_MODEL
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

	// GA: New URL for WebRTC SDP exchange
	const response = await fetch(`https://api.openai.com/v1/realtime/calls?model=${model}`, {
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
		// Log what we're sending to OpenAI for transcript updates
		if (event.type === 'conversation.item.create' && event.item.type === 'message') {
			console.log('📤 Sending to OpenAI - User message:', {
				type: event.type,
				itemType: event.item.type,
				role: event.item.role,
				content: event.item.content,
				timestamp: new Date().toISOString()
			});
		} else if (event.type === 'session.update') {
			console.log('📤 Sending to OpenAI - Session config:', {
				type: event.type,
				instructions: event.session.instructions?.substring(0, 100) + '...',
				voice: event.session.voice,
				transcription: event.session.input_audio_transcription,
				turnDetection: event.session.turn_detection,
				timestamp: new Date().toISOString()
			});
		} else {
			console.log('📤 Sending to OpenAI - Event:', {
				type: event.type,
				event: event,
				timestamp: new Date().toISOString()
			});
		}

		connection.dataChannel.send(JSON.stringify(event));
	} else {
		console.warn('Cannot send event: data channel not open');
	}
}

/**
 * Create a text message event
 * @param text - The text of the message
 * @returns The text message event
 */
// legacy generateItemId removed

export function createResponse(): ClientEvent {
	return {
		type: 'response.create',
		response: {}
	};
}

// === INPUT AUDIO BUFFER CONTROL (for push-to-talk) ===
export function createInputAudioBufferClear(): ClientEvent {
	return { type: 'input_audio_buffer.clear' } as ClientEvent;
}

export function createInputAudioBufferCommit(): ClientEvent {
	return { type: 'input_audio_buffer.commit' } as ClientEvent;
}

/**
 * Create a session update event
 * @param config - The session config
 * @returns The session update event
 */
export type ExtendedSessionConfig = Partial<SessionConfig> & {
    // Allow callers to pass extra fields (ignored by this function)
    voice?: unknown;
    input_audio_transcription?: { model: string; language: string };
};

export function createSessionUpdate(config: ExtendedSessionConfig): ClientEvent {
	// Minimum compatible payload for preview and GA models
	return {
		type: 'session.update',
		session: {
			type: 'realtime',
			model: config.model || env.PUBLIC_OPEN_AI_MODEL || 'gpt-realtime',
			instructions: config.instructions || 'You are a helpful assistant.'
		}
	};

	// Do NOT include voice, input_audio_transcription, or turn_detection here.
	// Configure those at session creation on the server if needed.
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

		// SDK transport layer assistant transcript delta
		case 'audio_transcript_delta': {
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

		case 'response.audio_transcript.delta':
		case 'response.output_audio_transcript.delta': {
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

		case 'response.audio_transcript.done':
		case 'response.output_audio_transcript.done': {
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

		// GA text streaming compatibility
		case 'response.output_text.delta':
		case 'response.text.delta': {
			const anyEvent = event;
			const delta: string | undefined = anyEvent?.delta;
			if (delta && typeof delta === 'string') {
				return {
					type: 'transcription',
					data: {
						type: 'assistant_transcript',
						text: delta,
						isFinal: false,
						timestamp: new Date()
					}
				};
			}
			return { type: 'ignore', data: null };
		}

		case 'response.output_text.done':
		case 'response.text.done': {
			const anyEvent = event;
			const text: string | undefined = anyEvent?.text;
			if (text && typeof text === 'string') {
				return {
					type: 'transcription',
					data: {
						type: 'assistant_transcript',
						text,
						isFinal: true,
						timestamp: new Date()
					}
				};
			}
			return { type: 'ignore', data: null };
		}

		case 'conversation.item.created':
		case 'conversation.item.added': {
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

// legacy getConnectionStatus removed
