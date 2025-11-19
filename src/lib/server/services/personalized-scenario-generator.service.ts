// src/lib/server/services/personalized-scenario-generator.service.ts
// Generates personalized scenarios using OpenAI based on user's high-stakes conversation goal

import OpenAI from 'openai';
import { logger } from '$lib/server/logger';
import type { Language } from '$lib/server/db/types';

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY
});

/**
 * Input for generating a personalized scenario
 */
export interface PersonalizedScenarioRequest {
	userId: string;
	targetLanguage: Language;
	conversationGoal: string; // "meeting boyfriend's parents", "job interview"
	conversationTimeline?: string; // "3 weeks", "next month"
	conversationParticipants?: string; // "Yuto's parents in Tokyo"
	userContext?: {
		relationshipDuration?: string;
		occupation?: string;
		interests?: string[];
		learningReason?: string;
		nativeLanguage?: string;
	};
}

/**
 * Generated personalized scenario output
 */
export interface GeneratedPersonalizedScenario {
	title: string;
	description: string;
	context: string;
	expectedOutcome: string;
	learningObjectives: string[];
	personalizedPhrases: Array<{
		targetLanguage: string;
		english: string;
		usage?: string;
	}>;
	suggestedPracticeFrequency: string; // "2-3 times per week"
	estimatedSessions: number; // How many practice sessions recommended
	timelineMotivation?: string; // "You have 3 weeks until you meet them"
}

/**
 * ICP-specific scenario templates
 * These align with the primary personas (Sofia, David, Jamie, Rosa)
 */
const ICP_TEMPLATES = {
	family_meeting: {
		keywords: ['meeting', 'family', 'parents', 'boyfriend', 'girlfriend', 'partner'],
		icpPersona: 'Sofia (Bilingual Spouse)',
		defaultMotivation: 'building relationship with partner's family'
	},
	heritage_reconnection: {
		keywords: ['reconnect', 'grandmother', 'grandfather', 'abuela', 'abuelo', 'family reunion'],
		icpPersona: 'David (Heritage Speaker)',
		defaultMotivation: 'reconnecting with cultural roots'
	},
	relocation_expat: {
		keywords: ['moving', 'relocating', 'new country', 'expat', 'living abroad'],
		icpPersona: 'Jamie (Relocation Expat)',
		defaultMotivation: 'building new life in foreign country'
	},
	professional_advancement: {
		keywords: ['job', 'interview', 'work', 'career', 'promotion', 'professional'],
		icpPersona: 'Rosa (Permanent Immigrant)',
		defaultMotivation: 'advancing career in new country'
	}
};

/**
 * Detect ICP persona from conversation goal
 */
function detectICPTemplate(conversationGoal: string): keyof typeof ICP_TEMPLATES | null {
	const goalLower = conversationGoal.toLowerCase();

	for (const [templateKey, template] of Object.entries(ICP_TEMPLATES)) {
		if (template.keywords.some((keyword) => goalLower.includes(keyword))) {
			return templateKey as keyof typeof ICP_TEMPLATES;
		}
	}

	return null;
}

/**
 * Generate personalized scenario using OpenAI GPT-4
 */
export async function generatePersonalizedScenario(
	request: PersonalizedScenarioRequest
): Promise<GeneratedPersonalizedScenario> {
	logger.info('Generating personalized scenario', {
		userId: request.userId,
		language: request.targetLanguage.code,
		goal: request.conversationGoal
	});

	// Detect ICP template
	const icpTemplate = detectICPTemplate(request.conversationGoal);
	const templateInfo = icpTemplate ? ICP_TEMPLATES[icpTemplate] : null;

	// Build context-rich prompt
	const systemPrompt = buildSystemPrompt(request.targetLanguage, templateInfo);
	const userPrompt = buildUserPrompt(request, templateInfo);

	try {
		const completion = await openai.chat.completions.create({
			model: 'gpt-4o', // Use GPT-4 for high-quality generation
			messages: [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: userPrompt }
			],
			temperature: 0.8, // Creative but not too wild
			max_tokens: 2000,
			response_format: { type: 'json_object' }
		});

		const responseText = completion.choices[0]?.message?.content;
		if (!responseText) {
			throw new Error('No response from OpenAI');
		}

		const generated = JSON.parse(responseText) as GeneratedPersonalizedScenario;

		// Validate response
		validateGeneratedScenario(generated);

		logger.info('Successfully generated personalized scenario', {
			userId: request.userId,
			title: generated.title,
			icpTemplate: icpTemplate || 'generic'
		});

		return generated;
	} catch (error) {
		logger.error('Failed to generate personalized scenario', {
			userId: request.userId,
			error: error instanceof Error ? error.message : 'Unknown error'
		});
		throw error;
	}
}

/**
 * Build system prompt for OpenAI
 */
