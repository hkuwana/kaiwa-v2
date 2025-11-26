// src/lib/features/learning-path/types.ts

import type { UserPreferences } from '$lib/server/db/types';

/**
 * Input for generating a learning path from user preferences
 */
export interface PathFromPreferencesInput {
	userPreferences: UserPreferences;
	preset?: {
		name: string;
		description: string;
		duration?: number; // Number of days (default: 28)
	};
}

/**
 * Input for generating a learning path from creator brief
 */
export interface PathFromCreatorBriefInput {
	brief: string; // Long-form description of the learning path
	targetLanguage: string;
	duration?: number; // Number of days (default: 30)
	difficultyRange?: {
		start: string; // e.g., 'A1', 'A2'
		end: string; // e.g., 'B1', 'B2'
	};
	primarySkill?: string; // e.g., 'conversation', 'listening'
	metadata?: {
		category?: string;
		tags?: string[];
	};
}

/**
 * Structured output from LLM for a learning path syllabus
 */
export interface GeneratedSyllabus {
	title: string;
	description: string;
	days: Array<{
		dayIndex: number;
		theme: string;
		difficulty: string; // CEFR level or 'beginner', 'intermediate', 'advanced'
		learningObjectives: string[];
		scenarioDescription?: string; // High-level description for scenario generation
	}>;
	metadata?: {
		estimatedMinutesPerDay?: number;
		category?: string;
		tags?: string[];
	};
}

/**
 * Prompt payload for LLM
 */
export interface PromptPayload {
	systemPrompt: string;
	userPrompt: string;
	targetSchema?: object; // JSON schema for structured output
}
