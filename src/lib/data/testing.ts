// 🧪 Testing Types and Mock Data
// Test data for the instructions service

import type { Language, Scenario, User, UserPreferences } from '$lib/server/db/types';
import type { SessionContext, ModuleContext } from '$lib/services/instructions.service';
import { languages } from './languages';
import { scenariosData } from './scenarios';

// ============================================
// TEST TYPES
// ============================================

// Use the exact types from the instructions service
export type { SessionContext, ModuleContext };

// Define UpdateContext locally since it's not exported from the service
export type UpdateContext =
	| { type: 'topic_change'; newTopic: string }
	| { type: 'difficulty_adjust'; increase: boolean }
	| { type: 'engagement_boost'; reason?: string }
	| { type: 'correction_needed'; errorPattern: string };

// Test parameters that match the getInstructions function signature
export interface TestInstructionParams {
	user: User;
	language: Language;
	preferences: Partial<UserPreferences>;
	scenario?: Scenario;
	sessionContext?: SessionContext;
	updateType?: 'topic_change' | 'difficulty_adjust' | 'engagement_boost' | 'correction_needed';
	updateContext?: UpdateContext;
	timeRemaining?: number;
}

// Test parameters for individual module testing
export interface TestModuleParams extends ModuleContext {
	moduleId: string;
}

// ============================================
// MOCK TEST DATA
// ============================================

export const mockUsers: User[] = [
	{
		id: 'user-1',
		email: 'test1@example.com',
		nativeLanguageId: 'en',
		preferredUILanguageId: 'ja',
		createdAt: new Date(),
		lastUsage: new Date(),
		googleId: null,
		username: null,
		displayName: null,
		avatarUrl: null,
		stripeCustomerId: null,
		hashedPassword: null
	},
	{
		id: 'user-2',
		email: 'test2@example.com',
		displayName: 'Test User 2',
		nativeLanguageId: 'es',
		preferredUILanguageId: 'en',
		createdAt: new Date(),
		lastUsage: new Date(),
		googleId: null,
		username: null,
		avatarUrl: null,
		stripeCustomerId: null,
		hashedPassword: null
	},
	{
		id: 'user-3',
		googleId: null,
		username: null,
		displayName: 'Test User 3',
		email: 'test3@example.com',
		avatarUrl: null,
		stripeCustomerId: null,
		nativeLanguageId: 'fr',
		preferredUILanguageId: 'de',
		createdAt: new Date(),
		lastUsage: new Date(),
		hashedPassword: null
	}
];

export const mockUserPreferences: Partial<UserPreferences>[] = [
	{
		speakingLevel: 20,
		learningGoal: 'Connection',
		correctionStyle: 'gentle',
		totalConversations: 0,
		targetLanguageId: 'ja'
	},
	{
		speakingLevel: 50,
		learningGoal: 'Career',
		correctionStyle: 'immediate',
		totalConversations: 5,
		targetLanguageId: 'es'
	},
	{
		speakingLevel: 80,
		learningGoal: 'Travel',
		correctionStyle: 'end_of_session',
		totalConversations: 15,
		targetLanguageId: 'fr'
	},
	{
		speakingLevel: 100,
		learningGoal: 'Academic',
		correctionStyle: 'gentle',
		totalConversations: 30,
		targetLanguageId: 'de'
	}
];

export const mockSessionContexts: SessionContext[] = [
	{
		conversationHistory: ['Hello', 'How are you?', 'I am fine'],
		currentTopic: 'Greetings',
		timeElapsed: 300,
		scenario: scenariosData[0],
		previousOutcomes: []
	},
	{
		conversationHistory: ['What do you like to do?', 'I like reading'],
		currentTopic: 'Hobbies',
		timeElapsed: 600,
		scenario: scenariosData[3],
		previousOutcomes: []
	},
	{
		conversationHistory: ['Where do you want to travel?', 'I want to visit Japan'],
		currentTopic: 'Travel',
		timeElapsed: 900,
		scenario: scenariosData[5],
		previousOutcomes: []
	}
];

export const mockUpdateContexts: UpdateContext[] = [
	{
		type: 'topic_change',
		newTopic: 'Food preferences'
	},
	{
		type: 'difficulty_adjust',
		increase: true
	},
	{
		type: 'engagement_boost',
		reason: 'User seems distracted'
	},
	{
		type: 'correction_needed',
		errorPattern: 'Verb conjugation errors'
	}
];

// ============================================
// TEST SCENARIOS
// ============================================

export const testScenarios = [
	{
		name: 'Beginner Connection',
		params: {
			language: languages[0], // Japanese
			preferences: mockUserPreferences[0],
			scenario: scenariosData[0],
			sessionContext: mockSessionContexts[0]
		}
	},
	{
		name: 'Intermediate Career',
		params: {
			language: languages[2], // Spanish
			preferences: mockUserPreferences[1],
			scenario: scenariosData[1],
			sessionContext: mockSessionContexts[1]
		}
	},
	{
		name: 'Advanced Travel',
		params: {
			language: languages[3], // French
			preferences: mockUserPreferences[2],
			scenario: scenariosData[5],
			sessionContext: mockSessionContexts[2]
		}
	},
	{
		name: 'Native Academic',
		params: {
			language: languages[4], // German
			preferences: mockUserPreferences[3],
			scenario: scenariosData[6],
			sessionContext: mockSessionContexts[2]
		}
	}
];

// ============================================
// HELPER FUNCTIONS
// ============================================

// Type guard functions for UpdateContext
export function isTopicChange(
	context: UpdateContext
): context is { type: 'topic_change'; newTopic: string } {
	return context.type === 'topic_change';
}

export function isDifficultyAdjust(
	context: UpdateContext
): context is { type: 'difficulty_adjust'; increase: boolean } {
	return context.type === 'difficulty_adjust';
}

export function isEngagementBoost(
	context: UpdateContext
): context is { type: 'engagement_boost'; reason?: string } {
	return context.type === 'engagement_boost';
}

export function isCorrectionNeeded(
	context: UpdateContext
): context is { type: 'correction_needed'; errorPattern: string } {
	return context.type === 'correction_needed';
}

export function getRandomTestScenario() {
	return testScenarios[Math.floor(Math.random() * testScenarios.length)];
}

export function getRandomLanguage() {
	return languages[Math.floor(Math.random() * languages.length)];
}

export function getRandomPreferences() {
	return mockUserPreferences[Math.floor(Math.random() * mockUserPreferences.length)];
}

export function getRandomScenario() {
	return scenariosData[Math.floor(Math.random() * scenariosData.length)];
}

export function getRandomSessionContext() {
	return mockSessionContexts[Math.floor(Math.random() * mockSessionContexts.length)];
}

export function getRandomUpdateContext() {
	return mockUpdateContexts[Math.floor(Math.random() * mockUpdateContexts.length)];
}
