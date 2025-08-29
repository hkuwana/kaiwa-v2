// src/lib/services/session-manager.service.ts
import type { Language } from '$lib/server/db/types';
import type { SessionConfig, Voice } from '$lib/types/openai.realtime.types';

export function createSessionConfig(
	language: Language,
	voice: Voice,
	instructions: string
): SessionConfig {
	return {
		model: 'gpt-4o-mini-realtime-preview-2024-12-17',
		voice: voice,
		instructions: instructions,
		input_audio_transcription: {
			model: 'whisper-1' as const,
			language: language.code
		},
		turn_detection: {
			type: 'server_vad' as const,
			threshold: 0.3,
			prefix_padding_ms: 500,
			silence_duration_ms: 800
		},
		input_audio_format: 'pcm16' as const,
		output_audio_format: 'pcm16' as const
	};
}

export async function fetchSessionFromBackend(sessionId: string, voice: Voice) {
	const response = await fetch('/api/realtime-session', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			sessionId: sessionId,
			model: 'gpt-4o-mini-realtime-preview-2024-12-17',
			voice: voice
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
		model: 'gpt-4o-mini-realtime-preview-2024-12-17',
		voice: voice,
		instructions:
			updates.instructions || `You are a helpful language tutor for ${language.name || 'English'}.`,
		input_audio_transcription: {
			model: 'whisper-1' as const,
			language: language.code || 'en'
		},
		turn_detection: updates.turnDetection || {
			type: 'server_vad' as const,
			threshold: 0.45,
			prefix_padding_ms: 300,
			silence_duration_ms: 600
		},
		input_audio_format: 'pcm16' as const,
		output_audio_format: 'pcm16' as const
	};
}
