/**
 * Centralized AI Prompt Templates
 *
 * All prompts used for AI generation across the app
 */

// ============================================
// SCAFFOLDING LEVELS
// ============================================

/**
 * Scaffolding instructions based on learner level
 * These modify how scenarios are presented and what support is provided
 */
export const SCAFFOLDING_LEVELS = {
	beginner: {
		label: 'Beginner (A1)',
		description: 'Just starting out, knows basic greetings',
		instructions: `
- Provide full translations for all key phrases
- Use simple, short sentences (3-5 words)
- Include phonetic guides (romaji for Japanese, pinyin for Chinese, etc.)
- Offer 2-3 response options to choose from
- Be supportive and patient, but realistic
- Focus on single exchanges (greeting → response)
- Correct mistakes gently with explanation
- Repeat key vocabulary multiple times`
	},
	elementary: {
		label: 'Elementary (A2)',
		description: 'Can handle basic conversations with support',
		instructions: `
- Provide translations for new/difficult words only
- Use moderate sentence length (5-8 words)
- Include key phrases at the start of each scenario
- Offer 1-2 hints when stuck
- Balance support with gentle challenges
- Practice 2-3 turn exchanges
- Introduce common expressions and set phrases
- Build on vocabulary from previous days
- Occasionally pause, expecting the learner to continue`
	},
	intermediate: {
		label: 'Intermediate (B1)',
		description: 'Can maintain conversations with some effort',
		instructions: `
- Minimal translations (only for specialized vocabulary)
- Natural sentence length and complexity
- Provide context hints rather than direct phrases
- Encourage self-correction before offering help
- Include cultural notes and nuances
- Practice 4-6 turn conversations
- Introduce casual vs formal register differences
- Challenge with unexpected turns in conversation
- Sometimes express mild skepticism or ask probing questions
- Create moments where learner must recover from small misunderstandings`
	},
	advanced: {
		label: 'Advanced (C1)',
		description: 'Fluent, refining nuance and complexity',
		instructions: `
- No translations unless specifically requested
- Native-like speech patterns, including fillers and contractions
- Subtle hints only, encourage problem-solving
- Direct feedback on naturalness and nuance
- Deep cultural context and regional variations
- Full conversation simulations (10+ turns)
- Include idioms, slang, and colloquialisms
- Introduce challenging scenarios (disagreements, negotiations)
- Be realistically skeptical or indirect when culturally appropriate
- Test cultural knowledge and appropriate register`
	},
	proficient: {
		label: 'Proficient (C2)',
		description: 'Near-native, mastering subtleties',
		instructions: `
- No translations or hints - treat as native speaker
- Native speech at natural pace with dialect variations
- Focus on subtle meaning, implication, and inference
- Feedback only on highly nuanced expression choices
- Regional expressions, humor, and cultural depth
- Complex extended discussions with abstract topics
- Handle ambiguity, irony, and double meanings
- Master register switching mid-conversation
- Full realistic human behavior - not accommodating
- Include all natural friction: interruptions, topic changes, emotional moments`
	}
} as const;

export type ScaffoldingLevel = keyof typeof SCAFFOLDING_LEVELS;

// ============================================
// WEEKLY PROGRESSION STRUCTURE
// ============================================

/**
 * 4-week progression from building blocks to full conversations
 * Each week has a different focus and activity type
 */
