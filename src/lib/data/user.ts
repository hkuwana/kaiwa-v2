import type { User } from '$lib/server/db/types';

export const GUEST_USER: User = {
	id: 'guest',
	displayName: 'Guest',
	email: 'guest@example.com',
	nativeLanguageId: 'en',
	preferredUILanguageId: 'en',
	createdAt: new Date(),
	lastUsage: new Date(),
	hashedPassword: null,
	googleId: null,
	username: null,
	avatarUrl: null,
	stripeCustomerId: null
};
