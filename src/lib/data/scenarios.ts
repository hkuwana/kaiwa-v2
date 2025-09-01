// 🎯 Scenarios Data
// Simple scenarios data for the MVP

import type { Scenario } from '$lib/server/db/types';

export const scenariosData: Scenario[] = [
	{
		id: 'onboarding-welcome',
		title: 'Welcome to Kaiwa',
		description: 'Get comfortable with your first conversation in a new language',
		category: 'onboarding',
		difficulty: 'beginner',
		instructions: 'Introduce yourself and share why you want to learn this language',
		context:
			"This is your first conversation practice session. Take your time and don't worry about making mistakes.",
		expectedOutcome:
			'Feel comfortable speaking in your target language and complete your first conversation',
		learningObjectives: ['basic greetings', 'self-introduction', 'language learning goals'],
		comfortIndicators: {
			confidence: 3,
			engagement: 4,
			understanding: 3
		},
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date()
	},
	{
		id: 'monday-planning',
		title: 'Weekly Planning',
		description: 'Discuss your plans and goals for the week ahead',
		category: 'comfort',
		difficulty: 'beginner',
		instructions: 'Share your weekly schedule and discuss upcoming plans and goals',
		context:
			'Planning and organizing is a common topic in any language. Practice discussing time management and goal setting.',
		expectedOutcome: 'Successfully discuss weekly plans and understand time-related vocabulary',
		learningObjectives: [
			'schedule',
			'meeting',
			'appointment',
			'plan',
			'goal',
			'morning',
			'afternoon',
			'evening',
			'tomorrow',
			'next week'
		],
		comfortIndicators: {
			confidence: 4,
			engagement: 4,
			understanding: 4
		},
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date()
	},
	{
		id: 'tuesday-lifestyle',
		title: 'Daily Routines',
		description: 'Share about your daily activities and habits',
		category: 'comfort',
		difficulty: 'beginner',
		instructions: 'Describe your typical daily routine and discuss lifestyle habits',
		context:
			'Daily routines are universal and help build confidence in describing regular activities.',
		expectedOutcome:
			'Confidently describe daily activities and understand routine-related vocabulary',
		learningObjectives: [
			'wake up',
			'breakfast',
			'lunch',
			'dinner',
			'work',
			'study',
			'exercise',
			'sleep',
			'commute',
			'routine'
		],
		comfortIndicators: {
			confidence: 4,
			engagement: 4,
			understanding: 4
		},
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date()
	},
	{
		id: 'wednesday-food',
		title: 'Food & Dining',
		description: 'Discuss favorite foods, restaurants, and cooking',
		category: 'comfort',
		difficulty: 'beginner',
		instructions: 'Share your food preferences and discuss dining experiences',
		context: 'Food is a universal topic that connects people across cultures.',
		expectedOutcome: 'Discuss food preferences and understand culinary vocabulary',
		learningObjectives: [
			'restaurant',
			'menu',
			'dish',
			'taste',
			'cook',
			'recipe',
			'ingredients',
			'cuisine',
			'flavor',
			'meal'
		],
		comfortIndicators: {
			confidence: 4,
			engagement: 5,
			understanding: 4
		},
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date()
	},
	{
		id: 'thursday-hobbies',
		title: 'Hobbies & Interests',
		description: 'Share about your favorite activities and pastimes',
		category: 'comfort',
		difficulty: 'beginner',
		instructions: 'Discuss your hobbies and interests with enthusiasm',
		context: 'Hobbies help people connect and share personal passions.',
		expectedOutcome: 'Describe hobbies clearly and understand leisure activity vocabulary',
		learningObjectives: [
			'hobby',
			'interest',
			'sport',
			'music',
			'reading',
			'movie',
			'game',
			'collect',
			'practice',
			'enjoy'
		],
		comfortIndicators: {
			confidence: 4,
			engagement: 5,
			understanding: 4
		},
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date()
	},
	{
		id: 'friday-weekend',
		title: 'Weekend Plans',
		description: 'Discuss upcoming weekend activities and relaxation',
		category: 'comfort',
		difficulty: 'beginner',
		instructions: 'Share your weekend plans and discuss relaxation activities',
		context: 'Weekend planning is a common social topic in many cultures.',
		expectedOutcome: 'Discuss weekend activities and understand leisure vocabulary',
		learningObjectives: [
			'weekend',
			'relax',
			'plans',
			'visit',
			'friends',
			'family',
			'trip',
			'activity',
			'rest',
			'fun'
		],
		comfortIndicators: {
			confidence: 4,
			engagement: 4,
			understanding: 4
		},
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date()
	},
	{
		id: 'saturday-travel',
		title: 'Travel & Places',
		description: 'Share travel experiences and dream destinations',
		category: 'comfort',
		difficulty: 'beginner',
		instructions: 'Discuss your travel experiences and dream destinations',
		context: 'Travel connects people across cultures and is a popular conversation topic.',
		expectedOutcome: 'Describe travel experiences and understand travel-related vocabulary',
		learningObjectives: [
			'travel',
			'vacation',
			'destination',
			'country',
			'city',
			'hotel',
			'flight',
			'sightseeing',
			'culture',
			'experience'
		],
		comfortIndicators: {
			confidence: 4,
			engagement: 5,
			understanding: 4
		},
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date()
	},
	{
		id: 'sunday-reflection',
		title: 'Weekly Reflection',
		description: 'Reflect on your week and set new goals',
		category: 'comfort',
		difficulty: 'beginner',
		instructions: 'Reflect on your week and discuss goals for the future',
		context: 'Reflection helps with personal growth and language development.',
		expectedOutcome: 'Reflect on experiences and discuss future goals',
		learningObjectives: [
			'reflect',
			'accomplish',
			'challenge',
			'improve',
			'learn',
			'success',
			'goal',
			'progress',
			'experience',
			'future'
		],
		comfortIndicators: {
			confidence: 4,
			engagement: 4,
			understanding: 4
		},
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date()
	}
];

export const getOnboardingScenario = (): Scenario | undefined => {
	return scenariosData.find((scenario) => scenario.category === 'onboarding');
};

export const getComfortScenarios = (): Scenario[] => {
	return scenariosData.filter((scenario) => scenario.category === 'comfort');
};

export const getScenarioById = (id: string): Scenario | undefined => {
	return scenariosData.find((scenario) => scenario.id === id);
};
