// 🎭 Conversation Types
// Basic types for conversation functionality

import type { Message } from "$lib/server/db/types";

export enum RealtimeConversationStatus {
	IDLE = 'idle',
	CONNECTING = 'connecting',
	STREAMING = 'streaming',
	PROCESSING = 'processing',
	ERROR = 'error'
}

export interface ConversationState {
	status: RealtimeConversationStatus;
	sessionId?: string;
	language?: string;
	voice?: string;
	messages: Message[];
	error?: string;
}

 
export interface ConversationAction {
	type: string;
	payload?: any;
}

export interface ConversationEffect {
	type: string;
	payload?: any;
}

// 🎯 Learning Scenario Types
export interface LearningScenario {
	id: string;
	title: string;
	description: string;
	language: string;
	difficulty: 'beginner' | 'intermediate' | 'advanced';
	targetVocabulary?: string[];
	culturalContext?: string;
}

export interface ScenarioOutcome {
	scenarioId: string;
	vocabularyUsageScore?: number;
	grammarUsageScore?: number;
	goalCompletionScore?: number;
	pronunciationScore?: number;
	duration: number;
	completedAt: Date;
}
