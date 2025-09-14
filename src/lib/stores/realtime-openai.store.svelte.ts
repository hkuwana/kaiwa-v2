// src/lib/stores/realtime-openai.store.svelte.ts
// Thin SDK-backed realtime store used by demo pages.
// Phase 1: wrap OpenAI Agents Realtime transport with minimal API.

import { realtimeService } from '$lib/services';
import type { Message } from '$lib/server/db/types';
import * as messageService from '$lib/services/message.service';
import { userPreferencesStore } from '$lib/stores/userPreferences.store.svelte';
import type { Voice } from '$lib/types/openai.realtime.types';
import {
	createConnectionWithSession,
	subscribeToSession,
	sendEventViaSession,
	closeSessionConnection,
	type SessionConnection
} from '$lib/services/realtime-agents.service';
import { env as publicEnv } from '$env/dynamic/public';

type SessionData = { client_secret: { value: string; expires_at: number }; session_id?: string };

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
	// Captured events (server/client) for dev UI
	events = $state<Array<{ dir: 'server' | 'client'; type: string; payload: any; ts: number }>>([]);
	private maxEvents = 100;

	// Event queue for ordered processing
	private eventQueue: Array<{ event: any; timestamp: number }> = [];
	private processingEvents = false;

	// Lightweight messages array for UIs that want a direct feed
	messages = $state<Message[]>([]);
	private sessionId: string = '';
	private sessionStartMs: number = 0;
	// Track finalized history item IDs to avoid re-creating partials after final
	private finalizedItemIds = new Set<string>();

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
	private queueEvent(event: any) {
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
				const { event } = this.eventQueue.shift()!;
				await this.processServerEventOrdered(event);
			}
		} finally {
			this.processingEvents = false;
		}
	}

	// Process individual server event in proper order
	private async processServerEventOrdered(serverEvent: any) {
		// Inject a user placeholder as soon as VAD fires so ordering feels natural
		try {
			if (serverEvent?.type === 'input_audio_buffer.speech_started') {
				// Only add one placeholder per utterance
				const hasPlaceholder = this.messages.some(
					(m) =>
						m.role === 'user' &&
						(m.id.startsWith('user_placeholder_') ||
							m.id.startsWith('user_transcribing_') ||
							m.id.startsWith('user_partial_'))
				);
				if (!hasPlaceholder) {
					const ts =
						typeof serverEvent?.audio_start_ms === 'number'
							? Date.now() // we don't have an absolute start time; use now for ordering
							: Date.now();
					const ph = messageService.createUserPlaceholder(this.sessionId, ts);
					// Immediately show an ellipsis until transcription arrives
					const withPh = messageService.removeDuplicateMessages(
						messageService.sortMessagesBySequence([...this.messages, ph])
					);
					this.messages = messageService.updatePlaceholderWithPartial(withPh, '...');
					// Notify listeners so UI mirrors now, before assistant output arrives
					this.emitMessage({
						itemId: 'vad-user-placeholder',
						role: 'user',
						text: '',
						delta: true,
						final: false
					});
				}
			} else if (serverEvent?.type === 'input_audio_buffer.speech_stopped') {
				// Optionally flip the placeholder into a transcribing state while we wait
				this.messages = messageService.updatePlaceholderToTranscribing(this.messages);
				// Ping listeners to mirror updated state
				this.emitMessage({
					itemId: 'vad-user-transcribing',
					role: 'user',
					text: '',
					delta: true,
					final: false
				});
			}
		} catch (err) {
			// Non-fatal; continue normal processing
			if (this.debug) console.debug('[realtime] placeholder hook error:', err);
		}

		const processed = realtimeService.processServerEvent(serverEvent);

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
					}
					this.messages = messageService.updateStreamingMessage(
						this.messages,
						processed.data.text // Pass individual delta, function will accumulate
					);

					// Don't emit individual deltas - wait for final message
				} else {
					// Finalize assistant transcript
					this.aiResponse = processed.data.text;
					this.assistantDelta = '';
					this.messages = messageService.finalizeStreamingMessage(
						this.messages,
						processed.data.text
					);

					// Emit final message stream event
					this.emitMessage({
						itemId: 'transcription-assistant',
						role: 'assistant',
						text: processed.data.text,
						delta: false,
						final: true
					});
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
					// Keep final user transcript visible when no streaming available
					this.userDelta = processed.data.text;
					this.messages = messageService.replaceUserPlaceholderWithFinal(
						this.messages,
						processed.data.text,
						this.sessionId
					);

					// Emit final user message event
					this.emitMessage({
						itemId: 'transcription-user',
						role: 'user',
						text: processed.data.text,
						delta: false,
						final: true
					});
				}
			}
		} else if (processed.type === 'message') {
			// Assistant text message
			if (processed.data.role === 'assistant') {
				this.aiResponse = processed.data.content;
			}
		} else if (processed.type === 'ignore') {
			if (this.debug) {
				console.debug('[realtime] ignored event:', serverEvent?.type, serverEvent);
			}
		}
	}

	// Internal session state
	private connection: SessionConnection | null = null;
	private unsubscribe: (() => void) | null = null;

	async connect(
		sessionData: SessionData,
		mediaStream: MediaStream,
		options?: {
			model?: string;
			voice?: Voice;
			transcriptionLanguage?: string;
			transcriptionModel?: string;
		}
	): Promise<void> {
		try {
			this.error = null;
			// Reset transient tracking for a fresh session
			this.finalizedItemIds.clear();
			this.historyText = {} as Record<string, string>;
			this.assistantDelta = '';
			this.userDelta = '';

			// Create session + transport using existing audio stream
			this.connection = await createConnectionWithSession(sessionData, mediaStream);
			this.sessionId = sessionData.session_id || crypto.randomUUID();
			this.sessionStartMs = Date.now();

			// Subscribe to transport events and queue them for ordered processing
			this.unsubscribe = subscribeToSession(this.connection, {
				onTransportEvent: (serverEvent) => {
					if (this.debug) {
						console.debug('[realtime] transport_event:', serverEvent?.type, serverEvent);
					}
					this.logEvent('server', serverEvent?.type || 'unknown', serverEvent);
					// Queue event for ordered processing instead of immediate processing
					this.queueEvent(serverEvent);
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
			} catch {}

			// Resolve transcription language
			const prefLang = userPreferencesStore.getPreference('targetLanguageId') as unknown as string;
			const transcriptionLanguage = options?.transcriptionLanguage || prefLang || 'en';

			// Send initial session.update with provided options
			const sessionUpdateEvent = realtimeService.createSessionUpdate({
				model: options?.model || publicEnv.PUBLIC_OPEN_AI_MODEL,
				voice: options?.voice || 'verse',
				input_audio_transcription: transcriptionLanguage
					? {
							model: options?.transcriptionModel || 'gpt-4o-transcribe',
							language: transcriptionLanguage
						}
					: undefined
			});
			this.logEvent('client', 'session.update', sessionUpdateEvent);
			sendEventViaSession(this.connection, sessionUpdateEvent);

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

	async disconnect(): Promise<void> {
		if (this.unsubscribe) {
			try {
				this.unsubscribe();
			} catch {}
			this.unsubscribe = null;
		}
		if (this.connection) {
			try {
				closeSessionConnection(this.connection);
			} catch {}
			this.connection = null;
		}
		this.isConnected = false;
		// Clear transient state
		this.finalizedItemIds.clear();
		this.historyText = {} as Record<string, string>;
		this.assistantDelta = '';
		this.userDelta = '';
	}

	// High-level helpers
	sendResponse(): void {
		if (!this.connection) return;
		const ev = realtimeService.createResponse();
		this.logEvent('client', String(ev.type), ev);
		sendEventViaSession(this.connection, ev);
	}

	pttStart(mediaStream: MediaStream): void {
		if (!this.connection) return;
		const ev = realtimeService.createInputAudioBufferClear();
		this.logEvent('client', String(ev.type), ev);
		sendEventViaSession(this.connection, ev);
		realtimeService.resumeAudioInput(mediaStream);
	}

	pttStop(mediaStream: MediaStream): void {
		if (!this.connection) return;
		realtimeService.pauseAudioInput(mediaStream);
		const ev = realtimeService.createInputAudioBufferCommit();
		this.logEvent('client', String(ev.type), ev);
		sendEventViaSession(this.connection, ev);
	}

	updateSessionConfig(config: {
		model?: string;
		voice?: Voice;
		instructions?: string;
		transcriptionLanguage?: string;
		transcriptionModel?: string;
	}): void {
		if (!this.connection) return;
		const prefLang = userPreferencesStore.getPreference('targetLanguageId') as unknown as string;
		const transcriptionLanguage = config.transcriptionLanguage || prefLang || 'en';
		const update = realtimeService.createSessionUpdate({
			...config,
			input_audio_transcription: transcriptionLanguage
				? {
						model: config.transcriptionModel || 'gpt-4o-transcribe',
						language: transcriptionLanguage
					}
				: undefined
		});
		this.logEvent('client', 'session.update', update);
		sendEventViaSession(this.connection, update);
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

	// ===== Message streaming API =====
	private messageListeners = new Set<
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
			} catch {}
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
			const newText = fullText || '';
			let deltaText = '';
			if (newText.startsWith(prev)) {
				deltaText = newText.slice(prev.length);
			} else {
				// Fallback if we missed an update; send whole text once
				deltaText = newText;
			}
			this.historyText[itemId] = newText;

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
							m.role === 'user' && m.id.startsWith('msg_') && m.content.trim() === newText.trim()
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
					this.messages = messageService.updatePlaceholderWithPartial(this.messages, newText);
				}
			}
			return;
		}

		// Non-delta add: treat as final message snapshot
		const finalText = (fullText || prev || '').trim();
		if (!finalText) {
			// Ignore empty finals to avoid blank bubbles
			return;
		}
		this.historyText[itemId] = finalText;
		// Mark this item as finalized so future deltas for this itemId are ignored
		this.finalizedItemIds.add(itemId);
		this.emitMessage({ itemId, role, text: finalText, delta: false, final: true });
		if (role === 'assistant') {
			this.aiResponse = finalText;
			this.assistantDelta = '';
			this.messages = messageService.finalizeStreamingMessage(this.messages, finalText);
		} else {
			this.userDelta = finalText; // keep visible
			this.messages = messageService.replaceUserPlaceholderWithFinal(
				this.messages,
				finalText,
				this.sessionId
			);
		}
	}

	// High-level helper to send a user text message
	sendTextMessage(text: string): void {
		try {
			// Prefer SDK high-level API when available
			// @ts-ignore
			this.connection?.session?.sendMessage?.(text);
		} catch {
			// Fallback to raw event if needed in future
		}
	}
}

export const realtimeOpenAI = new RealtimeOpenAIStore();
