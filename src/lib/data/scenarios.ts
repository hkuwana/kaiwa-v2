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
		instructions: "Introduce yourself to a friendly barista and share why you're learning.",
		context:
			'Morning light through the window, clink of cups, the barista asks your name and what brings you in.',
		expectedOutcome: 'Exchange greetings and a short intro while feeling at ease',
		learningObjectives: ['basic greetings', 'self-introduction', 'reasons for learning'],
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
		title: 'Map Your Week Over Coffee',
		description: 'Plan your week like a traveler plotting a route.',
		category: 'comfort',
		difficulty: 'beginner',
		instructions: 'Talk through key plans, times, and priorities for the week.',
		context: 'Notebook open, calendar on your phone—you sketch the route from Monday to Friday.',
		expectedOutcome: 'Clearly outline your week and confirm times',
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
		title: 'A Day in Your City',
		description: 'Walk through your day from sunrise to night lights.',
		category: 'comfort',
		difficulty: 'beginner',
		instructions: 'Describe your routine with places, times, and feelings.',
		context: 'From the morning train to the evening stroll, paint the picture.',
		expectedOutcome: 'Comfortably narrate daily life and small rituals',
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
		title: 'Tapas at a Barcelona Bar',
		description: 'Squeeze into a lively tapas bar and order like a local.',
		category: 'comfort',
		difficulty: 'beginner',
		instructions: 'Ask for recommendations, order plates, and chat with the bartender.',
		context:
			'Warm lights, a chalkboard menu, clatter of plates, the smell of garlic and olive oil.',
		expectedOutcome: 'Order confidently and enjoy small talk at the bar',
		learningObjectives: [
			'menu',
			'recommendation',
			'order',
			'small plates',
			'allergy',
			'bill',
			'table vs counter',
			'delicious',
			'favorite',
			'drink'
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
		title: 'Park Meetup: Sharing Your Passions',
		description: 'Join a casual meetup and bond over what you love.',
		category: 'comfort',
		difficulty: 'beginner',
		instructions: 'Introduce your hobby, ask questions, and find common interests.',
		context: 'Picnic blankets, street musicians in the distance—you meet new friends.',
		expectedOutcome: 'Swap stories and make plans to practice together',
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
		title: 'Last‑Minute Weekend Escape',
		description: 'Plan a quick getaway like catching a fast train to the coast.',
		category: 'comfort',
		difficulty: 'beginner',
		instructions: 'Discuss options, compare times and costs, and settle on a plan.',
		context: 'Timetables, a weather app, and a shared mood for adventure.',
		expectedOutcome: 'Agree on a destination and meeting time',
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
		title: 'Old Town Stroll: Hidden Gems',
		description: 'Wander cobblestone streets and ask locals for the best spots.',
		category: 'comfort',
		difficulty: 'beginner',
		instructions: 'Ask for directions, opening hours, and what not to miss.',
		context: 'A map folded in your hand, church bells in the distance.',
		expectedOutcome: 'Find your way and discover a place off the guidebook route',
		learningObjectives: [
			'directions',
			'open/close times',
			'landmarks',
			'neighborhood',
			'local tips',
			'map',
			'busy vs quiet',
			'price',
			'reservations',
			'photo spot'
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
		title: 'Riverside Sunset: Weekly Reflection',
		description: 'Slow down, look back, and set gentle intentions ahead.',
		category: 'comfort',
		difficulty: 'beginner',
		instructions: 'Reflect on wins, challenges, and one small next step.',
		context: 'Golden light on the water; you journal while the city softens.',
		expectedOutcome: 'Name what mattered and what comes next',
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
		title: 'Rooftop Date Under City Lights',
		description: 'Plan a thoughtful evening with small, memorable touches.',
		category: 'relationships',
		difficulty: 'intermediate',
		instructions: 'Share ideas, preferences, and make a plan that feels special.',
		context: 'Warm night breeze, skyline twinkling—choose a spot that feels right.',
		expectedOutcome: 'Agree on a plan that fits both moods and budgets',
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
		title: 'Calling Home From the Platform',
		description: 'Share good news with family as a train hums in the background.',
		category: 'relationships',
		difficulty: 'intermediate',
		instructions: 'Give clear updates, express gratitude, and answer caring questions.',
		context: 'Announcements overhead, suitcase by your feet, familiar voices in your ear.',
		expectedOutcome: 'Make them feel close and in the loop',
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
		title: 'Night Walk: Hopes and Values',
		description: 'Trade unhurried questions that open doors.',
		category: 'relationships',
		difficulty: 'advanced',
		instructions: 'Name what matters, listen well, and reflect back.',
		context: 'Quiet streets, soft glow of windows—honesty in the air.',
		expectedOutcome: 'Feel seen and deepen mutual understanding',
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
		title: 'Kitchen Table Talk',
		description: 'Work through a misunderstanding with care.',
		category: 'relationships',
		difficulty: 'advanced',
		instructions: 'State feelings, seek to understand, and co-create a next step.',
		context: 'Two cups of tea, phones face down, a gentle pace.',
		expectedOutcome: 'Reach a respectful, specific agreement',
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
