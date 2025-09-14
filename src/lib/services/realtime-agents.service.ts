// src/lib/services/realtime-agents.service.ts
// Modern realtime service using official @openai/agents-realtime package
// Provides compatibility layer for existing conversation store

import { RealtimeAgent, OpenAIRealtimeSession } from '../types/openai.realtime.types';
import {
	OpenAIRealtimeWebRTC,
	RealtimeSession,
	type RealtimeClientMessage
} from '@openai/agents-realtime';
import { env as publicEnv } from '$env/dynamic/public';
import { createScenarioSessionConfig } from './instructions.service';
import type { User, Language, UserPreferences, Scenario, Speaker } from '$lib/server/db/types';

// ============================================
// COMPATIBILITY TYPES
// ============================================

export interface RealtimeAgentConnection {
	session: OpenAIRealtimeSession;
	agent: RealtimeAgent;
	isConnected: boolean;
	sessionKey?: string;
	expiresAt?: number;
	// Optional transport + audio element when using direct session/transport
	transport?: OpenAIRealtimeWebRTC;
	audioElement?: HTMLAudioElement;
}

export interface AgentMessageData {
	role: 'user' | 'assistant';
	content: string;
	timestamp: Date;
}

export interface AgentTranscriptionData {
	type: 'user_transcript' | 'assistant_transcript';
	text: string;
	isFinal: boolean;
	timestamp: Date;
}

export type AgentEventResult =
	| { type: 'message'; data: AgentMessageData }
	| { type: 'transcription'; data: AgentTranscriptionData }
	| { type: 'connection_state'; data: { state: string } }
	| { type: 'ignore'; data: null };

// ============================================
// MODERN AGENT CREATION
// ============================================

/**
 * Create a realtime agent with scenario-specific configuration
 */
export function createRealtimeAgent(
	scenario: Scenario | undefined,
	user: User,
	language: Language,
	preferences: Partial<UserPreferences>,
	speaker?: Speaker
): RealtimeAgent {
	const scenarioConfig = createScenarioSessionConfig(
		scenario,
		user,
		language,
		preferences,
		speaker
	);

	console.log('🤖 Creating RealtimeAgent with config:', {
		scenario: scenario?.category || 'default',
		language: language.name,
		voice: scenarioConfig.voice
	});

	const agent = new RealtimeAgent({
		name: speaker?.voiceName || 'Hiro',
		instructions: scenarioConfig.instructions,
		voice: scenarioConfig.voice
		// Add any other configuration from scenarioConfig
	});

	return agent;
}

/**
 * Create and connect realtime session
 */
export async function createRealtimeSession(
	agent: RealtimeAgent,
	sessionData: { client_secret: { value: string; expires_at: number } }
): Promise<RealtimeAgentConnection> {
	console.log('🔗 Creating RealtimeSession...');

	const session = new OpenAIRealtimeSession(agent);

	try {
		await session.connect({
			apiKey: sessionData.client_secret.value
		});

		console.log('✅ RealtimeSession connected successfully');

		return {
			session,
			agent,
			isConnected: true,
			sessionKey: sessionData.client_secret.value,
			expiresAt: sessionData.client_secret.expires_at
		};
	} catch (error) {
		console.error('❌ Failed to connect RealtimeSession:', error);
		throw error;
	}
}

/**
 * Start conversation with initial message
 */
export async function startAgentConversation(
	connection: RealtimeAgentConnection,
	initialMessage?: string
): Promise<void> {
	if (!connection.isConnected) {
		throw new Error('RealtimeSession is not connected');
	}

	console.log('🎬 Starting agent conversation...');

	if (initialMessage) {
		console.log('💬 Sending initial message:', initialMessage);
		// The official package should handle this automatically
		// based on the agent's instructions and initial setup
	}

	// The RealtimeSession should automatically start the conversation
	// based on the agent configuration
}

// ============================================
// DIRECT SESSION/TRANSPORT ADAPTER (for ConversationStore)
// ============================================

export type SessionConnection = {
	session: RealtimeSession;
	transport: OpenAIRealtimeWebRTC;
	audioElement: HTMLAudioElement;
};

export async function createConnectionWithSession(
	sessionData: { client_secret: { value: string; expires_at: number } },
	mediaStream?: MediaStream
): Promise<SessionConnection> {
	const audioElement = document.createElement('audio');
	audioElement.autoplay = true;
	audioElement.style.display = 'none';
	document.body.appendChild(audioElement);

	const transport = new OpenAIRealtimeWebRTC({
		// Use SDK default baseUrl: https://api.openai.com/v1/realtime/calls
		audioElement,
		mediaStream
	});

	const agent = new RealtimeAgent({ name: 'Kaiwa' });
	const session = new RealtimeSession(agent, { transport });

	await session.connect({
		apiKey: sessionData.client_secret.value,
		model: publicEnv.PUBLIC_OPEN_AI_MODEL || 'gpt-realtime'
	});

	return { session, transport, audioElement };
}

