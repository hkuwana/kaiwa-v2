// routes/auth/+page.server.ts
import { fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeHexLowerCase } from '@oslojs/encoding';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { createSession, setSessionTokenCookie, findOrCreateUser } from '$lib/server/auth';

export async function load(event) {
	if (event.locals.session !== null && event.locals.user !== null) {
		return redirect(302, '/');
	}

	// Get query parameters for assessment flow
	const action = event.url.searchParams.get('action');
	const from = event.url.searchParams.get('from');

	return {
		action,
		from,
		title: action === 'create_account' ? 'Create Account - Kaiwa' : 'Login - Kaiwa',
		description: 'Login or create account to save your learning progress'
	};
}

export const actions = {
	signup: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		const hashedPassword = encodeHexLowerCase(sha256(new TextEncoder().encode(password)));

		const { user, isNew } = await findOrCreateUser({
			email,
			hashedPassword
		});

		if (!isNew && user.hashedPassword) {
			// User already exists with password
			return fail(400, {
				message: 'An account with this email already exists'
			});
		}

		const { session, token } = await createSession(user.id);
		setSessionTokenCookie(event, token, session.expiresAt);

		// TODO: Here you would save the pending assessment data to the user's profile
		// if it exists in localStorage (this would need to be passed from the client)

		throw redirect(302, '/');
	},

	login: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		const user = await db.query.users.findFirst({
			where: and(eq(table.users.email, email))
		});

		if (!user || !user.hashedPassword) {
			return fail(400, {
				message: 'Incorrect email or password'
			});
		}

		const hashedPassword = encodeHexLowerCase(sha256(new TextEncoder().encode(password)));
		if (user.hashedPassword !== hashedPassword) {
			return fail(400, {
				message: 'Incorrect email or password'
			});
		}

		const { session, token } = await createSession(user.id);
		setSessionTokenCookie(event, token, session.expiresAt);

		throw redirect(302, '/');
	}
};
