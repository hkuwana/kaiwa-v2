// 📝 Updated Instructions Service - Works with numerical skill levels and database preferences
// Pure functional service - no classes, no state, just functions

import type { UserPreferences } from '$lib/server/db/types';
import type { TurnDetection } from '$lib/types/openai.realtime.types';
import { languages } from '$lib/data/languages';
import type { Language } from '$lib/server/db/types';

export interface LanguageInfo {
	code: string;
	name: string;
}

export interface ConversationContext {
	type: 'casual' | 'formal' | 'business' | 'academic';
	instructions: string;
}

// === DATA STORAGE ===

const conversationContexts: Map<string, ConversationContext> = new Map([
	[
		'casual',
		{
			type: 'casual',
			instructions:
				'Keep the conversation light and friendly. Use everyday vocabulary and encourage natural expression. Focus on topics like hobbies, food, daily activities, and personal interests.'
		}
	],
	[
		'formal',
		{
			type: 'formal',
			instructions:
				'Maintain a polite and respectful tone. Use appropriate honorifics and formal expressions. Focus on topics like work, education, cultural exchange, and respectful social interactions.'
		}
	],
	[
		'business',
		{
			type: 'business',
			instructions:
				'Use professional language and business vocabulary. Focus on topics like work, industry trends, professional development, meetings, and workplace communication.'
		}
	],
	[
		'academic',
		{
			type: 'academic',
			instructions:
				'Use academic vocabulary and complex sentence structures. Focus on intellectual topics, research, scholarly discussion, and analytical thinking.'
		}
	]
]);

// === HELPER FUNCTIONS ===

/**
 * Check if a language is supported
 */
export function isLanguageSupported(languageCode: string): boolean {
	const supportedLanguages = languages.map((language) => language.code);
	return supportedLanguages.includes(languageCode.toLowerCase());
}

/**
 * Validate language information
 */
export function validateLanguage(language: Language): void {
	if (!language.code || !language.name) {
		throw new Error('Language code and name are required');
	}
	if (!isLanguageSupported(language.code)) {
		throw new Error(
			`Language code '${language.code}' is not supported. Supported codes: ${Array.from(languages.map((language) => language.code)).join(', ')}`
		);
	}
}

/**
 * Get detailed skill level description for more nuanced instructions
 */
export function getDetailedSkillLevel(skillLevel: number): string {
	const levels = {
		1: 'absolute beginner (just starting)',
		2: 'false beginner (some exposure)',
		3: 'elementary (basic phrases)',
		4: 'pre-intermediate (simple conversations)',
		5: 'intermediate (comfortable conversations)',
		6: 'upper-intermediate (complex topics)',
		7: 'advanced (fluent discussions)',
		8: 'proficient (near-native)',
		9: 'expert (specialized vocabulary)',
		10: 'native-like (complete fluency)'
	};
	return levels[skillLevel as keyof typeof levels] || 'beginner';
}

/**
 * Convert numerical skill level to descriptive level for instructions
 */
export function getSkillLevelDescription(
	skillLevel: number
): 'beginner' | 'intermediate' | 'advanced' {
	if (skillLevel <= 30) return 'beginner';
	if (skillLevel <= 70) return 'intermediate';
	return 'advanced';
}

/**
 * Generate adaptive language instruction based on skill level
 */
function getAdaptiveLanguageInstruction(speakingLevel: number): string {
	const baseInstruction =
		"IMPORTANT: Adapt your language complexity to match the user's responses. ";

	if (speakingLevel <= 30) {
		return (
			baseInstruction +
			'Start with very simple vocabulary and basic sentence structures. If they respond well, gradually introduce slightly more complex phrases, but stay within elementary level. If they struggle, simplify further.'
		);
	} else if (speakingLevel <= 50) {
		return (
			baseInstruction +
			'Start at their current intermediate level, then gradually introduce vocabulary and structures that are just one level above their comfort zone. Challenge them gently without overwhelming.'
		);
	} else if (speakingLevel <= 70) {
		return (
			baseInstruction +
			'Match their advanced level and introduce sophisticated vocabulary and complex structures when they demonstrate readiness. Push them towards more nuanced expression.'
		);
	} else {
		return (
			baseInstruction +
			'Match their near-native/expert level and introduce subtle linguistic nuances, idiomatic expressions, and cultural references that will elevate their language to the next level.'
		);
	}
}

/**
 * Get audio pacing instruction based on skill level - ALWAYS start slow
 */
function getAudioPacingInstruction(speakingLevel: number): string {
	if (speakingLevel <= 30) {
		return 'SPEAK VERY SLOWLY AND CLEARLY. Pause between sentences and repeat important phrases. This is crucial for comprehension.';
	} else if (speakingLevel <= 50) {
		return 'SPEAK SLOWLY with clear pronunciation. Pause occasionally for comprehension. Even intermediate learners need slower speech initially.';
	} else if (speakingLevel <= 70) {
		return 'SPEAK AT A MEASURED, DELIBERATE PACE. Slower than normal conversation. Use clear pronunciation and natural pauses.';
	} else {
		return 'SPEAK SLOWER THAN NATIVE SPEED but naturally. Even advanced learners benefit from slightly slower, clearer speech.';
	}
}

