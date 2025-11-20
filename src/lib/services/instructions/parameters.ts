// src/lib/services/instructions/parameters.ts
// Dynamic instruction parameters for real-time tuning
// Following OpenAI Realtime API best practices

import type { CEFRLevel } from '$lib/utils/cefr';
import type { SpeechSpeed } from '$lib/server/db/types';

/**
 * AGILE INSTRUCTION PARAMETERS
 *
 * These parameters can be adjusted in real-time to change AI behavior
 * without regenerating entire instruction sets.
 */

export interface InstructionParameters {
	// SPEAKING DYNAMICS
	speakingSpeed: SpeakingSpeed;
	sentenceLength: SentenceLength;
	pauseFrequency: PauseFrequency;

	// DIFFICULTY & COMPLEXITY
	targetCEFR: CEFRLevel;
	vocabularyComplexity: VocabularyComplexity;
	grammarComplexity: GrammarComplexity;

	// SUPPORT & SCAFFOLDING
	scaffoldingLevel: ScaffoldingLevel;
	correctionStyle: CorrectionStyle;
	languageMixingPolicy: LanguageMixingPolicy;

	// ENGAGEMENT & PACING
	encouragementFrequency: EncouragementFrequency;
	conversationPace: ConversationPace;
	topicChangeFrequency: TopicChangeFrequency;
}

// ============================================
// SPEAKING DYNAMICS
// ============================================

export type SpeakingSpeed = 'very_slow' | 'slow' | 'normal' | 'fast' | 'native';

export const SPEAKING_SPEED_RULES: Record<SpeakingSpeed, string> = {
	very_slow: `## SPEAKING SPEED: VERY SLOW (Extremely slow and deliberate)
- Speak EXTREMELY deliberately and slowly
- Add very clear pauses between sentences (4-5 seconds)
- Emphasize each syllable boundary distinctly
- Enunciate every sound carefully with maximum clarity
- Use this for absolute beginners or high frustration`,

	slow: `## SPEAKING SPEED: SLOW (Very deliberate)
- Speak VERY deliberately and slowly
- Pause 3-4 seconds between sentences
- Emphasize each syllable boundary distinctly
- Enunciate every sound carefully
- This is the DEFAULT "normal" pace for language learning`,

	normal: `## SPEAKING SPEED: NORMAL (Deliberately slow)
- Speak at a deliberately slow, measured pace
- Pause 2-3 seconds between sentences
- Articulate clearly and deliberately
- NEVER rush - clarity is more important than speed
- Use this for intermediate learners`,

	fast: `## SPEAKING SPEED: FAST (Moderate pace)
- Speak at a slightly faster but still clear pace
- Pause 1-2 seconds between sentences
- Maintain crystal-clear articulation
- Still slower than native speakers to ensure comprehension
- Use this for advanced learners`,

	native: `## SPEAKING SPEED: NATIVE (Quicker but clear)
- Speak at a quicker pace but maintain clarity
- Brief pauses between thoughts
- Clear articulation with natural rhythm
- Still slower than actual native speakers to ensure clarity
- Use this for advanced learners who want near-native pacing`
};

// ============================================
// SENTENCE LENGTH
// ============================================

export type SentenceLength = 'very_short' | 'short' | 'medium' | 'long' | 'native';

export const SENTENCE_LENGTH_RULES: Record<SentenceLength, string> = {
	very_short: `## SENTENCE LENGTH: VERY SHORT (3-5 words)
- Keep responses to 3-5 words maximum
- One simple idea per sentence
- Use basic subject-verb-object structure
- Example: "How are you?" "What did you eat?"`,

	short: `## SENTENCE LENGTH: SHORT (3-5 words typical, max 8)
- Most responses just 3-5 words
- Occasional full sentence okay (max 8 words)
- Think: How would a friend text you?
- Examples: "Nice!" "What book?" "Oh cool, which one?"`,

	medium: `## SENTENCE LENGTH: MEDIUM (5-10 words max)
- Responses typically 5-10 words
- One simple idea or question
- Natural conversation rhythm, not essays
- Example: "Oh awesome! What are you reading?"`,

	long: `## SENTENCE LENGTH: LONG (8-15 words)
- Responses up to 15 words
- One to two short clauses max
- Still conversational, not formal
- Example: "Oh nice! Which neighborhoods did you visit?"`,

	native: `## SENTENCE LENGTH: NATIVE (variable, natural)
- Use natural sentence variety
- Mix short punchy sentences (3-5 words) with longer ones (up to 15)
- Favor brevity - most turns should be under 10 words
- Follow conversational rhythm: quick volleys, not monologues`
};

