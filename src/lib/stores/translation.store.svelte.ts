// 🌐 Translation Store
// Manages translation state for messages

import { SvelteSet } from 'svelte/reactivity';

interface TranslationState {
	// Track which messages are currently being translated
	translating: SvelteSet<string>;
	// Track which messages have translations visible
	visible: SvelteSet<string>;
}

// Create reactive state using Svelte 5 syntax
export const translationState = $state<TranslationState>({
	translating: new SvelteSet(),
	visible: new SvelteSet()
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

	// Reset store
	reset() {
		translationState.translating.clear();
		translationState.visible.clear();
	}
};
