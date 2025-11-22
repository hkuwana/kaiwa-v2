// src/lib/services/session-manager.service.ts
import type { Language } from '$lib/server/db/types';
import type { SessionConfig, Voice } from '$lib/types/openai.realtime.types';
import { env as publicEnv } from '$env/dynamic/public';
import { DEFAULT_VOICE, isValidVoice } from '$lib/types/openai.realtime.types';
import type { RealtimeSessionConfig } from '@openai/agents-realtime';

export function createSessionConfig(
	language: Language,
	voice: Voice,
	instructions: string
): RealtimeSessionConfig {
	// 🛡️ Validate voice before creating session
	let validatedVoice = voice;
	if (!isValidVoice(voice)) {
		console.warn(
			`⚠️ Invalid voice "${voice}" for language "${language.name}". ` +
				`Falling back to default voice "${DEFAULT_VOICE}". ` +
				`Valid voices are: alloy, ash, ballad, coral, echo, sage, shimmer, verse`
		);
		validatedVoice = DEFAULT_VOICE;
	}

	// 📝 Log the session config being sent
	console.log(
		'%c📝 SESSION CONFIG BEING SENT TO OPENAI',
		'color: green; font-weight: bold; font-size: 14px;'
	);
	console.log({
		language: language.code,
		voice: validatedVoice,
		instructionsLength: instructions.length,
		model: publicEnv.PUBLIC_OPEN_AI_MODEL
	});

	return {
		model: publicEnv.PUBLIC_OPEN_AI_MODEL,
		voice: validatedVoice,
		instructions: instructions,
		toolChoice: 'auto',
		tools: []
	};
}

export async function fetchSessionFromBackend(
	sessionId: string,
	voice: Voice,
	languageCode?: string
) {
	const response = await fetch('/api/features/transcribe', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			sessionId: sessionId,
			model: publicEnv.PUBLIC_OPEN_AI_MODEL,
			voice: voice,
			language: languageCode
		})
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
		let errorMessage = `Session creation failed: ${response.status}`;

		// Extract OpenAI error if available
		if (errorData.details?.response) {
			try {
				const openAIError = JSON.parse(errorData.details.response);
				if (openAIError.error?.message) {
					errorMessage = `OpenAI Error: ${openAIError.error.message}`;
				}
			} catch {
				errorMessage = `OpenAI Error: ${errorData.details.response}`;
			}
		} else if (errorData.error) {
			errorMessage = errorData.error;
		}

		throw new Error(errorMessage);
	}

	return response.json();
}

export function createSessionUpdateConfig(
	updates: Partial<{
		instructions: string;
		turnDetection: {
			threshold: number;
			prefix_padding_ms: number;
			silence_duration_ms: number;
		};
	}>,
	language: Language,
	voice: Voice
): SessionConfig {
	// 🛡️ Validate voice before creating session update
	let validatedVoice = voice;
	if (!isValidVoice(voice)) {
		console.warn(
			`⚠️ Invalid voice "${voice}" for language "${language.name}". ` +
				`Falling back to default voice "${DEFAULT_VOICE}". ` +
				`Valid voices are: alloy, ash, ballad, coral, echo, sage, shimmer, verse`
		);
		validatedVoice = DEFAULT_VOICE;
	}

	const instructions =
		updates.instructions || `You are a helpful language tutor for ${language.name || 'English'}.`;

	// 📝 Log the session update config
	console.log(
		'%c📝 SESSION UPDATE CONFIG BEING SENT TO OPENAI',
		'color: orange; font-weight: bold; font-size: 14px;'
	);
	console.log({
		language: language.code,
		voice: validatedVoice,
		instructionsLength: instructions.length,
		hasCustomInstructions: !!updates.instructions
	});

	return {
		type: 'realtime',
		model: publicEnv.PUBLIC_OPEN_AI_MODEL,
		voice: validatedVoice,
		instructions: instructions,
		toolChoice: 'auto',
		tools: []
	};
}
