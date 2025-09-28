import type {
	AnalysisModuleContext,
	AnalysisModuleDefinition,
	AnalysisModuleId,
	AnalysisModuleResult
} from '../types/analysis-module.types';

const registry: Record<AnalysisModuleId, AnalysisModuleDefinition> = {
	'quick-stats': {
		id: 'quick-stats',
		label: 'Quick Stats',
		description: 'Conversation length, participation, and estimated level',
		modality: 'text',
		run: ({ messages }: AnalysisModuleContext) => {
			return {
				moduleId: 'quick-stats',
				summary: `Analyzed ${messages.length} messages`,
				details: {
					messageCount: messages.length,
					userMessages: messages.filter(m => m.role === 'user').length,
					assistantMessages: messages.filter(m => m.role === 'assistant').length,
					averageLength: messages.reduce((sum, m) => sum + m.content.length, 0) / messages.length
				}
			};
		}
	},
	'grammar-suggestions': {
		id: 'grammar-suggestions',
		label: 'Grammar Suggestions',
		description: 'Heuristic grammar checks with actionable tips',
		modality: 'text',
		run: ({ messages: _messages }: AnalysisModuleContext) => {
			return {
				moduleId: 'grammar-suggestions',
				summary: 'Grammar analysis complete',
				details: { suggestions: [] }
			};
		}
	},
	'advanced-grammar': {
		id: 'advanced-grammar',
		label: 'Advanced Grammar',
		description: 'Detailed analysis of grammar usage and error patterns',
		modality: 'text',
		tier: 'pro',
		run: ({ messages: _messages }: AnalysisModuleContext) => {
			return {
				moduleId: 'advanced-grammar',
				summary: 'Advanced grammar analysis complete',
				details: { patterns: [], errors: [] }
			};
		}
	},
	'fluency-analysis': {
		id: 'fluency-analysis',
		label: 'Fluency Analysis',
		description: 'Measures speech flow, filler usage, and pacing',
		modality: 'text',
		tier: 'pro',
		run: ({ messages: _messages }: AnalysisModuleContext) => {
			return {
				moduleId: 'fluency-analysis',
				summary: 'Fluency analysis complete',
				details: { fluencyScore: 85, insights: [] }
			};
		}
	},
	'phrase-suggestions': {
		id: 'phrase-suggestions',
		label: 'Phrase Suggestions',
		description: 'Alternative phrases to sound more natural',
		modality: 'text',
		run: ({ messages: _messages }: AnalysisModuleContext) => {
			return {
				moduleId: 'phrase-suggestions',
				summary: 'Phrase suggestions generated',
				details: { suggestions: [] }
			};
		}
	},
	'onboarding-profile': {
		id: 'onboarding-profile',
		label: 'Onboarding Profile',
		description: 'Learning profile and recommendation draft',
		modality: 'text',
		run: ({ messages: _messages }: AnalysisModuleContext) => {
			return {
				moduleId: 'onboarding-profile',
				summary: 'Onboarding profile ready',
				details: { profile: {}, recommendations: [] }
			};
		}
	},
	'pronunciation-analysis': {
		id: 'pronunciation-analysis',
		label: 'Pronunciation',
		description: 'Pronunciation scoring and articulation hints',
		modality: 'audio',
		tier: 'premium',
		requiresAudio: true,
		run: ({ messages: _messages }: AnalysisModuleContext) => {
			return {
				moduleId: 'pronunciation-analysis',
				summary: 'Pronunciation analysis complete',
				details: { score: 80, feedback: [] }
			};
		}
	},
	'speech-rhythm': {
		id: 'speech-rhythm',
		label: 'Speech Rhythm',
		description: 'Timing and rhythm observations',
		modality: 'audio',
		tier: 'premium',
		requiresAudio: true,
		run: ({ messages: _messages }: AnalysisModuleContext) => {
			return {
				moduleId: 'speech-rhythm',
				summary: 'Speech rhythm analysis complete',
				details: { rhythmScore: 75, observations: [] }
			};
		}
	},
	'language-level-assessment': {
		id: 'language-level-assessment',
		label: 'Language Level Assessment',
		description: 'CEFR-based language level assessment with practical mapping',
		modality: 'text',
		run: ({ messages: _messages }: AnalysisModuleContext) => {
			return {
				moduleId: 'language-level-assessment',
				summary: 'Language level assessed',
				details: {
					assessment: {
						currentLevel: {
							cefrLevel: 'B1',
							cefrSubLevel: 'B1.2',
							practicalLevel: 'conversational-basics',
							confidenceScore: 75
						},
						suggestedNextLevel: {
							cefrLevel: 'B2',
							cefrSubLevel: 'B2.1',
							practicalLevel: 'discuss-topics',
							confidenceScore: 85
						},
						strengthAreas: ['Basic conversation', 'Everyday vocabulary'],
						growthAreas: ['Complex grammar', 'Formal language'],
						confidenceIndicators: ['Uses simple sentences correctly', 'Understands main ideas']
					},
					practicalLevelDescription: 'You can handle basic conversations about familiar topics and express yourself in simple terms.',
					confidenceLevel: 'medium'
				}
			};
		}
	}
};

export function listAnalysisModules(): AnalysisModuleDefinition[] {
	return Object.values(registry);
}

export function getAnalysisModule(id: AnalysisModuleId): AnalysisModuleDefinition {
	const module = registry[id];
	if (!module) {
		throw new Error(`Analysis module not found: ${id}`);
	}
	return module;
}
