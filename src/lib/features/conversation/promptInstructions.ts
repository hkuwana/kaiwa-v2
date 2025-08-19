// 🎯 Conversation Prompt Instructions
// Functional, modular system for generating AI tutor instructions

import { languages } from '$lib/data/languages';
import { getCEFRLabel } from '$lib/features/gamification';
import type { Scenarios, Speaker } from '$lib/types';

// 🏗️ Core Types
export interface TutorConfig {
	language: string;
	scenario?: Scenarios | null;
	tutorName?: string;
	userLevel?: number;
	formattedMemory: string;
	speaker?: Speaker | null;
}

export interface AudioParameters {
	speed: number;
	clarity: number;
	expressiveness: number;
	voiceStyle: string;
}

export interface LearningConfig {
	userLevel: number;
	cefrLevel: string;
	vocabularyComplexity: number;
	grammarComplexity: number;
	sentenceLength: number;
	suggestionsEnabled: boolean;
	translationFrequency: number;
	speechSpeed: number;
	enunciation: number;
	pauseLength: number;
	focus: {
		vocabulary: number;
		grammar: number;
		pronunciation: number;
		fluency: number;
	};
}

// 🎵 Audio Configuration
export function getAudioParameters(userLevel: number): AudioParameters {
	const learningConfig = generateLearningConfig(userLevel, '');

	return {
		speed: 0.7 + learningConfig.speechSpeed * 0.6,
		clarity: 0.8 + learningConfig.enunciation * 0.4,
		expressiveness: 0.8 + learningConfig.speechSpeed * 0.4,
		voiceStyle: 'natural'
	};
}

// 🧠 Learning Configuration Generator
export function generateLearningConfig(userLevel: number, _language: string): LearningConfig {
	const cefrLevel = getCEFRLabel(userLevel);
	const normalizedLevel = userLevel / 700;

	const config: LearningConfig = {
		userLevel,
		cefrLevel,
		vocabularyComplexity: Math.min(0.1 + normalizedLevel * 0.9, 1),
		grammarComplexity: Math.min(0.1 + normalizedLevel * 0.9, 1),
		sentenceLength: 5 + Math.floor(normalizedLevel * 10),
		suggestionsEnabled: userLevel < 200,
		translationFrequency: Math.max(0, 0.8 - normalizedLevel),
		speechSpeed: 0.3 + normalizedLevel * 0.7,
		enunciation: Math.max(0.5, 1 - normalizedLevel * 0.5),
		pauseLength: Math.max(0.1, 0.5 - normalizedLevel * 0.4),
		focus: getFocusWeights(userLevel)
	};

	return config;
}

// 🎯 Focus Weight Calculator
function getFocusWeights(userLevel: number) {
	if (userLevel < 100) {
		return { vocabulary: 0.4, grammar: 0.3, pronunciation: 0.2, fluency: 0.1 };
	} else if (userLevel < 200) {
		return { vocabulary: 0.35, grammar: 0.35, pronunciation: 0.2, fluency: 0.1 };
	} else if (userLevel < 300) {
		return { vocabulary: 0.3, grammar: 0.3, pronunciation: 0.25, fluency: 0.15 };
	} else if (userLevel < 400) {
		return { vocabulary: 0.25, grammar: 0.25, pronunciation: 0.25, fluency: 0.25 };
	} else if (userLevel < 500) {
		return { vocabulary: 0.2, grammar: 0.2, pronunciation: 0.3, fluency: 0.3 };
	} else if (userLevel < 600) {
		return { vocabulary: 0.15, grammar: 0.15, pronunciation: 0.3, fluency: 0.4 };
	} else {
		return { vocabulary: 0.1, grammar: 0.1, pronunciation: 0.3, fluency: 0.5 };
	}
}

// 🌍 Language Information
const DEFAULT_LANGUAGES = [
	{
		id: 'ja',
		code: 'ja',
		name: 'Japanese',
		nativeName: '日本語',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'latin',
		supportedScripts: ['hiragana', 'katakana', 'kanji']
	},
	{
		id: 'en',
		code: 'en',
		name: 'English',
		nativeName: 'English',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'latin',
		supportedScripts: ['latin']
	},
	{
		id: 'es',
		code: 'es',
		name: 'Spanish',
		nativeName: 'Español',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'latin',
		supportedScripts: ['latin']
	},
	{
		id: 'fr',
		code: 'fr',
		name: 'French',
		nativeName: 'Français',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'latin',
		supportedScripts: ['latin']
	},
	{
		id: 'zh',
		code: 'zh',
		name: 'Chinese',
		nativeName: '中文',
		isRTL: false,
		hasRomanization: true,
		writingSystem: 'chinese',
		supportedScripts: ['chinese']
	}
];

