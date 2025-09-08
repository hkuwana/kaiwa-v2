// src/lib/services/instruction-midprompt.service.ts
// Dynamic mid-conversation prompt instructions for real-time conversation adjustments
// Based on OpenAI Realtime API best practices

import type { User, Language, UserPreferences } from '$lib/server/db/types';
import { getLanguageById } from '$lib/types';

// ============================================
// CONVERSATION STATE TYPES
// ============================================

export type ConversationPhase =
	| 'greeting'
	| 'topic_exploration'
	| 'practice_activity'
	| 'error_recovery'
	| 'confidence_building'
	| 'assessment'
	| 'closing';

export type ConversationTrigger =
	| 'user_struggling'
	| 'user_confident'
	| 'audio_unclear'
	| 'language_barrier'
	| 'engagement_dropping'
	| 'breakthrough_moment'
	| 'time_warning'
	| 'cultural_moment';

export interface ConversationContext {
	phase: ConversationPhase;
	trigger: ConversationTrigger;
	attemptCount?: number;
	successStreak?: number;
	timeRemaining?: number;
	lastUserInput?: string;
	difficultyLevel?: number;
}

// ============================================
// MID-PROMPT INSTRUCTION GENERATORS
// ============================================

/**
 * Generate immediate conversation adjustment instructions
 * These are concise, actionable prompts for real-time adjustments
 */
export function getMidPromptInstruction(
	context: ConversationContext,
	user: User,
	language: Language,
	preferences: Partial<UserPreferences>
): string {
	const nativeLanguage = getLanguageById(user.nativeLanguageId);
	const speakingLevel = preferences.speakingLevel || 30;

	// Phase-based instructions
	const phaseInstructions = getPhaseInstruction(context.phase, language, speakingLevel);

	// Trigger-based adjustments
	const triggerAdjustments = getTriggerAdjustment(
		context.trigger,
		language,
		nativeLanguage,
		context
	);

	return `${phaseInstructions}

${triggerAdjustments}

IMMEDIATE ACTIONS:
${getImmediateActions(context, speakingLevel)}`;
}

/**
 * Phase-specific conversation management
 */
function getPhaseInstruction(
	phase: ConversationPhase,
	language: Language,
	speakingLevel: number
): string {
	switch (phase) {
		case 'greeting':
			return `## GREETING PHASE - NEXT 30 SECONDS
GOAL: Establish comfort and assess real ability
- Keep energy warm but not overwhelming
- Listen for confidence cues in their voice
- Note their actual speaking pace vs. stated level
- Transition smoothly to practice after 2-3 exchanges`;

		case 'topic_exploration':
			return `## TOPIC EXPLORATION - NEXT 60 SECONDS  
GOAL: Find their interest sweet spot
- Ask about genuine interests, not textbook topics
- Watch for excitement in voice (faster speech, more words)
- If they light up about something, dive deeper
- Avoid topics that make them hesitant or quiet`;

		case 'practice_activity':
			return `## ACTIVE PRACTICE - MAINTAIN FLOW
GOAL: Keep them in productive challenge zone
- ${speakingLevel < 30 ? 'SLOW DOWN - give 3+ seconds between responses' : 'Match their natural pace'}
- Celebrate micro-wins immediately ("Nice!")  
- If they self-correct, acknowledge it: "You caught that yourself!"
- Build complexity gradually, not suddenly`;

		case 'error_recovery':
			return `## ERROR RECOVERY - REBUILD CONFIDENCE
GOAL: Quick confidence restoration
PRIORITY: Get them successful within 30 seconds
- Drop difficulty immediately
- Give them something they CAN say
- "Let's try something easier..." then give simple win
- Avoid explaining why they were wrong`;

		case 'confidence_building':
			return `## CONFIDENCE BUILDING - MOMENTUM MODE
GOAL: Stack successes to create breakthrough feeling  
- Give them 3 quick wins in a row
- "You're getting this!" after each success
- Gradually increase complexity but stay in success zone
- End this phase with "You're speaking ${language.name} really well!"`;

		case 'assessment':
			return `## SUBTLE ASSESSMENT - NO PRESSURE
GOAL: Gauge real ability without making it feel like a test
- Present as "let's try something fun"
- If they struggle, immediately pivot to easier content
- Note what they CAN do, not what they can't
- Keep it conversational, never clinical`;

		case 'closing':
			return `## CLOSING - END ON HIGH NOTE
GOAL: Leave them excited for next session
- Specific praise: "Your pronunciation of [word] was perfect"
- Plant seed: "Next time we could [specific exciting thing]" 
- Keep under 60 seconds total
- Energy should be warm and encouraging`;

		default:
			return `## CONVERSATION FLOW - STAY RESPONSIVE
- Listen for their emotional state changes
- Match their energy level
- Keep conversation natural and flowing`;
	}
}

