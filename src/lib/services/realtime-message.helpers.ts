// Pure utility functions for message and event handling
// These have NO state and are fully testable

import type { ContentBlock, SDKTransportEvent, RealtimeAudioFormatDefinition } from '$lib/types/openai.realtime.types';
import type { Message } from '$lib/server/db/types';

/**
 * Extract text content from message content blocks
 */
export function extractMessageText(content: ContentBlock[]): string | null {
	if (!content || content.length === 0) return null;

	for (const block of content) {
		if ('text' in block && block.text) {
			return block.text;
		}
	}
	return null;
}

/**
 * Classify server events into categories for routing
 */
export function classifyServerEvent(event: SDKTransportEvent): 'transcription' | 'message' | 'connection_state' | 'ignore' {
	const type = event.type;

	if (type === 'conversation.item.input_audio_transcription.started' ||
	    type === 'conversation.item.input_audio_transcription.delta' ||
	    type === 'conversation.item.input_audio_transcription.completed') {
		return 'transcription';
	}

	if (type === 'response.text.delta' ||
	    type === 'response.text.done' ||
	    type === 'response.audio.delta' ||
	    type === 'response.audio.done' ||
	    type === 'response.audio_transcript.delta' ||
	    type === 'response.audio_transcript.done' ||
	    type === 'response.created' ||
	    type === 'response.done') {
		return 'message';
	}

	if (type === 'session.created' ||
	    type === 'session.updated' ||
	    type === 'session.ready') {
		return 'connection_state';
	}

	return 'ignore';
}

/**
 * Extract audio duration from event in milliseconds
 * Used by RealtimeWordTimingService
 */
export function extractAudioDurationMs(
	event: SDKTransportEvent,
	format: RealtimeAudioFormatDefinition,
	sampleRate: number,
	channels: number
): number | null {
	if (!event.event || !('delta' in event.event)) {
		return null;
	}

	const delta = event.event.delta as string | undefined;
	if (!delta) return null;

	try {
		const audioBytes = Buffer.from(delta, 'base64').length;
		const bytesPerSample = 2; // 16-bit = 2 bytes
		const totalSamples = audioBytes / (bytesPerSample * channels);
		const durationSeconds = totalSamples / sampleRate;
		return durationSeconds * 1000;
	} catch {
		return null;
	}
}

/**
 * Log event helper - creates event log entry
 */
export function logEvent(
	dir: 'server' | 'client',
	type: string,
	payload: any
): { dir: 'server' | 'client'; type: string; payload: any; ts: number } {
	return {
		dir,
		type,
		payload,
		ts: Date.now()
	};
}

/**
 * Find message by ID
 */
export function findMessageById(messages: Message[], messageId: string): Message | undefined {
	return messages.find(m => m.id === messageId);
}

/**
 * Find message index by ID
 */
export function findMessageIndexById(messages: Message[], messageId: string): number {
	return messages.findIndex(m => m.id === messageId);
}
