// RealtimeWordTimingService
// Responsibility: Word-level timing computation and audio duration tracking
// ~250 lines

import type {
	RealtimeAudioFormatDefinition,
	SDKTransportEvent
} from '$lib/types/openai.realtime.types';
import type { SpeechTiming } from '$lib/server/db/types';
import { SvelteSet } from 'svelte/reactivity';
import { estimateWordDuration } from '$lib/services/realtime-transcript.helper.service';
import { extractAudioDurationMs } from './realtime-message.helpers';

export class RealtimeWordTimingService {
	// Public state - to be synced with store
	messageWordTimings: Record<string, SpeechTiming[]> = {};
	activeWordByMessage: Record<string, number> = {};

	// Private state
	private wordTimingBuffers: Record<string, SpeechTiming[]> = {};
	private wordCharOffsetByMessage: Record<string, number> = {};
	private currentAssistantMessageId: string | null = null;
	private finalizedWordTimings = new SvelteSet<string>();
	private assistantAudioTracking: {
		messageId: string | null;
		startEpochMs: number | null;
		accumulatedMs: number;
		totalDurationMs: number | null;
	} = {
		messageId: null,
		startEpochMs: null,
		accumulatedMs: 0,
		totalDurationMs: null
	};

	private outputAudioFormat: RealtimeAudioFormatDefinition = { type: 'audio/pcm', rate: 24000 };
	private outputSampleRate = 24000;
	private outputAudioChannels = 1;
	private readonly DEFAULT_WORD_DURATION_MS = 220;

	/**
	 * Clear all timing state (called on disconnect)
	 */
	clearState(): void {
		this.messageWordTimings = {};
		this.activeWordByMessage = {};
		this.wordTimingBuffers = {};
		this.wordCharOffsetByMessage = {};
		this.currentAssistantMessageId = null;
		this.finalizedWordTimings.clear();
		this.assistantAudioTracking = {
			messageId: null,
			startEpochMs: null,
			accumulatedMs: 0,
			totalDurationMs: null
		};
	}

	/**
	 * Record a delta of text from the assistant with word timing
	 * Returns the updated timing data to be applied to the message
	 */
	recordAssistantWordDelta(messageId: string, deltaText: string): SpeechTiming[] | null {
		if (!deltaText || !deltaText.trim()) return null;

		this.ensureWordTracking(messageId);
		const tokens = deltaText.match(/\S+|\s+/g) ?? [];
		if (tokens.length === 0) return null;

		const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
		if (!this.assistantAudioTracking.startEpochMs) {
			this.assistantAudioTracking.startEpochMs = now;
			this.assistantAudioTracking.messageId = messageId;
		}

		const baseEpoch = this.assistantAudioTracking.startEpochMs ?? now;
		const relativeNow = Math.max(0, now - baseEpoch);

		const buffer = this.wordTimingBuffers[messageId] ?? [];
		let charOffset = this.wordCharOffsetByMessage[messageId] ?? 0;
		let lastEnd = buffer.length > 0 ? buffer[buffer.length - 1].endMs : 0;

		for (const token of tokens) {
			const length = token.length;
			if (!length) continue;

			const isWhitespace = /^\s+$/.test(token);
			if (isWhitespace) {
				charOffset += length;
				continue;
			}

			const startMs = buffer.length === 0 ? relativeNow : Math.max(relativeNow, lastEnd);
			const endMs = startMs + estimateWordDuration(length, this.DEFAULT_WORD_DURATION_MS);
			buffer.push({
				word: token,
				startMs,
				endMs,
				charStart: charOffset,
				charEnd: charOffset + length
			});
			charOffset += length;
			lastEnd = endMs;
		}

		this.wordTimingBuffers[messageId] = buffer;
		this.wordCharOffsetByMessage[messageId] = charOffset;

		const clonedTimings = buffer.map((entry) => ({ ...entry }));
		this.messageWordTimings = { ...this.messageWordTimings, [messageId]: clonedTimings };
		this.activeWordByMessage = {
			...this.activeWordByMessage,
			[messageId]: clonedTimings.length ? clonedTimings.length - 1 : 0
		};

		return clonedTimings;
	}

