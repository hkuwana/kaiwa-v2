// src/lib/server/services/session.service.ts

import { dev } from '$app/environment';
import type { Cookies } from '@sveltejs/kit';
import { randomUUID } from 'crypto';
import type { UserPreferences } from '$lib/server/db/types';
import { userPreferencesRepository } from '../repositories/userPreferences.repository';

// Cookie-based session data for anonymous users (before they sign up)
interface AnonymousSessionData {
	sessionId: string;
	preferences: Partial<UserPreferences>;
	createdAt: Date;
	lastUpdated: Date;
}

const COOKIE_NAME = 'language_session';
const COOKIE_OPTIONS = {
	httpOnly: true,
	secure: !dev,
	sameSite: 'lax' as const,
	maxAge: 60 * 60 * 24 * 30, // 30 days
	path: '/'
};

/**
 * Create a new anonymous session
 */
export function createAnonymousSession(
	cookies: Cookies,
	initialPreferences?: Partial<UserPreferences>
): string {
	const sessionId = randomUUID();
	const sessionData: AnonymousSessionData = {
		sessionId,
		preferences: {
			targetLanguageId: 'en',
			learningGoal: 'Connection',
			speakingLevel: 5,
			listeningLevel: 5,
			readingLevel: 5,
			writingLevel: 5,
			speakingConfidence: 50,
			challengePreference: 'moderate',
			correctionStyle: 'gentle',
			dailyGoalSeconds: 30,
			...initialPreferences
		},
		createdAt: new Date(),
		lastUpdated: new Date()
	};

	cookies.set(COOKIE_NAME, JSON.stringify(sessionData), COOKIE_OPTIONS);
	console.log('Created new anonymous session:', sessionId);
	return sessionId;
}

/**
 * Get anonymous session data from cookie
 */
export function getAnonymousSessionData(cookies: Cookies): AnonymousSessionData | null {
	const sessionCookie = cookies.get(COOKIE_NAME);

	if (!sessionCookie) {
		return null;
	}

	try {
		const sessionData = JSON.parse(sessionCookie) as AnonymousSessionData;

		// Ensure dates are properly parsed
		sessionData.createdAt = new Date(sessionData.createdAt);
		sessionData.lastUpdated = new Date(sessionData.lastUpdated);

		return sessionData;
	} catch (error) {
		console.error('Failed to parse session cookie:', error);
		return null;
	}
}

/**
 * Update anonymous session preferences
 */
export function updateAnonymousSessionPreferences(
	cookies: Cookies,
	updates: Partial<UserPreferences>
): AnonymousSessionData | null {
	const currentSession = getAnonymousSessionData(cookies);

	if (!currentSession) {
		console.warn('No anonymous session found to update');
		return null;
	}

	const updatedSession: AnonymousSessionData = {
		...currentSession,
		preferences: {
			...currentSession.preferences,
			...updates
		},
		lastUpdated: new Date()
	};

	cookies.set(COOKIE_NAME, JSON.stringify(updatedSession), COOKIE_OPTIONS);
	console.log('Updated anonymous session:', currentSession.sessionId);
	return updatedSession;
}

/**
 * Save anonymous session preferences to database when user signs up
 */
export async function persistAnonymousSessionToDatabase(
	sessionData: AnonymousSessionData,
	userId: string
): Promise<void> {
	try {
		const prefsData = {
			userId,
			targetLanguageId: sessionData.preferences.targetLanguageId || 'en',
			learningGoal: sessionData.preferences.learningGoal || 'Connection',
			speakingLevel: sessionData.preferences.speakingLevel || 5,
			listeningLevel: sessionData.preferences.listeningLevel || 5,
			readingLevel: sessionData.preferences.readingLevel || 5,
			writingLevel: sessionData.preferences.writingLevel || 5,
			speakingConfidence: sessionData.preferences.speakingConfidence || 50,
			specificGoals: sessionData.preferences.specificGoals || [],
			challengePreference: sessionData.preferences.challengePreference || 'moderate',
			correctionStyle: sessionData.preferences.correctionStyle || 'gentle',
			dailyGoalSeconds: sessionData.preferences.dailyGoalSeconds || 30
		};

		await userPreferencesRepository.upsertPreferences(prefsData);

		// Note: Cookie clearing should be done by the caller after successful persistence

		console.log('Anonymous session data persisted to database for user:', userId);
	} catch (error) {
		console.error('Failed to persist anonymous session to database:', error);
		throw error;
	}
}

/**
 * Load user preferences from database
 */
export async function loadUserPreferences(userId: string): Promise<UserPreferences | null> {
	try {
		return await userPreferencesRepository.getPreferencesByUserId(userId);
	} catch (error) {
		console.error('Failed to load user preferences:', error);
		throw error;
	}
}

/**
 * Clear anonymous session data
 */
export function clearAnonymousSession(cookies: Cookies): void {
	cookies.delete(COOKIE_NAME, { path: '/' });
	console.log('Anonymous session cleared');
}

/**
 * Check if anonymous session exists and is valid
 */
export function isValidAnonymousSession(sessionData: AnonymousSessionData | null): boolean {
	if (!sessionData) return false;

	// Check if session is not too old (30 days)
	const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
	return sessionData.createdAt > thirtyDaysAgo;
}

/**
 * Get or create anonymous session
 */
export function getOrCreateAnonymousSession(
	cookies: Cookies,
	initialPreferences?: Partial<UserPreferences>
): AnonymousSessionData {
	const existingSession = getAnonymousSessionData(cookies);

	if (existingSession && isValidAnonymousSession(existingSession)) {
		return existingSession;
	}

	createAnonymousSession(cookies, initialPreferences);
	const session = getAnonymousSessionData(cookies);
	if (!session) {
		throw new Error('Failed to create anonymous session');
	}
	return session;
}

/**
 * Format user preferences for display
 */
export function formatUserPreferencesForDisplay(preferences: UserPreferences): {
	skillLevels: { speaking: number; listening: number; confidence: number };
	goals: { main: string; specific: string[] };
	preferences: { challenge: string; corrections: string; dailyMinutes: number };
} {
	return {
		skillLevels: {
			speaking: preferences.speakingLevel,
			listening: preferences.listeningLevel,
			confidence: preferences.speakingConfidence
		},
		goals: {
			main: preferences.learningGoal,
			specific: Array.isArray(preferences.specificGoals) ? preferences.specificGoals : []
		},
		preferences: {
			challenge: preferences.challengePreference,
			corrections: preferences.correctionStyle,
			dailyMinutes: preferences.dailyGoalSeconds
		}
	};
}

export default {
	createAnonymousSession,
	getAnonymousSessionData,
	updateAnonymousSessionPreferences,
	persistAnonymousSessionToDatabase,
	loadUserPreferences,
	clearAnonymousSession,
	isValidAnonymousSession,
	getOrCreateAnonymousSession,
	formatUserPreferencesForDisplay
};
