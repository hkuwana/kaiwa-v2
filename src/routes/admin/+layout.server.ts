import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

/**
 * Admin Access Control Configuration
 *
 * Three ways to grant admin access (checked in order):
 * 1. Email domain whitelist - anyone with @trykaiwa.com gets access
 * 2. Specific email whitelist - named individuals
 * 3. Future: database role field (TODO)
 */

// Domains where ALL users get admin access (your team domain)
const ADMIN_DOMAINS = ['trykaiwa.com', 'kaiwa.app'];

// Specific email addresses with admin access (external collaborators, etc.)
const ADMIN_EMAILS = [
	'hkuwana97@gmail.com'
	// Add more specific emails here as needed
];

/**
 * Check if a user has admin privileges
 */
function isUserAdmin(email: string | null | undefined): boolean {
	if (!email) return false;

	const normalizedEmail = email.toLowerCase().trim();

	// Check 1: Is email from an admin domain?
	const emailDomain = normalizedEmail.split('@')[1];
	if (emailDomain && ADMIN_DOMAINS.includes(emailDomain)) {
		return true;
	}

	// Check 2: Is email in the specific admin list?
	if (ADMIN_EMAILS.some((adminEmail) => adminEmail.toLowerCase() === normalizedEmail)) {
		return true;
	}

	// Future Check 3: Query database for user.role === 'admin'
	// This would require passing the user object and checking user.role

	return false;
}

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const user = locals.user;

	// Must be logged in
	if (!user) {
		throw redirect(303, `/auth?redirect=${encodeURIComponent(url.pathname)}`);
	}

	// Must be an admin
	if (!isUserAdmin(user.email)) {
		console.warn(`[Admin] Access denied for: ${user.email}`);
		throw redirect(303, '/');
	}

	return {
		user,
		isAdmin: true
	};
};
