// 🧠 Conversation Kernel - Pure Functional Core
// No state, no side effects, only pure transformations

import type {
	Scenario as LearningScenario,
	ScenarioOutcome,
	Message
} from '$lib/server/db/schema.js';
import { assessScenario } from './assessment.js';

// 🎯 Pure Types - No state, only data structures
export interface ConversationContext {
	messages: Message[];
	scenario?: LearningScenario;
	scenarioSession?: ScenarioSession;
	language?: string;
	voice?: string;
}

export interface ScenarioSession {
	currentStep: number;
	completedSteps: string[];
	usedVocabulary: string[];
	grammarPatterns: string[];
	hintsUsed: number;
	translationsUsed: number;
	exampleResponsesViewed: number;
	goalProgress: number;
	vocabularyProgress: number;
	grammarProgress: number;
}

export interface ConversationAction {
	type:
		| 'START_CONVERSATION'
		| 'RECEIVE_RESPONSE'
		| 'USE_HINT'
		| 'USE_TRANSLATION'
		| 'VIEW_EXAMPLE_RESPONSE';
	payload?: {
		scenario?: LearningScenario;
		transcript?: string;
	};
}

export interface ConversationEffect {
	type: 'TRANSCRIBE' | 'GENERATE_RESPONSE' | 'SPEAK' | 'ASSESS_SCENARIO';
	payload: {
		audio?: ArrayBuffer;
		text?: string;
		scenario?: LearningScenario;
		userTranscripts?: string[];
		goalCompleted?: boolean;
	};
}

// 🧠 Pure Functional Core - No side effects, no state mutation
export const conversationCore = {
	// 🎯 Pure state transitions
	transition: (context: ConversationContext, action: ConversationAction): ConversationContext => {
		switch (action.type) {
			case 'START_CONVERSATION': {
				return {
					...context,
					scenario: action.payload?.scenario,
					scenarioSession: action.payload?.scenario
						? {
								currentStep: 0,
								completedSteps: [],
								usedVocabulary: [],
								grammarPatterns: [],
								hintsUsed: 0,
								translationsUsed: 0,
								exampleResponsesViewed: 0,
								goalProgress: 0,
								vocabularyProgress: 0,
								grammarProgress: 0
							}
						: undefined
				};
			}

			case 'RECEIVE_RESPONSE': {
				if (!context.scenarioSession) return context;

				const transcript = action.payload?.transcript || '';
				const updatedSession = {
					...context.scenarioSession,
					usedVocabulary: [
						...context.scenarioSession.usedVocabulary,
						...extractVocabulary(transcript, context.scenario?.targetVocabulary || [])
					],
					goalProgress: calculateGoalProgress(transcript, context.scenario),
					vocabularyProgress: calculateVocabularyProgress(transcript, context.scenario),
					grammarProgress: calculateGrammarProgress(transcript, context.scenario)
				};

				return {
					...context,
					scenarioSession: updatedSession
				};
			}

			case 'USE_HINT':
				return {
					...context,
					scenarioSession: context.scenarioSession
						? {
								...context.scenarioSession,
								hintsUsed: context.scenarioSession.hintsUsed + 1
							}
						: undefined
				};

			case 'USE_TRANSLATION':
				return {
					...context,
					scenarioSession: context.scenarioSession
						? {
								...context.scenarioSession,
								translationsUsed: context.scenarioSession.translationsUsed + 1
							}
						: undefined
				};

			case 'VIEW_EXAMPLE_RESPONSE':
				return {
					...context,
					scenarioSession: context.scenarioSession
						? {
								...context.scenarioSession,
								exampleResponsesViewed: context.scenarioSession.exampleResponsesViewed + 1
							}
						: undefined
				};

			default:
				return context;
		}
	},

	// 🎯 Pure effect generation
	effects: (context: ConversationContext, action: ConversationAction): ConversationEffect[] => {
		const effects: ConversationEffect[] = [];

		switch (action.type) {
			case 'RECEIVE_RESPONSE': {
				if (context.scenario && context.scenarioSession) {
					const goalCompleted = checkGoalCompletion(
						action.payload?.transcript || '',
						context.scenario
					);
					if (goalCompleted || context.messages.length >= 10) {
						effects.push({
							type: 'ASSESS_SCENARIO',
							payload: {
								scenario: context.scenario,
								userTranscripts: [
									...context.messages.map((m) => m.content),
									action.payload?.transcript || ''
								],
								goalCompleted
							}
						});
					}
				}
				break;
			}
		}

		return effects;
	},

	// 🎯 Pure derived values
	derived: {
		hasActiveScenario: (context: ConversationContext): boolean => !!context.scenario,
		scenarioProgress: (context: ConversationContext): number =>
			context.scenarioSession?.goalProgress || 0,
		vocabularyProgress: (context: ConversationContext): number =>
			context.scenarioSession?.vocabularyProgress || 0,
		grammarProgress: (context: ConversationContext): number =>
			context.scenarioSession?.grammarProgress || 0,
		messageCount: (context: ConversationContext): number => Math.floor(context.messages.length / 2)
	}
};

