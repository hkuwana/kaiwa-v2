import { writable, derived, type Writable } from 'svelte/store';
import type { UserContext } from '$lib/server/auth';

// Auth state store
export interface AuthState {
	isAuthenticated: boolean;
	user: {
		id: string;
		displayName: string;
		username: string;
		email: string;
		avatarUrl?: string;
		nativeLanguageId: string;
		preferredUILanguageId: string;
		tier: 'free' | 'pro' | 'premium';
		subscriptionStatus?: string;
		subscriptionExpiresAt?: Date;
		createdAt: Date;
		lastUsage?: Date;
	} | null;
	userContext: UserContext | null;
	isLoading: boolean;
	error: string | null;
}

// Create the auth store
export const authStore: Writable<AuthState> = writable({
	isAuthenticated: false,
	user: null,
	userContext: null,
	isLoading: true,
	error: null
});

// Auth actions
export const authActions = {
	// Initialize auth state from server
	async initialize() {
		try {
			authStore.update((state) => ({ ...state, isLoading: true }));

			const response = await fetch('/api/auth/me');
			if (response.ok) {
				const data = await response.json();
				authStore.set({
					isAuthenticated: true,
					user: data.user,
					userContext: data.userContext,
					isLoading: false,
					error: null
				});
			} else {
				authStore.set({
					isAuthenticated: false,
					user: null,
					userContext: null,
					isLoading: false,
					error: null
				});
			}
		} catch (error) {
			authStore.set({
				isAuthenticated: false,
				user: null,
				userContext: null,
				isLoading: false,
				error: error instanceof Error ? error.message : 'Authentication failed'
			});
		}
	},

	// Login with Google
	async loginWithGoogle() {
		try {
			authStore.update((state) => ({ ...state, isLoading: true, error: null }));

			// Redirect to Google OAuth
			window.location.href = '/auth/google';
		} catch (error) {
			authStore.update((state) => ({
				...state,
				isLoading: false,
				error: error instanceof Error ? error.message : 'Login failed'
			}));
		}
	},

	// Logout
	async logout() {
		try {
			authStore.update((state) => ({ ...state, isLoading: true }));

			await fetch('/logout', { method: 'POST' });

			authStore.set({
				isAuthenticated: false,
				user: null,
				userContext: null,
				isLoading: false,
				error: null
			});
		} catch (error) {
			authStore.update((state) => ({
				...state,
				isLoading: false,
				error: error instanceof Error ? error.message : 'Logout failed'
			}));
		}
	},

	// Refresh user context (useful for updating usage limits)
	async refreshUserContext() {
		try {
			const response = await fetch('/api/auth/me');
			if (response.ok) {
				const data = await response.json();
				authStore.update((state) => ({
					...state,
					userContext: data.userContext
				}));
			}
		} catch (error) {
			console.error('Failed to refresh user context:', error);
		}
	}
};

// Derived stores for easy access
export const isAuthenticated = derived(authStore, ($auth) => $auth.isAuthenticated);
export const currentUser = derived(authStore, ($auth) => $auth.user);
export const currentUserContext = derived(authStore, ($auth) => $auth.userContext);
export const authLoading = derived(authStore, ($auth) => $auth.isLoading);
export const authError = derived(authStore, ($auth) => $auth.error);

// Helper functions for the orchestrator and kernel
export const authHelpers = {
	// Check if user can start a conversation
	canStartConversation: (userContext: UserContext | null) => {
		if (!userContext) return true; // Anonymous users can start
		return userContext.limits.conversationsRemaining > 0;
	},

	// Check if user can use realtime features
	canUseRealtime: (userContext: UserContext | null) => {
		if (!userContext) return false; // Anonymous users cannot use realtime
		return userContext.limits.hasRealtimeAccess && userContext.limits.realtimeSessionsRemaining > 0;
	},

	// Check if user can use advanced voices
	canUseAdvancedVoices: (userContext: UserContext | null) => {
		if (!userContext) return false;
		return userContext.limits.hasAdvancedVoices;
	},

	// Get user's preferred language for AI responses
	getPreferredLanguage: (userContext: UserContext | null) => {
		if (!userContext) return 'en'; // Default to English for anonymous users
		return userContext.user.preferredUILanguageId;
	},

	// Get user's native language for AI prompts
	getNativeLanguage: (userContext: UserContext | null) => {
		if (!userContext) return 'en';
		return userContext.user.nativeLanguageId;
	}
};