// ============================================
// PAUSE FREQUENCY
// ============================================

export type PauseFrequency = 'minimal' | 'moderate' | 'frequent';

export const PAUSE_FREQUENCY_RULES: Record<PauseFrequency, string> = {
	minimal: `## PAUSE FREQUENCY: MINIMAL
- Brief pauses only at natural sentence breaks
- Maintain conversational momentum
- Use this for advanced learners (B2+)`,

	moderate: `## PAUSE FREQUENCY: MODERATE
- Pause 1-2 seconds between sentences
- Give learner time to process
- Use this for intermediate learners (B1-B2)`,

	frequent: `## PAUSE FREQUENCY: FREQUENT
- Pause 2-3 seconds between sentences
- Check for comprehension signals before continuing
- Slow down if learner seems confused
- Use this for beginners (A1-A2)`
};

// ============================================
// VOCABULARY COMPLEXITY
// ============================================

export type VocabularyComplexity = 'basic' | 'everyday' | 'advanced' | 'specialized';

export const VOCABULARY_COMPLEXITY_RULES: Record<VocabularyComplexity, string> = {
	basic: `## VOCABULARY: BASIC (Top 500 words)
- Use only high-frequency words
- Avoid idioms and phrasal verbs
- Define any word outside top 500
- Examples: "eat", "go", "happy", "today"`,

	everyday: `## VOCABULARY: EVERYDAY (Top 2000 words)
- Use common conversational vocabulary
- Introduce simple idioms with explanation
- Context makes meaning clear
- Examples: "grab lunch", "hang out", "stressed out"`,

	advanced: `## VOCABULARY: ADVANCED (Top 5000 words)
- Use sophisticated vocabulary naturally
- Include idioms without explanation
- Expect nuanced understanding
- Examples: "compelling", "nuanced", "endeavor"`,

	specialized: `## VOCABULARY: SPECIALIZED (domain-specific)
- Use field-specific terminology
- Include technical jargon when relevant
- Assume domain knowledge
- Examples: "stakeholder alignment", "triage protocol", "market dynamics"`
};

// ============================================
// GRAMMAR COMPLEXITY
// ============================================

export type GrammarComplexity = 'simple' | 'intermediate' | 'advanced' | 'native';

export const GRAMMAR_COMPLEXITY_RULES: Record<GrammarComplexity, string> = {
	simple: `## GRAMMAR: SIMPLE (A1-A2)
- Present simple and past simple only
- Avoid conditionals and subjunctive
- Use basic question structures
- No passive voice
- Example: "I went to the store. I bought bread."`,

	intermediate: `## GRAMMAR: INTERMEDIATE (B1-B2)
- Include present perfect and past continuous
- Simple conditionals (if/when)
- Some passive constructions
- Relative clauses with common pronouns
- Example: "I've been working here for two years, and I've learned a lot."`,

	advanced: `## GRAMMAR: ADVANCED (C1)
- Full range of tenses and aspects
- Conditionals (including unreal past)
- Passive voice freely
- Complex relative clauses
- Example: "Had I known about the meeting, I would have prepared differently."`,

	native: `## GRAMMAR: NATIVE (C2)
- Full grammatical range with stylistic variation
- Subjunctive mood when appropriate
- Inversion for emphasis
- Register shifts based on context
- Example: "Rarely have I encountered such a compelling argument."`
};

// ============================================
// SCAFFOLDING LEVEL
// ============================================

export type ScaffoldingLevel = 'none' | 'light' | 'medium' | 'heavy';

