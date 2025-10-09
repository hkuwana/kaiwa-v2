// src/lib/services/session-manager.service.ts
import type { Language } from '$lib/server/db/types';
import type { SessionConfig, Voice } from '$lib/types/openai.realtime.types';
import { env as publicEnv } from '$env/dynamic/public';
import type { RealtimeSessionConfig } from '@openai/agents-realtime';

export function createSessionConfig(
	language: Language,
	voice: Voice,
	instructions: string
): RealtimeSessionConfig {
	return {
		model: publicEnv.PUBLIC_OPEN_AI_MODEL,
		voice: voice,
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
	return {
		model: publicEnv.PUBLIC_OPEN_AI_MODEL,
		voice: voice,
		instructions:
			updates.instructions || `You are a helpful language tutor for ${language.name || 'English'}.`,
		toolChoice: 'auto',
		tools: []
	};
}
