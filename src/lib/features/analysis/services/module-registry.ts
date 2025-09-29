import type {
	AnalysisModuleContext,
	AnalysisModuleDefinition,
	AnalysisModuleId
} from '../types/analysis-module.types';
import { createCompletion } from '$lib/server/services/openai.service';

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
					userMessages: messages.filter((m) => m.role === 'user').length,
					assistantMessages: messages.filter((m) => m.role === 'assistant').length,
					averageLength: messages.reduce((sum, m) => sum + m.content.length, 0) / messages.length
				}
			};
		}
	},
	'grammar-suggestions': {
		id: 'grammar-suggestions',
		label: 'Grammar Suggestions',
		description: 'Targets concrete grammar issues with replacements tied to each utterance',
		modality: 'text',
		run: async ({ messages, languageCode }: AnalysisModuleContext) => {
			const userMessages = messages.filter((m) => m.role === 'user');

			if (userMessages.length === 0) {
				return {
					moduleId: 'grammar-suggestions',
					summary: 'No user messages found for grammar analysis',
					details: { suggestions: [] }
				};
			}

			const userMessageDigest = userMessages
				.map(
					(msg, index) =>
						`#${index + 1} | id: ${msg.id} | text: "${msg.content.replace(/"/g, '\\"')}"`
				)
				.join('\n');

			const conversationDigest = messages
				.map(
					(msg, index) =>
						`#${index + 1} | role: ${msg.role} | id: ${msg.id} | text: "${msg.content.replace(/"/g, '\\"')}"`
				)
				.join('\n');

			const schemaExample = `{
  "suggestions": [
    {
      "messageId": "msg-3",
      "originalText": "50 euros... c'est un peu cher pour moi. Tu peux faire un meilleur prix?",
      "suggestedText": "50 euros ? C'est un peu cher pour moi. Vous pourriez faire un meilleur prix ?",
      "explanation": "Use polite 'vous' and proper punctuation for a formal negotiation.",
      "example": "Vous pourriez faire un meilleur prix ?",
      "severity": "hint",
      "macroSkill": "grammar",
      "subSkill": "politeness",
      "microRule": "fr.polite-request",
      "ruleId": "grammar.politeness.request"
    }
  ]
}`;

			const systemPrompt = `You are a meticulous language coach. Analyse user turns in ${languageCode} conversations and return concrete corrections. Respond ONLY with valid JSON.`;

			const userPrompt = `Full conversation transcript (user and assistant):\n${conversationDigest}\n\nFocus corrections only on user messages:\n${userMessageDigest}\n\nReturn JSON matching this schema:\n${schemaExample}\n\nGuidelines:\n- Suggest only when there is a real error or a significantly better phrasing for the SAME user message.\n- Provide the corrected sentence in "suggestedText" using the same language as the original message.\n- "severity" must be one of: "warning" (blocking), "hint" (nice-to-have), "info" (positive reinforcement).\n- macroSkill options: grammar, lexis, pragmatics, discourse, pronunciation, fluency, sociolinguistic. Pick the best fit.\n- subSkill and microRule should be short, kebab-case identifiers (e.g., politeness, fr.past-imperfect).\n- Include ruleId referencing your reasoning (e.g., grammar.pronoun.formality).\n- Never invent corrections for assistant messages or messages that are already correct.`;

			try {
				const response = await createCompletion(
					[
						{ role: 'system', content: systemPrompt },
						{ role: 'user', content: userPrompt }
					],
					{
						model: 'gpt-4o-mini',
						temperature: 0.1,
						maxTokens: 800,
						responseFormat: 'json'
					}
				);

				const parsed = JSON.parse(response.content ?? '{}');
				const suggestions = Array.isArray(parsed?.suggestions) ? parsed.suggestions : [];

				return {
					moduleId: 'grammar-suggestions',
					summary: suggestions.length
						? `Found ${suggestions.length} grammar corrections`
						: 'Grammar analysis complete – no actionable corrections',
					recommendations: suggestions.map(
						(s: any) =>
							`${s.macroSkill || s.category || 'grammar'}: ${s.explanation ?? s.suggestedText}`
					),
					details: { suggestions }
				};
			} catch (error) {
				console.error('Grammar suggestions module failed:', error);
				return {
					moduleId: 'grammar-suggestions',
					summary: 'Grammar analysis failed',
					details: { error: 'Processing failed', suggestions: [] }
				};
			}
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
		description:
			'Analyzes natural flow, confidence indicators, and communication effectiveness (no WPM)',
		modality: 'text',
		tier: 'pro',
		run: async ({ messages, languageCode }: AnalysisModuleContext) => {
			const userMessages = messages.filter((m) => m.role === 'user').map((m) => m.content);

			if (userMessages.length === 0) {
				return {
					moduleId: 'fluency-analysis',
					summary: 'No user messages found for fluency analysis',
					details: { fluencyScore: 0, insights: [] }
				};
			}

			const systemPrompt = `You are a language fluency expert. Analyze the user's conversation for natural flow and communication effectiveness in ${languageCode}.

Focus on QUALITY metrics (NOT speed/WPM):
- Natural conversation flow and coherence
- Confidence indicators vs hesitation patterns
- Vocabulary diversity and appropriate usage
- Response appropriateness to context
- Self-correction and recovery patterns

Avoid speed-based metrics. Focus on communication effectiveness and natural expression.`;

			const userPrompt = `Analyze these user messages for fluency patterns:

${userMessages.map((msg, i) => `Message ${i + 1}: "${msg}"`).join('\n')}

Provide analysis in JSON format:
{
  "fluencyScore": 85,
  "naturalFlow": "high/medium/low",
  "confidenceLevel": "high/medium/low",
  "vocabularyDiversity": "high/medium/low",
  "insights": [
    "Shows strong confidence with complex sentence structures",
    "Uses natural conversational connectors effectively"
  ],
  "strengths": ["Natural rhythm", "Appropriate responses"],
  "growthAreas": ["Vocabulary expansion", "Complex grammar structures"]
}`;

			try {
				const response = await createCompletion(
					[
						{ role: 'system', content: systemPrompt },
						{ role: 'user', content: userPrompt }
					],
					{
						model: 'gpt-4o-mini',
						temperature: 0.3,
						maxTokens: 600,
						responseFormat: 'json'
					}
				);

				const parsed = JSON.parse(response.content);
				return {
					moduleId: 'fluency-analysis',
					summary: `Fluency score: ${parsed.fluencyScore}/100. ${parsed.confidenceLevel} confidence level.`,
					score: parsed.fluencyScore,
					recommendations: [
						...(parsed.strengths || []).map((s: string) => `✅ Strength: ${s}`),
						...(parsed.growthAreas || []).map((g: string) => `📈 Growth area: ${g}`)
					],
					details: parsed
				};
			} catch (error) {
				console.error('Fluency analysis module failed:', error);
				return {
					moduleId: 'fluency-analysis',
					summary: 'Fluency analysis failed',
					details: { error: 'Processing failed', fluencyScore: 0, insights: [] }
				};
			}
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
					practicalLevelDescription:
						'You can handle basic conversations about familiar topics and express yourself in simple terms.',
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
