// 🎯 Scenarios Data
// Simple scenarios data for the MVP

import type { Scenario } from '$lib/server/db/types';

// Extended scenario type with optional speaker selection hints
export type ScenarioWithHints = Scenario & {
	// Preferred locales for the conversation partner's voice (BCP‑47 codes)
	localeHints?: string[]; // e.g., ['en-GB', 'en-US']
	// Soft preference for speaker gender (used as tie-breaker only)
	speakerGenderPreference?: 'male' | 'female' | 'neutral';
	// Preferred target languages for this scenario (language IDs from languages table)
	preferredLanguages?: string[]; // e.g., ['japanese', 'spanish', 'chinese']
};

export const scenariosData: ScenarioWithHints[] = [
	{
		id: 'onboarding-welcome',
		title: 'Meet Your Tutor',
		description: 'Chat about your language goals.',
		category: 'onboarding',
		difficulty: 'beginner',
		instructions:
			'Share what lights you up and where you want to go next. Your local guide will listen closely and shape practice that feels personal to you.',
		context:
			'A warm, well-traveled friend is excited to hear your story and help map out the journey. Relax, chat naturally, and let them gather the details that matter most.',
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
		title: 'Weekly Coffee Planning',
		description: 'Plan your week over coffee.',
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
		title: 'Day In The City',
		description: 'Describe your day in the city.',
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
		title: 'Barcelona Tapas Bar',
		description: 'Order tapas like a local.',
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
		preferredLanguages: ['es'],
		updatedAt: new Date()
	},
	{
		id: 'thursday-hobbies',
		title: 'Park Hobby Meetup',
		description: 'Share your passions at a park.',
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
		title: 'Spontaneous Weekend Getaway',
		description: 'Plan a last-minute trip.',
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
		title: 'Old Town Exploration',
		description: 'Explore and ask for local tips.',
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
		title: 'Riverside Weekly Reflection',
		description: 'Reflect on your week by the river.',
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
		title: 'Rooftop Date Planning',
		description: 'Plan a special date night.',
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
		title: 'Train Platform Family Call',
		description: 'Share good news with family.',
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
		title: 'Deep Connection Night Walk',
		description: 'Discuss hopes and values.',
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
		title: 'Resolving A Misunderstanding',
		description: 'Work through a conflict.',
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
		title: 'Business Conference Negotiation',
		description: 'Negotiate with a business partner.',
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
		title: 'Cozy Bar Flirting',
		description: 'Break the ice at a bar.',
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
		title: 'Job Interview Practice',
		description: 'Answer behavioral questions.',
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
		title: 'Street Market Bargaining',
		description: 'Bargain with a street vendor.',
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
		preferredLanguages: ['es', 'tr', 'ar'],
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date()
	},
	{
		id: 'doctor-appointment',
		title: "Doctor's Appointment",
		description: 'Describe your symptoms.',
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
		title: 'Resolving Hotel Overbooking',
		description: 'Resolve a hotel booking issue.',
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
		title: 'Airport Check-in Problem',
		description: 'Handle a baggage or seating issue.',
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
		title: 'University Office Hours',
		description: 'Clarify concepts with a professor.',
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
		title: 'Viewing Apartment',
		description: 'Ask a landlord about an apartment.',
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
	},
	{
		id: 'izakaya-ordering',
		title: 'Izakaya Night Ordering',
		description: 'Order at a Japanese izakaya.',
		category: 'comfort',
		difficulty: 'intermediate',
		instructions: 'Order drinks and food, ask for recommendations, and enjoy casual conversation.',
		context: 'Warm lanterns, the sizzle of grilled chicken, and friendly chatter around you.',
		expectedOutcome: 'Successfully order a satisfying meal and engage in light conversation',
		learningObjectives: [
			'food ordering',
			'drink preferences',
			'casual conversation',
			'menu navigation',
			'cultural dining'
		],
		comfortIndicators: { confidence: 3, engagement: 5, understanding: 4 },
		localeHints: ['ja-JP'],
		preferredLanguages: ['ja'],
		speakerGenderPreference: 'neutral',
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date()
	},
	{
		id: 'dim-sum-ordering',
		title: 'Dim Sum Brunch',
		description: 'Order from a dim sum cart.',
		category: 'comfort',
		difficulty: 'intermediate',
		instructions: 'Order from the cart, share plates with tablemates, and ask about ingredients.',
		context: 'Busy restaurant, steaming carts, the aroma of dumplings and tea.',
		expectedOutcome: 'Order a variety of dishes and enjoy the communal dining experience',
		learningObjectives: [
			'food descriptions',
			'sharing etiquette',
			'ingredients inquiry',
			'restaurant vocabulary',
			'communal dining'
		],
		comfortIndicators: { confidence: 3, engagement: 5, understanding: 4 },
		localeHints: ['zh-CN', 'zh-HK'],
		preferredLanguages: ['zh'],
		speakerGenderPreference: 'neutral',
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date()
	},
	{
		id: 'roleplay-date-night',
		title: 'Planning a Date Night',
		description: 'Plan a romantic evening.',
		category: 'roleplay',
		difficulty: 'intermediate',
		instructions:
			'Share what kind of atmosphere you both enjoy, pick a place to meet, and plan a small gesture that feels meaningful.',
		context: 'City lights, a favorite playlist, and anticipation for a relaxed night together.',
		expectedOutcome: 'Agree on timing, location, and one special touch that fits both of you',
		learningObjectives: [
			'affectionate language',
			'preference sharing',
			'coordinating schedules',
			'complimenting naturally',
			'planning surprises',
			'checking in on comfort',
			'setting expectations',
			'emotional reassurance'
		],
		comfortIndicators: { confidence: 4, engagement: 5, understanding: 4 },
		speakerGenderPreference: 'female',
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date()
	},
	{
		id: 'roleplay-friends-night-out',
		title: 'Drinks With a Friend',
		description: 'Catch up with a friend at a bar.',
		category: 'roleplay',
		difficulty: 'intermediate',
		instructions:
			'Pick a spot, order drinks, and trade updates about work, relationships, and weekend plans.',
		context: 'A cozy booth, soft background music, and laughter from a nearby table.',
		expectedOutcome:
			'Share highlights honestly, offer encouragement, and settle on the next hangout',
		learningObjectives: [
			'casual storytelling',
			'active listening cues',
			'expressing encouragement',
			'staying inclusive',
			'setting future plans',
			'ordering drinks',
			'light teasing',
			'boundaries with alcohol'
		],
		comfortIndicators: { confidence: 4, engagement: 5, understanding: 4 },
		speakerGenderPreference: 'neutral',
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date()
	},
	{
		id: 'roleplay-family-catchup',
		title: 'Tea With Grandma',
		description: 'Chat with your grandma over tea.',
		category: 'roleplay',
		difficulty: 'beginner',
		instructions:
			'Share recent memories, ask follow-up questions, and respond warmly to advice and anecdotes.',
		context: 'Sunlit kitchen table, teacups clinking, the smell of a fresh pastry.',
		expectedOutcome: 'Leave Grandma feeling cherished and up to date with your life',
		learningObjectives: [
			'family vocabulary',
			'past tense storytelling',
			'expressing gratitude',
			'asking gentle questions',
			'showing empathy',
			'reassuring loved ones',
			'sharing future plans',
			'cultural traditions'
		],
		comfortIndicators: { confidence: 4, engagement: 4, understanding: 4 },
		speakerGenderPreference: 'neutral',
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date()
	}
];

