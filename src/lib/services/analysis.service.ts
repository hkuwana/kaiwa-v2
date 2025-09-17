// src/lib/services/analysis.service.ts
// Unified analysis service that handles different types of conversation analysis
// Integrates with onboarding-manager.service.ts and extends functionality

import type { Message, Language, UserPreferences } from '$lib/server/db/types';
import * as onboardingManagerService from './onboarding-manager.service';

export type AnalysisType = 'onboarding' | 'regular' | 'scenario-generation';
export type AnalysisMode = 'quick' | 'full';

export interface AnalysisRequest {
	messages: Message[];
	language: Language;
	sessionId: string;
	analysisType: AnalysisType;
	analysisMode?: AnalysisMode; // quick or full analysis
	userPreferencesProvider: UserPreferencesProvider;
	userId?: string; // Added for quota checking
}

export interface AnalysisResult {
	success: boolean;
	data?: {
		analysisResults?: Record<string, unknown>;
		customScenarios?: CustomScenario[];
		insights?: string[];
		quickStats?: {
			totalMessages: number;
			userMessages: number;
			estimatedLevel: string;
			keyTopics: string[];
			practiceTime: number;
		};
	};
	error?: string;
	analysisType: AnalysisType;
	analysisMode?: AnalysisMode;
	quotaExceeded?: boolean;
	quotaStatus?: {
		remainingAnalyses: number;
		resetTime: Date;
		tier: string;
	};
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
	const { messages, language, sessionId, analysisType, analysisMode = 'full', userPreferencesProvider, userId } = request;

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

	// Check quota if userId is provided and doing full analysis
	if (userId && analysisMode === 'full') {
		try {
			const response = await fetch('/api/analysis/quota-check');
			if (response.ok) {
				const quotaStatus = await response.json();

				if (!quotaStatus.canAnalyze) {
					return {
						success: false,
						error: quotaStatus.upgradeRequired
							? 'Daily analysis limit reached. Upgrade to get more analyses!'
							: 'Monthly analysis limit reached. Your quota will reset soon.',
						analysisType,
						quotaExceeded: true,
						quotaStatus: {
							remainingAnalyses: quotaStatus.remainingAnalyses,
							resetTime: quotaStatus.resetTime,
							tier: quotaStatus.tier
						}
					};
				}
			}
		} catch (error) {
			console.warn('Could not check analysis quota:', error);
			// Continue with analysis if quota check fails
		}
	}

