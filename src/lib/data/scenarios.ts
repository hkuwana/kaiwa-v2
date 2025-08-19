// 🎯 Scenarios Data
// Simple scenarios data for the MVP

import type { LearningScenario } from '$lib/types/conversation';

export const scenarioCategories = ['beginner', 'intermediate', 'advanced'] as const;

export const scenarios: LearningScenario[] = [
	{
		id: 'greeting-1',
		title: 'Basic Greetings',
		description: 'Learn common greetings and introductions',
		language: 'en',
		difficulty: 'beginner',
		targetVocabulary: ['hello', 'goodbye', 'thank you', 'please']
	},
	{
		id: 'restaurant-1',
		title: 'At the Restaurant',
		description: 'Practice ordering food and drinks',
		language: 'en',
		difficulty: 'beginner',
		targetVocabulary: ['menu', 'order', 'bill', 'delicious']
	}
];

export function getBeginnerScenariosForLanguage(language: string): LearningScenario[] {
	return scenarios.filter((s) => s.language === language && s.difficulty === 'beginner');
}
