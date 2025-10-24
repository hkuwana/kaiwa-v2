// src/lib/utils/conversation-cleanup.ts
// Utility functions to clear all conversation-related data from browser storage

import { browser } from '$app/environment';
import { conversationStore } from '$lib/stores/conversation.store.svelte';

/**
 * Clear all conversation-related data from localStorage and cookies
 * This ensures a completely fresh start for conversations
 */
export function clearAllConversationData(): void {
	if (!browser) {
		console.warn('clearAllConversationData: Not in browser environment');
		return;
	}

	console.log('🧹 Clearing all conversation-related data...');

	// Clear localStorage items
	const localStorageKeys = [
		// User preferences and settings
		'kaiwa_user_preferences',
		'kaiwa_settings',
		'kaiwa_scenario_store',
		
		// Attribution data (might affect conversation flow)
		'kaiwa_attribution',
		
		// Assessment data
		'pendingAssessment',
		
		// Any other conversation-related keys
		'kaiwa_conversation_state',
		'kaiwa_messages',
		'kaiwa_session_data',
		'kaiwa_audio_settings',
		'kaiwa_speech_settings',
		
		// Development/debug data
		'kaiwa_roadmap_state',
		'kaiwa_marketing_state',
		'kaiwa_share_events',
		'kaiwa_test_persistence'
	];

	let clearedLocalStorage = 0;
	localStorageKeys.forEach(key => {
		try {
			if (localStorage.getItem(key)) {
				localStorage.removeItem(key);
				clearedLocalStorage++;
				console.log(`✅ Cleared localStorage: ${key}`);
			}
		} catch (error) {
			console.warn(`⚠️ Failed to clear localStorage key ${key}:`, error);
		}
	});

	// Clear cookies
	const cookieKeys = [
		'kaiwa_share_id',
		'kaiwa_language_code',
		'kaiwa_speaker',
		'kaiwa_scenario',
		'kaiwa_user_preferences',
		'kaiwa_settings',
		'kaiwa_scenario_store',
		'kaiwa_attribution'
	];

	let clearedCookies = 0;
	cookieKeys.forEach(key => {
		try {
			// Clear cookie for current path
			document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax`;
			// Clear cookie for root path
			document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax`;
			clearedCookies++;
			console.log(`✅ Cleared cookie: ${key}`);
		} catch (error) {
			console.warn(`⚠️ Failed to clear cookie ${key}:`, error);
		}
	});

	// Clear any remaining localStorage items that start with 'kaiwa_'
	try {
		const allKeys = Object.keys(localStorage);
		const kaiwaKeys = allKeys.filter(key => key.startsWith('kaiwa_'));
		
		kaiwaKeys.forEach(key => {
			try {
				localStorage.removeItem(key);
				clearedLocalStorage++;
				console.log(`✅ Cleared additional localStorage: ${key}`);
			} catch (error) {
				console.warn(`⚠️ Failed to clear additional localStorage key ${key}:`, error);
			}
		});
	} catch (error) {
		console.warn('⚠️ Failed to scan localStorage for kaiwa_ keys:', error);
	}

	// Clear conversation store state
	try {
		conversationStore.forceClearConversation();
		console.log('✅ Cleared conversation store state');
	} catch (error) {
		console.warn('⚠️ Failed to clear conversation store:', error);
	}

	console.log(`🧹 Cleanup complete: ${clearedLocalStorage} localStorage items, ${clearedCookies} cookies cleared`);
}

/**
 * Clear only conversation-specific data (preserves user preferences)
 */
export function clearConversationDataOnly(): void {
	if (!browser) {
		console.warn('clearConversationDataOnly: Not in browser environment');
		return;
	}

	console.log('🧹 Clearing conversation-specific data only...');

	// Clear only conversation-related localStorage items
	const conversationKeys = [
		'kaiwa_conversation_state',
		'kaiwa_messages',
		'kaiwa_session_data',
		'pendingAssessment'
	];

	let cleared = 0;
	conversationKeys.forEach(key => {
		try {
			if (localStorage.getItem(key)) {
				localStorage.removeItem(key);
				cleared++;
				console.log(`✅ Cleared conversation data: ${key}`);
			}
		} catch (error) {
			console.warn(`⚠️ Failed to clear ${key}:`, error);
		}
	});

	console.log(`🧹 Conversation data cleared: ${cleared} items`);
}

/**
 * Get a summary of stored conversation-related data
 */
export function getConversationDataSummary(): {
	localStorage: Record<string, any>;
	cookies: Record<string, string>;
} {
	if (!browser) {
		return { localStorage: {}, cookies: {} };
	}

	const summary = {
		localStorage: {} as Record<string, any>,
		cookies: {} as Record<string, string>
	};

	// Check localStorage
	try {
		const allKeys = Object.keys(localStorage);
		const kaiwaKeys = allKeys.filter(key => 
			key.startsWith('kaiwa_') || 
			key.includes('conversation') || 
			key.includes('assessment') ||
			key.includes('pending')
		);
		
		kaiwaKeys.forEach(key => {
			try {
				const value = localStorage.getItem(key);
				if (value) {
					summary.localStorage[key] = value.length > 100 ? `${value.substring(0, 100)}...` : value;
				}
			} catch (error) {
				summary.localStorage[key] = `[Error reading: ${error}]`;
			}
		});
	} catch (error) {
		summary.localStorage['error'] = `Failed to read localStorage: ${error}`;
	}

	// Check cookies
	try {
		const cookieString = document.cookie;
		if (cookieString) {
			cookieString.split(';').forEach(cookie => {
				const [key, value] = cookie.trim().split('=');
				if (key && (key.startsWith('kaiwa_') || key.includes('conversation'))) {
					summary.cookies[key] = value || '';
				}
			});
		}
	} catch (error) {
		summary.cookies['error'] = `Failed to read cookies: ${error}`;
	}

	return summary;
}

/**
 * Force reload the page after clearing data
 */
export function clearAndReload(): void {
	clearAllConversationData();
	console.log('🔄 Reloading page...');
	window.location.reload();
}
