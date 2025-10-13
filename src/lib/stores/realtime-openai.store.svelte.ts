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
	events = $state<Array<{ dir: 'server' | 'client'; type: string; payload: any; ts: number }>>([]);
	private maxEvents = 100;
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
	private transcriptFilter:
		| ((meta: {
				itemId: string;
				role: 'assistant' | 'user';
				text: string;
				isFinal: boolean;
				receivedAt: number;
		  }) => boolean)
		| null = null;

	private logEvent(dir: 'server' | 'client', type: string, payload: any) {
		try {
			this.events = [{ dir, type, payload, ts: Date.now() }, ...this.events].slice(
				0,
				this.maxEvents
			);
		} catch (error) {
			console.log('something went wrong with the log event of server', error);
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
		const audioBuffer = (event as any)?.data;
		if (event.type === 'audio' && audioBuffer instanceof ArrayBuffer) {
			return estimateDurationFromByteLength(
				audioBuffer.byteLength,
				this.outputAudioFormat,
				this.outputSampleRate,
				this.outputAudioChannels
			);
		}

		// Official response audio delta events (base64-encoded chunks)
		if (
			(event.type === 'response.output_audio.delta' || event.type === 'response.audio.delta') &&
			typeof (event as any)?.delta === 'string'
		) {
			const duration = estimateDurationFromBase64(
				(event as any).delta as string,
				this.outputAudioFormat,
				this.outputSampleRate,
				this.outputAudioChannels
			);
			if (duration) {
				return duration;
			}
		}

		// Legacy / fallback numeric fields for earlier transports
		const legacy = event as unknown as Record<string, any>;
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
		if (!text || this.finalizedItemIds.has(itemId)) return;
		const finalText = normalizeTranscript(text);
		if (!finalText) return;
		const receivedAt = Date.now();

		if (role === 'user' && this.transcriptFilter) {
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
				return;
			}
		}

		this.historyText[itemId] = finalText;
		this.finalizedItemIds.add(itemId);

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
		data: any;
	} {
		switch (serverEvent.type) {
			case 'conversation.item.input_audio_transcription.completed': {
				return {
					type: 'transcription',
					data: {
						type: 'user_transcript',
						text: (serverEvent as any).transcript,
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
						text: (serverEvent as any).delta,
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
						text: (serverEvent as any).transcript,
						isFinal: true,
						timestamp: new SvelteDate()
					}
				};
			}

			case 'response.output_text.delta':
			case 'response.text.delta': {
				const delta: string | undefined = (serverEvent as any)?.delta;
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
				const text: string | undefined = (serverEvent as any)?.text;
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
				const createdEvent = serverEvent as any;
				if (createdEvent.item?.type === 'message' && createdEvent.item?.role === 'assistant') {
					const textParts =
						createdEvent.item.content?.filter((part: any) => part.type === 'text') || [];

					const content = textParts.map((part: any) => part.text).join(' ');

					if (content) {
						return {
							type: 'message',
							data: {
								role: 'assistant',
								content,
								timestamp: new SvelteDate()
							}
						};
					}
				}
				return { type: 'ignore', data: null };
			}

			case 'response.content_part.done': {
				const partEvent = serverEvent as any;
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
					this.schedulePendingTranscript(
						(serverEvent as any)?.item_id,
						'assistant',
						processed.data.text
					);
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
					this.schedulePendingTranscript(
						(serverEvent as any)?.item_id,
						'user',
						processed.data.text
					);
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
			console.log('📝 Realtime store linked to conversation:', context.sessionId);
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
			console.error('Failed to enumerate audio output devices:', error);
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
			console.error('Failed to set audio output device:', error);
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

			// Create session + transport using existing audio stream
			this.connection = await createConnectionWithSession(sessionData, mediaStream);
			this.sessionId = sessionData.session_id || crypto.randomUUID();
			this.sessionStartMs = Date.now();

			if (this.outputSelectionSupported) {
				await this.refreshOutputDevices();
				try {
					await this.applySelectedOutputDevice();
				} catch (error) {
					console.warn('Failed to apply selected audio output device on connect:', error);
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
						console.warn('🎤 USER TRANSCRIPTION COMPLETED:', {
							transcript: serverEvent.transcript,
							item_id: serverEvent.item_id,
							event_id: serverEvent.event_id
						});
					} else if (
						serverEvent?.type === 'response.audio_transcript.done' ||
						serverEvent?.type === 'response.output_audio_transcript.done'
					) {
						console.warn('🤖 ASSISTANT TRANSCRIPTION COMPLETED:', {
							transcript: serverEvent.transcript,
							item_id: serverEvent.item_id,
							event_id: serverEvent.event_id
						});
					} else if (serverEvent?.type === 'input_audio_buffer.committed') {
						console.warn('📤 AUDIO BUFFER COMMITTED', {
							event_id: serverEvent.event_id,
							item_id: serverEvent.item_id
						});
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
				this.connection.session.on('history_added', (item: any) => {
					if (this.debug) console.debug('[realtime] history_added:', item);
					this.handleHistoryItem(item, false);
				});
				this.connection.session.on('history_updated', (items: any[]) => {
					if (this.debug) console.debug('[realtime] history_updated:', items);
					for (const it of items) this.handleHistoryItem(it, true);
				});
				this.connection.session.on('guardrail_tripped', (...args: any[]) => {
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
					currentFormat: this.outputAudioFormat as any,
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
						turnDetection: null
					}
				};
				this.logEvent('client', 'session.update', sessionUpdateEvent);
				sendEventViaSession(this.connection, sessionUpdateEvent);
			} else {
				console.debug('Skipping initial session.update; waiting for explicit configuration.');
			}

			this.isConnected = true;
		} catch (e: any) {
			this.error = e?.message || 'Failed to connect to realtime';
			this.isConnected = false;
			// Best-effort cleanup
			try {
				await this.disconnect();
			} catch {
				console.warn('something went wrong with disconnect');
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
				console.warn('onSessionReady listener error', error);
			}
		}
	}

	async disconnect(): Promise<void> {
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
		this.hasHandledSessionReady = false;
		this.sessionReadyListeners.clear();
		// Clear conversation context
		this.conversationContext = null;
		// Clear stored instructions
		this.currentInstructions = null;
	}

	// High-level helpers
	sendResponse(): void {
		if (!this.connection) return;

		// Create response with instructions if available
		const responsePayload: Record<string, any> = {};
		if (this.currentInstructions) {
			responsePayload.instructions = this.currentInstructions;
			console.log('📤 CLIENT: Creating response with instructions', {
				instructionsLength: this.currentInstructions.length,
				instructionsPreview: this.currentInstructions.substring(0, 100) + '...'
			});
		}

		const ev = {
			type: 'response.create' as const,
			response: responsePayload
		};

		this.logEvent('client', String(ev.type), ev);
		sendEventViaSession(this.connection, ev);
	}

	pttStart(mediaStream: MediaStream): void {
		if (!this.connection) return;
		const ev = { type: 'input_audio_buffer.clear' as const };
		this.logEvent('client', String(ev.type), ev);
		sendEventViaSession(this.connection, ev);
		// Resume audio input
		mediaStream.getAudioTracks().forEach((track) => (track.enabled = true));
	}

	pttStop(mediaStream: MediaStream): void {
		if (!this.connection) return;
		// Pause audio input
		mediaStream.getAudioTracks().forEach((track) => (track.enabled = false));
		const ev = { type: 'input_audio_buffer.commit' as const };
		this.logEvent('client', String(ev.type), ev);
		sendEventViaSession(this.connection, ev);
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
		if (!this.connection) return;
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
			currentFormat: this.outputAudioFormat as any,
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
		this.logEvent('client', 'session.update', update);
		sendEventViaSession(this.connection, update);

		// Store instructions for response creation
		if (config.instructions) {
			this.currentInstructions = config.instructions;
			console.log('📝 Stored instructions for response creation:', {
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
					console.warn('onSessionReady listener error', error);
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
				console.warn('onMessageStream listener error', e);
			}
		}
	}

	private extractMessageText(content: any[] = []): string {
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

	private handleHistoryItem(item: any, delta: boolean) {
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