/**
 * Trigger-based immediate adjustments
 */
function getTriggerAdjustment(
	trigger: ConversationTrigger,
	language: Language,
	nativeLanguage: Language | undefined,
	context: ConversationContext
): string {
	const attempts = context.attemptCount || 1;
	const nativeName = nativeLanguage?.name || 'English';

	switch (trigger) {
		case 'user_struggling':
			return `## STRUGGLING DETECTED - IMMEDIATE SUPPORT
RESPONSE STRATEGY:
${
	attempts === 1
		? `- "Let me help you with that"
- Repeat what they tried to say, slowly
- Give them the correct version: "You can say: [simple version]"`
		: attempts === 2
			? `- "That's a tricky one! Let's break it down"
- Give just ONE word to focus on
- "Just say [single word]" and wait`
			: `- Code-switch warmly: "No problem! In ${nativeName} that's [meaning]"
- "Now in ${language.name}, you can say: [very simple version]"
- Move to much easier topic immediately`
}`;

		case 'user_confident':
			return `## CONFIDENCE DETECTED - LEVEL UP OPPORTUNITY
RESPONSE STRATEGY:
- "You're ready for something more interesting!"
- Introduce cultural element or idiom
- Ask follow-up questions to extend the topic
- Gradually increase speed and complexity
- Challenge them playfully: "Want to try the way natives say it?"`;

		case 'audio_unclear':
			return `## AUDIO UNCLEAR - CLARIFICATION PROTOCOL
RESPONSE STRATEGY:
${
	attempts === 1
		? `- "Sorry, I didn't quite catch that - could you say it again?"
- Smile in your voice, keep it light`
		: attempts === 2
			? `- "Let me help - try speaking a bit slower"
- "No rush, take your time"`
			: `- "The audio seems unclear - you can type it if that's easier"
- "Or feel free to say it in ${nativeName} and I'll help with the ${language.name}"`
}`;

		case 'language_barrier':
			return `## LANGUAGE BARRIER - BRIDGE BUILDING
RESPONSE STRATEGY:
- "I understand this is challenging - everyone struggles with this part"
- Code-switch: "[${language.name} phrase] - in ${nativeName} that means [explanation]"
- "Let's practice just this one part: [break down into smallest piece]"
- Stay patient and encouraging`;

		case 'engagement_dropping':
			return `## ENGAGEMENT DROPPING - RE-ENERGIZE
RESPONSE STRATEGY:
- Change topic immediately to something more personal/interesting
- "Let's talk about something you actually care about - what do you love doing?"
- Add energy to your voice
- Make it about THEM, not the language learning`;

		case 'breakthrough_moment':
			return `## BREAKTHROUGH DETECTED - CELEBRATE!
RESPONSE STRATEGY:
- IMMEDIATE recognition: "Wait! Did you just...?"
- Be specific: "You used [grammar/word/pronunciation] perfectly!"
- Build momentum: "You're ready for the next level!"
- Share insider knowledge: "Here's what natives really say..."`;

		case 'time_warning':
			return `## TIME WARNING - SMOOTH TRANSITION
RESPONSE STRATEGY:
- Don't announce time directly
- Natural wind-down: "Let's wrap up with something fun"
- Give them one final success moment
- End with anticipation for next time`;

		case 'cultural_moment':
			return `## CULTURAL TEACHING OPPORTUNITY
RESPONSE STRATEGY:
- "This is interesting - in [culture], we actually..."
- Connect language to real cultural context
- Make it personal: "When I [cultural example]..."
- Ask them about their own culture for comparison`;

		default:
			return `## GENERAL ADJUSTMENT
RESPONSE STRATEGY:
- Stay responsive to their needs
- Match their energy and pace
- Keep conversation flowing naturally`;
	}
}

/**
 * Generate immediate actionable steps
 */
function getImmediateActions(context: ConversationContext, speakingLevel: number): string {
	const actions = [];

	// Speed adjustments
	if (speakingLevel < 30) {
		actions.push('- SPEAK 50% SLOWER than normal');
		actions.push('- PAUSE 2-3 seconds between sentences');
	} else if (speakingLevel > 70) {
		actions.push('- MATCH their speaking pace');
		actions.push('- Use natural rhythm and flow');
	}

	// Success tracking
	if (context.successStreak && context.successStreak >= 3) {
		actions.push('- ACKNOWLEDGE streak: "You\'re on fire! Three in a row!"');
		actions.push('- OFFER challenge: "Ready for something more advanced?"');
	}

	// Attempt tracking
	if (context.attemptCount && context.attemptCount >= 2) {
		actions.push('- SIMPLIFY immediately');
		actions.push('- GIVE them a guaranteed win');
	}

	// Time management
	if (context.timeRemaining && context.timeRemaining < 60) {
		actions.push('- PREPARE for natural closing');
		actions.push('- FOCUS on positive wrap-up');
	}

	// Default actions if none specific
	if (actions.length === 0) {
		actions.push('- LISTEN for their emotional state');
		actions.push('- RESPOND to their energy level');
		actions.push('- KEEP conversation natural');
	}

	return actions.join('\n');
}

