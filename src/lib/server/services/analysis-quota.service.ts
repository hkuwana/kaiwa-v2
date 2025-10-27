import type { UserTier } from '../db/types';
import { userUsageRepository } from '../repositories/user-usage.repository';
import { tierRepository } from '../repositories/tier.repository';
import { tierService } from '../tier.service';

export interface AnalysisQuotaStatus {
	canAnalyze: boolean;
	remainingAnalyses: number;
	resetTime: Date;
	resetType: 'daily' | 'monthly';
	tier: UserTier;
	quotaExceeded: boolean;
	upgradeRequired: boolean;
}

/**
 * Get next month reset time (start of next month)
 */
function getNextMonthResetTime(): Date {
	const nextMonth = new Date();
	nextMonth.setMonth(nextMonth.getMonth() + 1);
	nextMonth.setDate(1);
	nextMonth.setHours(0, 0, 0, 0);
	return nextMonth;
}

/**
 * Record monthly analysis usage
 */
async function recordMonthlyAnalysisUsage(userId: string): Promise<void> {
	await userUsageRepository.incrementUsage(userId, {
		analysesUsed: 1
	});
}

/**
 * Check if user can perform analysis and get quota status
 */
export async function getAnalysisQuotaStatus(userId: string): Promise<AnalysisQuotaStatus> {
	const userTier = await tierService.getUserTier(userId);
	const tierConfig = await tierRepository.getTierById(userTier);

	if (!tierConfig) {
		throw new Error(`Tier configuration not found for tier: ${userTier}`);
	}

	// Gate by analytics/deep analysis feature only
	if (tierConfig.hasAnalytics === false) {
		return {
			canAnalyze: false,
			remainingAnalyses: 0,
			resetTime: new Date(),
			resetType: 'monthly',
			tier: userTier,
			quotaExceeded: true,
			upgradeRequired: true
		};
	}

	// For MVP: allow analysis when feature is enabled; no per-day tracking
	return {
		canAnalyze: true,
		remainingAnalyses: -1,
		resetTime: getNextMonthResetTime(),
		resetType: 'monthly',
		tier: userTier,
		quotaExceeded: false,
		upgradeRequired: false
	};
}

/**
 * Record analysis usage
 */
export async function recordAnalysisUsage(userId: string): Promise<void> {
	const userTier = await tierService.getUserTier(userId);
	const tierConfig = await tierRepository.getTierById(userTier);

	if (!tierConfig || tierConfig.hasAnalytics === false) {
		return;
	}

	// No daily tracking; optionally increment monthly analyses for analytics
	await recordMonthlyAnalysisUsage(userId);
}

/**
 * Check if user can analyze before starting analysis
 */
export async function canUserAnalyze(userId: string): Promise<boolean> {
	const status = await getAnalysisQuotaStatus(userId);
	return status.canAnalyze;
}

// Export service object with all functions
export const analysisQuotaService = {
	getAnalysisQuotaStatus,
	recordAnalysisUsage,
	canUserAnalyze
};
