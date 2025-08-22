import { sequence } from '@sveltejs/kit/hooks';

import type { Handle } from '@sveltejs/kit';
import { paraglideMiddleware } from '$lib/paraglide/server';

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;

		return resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale)
		});
	});

const handleAuth: Handle = async ({ event, resolve }) => {
	// Temporarily disable all auth/database operations
	event.locals.user = null;
	event.locals.session = null;
	event.locals.userContext = null;
	return resolve(event);
};

export const handle: Handle = sequence(handleParaglide, handleAuth);
