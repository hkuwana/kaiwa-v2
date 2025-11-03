import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { db } from '$lib/server/db/index';
import { userUsage, subscriptions } from '$lib/server/db/schema';
import type { NewUserUsage, UserUsage } from '$lib/server/db/types';

function cleanUpdate<T extends Record<string, unknown>>(data: T, omit: (keyof T)[] = []) {
	return Object.fromEntries(
		Object.entries(data).filter(
			([key, value]) => !omit.includes(key as keyof T) && value !== undefined
		)
	) as Partial<T>;
}

export class UserUsageRepository {
	/**
	 * Get current month usage for a user
	 * @param userId The user ID
	 * @param subscriptionStartDate Optional subscription start date to align period with billing cycle
	 */
	async getCurrentMonthUsage(userId: string, subscriptionStartDate?: Date): Promise<UserUsage | null> {
		let currentPeriod: string;

		if (subscriptionStartDate) {
			currentPeriod = this.getSubscriptionAlignedPeriod(subscriptionStartDate);
		} else {
			// Look up subscription if not provided
			const sub = await db
				.select()
				.from(subscriptions)
				.where(eq(subscriptions.userId, userId))
				.limit(1);

			if (sub[0]?.createdAt) {
				currentPeriod = this.getSubscriptionAlignedPeriod(sub[0].createdAt);
			} else {
				currentPeriod = this.getCurrentPeriod();
			}
		}

		const result = await db
			.select()
			.from(userUsage)
			.where(and(eq(userUsage.userId, userId), eq(userUsage.period, currentPeriod)))
			.limit(1);

		return result[0] || null;
	}

	/**
	 * Get usage for a specific period
	 */
	async getUsageForPeriod(userId: string, period: string): Promise<UserUsage | null> {
		const result = await db
			.select()
			.from(userUsage)
			.where(and(eq(userUsage.userId, userId), eq(userUsage.period, period)))
			.limit(1);

		return result[0] || null;
	}

	/**
	 * Get usage history for a user (last 12 months)
	 */
	async getUsageHistory(userId: string, months: number = 12): Promise<UserUsage[]> {
		const periods = this.getLastNPeriods(months);

		// Use Drizzle's inArray operator for better compatibility
		return await db
			.select()
			.from(userUsage)
			.where(and(eq(userUsage.userId, userId), inArray(userUsage.period, periods)))
			.orderBy(desc(userUsage.period));
	}

	/**
	 * Create or update current month usage
	 * @param userId The user ID
	 * @param updates Partial usage updates
	 * @param subscriptionStartDate Optional subscription start date to align period with billing cycle
	 */
	async upsertCurrentMonthUsage(
		userId: string,
		updates: Partial<NewUserUsage>,
		subscriptionStartDate?: Date
	): Promise<UserUsage> {
		let currentPeriod: string;

		if (subscriptionStartDate) {
			currentPeriod = this.getSubscriptionAlignedPeriod(subscriptionStartDate);
		} else {
			// Look up subscription if not provided
			const sub = await db
				.select()
				.from(subscriptions)
				.where(eq(subscriptions.userId, userId))
				.limit(1);

			if (sub[0]?.createdAt) {
				currentPeriod = this.getSubscriptionAlignedPeriod(sub[0].createdAt);
			} else {
				currentPeriod = this.getCurrentPeriod();
			}
		}

		const insertPayload = {
			userId,
			period: currentPeriod,
			...(cleanUpdate(updates as Record<string, unknown>) as Partial<NewUserUsage>)
		};

		const updatePayload = cleanUpdate(
			{
				...updates,
				updatedAt: new Date()
			} as Record<string, unknown>,
			['userId', 'period']
		) as Partial<NewUserUsage>;

		const [result] = await db
			.insert(userUsage)
			.values(insertPayload)
			.onConflictDoUpdate({
				target: [userUsage.userId, userUsage.period],
				set: updatePayload
			})
			.returning();

		return result;
	}

