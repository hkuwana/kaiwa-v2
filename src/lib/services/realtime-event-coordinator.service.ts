// RealtimeEventCoordinator
// Responsibility: Event processing, transcript finalization, commit tracking, response creation
// ~500 lines
//
// KEY ARCHITECTURE: This service does NOT hold the messages array.
// Instead, it provides methods that trigger callbacks when messages should be updated.
// The store maintains the reactive `messages` state and applies updates.

import type { SDKTransportEvent, SessionConfig } from '$lib/types/openai.realtime.types';
import { SvelteSet } from 'svelte/reactivity';
import { logEvent, classifyServerEvent } from './realtime-message.helpers';

export interface TranscriptFilter {
	(meta: {
		itemId: string;
		role: 'assistant' | 'user';
		text: string;
		isFinal: boolean;
		receivedAt: number;
	}): boolean;
}

interface PendingCommitEntry {
	commitNumber: number;
	createdAt: number;
	itemIds: Set<string>;
	resolvedItemIds: Set<string>;
	pendingResolvedItemIds: Set<string>;
	awaitingResponseCreate: boolean;
	hasReceivedCommitAck: boolean;
	hasReceivedUserTranscript: boolean;
	hasSentResponse: boolean;
}

export class RealtimeEventCoordinator {
	// Public state that store can read
	userDelta = '';
	assistantDelta = '';

	// Private state
	private eventQueue: Array<{ event: SDKTransportEvent; timestamp: number }> = [];
	private processingEvents = false;
	private events: Array<{ dir: 'server' | 'client'; type: string; payload: any; ts: number }> = [];
	private debug = false;

	private finalizedItemIds = new SvelteSet<string>();
	private pendingFinalTranscripts: Record<
		string,
		{
			role: 'assistant' | 'user';
			text: string;
			receivedAt: number;
			timeoutId: ReturnType<typeof setTimeout> | null;
		}
	> = {};
	private historyText: Record<string, string> = {};

	private pendingCommits: PendingCommitEntry[] = [];
	private conversationItems: Array<{ itemId: string; role: 'user' | 'assistant'; text: string }> =
		[];
	private transcriptFilter: TranscriptFilter | null = null;

	private currentInstructions: string | null = null;
	private lastSessionUpdateInstructions: string | null = null;
	private lastSessionUpdateTime: number = 0;
	private readonly SESSION_UPDATE_COOLDOWN_MS = 1000;

	/**
	 * Update session configuration
	 */
	updateSessionConfig(config: SessionConfig): void {
		if (config.instructions) {
			this.currentInstructions = config.instructions;
		}
	}

	/**
	 * Schedule a pending transcript to be finalized
	 * (with debounce to allow final transcript to arrive)
	 */
	schedulePendingTranscript(itemId: string, role: 'user' | 'assistant', text: string): void {
		if (this.transcriptFilter) {
			const shouldInclude = this.transcriptFilter({
				itemId,
				role,
				text,
				isFinal: false,
				receivedAt: Date.now()
			});
			if (!shouldInclude) return;
		}

		// Clear existing timeout for this itemId
		if (this.pendingFinalTranscripts[itemId]?.timeoutId) {
			clearTimeout(this.pendingFinalTranscripts[itemId].timeoutId);
		}

		const receivedAt = Date.now();
		const timeoutId = setTimeout(() => {
			this.flushPendingTranscript(itemId);
		}, 150); // Wait 150ms for final transcript

		this.pendingFinalTranscripts[itemId] = {
			role,
			text,
			receivedAt,
			timeoutId
		};
	}

	/**
	 * Resolve a commit item (called when server ACKs the commit)
	 */
	resolveCommitItem(itemId: string): void {
		for (const commit of this.pendingCommits) {
			if (commit.itemIds.has(itemId)) {
				commit.resolvedItemIds.add(itemId);
				commit.pendingResolvedItemIds.delete(itemId);

				// Check if all items are resolved
				if (commit.resolvedItemIds.size === commit.itemIds.size) {
					commit.hasReceivedCommitAck = true;
					this.maybeSendResponseForCommit(commit, 'item_resolved');
				}
			}
		}
	}

