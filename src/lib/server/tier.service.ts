// 🏆 Tier Management Service - Aligned with userUsage and conversationSessions
// This service manages user tiers and usage tracking based on the database schema

import type { UserTier, Tier, UserUsage } from './db/types';
import { getServerTierConfig } from '$lib/server/tiers';
import { subscriptionRepository } from './repositories/subscription.repository';
import { userUsageRepository } from './repositories/user-usage.repository';
import { conversationSessionsRepository } from './repositories/conversation-sessions.repository';

export interface UsageStatus {
	tier: Tier;
	usage: UserUsage;
	canStartConversation: boolean;
	canUseRealtime: boolean;
	resetDate: Date;
}

/**
 * Get current period in YYYY-MM format
 */
function getCurrentPeriod(): string {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	return `${year}-${month}`;
}

/**
 * Get next reset date (first day of next month)
 */
function getNextResetDate(): Date {
	const now = new Date();
	return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}

/**
 * Get user's current tier from their active subscription
 */
export async function getUserTier(userId: string): Promise<UserTier> {
	return await subscriptionRepository.getUserTier(userId);
}

/**
 * Get current usage status for a user
 */
export async function getUsageStatus(userId: string): Promise<UsageStatus> {
	const tierId = await getUserTier(userId);
	const tierConfig = getServerTierConfig(tierId);
	const currentPeriod = getCurrentPeriod();

	// Get current month's usage
	const usage = await userUsageRepository.getCurrentMonthUsage(userId);

	const currentUsage = usage || {
		userId,
		period: currentPeriod,
		conversationsUsed: 0,
		secondsUsed: 0,
		realtimeSessionsUsed: 0,
		bankedSeconds: 0,
		bankedSecondsUsed: 0,
		ankiExportsUsed: 0,
		sessionExtensionsUsed: 0,
		advancedVoiceSeconds: 0,
		analysesUsed: 0,
		completedSessions: 0,
		longestSessionSeconds: 0,
		averageSessionSeconds: 0,
		overageSeconds: 0,
		tierWhenUsed: 'free',
		lastConversationAt: null,
		lastRealtimeAt: null,
		firstActivityAt: null,
		createdAt: new Date(),
		updatedAt: new Date()
	};

	// Ensure we have valid numbers (handle null values from database)
	const conversationsUsed = currentUsage.conversationsUsed || 0;
	const realtimeSessionsUsed = currentUsage.realtimeSessionsUsed || 0;

	// Check if user can start conversations and use realtime
	const canStartConversation =
		tierConfig.monthlyConversations === null || conversationsUsed < tierConfig.monthlyConversations;

	const canUseRealtime =
		tierConfig.monthlyRealtimeSessions === null ||
		realtimeSessionsUsed < tierConfig.monthlyRealtimeSessions;

	return {
		tier: tierConfig,
		usage: currentUsage,
		canStartConversation,
		canUseRealtime,
		resetDate: getNextResetDate()
	};
}

/**
 * Record conversation usage
 */
export async function recordConversationUsage(
	userId: string,
	durationSeconds: number
): Promise<void> {
	await userUsageRepository.incrementUsage(userId, {
		conversationsUsed: 1,
		secondsUsed: durationSeconds
	});
}

/**
 * Record realtime session usage
 */
export async function recordRealtimeSessionUsage(userId: string): Promise<void> {
	await userUsageRepository.incrementUsage(userId, {
		realtimeSessionsUsed: 1
	});
}

/**
 * Record conversation session details
 */
export async function recordConversationSession(sessionData: {
	id: string;
	userId: string;
	language: string;
	startTime: Date;
	endTime?: Date;
	durationSeconds: number;
	secondsConsumed?: number;
	inputTokens?: number;
	wasExtended?: boolean;
	extensionsUsed?: number;
	transcriptionMode?: boolean;
	deviceType?: string;
}): Promise<void> {
	await conversationSessionsRepository.createSession({
		id: sessionData.id,
		userId: sessionData.userId,
		language: sessionData.language,
		startTime: sessionData.startTime,
		endTime: sessionData.endTime,
		durationSeconds: sessionData.durationSeconds,
		secondsConsumed: sessionData.secondsConsumed ?? sessionData.durationSeconds,
		inputTokens: sessionData.inputTokens ?? 0,
		wasExtended: sessionData.wasExtended || false,
		extensionsUsed: sessionData.extensionsUsed || 0,
		transcriptionMode: sessionData.transcriptionMode || false,
		deviceType: sessionData.deviceType
	});
}

/**
 * Update user's tier (used by Stripe webhooks)
 */
export async function upgradeUserTier(userId: string, newTier: UserTier): Promise<void> {
	// This method is called by Stripe webhooks to update user tier
	// The actual tier is stored in the subscriptions table, not directly on users
	// This method exists for compatibility with existing Stripe service code
	console.log(`User ${userId} tier updated to ${newTier} via subscription`);
}

/**
 * Get user's conversation sessions for analytics
 */
export async function getUserConversationSessions(
	userId: string,
	limit = 50
): Promise<typeof conversationSessionsRepository.getUserSessions.prototype.returns> {
	return await conversationSessionsRepository.getUserSessions(userId, limit);
}

/**
 * Get user's usage history
 */
export async function getUserUsageHistory(
	userId: string,
	limit = 12
): Promise<typeof userUsageRepository.getUsageHistory.prototype.returns> {
	return await userUsageRepository.getUsageHistory(userId, limit);
}

/**
 * Check if user can start a conversation
 */
export async function canStartConversation(userId: string): Promise<boolean> {
	const usageStatus = await getUsageStatus(userId);
	return usageStatus.canStartConversation;
}

/**
 * Check if user can use realtime features
 */
export async function canUseRealtime(userId: string): Promise<boolean> {
	const usageStatus = await getUsageStatus(userId);
	return usageStatus.canUseRealtime;
}

/**
 * Get tier configuration by ID
 */
export function getTierConfig(tierId: UserTier): Tier {
	return getServerTierConfig(tierId);
}

// Export service object with all functions
export const tierService = {
	getUserTier,
	getUsageStatus,
	recordConversationUsage,
	recordRealtimeSessionUsage,
	recordConversationSession,
	upgradeUserTier,
	getUserConversationSessions,
	getUserUsageHistory,
	canStartConversation,
	canUseRealtime,
	getTierConfig
};