	/**
	 * Increment usage for current month
	 * @param userId The user ID
	 * @param updates Partial usage updates to increment
	 * @param subscriptionStartDate Optional subscription start date to align period with billing cycle
	 */
	async incrementUsage(
		userId: string,
		updates: {
			conversationsUsed?: number;
			secondsUsed?: number;
			realtimeSessionsUsed?: number;
			ankiExportsUsed?: number;
			sessionExtensionsUsed?: number;
			advancedVoiceSeconds?: number;
			analysesUsed?: number;
			// Analysis usage by type
			basicAnalysesUsed?: number;
			advancedGrammarUsed?: number;
			fluencyAnalysisUsed?: number;
			onboardingProfileUsed?: number;
			pronunciationAnalysisUsed?: number;
			speechRhythmUsed?: number;
			// Other usage tracking
			completedSessions?: number;
			longestSessionSeconds?: number;
			averageSessionSeconds?: number;
			overageSeconds?: number;
			tierWhenUsed?: UserUsage['tierWhenUsed'];
			lastConversationAt?: Date;
			lastRealtimeAt?: Date;
			firstActivityAt?: Date;
		},
		subscriptionStartDate?: Date
	): Promise<UserUsage | null> {
		const current = await this.getCurrentMonthUsage(userId, subscriptionStartDate);

		if (!current) {
			// Create new record if none exists
			return await this.upsertCurrentMonthUsage(userId, updates, subscriptionStartDate);
		}

		// Build the update object dynamically
		const updateData: Partial<UserUsage> = {
			updatedAt: new Date()
		};

		if (updates.conversationsUsed !== undefined) {
			updateData.conversationsUsed = (current.conversationsUsed || 0) + updates.conversationsUsed;
		}
		if (updates.secondsUsed !== undefined) {
			updateData.secondsUsed = (current.secondsUsed || 0) + updates.secondsUsed;
		}
		if (updates.realtimeSessionsUsed !== undefined) {
			updateData.realtimeSessionsUsed =
				(current.realtimeSessionsUsed || 0) + updates.realtimeSessionsUsed;
		}
		if (updates.ankiExportsUsed !== undefined) {
			updateData.ankiExportsUsed = (current.ankiExportsUsed || 0) + updates.ankiExportsUsed;
		}
		if (updates.sessionExtensionsUsed !== undefined) {
			updateData.sessionExtensionsUsed =
				(current.sessionExtensionsUsed || 0) + updates.sessionExtensionsUsed;
		}
		if (updates.advancedVoiceSeconds !== undefined) {
			updateData.advancedVoiceSeconds =
				(current.advancedVoiceSeconds || 0) + updates.advancedVoiceSeconds;
		}
		if (updates.analysesUsed !== undefined) {
			updateData.analysesUsed = (current.analysesUsed || 0) + updates.analysesUsed;
		}

		// Analysis usage by type increments
		if (updates.basicAnalysesUsed !== undefined) {
			updateData.basicAnalysesUsed = (current.basicAnalysesUsed || 0) + updates.basicAnalysesUsed;
		}
		if (updates.advancedGrammarUsed !== undefined) {
			updateData.advancedGrammarUsed =
				(current.advancedGrammarUsed || 0) + updates.advancedGrammarUsed;
		}
		if (updates.fluencyAnalysisUsed !== undefined) {
			updateData.fluencyAnalysisUsed =
				(current.fluencyAnalysisUsed || 0) + updates.fluencyAnalysisUsed;
		}
		if (updates.onboardingProfileUsed !== undefined) {
			updateData.onboardingProfileUsed =
				(current.onboardingProfileUsed || 0) + updates.onboardingProfileUsed;
		}
		if (updates.pronunciationAnalysisUsed !== undefined) {
			updateData.pronunciationAnalysisUsed =
				(current.pronunciationAnalysisUsed || 0) + updates.pronunciationAnalysisUsed;
		}
		if (updates.speechRhythmUsed !== undefined) {
			updateData.speechRhythmUsed = (current.speechRhythmUsed || 0) + updates.speechRhythmUsed;
		}

		if (updates.completedSessions !== undefined) {
			updateData.completedSessions = (current.completedSessions || 0) + updates.completedSessions;
		}
		if (updates.longestSessionSeconds !== undefined) {
			updateData.longestSessionSeconds = Math.max(
				current.longestSessionSeconds || 0,
				updates.longestSessionSeconds
			);
		}
		if (updates.averageSessionSeconds !== undefined) {
			updateData.averageSessionSeconds = updates.averageSessionSeconds; // Direct set for average
		}
		if (updates.overageSeconds !== undefined) {
			updateData.overageSeconds = (current.overageSeconds || 0) + updates.overageSeconds;
		}

		if (updates.tierWhenUsed !== undefined) {
			updateData.tierWhenUsed = updates.tierWhenUsed;
		}
		if (updates.lastConversationAt) {
			updateData.lastConversationAt = updates.lastConversationAt;
		}
		if (updates.lastRealtimeAt) {
			updateData.lastRealtimeAt = updates.lastRealtimeAt;
		}
		if (!current.firstActivityAt) {
			updateData.firstActivityAt = updates.firstActivityAt || new Date();
		} else if (updates.firstActivityAt) {
			// Allow explicit overrides when we intentionally pass a timestamp
			updateData.firstActivityAt = updates.firstActivityAt;
		}

		// Update existing record
		const [updated] = await db
			.update(userUsage)
			.set(updateData)
			.where(and(eq(userUsage.userId, userId), eq(userUsage.period, current.period)))
			.returning();

		return updated || null;
	}