	try {
		console.log(`🔍 Starting ${analysisMode} ${analysisType} analysis...`);

		let result: AnalysisResult;

		// Handle quick analysis mode
		if (analysisMode === 'quick') {
			result = handleQuickAnalysis(messages, language, analysisType);
		} else {
			// Handle full analysis mode
			switch (analysisType) {
				case 'onboarding':
					result = await handleOnboardingAnalysis(
						messages,
						language,
						sessionId,
						userPreferencesProvider
					);
					break;

				case 'regular':
					result = await handleRegularAnalysis(messages, language, sessionId, userPreferencesProvider);
					break;

				case 'scenario-generation':
					result = await handleScenarioGeneration(
						messages,
						language,
						sessionId,
						userPreferencesProvider
					);
					break;

				default:
					result = {
						success: false,
						error: `Unknown analysis type: ${analysisType}`,
						analysisType
					};
			}
		}

		// Record usage if full analysis was successful and userId is provided
		if (result.success && userId && analysisMode === 'full') {
			try {
				await fetch('/api/analysis/record-usage', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ userId })
				});
				console.log(`📊 Recorded analysis usage for user ${userId}`);
			} catch (error) {
				console.warn('Could not record analysis usage:', error);
				// Don't fail the analysis if usage recording fails
			}
		}

		return result;
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
					insights: [
						`Generated ${result.data.scenarios.length} custom scenarios based on your interests`
					]
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
		'work',
		'job',
		'career',
		'business',
		'meeting',
		'travel',
		'vacation',
		'trip',
		'hotel',
		'flight',
		'food',
		'restaurant',
		'cooking',
		'eating',
		'shopping',
		'buying',
		'store',
		'market',
		'family',
		'friends',
		'relationship',
		'dating',
		'hobby',
		'sport',
		'music',
		'movie',
		'book',
		'health',
		'doctor',
		'hospital',
		'medicine',
		'school',
		'university',
		'study',
		'learning'
	];

	const lowerContent = content.toLowerCase();
	return topicKeywords.filter((keyword) => lowerContent.includes(keyword));
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
	interestPatterns.forEach((pattern) => {
		const matches = content.match(pattern);
		if (matches) {
			matches.forEach((match) => {
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
 * Handle quick analysis for immediate display
 */
function handleQuickAnalysis(
	messages: Message[],
	language: Language,
	analysisType: AnalysisType
): AnalysisResult {
	console.log('⚡ Running quick analysis...');

	// Filter out placeholder messages
	const displayMessages = messages.filter(
		(message: Message) =>
			message.content &&
			message.content.trim().length > 0 &&
			!message.content.includes('[Speaking...]') &&
			!message.content.includes('[Transcribing...]')
	);

	const userMessages = displayMessages.filter((m: Message) => m.role === 'user');

	// Calculate quick stats
	const totalMessages = displayMessages.length;
	const userMessageCount = userMessages.length;
	const practiceTime = displayMessages.length > 0
		? Math.round((displayMessages[displayMessages.length - 1].timestamp.getTime() - displayMessages[0].timestamp.getTime()) / 60000)
		: 0;

	// Extract key topics
	const allContent = userMessages.map(m => m.content).join(' ').toLowerCase();
	const keyTopics = extractTopics(allContent);

	// Estimate level
	const estimatedLevel = estimateUserLevel(userMessages);

	// Generate insights based on analysis type
	const insights = generateQuickInsights(analysisType, {
		totalMessages,
		userMessages: userMessageCount,
		estimatedLevel,
		keyTopics,
		practiceTime
	}, language);

	return {
		success: true,
		data: {
			quickStats: {
				totalMessages,
				userMessages: userMessageCount,
				estimatedLevel,
				keyTopics,
				practiceTime
			},
			insights
		},
		analysisType,
		analysisMode: 'quick'
	};
}

/**
 * Generate quick insights based on analysis type
 */
function generateQuickInsights(
	analysisType: AnalysisType,
	stats: {
		totalMessages: number;
		userMessages: number;
		estimatedLevel: string;
		keyTopics: string[];
		practiceTime: number;
	},
	language: Language
): string[] {
	switch (analysisType) {
		case 'onboarding':
			return [
				`Great start! You exchanged ${stats.totalMessages} messages in ${language.name}`,
				`Your conversation style suggests ${stats.estimatedLevel} level`,
				'Ready for personalized learning recommendations',
				'Custom scenarios will be suggested based on your interests'
			];

		case 'scenario-generation':
			return [
				`Conversation topics: ${stats.keyTopics.length > 0 ? stats.keyTopics.join(', ') : 'general conversation'}`,
				`We can create ${Math.min(stats.keyTopics.length + 2, 5)} custom scenarios for you`,
				`Your ${stats.estimatedLevel} level conversations are perfect for targeted practice`,
				'Scenarios will match your interests and skill level'
			];

		default: // regular
			return [
				`Completed ${stats.userMessages} exchanges in ${stats.practiceTime} minutes`,
				`Conversation covered: ${stats.keyTopics.length > 0 ? stats.keyTopics.join(', ') : 'general topics'}`,
				`Your ${stats.estimatedLevel} level responses show consistent progress`,
				'Ready for detailed grammar and vocabulary analysis'
			];
	}
}

/**
 * Estimate user level based on message complexity
 */
function estimateUserLevel(userMessages: Message[]): string {
	if (userMessages.length === 0) return 'beginner';

	const avgWordsPerMessage = userMessages.reduce((sum, msg) =>
		sum + msg.content.split(' ').length, 0) / userMessages.length;

	if (avgWordsPerMessage < 3) return 'beginner';
	if (avgWordsPerMessage < 8) return 'intermediate';
	return 'advanced';
}

/**
 * Determine analysis type based on user status and conversation context
 */
export function determineAnalysisType(
	userPreferencesProvider: UserPreferencesProvider
): AnalysisType {
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

/**
 * Get quick analysis for immediate display
 */
export function getQuickAnalysis(
	messages: Message[],
	language: Language,
	analysisType: AnalysisType = 'regular'
): AnalysisResult {
	return handleQuickAnalysis(messages, language, analysisType);
}

export default {
	analyzeConversation,
	determineAnalysisType,
	getScenarioGenerationType,
	getQuickAnalysis
};
