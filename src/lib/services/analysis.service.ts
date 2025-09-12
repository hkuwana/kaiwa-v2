// src/lib/services/analysis.service.ts
// Unified analysis service that handles different types of conversation analysis
// Integrates with onboarding-manager.service.ts and extends functionality

import type { Message, Language, UserPreferences } from '$lib/server/db/types';
import * as onboardingManagerService from './onboarding-manager.service';

export type AnalysisType = 'onboarding' | 'regular' | 'scenario-generation';

export interface AnalysisRequest {
	messages: Message[];
	language: Language;
	sessionId: string;
	analysisType: AnalysisType;
	userPreferencesProvider: UserPreferencesProvider;
}

export interface AnalysisResult {
	success: boolean;
	data?: {
		analysisResults?: Record<string, unknown>;
		customScenarios?: CustomScenario[];
		insights?: string[];
	};
	error?: string;
	analysisType: AnalysisType;
}

export interface CustomScenario {
	id: string;
	title: string;
	description: string;
	difficulty: 'beginner' | 'intermediate' | 'advanced';
	category: string;
	suggestedDuration: number; // minutes
}

export interface UserPreferencesProvider {
	isGuest(): boolean;
	getPreference<K extends keyof UserPreferences>(key: K): UserPreferences[K];
	updatePreferences(updates: Partial<UserPreferences>): Promise<void>;
}

/**
 * Main analysis function that routes to appropriate analysis type
 */
export async function analyzeConversation(request: AnalysisRequest): Promise<AnalysisResult> {
	const { messages, language, sessionId, analysisType, userPreferencesProvider } = request;

	// Validate prerequisites
	if (!language) {
		return {
			success: false,
			error: 'Language is required for analysis',
			analysisType
		};
	}

	if (!messages || messages.length === 0) {
		return {
			success: false,
			error: 'No messages provided for analysis',
			analysisType
		};
	}

	try {
		console.log(`🔍 Starting ${analysisType} analysis...`);

		switch (analysisType) {
			case 'onboarding':
				return await handleOnboardingAnalysis(messages, language, sessionId, userPreferencesProvider);

			case 'regular':
				return await handleRegularAnalysis(messages, language, sessionId, userPreferencesProvider);

			case 'scenario-generation':
				return await handleScenarioGeneration(messages, language, sessionId, userPreferencesProvider);

			default:
				return {
					success: false,
					error: `Unknown analysis type: ${analysisType}`,
					analysisType
				};
		}
	} catch (error) {
		console.error(`❌ Analysis failed:`, error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Analysis failed',
			analysisType
		};
	}
}

/**
 * Handle onboarding analysis (delegates to onboarding-manager.service.ts)
 */
async function handleOnboardingAnalysis(
	messages: Message[],
	language: Language,
	sessionId: string,
	userPreferencesProvider: UserPreferencesProvider
): Promise<AnalysisResult> {
	console.log('🎯 Running onboarding analysis...');

	const result = await onboardingManagerService.executeOnboardingAnalysis(
		language,
		messages,
		sessionId,
		userPreferencesProvider
	);

	if (result.success) {
		return {
			success: true,
			data: {
				analysisResults: { success: true, message: 'Onboarding analysis completed successfully' }
			},
			analysisType: 'onboarding'
		};
	}

	return {
		success: false,
		error: result.error,
		analysisType: 'onboarding'
	};
}

/**
 * Handle regular conversation analysis for returning users
 */
async function handleRegularAnalysis(
	messages: Message[],
	language: Language,
	sessionId: string,
	userPreferencesProvider: UserPreferencesProvider
): Promise<AnalysisResult> {
	console.log('📊 Running regular conversation analysis...');

	try {
		// Filter user messages for analysis
		const userMessages = messages
			.filter((msg) => msg.role === 'user' && msg.content.trim())
			.map((msg) => msg.content);

		if (userMessages.length === 0) {
			return {
				success: false,
				error: 'No user messages found for regular analysis',
				analysisType: 'regular'
			};
		}

		// Call regular analysis API
		const response = await fetch('/api/analyze-conversation', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				conversationMessages: userMessages,
				targetLanguage: language.code,
				sessionId,
				analysisType: 'regular'
			})
		});

		if (!response.ok) {
			throw new Error(`Regular analysis failed: ${response.statusText}`);
		}

		const result = await response.json();

		if (result.success) {
			// Update user preferences with new insights
			const currentExchanges = userPreferencesProvider.getPreference('successfulExchanges') || 0;
			await userPreferencesProvider.updatePreferences({
				successfulExchanges: currentExchanges + 1,
				lastConversationInsights: result.data.insights
			} as Partial<UserPreferences>);

			return {
				success: true,
				data: {
					insights: result.data.insights,
					analysisResults: result.data
				},
				analysisType: 'regular'
			};
		}

		return {
			success: false,
			error: result.error || 'Regular analysis failed',
			analysisType: 'regular'
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Regular analysis failed',
			analysisType: 'regular'
		};
	}
}