	/**
	 * Update banking information
	 * @param userId The user ID
	 * @param bankedSeconds Amount of banked seconds
	 * @param bankedSecondsUsed Amount of banked seconds used
	 * @param subscriptionStartDate Optional subscription start date to align period with billing cycle
	 */
	async updateBanking(
		userId: string,
		bankedSeconds: number,
		bankedSecondsUsed: number = 0,
		subscriptionStartDate?: Date
	): Promise<UserUsage | null> {
		const current = await this.getCurrentMonthUsage(userId, subscriptionStartDate);

		if (!current) {
			// Create new record if none exists
			return await this.upsertCurrentMonthUsage(
				userId,
				{
					bankedSeconds,
					bankedSecondsUsed
				},
				subscriptionStartDate
			);
		}

		// Update existing record
		const [updated] = await db
			.update(userUsage)
			.set({
				bankedSeconds,
				bankedSecondsUsed,
				updatedAt: new Date()
			})
			.where(and(eq(userUsage.userId, userId), eq(userUsage.period, current.period)))
			.returning();

		return updated || null;
	}

	/**
	 * Get usage summary for a user
	 */
	async getUserUsageSummary(userId: string): Promise<{
		currentMonth: UserUsage | null;
		lastMonth: UserUsage | null;
		totalUsage: {
			conversations: number;
			seconds: number;
			realtimeSessions: number;
		};
	}> {
		const lastPeriod = this.getLastPeriod();

		const [currentMonth, lastMonth] = await Promise.all([
			this.getCurrentMonthUsage(userId),
			this.getUsageForPeriod(userId, lastPeriod)
		]);

		// Get total usage across all periods
		const totalUsage = await db
			.select({
				conversations: sql<number>`sum(${userUsage.conversationsUsed})`,
				seconds: sql<number>`sum(${userUsage.secondsUsed})`,
				realtimeSessions: sql<number>`sum(${userUsage.realtimeSessionsUsed})`
			})
			.from(userUsage)
			.where(eq(userUsage.userId, userId));

		return {
			currentMonth,
			lastMonth,
			totalUsage: {
				conversations: Number(totalUsage[0]?.conversations) || 0,
				seconds: Number(totalUsage[0]?.seconds) || 0,
				realtimeSessions: Number(totalUsage[0]?.realtimeSessions) || 0
			}
		};
	}

	/**
	 * Reset monthly usage (for new month)
	 * @param userId The user ID
	 * @param subscriptionStartDate Optional subscription start date to align period with billing cycle
	 */
	async resetMonthlyUsage(userId: string, subscriptionStartDate?: Date): Promise<UserUsage | null> {
		let currentPeriod: string;

		if (subscriptionStartDate) {
			currentPeriod = this.getSubscriptionAlignedPeriod(subscriptionStartDate);
		} else {
			// Look up subscription if not provided
			const sub = await db
				.select()
				.from(subscriptions)
				.where(eq(subscriptions.userId, userId))
				.limit(1);

			if (sub[0]?.createdAt) {
				currentPeriod = this.getSubscriptionAlignedPeriod(sub[0].createdAt);
			} else {
				currentPeriod = this.getCurrentPeriod();
			}
		}

		// Check if record already exists for current month
		const existing = await this.getCurrentMonthUsage(userId, subscriptionStartDate);
		if (existing) {
			return existing; // Already reset
		}

		// Get last month's usage for banking
		const lastPeriod = this.getLastPeriod();
		const lastMonthUsage = await this.getUsageForPeriod(userId, lastPeriod);

		// Create new month record with banking
		const [created] = await db
			.insert(userUsage)
			.values({
				userId,
				period: currentPeriod,
				conversationsUsed: 0,
				secondsUsed: 0,
				realtimeSessionsUsed: 0,
				bankedSeconds: lastMonthUsage?.bankedSeconds || 0,
				bankedSecondsUsed: 0
			})
			.returning();

		return created || null;
	}

