// 💰 Pricing API Endpoint
// Exposes public pricing information to the frontend

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getServerTierConfigs } from '$lib/server/tiers';

export const GET: RequestHandler = async () => {
	try {
		const tierConfigs = getServerTierConfigs();

		// Transform server configs to public pricing data
		const publicPricing = Object.values(tierConfigs).map((tier) => ({
			id: tier.id,
			name: tier.name,
			description: tier.description,

			// Pricing (public info)
			monthlyPriceUsd: tier.monthlyPriceUsd,
			annualPriceUsd: tier.annualPriceUsd,

			// Usage limits (public info)
			monthlyConversations: tier.monthlyConversations,
			monthlySeconds: tier.monthlySeconds,
			monthlyRealtimeSessions: tier.monthlyRealtimeSessions,

			// Session limits (public info)
			maxSessionLengthSeconds: tier.maxSessionLengthSeconds,
			sessionBankingEnabled: tier.sessionBankingEnabled,
			maxBankedSeconds: tier.maxBankedSeconds,

			// Feature flags (public info)
			hasRealtimeAccess: tier.hasRealtimeAccess,
			hasAdvancedVoices: tier.hasAdvancedVoices,
			hasAnalytics: tier.hasAnalytics,
			hasCustomPhrases: tier.hasCustomPhrases,
			hasConversationMemory: tier.hasConversationMemory,
			hasAnkiExport: tier.hasAnkiExport,

			// Timer settings (public info)
			conversationTimeoutSeconds: tier.conversationTimeoutSeconds,
			warningThresholdSeconds: tier.warningThresholdSeconds,
			canExtend: tier.canExtend,
			maxExtensions: tier.maxExtensions,
			extensionDurationSeconds: tier.extensionDurationSeconds,

			// Additional public fields
			overagePricePerMinuteInCents: tier.overagePricePerMinuteInCents,
			feedbackSessionsPerMonth: tier.feedbackSessionsPerMonth,
			customizedPhrasesFrequency: tier.customizedPhrasesFrequency,
			conversationMemoryLevel: tier.conversationMemoryLevel

			// Note: Stripe IDs are intentionally excluded for security
		}));

		return json({
			success: true,
			tiers: publicPricing
		});
	} catch (error) {
		console.error('Error fetching pricing data:', error);
		return json(
			{
				error: 'Failed to fetch pricing data',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
