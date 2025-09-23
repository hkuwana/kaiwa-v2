// src/lib/services/onboarding-manager.service.ts
// Service for managing conversation analysis and onboarding flow
// NO store imports - pure functions only

import type { Message, Language, UserPreferences } from '$lib/server/db/types';
import * as conversationMemoryService from './conversation-memory.service';

export interface OnboardingAnalysisRequest {
	conversationMessages: string[];
	targetLanguage: string;
	sessionId: string;
	scenarioCategory?: string;
}

export interface OnboardingAnalysisResult {
	success: boolean;
	data?: Record<string, unknown>;
	error?: string;
}

export interface UserPreferencesProvider {
	isGuest(): boolean;
	getPreference<K extends keyof UserPreferences>(key: K): UserPreferences[K];
	updatePreferences(updates: Partial<UserPreferences>): Promise<void>;
}

/**
 * Check if onboarding analysis should be triggered
 */
export function shouldTriggerOnboarding(preferencesProvider: UserPreferencesProvider): boolean {
	return (
		preferencesProvider.isGuest() || preferencesProvider.getPreference('successfulExchanges') === 0
	);
}

/**
 * Validate prerequisites for onboarding analysis
 */
export function validateAnalysisPrerequisites(
	language: Language | null,
	messages: Message[]
): { isValid: boolean; error?: string } {
	if (!language) {
		return {
			isValid: false,
			error: 'Cannot trigger onboarding analysis: missing language'
		};
	}

	if (messages.length === 0) {
		return {
			isValid: false,
			error: 'Cannot trigger onboarding analysis: no messages'
		};
	}

	return { isValid: true };
}

/**
 * Prepare conversation messages for analysis
 */
export function prepareMessagesForAnalysis(messages: Message[]): string[] {
	return messages
		.filter((msg) => msg.role === 'user' && msg.content.trim())
		.map((msg) => msg.content);
}

/**
 * Call the onboarding analysis API
 */
export async function callAnalysisAPI(
	analysisRequest: OnboardingAnalysisRequest
): Promise<OnboardingAnalysisResult> {
	try {
		const response = await fetch('/api/analyze-onboarding', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(analysisRequest)
		});

		if (!response.ok) {
			throw new Error(`Onboarding analysis failed: ${response.statusText}`);
		}

		const result = await response.json();

		if (result.success) {
			return {
				success: true,
				data: result.data
			};
		} else {
			return {
				success: false,
				error: result.error
			};
		}
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Analysis API call failed'
		};
	}
}

/**
 * Update user preferences with analysis results
 */
export async function updatePreferencesWithAnalysis(
	analysisData: Record<string, unknown>,
	preferencesProvider: UserPreferencesProvider
): Promise<void> {
	const currentExchanges = preferencesProvider.getPreference('successfulExchanges') || 0;
	const { memories: rawMemories, ...otherData } = analysisData as {
		memories?: unknown;
	} & Record<string, unknown>;

	const updates: Partial<UserPreferences> = {
		...otherData,
		successfulExchanges: currentExchanges + 1
	} as Partial<UserPreferences>;

	const existingMemories = (preferencesProvider.getPreference('memories') as string[] | null) || [];
	const incomingMemories = conversationMemoryService.sanitizeMemories(
		(rawMemories as string[]) || []
	);

	if (incomingMemories.length > 0) {
		updates.memories = conversationMemoryService.mergeMemories({
			existing: existingMemories,
			incoming: incomingMemories
		});

		console.log('🧠 [Onboarding] Memory merge', {
			existingBefore: existingMemories,
			incomingMemories,
			mergedMemories: updates.memories
		});
	} else {
		console.log('🧠 [Onboarding] No incoming memories from analysis payload');
	}

	await preferencesProvider.updatePreferences(updates);
}

/**
 * Execute complete onboarding analysis flow
 */
export async function executeOnboardingAnalysis(
	language: Language,
	messages: Message[],
	sessionId: string,
	preferencesProvider: UserPreferencesProvider
): Promise<{ success: boolean; error?: string }> {
	try {
		console.log('🎯 Triggering onboarding analysis...');

		// Validate prerequisites
		const validation = validateAnalysisPrerequisites(language, messages);
		if (!validation.isValid) {
			console.warn(validation.error);
			return { success: false, error: validation.error };
		}

		// Prepare messages for analysis
		const conversationMessages = prepareMessagesForAnalysis(messages);

		if (conversationMessages.length === 0) {
			console.warn('No user messages found for onboarding analysis');
			return { success: false, error: 'No user messages found for analysis' };
		}

		// Call analysis API
		const analysisResult = await callAnalysisAPI({
			conversationMessages,
			targetLanguage: language.code,
			sessionId,
			scenarioCategory: 'onboarding'
		});

		if (analysisResult.success && analysisResult.data) {
			console.log('✅ Onboarding analysis completed successfully');

			// Update user preferences with analysis results
			await updatePreferencesWithAnalysis(analysisResult.data, preferencesProvider);

			return { success: true };
		} else {
			console.error('❌ Onboarding analysis failed:', analysisResult.error);
			return { success: false, error: analysisResult.error };
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Onboarding analysis failed';
		console.error('Failed to trigger onboarding analysis:', error);
		return { success: false, error: errorMessage };
	}
}