function buildSystemPrompt(targetLanguage: Language, templateInfo: typeof ICP_TEMPLATES[keyof typeof ICP_TEMPLATES] | null): string {
	const icpContext = templateInfo
		? `\n\nThis request matches the "${templateInfo.icpPersona}" ICP persona. This user's primary motivation is ${templateInfo.defaultMotivation}.`
		: '';

	return `You are an expert language learning scenario designer for Kaiwa, a conversation practice app.

Your task is to create HIGHLY PERSONALIZED practice scenarios based on the user's actual high-stakes conversation goal.

Language: ${targetLanguage.name} (${targetLanguage.nativeName})${icpContext}

# CRITICAL Guidelines:

1. **Hyper-Personalization**: Use the EXACT names, places, and context from the user's input
   - If they say "meeting Yuto's parents", use "Yuto" in the scenario
   - If they say "Tokyo", set the scene in Tokyo
   - Make it feel like THEIR scenario, not a generic template

2. **Cultural Authenticity**: Include culturally appropriate context for ${targetLanguage.name}
   - Customs, etiquette, typical conversation flow
   - Region-specific details if location is mentioned

3. **Actionable Phrases**: Generate 8-10 phrases they'll ACTUALLY need
   - Not textbook phrases, but what they'd really say
   - Include personalized elements (names, specific situations)

4. **Realistic Difficulty**: Match the scenario complexity to the high-stakes nature
   - Don't make it too easy (they need real preparation)
   - Don't make it overwhelming (they need to succeed)

5. **Motivational Timeline**: If timeline is provided, use it to create urgency
   - "You have 3 weeks to prepare"
   - "This interview is in 10 days"

# Output Format:

Return valid JSON with this structure:
{
  "title": "Meeting [Specific Name]'s Family - First Dinner",
  "description": "Brief one-sentence description",
  "context": "Detailed scenario setting (2-3 paragraphs, highly specific)",
  "expectedOutcome": "What success looks like",
  "learningObjectives": ["objective1", "objective2", "objective3"],
  "personalizedPhrases": [
    {
      "targetLanguage": "phrase in ${targetLanguage.name}",
      "english": "English translation",
      "usage": "When to use this phrase"
    }
  ],
  "suggestedPracticeFrequency": "2-3 times per week",
  "estimatedSessions": 5,
  "timelineMotivation": "You have X weeks/days to prepare"
}`;
}

/**
 * Build user prompt with all context
 */
function buildUserPrompt(
	request: PersonalizedScenarioRequest,
	templateInfo: typeof ICP_TEMPLATES[keyof typeof ICP_TEMPLATES] | null
): string {
	const contextParts: string[] = [];

	contextParts.push(`**High-Stakes Conversation Goal**: ${request.conversationGoal}`);

	if (request.conversationTimeline) {
		contextParts.push(`**Timeline**: ${request.conversationTimeline}`);
	}

	if (request.conversationParticipants) {
		contextParts.push(`**Participants**: ${request.conversationParticipants}`);
	}

	if (request.userContext) {
		if (request.userContext.occupation) {
			contextParts.push(`**User's Occupation**: ${request.userContext.occupation}`);
		}
		if (request.userContext.relationshipDuration) {
			contextParts.push(`**Context**: ${request.userContext.relationshipDuration}`);
		}
		if (request.userContext.learningReason) {
			contextParts.push(`**Why Learning**: ${request.userContext.learningReason}`);
		}
		if (request.userContext.nativeLanguage) {
			contextParts.push(`**Native Language**: ${request.userContext.nativeLanguage}`);
		}
	}

	return `Generate a personalized ${request.targetLanguage.name} practice scenario for this user:

${contextParts.join('\n')}

${templateInfo ? `**Detected ICP Persona**: ${templateInfo.icpPersona}` : ''}

Create a scenario that:
1. Uses the EXACT names and places they mentioned
2. Feels like preparing for THEIR specific conversation
3. Includes culturally appropriate ${request.targetLanguage.name} context
4. Provides practical phrases they'll actually use
5. Builds confidence for their high-stakes moment

Return the scenario as valid JSON.`;
}

/**
 * Validate generated scenario has all required fields
 */
function validateGeneratedScenario(scenario: any): asserts scenario is GeneratedPersonalizedScenario {
	const required = [
		'title',
		'description',
		'context',
		'expectedOutcome',
		'learningObjectives',
		'personalizedPhrases'
	];

	for (const field of required) {
		if (!scenario[field]) {
			throw new Error(`Generated scenario missing required field: ${field}`);
		}
	}

	if (!Array.isArray(scenario.learningObjectives) || scenario.learningObjectives.length === 0) {
		throw new Error('Generated scenario has invalid learning objectives');
	}

	if (
		!Array.isArray(scenario.personalizedPhrases) ||
		scenario.personalizedPhrases.length === 0
	) {
		throw new Error('Generated scenario has invalid personalized phrases');
	}
}

/**
 * Generate multiple scenario variations for A/B testing
 * Useful for finding the best personalization style
 */
export async function generateScenarioVariations(
	request: PersonalizedScenarioRequest,
	count: number = 3
): Promise<GeneratedPersonalizedScenario[]> {
	const variations = await Promise.all(
		Array.from({ length: count }, () => generatePersonalizedScenario(request))
	);

	return variations;
}