// ============================================
// CONVERSATION FLOW TEMPLATES
// ============================================

/**
 * Pre-built conversation flow templates for common scenarios
 */
export const CONVERSATION_TEMPLATES = {
	first_time_user: {
		phases: [
			'greeting',
			'topic_exploration',
			'confidence_building',
			'closing'
		] as ConversationPhase[],
		duration: 300, // 5 minutes
		description: 'First-time user onboarding flow'
	},

	struggling_user: {
		phases: [
			'error_recovery',
			'confidence_building',
			'practice_activity',
			'closing'
		] as ConversationPhase[],
		duration: 240, // 4 minutes
		description: 'Recovery flow for struggling users'
	},

	confident_user: {
		phases: ['greeting', 'practice_activity', 'assessment', 'closing'] as ConversationPhase[],
		duration: 420, // 7 minutes
		description: 'Advanced practice for confident users'
	},

	assessment_mode: {
		phases: ['greeting', 'assessment', 'practice_activity', 'closing'] as ConversationPhase[],
		duration: 360, // 6 minutes
		description: 'Skill assessment and level adjustment'
	}
};

// ============================================
// QUICK RESPONSE PHRASES
// ============================================

/**
 * Pre-built phrases for instant use in different situations
 */
export const QUICK_RESPONSES = {
	encouragement: [
		'Perfect!',
		'Exactly right!',
		"You've got it!",
		'Beautiful pronunciation!',
		"That's exactly how natives say it!",
		'Wonderful!',
		"You're getting this!",
		'Spot on!'
	],

	clarification: [
		'Sorry, could you say that again?',
		"I didn't quite catch that",
		'One more time?',
		'Let me help - try saying it slower',
		'No rush, take your time'
	],

	transition: [
		'Speaking of that...',
		'That reminds me...',
		'Actually...',
		"Oh, and here's something interesting...",
		'Building on that...',
		"Let's try something related..."
	],

	support: [
		"That's a tricky one for everyone",
		'Let me help you with that',
		"No worries - let's break it down",
		'This part is challenging for most learners',
		"You're doing better than you think"
	]
};

// ============================================
// INTEGRATION HELPERS
// ============================================

/**
 * Helper function to detect conversation triggers from user input/behavior
 */
export function detectConversationTrigger(
	userInput: string,
	attemptCount: number,
	responseTime: number,
	previousSuccess: boolean
): ConversationTrigger {
	// Simple heuristics - could be enhanced with ML
	if (attemptCount >= 2 && !previousSuccess) return 'user_struggling';
	if (responseTime < 1000 && previousSuccess) return 'user_confident';
	if (userInput.length < 3) return 'audio_unclear';
	if (userInput.includes("I don't know") || userInput.includes('difficult'))
		return 'language_barrier';
	if (responseTime > 5000) return 'engagement_dropping';

	return 'user_confident'; // Default assumption
}

/**
 * Get the next recommended phase based on current context
 */
export function getNextPhase(
	currentPhase: ConversationPhase,
	trigger: ConversationTrigger,
	timeElapsed: number
): ConversationPhase {
	// Simple state machine logic
	if (timeElapsed > 300) return 'closing'; // After 5 minutes, start closing
	if (trigger === 'user_struggling') return 'error_recovery';
	if (trigger === 'breakthrough_moment') return 'confidence_building';

	// Standard progression
	const standardFlow: ConversationPhase[] = [
		'greeting',
		'topic_exploration',
		'practice_activity',
		'assessment',
		'closing'
	];

	const currentIndex = standardFlow.indexOf(currentPhase);
	return currentIndex < standardFlow.length - 1 ? standardFlow[currentIndex + 1] : 'closing';
}

// ============================================
// EXPORT MAIN FUNCTION
// ============================================

/**
 * Main function to get contextual mid-conversation instructions
 */
export function getMidConversationInstructions(
	phase: ConversationPhase,
	trigger: ConversationTrigger,
	user: User,
	language: Language,
	preferences: Partial<UserPreferences>,
	additionalContext?: Partial<ConversationContext>
): string {
	const context: ConversationContext = {
		phase,
		trigger,
		...additionalContext
	};

	return getMidPromptInstruction(context, user, language, preferences);
}