// 🎯 Pure helper functions
function extractVocabulary(text: string, targetVocabulary: string[]): string[] {
	return targetVocabulary.filter((word) => text.toLowerCase().includes(word.toLowerCase()));
}

function calculateGoalProgress(transcript: string, scenario?: LearningScenario): number {
	if (!scenario?.successCriteria) return 0;

	const completedSteps = scenario.successCriteria.goalSteps.filter((step: string) =>
		transcript.toLowerCase().includes(step.toLowerCase())
	);

	return completedSteps.length / scenario.successCriteria.goalSteps.length;
}

function calculateVocabularyProgress(transcript: string, scenario?: LearningScenario): number {
	if (!scenario?.targetVocabulary) return 0;

	const usedWords = extractVocabulary(transcript, scenario.targetVocabulary);
	return usedWords.length / scenario.targetVocabulary.length;
}

function calculateGrammarProgress(transcript: string, scenario?: LearningScenario): number {
	if (!scenario?.targetGrammar) return 0;

	// Simplified grammar progress calculation
	// This could be enhanced with more sophisticated NLP
	return 0.5; // Placeholder
}

function checkGoalCompletion(transcript: string, scenario: LearningScenario): boolean {
	if (!scenario.successCriteria) return false;

	const goalKeywords = scenario.goal.toLowerCase().split(' ');
	return goalKeywords.some((keyword: string) => transcript.toLowerCase().includes(keyword));
}

// 🎯 Pure kernel factory - returns stateless functions
export function createConversationKernel(): {
	start: (context: ConversationContext, scenario?: LearningScenario) => ConversationContext;
	receiveResponse: (context: ConversationContext, transcript: string) => ConversationContext;
	useHint: (context: ConversationContext) => ConversationContext;
	useTranslation: (context: ConversationContext) => ConversationContext;
	viewExampleResponse: (context: ConversationContext) => ConversationContext;
	getScenarioOutcome: (context: ConversationContext) => ScenarioOutcome | null;
	getEffects: (context: ConversationContext, action: ConversationAction) => ConversationEffect[];
	getDerived: (context: ConversationContext) => {
		hasActiveScenario: boolean;
		scenarioProgress: number;
		vocabularyProgress: number;
		grammarProgress: number;
		messageCount: number;
	};
} {
	return {
		// 🎯 Pure conversation operations
		start: (context: ConversationContext, scenario?: LearningScenario): ConversationContext => {
			return conversationCore.transition(context, {
				type: 'START_CONVERSATION',
				payload: { scenario }
			});
		},

		receiveResponse: (context: ConversationContext, transcript: string): ConversationContext => {
			return conversationCore.transition(context, {
				type: 'RECEIVE_RESPONSE',
				payload: { transcript }
			});
		},

		useHint: (context: ConversationContext): ConversationContext => {
			return conversationCore.transition(context, { type: 'USE_HINT' });
		},

		useTranslation: (context: ConversationContext): ConversationContext => {
			return conversationCore.transition(context, { type: 'USE_TRANSLATION' });
		},

		viewExampleResponse: (context: ConversationContext): ConversationContext => {
			return conversationCore.transition(context, { type: 'VIEW_EXAMPLE_RESPONSE' });
		},

		// 🎯 Pure assessment
		getScenarioOutcome: (context: ConversationContext): ScenarioOutcome | null => {
			if (!context.scenario || !context.scenarioSession) return null;

			const userTranscripts = context.messages
				.filter((m) => m.role === 'user')
				.map((m) => m.content);

			const goalCompleted = checkGoalCompletion(
				userTranscripts[userTranscripts.length - 1] || '',
				context.scenario
			);

			return assessScenario(
				context.scenario,
				userTranscripts,
				goalCompleted,
				0, // duration - would be calculated by orchestrator
				context.messages.length
			);
		},

		// 🎯 Pure effect generation
		getEffects: (
			context: ConversationContext,
			action: ConversationAction
		): ConversationEffect[] => {
			return conversationCore.effects(context, action);
		},

		// 🎯 Pure derived values
		getDerived: (context: ConversationContext) => ({
			hasActiveScenario: conversationCore.derived.hasActiveScenario(context),
			scenarioProgress: conversationCore.derived.scenarioProgress(context),
			vocabularyProgress: conversationCore.derived.vocabularyProgress(context),
			grammarProgress: conversationCore.derived.grammarProgress(context),
			messageCount: conversationCore.derived.messageCount(context)
		})
	};
}

// 🎯 Export the pure kernel
export const conversationKernel = createConversationKernel();
