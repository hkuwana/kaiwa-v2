/**
 * 🍪 Cookie Utilities
 * Provides helper functions for managing user preference cookies
 * Used to persist audio mode, scenario selection, and language preferences
 */

import { browser } from '$app/environment';

/**
 * Cookie names for different preferences
 */
export const COOKIE_NAMES = {
	AUDIO_INPUT_MODE: 'kaiwa_audio_input_mode',
	SELECTED_SCENARIO_ID: 'kaiwa_selected_scenario_id',
	SELECTED_LANGUAGE_ID: 'kaiwa_selected_language_id',
	SELECTED_SPEAKER_ID: 'kaiwa_selected_speaker_id'
};

/**
 * Set a preference cookie
 * @param name - Cookie name
 * @param value - Cookie value
 * @param days - Days until expiration (default: 365)
 */
export function setCookie(name: string, value: string, days: number = 365): void {
	if (!browser) return;

	try {
		const date = new Date();
		date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
		const expires = `expires=${date.toUTCString()}`;
		const path = 'path=/';
		const samesite = 'SameSite=Lax';

		document.cookie = `${name}=${encodeURIComponent(value)}; ${expires}; ${path}; ${samesite}`;
	} catch (error) {
		console.warn(`Failed to set cookie ${name}:`, error);
	}
}

/**
 * Get a preference cookie
 * @param name - Cookie name
 * @returns Cookie value or null if not found
 */
export function getCookie(name: string): string | null {
	if (!browser) return null;

	try {
		const nameEQ = name + '=';
		const cookies = document.cookie.split(';');

		for (let cookie of cookies) {
			cookie = cookie.trim();
			if (cookie.startsWith(nameEQ)) {
				return decodeURIComponent(cookie.substring(nameEQ.length));
			}
		}
	} catch (error) {
		console.warn(`Failed to get cookie ${name}:`, error);
	}

	return null;
}

/**
 * Delete a preference cookie
 * @param name - Cookie name
 */
export function deleteCookie(name: string): void {
	setCookie(name, '', -1);
}

/**
 * Get audio input mode from cookie
 * @returns 'vad' | 'ptt' | null
 */
export function getAudioInputModeFromCookie(): 'vad' | 'ptt' | null {
	const value = getCookie(COOKIE_NAMES.AUDIO_INPUT_MODE);
	if (value === 'vad' || value === 'ptt') {
		return value;
	}
	return null;
}

/**
 * Set audio input mode cookie
 * @param mode - 'vad' or 'ptt'
 */
export function setAudioInputModeCookie(mode: 'vad' | 'ptt'): void {
	setCookie(COOKIE_NAMES.AUDIO_INPUT_MODE, mode, 365);
}

/**
 * Get selected scenario ID from cookie
 */
export function getSelectedScenarioIdFromCookie(): string | null {
	return getCookie(COOKIE_NAMES.SELECTED_SCENARIO_ID);
}

/**
 * Set selected scenario ID cookie
 */
export function setSelectedScenarioIdCookie(scenarioId: string): void {
	setCookie(COOKIE_NAMES.SELECTED_SCENARIO_ID, scenarioId, 365);
}

/**
 * Get selected language ID from cookie
 */
export function getSelectedLanguageIdFromCookie(): string | null {
	return getCookie(COOKIE_NAMES.SELECTED_LANGUAGE_ID);
}

/**
 * Set selected language ID cookie
 */
export function setSelectedLanguageIdCookie(languageId: string): void {
	setCookie(COOKIE_NAMES.SELECTED_LANGUAGE_ID, languageId, 365);
}

/**
 * Get selected speaker ID from cookie
 */
export function getSelectedSpeakerIdFromCookie(): string | null {
	return getCookie(COOKIE_NAMES.SELECTED_SPEAKER_ID);
}

/**
 * Set selected speaker ID cookie
 */
export function setSelectedSpeakerIdCookie(speakerId: string): void {
	setCookie(COOKIE_NAMES.SELECTED_SPEAKER_ID, speakerId, 365);
}

/**
 * Clear all preference cookies
 */
export function clearPreferenceCookies(): void {
	Object.values(COOKIE_NAMES).forEach((name) => deleteCookie(name));
}