export const SCAFFOLDING_RULES: Record<ScaffoldingLevel, string> = {
	none: `## SCAFFOLDING: NONE (Immersion Mode)
- NO hints or simplification
- Stay in target language completely
- Expect learner to ask for help if needed
- Use this for C1-C2 learners`,

	light: `## SCAFFOLDING: LIGHT
- Rephrase unclear statements ONCE
- Provide cognates when helpful
- Offer choices if learner is stuck
- Use this for B2-C1 learners`,

	medium: `## SCAFFOLDING: MEDIUM
- Rephrase up to TWO times with increasing simplicity
- Break complex ideas into smaller chunks
- Provide sentence starters when learner is stuck
- Use this for B1-B2 learners`,

	heavy: `## SCAFFOLDING: HEAVY
- Simplify immediately if learner shows confusion
- Provide full sentence models
- Offer native language translations for key words (in parentheses)
- Use this for A1-A2 learners`
};

// ============================================
// CORRECTION STYLE
// ============================================

export type CorrectionStyle = 'explicit' | 'recast' | 'minimal' | 'none';

export const CORRECTION_STYLE_RULES: Record<CorrectionStyle, string> = {
	explicit: `## CORRECTION STYLE: EXPLICIT (Tutor Mode)
- Point out errors directly
- Explain WHY it's incorrect
- Have learner repeat correctly 2-3 times
- Example: "Not 'I go yesterday' - use past tense: 'I went yesterday'. Say it again."`,

	recast: `## CORRECTION STYLE: RECAST (Natural)
- Echo back the correct form without explaining
- Continue conversation naturally
- Example: Learner: "I go yesterday" → You: "Oh, you went yesterday? What did you do?"`,

	minimal: `## CORRECTION STYLE: MINIMAL
- Only correct errors that block communication
- Ignore minor grammar mistakes
- Focus on meaning over accuracy
- Use this for C1-C2 or high-pressure scenarios`,

	none: `## CORRECTION STYLE: NONE (Pure Conversation)
- NO corrections at all
- Focus entirely on message exchange
- Use this for confidence building or assessment`
};

// ============================================
// LANGUAGE MIXING POLICY
// ============================================

export type LanguageMixingPolicy =
	| 'strict_immersion'
	| 'flexible'
	| 'bilingual_support'
	| 'code_switching';

export const LANGUAGE_MIXING_RULES: Record<LanguageMixingPolicy, string> = {
	strict_immersion: `## LANGUAGE POLICY: STRICT IMMERSION
- ONLY speak target language
- If learner switches to native language, respond in target language
- Never translate or explain in native language
- Use this for B2+ learners`,

	flexible: `## LANGUAGE POLICY: FLEXIBLE
- Lead with target language
- If learner is stuck after 3 attempts, offer ONE native language hint
- Immediately return to target language
- Use this for B1-B2 learners`,

	bilingual_support: `## LANGUAGE POLICY: BILINGUAL SUPPORT
- Speak target language primarily
- Provide native language translations for key vocabulary (in parentheses)
- Allow learner to explain in native language, then coach target language version
- Use this for A2-B1 learners`,

	code_switching: `## LANGUAGE POLICY: CODE SWITCHING
- Mix languages naturally as needed
- Prioritize communication over target language purity
- Provide full native language explanations when helpful
- Use this for A1 learners or onboarding`
};

// ============================================
// ENCOURAGEMENT FREQUENCY
// ============================================

export type EncouragementFrequency = 'minimal' | 'moderate' | 'frequent';

export const ENCOURAGEMENT_RULES: Record<EncouragementFrequency, string> = {
	minimal: `## ENCOURAGEMENT: MINIMAL
- Only praise truly exceptional moments
- Keep focus on content, not learner's performance
- Use this for advanced learners who want authentic conversation`,

	moderate: `## ENCOURAGEMENT: MODERATE
- Acknowledge good responses with brief praise (1-2 words)
- VARY your encouragement phrases (rotate through list)
- Examples: "Nice!", "Exactly", "Good point", "I see"`,

	frequent: `## ENCOURAGEMENT: FREQUENT
- Celebrate every success, no matter how small
- Use specific praise: "Great pronunciation of [specific word they said]!"
- Build confidence with regular positive feedback
- Use this for beginners or low-confidence learners`
};

// ============================================
// CONVERSATION PACE
// ============================================

export type ConversationPace = 'relaxed' | 'steady' | 'dynamic';

