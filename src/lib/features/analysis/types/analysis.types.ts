// Core Analysis Types - Minimal, reuses existing types where possible

import type { Message } from '$lib/server/db/types';

// Reuse existing Message type from database schema
// Making timestamp optional to maintain backward compatibility during transition
export type AnalysisMessage = Pick<Message, 'id' | 'role' | 'content'> & {
	timestamp?: Date;
};

// Core analysis result - standardized across all processors
export interface AnalysisResult {
	moduleId: string;
	summary: string;
	confidence?: number; // 0-100, how confident the analysis is
	recommendations?: string[];
	data?: Record<string, unknown>; // Flexible data structure
}

// Language level from our assessment module (reuse existing structure)
export interface LanguageLevel {
	cefrLevel: string; // A1, A2, B1, B2, C1, C2
	cefrSubLevel: string; // A1.1, A1.2, etc.
	practicalLevel: string; // basic-talk, converse-strangers, etc.
	confidenceScore: number; // 0-100
}

// User context for analysis - minimal, focused on what processors need
export interface UserAnalysisContext {
	userId?: string;
	languageCode: string;
	currentLevel?: LanguageLevel;
	conversationId?: string;
}

// Analysis request - what the pipeline needs to run
export interface AnalysisRequest {
	messages: AnalysisMessage[];
	context: UserAnalysisContext;
	moduleIds?: string[]; // Optional: specific modules to run
}

// Complete analysis run result
export interface AnalysisRun {
	runId: string;
	conversationId: string;
	results: AnalysisResult[];
	startedAt: Date;
	completedAt: Date;
	context: UserAnalysisContext;
}

// Processor interface - what each analysis module must implement
export interface AnalysisProcessor {
	id: string;
	name: string;
	description: string;
	modality: 'text' | 'audio';
	tier?: 'free' | 'pro' | 'premium';

	// Main processing function
	process(request: AnalysisRequest): Promise<AnalysisResult> | AnalysisResult;
}

// Level progression tracking (extends userPreferences data)
export interface LevelProgression {
	level: string;
	practicalLevel: string;
	achievedAt: string; // ISO date
	confidenceAtTime: number;
}

// Confidence metrics
export interface ConfidenceMetrics {
	currentScore: number;
	previousScore?: number;
	trend: 'increasing' | 'stable' | 'decreasing';
	indicators: string[];
	milestones: Array<{
		name: string;
		achieved: boolean;
		description: string;
	}>;
}

// Scenario recommendation
export interface ScenarioRecommendation {
	scenarioId: string;
	title: string;
	description: string;
	reasoning: string; // Why this scenario is recommended
	difficultyLevel: string;
	estimatedDuration: number; // minutes
}

// Export commonly used types from existing modules for backwards compatibility
export type {
	AnalysisModuleId,
	AnalysisModuleDefinition,
	AnalysisModuleContext,
	AnalysisModuleResult
} from './analysis-module.types';
