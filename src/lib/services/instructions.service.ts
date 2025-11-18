// src/lib/services/instructions.service.ts
// Lightweight wrapper around the agile instruction composer

import type { User, UserPreferences, Language, Speaker, Scenario } from '$lib/server/db/types';
import type { SpeechSpeed } from '$lib/server/db/types';
// eslint-disable-next-line no-restricted-imports
import { InstructionComposer, type InstructionComposerOptions } from '$lib/services/instructions';
import { DEFAULT_VOICE, isValidVoice } from '$lib/types/openai.realtime.types';
import { getLanguageById } from '$lib/types';
import { resolveUserSpeechSpeed, type InstructionParameters } from './instructions/parameters';
import { getLearnerCefrLevel } from '$lib/utils/cefr';
import { normalizeMemoriesList } from '$lib/utils/memory-format';

export type InstructionPhase = 'initial' | 'update' | 'closing';

export interface SessionContext {
	isFirstTime?: boolean;
	previousTopics?: string[];
	memories?: string[];
	emotionalState?: 'neutral' | 'excited' | 'frustrated' | 'confused' | 'confident';
}

export type UpdateContext =
	| { type: 'topic_change'; newTopic: string }
	| { type: 'difficulty_adjust'; increase: boolean }
	| { type: 'engagement_boost'; reason?: string }
	| { type: 'correction_needed'; errorPattern: string }
	| { type: 'native_switch'; language?: string }
	| { type: 'frustration_detected'; level: 'mild' | 'moderate' | 'severe' }
	| { type: 'magic_moment'; trigger: string }
	| { type: 'comprehension_issue'; attempts: number };

export interface InstructionRequest {
	user: User;
	language: Language;
	preferences: Partial<UserPreferences>;
	scenario?: Scenario;
	sessionContext?: SessionContext;
	speaker?: Speaker;
	updateType?: UpdateContext['type'];
	updateContext?: UpdateContext;
	timeRemaining?: number;
}

export function getInstructions(phase: InstructionPhase, params: InstructionRequest): string {
	switch (phase) {
		case 'initial':
			return composeInitialInstructions(params);
		case 'update': {
			if (!params.updateType) {
				throw new Error('updateType required for update phase');
			}
			return buildUpdateAddendum(params.updateType, params);
		}
		case 'closing':
		default:
			return buildClosingSummary(params);
	}
}

export function createScenarioSessionConfig(
	scenario: Scenario | undefined,
	user: User,
	language: Language,
	preferences: Partial<UserPreferences>,
	speaker?: Speaker
): {
	instructions: string;
	initialMessage?: string;
	voice: string;
} {
	// 🆕 Resolve speech speed from user preferences
	const userSpeechSpeed: SpeechSpeed = preferences.speechSpeed || 'slow';
	const learnerLevel = getLearnerCefrLevel(preferences);
	const resolvedSpeed = resolveUserSpeechSpeed(userSpeechSpeed, learnerLevel, language.code);

	console.log('📋 Creating scenario session config:', {
		scenario: scenario?.title || 'general',
		userLevel: learnerLevel,
		language: language.code,
		userSpeedPref: userSpeechSpeed,
		resolvedSpeed: resolvedSpeed
	});

	const baseParams: InstructionRequest = {
		user,
		language,
		preferences,
		scenario,
		speaker
	};

	const instructions = composeInitialInstructions(baseParams, {
		speakingSpeed: resolvedSpeed
	});
	const initialMessage = generateScenarioGreeting({ language, scenario, user });

	console.log('%c📝 FULL INSTRUCTIONS BEING SENT TO OPENAI', 'color: blue; font-weight: bold; font-size: 14px;');
	console.log({
		speaker: speaker?.voiceName || 'default',
		language: language.code,
		instructionsLength: instructions.length,
		instructions: instructions
	});

	// ⚠️ CRITICAL: Use openaiVoiceId (e.g., 'coral'), NOT voiceName (e.g., 'Minami')
	// OpenAI Realtime API requires valid voice IDs from: alloy, ash, ballad, coral, echo, sage, verse
	// Using voiceName will cause OpenAI to not recognize the voice and default to an unexpected voice
	let preferredVoice = speaker?.openaiVoiceId || preferences.preferredVoice || DEFAULT_VOICE;

	// 🛡️ Validate voice against allowed OpenAI voices
	if (!isValidVoice(preferredVoice)) {
		console.warn(
			`⚠️ Invalid voice "${preferredVoice}" for speaker "${speaker?.voiceName || 'unknown'}". ` +
				`Falling back to default voice "${DEFAULT_VOICE}". ` +
				`Valid voices are: alloy, ash, ballad, coral, echo, sage, shimmer, verse`
		);
		preferredVoice = DEFAULT_VOICE;
	}

	return {
		instructions,
		initialMessage,
		voice: preferredVoice
	};
}

