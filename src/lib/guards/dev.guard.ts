// 🔒 Development Route Guard
// Prevents dev routes from loading in production

import { dev } from '$app/environment';
import { error } from '@sveltejs/kit';

/**
 * Guard function to protect development routes
 * Throws 404 error if not in development mode
 */
export function guardDevelopmentRoute(): void {
	if (!dev) {
		throw error(404, 'Not found');
	}
}

/**
 * Guard function for development API endpoints
 * Returns early with 404 if not in development mode
 */
export function guardDevelopmentAPI(isDev: boolean = dev): void {
	if (!isDev) {
		throw error(404, 'Not found');
	}
}