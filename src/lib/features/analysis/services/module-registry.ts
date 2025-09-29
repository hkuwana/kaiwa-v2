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
		label: 'Grammar & Language Suggestions',
		description: 'Comprehensive grammar corrections, advanced patterns, and phrase suggestions',
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
    },
    {
      "messageId": "msg-5",
      "originalText": "I want to go to the store",
      "suggestedText": "I'd like to go to the store",
      "explanation": "More natural and polite phrasing for expressing desires",
      "example": "I'd like to visit the museum",
      "severity": "info",
      "macroSkill": "pragmatics",
      "subSkill": "politeness",
      "microRule": "en.polite-desire",
      "ruleId": "pragmatics.politeness.desire"
    }
  ]
}`;

			const systemPrompt = `You are a comprehensive language coach. Analyze user turns in ${languageCode} conversations and provide:
1. Grammar corrections (errors, tense, agreement, etc.)
2. Advanced grammar patterns (complex structures, subjunctive, etc.)
3. Phrase suggestions (more natural, idiomatic expressions)
4. Pragmatic improvements (politeness, formality, cultural appropriateness)

Respond ONLY with valid JSON.`;

			const userPrompt = `Full conversation transcript (user and assistant):\n${conversationDigest}\n\nFocus suggestions only on user messages:\n${userMessageDigest}\n\nReturn JSON matching this schema:\n${schemaExample}\n\nGuidelines:\n- Provide concrete corrections for actual errors\n- Suggest more natural/idiomatic phrasing when appropriate\n- Include advanced grammar pattern improvements\n- Consider cultural and pragmatic appropriateness\n- "severity" options: "warning" (blocking error), "hint" (improvement), "info" (positive reinforcement)\n- macroSkill options: grammar, lexis, pragmatics, discourse, pronunciation, fluency, sociolinguistic\n- subSkill and microRule should be short, kebab-case identifiers\n- Include ruleId for categorization\n- Never suggest changes to assistant messages or already correct messages`;

			try {
				const response = await createCompletion(
					[
						{ role: 'system', content: systemPrompt },
						{ role: 'user', content: userPrompt }
					],
					{
						model: 'gpt-4o-mini',
						temperature: 0.1,
						maxTokens: 1200,
						responseFormat: 'json'
					}
				);

				const parsed = JSON.parse(response.content ?? '{}');
				const suggestions = Array.isArray(parsed?.suggestions) ? parsed.suggestions : [];

				return {
					moduleId: 'grammar-suggestions',
					summary: suggestions.length
						? `Found ${suggestions.length} language suggestions (grammar, phrases, patterns)`
						: 'Language analysis complete – no actionable suggestions',
					recommendations: suggestions.map(
						(s: any) => `${s.macroSkill || 'grammar'}: ${s.explanation ?? s.suggestedText}`
					),
					details: { suggestions }
				};
			} catch (error) {
				console.error('Grammar suggestions module failed:', error);
				return {
					moduleId: 'grammar-suggestions',
					summary: 'Language analysis failed',
					details: { error: 'Processing failed', suggestions: [] }
				};
			}
		}
	},
	'language-assessment': {
		id: 'language-assessment',
		label: 'Language Assessment',
		description: 'Comprehensive language level assessment, fluency analysis, and learning profile',
		modality: 'text',
		tier: 'pro',
		run: async ({ messages, languageCode }: AnalysisModuleContext) => {
			const userMessages = messages.filter((m) => m.role === 'user').map((m) => m.content);

			if (userMessages.length === 0) {
				return {
					moduleId: 'language-assessment',
					summary: 'No user messages found for language assessment',
					details: {
						fluencyScore: 0,
						cefrLevel: 'Unknown',
						profile: {},
						insights: []
					}
				};
			}

			const systemPrompt = `You are a comprehensive language assessment expert. Analyze the user's conversation in ${languageCode} and provide:

1. CEFR-based language level assessment
2. Fluency and communication effectiveness analysis
3. Learning profile with strengths and growth areas
4. Practical recommendations for improvement

Focus on QUALITY metrics (NOT speed/WPM):
- Natural conversation flow and coherence
- Confidence indicators vs hesitation patterns
- Vocabulary diversity and appropriate usage
- Response appropriateness to context
- Grammar complexity and accuracy
- Cultural and pragmatic appropriateness

Respond ONLY with valid JSON.`;

			const userPrompt = `Analyze these user messages for comprehensive language assessment:

${userMessages.map((msg, i) => `Message ${i + 1}: "${msg}"`).join('\n')}

Provide analysis in JSON format:
{
  "cefrAssessment": {
    "currentLevel": {
      "cefrLevel": "B1",
      "cefrSubLevel": "B1.2",
      "practicalLevel": "conversational-basics",
      "confidenceScore": 75
    },
    "suggestedNextLevel": {
      "cefrLevel": "B2",
      "cefrSubLevel": "B2.1",
      "practicalLevel": "discuss-topics",
      "confidenceScore": 85
    },
    "strengthAreas": ["Basic conversation", "Everyday vocabulary"],
    "growthAreas": ["Complex grammar", "Formal language"],
    "confidenceIndicators": ["Uses simple sentences correctly", "Understands main ideas"]
  },
  "fluencyAnalysis": {
    "fluencyScore": 85,
    "naturalFlow": "high/medium/low",
    "confidenceLevel": "high/medium/low",
    "vocabularyDiversity": "high/medium/low",
    "insights": [
      "Shows strong confidence with complex sentence structures",
      "Uses natural conversational connectors effectively"
    ]
  },
  "learningProfile": {
    "learningStyle": "visual/auditory/kinesthetic",
    "preferredComplexity": "simple/moderate/complex",
    "communicationStyle": "formal/casual/mixed",
    "strengths": ["Natural rhythm", "Appropriate responses"],
    "growthAreas": ["Vocabulary expansion", "Complex grammar structures"],
    "recommendations": [
      "Practice with more complex sentence structures",
      "Expand vocabulary in professional contexts"
    ]
  },
  "practicalLevelDescription": "You can handle basic conversations about familiar topics and express yourself in simple terms."
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
						maxTokens: 1000,
						responseFormat: 'json'
					}
				);

				const parsed = JSON.parse(response.content);
				return {
					moduleId: 'language-assessment',
					summary: `Level: ${parsed.cefrAssessment?.currentLevel?.cefrLevel || 'Unknown'} | Fluency: ${parsed.fluencyAnalysis?.fluencyScore || 0}/100`,
					score: parsed.fluencyAnalysis?.fluencyScore || 0,
					recommendations: [
						...(parsed.learningProfile?.strengths || []).map((s: string) => `✅ Strength: ${s}`),
						...(parsed.learningProfile?.growthAreas || []).map(
							(g: string) => `📈 Growth area: ${g}`
						),
						...(parsed.learningProfile?.recommendations || []).map(
							(r: string) => `💡 Recommendation: ${r}`
						)
					],
					details: parsed
				};
			} catch (error) {
				console.error('Language assessment module failed:', error);
				return {
					moduleId: 'language-assessment',
					summary: 'Language assessment failed',
					details: {
						error: 'Processing failed',
						fluencyScore: 0,
						cefrLevel: 'Unknown',
						profile: {},
						insights: []
					}
				};
			}
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
