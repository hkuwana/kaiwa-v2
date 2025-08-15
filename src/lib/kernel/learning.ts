// 🎯 Learning Scenario Types
// Core interfaces for task-oriented language learning

import type { Scenario, ScenarioOutcome } from '$lib/server/db/types';

// 🎯 Re-export schema types for convenience
export type LearningScenario = Scenario;
export type { ScenarioOutcome };

// 🎯 Additional types not in the schema
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type Category =
	| 'food'
	| 'travel'
	| 'business'
	| 'social'
	| 'shopping'
	| 'health'
	| 'education';

export interface VocabularyAssessment {
	word: string;
	wasUsed: boolean;
	wasUsedCorrectly: boolean;
	context: string; // How it was used
	score: number; // 0.0 to 1.0
}

export interface GrammarAssessment {
	pattern: string;
	wasDemonstrated: boolean;
	accuracy: number; // 0.0 to 1.0
	examples: string[]; // How it was used
	errors: string[]; // What went wrong
}

export interface GoalAssessment {
	step: string;
	wasCompleted: boolean;
	completionMethod: string; // How they achieved it
	score: number; // 0.0 to 1.0
}

// 🎭 AI Role Configuration
export interface AIRoleConfig {
	role: string;
	personality: string;
	conversationStyle: 'formal' | 'casual' | 'friendly' | 'professional';
	responseLength: 'short' | 'medium' | 'long';
	correctionStyle: 'gentle' | 'direct' | 'encouraging';

	// Language-specific behaviors
	useHonorifics: boolean; // For Japanese, Korean, etc.
	formalityLevel: 'casual' | 'polite' | 'formal';

	// Learning support behaviors
	provideHints: boolean;
	correctErrors: boolean;
	encourageRetry: boolean;
	celebrateSuccess: boolean;
}

// 📊 Assessment Configuration
export interface AssessmentConfig {
	// Scoring weights
	vocabularyWeight: number; // 0.0 to 1.0
	grammarWeight: number; // 0.0 to 1.0
	goalCompletionWeight: number; // 0.0 to 1.0
	pronunciationWeight: number; // 0.0 to 1.0

	// Thresholds
	passingScore: number; // Minimum score to "pass"
	excellentScore: number; // Score for "excellent" performance

	// Feedback generation
	generateDetailedFeedback: boolean;
	includeSuggestions: boolean;
	highlightStrengths: boolean;
}

// 🔄 Scenario Session State
export interface ScenarioSession {
	scenario: LearningScenario;
	startTime: number;
	currentStep: number;
	completedSteps: string[];
	usedVocabulary: string[];
	grammarPatterns: string[];

	// Scaffolding usage tracking
	hintsUsed: number;
	translationsUsed: number;
	exampleResponsesViewed: number;

	// Progress tracking
	goalProgress: number; // 0.0 to 1.0
	vocabularyProgress: number; // 0.0 to 1.0
	grammarProgress: number; // 0.0 to 1.0
}

// 🎯 Default Assessment Configuration
export const defaultAssessmentConfig: AssessmentConfig = {
	vocabularyWeight: 0.4,
	grammarWeight: 0.3,
	goalCompletionWeight: 0.2,
	pronunciationWeight: 0.1,

	passingScore: 0.7,
	excellentScore: 0.9,

	generateDetailedFeedback: true,
	includeSuggestions: true,
	highlightStrengths: true
};

// 🎭 Default AI Role Configurations
export const defaultAIRoleConfigs: Record<Category, AIRoleConfig> = {
	food: {
		role: 'restaurant staff member',
		personality: 'friendly and helpful',
		conversationStyle: 'friendly',
		responseLength: 'medium',
		correctionStyle: 'encouraging',
		useHonorifics: true,
		formalityLevel: 'polite',
		provideHints: true,
		correctErrors: true,
		encourageRetry: true,
		celebrateSuccess: true
	},
	travel: {
		role: 'local resident or guide',
		personality: 'knowledgeable and patient',
		conversationStyle: 'friendly',
		responseLength: 'medium',
		correctionStyle: 'gentle',
		useHonorifics: true,
		formalityLevel: 'polite',
		provideHints: true,
		correctErrors: true,
		encourageRetry: true,
		celebrateSuccess: true
	},
	business: {
		role: 'business colleague or client',
		personality: 'professional and courteous',
		conversationStyle: 'professional',
		responseLength: 'medium',
		correctionStyle: 'direct',
		useHonorifics: true,
		formalityLevel: 'formal',
		provideHints: false,
		correctErrors: true,
		encourageRetry: false,
		celebrateSuccess: true
	},
	social: {
		role: 'friend or acquaintance',
		personality: 'warm and supportive',
		conversationStyle: 'casual',
		responseLength: 'short',
		correctionStyle: 'gentle',
		useHonorifics: false,
		formalityLevel: 'casual',
		provideHints: true,
		correctErrors: true,
		encourageRetry: true,
		celebrateSuccess: true
	},
	shopping: {
		role: 'store clerk or vendor',
		personality: 'helpful and enthusiastic',
		conversationStyle: 'friendly',
		responseLength: 'medium',
		correctionStyle: 'encouraging',
		useHonorifics: true,
		formalityLevel: 'polite',
		provideHints: true,
		correctErrors: true,
		encourageRetry: true,
		celebrateSuccess: true
	},
	health: {
		role: 'medical staff or pharmacist',
		personality: 'caring and professional',
		conversationStyle: 'professional',
		responseLength: 'medium',
		correctionStyle: 'gentle',
		useHonorifics: true,
		formalityLevel: 'formal',
		provideHints: true,
		correctErrors: true,
		encourageRetry: true,
		celebrateSuccess: true
	},
	education: {
		role: 'teacher or tutor',
		personality: 'patient and encouraging',
		conversationStyle: 'friendly',
		responseLength: 'medium',
		correctionStyle: 'encouraging',
		useHonorifics: true,
		formalityLevel: 'polite',
		provideHints: true,
		correctErrors: true,
		encourageRetry: true,
		celebrateSuccess: true
	}
};