export const WEEKLY_PROGRESSION = {
	week1: {
		label: 'Week 1: Foundation',
		focus: 'Vocabulary & Key Phrases',
		activityTypes: ['phrase-drilling', 'vocabulary-building', 'listen-and-repeat'],
		description: 'Build the essential vocabulary and phrases needed for your goal',
		instructions: `
WEEK 1 FOCUS: Building Blocks
- Each day introduces 3-5 key phrases related to the scenario
- Practice pronunciation and recognition
- Short listen-and-respond exercises
- Vocabulary matching and recall activities
- Goal: Build confidence with individual phrases before combining them`
	},
	week2: {
		label: 'Week 2: Short Exchanges',
		focus: 'Mini-Conversations (2-3 turns)',
		activityTypes: ['short-dialogue', 'question-answer', 'fill-in-response'],
		description: 'Practice short back-and-forth exchanges',
		instructions: `
WEEK 2 FOCUS: Short Exchanges
- Practice 2-3 turn conversations
- Learn common question-answer patterns
- Practice responding to simple questions
- Build from Week 1 phrases into mini-dialogues
- Goal: Comfortable with basic back-and-forth exchanges`
	},
	week3: {
		label: 'Week 3: Guided Conversations',
		focus: 'Supported Conversations (4-6 turns)',
		activityTypes: ['guided-conversation', 'scenario-with-hints', 'branching-dialogue'],
		description: 'Longer conversations with realistic friction and hints available',
		instructions: `
WEEK 3 FOCUS: Guided Conversations with Realistic Friction
- Practice 4-6 turn conversations
- Hints available when truly stuck, but encourage working through difficulty
- Introduce unexpected elements (partner asks a question you didn't expect)
- Practice recovering from misunderstandings
- AI partner may express mild skepticism or change topics
- Include moments where learner must navigate awkward silences
- Vary AI personality (sometimes warm, sometimes reserved)
- Goal: Handle real conversation flow including friction`
	},
	week4: {
		label: 'Week 4: Full Simulations',
		focus: 'Real-World Scenarios',
		activityTypes: ['full-simulation', 'role-play', 'free-conversation'],
		description: 'Complete conversation simulations with realistic human behavior',
		instructions: `
WEEK 4 FOCUS: Full Simulations with Real Human Behavior
- Full conversation simulations (8+ turns)
- Minimal hints - encouraged to figure it out
- Realistic scenarios matching your actual goal
- AI partner behaves like a real human (not always accommodating)
- Include: unexpected questions, topic changes, skepticism, cultural tests
- Practice recovering from small mistakes gracefully
- Multiple personality variants (skeptical parent, curious friend, testing elder)
- Sometimes the AI doesn't fill silences - learner must continue
- Goal: Ready for real humans, not just comfortable AI practice`
	}
} as const;

export type WeekNumber = keyof typeof WEEKLY_PROGRESSION;

/**
 * Get the week number (1-4) for a given day index
 */
export function getWeekForDay(dayIndex: number, totalDays: number): WeekNumber {
	const weekLength = Math.ceil(totalDays / 4);
	const weekNum = Math.ceil(dayIndex / weekLength);
	return `week${Math.min(weekNum, 4)}` as WeekNumber;
}

// ============================================
// LEARNING PATH BRIEF PROMPT
// ============================================

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
	return LEARNING_PATH_BRIEF_PROMPT.replace(
		'{TRANSCRIPT}',
		params.transcript || '[Paste transcript here]'
	)
		.replace('{LANGUAGE}', params.language)
		.replace(/{DURATION}/g, params.duration.toString());
}

// ============================================
// SYLLABUS GENERATION PROMPT (for AI to create day-by-day plan)
// ============================================

/**
 * Prompt for generating a structured syllabus with weekly progression
 * This is used by the PathGeneratorService to create the learning path
 */
export const SYLLABUS_GENERATION_PROMPT = `You are an expert language learning curriculum designer for Kaiwa, an AI conversation practice app.

Create a {DURATION}-day learning path based on this brief:

## LEARNER BRIEF:
{BRIEF}

## TARGET LANGUAGE: {LANGUAGE}
## LEARNER LEVEL: {LEVEL}

## WEEKLY PROGRESSION STRUCTURE:

The path MUST follow this 4-week progression pattern:

**Week 1 (Days 1-7): Foundation - Vocabulary & Key Phrases**
- Focus on essential words and phrases for the goal
- Short, focused practice on pronunciation
- Build confidence with individual building blocks
- Activity type: phrase-drilling, vocabulary-building

**Week 2 (Days 8-14): Short Exchanges - Mini-Conversations**
- Practice 2-3 turn conversations
- Learn question-answer patterns
- Combine Week 1 phrases into exchanges
- Activity type: short-dialogue, question-answer

**Week 3 (Days 15-21): Guided Conversations - With Support**
- 4-6 turn conversations with hints available
- Introduce unexpected elements
- Practice recovering from confusion
- Activity type: guided-conversation, scenario-with-hints

**Week 4 (Days 22-28): Full Simulations - Real-World Practice**
- Complete conversation simulations (8+ turns)
- Minimal support, realistic scenarios
- Handle the unexpected confidently
- Activity type: full-simulation, role-play

## SCAFFOLDING FOR {LEVEL} LEVEL:
{SCAFFOLDING_INSTRUCTIONS}

## OUTPUT FORMAT (JSON):
{
  "title": "Path title (specific to their goal)",
  "description": "2-3 sentence description",
  "days": [
    {
      "dayIndex": 1,
      "week": 1,
      "theme": "Day's specific topic/scenario",
      "activityType": "phrase-drilling|short-dialogue|guided-conversation|full-simulation",
      "difficulty": "A1|A2|B1|B2",
      "learningObjectives": ["objective 1", "objective 2"],
      "keyPhrases": ["phrase 1", "phrase 2", "phrase 3"],
      "scenarioDescription": "Brief description of what they'll practice"
    }
  ]
}

Generate exactly {DURATION} days following the weekly progression. Make each day specific to their goal and build progressively.`;

