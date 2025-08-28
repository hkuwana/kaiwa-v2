import type { User, UserTier } from '$lib/server/db/types';
import { SvelteDate } from 'svelte/reactivity';

// Infer the User type from the database schema

export interface UserManagerState {
	user: User | null;
	isLoggedIn: boolean;
	effectiveTier: UserTier;
}

export class UserManagerStore {
	// Store state using Svelte 5's $state
	private _state = $state<UserManagerState>({
		user: null,
		isLoggedIn: false,
		effectiveTier: 'free'
	});

	constructor(initialUser?: User) {
		if (initialUser) {
			this.setUser(initialUser);
		}

		console.log('👤 User manager store initialized');
	}

	// Public getters
	get state() {
		return this._state;
	}

	get user() {
		return this._state.user;
	}

	get isLoggedIn() {
		return this._state.isLoggedIn;
	}

	get effectiveTier() {
		return this._state.effectiveTier;
	}

	get isFree() {
		return this._state.effectiveTier === 'free';
	}

	get isPremium() {
		return this._state.effectiveTier === 'premium';
	}

	get displayName() {
		return this._state.user?.displayName || this._state.user?.username || 'Guest';
	}

	get email() {
		return this._state.user?.email;
	}

	get avatarUrl() {
		return this._state.user?.avatarUrl;
	}

	get nativeLanguageId() {
		return this._state.user?.nativeLanguageId || 'en';
	}

	get preferredUILanguageId() {
		return this._state.user?.preferredUILanguageId || 'ja';
	}

	// Set user (login)
	setUser(user: User): void {
		this._state.user = user;
		this._state.isLoggedIn = true;
		// Note: effectiveTier is now managed separately through subscription data
		// Default to 'free' until subscription data is loaded
		this._state.effectiveTier = 'free';
		console.log(`👤 User logged in: ${user.displayName || user.username}`);
	}

	// Update user data (partial update)
	updateUser(updates: Partial<User>): void {
		if (this._state.user) {
			this._state.user = { ...this._state.user, ...updates };
			console.log('👤 User data updated:', updates);
		}
	}

	// Override effective tier (e.g., from active subscription)
	setEffectiveTier(tier: UserTier): void {
		this._state.effectiveTier = tier;
		console.log(`👤 Effective tier updated to: ${tier}`);
	}

	// Logout user
	logout(): void {
		this._state.user = null;
		this._state.isLoggedIn = false;
		this._state.effectiveTier = 'free';
		console.log('👤 User logged out');
	}

	// Reset to initial state
	reset(): void {
		this._state.user = null;
		this._state.isLoggedIn = false;
		this._state.effectiveTier = 'free';
		console.log('👤 User manager reset to initial state');
	}

	// Get debug information
	getDebugInfo() {
		return {
			state: this._state,
			isFree: this.isFree,

			isPremium: this.isPremium,
			displayName: this.displayName
		};
	}

	// Check if user has access to a specific tier or higher
	hasAccessToTier(requiredTier: UserTier): boolean {
		const tierOrder: Record<UserTier, number> = {
			free: 0,
			plus: 1,
			premium: 2
		};

		return tierOrder[this._state.effectiveTier] >= tierOrder[requiredTier];
	}

	// Get user tier display name
	getTierDisplayName(): string {
		switch (this._state.effectiveTier) {
			case 'free':
				return 'Free';
			case 'plus':
				return 'Plus';
			case 'premium':
				return 'Premium';
			default:
				return 'Unknown';
		}
	}

	// Check if user has specific properties
	hasGoogleAuth(): boolean {
		return !!this._state.user?.googleId;
	}

	hasStripeCustomer(): boolean {
		return !!this._state.user?.stripeCustomerId;
	}

	hasPassword(): boolean {
		return !!this._state.user?.hashedPassword;
	}

	// Update last usage timestamp
	updateLastUsage(): void {
		if (this._state.user) {
			this._state.user = {
				...this._state.user,
				lastUsage: new SvelteDate()
			};
		}
	}
}

// Export a factory function
export function createUserManagerStore(initialUser?: User): UserManagerStore {
	return new UserManagerStore(initialUser);
}

// Export a singleton instance (optional)
export const userManager = new UserManagerStore();
