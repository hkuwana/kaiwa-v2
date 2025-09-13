// src/lib/server/services/user.service.ts

import * as userPreferencesService from './userPreferences.service';
import { subscriptionRepository } from '$lib/server/repositories/subscription.repository';
import { subscriptionService } from './subscription.service';
import { userRepository } from '$lib/server/repositories/user.repository';
import type { UserPreferences, UserTier, User, NewUser } from '$lib/server/db/types';

/**
 * Get user's current subscription tier
 * Automatically creates free subscription if none exists
 */
export async function getUserTier(userId: string): Promise<UserTier> {
	try {
		// This will create a free subscription if none exists
		const subscription = await subscriptionService.getOrCreateUserSubscription(userId);
		return (subscription.effectiveTier || subscription.tierId) as UserTier;
	} catch (error) {
		console.error('Error getting user tier:', error);
		return 'free'; // Default to free tier
	}
}

/**
 * Create a new user and ensure they have a free tier subscription
 */
export async function createUser(userData: NewUser): Promise<User> {
	try {
		// Create the user
		const user = await userRepository.createUser(userData);
		
		// Ensure user has a free subscription
		await subscriptionService.getOrCreateUserSubscription(user.id);
		
		return user;
	} catch (error) {
		console.error('Error creating user:', error);
		throw error;
	}
}

/**
 * Get user by ID and ensure they have a subscription
 */
export async function getUserById(userId: string): Promise<User | undefined> {
	try {
		const user = await userRepository.findUserById(userId);
		if (user) {
			// Ensure user has a subscription (creates free tier if needed)
			await subscriptionService.getOrCreateUserSubscription(userId);
		}
		return user;
	} catch (error) {
		console.error('Error getting user by ID:', error);
		return undefined;
	}
}

/**
 * Update user data
 */
export async function updateUser(userId: string, updates: Partial<NewUser>): Promise<User | undefined> {
	try {
		return await userRepository.updateUser(userId, updates);
	} catch (error) {
		console.error('Error updating user:', error);
		return undefined;
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
	createUser,
	getUserById,
	updateUser,
	getUserPreferences,
	updateUserPreferences
};
