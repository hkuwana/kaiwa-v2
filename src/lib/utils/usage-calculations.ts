/**
 * Utility functions for usage calculations
 * Used consistently across billing and usage display components
 */

/**
 * Calculate remaining seconds available for a user
 * Takes into account monthly allowance, banked seconds, and both used amounts
 * @param monthlySeconds The tier's monthly second allowance
 * @param secondsUsed Amount of monthly seconds already used
 * @param bankedSeconds Available banked seconds from rollover
 * @param bankedSecondsUsed Amount of banked seconds already used
 * @returns Remaining seconds available
 */
export function calculateSecondsRemaining(
	monthlySeconds: number | null | undefined,
	secondsUsed: number | null | undefined,
	bankedSeconds: number | null | undefined,
	bankedSecondsUsed: number | null | undefined
): number {
	if (monthlySeconds === null || monthlySeconds === undefined) {
		return 0; // Unlimited or invalid
	}

	const totalAvailable = (monthlySeconds || 0) + (bankedSeconds || 0);
	const totalUsed = (secondsUsed || 0) + (bankedSecondsUsed || 0);
	return Math.max(0, totalAvailable - totalUsed);
}

/**
 * Calculate total available seconds (monthly + banked)
 */
export function calculateTotalAvailableSeconds(
	monthlySeconds: number | null | undefined,
	bankedSeconds: number | null | undefined
): number {
	if (monthlySeconds === null || monthlySeconds === undefined) {
		return 0;
	}
	return (monthlySeconds || 0) + (bankedSeconds || 0);
}

/**
 * Calculate total used seconds (used + banked used)
 */
export function calculateTotalUsedSeconds(
	secondsUsed: number | null | undefined,
	bankedSecondsUsed: number | null | undefined
): number {
	return (secondsUsed || 0) + (bankedSecondsUsed || 0);
}

/**
 * Calculate usage percentage
 */
export function calculateUsagePercentage(
	monthlySeconds: number | null | undefined,
	secondsUsed: number | null | undefined,
	bankedSeconds: number | null | undefined,
	bankedSecondsUsed: number | null | undefined
): number {
	if (monthlySeconds === null || monthlySeconds === undefined || monthlySeconds === 0) {
		return 0;
	}

	const totalAvailable = calculateTotalAvailableSeconds(monthlySeconds, bankedSeconds);
	const totalUsed = calculateTotalUsedSeconds(secondsUsed, bankedSecondsUsed);

	if (totalAvailable <= 0) return 0;
	return Math.min(100, (totalUsed / totalAvailable) * 100);
}
