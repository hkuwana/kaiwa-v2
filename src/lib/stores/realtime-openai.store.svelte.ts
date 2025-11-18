import { logger } from '$lib/logger';
// src/lib/stores/realtime-openai.store.svelte.ts
// Thin SDK-backed realtime store used by demo pages.
// Phase 1: wrap OpenAI Agents Realtime transport with minimal API.

import { browser } from '$app/environment';
import {
	createConnectionWithSession,
	subscribeToSession,
	sendEventViaSession,
	closeSessionConnection,
	type SessionConnection
} from '$lib/services/realtime-agents.service';
import type { Message, SpeechTiming } from '$lib/server/db/types';
import * as messageService from '$lib/services/message.service';
import { userPreferencesStore } from '$lib/stores/user-preferences.store.svelte';
import type {
	Voice,
	SessionConfig,
	RealtimeAudioConfig,
	SDKTransportEvent,
	RealtimeAudioFormatDefinition
} from '$lib/types/openai.realtime.types';
import { env as publicEnv } from '$env/dynamic/public';
import { SvelteSet, SvelteDate } from 'svelte/reactivity';
import {
	captureOutputAudioConfig,
	estimateDurationFromBase64,
	estimateDurationFromByteLength
} from '$lib/services/realtime-audio.helper.service';
import {
	normalizeTranscript,
	estimateWordDuration
} from '$lib/services/realtime-transcript.helper.service';

type SessionData = { client_secret: { value: string; expires_at: number }; session_id?: string };

type PendingCommitEntry = {
	commitNumber: number;
	createdAt: number;
	itemIds: Set<string>;
	resolvedItemIds: Set<string>;
	pendingResolvedItemIds: Set<string>;
	awaitingResponseCreate: boolean;
	hasReceivedCommitAck: boolean;
	hasReceivedUserTranscript: boolean;
	hasSentResponse: boolean;
	// 🔍 DEBUGGING: Track timestamps for timing analysis
	commitAckTimestamp?: number;
	transcriptTimestamp?: number;
};

// Conversation context interface for linking realtime to database conversation
export interface ConversationContext {
	sessionId: string;
	languageCode: string;
	userId?: string;
}

export class RealtimeOpenAIStore {
	// Reactive UI state
	isConnected = $state(false);
	error = $state<string | null>(null);
	aiResponse = $state<string | null>(null);
	// Streaming deltas
	assistantDelta = $state('');
	userDelta = $state('');
	// Debug flag
	private debug = true;
	// Current instructions for response creation
	private currentInstructions: string | null = null;
	// Captured events (server/client) for dev UI
	events = $state<
		Array<{
			dir: 'server' | 'client';
			type: string;
			payload: SDKTransportEvent | unknown;
			ts: number;
		}>
	>([]);
	private maxEvents = 100;

	// 🔍 DEV: Expose current instructions for debugging
	getCurrentInstructions(): string | null {
		return this.currentInstructions;
	}
	// Conversation context for database persistence
	conversationContext = $state<ConversationContext | null>(null);

	// Audio output device management
	availableOutputDevices = $state<MediaDeviceInfo[]>([]);
	selectedOutputDeviceId = $state<string>('default');
	outputDeviceError = $state<string | null>(null);
	private outputSelectionSupported = false;

	constructor() {
		if (browser) {
			const testAudio = document.createElement('audio');
			try {
				const candidate = testAudio as unknown as { setSinkId?: (id: string) => Promise<void> };
				this.outputSelectionSupported = typeof candidate.setSinkId === 'function';
			} catch {
				this.outputSelectionSupported = false;
			} finally {
				testAudio.remove();
			}
		}
	}

	// Event queue for ordered processing
	private eventQueue: Array<{ event: SDKTransportEvent; timestamp: number }> = [];
	private processingEvents = false;

	// Lightweight messages array for UIs that want a direct feed
	messages = $state<Message[]>([]);
	messageWordTimings = $state<Record<string, SpeechTiming[]>>({});
	activeWordByMessage = $state<Record<string, number>>({});
	private sessionId: string = '';
	private sessionStartMs: number = 0;
	// Track finalized history item IDs to avoid re-creating partials after final
	private finalizedItemIds = new SvelteSet<string>();
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
	private pendingFinalTranscripts: Record<
		string,
		{
			role: 'assistant' | 'user';
			text: string;
			receivedAt: number;
			timeoutId: ReturnType<typeof setTimeout> | null;
		}
	> = {};
	private hasHandledSessionReady = false;
	private sessionReadyListeners = new SvelteSet<() => void>();
	private sessionUpdatedListeners = new SvelteSet<() => void>();
	private transcriptFilter:
		| ((meta: {
				itemId: string;
				role: 'assistant' | 'user';
				text: string;
				isFinal: boolean;
				receivedAt: number;
		  }) => boolean)
		| null = null;

	// Session configuration
	private lastSessionUpdateInstructions: string | null = null;
	private lastSessionUpdateTime: number = 0;
	private readonly SESSION_UPDATE_COOLDOWN_MS = 1000; // Prevent rapid updates
	private pendingCommits: PendingCommitEntry[] = [];

	private logEvent(dir: 'server' | 'client', type: string, payload: SDKTransportEvent | unknown) {
		try {
			this.events = [{ dir, type, payload, ts: Date.now() }, ...this.events].slice(
				0,
				this.maxEvents
			);
		} catch (error) {
			logger.info('something went wrong with the log event of server', error);
		}
	}

	// Queue event for ordered processing
	private queueEvent(event: SDKTransportEvent) {
		this.eventQueue.push({ event, timestamp: Date.now() });
		this.processEventQueue();
	}

	// Process events in chronological order
	private async processEventQueue() {
		if (this.processingEvents) return;
		this.processingEvents = true;

		try {
			// Sort events by timestamp to ensure proper ordering
			this.eventQueue.sort((a, b) => a.timestamp - b.timestamp);

			while (this.eventQueue.length > 0) {
				const eventData = this.eventQueue.shift();
				if (!eventData) break;
				const { event } = eventData;
				await this.processServerEventOrdered(event);
			}
		} finally {
			this.processingEvents = false;
		}
	}

	private ensureWordTracking(messageId: string) {
		if (!this.wordTimingBuffers[messageId]) {
			this.wordTimingBuffers[messageId] = [];
		}
		if (this.wordCharOffsetByMessage[messageId] === undefined) {
			this.wordCharOffsetByMessage[messageId] = 0;
		}
	}

	private recordAssistantWordDelta(messageId: string, deltaText: string) {
		if (!deltaText || !deltaText.trim()) return;
		this.ensureWordTracking(messageId);
		const tokens = deltaText.match(/\S+|\s+/g) ?? [];
		if (tokens.length === 0) return;

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

		const idx = this.messages.findIndex((m) => m.id === messageId);
		if (idx !== -1) {
			const updated = [...this.messages];
			updated[idx] = { ...updated[idx], speechTimings: clonedTimings };
			this.messages = updated;
		}
	}

	private finalizeAssistantWordTimings(messageId: string, totalDurationMs?: number | null) {
		if (this.finalizedWordTimings.has(messageId)) {
			return;
		}
		const buffer = this.wordTimingBuffers[messageId] ?? this.messageWordTimings[messageId];
		if (!buffer || buffer.length === 0) return;
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
		const idx = this.messages.findIndex((m) => m.id === messageId);
		if (idx !== -1) {
			const updated = [...this.messages];
			updated[idx] = { ...updated[idx], speechTimings: finalBuffer };
			this.messages = updated;
		}
		this.finalizedWordTimings.add(messageId);
		delete this.wordCharOffsetByMessage[messageId];

		if (this.debug && finalBuffer.length > 0) {
			const last = finalBuffer[finalBuffer.length - 1];
			const diff =
				typeof totalDurationMs === 'number' && totalDurationMs > 0
					? totalDurationMs - last.endMs
					: null;
			this.logEvent('client', 'timing.finalized', {
				messageId,
				totalDurationMs: totalDurationMs ?? null,
				lastWordEndMs: last.endMs,
				diffMs: diff
			});
		}
	}