/**
 * Fill in the syllabus generation prompt
 */
export function fillSyllabusPrompt(params: {
	brief: string;
	language: string;
	duration: number;
	level: ScaffoldingLevel;
}): string {
	const scaffolding = SCAFFOLDING_LEVELS[params.level];

	return SYLLABUS_GENERATION_PROMPT.replace('{BRIEF}', params.brief)
		.replace(/{LANGUAGE}/g, params.language)
		.replace(/{DURATION}/g, params.duration.toString())
		.replace(/{LEVEL}/g, scaffolding.label)
		.replace('{SCAFFOLDING_INSTRUCTIONS}', scaffolding.instructions);
}

// ============================================
// SCENARIO GENERATION PROMPT (for individual day scenarios)
// ============================================

/**
 * Prompt for generating a specific day's scenario
 * This adapts based on the week and learner level
 */
export const SCENARIO_GENERATION_PROMPT = `You are creating a conversation practice scenario for Kaiwa.

## SCENARIO DETAILS:
- Day: {DAY_INDEX} of {TOTAL_DAYS}
- Week: {WEEK_NUMBER} ({WEEK_FOCUS})
- Theme: {THEME}
- Activity Type: {ACTIVITY_TYPE}
- Target Language: {LANGUAGE}
- Learner Level: {LEVEL}

## WEEK {WEEK_NUMBER} GUIDELINES:
{WEEK_INSTRUCTIONS}

## SCAFFOLDING FOR {LEVEL}:
{SCAFFOLDING_INSTRUCTIONS}

## KEY PHRASES TO INCORPORATE:
{KEY_PHRASES}

## CRITICAL: PRODUCTIVE DISCOMFORT PRINCIPLE
Real conversations are NOT always warm and encouraging. AI practice that is always supportive
creates "yes-bots" that leave learners unprepared for real humans.

Based on the week number, include appropriate friction:
- Week 1-2: Mostly supportive, but occasional pauses where learner must continue
- Week 3: Include unexpected questions, mild skepticism, topic changes
- Week 4: Full realistic human behavior - cultural tests, indirect communication, recovery from mistakes

Vary the AI personality across scenarios (warm, reserved, skeptical, traditional, curious, testing).

## CREATE A SCENARIO THAT:
1. Matches the activity type for this week
2. Uses appropriate scaffolding for the learner's level
3. Incorporates the key phrases naturally
4. Builds on what they learned in previous days
5. Feels real and relevant to their goal
6. Includes appropriate friction for the week (see above)
7. Prepares learner for real human unpredictability, not just comfortable AI practice

## OUTPUT FORMAT (JSON):
{
  "title": "Scenario title",
  "description": "What they'll practice",
  "context": "The situation setup",
  "instructions": "How to approach this practice",
  "role": "tutor|character|friendly_chat",
  "aiPersona": {
    "name": "Character name if applicable",
    "relationship": "Who they are to the learner",
    "personality": "Brief personality description (include variant: warm/reserved/skeptical/etc.)"
  },
  "openingLine": "How the AI starts the conversation",
  "suggestedResponses": ["option 1", "option 2"], // For beginners
  "hints": ["hint 1", "hint 2"], // Available if stuck
  "frictionMoments": ["moment 1", "moment 2"], // Week 3-4: unexpected elements to include
  "successCriteria": "What success looks like for this scenario"
}`;

/**
 * Fill in the scenario generation prompt
 */
export function fillScenarioPrompt(params: {
	dayIndex: number;
	totalDays: number;
	theme: string;
	activityType: string;
	language: string;
	level: ScaffoldingLevel;
	keyPhrases: string[];
}): string {
	const week = getWeekForDay(params.dayIndex, params.totalDays);
	const weekInfo = WEEKLY_PROGRESSION[week];
	const scaffolding = SCAFFOLDING_LEVELS[params.level];
	const weekNum = parseInt(week.replace('week', ''));

	return SCENARIO_GENERATION_PROMPT.replace('{DAY_INDEX}', params.dayIndex.toString())
		.replace('{TOTAL_DAYS}', params.totalDays.toString())
		.replace(/{WEEK_NUMBER}/g, weekNum.toString())
		.replace('{WEEK_FOCUS}', weekInfo.focus)
		.replace('{THEME}', params.theme)
		.replace('{ACTIVITY_TYPE}', params.activityType)
		.replace(/{LANGUAGE}/g, params.language)
		.replace(/{LEVEL}/g, scaffolding.label)
		.replace('{WEEK_INSTRUCTIONS}', weekInfo.instructions)
		.replace('{SCAFFOLDING_INSTRUCTIONS}', scaffolding.instructions)
		.replace('{KEY_PHRASES}', params.keyPhrases.join('\n- '));
}