/**
 * Get context type from learning goal
 */
function getContextTypeFromLearningGoal(
	learningGoal: string | null
): 'casual' | 'business' | 'academic' | 'casual' {
	if (learningGoal === 'Career') return 'business';
	if (learningGoal === 'Academic') return 'academic';
	if (learningGoal === 'Travel') return 'casual';
	return 'casual';
}

// === MAIN INSTRUCTION FUNCTIONS ===

/**
 * Generate audio check prompt for new users
 */
export function generateAudioCheckPrompt(language: Language): string {
	validateLanguage(language);

	return `You are a ${language.name} language tutor. SPEAK VERY SLOWLY AND CLEARLY. Start by introducing yourself in ${language.name} and ask if the user can hear you clearly. Take your time between words and sentences. Wait for their confirmation about audio quality before proceeding. If they have audio issues, help them troubleshoot in simple ${language.name} or switch to English briefly if needed.`;
}

/**
 * Generate comprehensive onboarding prompt
 */
export function generateOnboardingPrompt(language: Language): string {
	validateLanguage(language);

	return `Conduct friendly onboarding in ${language.name}. SPEAK VERY SLOWLY throughout the entire onboarding process. After confirming audio works, ask these questions one at a time:

1. "What is your current level in ${language.name}?" (Help them choose 1-10, where 1 is absolute beginner, 5 is conversational, 10 is native-like)
2. "What are your main goals for learning ${language.name}?" (travel, business, academic, casual conversation, etc.)
3. "What type of conversations would you like to practice?" (casual daily life, formal situations, business, academic)
4. "How much time do you have for today's session?"

Keep questions simple and encouraging. REMEMBER TO SPEAK SLOWLY - this is crucial for new learners. If they struggle to answer in ${language.name}, it's okay to use some English to help them. Adapt your speaking pace and language complexity based on their responses, but always err on the side of speaking slower than you think you need to. Once you understand their needs, suggest a lesson plan for today.`;
}

/**
 * Generate personalized welcome back prompt
 */
export function generateWelcomeBackPrompt(
	language: Language,
	prefs: Partial<UserPreferences> = {}
): string {
	validateLanguage(language);

	let prompt = `Welcome this returning user back in ${language.name}. Give them a warm, natural greeting.`;

	if (prefs.speakingLevel) {
		const levelDesc = getDetailedSkillLevel(prefs.speakingLevel);
		prompt += ` Remember they are at speaking level ${prefs.speakingLevel} (${levelDesc}).`;
	}

	if (prefs.learningGoal) {
		prompt += ` They prefer ${prefs.learningGoal} conversations.`;
	}

	if (prefs.specificGoals) {
		// Handle both string and parsed JSON array
		const goals =
			typeof prefs.specificGoals === 'string'
				? JSON.parse(prefs.specificGoals)
				: prefs.specificGoals;
		prompt += ` Their learning goals include: ${Array.isArray(goals) ? goals.join(', ') : goals}.`;
	}

	prompt += ` Ask how they've been and what they'd like to practice today. Offer to continue from where you left off or try something new. Keep it conversational and encouraging.`;

	return prompt;
}

/**
 * Main function to generate initial greeting based on user state
 */
export function generateInitialGreeting(
	language: Language,
	prefs: Partial<UserPreferences> = {},
	isFirstTime: boolean = false
): string {
	validateLanguage(language);

	if (isFirstTime) {
		return generateAudioCheckPrompt(language);
	} else {
		return generateWelcomeBackPrompt(language, prefs);
	}
}

/**
 * Generate lesson continuation prompt with numerical skill level support
 */
export function generateLessonPrompt(
	language: Language,
	prefs: Partial<UserPreferences> = {},
	sessionGoal?: string
): string {
	validateLanguage(language);

	let prompt = `Continue the ${language.name} lesson. Speak only in ${language.name}.`;

	// Add skill level specific guidance - use speaking level as primary indicator
	if (prefs.speakingLevel) {
		const levelDesc = getDetailedSkillLevel(prefs.speakingLevel);
		prompt += ` The user is at speaking level ${prefs.speakingLevel} (${levelDesc}).`;

		// Audio pacing based on skill level
		prompt += ` ${getAudioPacingInstruction(prefs.speakingLevel)}`;
	}

	// Add context-specific guidance
	if (prefs.learningGoal) {
		const contextType = getContextTypeFromLearningGoal(prefs.learningGoal);
		const context = conversationContexts.get(contextType);
		if (context) {
			prompt += ` ${context.instructions}`;
		}
	}

	// Add session-specific goal
	if (sessionGoal) {
		prompt += ` Today's focus: ${sessionGoal}.`;
	}

	prompt += ' Be patient, encouraging, and make the conversation engaging and natural.';

	return prompt;
}

/**
 * Generate skill assessment prompt
 */
