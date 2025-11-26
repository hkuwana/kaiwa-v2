// src/lib/features/learning-path/services/PromptEngineeringService.ts

import type {
	PathFromPreferencesInput,
	PathFromCreatorBriefInput,
	PromptPayload
} from '../types';

/**
 * PromptEngineeringService - Pure prompt generation logic for learning paths
 *
 * This service contains no DB or network dependencies - it's pure TypeScript
 * that transforms inputs into high-quality prompts for LLM syllabus generation.
 *
 * **Design Principles:**
 * - Pure functions (no side effects)
 * - No database or API calls
 * - Testable with simple inputs/outputs
 * - Core IP for curriculum generation
 */
export class PromptEngineeringService {
	/**
	 * Generate a syllabus prompt from user preferences
	 *
	 * This method creates a personalized learning path based on:
	 * - User's current language level (CEFR)
	 * - Learning goals and motivations
	 * - Relationship/heritage context
	 * - Optional preset template
	 *
	 * @param input - User preferences and optional preset
	 * @returns Prompt payload for LLM
	 */
	static buildSyllabusPrompt(input: PathFromPreferencesInput): PromptPayload {
		const { userPreferences, preset } = input;
		const duration = preset?.duration || 28;

		// Extract key user context
		const level = userPreferences.currentLanguageLevel || 'A1.1';
		const goal = userPreferences.learningGoal || 'Connection';
		const context = userPreferences.conversationContext;
		const specificGoals = userPreferences.specificGoals || [];

		// Build rich system prompt
		const systemPrompt = `You are an expert language curriculum designer specializing in conversational ${userPreferences.targetLanguageId?.toUpperCase()} learning.

Your task is to create a ${duration}-day learning path that:
- Starts at CEFR level ${level}
- Gradually increases in difficulty and complexity
- Focuses on practical, real-world conversations
- Balances comfort and challenge (${userPreferences.challengePreference} challenge preference)
- Incorporates cultural context and authentic communication patterns

**Key Principles:**
- Each day should have a clear theme and learning objectives
- Progression should feel natural and achievable
- Content should be emotionally engaging and personally relevant
- Scenarios should prepare learners for real conversations they care about`;

		// Build personalized user prompt
		let userPrompt = `Create a ${duration}-day ${userPreferences.targetLanguageId?.toUpperCase()} learning path for the following learner:

**Learner Profile:**
- Current Level: ${level} (${userPreferences.practicalLevel || 'beginner'})
- Primary Goal: ${goal}`;

		// Add context if available
		if (context?.learningReason) {
			userPrompt += `\n- Learning Reason: ${context.learningReason}`;
		}

		if (context?.occupation) {
			userPrompt += `\n- Occupation: ${context.occupation}`;
		}

		if (specificGoals.length > 0) {
			userPrompt += `\n- Specific Goals: ${specificGoals.join(', ')}`;
		}

		// Add preset context if provided
		if (preset) {
			userPrompt += `\n\n**Course Focus: ${preset.name}**\n${preset.description}`;
		}

		// Add output format instructions
		userPrompt += `\n\n**Output Format:**
Return a JSON object with the following structure:
{
  "title": "Engaging course title",
  "description": "1-2 sentence course description",
  "days": [
    {
      "dayIndex": 1,
      "theme": "Clear theme (e.g., 'Introductions and First Impressions')",
      "difficulty": "CEFR level (e.g., 'A1', 'A2', 'B1')",
      "learningObjectives": ["Objective 1", "Objective 2"],
      "scenarioDescription": "Brief description of conversation scenario for this day"
    }
    // ... ${duration} days total
  ],
  "metadata": {
    "estimatedMinutesPerDay": 15-20,
    "category": "relationships/professional/travel/etc",
    "tags": ["tag1", "tag2"]
  }
}

**Important:**
- Ensure progression: Days 1-7 should be comfortable, Days 8-14 moderate challenge, Days 15-21 stepping out of comfort zone, Days 22-${duration} mastery and fluency
- Each day should build on previous days
- Themes should be cohesive and tell a story
- Keep learner's goals and context in mind throughout`;

		return {
			systemPrompt,
			userPrompt,
			targetSchema: this.getSyllabusSchema(duration)
		};
	}

