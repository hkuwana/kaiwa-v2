// 🎯 Scenarios Data
// Simple scenarios data for the MVP

import type { Scenario } from '$lib/server/db/types';

// Extended scenario type with optional speaker selection hints
export type ScenarioWithHints = Scenario & {
	// Preferred locales for the conversation partner's voice (BCP‑47 codes)
	localeHints?: string[]; // e.g., ['en-GB', 'en-US']
	// Soft preference for speaker gender (used as tie-breaker only)
	speakerGenderPreference?: 'male' | 'female' | 'neutral';
};

export const scenariosData: ScenarioWithHints[] = [
	{
		id: 'onboarding-welcome',
		title: '3-Minute Speaking Assessment',
		description: 'Let our AI understand your speaking level and learning goals',
		category: 'onboarding',
		difficulty: 'beginner',
		instructions:
			'Have a natural conversation about yourself and your language goals. Our AI will listen and create a personalized learning path for you.',
		context:
			'A friendly language coach wants to understand your current level and what you hope to achieve. Just be yourself—this helps us create better conversations for you.',
		expectedOutcome: 'Personalized recommendations based on your conversation',
		learningObjectives: [
			'skill assessment',
			'goal identification',
			'learning preferences',
			'personalized recommendations'
		],
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
		// Spanish bar setting – prefer Spain Spanish if practicing Spanish
		localeHints: ['es-ES'],
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
		// Old town in Europe – lean to local varieties (e.g., Spanish/French/Italian)
		localeHints: ['es-ES', 'fr-FR', 'it-IT'],
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
		// Romantic tone – slight preference to female voices
		speakerGenderPreference: 'female',
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
		// Intimate setting – no strong locale preference
		speakerGenderPreference: 'neutral',
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
	},

	// ——— Added: Wider Variety Scenarios ———
	{
		id: 'biz-conference-negotiation',
		title: 'Negotiating at a Business Conference',
		description: 'Navigate terms, timelines, and concessions with a potential partner.',
		category: 'intermediate',
		difficulty: 'advanced',
		instructions:
			'Clarify goals, propose terms, handle objections, and move toward a tentative agreement.',
		context:
			'A bustling expo floor, coffee in hand, you sit at a high-top table to discuss a deal.',
		expectedOutcome: 'Reach clear next steps and a draft agreement structure',
		learningObjectives: [
			'negotiation language',
			'clarifying questions',
			'concessions and trade-offs',
			'timelines and deliverables',
			'formal vs informal tone'
		],
		comfortIndicators: { confidence: 3, engagement: 4, understanding: 4 },
		// English business contexts commonly use both UK and US varieties
		localeHints: ['en-GB', 'en-US'],
		speakerGenderPreference: 'neutral',
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date()
	},
	{
		id: 'bar-flirting',
		title: 'Flirting at a Cozy Bar',
		description: 'Break the ice, read signals, and keep it playful and respectful.',
		category: 'relationships',
		difficulty: 'intermediate',
		instructions:
			'Open with light conversation, share a bit about yourself, and suggest a next step if it feels right.',
		context: 'Warm lighting, quiet music, and an easy laugh from someone beside you at the bar.',
		expectedOutcome: 'Enjoy a lively chat and optionally exchange contact info',
		learningObjectives: [
			'openers and compliments',
			'playful tone',
			'respectful boundaries',
			'reading cues',
			'suggesting next steps'
		],
		comfortIndicators: { confidence: 3, engagement: 5, understanding: 4 },
		localeHints: ['en-US', 'es-ES', 'fr-FR'],
		speakerGenderPreference: 'female',
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date()
	},
	{
		id: 'job-interview',
		title: 'Job Interview: Behavioral Questions',
		description: 'Structure examples with STAR, ask smart questions, and show fit.',
		category: 'intermediate',
		difficulty: 'advanced',
		instructions:
			'Answer behavioral prompts, back them with specifics, and ask clarifying questions.',
		context: 'Conference room or video call with a hiring manager and a notepad at hand.',
		expectedOutcome: 'Deliver concise, persuasive answers and build rapport',
		learningObjectives: [
			'STAR method',
			'clarifying questions',
			'professional tone',
			'summarizing strengths',
			'closing questions'
		],
		comfortIndicators: { confidence: 3, engagement: 4, understanding: 4 },
		localeHints: ['en-US', 'en-GB'],
		speakerGenderPreference: 'neutral',
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date()
	},
	{
		id: 'market-haggling',
		title: 'Haggling in a Street Market',
		description: 'Ask prices, compare quality, and bargain politely.',
		category: 'basic',
		difficulty: 'intermediate',
		instructions: 'Greet, ask for price, counter-offer, and agree politely or walk away kindly.',
		context: 'Colorful stalls, friendly sellers, and lively chatter fill the air.',
		expectedOutcome: 'Reach a fair price or decline respectfully',
		learningObjectives: [
			'prices and numbers',
			'polite bargaining',
			'quality descriptions',
			'cash vs card',
			'final offers'
		],
		comfortIndicators: { confidence: 4, engagement: 5, understanding: 4 },
		localeHints: ['es-MX', 'es-ES', 'tr-TR'],
		speakerGenderPreference: 'neutral',
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date()
	},
	{
		id: 'doctor-appointment',
		title: 'Doctor Appointment: Symptoms and History',
		description: 'Describe symptoms, timeline, and medications clearly.',
		category: 'basic',
		difficulty: 'intermediate',
		instructions: 'Explain what you feel, when it started, any triggers, and ask about next steps.',
		context: 'Calm clinic room; the doctor is attentive and taking notes.',
		expectedOutcome: 'Share clear history and understand the plan',
		learningObjectives: [
			'symptoms vocabulary',
			'timeline and severity',
			'allergies and meds',
			'follow-up instructions',
			'asking for clarification'
		],
		comfortIndicators: { confidence: 3, engagement: 4, understanding: 4 },
		localeHints: ['fr-FR', 'en-GB', 'en-US'],
		speakerGenderPreference: 'neutral',
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date()
	},
	{
		id: 'hotel-overbooking',
		title: 'Hotel Overbooking: Calm Resolution',
		description: 'Stay courteous while requesting solutions and compensation.',
		category: 'intermediate',
		difficulty: 'intermediate',
		instructions:
			'Explain the reservation, express inconvenience, and ask for options like rebooking or upgrades.',
		context: 'Reception desk, suitcase beside you; the clerk looks apologetic.',
		expectedOutcome: 'Secure a suitable room or alternative with fair terms',
		learningObjectives: [
			'polite escalation',
			'service vocabulary',
			'compensation requests',
			'dates and times',
			'solutions language'
		],
		comfortIndicators: { confidence: 4, engagement: 4, understanding: 4 },
		localeHints: ['it-IT', 'en-GB', 'en-US'],
		speakerGenderPreference: 'neutral',
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date()
	},
	{
		id: 'airport-checkin-issue',
		title: 'Airport Check‑in Issue',
		description: 'Handle baggage or seating problems under time pressure.',
		category: 'basic',
		difficulty: 'intermediate',
		instructions: 'Explain the issue briefly, ask about options, and choose efficiently.',
		context: 'Busy counter, announcements overhead; you need a quick resolution.',
		expectedOutcome: 'Get a workable solution and boarding pass updated',
		learningObjectives: [
			'baggage terms',
			'seat options',
			'fees and policies',
			'time expressions',
			'calm escalation'
		],
		comfortIndicators: { confidence: 4, engagement: 4, understanding: 4 },
		localeHints: ['de-DE', 'en-GB', 'en-US'],
		speakerGenderPreference: 'neutral',
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date()
	},
	{
		id: 'university-office-hours',
		title: 'University Office Hours: Clarify Concepts',
		description: 'Ask targeted questions and confirm your understanding.',
		category: 'intermediate',
		difficulty: 'intermediate',
		instructions: 'Explain what confuses you, reference examples, and summarize what you learned.',
		context: 'Quiet office; your professor invites you to walk through a problem.',
		expectedOutcome: 'Leave with a clear plan to study and practice',
		learningObjectives: [
			'academic vocabulary',
			'clarifying questions',
			'paraphrasing',
			'summarizing',
			'next steps'
		],
		comfortIndicators: { confidence: 3, engagement: 4, understanding: 4 },
		localeHints: ['en-US', 'en-GB'],
		speakerGenderPreference: 'neutral',
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date()
	},
	{
		id: 'apartment-viewing',
		title: 'Apartment Viewing with a Landlord',
		description: 'Ask about rent, utilities, rules, and negotiate a bit.',
		category: 'basic',
		difficulty: 'intermediate',
		instructions:
			'Ask practical questions, clarify contract terms, and express interest or concerns.',
		context: 'Bright living room; you tour the place and chat about details.',
		expectedOutcome: 'Decide on next steps and application requirements',
		learningObjectives: [
			'rental terms',
			'utilities',
			'deposit and fees',
			'house rules',
			'contract basics'
		],
		comfortIndicators: { confidence: 4, engagement: 4, understanding: 4 },
		localeHints: ['en-US', 'en-GB', 'fr-FR'],
		speakerGenderPreference: 'neutral',
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