/**
 * Handle custom scenario generation based on conversation content
 */
async function handleScenarioGeneration(
	messages: Message[],
	language: Language,
	sessionId: string,
	userPreferencesProvider: UserPreferencesProvider
): Promise<AnalysisResult> {
	console.log('🎭 Running scenario generation analysis...');

	try {
		// Extract conversation context for scenario generation
		const conversationContext = extractConversationContext(messages);

		// Call scenario generation API
		const response = await fetch('/api/generate-scenarios', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				conversationContext,
				targetLanguage: language.code,
				sessionId,
				userLevel: userPreferencesProvider.getPreference('speakingLevel') || 50
			})
		});

		if (!response.ok) {
			throw new Error(`Scenario generation failed: ${response.statusText}`);
		}

		const result = await response.json();

		if (result.success) {
			return {
				success: true,
				data: {
					customScenarios: result.data.scenarios,
					insights: [`Generated ${result.data.scenarios.length} custom scenarios based on your interests`]
				},
				analysisType: 'scenario-generation'
			};
		}

		return {
			success: false,
			error: result.error || 'Scenario generation failed',
			analysisType: 'scenario-generation'
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Scenario generation failed',
			analysisType: 'scenario-generation'
		};
	}
}

/**
 * Extract relevant context from conversation for scenario generation
 */
function extractConversationContext(messages: Message[]): {
	topics: string[];
	interests: string[];
	difficultyLevel: string;
} {
	// Simple context extraction - can be enhanced with NLP
	const allContent = messages
		.filter((msg) => msg.content && msg.content.trim())
		.map((msg) => msg.content)
		.join(' ');

	// Basic keyword extraction for topics and interests
	const topics = extractTopics(allContent);
	const interests = extractInterests(allContent);
	const difficultyLevel = estimateDifficulty(allContent);

	return {
		topics,
		interests,
		difficultyLevel
	};
}

/**
 * Extract topics mentioned in conversation
 */
function extractTopics(content: string): string[] {
	// Basic topic extraction - could be enhanced with better NLP
	const topicKeywords = [
		'work', 'job', 'career', 'business', 'meeting',
		'travel', 'vacation', 'trip', 'hotel', 'flight',
		'food', 'restaurant', 'cooking', 'eating',
		'shopping', 'buying', 'store', 'market',
		'family', 'friends', 'relationship', 'dating',
		'hobby', 'sport', 'music', 'movie', 'book',
		'health', 'doctor', 'hospital', 'medicine',
		'school', 'university', 'study', 'learning'
	];

	const lowerContent = content.toLowerCase();
	return topicKeywords.filter(keyword => lowerContent.includes(keyword));
}

/**
 * Extract interests mentioned in conversation
 */
function extractInterests(content: string): string[] {
	// Extract potential interests based on context
	const interestPatterns = [
		/i (like|love|enjoy) ([^.!?]+)/gi,
		/i'm interested in ([^.!?]+)/gi,
		/i want to ([^.!?]+)/gi,
		/my hobby is ([^.!?]+)/gi
	];

	const interests: string[] = [];
	interestPatterns.forEach(pattern => {
		const matches = content.match(pattern);
		if (matches) {
			matches.forEach(match => {
				const interest = match.replace(pattern, '$2').trim();
				if (interest && interest.length > 2) {
					interests.push(interest);
				}
			});
		}
	});

	return interests.slice(0, 5); // Limit to 5 interests
}

/**
 * Estimate difficulty level based on conversation complexity
 */
function estimateDifficulty(content: string): string {
	const words = content.split(/\s+/).length;
	const sentences = content.split(/[.!?]+/).length;
	const avgWordsPerSentence = words / sentences;

	if (avgWordsPerSentence < 5) return 'beginner';
	if (avgWordsPerSentence < 10) return 'intermediate';
	return 'advanced';
}

/**
 * Determine analysis type based on user status and conversation context
 */
export function determineAnalysisType(userPreferencesProvider: UserPreferencesProvider): AnalysisType {
	// Check if user should trigger onboarding
	if (onboardingManagerService.shouldTriggerOnboarding(userPreferencesProvider)) {
		return 'onboarding';
	}

	// For returning users, provide regular analysis
	return 'regular';
}

/**
 * Get analysis type for scenario generation
 */
export function getScenarioGenerationType(): AnalysisType {
	return 'scenario-generation';
}

export default {
	analyzeConversation,
	determineAnalysisType,
	getScenarioGenerationType
};