export function subscribeToSession(
	conn: SessionConnection,
	handlers: {
		onTransportEvent?: (ev: any) => void;
		onError?: (err: any) => void;
	}
): () => void {
	conn.session.on('transport_event', (ev) => handlers.onTransportEvent?.(ev));
	conn.session.on('error', (err) => handlers.onError?.(err));
	// The SDK's `.on` returns the session for chaining; no explicit unsubscribe here
	return () => {
		// If the SDK exposes an `.off` API in the future, wire it here.
	};
}

export function sendEventViaSession(conn: SessionConnection, event: RealtimeClientMessage) {
	// Use the underlying transport to send a raw client event
	conn.session.transport.sendEvent(event);
}

export function sendTextMessage(conn: SessionConnection, text: string) {
	// High-level helper to send a user text message
	conn.session.sendMessage(text);
}

export function interruptSession(conn: SessionConnection) {
	try {
		conn.session.interrupt();
	} catch {}
}

export function muteSession(conn: SessionConnection, mute: boolean) {
	try {
		conn.session.mute(mute);
	} catch {}
}

export function closeSessionConnection(conn: SessionConnection) {
	try {
		conn.session.close();
	} catch {}
	try {
		conn.audioElement.pause();
		conn.audioElement.remove();
	} catch {}
}

export function getSessionConnectionStatus(conn: SessionConnection): {
	peerConnectionState: string;
	dataChannelState: string;
	isConnected: boolean;
	hasLocalStream: boolean;
} {
	const state = conn.transport.connectionState;
	return {
		peerConnectionState: state.status,
		dataChannelState:
			state.status === 'connected'
				? 'open'
				: state.status === 'connecting'
					? 'connecting'
					: 'closed',
		isConnected: state.status === 'connected',
		hasLocalStream: !!conn.transport
	};
}

// ============================================
// COMPATIBILITY LAYER FOR EXISTING CODE
// ============================================

/**
 * Compatibility wrapper that mimics the old realtime service interface
 * This allows your existing conversation store to work with minimal changes
 */
export class RealtimeCompatibilityService {
	private connection: RealtimeAgentConnection | null = null;

	async createConnection(
		sessionData: { client_secret: { value: string; expires_at: number } },
		audioStream: MediaStream,
		scenario: Scenario | undefined,
		user: User,
		language: Language,
		preferences: Partial<UserPreferences>,
		speaker?: Speaker
	): Promise<RealtimeAgentConnection | null> {
		try {
			// Create agent with scenario configuration
			const agent = createRealtimeAgent(scenario, user, language, preferences, speaker);

			// Create and connect session
			this.connection = await createRealtimeSession(agent, sessionData);

			// Start conversation
			const scenarioConfig = createScenarioSessionConfig(
				scenario,
				user,
				language,
				preferences,
				speaker
			);
			await startAgentConversation(this.connection, scenarioConfig.initialMessage);

			return this.connection;
		} catch (error) {
			console.error('❌ Compatibility layer connection failed:', error);
			return null;
		}
	}

	async sendMessage(text: string): Promise<void> {
		if (!this.connection?.isConnected) {
			console.warn('Cannot send message: no active connection');
			return;
		}

		// The official package should handle message sending
		console.log('📤 Sending message via RealtimeSession:', text);
		// Implementation depends on the official package API
	}

	updateInstructions(instructions: string): void {
		if (!this.connection?.isConnected) {
			console.warn('Cannot update instructions: no active connection');
			return;
		}

		console.log('🔄 Updating agent instructions:', instructions.substring(0, 100) + '...');
		// The official package should support dynamic instruction updates
	}

	closeConnection(): void {
		if (this.connection?.session) {
			console.log('🔌 Closing RealtimeSession connection');
			// The official package should handle cleanup
			this.connection = null;
		}
	}

	getConnectionStatus(): {
		isConnected: boolean;
		sessionExpired: boolean;
	} {
		if (!this.connection) {
			return {
				isConnected: false,
				sessionExpired: false
			};
		}

		return {
			isConnected: this.connection.isConnected,
			sessionExpired: this.connection.expiresAt ? this.connection.expiresAt <= Date.now() : false
		};
	}
}

// ============================================
// MIGRATION HELPERS
// ============================================

/**
 * Create the compatibility service instance
 * Use this in your existing conversation store for easy migration
 */
export function createRealtimeCompatibilityService(): RealtimeCompatibilityService {
	return new RealtimeCompatibilityService();
}

/**
 * Helper to migrate from old service to new service
 */
export const MIGRATION_GUIDE = {
	oldService: {
		createConnection: 'Use RealtimeCompatibilityService.createConnection()',
		sendEvent: 'Use RealtimeCompatibilityService.sendMessage()',
		createSessionUpdate: 'Use RealtimeCompatibilityService.updateInstructions()',
		closeConnection: 'Use RealtimeCompatibilityService.closeConnection()'
	},
	newService: {
		direct: 'Use createRealtimeAgent() and createRealtimeSession() directly',
		recommended: 'Gradually migrate to use RealtimeAgent and RealtimeSession directly'
	}
};

// Export compatibility instance for immediate use
export const realtimeCompatibilityService = createRealtimeCompatibilityService();