	private promoteWordTimingKey(oldId: string, newId: string) {
		if (!oldId || !newId || oldId === newId) return;
		const timings = this.messageWordTimings[oldId];
		const active = this.activeWordByMessage[oldId];
		const buffer = this.wordTimingBuffers[oldId];
		const charOffset = this.wordCharOffsetByMessage[oldId];
		const wasFinalized = this.finalizedWordTimings.has(oldId);

		const nextTimings = timings ? timings.map((entry) => ({ ...entry })) : undefined;
		const nextWordTimings = nextTimings
			? { ...this.messageWordTimings, [newId]: nextTimings }
			: { ...this.messageWordTimings };
		if (nextTimings) {
			delete nextWordTimings[oldId];
			this.messageWordTimings = nextWordTimings;
		}

		const nextActive = { ...this.activeWordByMessage } as Record<string, number>;
		if (typeof active === 'number') {
			nextActive[newId] = active;
		}
		delete nextActive[oldId];
		this.activeWordByMessage = nextActive;

		if (buffer) {
			this.wordTimingBuffers[newId] = buffer;
			delete this.wordTimingBuffers[oldId];
		}
		if (charOffset !== undefined) {
			this.wordCharOffsetByMessage[newId] = charOffset;
			delete this.wordCharOffsetByMessage[oldId];
		}
		if (wasFinalized) {
			this.finalizedWordTimings.add(newId);
			this.finalizedWordTimings.delete(oldId);
		}
	}

	private extractAudioDurationMs(event: SDKTransportEvent): number | null {
		if (!event) return null;

		// Direct audio transport event (WebSocket transport)
		const eventWithData = event as SDKTransportEvent & { data?: ArrayBuffer };
		const audioBuffer = eventWithData.data;
		if (event.type === 'audio' && audioBuffer instanceof ArrayBuffer) {
			return estimateDurationFromByteLength(
				audioBuffer.byteLength,
				this.outputAudioFormat,
				this.outputSampleRate,
				this.outputAudioChannels
			);
		}

		// Official response audio delta events (base64-encoded chunks)
		const eventWithDelta = event as SDKTransportEvent & { delta?: string };
		if (
			(event.type === 'response.output_audio.delta' || event.type === 'response.audio.delta') &&
			typeof eventWithDelta.delta === 'string'
		) {
			const duration = estimateDurationFromBase64(
				eventWithDelta.delta,
				this.outputAudioFormat,
				this.outputSampleRate,
				this.outputAudioChannels
			);
			if (duration) {
				return duration;
			}
		}

		// Legacy / fallback numeric fields for earlier transports
		const legacy = event as unknown as Record<string, unknown>;
		const candidates = [
			legacy?.delta?.duration_ms,
			legacy?.delta?.duration,
			legacy?.delta?.seconds,
			legacy?.duration_ms,
			legacy?.duration,
			legacy?.seconds,
			legacy?.delta?.audio?.duration_ms,
			legacy?.delta?.audio?.duration,
			legacy?.audio?.duration_ms,
			legacy?.audio?.duration
		];
		for (const value of candidates) {
			if (typeof value === 'number' && !Number.isNaN(value) && value > 0) {
				return value > 10 ? value : value * 1000;
			}
		}

		return null;
	}

	private handleAssistantAudioDelta(event: SDKTransportEvent) {
		const messageId = this.currentAssistantMessageId;
		if (!messageId) return;
		if (!this.assistantAudioTracking.messageId) {
			this.assistantAudioTracking.messageId = messageId;
			this.assistantAudioTracking.startEpochMs =
				typeof performance !== 'undefined' ? performance.now() : Date.now();
		}
		const durationMs = this.extractAudioDurationMs(event);
		if (durationMs) {
			this.assistantAudioTracking.accumulatedMs += durationMs;
		}
	}

	private handleAssistantAudioDone(event: SDKTransportEvent) {
		const messageId = this.assistantAudioTracking.messageId || this.currentAssistantMessageId;
		if (!messageId) return;
		const durationMs = this.extractAudioDurationMs(event);
		if (durationMs) {
			this.assistantAudioTracking.totalDurationMs = durationMs;
		}
		const total =
			this.assistantAudioTracking.totalDurationMs ?? this.assistantAudioTracking.accumulatedMs;
		this.finalizeAssistantWordTimings(messageId, total);
	}

	clearWordTimingState(): void {
		this.messageWordTimings = {};
		this.activeWordByMessage = {};
		this.wordTimingBuffers = {};
		this.wordCharOffsetByMessage = {};
		this.currentAssistantMessageId = null;
		this.assistantAudioTracking = {
			messageId: null,
			startEpochMs: null,
			accumulatedMs: 0,
			totalDurationMs: null
		};
		this.outputAudioFormat = { type: 'audio/pcm', rate: 24000 };
		this.outputSampleRate = 24000;
		this.outputAudioChannels = 1;
		this.finalizedWordTimings.clear();
		for (const pending of Object.values(this.pendingFinalTranscripts)) {
			if (pending.timeoutId) {
				clearTimeout(pending.timeoutId);
			}
		}
		this.pendingFinalTranscripts = {};
	}

	private clearPendingTranscript(itemId: string) {
		const pending = this.pendingFinalTranscripts[itemId];
		if (pending?.timeoutId) {
			clearTimeout(pending.timeoutId);
		}
		delete this.pendingFinalTranscripts[itemId];
	}

	private schedulePendingTranscript(
		itemId: string | undefined,
		role: 'assistant' | 'user',
		text: string
	) {
		if (!itemId || !text) return;
		this.clearPendingTranscript(itemId);
		const timeoutId = setTimeout(() => {
			this.flushPendingTranscript(itemId);
		}, 600);
		this.pendingFinalTranscripts[itemId] = {
			role,
			text,
			receivedAt: Date.now(),
			timeoutId
		};
	}

	private flushPendingTranscript(itemId: string) {
		const pending = this.pendingFinalTranscripts[itemId];
		if (!pending) return;
		this.clearPendingTranscript(itemId);
		if (this.finalizedItemIds.has(itemId)) return;
		this.finalizeTranscriptMessage(itemId, pending.role, pending.text);
	}

	private finalizeTranscriptMessage(itemId: string, role: 'assistant' | 'user', text: string) {
		const isUserTranscript = role === 'user';
		if (!text || this.finalizedItemIds.has(itemId)) {
			if (isUserTranscript) {
				this.resolveCommitItem(itemId);
			}
			return;
		}
		const finalText = normalizeTranscript(text);
		if (!finalText) {
			if (isUserTranscript) {
				const commit = this.getOrAssignCommitForTranscript(itemId, 'user');
				if (commit) {
					commit.awaitingResponseCreate = false;
					commit.hasSentResponse = true;
				}
				this.resolveCommitItem(itemId);
			}
			return;
		}
		const receivedAt = Date.now();

		if (isUserTranscript && this.transcriptFilter) {
			const keep = this.transcriptFilter({
				itemId,
				role,
				text: finalText,
				isFinal: true,
				receivedAt
			});
			if (!keep) {
				this.finalizedItemIds.add(itemId);
				this.historyText[itemId] = finalText;
				this.userDelta = '';
				this.messages = messageService.dropUserPlaceholder(this.messages);
				this.clearPendingTranscript(itemId);
				const commit = this.getOrAssignCommitForTranscript(itemId, 'user');
				if (commit) {
					commit.awaitingResponseCreate = false;
					commit.hasSentResponse = true;
				}
				this.resolveCommitItem(itemId);
				return;
			}
		}

		this.historyText[itemId] = finalText;
		this.finalizedItemIds.add(itemId);

		if (isUserTranscript) {
			const commit = this.getOrAssignCommitForTranscript(itemId, 'user');
			if (commit) {
				commit.hasReceivedUserTranscript = true;
				commit.transcriptTimestamp = Date.now(); // 🔍 DEBUGGING: Track timing
				this.maybeSendResponseForCommit(commit, 'user_transcript', { item_id: itemId });
			}
		}

		if (role === 'assistant') {
			const streamingIndex = this.messages.findIndex(
				(m) => m.role === 'assistant' && m.id.startsWith('streaming_')
			);
			const streamingId =
				streamingIndex !== -1 ? this.messages[streamingIndex].id : this.currentAssistantMessageId;
			const totalDuration =
				this.assistantAudioTracking.totalDurationMs ?? this.assistantAudioTracking.accumulatedMs;

			this.aiResponse = finalText;
			this.assistantDelta = '';
			this.messages = messageService.finalizeStreamingMessage(this.messages, finalText);

			let finalMessageId: string | null = null;

			if (streamingIndex !== -1) {
				finalMessageId = this.messages[streamingIndex].id;
			} else {
				for (let i = this.messages.length - 1; i >= 0; i--) {
					const candidate = this.messages[i];
					if (candidate.role === 'assistant' && candidate.id.startsWith('msg_')) {
						finalMessageId = candidate.id;
						break;
					}
				}
			}

			if (streamingId && finalMessageId) {
				this.promoteWordTimingKey(streamingId, finalMessageId);
			}
			if (finalMessageId) {
				this.finalizeAssistantWordTimings(finalMessageId, totalDuration);
			}

			this.currentAssistantMessageId = null;
			this.assistantAudioTracking = {
				messageId: null,
				startEpochMs: null,
				accumulatedMs: 0,
				totalDurationMs: null
			};
		} else {
			this.userDelta = finalText;
			this.messages = messageService.replaceUserPlaceholderWithFinal(
				this.messages,
				finalText,
				this.sessionId
			);
		}

		if (isUserTranscript) {
			this.resolveCommitItem(itemId);
		}

		this.emitMessage({
			itemId,
			role,
			text: finalText,
			delta: false,
			final: true
		});
	}

