// 🏆 Client-side Tier Access
// This file provides client-safe access to tier configurations
// All data comes from the server-side configuration as the single source of truth

import type { UserTier } from '$lib/server/db/types';

// Re-export UserTier for compatibility
export type { UserTier };

// Re-export all functions from the server configuration
// Note: On the client side, these will need to be called via API endpoints for security
export {
	serverTierConfigs as defaultTierConfigs,
	getTierConfig,
	getTimerSettings,
	canExtendConversation,
	getConversationTimeout,
	getWarningThreshold,
	getMaxSessionLength,
	getMonthlySeconds,
	hasSessionBanking,
	getMaxBankedSeconds,
	getTierByStripePriceId,
	getTierByStripeProductId,
	getMaxMemories
} from '$lib/server/data/tiers';