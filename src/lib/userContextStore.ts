import { derived } from 'svelte/store';
import { authStore } from './authStore';
import type { UserContext } from '$lib/server/auth';

// Derived stores for user context
export const userContextStore = derived(authStore, ($auth) => $auth.userContext);

// Language preferences
export const userLanguages = derived(userContextStore, ($context) => ({
	native: $context?.languages.native || {
		id: 'en',
		code: 'en',
		name: 'English',
		nativeName: 'English'
	},
	preferred: $context?.languages.preferred || {
		id: 'en',
		code: 'en',
		name: 'English',
		nativeName: 'English'
	}
}));

// User capabilities based on tier
export const userCapabilities = derived(userContextStore, ($context) => ({
	canStartConversation: $context ? $context.limits.conversationsRemaining > 0 : true,
	canUseRealtime: $context
		? $context.limits.hasRealtimeAccess && $context.limits.realtimeSessionsRemaining > 0
		: false,
	canUseAdvancedVoices: $context ? $context.limits.hasAdvancedVoices : false,
	hasAnalytics: $context ? $context.limits.hasAnalytics : false,
	isProUser: $context
		? $context.user.defaultTier === 'plus' || $context.user.defaultTier === 'premium'
		: false,
	isPremiumUser: $context ? $context.user.defaultTier === 'premium' : false
}));

// Usage limits and remaining
export const userLimits = derived(userContextStore, ($context) => ({
	conversations: {
		used: $context?.usage.conversationsUsed || 0,
		remaining: $context?.limits.conversationsRemaining || 10,
		total: $context?.tier?.monthlyConversations || 10
	},
	minutes: {
		used: $context?.usage.minutesUsed || 0,
		remaining: $context?.limits.minutesRemaining || 60,
		total: $context?.tier?.monthlyMinutes || 60
	},
	realtimeSessions: {
		used: $context?.usage.realtimeSessionsUsed || 0,
		remaining: $context?.limits.realtimeSessionsRemaining || 0,
		total: $context?.tier?.monthlyRealtimeSessions || 0
	}
}));

// User preferences for AI interactions
export const userPreferences = derived(userContextStore, ($context) => ({
	// Language preferences for AI responses
	aiResponseLanguage: $context?.user.preferredUILanguageId || 'en',

	// Language for AI prompts (user's native language)
	aiPromptLanguage: $context?.user.nativeLanguageId || 'en',

	// Voice preferences
	preferredVoice: $context?.user.avatarUrl ? 'advanced' : 'standard',

	// Conversation style based on tier
	conversationStyle:
		$context?.user.defaultTier === 'premium'
			? 'advanced'
			: $context?.user.defaultTier === 'plus'
				? 'intermediate'
				: 'basic'
}));

// Helper functions for the orchestrator and kernel
export const contextHelpers = {
	// Get personalized AI prompt based on user context
	getPersonalizedPrompt: (basePrompt: string, userContext: UserContext | null) => {
		if (!userContext) return basePrompt;

		const nativeLang = userContext.languages.native?.name || 'English';
		const preferredLang = userContext.languages.preferred?.name || 'English';
		const tier = userContext.user.defaultTier;

		return `${basePrompt}

User Context:
- Native Language: ${nativeLang}
- Learning Language: ${preferredLang}
- Experience Level: ${tier === 'premium' ? 'Advanced' : tier === 'plus' ? 'Intermediate' : 'Beginner'}
- Tier: ${tier}

Please adapt your responses to be appropriate for this user's level and language preferences.`;
	},

	// Check if user has exceeded limits
	hasExceededLimits: (userContext: UserContext | null) => {
		if (!userContext) return false;

		return {
			conversations: userContext.limits.conversationsRemaining <= 0,
			minutes: userContext.limits.minutesRemaining <= 0,
			realtime: userContext.limits.realtimeSessionsRemaining <= 0
		};
	},

	// Get upgrade suggestions based on usage
	getUpgradeSuggestions: (userContext: UserContext | null) => {
		if (!userContext) return [];

		const suggestions = [];

		if (userContext.limits.conversationsRemaining <= 2) {
			suggestions.push('Upgrade to Pro for unlimited conversations');
		}

		if (userContext.limits.minutesRemaining <= 10) {
			suggestions.push('Upgrade to Pro for unlimited practice time');
		}

		if (!userContext.limits.hasRealtimeAccess) {
			suggestions.push('Upgrade to Pro for real-time conversation practice');
		}

		return suggestions;
	},

	// Get user's learning progress context
	getLearningContext: (userContext: UserContext | null) => {
		if (!userContext) return 'beginner';

		const usage = userContext.usage;
		const tier = userContext.user.defaultTier;

		if (tier === 'premium') return 'advanced';
		if (tier === 'plus') return 'intermediate';

		// For free users, determine level based on usage
		if ((usage.conversationsUsed || 0) > 50) return 'intermediate';
		if ((usage.conversationsUsed || 0) > 20) return 'beginner-intermediate';
		return 'beginner';
	}
};
