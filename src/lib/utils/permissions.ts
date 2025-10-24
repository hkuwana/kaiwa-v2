// src/lib/shared/utils/permissions.ts
// Central permission system for feature access control based on user tiers

// Temporary type for demo - will use proper User type from db
interface DemoUser {
	id: string;
	tier: 'free' | 'pro' | 'premium';
	email: string;
}

export interface TierLimits {
	maxConversationsPerDay: number;
	maxAnalysisPerMonth: number;
	maxMessagesPerConversation: number;
	canShareContent: boolean;
	canAccessPremiumScenarios: boolean;
	canExportAnalysis: boolean;
	canCustomizeVoices: boolean;
	analysisDepth: 'quick' | 'full';
}

export const getTierLimits = (tier: 'free' | 'pro' | 'premium'): TierLimits => {
	switch (tier) {
		case 'free':
			return {
				maxConversationsPerDay: 3,
				maxAnalysisPerMonth: 5,
				maxMessagesPerConversation: 20,
				canShareContent: false,
				canAccessPremiumScenarios: false,
				canExportAnalysis: false,
				canCustomizeVoices: false,
				analysisDepth: 'quick'
			};
		case 'pro':
			return {
				maxConversationsPerDay: 20,
				maxAnalysisPerMonth: 50,
				maxMessagesPerConversation: 100,
				canShareContent: true,
				canAccessPremiumScenarios: true,
				canExportAnalysis: true,
				canCustomizeVoices: true,
				analysisDepth: 'full'
			};
		case 'premium':
			return {
				maxConversationsPerDay: -1, // unlimited
				maxAnalysisPerMonth: -1, // unlimited
				maxMessagesPerConversation: -1, // unlimited
				canShareContent: true,
				canAccessPremiumScenarios: true,
				canExportAnalysis: true,
				canCustomizeVoices: true,
				analysisDepth: 'full'
			};
		default:
			return getTierLimits('free');
	}
};

export const canUseFeature = (
	user: DemoUser | null,
	feature: FeatureType,
	context?: FeatureContext
): boolean => {
	if (!user) return false;

	const limits = getTierLimits(user.tier);

	switch (feature) {
		case 'continue-conversation': {
			if (limits.maxMessagesPerConversation === -1) return true;
			const messageCount = context?.messageCount || 0;
			return messageCount < limits.maxMessagesPerConversation;
		}

		case 'start-conversation': {
			if (limits.maxConversationsPerDay === -1) return true;
			const todayCount = context?.conversationsToday || 0;
			return todayCount < limits.maxConversationsPerDay;
		}

		case 'run-analysis': {
			if (limits.maxAnalysisPerMonth === -1) return true;
			const monthlyCount = context?.analysisThisMonth || 0;
			return monthlyCount < limits.maxAnalysisPerMonth;
		}

		case 'share-content':
			return limits.canShareContent;

		case 'access-premium-scenarios':
			return limits.canAccessPremiumScenarios;

		case 'export-analysis':
			return limits.canExportAnalysis;

		case 'customize-voices':
			return limits.canCustomizeVoices;

		default:
			return false;
	}
};

export const getUpgradeMessage = (
	user: DemoUser | null,
	feature: FeatureType,
	_context?: FeatureContext
): string => {
	if (!user) return 'Please sign in to use this feature.';

	switch (feature) {
		case 'continue-conversation':
			return 'Upgrade to Pro to have longer conversations with unlimited messages.';
		case 'start-conversation':
			return 'You have reached your daily conversation limit. Upgrade to Pro for more conversations.';
		case 'run-analysis':
			return 'You have reached your monthly analysis limit. Upgrade to get detailed feedback on all your conversations.';
		case 'share-content':
			return 'Upgrade to Pro to share your language learning moments and connect with the community.';
		case 'access-premium-scenarios':
			return 'Unlock premium scenarios with real-world survival situations. Upgrade to Pro today.';
		case 'export-analysis':
			return 'Export your analysis reports to track your progress. Available with Pro subscription.';
		case 'customize-voices':
			return 'Choose from premium AI voices for a more personalized conversation experience.';
		default:
			return 'This feature requires a Pro subscription.';
	}
};

// Type definitions
export type FeatureType =
	| 'continue-conversation'
	| 'start-conversation'
	| 'run-analysis'
	| 'share-content'
	| 'access-premium-scenarios'
	| 'export-analysis'
	| 'customize-voices';

export interface FeatureContext {
	messageCount?: number;
	conversationsToday?: number;
	analysisThisMonth?: number;
	scenarioType?: 'basic' | 'premium';
}

// Usage tracking helpers
export const trackFeatureUsage = async (
	userId: string,
	feature: FeatureType,
	context?: FeatureContext
) => {
	// Track usage for quota enforcement
	// This would typically update database counters
	console.log(`Feature usage tracked: ${feature} for user ${userId}`, context);
};

// Helper to check if user is approaching limits
export const getUsageWarning = (
	user: DemoUser,
	feature: FeatureType,
	context?: FeatureContext
): string | null => {
	const limits = getTierLimits(user.tier);

	switch (feature) {
		case 'start-conversation': {
			if (limits.maxConversationsPerDay === -1) return null;
			const remaining = limits.maxConversationsPerDay - (context?.conversationsToday || 0);
			if (remaining <= 1) {
				return `Only ${remaining} conversation${remaining === 1 ? '' : 's'} remaining today.`;
			}
			return null;
		}

		case 'run-analysis': {
			if (limits.maxAnalysisPerMonth === -1) return null;
			const monthlyRemaining = limits.maxAnalysisPerMonth - (context?.analysisThisMonth || 0);
			if (monthlyRemaining <= 2) {
				return `Only ${monthlyRemaining} analysis${monthlyRemaining === 1 ? '' : 'es'} remaining this month.`;
			}
			return null;
		}

		default:
			return null;
	}
};
