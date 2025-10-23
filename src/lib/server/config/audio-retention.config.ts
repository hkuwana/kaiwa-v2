/**
 * Audio Retention Policy Configuration
 *
 * Manages the lifecycle of audio files stored in Tigris/S3 to control storage costs
 * while ensuring essential data is preserved for learning analytics.
 *
 * **Retention Tiers:**
 * - Free users: 30 days (enough for recent practice review)
 * - Plus users: 90 days (medium-term progress tracking)
 * - Premium users: 365 days (long-term analysis)
 * - System/demo: 7 days (minimal retention for examples)
 *
 * **Signed URL TTL:**
 * - All tiers: 7 days (balances security with user experience)
 * - URLs are regenerated on-demand when expired
 *
 * **Cost Estimates (Tigris):**
 * - Storage: ~$0.02/GB/month
 * - Transfer: ~$0.09/GB
 * - Average audio: ~1-5MB per minute
 * - 100 active users * 30 min/month = 3-15GB = $0.06-$0.30/month storage
 */

export const AUDIO_RETENTION_CONFIG = {
	// Signed URL time-to-live (same for all tiers)
	signedUrlTtlDays: 7,

	// Retention periods by user tier (in days)
	retentionPeriods: {
		free: 30, // 1 month
		plus: 90, // 3 months
		premium: 365, // 1 year
		system: 7, // Demo/system messages
		guest: 1 // Guest users (very short)
	},

	// Cleanup job configuration
	cleanup: {
		// How often to run cleanup (cron format)
		schedule: '0 3 * * *', // Daily at 3 AM UTC

		// Process in batches to avoid overwhelming the database
		batchSize: 100,

		// Grace period before actual deletion (safety buffer)
		gracePeriodDays: 7,

		// Whether to soft-delete (mark as deleted) or hard-delete
		softDelete: true, // Keep audit trail

		// Dry run mode (for testing - doesn't actually delete)
		dryRun: false
	},

	// Cost monitoring thresholds
	costMonitoring: {
		// Alert when storage exceeds this (in GB)
		storageAlertThresholdGb: 50,

		// Alert when monthly transfer exceeds this (in GB)
		transferAlertThresholdGb: 100,

		// Estimated cost per GB storage per month
		storageCostPerGbMonth: 0.02,

		// Estimated cost per GB transfer
		transferCostPerGb: 0.09
	}
} as const;

/**
 * Get retention period for a user tier
 */
export function getRetentionPeriodDays(
	tier: 'free' | 'plus' | 'premium' | 'system' | 'guest'
): number {
	return AUDIO_RETENTION_CONFIG.retentionPeriods[tier];
}

/**
 * Calculate when audio should expire based on tier
 */
export function calculateAudioRetentionExpiry(
	tier: 'free' | 'plus' | 'premium' | 'system' | 'guest',
	createdAt: Date = new Date()
): Date {
	const retentionDays = getRetentionPeriodDays(tier);
	const expiryDate = new Date(createdAt);
	expiryDate.setDate(expiryDate.getDate() + retentionDays);
	return expiryDate;
}

/**
 * Calculate when signed URL should expire
 */
export function calculateSignedUrlExpiry(createdAt: Date = new Date()): Date {
	const expiryDate = new Date(createdAt);
	expiryDate.setDate(expiryDate.getDate() + AUDIO_RETENTION_CONFIG.signedUrlTtlDays);
	return expiryDate;
}

/**
 * Check if signed URL needs refresh
 */
export function needsSignedUrlRefresh(expiresAt: Date | null): boolean {
	if (!expiresAt) return true;

	// Refresh if expired or expiring within 1 day
	const oneDayFromNow = new Date();
	oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);

	return expiresAt <= oneDayFromNow;
}

/**
 * Check if audio should be deleted based on retention policy
 */
export function shouldDeleteAudio(retentionExpiresAt: Date | null): boolean {
	if (!retentionExpiresAt) return false;

	const now = new Date();
	const gracePeriod = new Date(retentionExpiresAt);
	gracePeriod.setDate(gracePeriod.getDate() + AUDIO_RETENTION_CONFIG.cleanup.gracePeriodDays);

	return now >= gracePeriod;
}

/**
 * Estimate storage cost for audio files
 */
export function estimateStorageCost(totalSizeBytes: number, retentionDays: number): number {
	const sizeGb = totalSizeBytes / (1024 * 1024 * 1024);
	const costPerDay = (sizeGb * AUDIO_RETENTION_CONFIG.costMonitoring.storageCostPerGbMonth) / 30;
	return costPerDay * retentionDays;
}
