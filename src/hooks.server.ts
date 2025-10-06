// src/hooks.server.ts

import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { error } from '@sveltejs/kit';
import { paraglideMiddleware } from '$lib/paraglide/server';
import * as auth from '$lib/server/auth';
import { nanoid } from 'nanoid';
import { userRepository } from '$lib/server/repositories';
import { ensureStripeCustomer } from '$lib/server/services/payment.service';

// 🔒 Security Headers Handle - CSP and Security Headers
const handleSecurityHeaders: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);

	// Content Security Policy - Secure but allows furigana HTML
	const cspDirectives = [
		"default-src 'self'",
		"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://app.posthog.com https://us-assets.i.posthog.com", // Allow Stripe, PostHog
		"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", // Allow inline styles for components, Google Fonts
		"font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com", // Google Fonts
		"img-src 'self' data: https: blob:", // Allow images from various sources
		"connect-src 'self' https://api.stripe.com https://api.openai.com wss://realtime.api.openai.com https://app.posthog.com https://us.i.posthog.com https://us-assets.i.posthog.com", // API connections
		"media-src 'self' blob: data:", // Audio/video from blob URLs and data
		"object-src 'none'", // Block Flash/Java objects
		"frame-src 'self' https://js.stripe.com https://hooks.stripe.com", // Allow Stripe frames
		"frame-ancestors 'none'", // Prevent embedding in frames
		"base-uri 'self'", // Restrict base tag
		"form-action 'self' https://api.stripe.com", // Allow form submissions to Stripe
		'upgrade-insecure-requests', // Force HTTPS in production
		`report-uri ${dev ? '' : '/api/csp-report'}` // CSP violation reporting
	].filter(Boolean);

	// Apply security headers
	const securityHeaders = {
		'Content-Security-Policy': cspDirectives.join('; '),
		'X-Frame-Options': 'DENY',
		'X-Content-Type-Options': 'nosniff',
		'Referrer-Policy': 'strict-origin-when-cross-origin',
		'Permissions-Policy': 'geolocation=(), microphone=(self), camera=(), payment=()',
		...(dev
			? {}
			: {
					'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
				})
	};

	// Set security headers
	Object.entries(securityHeaders).forEach(([key, value]) => {
		response.headers.set(key, value);
	});

	return response;
};

const handleDevRoutes: Handle = async ({ event, resolve }) => {
	// Block access to dev routes in production
	if (event.url.pathname.startsWith('/dev') || event.url.pathname.startsWith('/api/dev')) {
		if (!dev) {
			throw error(404, 'Not found');
		}
	}
	return resolve(event);
};

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;
		return resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale)
		});
	});

const handleAuth: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get(auth.sessionCookieName);
	if (!sessionToken) {
		event.locals.user = null;
		event.locals.session = null;
	} else {
		// validateSessionToken returns a partial user object
		const { session, user } = await auth.validateSessionToken(sessionToken);
		if (session) {
			auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
		} else {
			auth.deleteSessionTokenCookie(event);
		}
		event.locals.user = user;
		event.locals.session = session;
	}

	if (!event.locals.user) {
		let guestId = event.cookies.get('guest-id');
		if (!guestId) {
			guestId = nanoid();
			event.cookies.set('guest-id', guestId, { path: '/', maxAge: 60 * 60 * 24 * 30 });
		}
		event.locals.guestId = guestId;
	}

	return resolve(event);
};

const userSetup: Handle = async ({ event, resolve }) => {
	if (event.locals.user) {
		try {
			// Fetch the complete user object using the repository
			const fullUser = await userRepository.findUserById(event.locals.user.id);
			event.locals.user = fullUser || null;

			// Ensure user has Stripe customer ID (auto-create if missing)
			if (fullUser && !fullUser.stripeCustomerId) {
				console.log(`🔧 Auto-creating Stripe customer for user ${fullUser.id}`);
				const stripeCustomerId = await ensureStripeCustomer(fullUser.id, fullUser.email);
				if (stripeCustomerId) {
					// Update the user object with the new Stripe customer ID
					const updatedUser = await userRepository.findUserById(fullUser.id);
					event.locals.user = updatedUser || fullUser;
					console.log(`✅ Created Stripe customer ${stripeCustomerId} for user ${fullUser.id}`);
				}
			}
		} catch (error) {
			console.error('Error in userSetup:', error);
			event.locals.user = null;
		}
	}
	return resolve(event);
};

// Sequence the handles in the correct order
export const handle: Handle = sequence(
	handleDevRoutes,
	handleParaglide,
	handleAuth,
	userSetup,
	handleSecurityHeaders
);