export function generateSkillAssessmentPrompt(language: Language): string {
	validateLanguage(language);

	return `Conduct a brief, friendly skill assessment in ${language.name} to determine their level (1-10 scale).

Start with very basic topics (level 1-2):
- Simple greetings and introductions
- Basic personal information

Gradually increase complexity based on their responses:
- Daily routines and hobbies (level 3-4)
- Opinions and preferences (level 5-6)
- Complex topics and abstract concepts (level 7-8)
- Nuanced discussions and cultural topics (level 9-10)

Pay attention to:
- Vocabulary range and accuracy
- Grammar complexity and correctness
- Pronunciation and fluency
- Conversation flow and confidence
- Cultural understanding

After 5-10 minutes, provide encouraging feedback and suggest their approximate level on the 1-10 scale. Keep it conversational and stress-free.`;
}

/**
 * Generate session wrap-up prompt
 */
export function generateSessionWrapUpPrompt(
	language: Language,
	prefs: Partial<UserPreferences> = {}
): string {
	validateLanguage(language);

	let prompt = `Wrap up the ${language.name} session positively. In ${language.name}:

1. Acknowledge their effort and participation
2. Highlight 2-3 specific things they did well
3. Gently mention 1-2 areas for improvement (if any)`;

	// Adjust feedback style based on skill level
	if (prefs.speakingLevel && prefs.speakingLevel <= 30) {
		prompt += `
4. Suggest simple, specific things to practice before next time
5. Ask if they have any questions (offer to answer in English if needed)
6. End with very encouraging words about their progress`;
	} else {
		prompt += `
4. Suggest challenging but achievable goals for next time
5. Ask if they have any questions about today's topics
6. End with motivating words about their language journey`;
	}

	prompt += `

Keep it brief but meaningful. Make them feel accomplished and excited to continue learning.`;

	return prompt;
}

/**
 * Generate comprehensive custom instructions
 */
export function generateCustomInstructions(
	language: Language,
	prefs: Partial<UserPreferences> = {}
): string {
	validateLanguage(language);

	let instructions = `You are a helpful ${language.name} language tutor. Help the user practice and improve their ${language.name} skills through natural conversation. Be patient, encouraging, and provide appropriate corrections.`;

	// Language and audio guidance - EMPHASIZE SLOW SPEECH
	instructions += ` Speak only in ${language.name}. CRUCIAL: Since this is audio-based learning, ALWAYS SPEAK SLOWLY AND CLEARLY. This is more important than you might think - slower speech dramatically improves comprehension and learning outcomes.`;

	// Skill level adaptations - use speaking level as primary indicator
	if (prefs.speakingLevel) {
		const levelDesc = getDetailedSkillLevel(prefs.speakingLevel);
		instructions += ` The user is at speaking level ${prefs.speakingLevel} (${levelDesc}).`;
		instructions += ` ${getAudioPacingInstruction(prefs.speakingLevel)}`;
		instructions += ` ${getAdaptiveLanguageInstruction(prefs.speakingLevel)}`;
	} else {
		instructions +=
			' Since skill level is unknown, START BY SPEAKING VERY SLOWLY and adapt based on their responses.';
	}

	// Context-specific behavior
	if (prefs.learningGoal) {
		const contextType = getContextTypeFromLearningGoal(prefs.learningGoal);
		const context = conversationContexts.get(contextType);
		if (context) {
			instructions += ` This conversation should be ${context.type} in nature. ${context.instructions}`;
		}
	}

	// Learning goals integration
	if (prefs.specificGoals) {
		const goals = Array.isArray(prefs.specificGoals) ? prefs.specificGoals : [prefs.specificGoals];
		instructions += ` Keep in mind their learning goals: ${goals.join(', ')}.`;
	}

	return instructions;
}

// === UTILITY FUNCTIONS ===

export function getConversationContext(contextType: string): ConversationContext | undefined {
	return conversationContexts.get(contextType);
}

export function getAvailableContexts(): ConversationContext[] {
	return Array.from(conversationContexts.values());
}

export function isContextSupported(contextType: string): boolean {
	return conversationContexts.has(contextType);
}

/**
 * Generates an adaptive turn detection configuration based on user skill and confidence.
 * @param profile The user's learning profile.
 * @returns An optimal TurnDetectionConfig object.
 */
export function getAdaptiveTurnDetection(profile: UserPreferences): TurnDetection {
	const { speakingLevel, confidenceLevel } = profile;

	// --- Beginner Tier ---
	if (speakingLevel <= 35) {
		return {
			type: 'server_vad',
			// More hesitant users get more time
			silence_duration_ms: confidenceLevel < 50 ? 1200 : 800,
			// Lower threshold for quieter speakers
			threshold: 0.4,
			interrupt_response: false // Avoid interrupting beginners
		};
	}

	// --- Intermediate Tier ---
	if (speakingLevel <= 70) {
		return {
			type: 'semantic_vad',
			// Lower confidence means less eagerness
			eagerness: confidenceLevel < 50 ? 'low' : 'medium',
			interrupt_response: true
		};
	}

	// --- Advanced Tier ---
	// (speakingLevel > 70)
	return {
		type: 'semantic_vad',
		// High confidence users get a faster response
		eagerness: confidenceLevel > 65 ? 'high' : 'medium',
		interrupt_response: true
	};
}
