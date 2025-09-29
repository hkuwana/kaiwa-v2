// 👤 User Database Operations
// Helper functions for user management with Google OAuth

import { userRepository } from './repositories/user.repository';
import type { User } from './db/types';
import { nanoid } from 'nanoid';

export interface CreateUserData {
	googleId: string;
	email: string;
	displayName: string;
	avatarUrl?: string;
}

// Get user by Google ID
export async function getUserByGoogleId(googleId: string): Promise<User | null> {
	try {
		const user = await userRepository.findUserByGoogleId(googleId);
		return user || null;
	} catch (error) {
		console.error('Error fetching user by Google ID:', error);
		return null;
	}
}

// Get user by email
export async function getUserByEmail(email: string): Promise<User | null> {
	try {
		const user = await userRepository.findUserByEmail(email);
		return user || null;
	} catch (error) {
		console.error('Error fetching user by email:', error);
		return null;
	}
}

// Create a new user from Google OAuth
export async function createUserFromGoogle(data: CreateUserData): Promise<User> {
	try {
		// Generate a unique username if displayName is not available
		const username = data.displayName
			? data.displayName.toLowerCase().replace(/\s+/g, '') + '_' + nanoid(4)
			: 'user_' + nanoid(8);

		const newUser = await userRepository.createUser({
			googleId: data.googleId,
			email: data.email,
			displayName: data.displayName,
			username: username,
			avatarUrl: data.avatarUrl,
			createdAt: new Date(),
			lastUsage: new Date()
		});

		return newUser;
	} catch (error) {
		console.error('Error creating user:', error);
		throw new Error('Failed to create user');
	}
}

// Update user's last usage timestamp
export async function updateUserLastUsage(userId: string): Promise<void> {
	try {
		await userRepository.updateUser(userId, { lastUsage: new Date() });
	} catch (error) {
		console.error('Error updating user last usage:', error);
		// Non-critical error, don't throw
	}
}