export const CONVERSATION_PACE_RULES: Record<ConversationPace, string> = {
	relaxed: `## CONVERSATION PACE: RELAXED
- Let silences breathe (3-5 seconds okay)
- Don't rush to fill pauses
- One topic at a time, fully explored
- Use this for A1-A2 or reflective scenarios`,

	steady: `## CONVERSATION PACE: STEADY
- Maintain consistent forward momentum
- Brief pauses (1-2 seconds)
- Transition smoothly between related topics
- Use this for B1-B2 general conversation`,

	dynamic: `## CONVERSATION PACE: DYNAMIC
- Quick exchanges and rapid topic shifts
- Minimal pauses
- Follow learner's energy and interests
- Use this for C1-C2 or high-energy scenarios`
};

// ============================================
// TOPIC CHANGE FREQUENCY
// ============================================

export type TopicChangeFrequency = 'focused' | 'moderate' | 'exploratory';

export const TOPIC_CHANGE_RULES: Record<TopicChangeFrequency, string> = {
	focused: `## TOPIC CHANGES: FOCUSED (Stay on topic)
- Stick to one topic for entire conversation
- Deep dive with follow-up questions
- Only change topic if explicitly requested
- Use this for scenario-based learning or specific goals`,

	moderate: `## TOPIC CHANGES: MODERATE (Natural flow)
- Allow organic topic transitions every 2-3 minutes
- Connect new topics to previous conversation
- Example: "Speaking of travel, have you..."
- Use this for general conversation practice`,

	exploratory: `## TOPIC CHANGES: EXPLORATORY (Wide-ranging)
- Introduce new topics frequently (every 1-2 minutes)
- Jump between subjects based on learner's interests
- Keep conversation fresh and engaging
- Use this for discovery and vocabulary building`
};

// ============================================
// DEFAULT PARAMETER SETS
// ============================================

export const PARAMETER_PRESETS: Record<string, InstructionParameters> = {
	absolute_beginner: {
		speakingSpeed: 'very_slow',
		sentenceLength: 'very_short',
		pauseFrequency: 'frequent',
		targetCEFR: 'A1',
		vocabularyComplexity: 'basic',
		grammarComplexity: 'simple',
		scaffoldingLevel: 'heavy',
		correctionStyle: 'recast',
		languageMixingPolicy: 'code_switching',
		encouragementFrequency: 'frequent',
		conversationPace: 'relaxed',
		topicChangeFrequency: 'focused'
	},

	beginner: {
		speakingSpeed: 'slow',
		sentenceLength: 'short',
		pauseFrequency: 'frequent',
		targetCEFR: 'A2',
		vocabularyComplexity: 'basic',
		grammarComplexity: 'simple',
		scaffoldingLevel: 'heavy',
		correctionStyle: 'recast',
		languageMixingPolicy: 'bilingual_support',
		encouragementFrequency: 'frequent',
		conversationPace: 'relaxed',
		topicChangeFrequency: 'focused'
	},

	intermediate: {
		speakingSpeed: 'normal',
		sentenceLength: 'short', // Changed from 'medium' for more natural flow
		pauseFrequency: 'moderate',
		targetCEFR: 'B1',
		vocabularyComplexity: 'everyday',
		grammarComplexity: 'intermediate',
		scaffoldingLevel: 'medium',
		correctionStyle: 'recast',
		languageMixingPolicy: 'flexible',
		encouragementFrequency: 'minimal', // Changed from 'moderate' - less cheerleading
		conversationPace: 'dynamic', // Changed from 'steady' for more natural rhythm
		topicChangeFrequency: 'moderate'
	},

	upper_intermediate: {
		speakingSpeed: 'normal',
		sentenceLength: 'medium', // Changed from 'long' for more conversational feel
		pauseFrequency: 'moderate',
		targetCEFR: 'B2',
		vocabularyComplexity: 'advanced',
		grammarComplexity: 'advanced',
		scaffoldingLevel: 'light',
		correctionStyle: 'recast',
		languageMixingPolicy: 'flexible',
		encouragementFrequency: 'minimal', // Changed from 'moderate'
		conversationPace: 'dynamic', // Changed from 'steady'
		topicChangeFrequency: 'moderate'
	},

	advanced: {
		speakingSpeed: 'fast',
		sentenceLength: 'medium', // Changed from 'native' to encourage brevity
		pauseFrequency: 'minimal',
		targetCEFR: 'C1',
		vocabularyComplexity: 'advanced',
		grammarComplexity: 'advanced',
		scaffoldingLevel: 'light',
		correctionStyle: 'minimal',
		languageMixingPolicy: 'strict_immersion',
		encouragementFrequency: 'minimal',
		conversationPace: 'dynamic',
		topicChangeFrequency: 'exploratory'
	},

	native_like: {
		speakingSpeed: 'native',
		sentenceLength: 'native',
		pauseFrequency: 'minimal',
		targetCEFR: 'C2',
		vocabularyComplexity: 'specialized',
		grammarComplexity: 'native',
		scaffoldingLevel: 'none',
		correctionStyle: 'none',
		languageMixingPolicy: 'strict_immersion',
		encouragementFrequency: 'minimal',
		conversationPace: 'dynamic',
		topicChangeFrequency: 'exploratory'
	},

	// Special presets for specific scenarios
	tutor_explicit: {
		speakingSpeed: 'slow',
		sentenceLength: 'short', // Keep short for teaching clarity
		pauseFrequency: 'frequent',
		targetCEFR: 'B1',
		vocabularyComplexity: 'everyday',
		grammarComplexity: 'intermediate',
		scaffoldingLevel: 'heavy',
		correctionStyle: 'explicit', // Key difference
		languageMixingPolicy: 'bilingual_support',
		encouragementFrequency: 'moderate', // Changed from 'frequent' - less cheerleading
		conversationPace: 'relaxed',
		topicChangeFrequency: 'focused'
	},

	conversation_partner: {
		speakingSpeed: 'normal',
		sentenceLength: 'short', // Changed from 'native' for more conversational feel
		pauseFrequency: 'minimal',
		targetCEFR: 'B2',
		vocabularyComplexity: 'advanced',
		grammarComplexity: 'advanced',
		scaffoldingLevel: 'light',
		correctionStyle: 'recast',
		languageMixingPolicy: 'flexible',
		encouragementFrequency: 'minimal',
		conversationPace: 'dynamic',
		topicChangeFrequency: 'exploratory'
	}
};

