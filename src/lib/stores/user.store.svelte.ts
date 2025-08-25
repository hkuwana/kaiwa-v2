import { writable } from 'svelte/store';
import { SubscriptionTier } from '$lib/enums';

interface UserManager {
	userLoggedIn: boolean;
	effectiveTier: SubscriptionTier;
}

// Create a basic user manager store
export const userManager = writable<UserManager>({
	userLoggedIn: false,
	effectiveTier: SubscriptionTier.GUEST
});

// Helper functions
export function setUserTier(tier: SubscriptionTier) {
	userManager.update((manager) => ({
		...manager,
		effectiveTier: tier
	}));
}

export function setUserLoggedIn(loggedIn: boolean) {
	userManager.update((manager) => ({
		...manager,
		userLoggedIn: loggedIn
	}));
}

