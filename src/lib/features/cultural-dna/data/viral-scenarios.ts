// 🎭 Viral Scenarios for Cultural DNA Assessment
// 3 micro-scenarios designed to reveal cultural conversation patterns

import type { ViralScenario } from '../types/cultural-dna.types';

export const viralScenarios: ViralScenario[] = [
	{
		id: 'coffee-line-cutting',
		title: 'Coffee Shop Conflict',
		description: 'Someone cuts in line - how do you handle it?',
		situation:
			"You've been waiting in line at a busy coffee shop for 5 minutes. Someone clearly cuts in front of you and starts ordering.",
		context:
			"It's your morning coffee run, you're already running a bit late, and there are people behind you who also saw what happened.",
		targetLanguages: ['ja', 'de', 'es', 'fr', 'it', 'en', 'ko', 'zh', 'nl'],
		analysisWeights: {
			conflictStyle: 0.4, // Primary indicator
			emotionalExpression: 0.3, // How they express frustration
			decisionMaking: 0.1,
			formalityLevel: 0.1,
			communicationPace: 0.1
		}
	},
	{
		id: 'honest-opinion-request',
		title: "Friend's New Look",
		description: 'Your friend asks for your honest opinion on their new haircut',
		situation:
			'Your close friend just got a very dramatic haircut that... doesn\'t look great. They\'re excited and ask: "What do you think? Be honest!"',
		context:
			"You're meeting for lunch, they're clearly proud of their new look, and you can tell they've spent money on this. They really want your genuine reaction.",
		targetLanguages: ['ja', 'de', 'es', 'fr', 'it', 'en', 'ko', 'zh', 'nl'],
		analysisWeights: {
			conflictStyle: 0.2,
			emotionalExpression: 0.2,
			decisionMaking: 0.1,
			formalityLevel: 0.1,
			communicationPace: 0.4 // Primary: directness vs. diplomatic approach
		}
	},
	{
		id: 'running-late-explanation',
		title: 'Running Late Excuse',
		description: "You're 15 minutes late to meet someone - what do you say?",
		situation:
			"You're 15 minutes late to meet someone important (could be work, could be personal). You're just arriving now and they've been waiting.",
		context:
			"The delay was partially your fault (you underestimated travel time) but there was also unexpected traffic. This person's time is valuable.",
		targetLanguages: ['ja', 'de', 'es', 'fr', 'it', 'en', 'ko', 'zh', 'ru'],
		analysisWeights: {
			conflictStyle: 0.1,
			emotionalExpression: 0.2,
			decisionMaking: 0.1,
			formalityLevel: 0.4, // Primary: formal apology vs casual excuse
			communicationPace: 0.2
		}
	},
	{
		id: 'family-dinner-invitation',
		title: 'Unexpected Family Dinner',
		description: "Your partner's family invites you to dinner tonight - how do you respond?",
		situation:
			'It\'s 3 PM and your partner just called: "My mom wants you to come to family dinner tonight at 7. She\'s making your favorite dish!" You had other plans.',
		context:
			"This is the first time you're meeting their extended family. It's clearly important to your partner, but you had plans to finish work and relax.",
		targetLanguages: ['es', 'it', 'ko', 'zh', 'ar', 'hi', 'fil', 'vi'],
		analysisWeights: {
			conflictStyle: 0.1,
			emotionalExpression: 0.2,
			decisionMaking: 0.4, // Primary: family vs. individual priorities
			formalityLevel: 0.2,
			communicationPace: 0.1
		}
	},
	{
		id: 'expensive-restaurant-choice',
		title: 'Pricey Restaurant Decision',
		description: 'Friends suggest an expensive restaurant - how do you navigate this?',
		situation:
			'Your friend group is excitedly planning dinner at a new trendy restaurant. The menu prices are way above your comfort zone, but everyone seems really excited.',
		context:
			"It's someone's birthday celebration, and you don't want to be the party pooper, but the prices would seriously impact your budget.",
		targetLanguages: ['de', 'nl', 'ru', 'tr', 'pt', 'id', 'vi'],
		analysisWeights: {
			conflictStyle: 0.3,
			emotionalExpression: 0.2,
			decisionMaking: 0.2,
			formalityLevel: 0.1,
			communicationPace: 0.2
		}
	}
];

// Helper function to get scenario by ID
export function getViralScenarioById(id: string): ViralScenario | undefined {
	return viralScenarios.find((scenario) => scenario.id === id);
}

// Get scenarios optimized for specific languages
export function getViralScenariosForLanguage(languageCode: string): ViralScenario[] {
	return viralScenarios.filter(
		(scenario) => !scenario.targetLanguages || scenario.targetLanguages.includes(languageCode)
	);
}

// Get all scenario IDs in order
export function getViralScenarioOrder(): string[] {
	return viralScenarios.map((scenario) => scenario.id);
}
