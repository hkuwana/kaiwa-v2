// 🌐 Translation Store
// Manages translation state for messages and organizes translated content

import { SvelteSet, SvelteMap } from 'svelte/reactivity';
import type { Message } from '$lib/server/db/types';

interface TranslationState {
	// Track which messages are currently being translated
	translating: SvelteSet<string>;
	// Track which messages have translations visible
	visible: SvelteSet<string>;
	// Store organized translation data for messages
	translationData: SvelteMap<string, OrganizedTranslation>;
}

// Use Partial<Message> instead of a separate interface
type OrganizedTranslation = Partial<Message> & {
	messageId: string;
};

// Create reactive state using Svelte 5 syntax
export const translationState = $state<TranslationState>({
	translating: new SvelteSet(),
	visible: new SvelteSet(),
	translationData: new SvelteMap()
});

// Helper functions
export const translationStore = {
	// Set translation loading state for a message
	setTranslating(messageId: string, isTranslating: boolean) {
		if (isTranslating) {
			translationState.translating.add(messageId);
		} else {
			translationState.translating.delete(messageId);
		}
	},

	// Check if a message is currently being translated
	isTranslating(messageId: string): boolean {
		return translationState.translating.has(messageId);
	},

	// Show translation for a message
	showTranslation(messageId: string) {
		translationState.visible.add(messageId);
	},

	// Hide translation for a message
	hideTranslation(messageId: string) {
		translationState.visible.delete(messageId);
	},

	// Toggle translation visibility for a message
	toggleTranslation(messageId: string) {
		if (translationState.visible.has(messageId)) {
			translationState.visible.delete(messageId);
		} else {
			translationState.visible.add(messageId);
		}
	},

	// Check if translation is visible for a message
	isTranslationVisible(messageId: string): boolean {
		return translationState.visible.has(messageId);
	},

	// Store organized translation data
	setTranslationData(messageId: string, translationData: OrganizedTranslation) {
		translationState.translationData.set(messageId, translationData);
	},

	// Get organized translation data for a message
	getTranslationData(messageId: string): OrganizedTranslation | undefined {
		return translationState.translationData.get(messageId);
	},

	// Check if message has organized translation data
	hasTranslationData(messageId: string): boolean {
		return translationState.translationData.has(messageId);
	},

	// Organize translation data from raw translation service response
	organizeTranslationData(
		messageId: string,
		rawTranslation: {
			translatedContent: string;
			romanization?: string;
			hiragana?: string;
			otherScripts?: Record<string, string>;
			sourceLanguage: string;
			targetLanguage: string;
			confidence?: 'low' | 'medium' | 'high';
			provider?: string;
		}
	): OrganizedTranslation {
		const organized: OrganizedTranslation = {
			messageId,
			translatedContent: rawTranslation.translatedContent,
			sourceLanguage: rawTranslation.sourceLanguage,
			targetLanguage: rawTranslation.targetLanguage,
			translationConfidence: rawTranslation.confidence || null,
			translationProvider: rawTranslation.provider || null,
			isTranslated: true
		};

		// Add language-specific scripts
		if (rawTranslation.romanization) organized.romanization = rawTranslation.romanization;
		if (rawTranslation.hiragana) organized.hiragana = rawTranslation.hiragana;
		if (rawTranslation.otherScripts) organized.otherScripts = rawTranslation.otherScripts;

		return organized;
	},

	// Update message with organized translation data
	updateMessageWithTranslation(message: Message, translationData: OrganizedTranslation): Message {
		return {
			...message,
			...translationData,
			// Ensure required fields are not undefined
			translatedContent: translationData.translatedContent || message.translatedContent,
			sourceLanguage: translationData.sourceLanguage || message.sourceLanguage,
			targetLanguage: translationData.targetLanguage || message.targetLanguage,
			isTranslated: translationData.isTranslated ?? true
		};
	},

	// Get all translation data for a conversation
	getAllTranslationData(): SvelteMap<string, OrganizedTranslation> {
		return translationState.translationData;
	},

	// Clear translation data for a specific message
	clearTranslationData(messageId: string) {
		translationState.translationData.delete(messageId);
	},

	// Reset store
	reset() {
		translationState.translating.clear();
		translationState.visible.clear();
		translationState.translationData.clear();
	}
};
