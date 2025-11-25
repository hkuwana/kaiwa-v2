// src/lib/features/learning-path/services/PromptEngineeringService.test.ts

import { describe, it, expect } from 'vitest';
import { PromptEngineeringService } from './PromptEngineeringService';
import type { PathFromPreferencesInput, PathFromCreatorBriefInput } from '../types';

describe('PromptEngineeringService', () => {
	it('builds personalized syllabus prompt including preset details and correct duration schema', () => {
		const input: PathFromPreferencesInput = {
			userPreferences: {
				userId: 'user-123',
				targetLanguageId: 'ja',
				currentLanguageLevel: 'A2',
				practicalLevel: 'intermediate beginner',
				learningGoal: 'Connection',
				specificGoals: ['Have meaningful conversations'],
				challengePreference: 'moderate',
				conversationContext: {
					learningReason: 'Visiting family in Japan',
					occupation: 'Engineer'
				}
			} as any,
			preset: {
				name: 'Meet the Parents',
				description: 'Preparation for meeting a partner’s parents',
				duration: 7
			}
		};

		const prompt = PromptEngineeringService.buildSyllabusPrompt(input);

		expect(prompt.systemPrompt).toContain('conversational JA learning');
		expect(prompt.systemPrompt).toContain('create a 7-day learning path');

		expect(prompt.userPrompt).toContain('Create a 7-day JA learning path');
		expect(prompt.userPrompt).toContain('Course Focus: Meet the Parents');
		expect(prompt.userPrompt).toContain('Preparation for meeting a partner’s parents');

		const schema = prompt.targetSchema as any;
		expect(schema).toBeDefined();
		expect(schema.properties.days.minItems).toBe(7);
		expect(schema.properties.days.maxItems).toBe(7);
	});

	it('builds creator path prompt with metadata and difficulty range', () => {
		const input: PathFromCreatorBriefInput = {
			brief: 'A focused course on meeting your Japanese partner’s parents.',
			targetLanguage: 'ja',
			duration: 10,
			difficultyRange: {
				start: 'A2',
				end: 'B1'
			},
			primarySkill: 'conversation',
			metadata: {
				category: 'relationships',
				tags: ['family', 'formal']
			}
		};

		const prompt = PromptEngineeringService.buildCreatorPathPrompt(input);

		expect(prompt.systemPrompt).toContain('structured 10-day learning path');

		expect(prompt.userPrompt).toContain('Create a 10-day JA learning path');
		expect(prompt.userPrompt).toContain('A focused course on meeting your Japanese partner’s parents.');
		expect(prompt.userPrompt).toContain('Difficulty Range: A2 → B1');
		expect(prompt.userPrompt).toContain('Category: relationships');
		expect(prompt.userPrompt).toMatch(/"tags": \["family","formal"]/);

		const schema = prompt.targetSchema as any;
		expect(schema).toBeDefined();
		expect(schema.properties.days.minItems).toBe(10);
		expect(schema.properties.days.maxItems).toBe(10);
	});

	it('builds day scenario prompt that references previous day themes when provided', () => {
		const prompt = PromptEngineeringService.buildDayScenarioPrompt({
			dayTheme: 'Dinner with family',
			dayIndex: 2,
			difficulty: 'A2',
			learningObjectives: ['Use polite forms at the dinner table'],
			pathContext: {
				title: 'Meet the Parents',
				targetLanguage: 'ja',
				previousDayThemes: ['Introductions and greetings']
			}
		});

		expect(prompt.systemPrompt).toContain('scenario designer for JA language learning');

		expect(prompt.userPrompt).toContain('Create a conversation scenario for Day 2 of "Meet the Parents".');
		expect(prompt.userPrompt).toContain('Theme: Dinner with family');
		expect(prompt.userPrompt).toContain('Day 1: Introductions and greetings');
		expect(prompt.userPrompt).toContain('Learning Objectives:');
	});
});