	// Process server event using new realtime-agents.service approach
	private processServerEventNew(serverEvent: SDKTransportEvent): {
		type: 'message' | 'transcription' | 'connection_state' | 'ignore';
		data:
			| {
					type: 'user_transcript' | 'assistant_transcript';
					text: string;
					isFinal: boolean;
					timestamp: Date;
			  }
			| { role: 'user' | 'assistant'; content: string; timestamp: Date }
			| { state: string }
			| null;
	} {
		switch (serverEvent.type) {
			case 'conversation.item.input_audio_transcription.completed': {
				return {
					type: 'transcription',
					data: {
						type: 'user_transcript',
						text: serverEvent.transcript,
						isFinal: true,
						timestamp: new SvelteDate()
					}
				};
			}

			case 'response.audio_transcript.delta':
			case 'response.output_audio_transcript.delta': {
				return {
					type: 'transcription',
					data: {
						type: 'assistant_transcript',
						text: serverEvent.delta,
						isFinal: false,
						timestamp: new SvelteDate()
					}
				};
			}

			case 'response.audio_transcript.done':
			case 'response.output_audio_transcript.done': {
				return {
					type: 'transcription',
					data: {
						type: 'assistant_transcript',
						text: serverEvent.transcript,
						isFinal: true,
						timestamp: new SvelteDate()
					}
				};
			}

			case 'response.output_text.delta':
			case 'response.text.delta': {
				const delta: string | undefined = serverEvent?.delta;
				if (delta && typeof delta === 'string') {
					return {
						type: 'transcription',
						data: {
							type: 'assistant_transcript',
							text: delta,
							isFinal: false,
							timestamp: new SvelteDate()
						}
					};
				}
				return { type: 'ignore', data: null };
			}

			case 'response.output_text.done':
			case 'response.text.done': {
				const eventWithText = serverEvent as SDKTransportEvent & { text?: string };
				const text: string | undefined = eventWithText.text;

				if (text && typeof text === 'string') {
					return {
						type: 'transcription',
						data: {
							type: 'assistant_transcript',
							text,
							isFinal: true,
							timestamp: new SvelteDate()
						}
					};
				}
				return { type: 'ignore', data: null };
			}

			case 'conversation.item.created':
			case 'conversation.item.added': {
				const createdEvent = serverEvent as SDKTransportEvent & {
					item?: {
						id?: string;
						role?: 'user' | 'assistant';
						type?: string;
						content?: Array<{ type: string; text?: string }>;
					};
				};

				// 🔍 DEBUGGING: Log ALL conversation items (user + assistant)
				logger.debug('🔍 CONVERSATION ITEM CREATED/ADDED:', {
					eventType: serverEvent.type,
					itemId: createdEvent.item?.id,
					role: createdEvent.item?.role,
					type: createdEvent.item?.type,
					hasContent: !!createdEvent.item?.content,
					contentLength: createdEvent.item?.content?.length || 0,
					timestamp: new SvelteDate().toISOString()
				});

				if (createdEvent.item?.type === 'message') {
					const role = createdEvent.item?.role;
					const textParts = createdEvent.item.content?.filter((part) => part.type === 'text') || [];
					const content = textParts.map((part) => part.text).join(' ');

					// Return message events for both user and assistant
					// (no manual tracking - OpenAI server maintains conversation state)
					if (content && (role === 'user' || role === 'assistant')) {
						return {
							type: 'message',
							data: {
								role,
								content,
								timestamp: new SvelteDate()
							}
						};
					}
				}
				return { type: 'ignore', data: null };
			}

			case 'response.content_part.done': {
				const partEvent = serverEvent as SDKTransportEvent & {
					part?: { type: string; text?: string };
				};
				if (partEvent.part?.type === 'text') {
					return {
						type: 'message',
						data: {
							role: 'assistant',
							content: partEvent.part.text,
							timestamp: new SvelteDate()
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

	// Process individual server event in proper order
	private async processServerEventOrdered(serverEvent: SDKTransportEvent) {
		if (
			serverEvent?.type === 'response.output_audio.delta' ||
			serverEvent?.type === 'response.audio.delta'
		) {
			this.handleAssistantAudioDelta(serverEvent);
		} else if (
			serverEvent?.type === 'response.output_audio.done' ||
			serverEvent?.type === 'response.audio.done'
		) {
			this.handleAssistantAudioDone(serverEvent);
		}

		// Process server event using new realtime-agents.service approach
		const processed = this.processServerEventNew(serverEvent);

		if (serverEvent.type === 'session.created' || serverEvent.type === 'session.updated') {
			this.isConnected = true;

			// Trigger session.updated listeners (but not for session.created)
			if (serverEvent.type === 'session.updated') {
				this.handleSessionUpdated();
			}
		}

		if (processed.type === 'transcription') {
			if (processed.data.type === 'assistant_transcript') {
				if (!processed.data.isFinal) {
					// Stream assistant delta
					this.assistantDelta += processed.data.text;

					// Also update message array for streaming
					const hasStreamingMessage = this.messages.some(
						(m) =>
							m.role === 'assistant' &&
							(m.id.startsWith('streaming_') || m.content === '[Assistant is responding...]')
					);
					if (!hasStreamingMessage) {
						const streamingMessage = messageService.createStreamingMessage('', this.sessionId);
						this.messages = messageService.removeDuplicateMessages(
							messageService.sortMessagesBySequence([...this.messages, streamingMessage])
						);
						this.currentAssistantMessageId = streamingMessage.id;
						this.finalizedWordTimings.delete(streamingMessage.id);
					}
					this.messages = messageService.updateStreamingMessage(
						this.messages,
						processed.data.text // Pass individual delta, function will accumulate
					);
					const streaming = this.messages.find(
						(m) => m.role === 'assistant' && m.id.startsWith('streaming_')
					);
					if (streaming) {
						this.currentAssistantMessageId = streaming.id;
						this.recordAssistantWordDelta(streaming.id, processed.data.text);
					}

					// Don't emit individual deltas - wait for final message
				} else {
					// Assistant transcripts may not have item_id in the event itself
					// They get item_ids from conversation.item.created/added events
					const eventWithItemId = serverEvent as SDKTransportEvent & { item_id?: string };
					const itemId = eventWithItemId.item_id;
					this.schedulePendingTranscript(itemId, 'assistant', processed.data.text);
				}
			} else if (processed.data.type === 'user_transcript') {
				if (!processed.data.isFinal) {
					this.userDelta += processed.data.text;

					// Also update message array for user placeholder
					const hasPlaceholder = this.messages.some(
						(m) =>
							m.role === 'user' &&
							(m.id.startsWith('user_placeholder_') ||
								m.id.startsWith('user_transcribing_') ||
								m.id.startsWith('user_partial_'))
					);
					if (!hasPlaceholder) {
						const ph = messageService.createUserPlaceholder(this.sessionId, Date.now());
						this.messages = messageService.removeDuplicateMessages(
							messageService.sortMessagesBySequence([...this.messages, ph])
						);
					}
					this.messages = messageService.updatePlaceholderWithPartial(
						this.messages,
						this.userDelta
					);

					// Don't emit individual user deltas - wait for final message
				} else {
					const eventWithItemId = serverEvent as SDKTransportEvent & { item_id?: string };
					this.schedulePendingTranscript(eventWithItemId.item_id, 'user', processed.data.text);
				}
			}
		} else if (processed.type === 'message') {
			// Assistant text message
			if (processed.data.role === 'assistant') {
				this.aiResponse = processed.data.content;
			}
		} else if (processed.type === 'ignore') {
			// if (this.debug) {
			// 	console.debug('[realtime] ignored event:', serverEvent?.type, serverEvent);
			// }
		}
	}

	// Internal session state
	private connection: SessionConnection | null = null;
	private unsubscribe: (() => void) | null = null;

	/**
	 * Set conversation context for database persistence
	 */
	setConversationContext(context: ConversationContext | null): void {
		this.conversationContext = context;
		if (context) {
			logger.info('📝 Realtime store linked to conversation:', context.sessionId);
		}
	}

	canSelectOutputDevice(): boolean {
		return this.outputSelectionSupported;
	}

	async refreshOutputDevices(): Promise<void> {
		if (!browser) return;

		if (!navigator?.mediaDevices?.enumerateDevices) {
			this.outputDeviceError = 'Browser cannot enumerate audio devices.';
			return;
		}

		try {
			const devices = await navigator.mediaDevices.enumerateDevices();
			const outputs = devices.filter((device) => device.kind === 'audiooutput');
			this.availableOutputDevices = [...outputs];
			this.outputDeviceError = null;
		} catch (error) {
			logger.error('Failed to enumerate audio output devices:', error);
			this.outputDeviceError =
				error instanceof Error ? error.message : 'Failed to enumerate audio output devices';
		}
	}

	async setOutputDevice(deviceId: string): Promise<void> {
		this.selectedOutputDeviceId = deviceId || 'default';

		if (!browser) return;

		if (!this.outputSelectionSupported) {
			this.outputDeviceError = 'Audio output device selection is not supported in this browser.';
			return;
		}

		if (!this.connection?.audioElement) {
			// No active audio element yet; selection will be applied when connection is ready.
			this.outputDeviceError = null;
			return;
		}

		try {
			await this.applySelectedOutputDevice();
			this.outputDeviceError = null;
		} catch (error) {
			logger.error('Failed to set audio output device:', error);
			this.outputDeviceError =
				error instanceof Error ? error.message : 'Failed to change audio output device';
		}
	}

	getAudioOutputDebugInfo() {
		return {
			supported: this.outputSelectionSupported,
			selectedDeviceId: this.selectedOutputDeviceId,
			availableDevices: this.availableOutputDevices.map((device) => ({
				id: device.deviceId,
				label: device.label,
				groupId: device.groupId
			})),
			error: this.outputDeviceError,
			hasConnection: !!this.connection,
			hasAudioElement: !!this.connection?.audioElement
		};
	}

	private async applySelectedOutputDevice(): Promise<void> {
		if (!browser || !this.outputSelectionSupported) return;
		const audioElement = this.connection?.audioElement;
		if (!audioElement) return;

		const elementWithSink = audioElement as HTMLMediaElement & {
			setSinkId?: (sinkId: string) => Promise<void>;
		};

		if (typeof elementWithSink.setSinkId !== 'function') {
			throw new Error('Audio element does not support setSinkId');
		}

		const targetDeviceId = this.selectedOutputDeviceId || 'default';
		await elementWithSink.setSinkId(targetDeviceId);
	}

	async connect(
		sessionData: SessionData,
		mediaStream: MediaStream,
		options?: {
			model?: string;
			voice?: Voice;
			transcriptionLanguage?: string;
			transcriptionModel?: string;
			conversationContext?: ConversationContext;
			skipInitialSessionUpdate?: boolean;
		}
	): Promise<void> {
		try {
			this.error = null;
			// Set conversation context if provided
			if (options?.conversationContext) {
				this.setConversationContext(options.conversationContext);
			}
			// Reset transient tracking for a fresh session
			this.finalizedItemIds.clear();
			this.historyText = {} as Record<string, string>;
			this.assistantDelta = '';
			this.userDelta = '';
			this.hasHandledSessionReady = false;
			this.clearWordTimingState();
			this.pendingCommits = [];

			// Create session + transport using existing audio stream
			this.connection = await createConnectionWithSession(sessionData, mediaStream);
			this.sessionId = sessionData.session_id || crypto.randomUUID();
			this.sessionStartMs = Date.now();

			if (this.outputSelectionSupported) {
				await this.refreshOutputDevices();
				try {
					await this.applySelectedOutputDevice();
				} catch (error) {
					logger.warn('Failed to apply selected audio output device on connect:', error);
				}
			}

			// Subscribe to transport events and queue them for ordered processing
			this.unsubscribe = subscribeToSession(this.connection, {
				onTransportEvent: (serverEvent) => {
					// Filter out delta events and rate limits from console logs
					const isDeltaEvent = serverEvent?.type?.includes('.delta');
					const isRateLimitUpdate = serverEvent?.type === 'rate_limits.updated';

					if (this.debug && !isDeltaEvent && !isRateLimitUpdate) {
						console.debug('[realtime] transport_event:', serverEvent?.type, serverEvent);
					}

					// Highlight important transcription and VAD events as warnings
					if (serverEvent?.type === 'conversation.item.input_audio_transcription.completed') {
						logger.warn('🎤 USER TRANSCRIPTION COMPLETED:', {
							transcript: serverEvent.transcript,
							item_id: serverEvent.item_id,
							event_id: serverEvent.event_id,
							timestamp: new SvelteDate().toISOString()
						});
						logger.warn('🔍 TRANSCRIPT WILL NOW GO THROUGH FILTER', {
							item_id: serverEvent.item_id,
							transcript: serverEvent.transcript,
							note: 'Check logs above for TRANSCRIPT FILTER CHECK with this item_id'
						});
					} else if (
						serverEvent?.type === 'response.audio_transcript.done' ||
						serverEvent?.type === 'response.output_audio_transcript.done'
					) {
						logger.warn('🤖 ASSISTANT TRANSCRIPTION COMPLETED:', {
							transcript: serverEvent.transcript,
							item_id: serverEvent.item_id,
							event_id: serverEvent.event_id
						});
					} else if (serverEvent?.type === 'input_audio_buffer.committed') {
						const commitEvent = serverEvent as SDKTransportEvent & {
							event_id?: string;
							item_id?: string;
						};
						const callStack = new Error().stack?.split('\n').slice(1, 5).join('\n') || 'unknown';

						const activeCommit =
							this.findCommitByItemId(commitEvent.item_id) ??
							this.pendingCommits.find((commit) => !commit.hasReceivedCommitAck) ??
							this.pendingCommits[0];

						if (!activeCommit) {
							logger.warn('⚠️ Received input_audio_buffer.committed with no pending commit', {
								event_id: commitEvent.event_id,
								item_id: commitEvent.item_id,
								callStack
							});
						} else {
							if (commitEvent.item_id) {
								activeCommit.itemIds.add(commitEvent.item_id);
								if (activeCommit.pendingResolvedItemIds.has(commitEvent.item_id)) {
									activeCommit.pendingResolvedItemIds.delete(commitEvent.item_id);
									activeCommit.resolvedItemIds.add(commitEvent.item_id);
								}
							}

							const allItemIdsForCommit = Array.from(activeCommit.itemIds);
							const itemCount = allItemIdsForCommit.length;
							const isMultipleItems = itemCount > 1;

							logger.warn('📤 AUDIO BUFFER COMMITTED (SERVER RESPONSE)', {
								event_id: commitEvent.event_id,
								item_id: commitEvent.item_id,
								timestamp: new SvelteDate().toISOString(),
								callStack,
								explanation: 'This is the server confirming our input_audio_buffer.commit event',
								commitNumber: activeCommit.commitNumber,
								itemCountForThisCommit: itemCount,
								allItemIdsForThisCommit: allItemIdsForCommit
							});

							if (isMultipleItems) {
								logger.warn('⚠️⚠️⚠️ MULTIPLE ITEMS FROM SINGLE COMMIT! ⚠️⚠️⚠️', {
									commitNumber: activeCommit.commitNumber,
									itemIds: allItemIdsForCommit,
									explanation:
										'Server created multiple conversation items from ONE commit - this causes duplicate transcripts!'
								});
							}

							if (commitEvent.item_id) {
								logger.warn('📋 ITEM_ID TO WATCH FOR TRANSCRIPT', {
									item_id: commitEvent.item_id,
									commitNumber: activeCommit.commitNumber,
									itemIndex: `${itemCount} of ?`,
									note: 'This item_id will appear in the next conversation.item.input_audio_transcription.completed event'
								});
							}

							activeCommit.hasReceivedCommitAck = true;
							activeCommit.commitAckTimestamp = Date.now(); // 🔍 DEBUGGING: Track timing

							this.maybeSendResponseForCommit(activeCommit, 'commit_ack', {
								item_id: commitEvent.item_id,
								itemCount
							});

							if (
								activeCommit.hasReceivedCommitAck &&
								activeCommit.itemIds.size > 0 &&
								activeCommit.itemIds.size === activeCommit.resolvedItemIds.size
							) {
								this.pendingCommits = this.pendingCommits.filter((entry) => entry !== activeCommit);
							}
						}
					}

					// Don't log delta events or rate_limits.updated to event log
					if (!isDeltaEvent && !isRateLimitUpdate) {
						this.logEvent('server', serverEvent?.type || 'unknown', serverEvent);
					}
					// Queue event for ordered processing instead of immediate processing
					this.queueEvent(serverEvent);
					if (
						!this.hasHandledSessionReady &&
						(serverEvent?.type === 'session.created' || serverEvent?.type === 'session.updated')
					) {
						this.handleSessionReady();
					}
				},
				onError: (err) => {
					this.error = err?.message || 'Realtime error';
					this.isConnected = false;
				}
			});

			// Additional high-level session signals
			try {
				this.connection.session.on('history_added', (item) => {
					if (this.debug) console.debug('[realtime] history_added:', item);
					this.handleHistoryItem(item, false);
				});
				this.connection.session.on('history_updated', (items) => {
					if (this.debug) console.debug('[realtime] history_updated:', items);
					for (const it of items) this.handleHistoryItem(it, true);
				});
				this.connection.session.on('guardrail_tripped', (...args) => {
					if (this.debug) console.debug('[realtime] guardrail_tripped:', ...args);
				});
			} catch {
				// Intentionally empty - session event handlers are optional
			}

			// Resolve transcription language
			const prefLang = userPreferencesStore.getPreference('targetLanguageId') as unknown as string;
			const transcriptionLanguage = options?.transcriptionLanguage || prefLang || 'en';

			if (!options?.skipInitialSessionUpdate) {
				let initialAudioConfig: RealtimeAudioConfig | undefined = options?.voice
					? { output: { voice: options.voice } }
					: undefined;

				const audioCapture = captureOutputAudioConfig({
					currentFormat: this.outputAudioFormat,
					currentSampleRate: this.outputSampleRate,
					currentChannels: this.outputAudioChannels,
					audioConfig: initialAudioConfig
				});
				this.outputAudioFormat = audioCapture.format as RealtimeAudioFormatDefinition;
				this.outputSampleRate = audioCapture.sampleRate;
				this.outputAudioChannels = audioCapture.channels;
				initialAudioConfig = audioCapture.audioConfig;

				// Send initial session.update with provided options
				const sessionUpdateEvent = {
					type: 'session.update' as const,
					session: {
						model: options?.model || publicEnv.PUBLIC_OPEN_AI_MODEL,
						voice: options?.voice || 'verse',
						input_audio_transcription: transcriptionLanguage
							? {
									model: options?.transcriptionModel || 'gpt-4o-transcribe',
									language: transcriptionLanguage
								}
							: undefined,
						audio: initialAudioConfig,
						// Disable turn detection by default - will be set per mode in updateSessionConfig
						turnDetection: null
					}
				};
				this.logEvent('client', 'session.update', sessionUpdateEvent);
				sendEventViaSession(this.connection, sessionUpdateEvent);
			} else {
				console.debug('Skipping initial session.update; waiting for explicit configuration.');
			}

			this.isConnected = true;
		} catch (e) {
			this.error = e?.message || 'Failed to connect to realtime';
			this.isConnected = false;
			// Best-effort cleanup
			try {
				await this.disconnect();
			} catch {
				logger.warn('something went wrong with disconnect');
			}
			throw e;
		}
	}

	private handleSessionReady(): void {
		if (this.hasHandledSessionReady) return;
		this.hasHandledSessionReady = true;
		this.isConnected = true;

		for (const listener of this.sessionReadyListeners) {
			try {
				listener();
			} catch (error) {
				logger.warn('onSessionReady listener error', error);
			}
		}
	}

	private handleSessionUpdated(): void {
		logger.info('📥 session.updated received - config applied by OpenAI');

		for (const listener of this.sessionUpdatedListeners) {
			try {
				listener();
			} catch (error) {
				logger.warn('onSessionUpdated listener error', error);
			}
		}
	}

	async disconnect(): Promise<void> {
		// Cancel any pending PTT stop timeout
		if (this.pendingPttStopTimeout) {
			clearTimeout(this.pendingPttStopTimeout);
			this.pendingPttStopTimeout = null;
			logger.info('🧹 Cleared pending PTT stop timeout during disconnect');
		}

		if (this.unsubscribe) {
			try {
				this.unsubscribe();
			} catch {
				// Intentionally empty - unsubscribe might already be done
			}
			this.unsubscribe = null;
		}
		if (this.connection) {
			try {
				closeSessionConnection(this.connection);
			} catch {
				// Intentionally empty - connection might already be closed
			}
			this.connection = null;
		}
		this.isConnected = false;
		// Clear transient state
		this.finalizedItemIds.clear();
		this.historyText = {} as Record<string, string>;
		this.assistantDelta = '';
		this.userDelta = '';
		this.clearWordTimingState();

		// Important: clear any accumulated messages so a new session
		// does not mirror history from a previous session
		this.messages = [];
		this.hasHandledSessionReady = false;
		this.sessionReadyListeners.clear();
		this.sessionUpdatedListeners.clear();
		// Clear conversation context
		this.conversationContext = null;
		// Clear stored instructions
		this.currentInstructions = null;
		this.lastSessionUpdateInstructions = null;
		this.pendingCommits = [];
		this.lastSessionUpdateTime = 0;
	}

	sendResponse(): void {
		if (!this.connection) return;

		// Per OpenAI Realtime API docs: response.create automatically uses all conversation
		// items accumulated in the session. The response will have access to:
		// - All previous user input items
		// - All previous assistant response items
		// - Current session-level instructions (set via session.update)
		//
		// IMPORTANT: We do NOT include instructions in response.create because:
		// 1. Response-level instructions are transient and override session instructions for that response only
		// 2. They don't persist in the conversation context
		// 3. This causes context loss after the first response
		// Instead, we rely on session-level instructions set via session.update
		const responsePayload: Record<string, unknown> = {};

		logger.info('📤 CLIENT: Creating response (using session-level instructions)', {
			hasSessionInstructions: !!this.currentInstructions,
			instructionsLength: this.currentInstructions?.length ?? 0,
			instructionsPreview: this.currentInstructions?.substring(0, 100) + '...',
			note: 'Instructions are set at session level, not response level'
		});

		const ev = {
			type: 'response.create' as const,
			response: responsePayload
		};

		this.logEvent('client', String(ev.type), ev);
		sendEventViaSession(this.connection, ev);
	}

	// Track PTT start calls
	private pttStartCallCounter: number = 0;

	pttStart(mediaStream: MediaStream): void {
		this.pttStartCallCounter++;
		const callStack = new Error().stack?.split('\n').slice(1, 5).join('\n') || 'unknown';

		logger.warn('▶️ RealtimeOpenAI: pttStart() CALLED', {
			hasConnection: !!this.connection,
			callNumber: this.pttStartCallCounter,
			streamId: mediaStream?.id,
			callStack,
			timestamp: new SvelteDate().toISOString()
		});

		if (!this.connection) {
			logger.warn('⚠️ pttStart() called but no connection - returning early');
			return;
		}

		// 🔧 FIX: Cancel all old pending commits before starting new PTT session
		// This prevents duplicate responses when PTT is pressed multiple times
		if (this.pendingCommits.length > 0) {
			logger.warn('🧹 CANCELING OLD PENDING COMMITS on new PTT start', {
				oldCommitsCount: this.pendingCommits.length,
				oldCommitNumbers: this.pendingCommits.map((c) => c.commitNumber),
				reason: 'User started new PTT session - old commits should not trigger responses'
			});

			// Mark all old commits as no longer awaiting response
			for (const commit of this.pendingCommits) {
				commit.awaitingResponseCreate = false;
				commit.hasSentResponse = true;
			}

			// Clear the pending commits array
			this.pendingCommits = [];

			logger.warn('✅ CLEARED all pending commits', {
				remainingCommits: this.pendingCommits.length
			});
		}

		// IMPORTANT: Cancel any in-progress response before starting new input
		// This prevents duplicate responses when PTT is pressed during assistant speech
		logger.warn('🛑 CANCELING any in-progress response', {
			startNumber: this.pttStartCallCounter,
			timestamp: new SvelteDate().toISOString()
		});
		const cancelEvent = { type: 'response.cancel' as const };
		this.logEvent('client', String(cancelEvent.type), cancelEvent);
		sendEventViaSession(this.connection, cancelEvent);

		// NOTE: We do NOT send output_audio_buffer.clear here because it truncates
		// the conversation history on the server side, causing the conversation to reset.
		// response.cancel is sufficient to stop the current response.

		// Clear input audio buffer to remove any previous audio input
		const ev = { type: 'input_audio_buffer.clear' as const };
		logger.warn('🗑️ SENDING input_audio_buffer.clear EVENT NOW', {
			startNumber: this.pttStartCallCounter,
			timestamp: new SvelteDate().toISOString()
		});
		this.logEvent('client', String(ev.type), ev);
		sendEventViaSession(this.connection, ev);
		logger.warn('✅ input_audio_buffer.clear EVENT SENT', {
			startNumber: this.pttStartCallCounter
		});

		// Resume audio input
		logger.info('🔊 Enabling audio tracks after clear');
		mediaStream.getAudioTracks().forEach((track) => {
			logger.info(`🔊 Track ${track.id} enabled: ${track.enabled} -> true`);
			track.enabled = true;
		});
	}

	// Track PTT stop calls to detect duplicates
	private lastPttStopTime: number = 0;
	private pttStopCallCounter: number = 0;
	private pttStopDelayMs: number = 500; // Configurable delay before committing audio buffer
	private pendingPttStopTimeout: ReturnType<typeof setTimeout> | null = null; // Track pending stop timeout

	setPttStopDelay(delayMs: number): void {
		this.pttStopDelayMs = delayMs;
		logger.info(`⏱️ PTT stop delay set to ${delayMs}ms`);
	}

	pttStop(mediaStream: MediaStream): void {
		this.pttStopCallCounter++;
		const commitNumber = this.pttStopCallCounter;
		const now = Date.now();
		const timeSinceLastStop = now - this.lastPttStopTime;
		const callStack = new Error().stack?.split('\n').slice(1, 5).join('\n') || 'unknown';

		logger.warn('🛑 RealtimeOpenAI: pttStop() CALLED', {
			hasConnection: !!this.connection,
			callNumber: commitNumber,
			timeSinceLastStop: `${timeSinceLastStop}ms`,
			streamId: mediaStream?.id,
			delayMs: this.pttStopDelayMs,
			callStack,
			timestamp: new SvelteDate().toISOString()
		});

		// Detect rapid duplicate calls (within 200ms) - THIS IS THE PROBLEM!
		if (timeSinceLastStop < 200 && timeSinceLastStop > 0) {
			logger.warn('⚠️⚠️⚠️ DUPLICATE pttStop() DETECTED - IGNORING! ⚠️⚠️⚠️', {
				timeSinceLastStop: `${timeSinceLastStop}ms`,
				callNumber: commitNumber,
				previousCallTime: new SvelteDate(this.lastPttStopTime).toISOString(),
				currentCallTime: new SvelteDate(now).toISOString(),
				explanation: 'Ignoring duplicate call to prevent multiple commits',
				callStack
			});
			return; // Exit early to prevent duplicate commits
		}

		// Cancel any pending stop timeout from previous calls
		if (this.pendingPttStopTimeout) {
			logger.warn('⏱️ Canceling previous pending pttStop timeout', {
				callNumber: commitNumber
			});
			clearTimeout(this.pendingPttStopTimeout);
			this.pendingPttStopTimeout = null;
		}

		this.lastPttStopTime = now;

		if (!this.connection) {
			logger.warn('⚠️ pttStop() called but no connection - returning early');
			return;
		}

		// Schedule the actual stop after a delay to allow final audio chunks to be transmitted
		logger.warn(
			`⏱️ DELAYING audio buffer commit by ${this.pttStopDelayMs}ms to allow final chunks`,
			{
				commitNumber,
				timestamp: new SvelteDate().toISOString()
			}
		);

		this.pendingPttStopTimeout = setTimeout(() => {
			logger.warn('⏰ PTT stop delay complete - now committing buffer', {
				commitNumber,
				delayedBy: this.pttStopDelayMs,
				timestamp: new SvelteDate().toISOString()
			});

			if (!this.connection) {
				logger.warn('⚠️ Connection lost during pttStop delay - aborting commit');
				this.pendingPttStopTimeout = null;
				return;
			}

			// Pause audio input
			logger.info('🔇 Disabling audio tracks before commit');
			mediaStream.getAudioTracks().forEach((track) => {
				logger.info(`🔇 Track ${track.id} enabled: ${track.enabled} -> false`);
				track.enabled = false;
			});

			const ev = { type: 'input_audio_buffer.commit' as const };
			logger.warn('📤 SENDING input_audio_buffer.commit EVENT NOW', {
				commitNumber,
				timestamp: new SvelteDate().toISOString()
			});
			this.logEvent('client', String(ev.type), ev);
			sendEventViaSession(this.connection, ev);
			logger.warn('✅ input_audio_buffer.commit EVENT SENT', {
				commitNumber
			});

			// Track this commit so acknowledgements can be matched in arrival order
			const commitEntry: PendingCommitEntry = {
				commitNumber,
				createdAt: Date.now(),
				itemIds: new SvelteSet(),
				resolvedItemIds: new SvelteSet(),
				pendingResolvedItemIds: new SvelteSet(),
				awaitingResponseCreate: true,
				hasReceivedCommitAck: false,
				hasReceivedUserTranscript: false,
				hasSentResponse: false
			};
			this.pendingCommits.push(commitEntry);

			// 🔧 FIX: Limit pending commits to prevent accumulation of old commits
			if (this.pendingCommits.length > 3) {
				const removed = this.pendingCommits.shift();
				logger.error('🧹 REMOVED OLDEST COMMIT due to limit (>3)', {
					removedCommitNumber: removed?.commitNumber,
					removedItemIds: removed ? Array.from(removed.itemIds) : [],
					remainingCommits: this.pendingCommits.length,
					warning: 'Old commits are not being cleaned up properly!'
				});
			}

			logger.warn('⏳ WAITING FOR input_audio_buffer.committed BEFORE SENDING response.create', {
				commitNumber,
				timestamp: new SvelteDate().toISOString(),
				totalPendingCommits: this.pendingCommits.length
			});

			this.pendingPttStopTimeout = null;
		}, this.pttStopDelayMs);
	}

	private findCommitByItemId(itemId: string | undefined): PendingCommitEntry | undefined {
		if (!itemId) return undefined;
		return this.pendingCommits.find((entry) => entry.itemIds.has(itemId));
	}

	private getOrAssignCommitForTranscript(
		itemId: string | undefined,
		role?: 'user' | 'assistant'
	): PendingCommitEntry | undefined {
		if (!itemId) return undefined;

		// Safety check: only process user transcripts for commits
		// Assistant transcripts should never trigger commit logic
		if (role === 'assistant') {
			logger.warn('⚠️ getOrAssignCommitForTranscript called with assistant role - ignoring', {
				itemId,
				note: 'Assistant transcripts should not trigger commit logic'
			});
			return undefined;
		}

		let commit = this.findCommitByItemId(itemId);
		if (commit) return commit;

		// Fallback: assume transcript belongs to the oldest awaiting commit
		// Only for user transcripts (role check above ensures this)
		commit = this.pendingCommits.find(
			(entry) => entry.awaitingResponseCreate && !entry.hasReceivedUserTranscript
		);
		if (commit) {
			commit.itemIds.add(itemId);
		}
		return commit;
	}

	private maybeSendResponseForCommit(
		commit: PendingCommitEntry,
		reason: string,
		metadata: Record<string, unknown> = {}
	): void {
		if (!commit.awaitingResponseCreate || commit.hasSentResponse) {
			return;
		}
		if (!commit.hasReceivedCommitAck || !commit.hasReceivedUserTranscript) {
			return;
		}

		// Log timing before sending response
		const now = Date.now();
		const timeSinceCommitAck = commit.commitAckTimestamp ? now - commit.commitAckTimestamp : 'N/A';
		const timeSinceTranscript = commit.transcriptTimestamp
			? now - commit.transcriptTimestamp
			: 'N/A';

		logger.warn('✅ SENDING response.create (with 200ms delay)', {
			commitNumber: commit.commitNumber,
			reason,
			...metadata
		});
		commit.hasSentResponse = true;
		commit.awaitingResponseCreate = false;

		// 🔧 FIX: Add 200ms delay to allow server to fully commit user conversation item
		// This prevents race condition where response.create is sent before the server
		// has finished creating the user's conversation.item.created event
		setTimeout(() => {
			logger.warn('⏱️ DELAYED RESPONSE - Sending response.create NOW', {
				commitNumber: commit.commitNumber,
				delayMs: 200
			});
			this.sendResponse();

			// 🔧 FIX: Clean up IMMEDIATELY after sending response (no nested setTimeout)
			const commitIndex = this.pendingCommits.indexOf(commit);
			if (commitIndex !== -1) {
				this.pendingCommits.splice(commitIndex, 1);
				logger.warn('🧹 CLEANED UP COMMIT immediately after response', {
					commitNumber: commit.commitNumber,
					itemIds: Array.from(commit.itemIds),
					remainingPendingCommits: this.pendingCommits.length
				});
			} else {
				logger.info('ℹ️ Commit already cleaned up (likely by resolveCommitItem)', {
					commitNumber: commit.commitNumber,
					note: 'This is normal - commits are cleaned up when all items are resolved'
				});
			}
		}, 200);
	}

	private resolveCommitItem(itemId: string): void {
		if (!itemId) return;
		const commit =
			this.findCommitByItemId(itemId) ??
			this.pendingCommits.find((entry) => entry.awaitingResponseCreate) ??
			null;

		if (!commit) return;

		if (!commit.hasReceivedCommitAck || !commit.itemIds.has(itemId)) {
			commit.pendingResolvedItemIds.add(itemId);
			return;
		}

		commit.resolvedItemIds.add(itemId);

		if (
			commit.hasReceivedCommitAck &&
			commit.itemIds.size > 0 &&
			commit.itemIds.size === commit.resolvedItemIds.size
		) {
			this.pendingCommits = this.pendingCommits.filter((entry) => entry !== commit);
		}
	}

	private shouldSendSessionUpdate(newInstructions: string | undefined): boolean {
		const now = Date.now();
		const timeSinceLastUpdate = now - this.lastSessionUpdateTime;

		// Check if instructions have actually changed
		if (newInstructions && newInstructions === this.lastSessionUpdateInstructions) {
			logger.info('ℹ️ Skipping session.update - instructions unchanged');
			return false;
		}

		// Enforce cooldown to prevent rapid successive updates
		if (timeSinceLastUpdate < this.SESSION_UPDATE_COOLDOWN_MS) {
			logger.info('⏱️ Skipping session.update - cooldown active', {
				timeSinceLastUpdate,
				cooldownMs: this.SESSION_UPDATE_COOLDOWN_MS
			});
			return false;
		}

		return true;
	}

	updateSessionConfig(config: {
		model?: string;
		voice?: Voice;
		instructions?: string;
		transcriptionLanguage?: string;
		transcriptionModel?: string;
		audio?: SessionConfig['audio'];
		turnDetection?: SessionConfig['turnDetection'] | null;
	}): void {
		try {
			logger.info('🔧 updateSessionConfig CALLED', {
				hasConnection: !!this.connection,
				hasInstructions: !!config.instructions,
				instructionsLength: config.instructions?.length ?? 0
			});

			if (!this.connection) {
				logger.warn('⚠️ updateSessionConfig called but no connection!');
				return;
			}

			// 📋 LOG INSTRUCTIONS FOR DEBUGGING
			if (config.instructions) {
				logger.info('🎯 [Realtime] updateSessionConfig called with instructions:', {
					length: config.instructions.length,
					preview: config.instructions.substring(0, 200) + '...'
				});
			}

			// Per OpenAI Realtime API documentation: session.update is for configuration only
			// (instructions, voice, audio format, VAD settings). The API automatically maintains
			// conversation state separately through server events (conversation.item.added, etc).
			// Excessive session.update calls should not affect conversation context, but we throttle
			// them to avoid disrupting session state and to be efficient.
			if (!this.shouldSendSessionUpdate(config.instructions)) {
				// ⚠️ WARNING: If we skip sending session.update, the instructions are NOT sent to OpenAI!
				// This will cause the model to not follow the instructions.
				logger.warn('⚠️ SKIPPING session.update - instructions NOT sent to OpenAI!', {
					reason: 'Cooldown active or instructions unchanged',
					instructionsStored: !!config.instructions,
					instructionsLength: config.instructions?.length ?? 0
				});
				// Still store instructions locally for response creation even if we skip sending
				if (config.instructions) {
					this.currentInstructions = config.instructions;
				}
				return;
			}
		} catch (error) {
			logger.error('❌ Error in updateSessionConfig logging:', error);
			// Don't return - continue with the session update even if logging fails
		}

		const prefLang = userPreferencesStore.getPreference('targetLanguageId') as unknown as string;
		const transcriptionLanguage = config.transcriptionLanguage || prefLang || 'en';
		let audioConfig: RealtimeAudioConfig | undefined =
			config.audio ||
			(transcriptionLanguage
				? ({
						input: {
							transcription: {
								model: config.transcriptionModel || 'gpt-4o-transcribe',
								language: transcriptionLanguage
							},
							turnDetection: undefined
						},
						output: config.voice ? { voice: config.voice } : undefined
					} as RealtimeAudioConfig)
				: undefined);
		const audioCapture = captureOutputAudioConfig({
			currentFormat: this.outputAudioFormat,
			currentSampleRate: this.outputSampleRate,
			currentChannels: this.outputAudioChannels,
			audioConfig
		});
		this.outputAudioFormat = audioCapture.format as RealtimeAudioFormatDefinition;
		this.outputSampleRate = audioCapture.sampleRate;
		this.outputAudioChannels = audioCapture.channels;
		audioConfig = audioCapture.audioConfig;
		const update = {
			type: 'session.update' as const,
			session: {
				...config,
				input_audio_transcription: transcriptionLanguage
					? {
							model: config.transcriptionModel || 'gpt-4o-transcribe',
							language: transcriptionLanguage
						}
					: undefined,
				audio: audioConfig,
				turnDetection: config.turnDetection ?? null
			}
		};

		// 🔍 DEBUGGING: Verify instructions are actually in the session object
		const sessionHasInstructions = 'instructions' in update.session && !!update.session.instructions;
		const sessionInstructionsLength = update.session.instructions?.length ?? 0;

		logger.info('📤 SENDING session.update (passed cooldown check)', {
			hasInstructions: !!config.instructions,
			instructionsLength: config.instructions?.length ?? 0,
			timeSinceLastUpdate: Date.now() - this.lastSessionUpdateTime,
			// Verify instructions are in the actual update object being sent
			sessionObjectHasInstructions: sessionHasInstructions,
			sessionObjectInstructionsLength: sessionInstructionsLength,
			instructionsPreview: update.session.instructions
				? update.session.instructions.substring(0, 100) + '...'
				: 'none'
		});

		if (config.instructions && !sessionHasInstructions) {
			logger.error('❌ CRITICAL: Instructions were provided but NOT included in session.update!', {
				configInstructionsLength: config.instructions.length,
				sessionKeys: Object.keys(update.session)
			});
		}

		this.logEvent('client', 'session.update', update);
		sendEventViaSession(this.connection, update);

		// Update tracking variables
		this.lastSessionUpdateTime = Date.now();
		if (config.instructions) {
			this.lastSessionUpdateInstructions = config.instructions;
		}

		// Store instructions for response creation
		if (config.instructions) {
			this.currentInstructions = config.instructions;
			logger.info('📝 Stored instructions for response creation:', {
				length: config.instructions.length,
				preview: config.instructions.substring(0, 200) + '...'
			});
		}
	}

	// UI helpers
	clearError(): void {
		this.error = null;
	}
	setError(msg: string): void {
		this.error = msg;
	}
	clearAiResponse(): void {
		this.aiResponse = null;
	}
	setAiResponse(text: string | null): void {
		this.aiResponse = text;
	}
	clearDeltas(): void {
		this.assistantDelta = '';
		this.userDelta = '';
	}

	enableDebug(v: boolean): void {
		this.debug = v;
	}

	clearEvents(): void {
		this.events = [];
	}

	setTranscriptFilter(
		filter:
			| ((meta: {
					itemId: string;
					role: 'assistant' | 'user';
					text: string;
					isFinal: boolean;
					receivedAt: number;
			  }) => boolean)
			| null
	): void {
		this.transcriptFilter = filter;
	}

	onSessionReady(fn: () => void): () => void {
		this.sessionReadyListeners.add(fn);
		if (this.hasHandledSessionReady) {
			setTimeout(() => {
				try {
					fn();
				} catch (error) {
					logger.warn('onSessionReady listener error', error);
				}
			}, 0);
		}
		return () => {
			try {
				this.sessionReadyListeners.delete(fn);
			} catch {
				// Listener might already be removed during disconnect
			}
		};
	}

	onSessionUpdated(fn: () => void): () => void {
		this.sessionUpdatedListeners.add(fn);
		return () => {
			try {
				this.sessionUpdatedListeners.delete(fn);
			} catch {
				// Listener might already be removed during disconnect
			}
		};
	}

	// ===== Message streaming API =====
	private messageListeners = new SvelteSet<
		(ev: {
			itemId: string;
			role: 'user' | 'assistant';
			text: string;
			delta: boolean;
			final: boolean;
		}) => void
	>();
	private historyText: Record<string, string> = {};

	onMessageStream(
		fn: (ev: {
			itemId: string;
			role: 'user' | 'assistant';
			text: string;
			delta: boolean;
			final: boolean;
		}) => void
	): () => void {
		this.messageListeners.add(fn);
		return () => {
			try {
				this.messageListeners.delete(fn);
			} catch {
				// Intentionally empty - listener might already be removed
			}
		};
	}

	private emitMessage(ev: {
		itemId: string;
		role: 'user' | 'assistant';
		text: string;
		delta: boolean;
		final: boolean;
	}) {
		for (const fn of this.messageListeners) {
			try {
				fn(ev);
			} catch (e) {
				logger.warn('onMessageStream listener error', e);
			}
		}
	}

	private extractMessageText(
		content: Array<{ type: string; text?: string; transcript?: string }> = []
	): string {
		if (!Array.isArray(content)) return '';
		const texts = content
			.map((c) => {
				if (!c || typeof c !== 'object') return '';
				if (c.type === 'input_text' || c.type === 'text') return c.text ?? '';
				if (c.type === 'audio') return c.transcript ?? '';
				if (c.type === 'input_audio') return c.transcript ?? '';
				return '';
			})
			.filter(Boolean);

		return texts.join('\n');
	}

	private handleHistoryItem(
		item: {
			type?: string;
			itemId?: string;
			id?: string;
			role?: string;
			content?: Array<{ type: string; text?: string; transcript?: string }>;
		},
		delta: boolean
	) {
		if (!item || item.type !== 'message') return;
		const itemId = item.itemId || item.id || '';
		if (!itemId) return;
		const role = (item.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant';
		const fullText = this.extractMessageText(item.content || []);
		const prev = this.historyText[itemId] || '';

		// Compute delta chunk when streaming
		if (delta) {
			const normalizedText = normalizeTranscript(fullText);
			if (!normalizedText) {
				this.historyText[itemId] = '';
				if (role === 'assistant') {
					this.assistantDelta = '';
					this.messages = messageService.dropStreamingMessage(this.messages);
				} else {
					this.userDelta = '';
					this.messages = messageService.dropUserPlaceholder(this.messages);
				}
				return;
			}

			let deltaText = '';
			if (normalizedText.startsWith(prev)) {
				deltaText = normalizedText.slice(prev.length);
			} else {
				deltaText = normalizedText;
			}
			this.historyText[itemId] = normalizedText;

			if (deltaText) {
				this.emitMessage({ itemId, role, text: deltaText, delta: true, final: false });
				// Keep assistantDelta/userDelta in sync for simple UIs
				if (role === 'assistant') this.assistantDelta += deltaText;
				else this.userDelta += deltaText;

				// Update UI messages for assistant/user placeholders
				if (role === 'assistant') {
					// Check if we have a streaming message, if not create one
					const hasStreamingMessage = this.messages.some(
						(m) =>
							m.role === 'assistant' &&
							(m.id.startsWith('streaming_') || m.content === '[Assistant is responding...]')
					);
					if (!hasStreamingMessage) {
						const streamingMessage = messageService.createStreamingMessage('', this.sessionId);
						this.messages = messageService.removeDuplicateMessages(
							messageService.sortMessagesBySequence([...this.messages, streamingMessage])
						);

						// If this is the first assistant output of the session,
						// bias its ordering to appear before any user message
						// by assigning an early sequence id.
						const isFirstAssistant = !this.messages.some((m) => m.role === 'assistant');
						if (isFirstAssistant) {
							const idx = this.messages.findIndex(
								(m) => m.role === 'assistant' && m.id.startsWith('streaming_')
							);
							if (idx !== -1) {
								const forcedSeqBase = Math.max(0, this.sessionStartMs - 1);
								this.messages[idx] = {
									...this.messages[idx],
									sequenceId: `${forcedSeqBase}_000000`
								};
								this.messages = messageService.sortMessagesBySequence(this.messages);
							}
						}
					}
					this.messages = messageService.updateStreamingMessage(this.messages, deltaText);
				} else {
					// If this history item is already finalized, ignore any further user deltas
					if (this.finalizedItemIds.has(itemId)) {
						return;
					}
					// Also guard against recreating a partial if a final message with the same
					// content already exists in our visible message list
					const hasIdenticalFinal = this.messages.some(
						(m) =>
							m.role === 'user' &&
							m.id.startsWith('msg_') &&
							m.content.trim() === normalizedText.trim()
					);
					if (hasIdenticalFinal) {
						return;
					}
					// ensure placeholder exists
					const hasPlaceholder = this.messages.some(
						(m) =>
							m.role === 'user' &&
							(m.id.startsWith('user_placeholder_') ||
								m.id.startsWith('user_transcribing_') ||
								m.id.startsWith('user_partial_'))
					);
					if (!hasPlaceholder) {
						const ph = messageService.createUserPlaceholder(this.sessionId, Date.now());
						this.messages = messageService.removeDuplicateMessages(
							messageService.sortMessagesBySequence([...this.messages, ph])
						);
					}
					this.messages = messageService.updatePlaceholderWithPartial(
						this.messages,
						normalizedText
					);
				}
			}
			return;
		}

		// Non-delta add: treat as final message snapshot
		const finalText = normalizeTranscript(fullText || prev);
		if (!finalText) {
			if (role === 'assistant') {
				this.assistantDelta = '';
				this.messages = messageService.dropStreamingMessage(this.messages);
			} else {
				this.userDelta = '';
				this.messages = messageService.dropUserPlaceholder(this.messages);
			}
			return;
		}
		this.clearPendingTranscript(itemId);
		this.finalizeTranscriptMessage(itemId, role, finalText);
	}

	// High-level helper to send a user text message
	sendTextMessage(text: string): void {
		try {
			// Prefer SDK high-level API when available
			this.connection?.session?.sendMessage?.(text);
		} catch {
			// Fallback to raw event if needed in future
		}
	}
}

export const realtimeOpenAI = new RealtimeOpenAIStore();
