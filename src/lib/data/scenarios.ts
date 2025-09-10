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
	},
	{
		id: 'relationship-date-planning',
		title: 'Planning a Date Night',
		description: 'Practice planning romantic activities and expressing preferences with a partner',
		category: 'relationships',
		difficulty: 'intermediate',
		instructions: 'Discuss date ideas, preferences, and coordinate plans with your partner',
		context: 'Building intimacy through shared activities and thoughtful planning strengthens relationships.',
		expectedOutcome: 'Successfully plan a memorable date while practicing relationship communication',
		learningObjectives: [
			'romantic expressions',
			'activity planning',
			'preferences sharing',
			'time coordination',
			'location discussion',
			'budget considerations',
			'surprise planning',
			'emotional expression',
			'compromise',
			'affection'
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
		id: 'relationship-family-update',
		title: 'Sharing Life Updates with Family',
		description: 'Practice sharing personal news and connecting with relatives about your life',
		category: 'relationships',
		difficulty: 'intermediate',
		instructions: 'Share recent life events, career updates, and personal growth with family members',
		context: 'Maintaining family connections through meaningful conversations about life changes.',
		expectedOutcome: 'Confidently share personal updates and deepen family relationships',
		learningObjectives: [
			'life updates',
			'career discussion',
			'personal growth',
			'family bonds',
			'emotional sharing',
			'achievements',
			'challenges',
			'support seeking',
			'gratitude expression',
			'future plans'
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
		id: 'relationship-deep-connection',
		title: 'Building Deeper Connections',
		description: 'Practice vulnerable conversations that strengthen human bonds and understanding',
		category: 'relationships',
		difficulty: 'advanced',
		instructions: 'Engage in meaningful dialogue about values, dreams, and authentic self-expression',
		context: 'Deep conversations create lasting connections and mutual understanding between people.',
		expectedOutcome: 'Build genuine connections through authentic and vulnerable communication',
		learningObjectives: [
			'vulnerability',
			'active listening',
			'empathy expression',
			'personal values',
			'life philosophy',
			'emotional intelligence',
			'trust building',
			'authentic sharing',
			'meaningful questions',
			'deep understanding'
		],
		comfortIndicators: {
			confidence: 3,
			engagement: 5,
			understanding: 4
		},
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date()
	},
	{
		id: 'relationship-conflict-resolution',
		title: 'Healthy Conflict Resolution',
		description: 'Learn to navigate disagreements and resolve conflicts constructively',
		category: 'relationships',
		difficulty: 'advanced',
		instructions: 'Practice expressing concerns, listening to others, and finding mutually beneficial solutions',
		context: 'Healthy conflict resolution strengthens relationships and builds mutual respect.',
		expectedOutcome: 'Navigate disagreements with empathy and find constructive solutions',
		learningObjectives: [
			'active listening',
			'expressing concerns',
			'empathy',
			'compromise',
			'boundary setting',
			'apology giving',
			'forgiveness',
			'solution finding',
			'emotional regulation',
			'respectful disagreement'
		],
		comfortIndicators: {
			confidence: 3,
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