// ============================================
// PARAMETER HELPERS
// ============================================

/**
 * Get parameters based on CEFR level
 */
export function getParametersForCEFR(level: CEFRLevel): InstructionParameters {
	switch (level) {
		case 'A1':
			return PARAMETER_PRESETS.absolute_beginner;
		case 'A2':
			return PARAMETER_PRESETS.beginner;
		case 'B1':
			return PARAMETER_PRESETS.intermediate;
		case 'B2':
			return PARAMETER_PRESETS.upper_intermediate;
		case 'C1':
			return PARAMETER_PRESETS.advanced;
		case 'C2':
			return PARAMETER_PRESETS.native_like;
		default:
			return PARAMETER_PRESETS.intermediate;
	}
}

/**
 * Merge custom parameters with a preset
 */
export function mergeParameters(
	preset: InstructionParameters,
	overrides: Partial<InstructionParameters>
): InstructionParameters {
	return { ...preset, ...overrides };
}

/**
 * Convert parameters to instruction strings
 *
 *
 * All other parameters represent unique constraints (speaking speed, vocabulary,
 * grammar complexity, correction style, scaffolding, etc.)
 */
export function parametersToInstructions(params: InstructionParameters): string[] {
	return [
		SPEAKING_SPEED_RULES[params.speakingSpeed],

		PAUSE_FREQUENCY_RULES[params.pauseFrequency],
		VOCABULARY_COMPLEXITY_RULES[params.vocabularyComplexity],
		GRAMMAR_COMPLEXITY_RULES[params.grammarComplexity],
		SCAFFOLDING_RULES[params.scaffoldingLevel],
		CORRECTION_STYLE_RULES[params.correctionStyle],
		LANGUAGE_MIXING_RULES[params.languageMixingPolicy],
		ENCOURAGEMENT_RULES[params.encouragementFrequency],
		CONVERSATION_PACE_RULES[params.conversationPace],
		TOPIC_CHANGE_RULES[params.topicChangeFrequency]
	];
}

