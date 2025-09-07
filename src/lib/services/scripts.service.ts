// 🌐 Scripts Service
// Orchestrator for all script generation (romanization, furigana, pinyin, etc.)

import type { Message } from '$lib/server/db/types';
import {
	generateRomanizationClient,
	generateRomanizationServer,
	isJapaneseText,
	isChineseText,
	isKoreanText
} from './romanization.service';
import { generateFuriganaClient, generateFuriganaServer } from './furigana.service';

// Script generation result
export interface ScriptResult {
	romanization?: string;
	hiragana?: string;
	katakana?: string;
	hangul?: string;
	pinyin?: string;
	furigana?: string;
	otherScripts?: Record<string, string>;
}

// Detect language from text
export function detectLanguage(text: string): 'ja' | 'zh' | 'ko' | 'other' {
	if (isJapaneseText(text)) return 'ja';
	if (isChineseText(text)) return 'zh';
	if (isKoreanText(text)) return 'ko';
	return 'other';
}

// Generate scripts for a message (client-side - fast)
export async function generateScriptsClient(message: Message): Promise<ScriptResult> {
	const language = detectLanguage(message.content);

	if (language === 'other') {
		return {};
	}

	const romanizationResult = await generateRomanizationClient(message.content, language);

	// For Japanese, also generate furigana
	if (language === 'ja') {
		const furiganaResult = await generateFuriganaClient(message.content);
		return {
			...romanizationResult,
			...furiganaResult
		};
	}

	return romanizationResult;
}

// Generate scripts for a message (server-side - accurate)
export async function generateScriptsServer(message: Message): Promise<ScriptResult> {
	const language = detectLanguage(message.content);

	if (language === 'other') {
		return {};
	}

	const romanizationResult = await generateRomanizationServer(
		message.content,
		language,
		message.id
	);

	// For Japanese, also generate furigana
	if (language === 'ja') {
		const furiganaResult = await generateFuriganaServer(message.content, message.id);
		return {
			...romanizationResult,
			...furiganaResult
		};
	}

	return romanizationResult;
}

// Update message with script data
export function updateMessageWithScripts(message: Message, scriptData: ScriptResult): Message {
	const updatedMessage = { ...message };

	// Update romanization fields
	if (scriptData.romanization) {
		updatedMessage.romanization = scriptData.romanization;
	}
	if (scriptData.hiragana) {
		updatedMessage.hiragana = scriptData.hiragana;
	}

	// Update other scripts
	if (
		scriptData.katakana ||
		scriptData.hangul ||
		scriptData.pinyin ||
		scriptData.furigana ||
		scriptData.otherScripts
	) {
		updatedMessage.otherScripts = {
			...(updatedMessage.otherScripts || {}),
			...(scriptData.katakana && { katakana: scriptData.katakana }),
			...(scriptData.hangul && { hangul: scriptData.hangul }),
			...(scriptData.pinyin && { pinyin: scriptData.pinyin }),
			...(scriptData.furigana && { furigana: scriptData.furigana }),
			...(scriptData.otherScripts || {})
		};
	}

	return updatedMessage;
}

// Generate scripts for a message (auto-detect client/server)
export async function generateScriptsForMessage(
	message: Message,
	useServer: boolean = true
): Promise<ScriptResult> {
	if (useServer) {
		return await generateScriptsServer(message);
	} else {
		return await generateScriptsClient(message);
	}
}

// Check if message needs script generation
export function needsScriptGeneration(message: Message): boolean {
	const language = detectLanguage(message.content);
	return language !== 'other' && !hasScriptData(message);
}

// Check if message already has script data
export function hasScriptData(message: Message): boolean {
	return !!(message.romanization || message.hiragana || message.otherScripts);
}
