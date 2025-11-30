/**
 * Centralized AI Prompt Templates
 *
 * All prompts used for AI generation across the app
 */

/**
 * Template for converting discovery call transcripts into learning path briefs
 *
 * Placeholders:
 * - {TRANSCRIPT} - The raw transcript/notes from the discovery call
 * - {LANGUAGE} - Target language name (e.g., "Japanese")
 * - {DURATION} - Number of days for the learning path
 */
export const LEARNING_PATH_BRIEF_PROMPT = `You are helping create a personalized language learning path for Kaiwa, an AI-powered conversation practice app.

Analyze the following discovery call transcript/notes and extract the key information to create a structured learning path brief.

## TRANSCRIPT/NOTES:
{TRANSCRIPT}

## EXTRACT THE FOLLOWING:

1. **Learner Profile**
   - Current language level (estimate: complete beginner, beginner, intermediate beginner, intermediate, advanced)
   - Native language
   - Target language: {LANGUAGE}

2. **Primary Goal** (pick the most important one)
   - Connection (family, partner, friends)
   - Career (work, business, interviews)
   - Travel (tourism, living abroad)
   - Culture (media, heritage, personal interest)

3. **Specific Situation**
   - What's the specific real-life situation they want to prepare for?
   - Is there a deadline or upcoming event?
   - Who will they be speaking with?

4. **Key Scenarios** (list 3-5 specific situations they mentioned wanting to practice)

5. **Challenges/Fears**
   - What are they most nervous about?
   - What has frustrated them with other learning methods?

6. **Preferences**
   - How much time can they dedicate daily? (5-10 min, 10-20 min, 20+ min)
   - Do they prefer gentle corrections or direct feedback?

## OUTPUT FORMAT:

Generate a 2-3 paragraph brief in this style:

"A {DURATION}-day personalized path for someone who wants to [primary goal]. They are currently at [level] and need to prepare for [specific situation].

The path should focus on: [key scenarios as comma-separated list]. Special attention to [their main fear/challenge].

Difficulty should progress from [starting difficulty] to [ending difficulty]. Each day should be [time estimate] of focused practice. Tone should be [encouraging/challenging based on their preference]."

---

Be concise but include all the specific details that make this path PERSONAL to them.`;

/**
 * Fill in the learning path brief prompt with actual values
 */
export function fillLearningPathBriefPrompt(params: {
	transcript: string;
	language: string;
	duration: number;
}): string {
	return LEARNING_PATH_BRIEF_PROMPT.replace('{TRANSCRIPT}', params.transcript || '[Paste transcript here]')
		.replace('{LANGUAGE}', params.language)
		.replace(/{DURATION}/g, params.duration.toString());
}