	/**
	 * Get all users with usage in a period
	 */
	async getUsersWithUsageInPeriod(period: string): Promise<UserUsage[]> {
		return await db
			.select()
			.from(userUsage)
			.where(eq(userUsage.period, period))
			.orderBy(desc(userUsage.secondsUsed));
	}

	/**
	 * Delete all usage records for a user
	 */
	async deleteUserUsage(userId: string): Promise<number> {
		const result = await db
			.delete(userUsage)
			.where(eq(userUsage.userId, userId))
			.returning({ id: userUsage.userId });
		return result.length;
	}

	// Daily usage removed for MVP: rely on monthly usage and tier limits

	// Helper methods for period management

	/**
	 * Get current period in YYYY-MM format (falls back to calendar month if subscription date not provided)
	 * Period format: YYYY-MM where the month resets on the user's subscription anniversary day (if provided)
	 * @param subscriptionStartDate Optional - the date the user's subscription was created
	 * @returns The current period in YYYY-MM format
	 */
	getCurrentPeriod(subscriptionStartDate?: Date): string {
		if (subscriptionStartDate) {
			return this.getSubscriptionAlignedPeriod(subscriptionStartDate);
		}

		// Fallback to calendar month
		const now = new Date();
		return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
	}

	/**
	 * Calculate the subscription-aligned period for a user
	 * Period format: YYYY-MM where the month resets on the user's subscription anniversary day
	 * @param subscriptionStartDate The date the user's subscription was created
	 * @returns The current period in YYYY-MM format based on subscription anniversary
	 */
	private getSubscriptionAlignedPeriod(subscriptionStartDate: Date): string {
		const now = new Date();
		const startDate = new Date(subscriptionStartDate);

		// Calculate the anniversary date in the current year
		let anniversaryThisYear = new Date(now.getFullYear(), startDate.getMonth(), startDate.getDate());

		// If the anniversary hasn't happened yet this year, we're still in the previous period
		if (now < anniversaryThisYear) {
			anniversaryThisYear = new Date(now.getFullYear() - 1, startDate.getMonth(), startDate.getDate());
		}

		// Return the period based on the anniversary year and month
		const year = anniversaryThisYear.getFullYear();
		const month = String(anniversaryThisYear.getMonth() + 1).padStart(2, '0');
		return `${year}-${month}`;
	}

	/**
	 * Get the next reset date (anniversary date if subscription exists, otherwise first day of next month)
	 * @param subscriptionStartDate Optional - the date the user's subscription was created
	 * @returns The next period reset date
	 */
	getNextResetDate(subscriptionStartDate?: Date): Date {
		if (subscriptionStartDate) {
			return this.getNextResetDateForSubscription(subscriptionStartDate);
		}

		// Fallback to first day of next month
		const now = new Date();
		return new Date(now.getFullYear(), now.getMonth() + 1, 1);
	}

	/**
	 * Get the next reset date based on subscription anniversary
	 * @param subscriptionStartDate The date the user's subscription was created
	 * @returns The next period reset date
	 */
	private getNextResetDateForSubscription(subscriptionStartDate: Date): Date {
		const now = new Date();
		const startDate = new Date(subscriptionStartDate);

		// Calculate the next anniversary date
		let nextAnniversary = new Date(now.getFullYear(), startDate.getMonth(), startDate.getDate());

		// If the anniversary has already passed this year, set it for next year
		if (now >= nextAnniversary) {
			nextAnniversary = new Date(now.getFullYear() + 1, startDate.getMonth(), startDate.getDate());
		}

		return nextAnniversary;
	}

	private getLastPeriod(): string {
		const now = new Date();
		now.setMonth(now.getMonth() - 1);
		return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
	}

	private getLastNPeriods(n: number): string[] {
		const periods: string[] = [];
		const now = new Date();

		for (let i = 0; i < n; i++) {
			const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
			const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
			periods.push(period);
		}

		return periods;
	}
}

// Export singleton instance
export const userUsageRepository = new UserUsageRepository();