export function generateScenarioGreeting(opts: {
	language?: Language | null;
	scenario?: Scenario | null;
	user?: User | null;
}): string {
	const languageName = opts.language?.name || 'your target language';
	const scenarioTitle = opts.scenario?.title;
	const isTutorMode = opts.scenario?.role === 'tutor';

	// For "Starting from Zero" scenario, begin in the user's native language
	if (opts.scenario?.id === 'beginner-confidence-bridge') {
		const nativeLanguage = opts.user?.nativeLanguageId
			? getLanguageById(opts.user.nativeLanguageId)
			: null;
		const nativeName = nativeLanguage?.name || 'your native language';

		// Start with a very short native-language greeting + one short question
		return `In ${nativeName}, say one short greeting to ${opts.user?.displayName || 'the learner'} (≤7 words). Then ask exactly one simple question about who they most want to talk to in ${languageName} (≤7 words). Keep it warm and brief. Example: "Hey Hiro Kuwana! Excited to help." + "Friend, family, or coworker?"`;
	}

	// For other tutor modes (not zero-to-hero), start with target language + language mixing message
	if (isTutorMode && opts.scenario?.id !== 'beginner-confidence-bridge') {
		const nativeLanguage = opts.user?.nativeLanguageId
			? getLanguageById(opts.user.nativeLanguageId)
			: null;
		const _nativeName = nativeLanguage?.name || 'your native language';

		// Check if user has practiced this language before (from memories/history)
		const _hasPracticedBefore = opts.user?.id ? true : false; // This would need actual history data

		const learnerName = opts.user?.displayName || 'there';
		const example =
			opts.language?.code === 'ja'
				? `例: 「こんにちは、${learnerName}さん！」+「今日は何を練習する？」`
				: `Example: "Hi ${learnerName}!" + "What should we practice?"`;

		return `In ${languageName}, say one short greeting to ${learnerName} (≤7 words). Then ask exactly one short question (≤7 words) about what to practice. Keep it natural and end with a question. ${example}`;
	}

	if (scenarioTitle) {
		return `Start with a warm one-sentence greeting in ${languageName}. Make it clear you're their AI practice partner setting up the "${scenarioTitle}" role-play, then ask one short question to get them speaking.`;
	}

	return `Start with a warm one-sentence greeting in ${languageName}. Mention that you're their AI practice partner and ask one short question to begin.`;
}

// ============================================
// Internal helpers
// ============================================

function composeInitialInstructions(
	params: InstructionRequest,
	parameterOverrides?: Partial<InstructionParameters>
): string {
	const composer = new InstructionComposer({
		user: params.user,
		language: params.language,
		preferences: params.preferences,
		scenario: params.scenario,
		speaker: params.speaker,
		sessionContext: normalizeSessionContext(params.sessionContext, params.preferences),
		parameters: parameterOverrides,
		compact: false
	});

	return composer.compose();
}

function normalizeSessionContext(
	context: SessionContext | undefined,
	preferences?: Partial<UserPreferences>
): InstructionComposerOptions['sessionContext'] {
	const preferenceMemories = normalizeMemoriesList(preferences?.memories as unknown);
	const contextMemories = normalizeMemoriesList(context?.memories as unknown);
	const normalizedMemories = contextMemories.length ? contextMemories : preferenceMemories;

	if (!context && normalizedMemories.length === 0) return undefined;
	return {
		isFirstTime: context?.isFirstTime,
		memories: normalizedMemories,
		previousTopics: context?.previousTopics
	};
}