export const getOnboardingScenario = (): ScenarioWithHints | undefined => {
	return scenariosData.find((scenario) => scenario.category === 'onboarding');
};

export const getComfortScenarios = (): ScenarioWithHints[] => {
	return scenariosData.filter((scenario) => scenario.category === 'comfort');
};

export const getScenarioById = (id: string): ScenarioWithHints | undefined => {
	return scenariosData.find((scenario) => scenario.id === id);
};

/**
 * Get scenarios filtered by language preference
 * Prioritizes scenarios that prefer the given language, then returns all others
 */
export const getScenariosByLanguage = (languageId: string): ScenarioWithHints[] => {
	const preferred = scenariosData.filter((scenario) =>
		scenario.preferredLanguages?.includes(languageId)
	);
	const general = scenariosData.filter(
		(scenario) => !scenario.preferredLanguages || !scenario.preferredLanguages.includes(languageId)
	);

	return [...preferred, ...general];
};

/**
 * Get scenarios for a user based on their language preferences
 * If user has preferences for the language, exclude onboarding scenarios
 * If user has no preferences, only show onboarding scenario
 */
export const getScenariosForUser = (
	hasPreferences: boolean,
	languageId?: string
): ScenarioWithHints[] => {
	if (!hasPreferences) {
		// User has no preferences - show only onboarding scenario
		const onboarding = getOnboardingScenario();
		return onboarding ? [onboarding] : [];
	}

	// User has preferences - exclude onboarding, filter by language if specified
	let scenarios = scenariosData.filter((scenario) => scenario.category !== 'onboarding');

	if (languageId) {
		// Prioritize scenarios for the user's language
		const preferred = scenarios.filter((scenario) =>
			scenario.preferredLanguages?.includes(languageId)
		);
		const general = scenarios.filter(
			(scenario) =>
				!scenario.preferredLanguages || !scenario.preferredLanguages.includes(languageId)
		);
		scenarios = [...preferred, ...general];
	}

	return scenarios;
};

/**
 * Get scenarios by category, optionally filtered by language
 */
export const getScenariosByCategory = (
	category: string,
	languageId?: string
): ScenarioWithHints[] => {
	let scenarios = scenariosData.filter((scenario) => scenario.category === category);

	if (languageId) {
		// Prioritize scenarios for the specified language
		const preferred = scenarios.filter((scenario) =>
			scenario.preferredLanguages?.includes(languageId)
		);
		const general = scenarios.filter(
			(scenario) =>
				!scenario.preferredLanguages || !scenario.preferredLanguages.includes(languageId)
		);
		scenarios = [...preferred, ...general];
	}

	return scenarios;
};
