// src/lib/server/services/user.service.ts

import * as userPreferencesService from './userPreferences.service';
import { subscriptionRepository } from '$lib/server/repositories/subscription.repository';
import type { UserPreferences, UserTier } from '$lib/server/db/types';

/**
 * Get user's current subscription tier
 */
export async function getUserTier(userId: string): Promise<UserTier | null> {
	try {
		const subscription = await subscriptionRepository.findActiveSubscriptionByUserId(userId);
		return (subscription?.tierId as UserTier) || 'free';
	} catch (error) {
		console.error('Error getting user tier:', error);
		return 'free'; // Default to free tier
	}
}

/**
 * Get user preferences (wrapper around userPreferencesService)
 */
export async function getUserPreferences(userId: string) {
	return await userPreferencesService.getUserPreferences(userId);
}

/**
 * Update user preferences (wrapper around userPreferencesService)
 */
export async function updateUserPreferences(userId: string, updates: Partial<UserPreferences>) {
	return await userPreferencesService.updateUserPreferences(userId, updates);
}

export default {
	getUserTier,
	getUserPreferences,
	updateUserPreferences
};