function buildUpdateAddendum(
	updateType: UpdateContext['type'],
	params: InstructionRequest
): string {
	const nativeLanguage = getLanguageById(params.user.nativeLanguageId || 'en');
	const nativeName = nativeLanguage?.name || 'their native language';
	const target = params.language.name;
	const context = params.updateContext;

	switch (updateType) {
		case 'topic_change': {
			const topic =
				context?.type === 'topic_change' && context.newTopic ? context.newTopic : 'the next scene';
			return `## TOPIC SHIFT FACILITATION
- Acknowledge their last point, then explain you're resetting the role-play together
- Introduce "${topic}" as the next rehearsal focus
- Offer one ${target} prompt they can echo, then hand the lead back immediately
- Keep tone coaching-oriented—you're supporting their practice, not taking the part`;
		}

		case 'difficulty_adjust': {
			const increase = context?.type === 'difficulty_adjust' ? context.increase : false;
			return increase
				? `## RAISE THE CHALLENGE
- Tell them you're dialing the rehearsal up a notch
- Add one richer ${target} phrasing or nuance tied to the scenario
- Ask a follow-up that forces them to take the next move in ${target}
- Stay concise with corrections so the scene keeps its momentum`
				: `## MAKE IT EASIER
- Pause the role-play briefly so they feel safe resetting
- Model a five-word ${target} sentence they can reuse
- Offer a bilingual hint if they freeze, then invite them to try again
- Celebrate the retry so confidence recovers before you continue`;
		}

		case 'engagement_boost': {
			const reason = context?.type === 'engagement_boost' ? context.reason : null;
			return `## RE-ENGAGE THE LEARNER
- Surface something personal from earlier to pull them back in
- Share a quick insider detail about the scenario, then ask what they'd do next
- Keep ${target} sentences short and energetic; mirror their tone
- Explain you're the AI coach keeping the rehearsal lively${
				reason ? ` (reason noted: ${reason})` : ''
			}`;
		}

		case 'correction_needed': {
			const pattern =
				context?.type === 'correction_needed' ? context.errorPattern : 'the current pattern';
			return `## SPOTLIGHT A PATTERN
- Flag ${pattern} as the focus without breaking character completely
- Model the corrected ${target} line once, emphasising the changed piece
- Have them repeat it in context, then continue the scene
- Keep feedback specific and encouraging so the rehearsal keeps flow`;
		}

		case 'native_switch': {
			const detected =
				context?.type === 'native_switch' && context.language ? context.language : nativeName;
			return `## CODE-SWITCH SUPPORT
- Thank them with one short clause in ${detected}, making it clear you're still their AI coach
- Immediately restate their idea in ${target} and invite them to repeat it
- Offer a quick scaffold (key noun or verb) if they hesitate, then hand the turn back
- Return to pure ${target} within one sentence so immersion resumes`;
		}

		case 'frustration_detected': {
			const severity = context?.type === 'frustration_detected' ? context.level : 'mild';
			if (severity === 'severe') {
				return `## RESET WITH CARE
- Drop into ${nativeName} briefly to acknowledge the frustration
- Reset the scene with a very easy ${target} line they can own
- Give one guaranteed-success prompt, then celebrate the win
- Only resume the scenario once their tone relaxes`;
			}
			return `## LIGHTEN THE LOAD
- Slow your delivery and remind them you're on their team
- Offer a simpler ${target} rephrase they can copy
- Use gentle bilingual hints, then switch back to ${target}
- Highlight progress so the rehearsal still feels productive`;
		}

		case 'magic_moment': {
			const trigger =
				context?.type === 'magic_moment' && context.trigger
					? context.trigger
					: 'a big breakthrough';
			return `## CELEBRATE THE WIN
- Call out the breakthrough (${trigger}) so they feel it land
- Tie it back to the real-world scenario they're rehearsing
- Offer one stretch prompt that builds on the success
- Capture a short ${target} phrase they can reuse later`;
		}

		case 'comprehension_issue': {
			const attempts = context?.type === 'comprehension_issue' ? context.attempts : 1;
			if (attempts >= 3) {
				return `## CLARITY RESCUE
- Switch to ${nativeName} for one sentence to restate the goal
- Break the ${target} line into two chunks and model each
- Let them echo you once per chunk, then rebuild the full line together
- Confirm understanding with a yes/no check before advancing`;
			}
			return `## ADD SUPPORT
- Slow down and highlight the key ${target} phrase
- Offer one synonym or gesture cue to unlock meaning
- Invite them to paraphrase in ${nativeName} if stuck, then recast in ${target}
- Encourage them for trying so the rehearsal stays positive`;
		}

		default:
			return `## ADAPT ON THE FLY
- Stay transparent that you're coaching the role-play
- Adjust language complexity to match their current comfort
- Keep ${target} prompts short and actionable
- Make sure they stay in the driver’s seat of the scene`;
	}
}

function buildClosingSummary(params: InstructionRequest): string {
	const minutesRemaining = params.timeRemaining ?? 0;
	const wrapFocus =
		minutesRemaining > 0
			? `You have about ${minutesRemaining} minute${minutesRemaining === 1 ? '' : 's'} left—use it to lock in one takeaway.`
			: 'Give them one clear takeaway they can use immediately outside this session.';

	return `## SESSION WRAP-UP
- Celebrate one specific improvement you noticed
- Ask what scenario they want to rehearse next so you can queue future practice
- Offer a final ${params.language.name} line they can repeat on their own
- ${wrapFocus}`;
}
