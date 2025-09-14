// src/hooks.server.ts

import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';
import { paraglideMiddleware } from '$lib/paraglide/server';
import * as auth from '$lib/server/auth';
import { nanoid } from 'nanoid';
import { userRepository } from '$lib/server/repositories';
import { ensureStripeCustomer } from '$lib/server/services/payment.service';

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
export const handle: Handle = sequence(handleParaglide, handleAuth, userSetup);
