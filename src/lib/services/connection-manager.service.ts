// src/lib/services/connection-manager.service.ts
// Pure functional service for managing conversation connections
// NO imports from other services - only external dependencies

import { realtimeService } from '$lib/services';
import type { Language, UserPreferences } from '$lib/server/db/types';
import type { Voice } from '$lib/types/openai.realtime.types';
import { env as publicEnv } from '$env/dynamic/public';
export interface ConnectionSetupResult {
	connection: realtimeService.RealtimeConnection;
	sessionId: string;
	voice: Voice;
	language: Language;
}

export interface ConnectionOptions {
	language?: Language;
	speaker?: string;
	options?: Partial<UserPreferences>;
}

/**
 * Fetch session from backend - MOVED HERE to avoid service dependency
 */
export async function fetchSessionFromBackend(sessionId: string, voice: Voice) {
	const response = await fetch('/api/realtime-session', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			sessionId: sessionId,
			model: publicEnv.PUBLIC_OPEN_AI_MODEL,
			voice: voice
		})
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
		let errorMessage = `Session creation failed: ${response.status}`;

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

	const result = await response.json();
	// Ensure response has the expected structure
	if (!result.session_id) {
		result.session_id = sessionId;
	}

	return result;
}

/**
 * Validate connection prerequisites
 */
export function validateConnectionPrerequisites(
	status: string,
	language?: Language
): { isValid: boolean; error?: string } {
	if (status !== 'idle') {
		return {
			isValid: false,
			error: 'Conversation already in progress'
		};
	}

	if (!language) {
		return {
			isValid: false,
			error: 'Language is required to start conversation'
		};
	}

	return { isValid: true };
}