	/**
	 * Generate a syllabus prompt from creator brief
	 *
	 * This method allows creators to design custom courses by providing
	 * a detailed brief in natural language. Useful for:
	 * - Specialized courses (e.g., "Meeting partner's parents")
	 * - Professional scenarios (e.g., "Negotiating business deals")
	 * - Cultural deep-dives (e.g., "Understanding Japanese tea ceremony etiquette")
	 *
	 * @param input - Creator brief and course parameters
	 * @returns Prompt payload for LLM
	 */
	static buildCreatorPathPrompt(input: PathFromCreatorBriefInput): PromptPayload {
		const { brief, targetLanguage, duration = 30, difficultyRange, primarySkill, metadata } = input;

		// Build system prompt for creator-authored paths
		const systemPrompt = `You are an expert language curriculum designer specializing in conversational ${targetLanguage.toUpperCase()} learning.

Your task is to transform a course brief into a structured ${duration}-day learning path.

**Key Principles:**
- Follow the creator's vision and intent closely
- Create a natural difficulty progression
- Ensure each day has clear, actionable learning objectives
- Design scenarios that are emotionally engaging and culturally authentic
- Balance challenge with achievability`;

		// Build user prompt from brief
		let userPrompt = `Create a ${duration}-day ${targetLanguage.toUpperCase()} learning path based on the following brief:

**Course Brief:**
${brief}

**Course Parameters:**
- Target Language: ${targetLanguage.toUpperCase()}
- Duration: ${duration} days`;

		if (difficultyRange) {
			userPrompt += `\n- Difficulty Range: ${difficultyRange.start} → ${difficultyRange.end}`;
		}

		if (primarySkill) {
			userPrompt += `\n- Primary Skill Focus: ${primarySkill}`;
		}

		if (metadata?.category) {
			userPrompt += `\n- Category: ${metadata.category}`;
		}

		// Add output format instructions
		userPrompt += `\n\n**Output Format:**
Return a JSON object with the following structure:
{
  "title": "Course title (clear and SEO-friendly)",
  "description": "2-3 sentence course description highlighting key outcomes",
  "days": [
    {
      "dayIndex": 1,
      "theme": "Daily theme (specific and actionable)",
      "difficulty": "CEFR level (e.g., 'A2', 'B1') or 'beginner/intermediate/advanced'",
      "learningObjectives": ["Objective 1", "Objective 2", "Objective 3"],
      "scenarioDescription": "Detailed scenario description for generation"
    }
    // ... ${duration} days total
  ],
  "metadata": {
    "estimatedMinutesPerDay": 15-25,
    "category": "${metadata?.category || 'general'}",
    "tags": ${JSON.stringify(metadata?.tags || [])}
  }
}

**Important:**
- Honor the creator's brief - this is their vision
- Create a coherent narrative arc across ${duration} days
- Ensure smooth difficulty progression
- Each day should build naturally on previous content
- Scenarios should be rich, specific, and culturally grounded`;

		return {
			systemPrompt,
			userPrompt,
			targetSchema: this.getSyllabusSchema(duration)
		};
	}

	/**
	 * Generate a prompt for a single scenario within a learning path
	 *
	 * This method creates prompts for generating individual day scenarios
	 * that fit within the larger path context.
	 *
	 * @param input - Day context and path metadata
	 * @returns Prompt for scenario generation
	 */
	static buildDayScenarioPrompt(input: {
		dayTheme: string;
		dayIndex: number;
		difficulty: string;
		learningObjectives: string[];
		pathContext: {
			title: string;
			targetLanguage: string;
			previousDayThemes?: string[];
		};
	}): PromptPayload {
		const { dayTheme, dayIndex, difficulty, learningObjectives, pathContext } = input;

		const systemPrompt = `You are an expert scenario designer for ${pathContext.targetLanguage.toUpperCase()} language learning.

You create realistic, engaging conversation scenarios that help learners practice specific skills in authentic contexts.`;

		let userPrompt = `Create a conversation scenario for Day ${dayIndex} of "${pathContext.title}".

**Day ${dayIndex} Details:**
- Theme: ${dayTheme}
- Difficulty: ${difficulty}
- Learning Objectives:
${learningObjectives.map((obj) => `  - ${obj}`).join('\n')}`;

		if (pathContext.previousDayThemes && pathContext.previousDayThemes.length > 0) {
			userPrompt += `\n\n**Previous Days (for context):**
${pathContext.previousDayThemes.map((theme, i) => `  Day ${i + 1}: ${theme}`).join('\n')}

Ensure this scenario builds on previous days while introducing new concepts.`;
		}

		userPrompt += `\n\n**Required Output:**
- Scenario Title: Clear and engaging
- Description: 2-3 sentences setting up the conversation
- Context: Who, where, what, why
- Expected Outcome: What learner should achieve
- Key Vocabulary/Phrases: 5-8 essential items for this scenario
- Cultural Notes: 1-2 relevant cultural insights

Keep the scenario realistic, emotionally engaging, and aligned with ${difficulty} difficulty level.`;

		return {
			systemPrompt,
			userPrompt
		};
	}

	/**
	 * Get JSON schema for syllabus structured output
	 *
	 * This schema can be used with LLM structured output features
	 * to ensure consistent formatting.
	 *
	 * @param duration - Number of days in the course
	 * @returns JSON schema object
	 */
	private static getSyllabusSchema(duration: number): object {
		return {
			type: 'object',
			properties: {
				title: {
					type: 'string',
					description: 'Engaging course title'
				},
				description: {
					type: 'string',
					description: 'Brief course description (1-2 sentences)'
				},
				days: {
					type: 'array',
					minItems: duration,
					maxItems: duration,
					items: {
						type: 'object',
						properties: {
							dayIndex: {
								type: 'number',
								description: 'Day number (1-based index)'
							},
							theme: {
								type: 'string',
								description: 'Clear theme for this day'
							},
							difficulty: {
								type: 'string',
								description: 'CEFR level (A1, A2, B1, etc.) or beginner/intermediate/advanced'
							},
							learningObjectives: {
								type: 'array',
								items: { type: 'string' },
								description: 'List of learning objectives for this day'
							},
							scenarioDescription: {
								type: 'string',
								description: 'Brief description of conversation scenario'
							}
						},
						required: ['dayIndex', 'theme', 'difficulty', 'learningObjectives']
					}
				},
				metadata: {
					type: 'object',
					properties: {
						estimatedMinutesPerDay: { type: 'number' },
						category: { type: 'string' },
						tags: {
							type: 'array',
							items: { type: 'string' }
						}
					}
				}
			},
			required: ['title', 'description', 'days']
		};
	}
}