	/**
	 * Finalize word timings for a message (called when audio is complete)
	 * Returns the finalized timing data
	 */
	finalizeAssistantWordTimings(
		messageId: string,
		totalDurationMs?: number | null
	): SpeechTiming[] | null {
		if (this.finalizedWordTimings.has(messageId)) {
			return null;
		}

		const buffer = this.wordTimingBuffers[messageId] ?? this.messageWordTimings[messageId];
		if (!buffer || buffer.length === 0) return null;

		const finalBuffer = buffer.map((entry) => ({ ...entry }));

		for (let i = 0; i < finalBuffer.length; i++) {
			const current = finalBuffer[i];
			const next = finalBuffer[i + 1];
			if (next) {
				current.endMs = Math.max(current.startMs, next.startMs);
			} else {
				const fallback =
					typeof totalDurationMs === 'number' && totalDurationMs > 0
						? totalDurationMs
						: current.endMs;
				current.endMs = Math.max(current.startMs + this.DEFAULT_WORD_DURATION_MS, fallback);
			}
		}

		this.messageWordTimings = { ...this.messageWordTimings, [messageId]: finalBuffer };
		this.wordTimingBuffers[messageId] = finalBuffer;
		this.finalizedWordTimings.add(messageId);
		delete this.wordCharOffsetByMessage[messageId];

		return finalBuffer;
	}

	/**
	 * Handle assistant audio delta event
	 */
	handleAssistantAudioDelta(event: SDKTransportEvent): void {
		if (!this.assistantAudioTracking.messageId) return;

		const durationMs = extractAudioDurationMs(
			event,
			this.outputAudioFormat,
			this.outputSampleRate,
			this.outputAudioChannels
		);

		if (durationMs) {
			this.assistantAudioTracking.accumulatedMs += durationMs;
		}
	}

	/**
	 * Handle assistant audio done event
	 */
	handleAssistantAudioDone(event: SDKTransportEvent): void {
		if (!this.assistantAudioTracking.messageId) return;

		const durationMs = extractAudioDurationMs(
			event,
			this.outputAudioFormat,
			this.outputSampleRate,
			this.outputAudioChannels
		);

		if (durationMs) {
			this.assistantAudioTracking.totalDurationMs =
				this.assistantAudioTracking.accumulatedMs + durationMs;
		}
	}

	/**
	 * Promote word timing key when message ID changes
	 * (e.g., streaming -> final message ID)
	 */
	promoteWordTimingKey(oldId: string, newId: string): void {
		if (this.wordTimingBuffers[oldId]) {
			this.wordTimingBuffers[newId] = this.wordTimingBuffers[oldId];
			delete this.wordTimingBuffers[oldId];
		}

		if (this.wordCharOffsetByMessage[oldId] !== undefined) {
			this.wordCharOffsetByMessage[newId] = this.wordCharOffsetByMessage[oldId];
			delete this.wordCharOffsetByMessage[oldId];
		}

		if (this.messageWordTimings[oldId]) {
			this.messageWordTimings = {
				...this.messageWordTimings,
				[newId]: this.messageWordTimings[oldId]
			};
			const newTimings = { ...this.messageWordTimings };
			delete newTimings[oldId];
			this.messageWordTimings = newTimings;
		}

		if (this.activeWordByMessage[oldId] !== undefined) {
			this.activeWordByMessage = {
				...this.activeWordByMessage,
				[newId]: this.activeWordByMessage[oldId]
			};
			const newActive = { ...this.activeWordByMessage };
			delete newActive[oldId];
			this.activeWordByMessage = newActive;
		}

		if (this.finalizedWordTimings.has(oldId)) {
			this.finalizedWordTimings.delete(oldId);
			this.finalizedWordTimings.add(newId);
		}

		if (this.currentAssistantMessageId === oldId) {
			this.currentAssistantMessageId = newId;
		}
	}

	// Private implementation

	private ensureWordTracking(messageId: string): void {
		if (!this.wordTimingBuffers[messageId]) {
			this.wordTimingBuffers[messageId] = [];
		}
		if (this.wordCharOffsetByMessage[messageId] === undefined) {
			this.wordCharOffsetByMessage[messageId] = 0;
		}
	}

	/**
	 * Set audio format info (called when session is configured)
	 */
	setAudioFormat(
		format: RealtimeAudioFormatDefinition,
		sampleRate: number,
		channels: number
	): void {
		this.outputAudioFormat = format;
		this.outputSampleRate = sampleRate;
		this.outputAudioChannels = channels;
	}
}
