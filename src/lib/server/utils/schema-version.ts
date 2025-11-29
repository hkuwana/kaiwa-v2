// src/lib/server/utils/schema-version.ts

/**
 * Schema Version Tracker
 *
 * This module tracks database schema versions and helps manage
 * cookie/session invalidation when breaking changes occur.
 *
 * **When to increment:**
 * - Adding new enum types that affect serialization
 * - Changing type structure that affects cookies/sessions
 * - Database schema changes that affect cached data
 *
 * **How it works:**
 * - Version is stored in a cookie
 * - If cookie version doesn't match, clear all cookies
 * - Prevents deserialization errors from crashing the app
 */

// Increment this whenever you make schema changes that could break cookies
export const CURRENT_SCHEMA_VERSION = 2; // v2: Added learning path tables and types

export const SCHEMA_VERSION_COOKIE_NAME = 'schema_version';

/**
 * Check if the client's schema version matches the current version
 */
export function isSchemaVersionCurrent(clientVersion: string | undefined): boolean {
	if (!clientVersion) return false;
	return parseInt(clientVersion, 10) === CURRENT_SCHEMA_VERSION;
}

/**
 * Get schema version from request cookies
 */
export function getSchemaVersionFromCookies(cookies: {
	get: (name: string) => string | undefined;
}): string | undefined {
	return cookies.get(SCHEMA_VERSION_COOKIE_NAME);
}

/**
 * Set current schema version in response cookies
 */
export function setSchemaVersionCookie(cookies: {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	set: (name: string, value: string, options?: any) => void;
}): void {
	cookies.set(SCHEMA_VERSION_COOKIE_NAME, CURRENT_SCHEMA_VERSION.toString(), {
		path: '/',
		maxAge: 60 * 60 * 24 * 365, // 1 year
		sameSite: 'lax',
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production'
	});
}

/**
 * Clear all cookies (for migration/cleanup)
 */
export function clearAllCookies(cookies: {
	getAll: () => Array<{ name: string }>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	delete: (name: string, options?: any) => void;
}): void {
	const allCookies = cookies.getAll();
	allCookies.forEach((cookie) => {
		cookies.delete(cookie.name, { path: '/' });
	});
}
