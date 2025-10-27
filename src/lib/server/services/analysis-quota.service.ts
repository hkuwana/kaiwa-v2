import type { UserTier } from '../db/types';
import { userUsageRepository } from '../repositories/user-usage.repository';
import { tierRepository } from '../repositories/tier.repository';
import { TierService } from '../tier.service';

export interface AnalysisQuotaStatus {
	canAnalyze: boolean;
	remainingAnalyses: number;
	resetTime: Date;
	resetType: 'daily' | 'monthly';
	tier: UserTier;
	quotaExceeded: boolean;
	upgradeRequired: boolean;
}

export class AnalysisQuotaService {
	private tierService: TierService;

	constructor() {
		this.tierService = new TierService();
	}

	/**
	 * Check if user can perform analysis and get quota status
	 */
	async getAnalysisQuotaStatus(userId: string): Promise<AnalysisQuotaStatus> {
		const userTier = await this.tierService.getUserTier(userId);
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
			resetTime: this.getNextMonthResetTime(),
			resetType: 'monthly',
			tier: userTier,
			quotaExceeded: false,
			upgradeRequired: false
		};
	}

	/**
	 * Record analysis usage
	 */
	async recordAnalysisUsage(userId: string): Promise<void> {
		const userTier = await this.tierService.getUserTier(userId);
		const tierConfig = await tierRepository.getTierById(userTier);

		if (!tierConfig || tierConfig.hasAnalytics === false) {
			return;
		}

		// No daily tracking; optionally increment monthly analyses for analytics
		await this.recordMonthlyAnalysisUsage(userId);
	}

	/**
	 * Check if user can analyze before starting analysis
	 */
	async canUserAnalyze(userId: string): Promise<boolean> {
		const status = await this.getAnalysisQuotaStatus(userId);
		return status.canAnalyze;
	}

	// Daily/monthly analysis counts removed for MVP

	/**
	 * Record monthly analysis usage
	 */
	private async recordMonthlyAnalysisUsage(userId: string): Promise<void> {
		await userUsageRepository.incrementUsage(userId, {
			analysesUsed: 1
		});
	}

	// Utility methods for date handling

	private getNextMonthResetTime(): Date {
		const nextMonth = new Date();
		nextMonth.setMonth(nextMonth.getMonth() + 1);
		nextMonth.setDate(1);
		nextMonth.setHours(0, 0, 0, 0); // Start of next month
		return nextMonth;
	}
}

// Singleton instance
export const analysisQuotaService = new AnalysisQuotaService();