	/**
	 * Set a filter for transcripts
	 */
	setTranscriptFilter(filter: TranscriptFilter | null): void {
		this.transcriptFilter = filter;
	}

	/**
	 * Enable/disable debug logging
	 */
	setDebug(enabled: boolean): void {
		this.debug = enabled;
	}

	/**
	 * Get logged events for debugging
	 */
	getEvents(): Array<{ dir: 'server' | 'client'; type: string; payload: any; ts: number }> {
		return this.events;
	}

	/**
	 * Clear all state
	 */
	clearState(): void {
		this.eventQueue = [];
		this.processingEvents = false;
		this.events = [];
		this.finalizedItemIds.clear();
		this.pendingFinalTranscripts = {};
		this.historyText = {};
		this.pendingCommits = [];
		this.conversationItems = [];
		this.userDelta = '';
		this.assistantDelta = '';
	}

	/**
	 * Queue an event for processing
	 */
	queueServerEvent(event: SDKTransportEvent): void {
		this.eventQueue.push({ event, timestamp: Date.now() });
	}

	/**
	 * Process queued events
	 * Returns true if any events were processed
	 */
	async processQueuedEvents(): Promise<boolean> {
		if (this.processingEvents || this.eventQueue.length === 0) {
			return false;
		}

		this.processingEvents = true;

		try {
			this.eventQueue.sort((a, b) => a.timestamp - b.timestamp);

			while (this.eventQueue.length > 0) {
				const eventData = this.eventQueue.shift();
				if (!eventData) break;

				this.processServerEventOrdered(eventData.event);
			}

			return true;
		} finally {
			this.processingEvents = false;
		}
	}

	// Private implementation

	private processServerEventOrdered(event: SDKTransportEvent) {
		const classification = classifyServerEvent(event);

		if (this.debug) {
			this.events = [logEvent('server', event.type, event), ...this.events].slice(0, 100);
		}

		if (classification === 'transcription') {
			this.handleTranscriptionEvent(event);
		}
	}

	private handleTranscriptionEvent(event: SDKTransportEvent) {
		const eventType = event.type;
		const itemId = (event as any)?.item_id || (event as any)?.transcript_item_id;
		const delta = (event as any)?.delta;
		const transcript = (event as any)?.transcript;

		if (eventType === 'conversation.item.input_audio_transcription.delta' && delta && itemId) {
			this.schedulePendingTranscript(itemId, 'user', delta);
		} else if (
			eventType === 'conversation.item.input_audio_transcription.completed' &&
			transcript &&
			itemId
		) {
			this.finalizeTranscriptMessage(itemId, 'user', transcript);
		}
	}

	private finalizeTranscriptMessage(itemId: string, role: 'user' | 'assistant', text: string) {
		if (this.finalizedItemIds.has(itemId)) {
			return;
		}

		this.finalizedItemIds.add(itemId);

		// Clear pending timeout
		if (this.pendingFinalTranscripts[itemId]?.timeoutId) {
			clearTimeout(this.pendingFinalTranscripts[itemId].timeoutId);
		}
		delete this.pendingFinalTranscripts[itemId];

		// Track conversation item
		this.trackConversationItem(itemId, role, text);
	}

	private flushPendingTranscript(itemId: string) {
		const pending = this.pendingFinalTranscripts[itemId];
		if (!pending) return;

		const { role, text } = pending;
		this.finalizeTranscriptMessage(itemId, role, text);
		delete this.pendingFinalTranscripts[itemId];
	}

	private trackConversationItem(itemId: string, role: 'user' | 'assistant', text: string) {
		this.conversationItems.push({ itemId, role, text });
		this.historyText[itemId] = text;
	}

	private maybeSendResponseForCommit(commit: PendingCommitEntry, reason: string) {
		// This would be called to determine if a response should be created
		// Implementation depends on response.created event handling
	}
}