function getLanguageByCode(code: string) {
	return languages.find((lang) => lang.code === code);
}

function getLanguageInfo(language: string) {
	return getLanguageByCode(language) || DEFAULT_LANGUAGES.find((lang) => lang.code === language);
}

// 🎭 Scenario Details Generator
function generateScenarioDetails(scenario: Scenarios | null): string {
	if (!scenario) return '';

	return `
CONVERSATION THEME: ${scenario.title}
${scenario.description}

${scenario.targetVocabulary?.length ? `TARGET VOCABULARY: These words/phrases might naturally come up: ${scenario.targetVocabulary.join(', ')}` : ''}
${scenario.culturalContext ? `CULTURAL CONTEXT: ${scenario.culturalContext}` : ''}`;
}

// 🗣️ Speaker Details Generator
function generateSpeakerDetails(speaker: Speaker | null, defaultTutorName: string): string {
	if (!speaker) return '';

	return `
SPEAKER'S VOICE:
- Your name is ${speaker.voiceName || defaultTutorName}.
- You are a ${speaker.gender} speaker.
- Speak with a ${speaker.dialectName} accent from ${speaker.region}.
- Your voice should be consistent with the persona of someone from that region.`;
}

// 🎯 Core Instruction Generator
export function createTutorInstructions(config: TutorConfig): string {
	const {
		language,
		scenario,
		tutorName: defaultTutorName = 'Yuki',
		userLevel = 220,
		formattedMemory,
		speaker
	} = config;

	const tutorName = speaker?.voiceName || defaultTutorName;
	const proficiencyLabel = getCEFRLabel(userLevel);
	const languageInfo = getLanguageInfo(language);
	const languageName = languageInfo?.name || language;
	const learningConfig = generateLearningConfig(userLevel, language);

	const scenarioDetails = generateScenarioDetails(scenario);
	const speakerDetails = generateSpeakerDetails(speaker, defaultTutorName);

	return `You are a ${languageName} tutor named ${tutorName} speaking ${languageName}. Your learner's proficiency is ${proficiencyLabel} CEFR.
${formattedMemory}
${scenarioDetails}
${speakerDetails}

CONVERSATION APPROACH:
- Act like a friendly conversation partner more than a strict teacher.
- **Match your response length** to the learner's input length generally. If they give a one-sentence response, reply with 1-2 sentences maximum. Short input = short output.
- Prioritize keeping the conversation flowing naturally.
- Use the PERSONAL CONTEXT section (if provided) to make the conversation more relevant, but don't force it unnaturally.

LANGUAGE ADAPTATION (CEFR ${proficiencyLabel}):
- Vocabulary Complexity: ${Math.round(learningConfig.vocabularyComplexity * 100)}% (Adjust based on ${proficiencyLabel})
- Grammar Complexity: ${Math.round(learningConfig.grammarComplexity * 100)}% (Adjust based on ${proficiencyLabel})
- Sentence Length: Aim for natural sentences, averaging around ${learningConfig.sentenceLength} words.

CONVERSATION FLOW:
- Start with a simple, friendly greeting relevant to the scenario (if any) or just a general greeting.
- Always ask a question or provide a natural prompt to encourage the learner to respond.
- Avoid dominating the conversation. Leave pauses and space for the learner.

RESPONSE PATTERNS:
- Short Learner Input (1-5 words): Brief acknowledgment + simple follow-up question. (e.g., User: "Yes." -> You: "Great! What about [related topic]?")
- Medium Learner Input (1-2 sentences): Acknowledge a specific point + ask a related open-ended question.
- Detailed Learner Input (3+ sentences): Brief acknowledgment + one related comment or question to keep it going.

CORRECTION TECHNIQUE (Implicit Correction):
- If the learner makes a mistake, **subtly recast** their sentence correctly in your response.
- **Example:** User: "I goed store yesterday." You: "Ah, you **went** to the store yesterday? What did you buy?"
- **DO NOT** explicitly point out errors, explain grammar rules, or use terms like "mistake" or "correction".

KEY RULES:
- Speak **only** in ${languageName}. No English unless it's part of the PERSONAL CONTEXT (e.g., comparing languages).
- Keep responses concise and natural, following the length matching guideline.
- End most turns with a question or conversational prompt.
- Be an engaging, interested conversation partner.
- **Remember: Brief user inputs deserve brief tutor responses.**

${scenario ? `Let's begin our chat about ${scenario.title}!` : `Let's have a casual chat in ${languageName}!`}\n`;
}