// ============================================
// SPEECH SPEED RESOLUTION
// ============================================

/**
 * Language-specific speed adjustments
 * Negative number = slower, Positive number = faster
 *
 * Rationale:
 * - Tonal languages (Chinese, Vietnamese) need slower pace for tone clarity
 * - Character-based scripts (Japanese, Chinese) need time for visual processing
 * - Particle-heavy languages (Japanese, Korean) benefit from clear pauses
 */
const LANGUAGE_SPEED_ADJUSTMENTS: Record<string, number> = {
	zh: -1, // Chinese: Tones + characters need slower pace
	ja: -1, // Japanese: Kanji + particles need slower pace
	vi: -1, // Vietnamese: Tones need slower pace
	ko: 0, // Korean: Normal pace works well
	es: 0, // Spanish: Normal pace
	fr: 0, // French: Normal pace
	de: 0, // German: Normal pace
	it: 0, // Italian: Normal pace
	pt: 0, // Portuguese: Normal pace
	ru: 0, // Russian: Normal pace
	th: -1 // Thai: Tones + script need slower pace
};

/**
 * Map CEFR levels to default speech speeds
 */
const CEFR_TO_SPEED_MAP: Record<string, SpeakingSpeed> = {
	A1: 'very_slow',
	A2: 'slow',
	B1: 'normal',
	B2: 'fast',
	C1: 'fast',
	C2: 'native'
};

/**
 * Resolve user's speech speed preference into a SpeakingSpeed parameter
 *
 * Priority:
 * 1. User's manual choice (if not 'auto')
 * 2. CEFR-based default (if 'auto')
 * 3. Language-specific adjustment applied
 *
 * @param userSpeechSpeed - User's preference from database
 * @param cefrLevel - User's proficiency level
 * @param languageCode - Target language code (e.g., 'zh', 'ja', 'es')
 * @returns Resolved speaking speed parameter
 *
 * @example
 * resolveUserSpeechSpeed('auto', 'A2', 'zh')
 * // Returns 'very_slow' (A2 maps to 'slow', Chinese adjustment -1 = 'very_slow')
 *
 * resolveUserSpeechSpeed('fast', 'A1', 'zh')
 * // Returns 'fast' (user's manual choice always wins)
 */
export function resolveUserSpeechSpeed(
	userSpeechSpeed: SpeechSpeed,
	cefrLevel: string,
	languageCode?: string
): SpeakingSpeed {
	// 1. Manual preference overrides everything
	if (userSpeechSpeed !== 'auto') {
		console.log(`🎚️ Speech speed: User manually selected "${userSpeechSpeed}"`);
		return userSpeechSpeed as SpeakingSpeed;
	}

	// 2. Auto mode: start with CEFR-based default
	const baseSpeed = CEFR_TO_SPEED_MAP[cefrLevel] || 'slow';
	console.log(`🎚️ Speech speed: CEFR ${cefrLevel} maps to "${baseSpeed}"`);

	// 3. Apply language-specific adjustment if available
	if (!languageCode) {
		console.log(`🎚️ Speech speed: No language code, using "${baseSpeed}"`);
		return baseSpeed;
	}

	const adjustment = LANGUAGE_SPEED_ADJUSTMENTS[languageCode] || 0;

	if (adjustment === 0) {
		console.log(
			`🎚️ Speech speed: Language ${languageCode} has no adjustment, using "${baseSpeed}"`
		);
		return baseSpeed;
	}

	// Apply adjustment
	const speedLevels: SpeakingSpeed[] = ['very_slow', 'slow', 'normal', 'fast', 'native'];
	const currentIndex = speedLevels.indexOf(baseSpeed);
	const newIndex = Math.max(0, Math.min(speedLevels.length - 1, currentIndex + adjustment));
	const finalSpeed = speedLevels[newIndex];

	console.log(
		`🎚️ Speech speed: Language ${languageCode} adjustment ${adjustment > 0 ? '+' : ''}${adjustment} ` +
			`=> "${baseSpeed}" → "${finalSpeed}"`
	);

	return finalSpeed;
}
