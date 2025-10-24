// routes/auth/+page.server.ts
import { fail, redirect } from '@sveltejs/kit';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeHexLowerCase } from '@oslojs/encoding';
import { dev } from '$app/environment';
import { userRepository } from '$lib/server/repositories/user.repository';
import { createSession, setSessionTokenCookie, findOrCreateUser } from '$lib/server/auth';
import { EmailVerificationService } from '$lib/server/services/email-verification.service';

const emailAuthEnabled = dev;

export async function load(event) {
	if (event.locals.session !== null && event.locals.user !== null) {
		return redirect(302, '/');
	}

	// Get query parameters for assessment flow
	const action = event.url.searchParams.get('action');
	const from = event.url.searchParams.get('from');
	const newsletter = event.url.searchParams.get('newsletter') === 'true';

	return {
		action,
		from,
		newsletter,
		title: action === 'create_account' ? 'Create Account - Kaiwa' : 'Login - Kaiwa',
		description: 'Login or create account to save your learning progress'
	};
}

export const actions = {
	signup: async (event) => {
		if (!emailAuthEnabled) {
			return fail(400, {
				message: 'Email & password sign-in is temporarily unavailable. Please continue with Google.'
			});
		}

		const formData = await event.request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		const redirectUrl = event.url.searchParams.get('redirect');

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

		// For new users, send email verification
		if (isNew) {
			const verificationResult = await EmailVerificationService.createAndSendVerificationCode(
				user.id,
				email
			);

			if (!verificationResult.success) {
				return fail(500, {
					message: 'Failed to send verification email. Please try again.'
				});
			}
		}

		const { session, token } = await createSession(user.id);
		setSessionTokenCookie(event, token, session.expiresAt);

		// Redirect to verification page for new users, custom redirect or home for existing users
		if (isNew) {
			throw redirect(302, '/auth/verify-email');
		}

		throw redirect(302, redirectUrl || '/');
	},

	login: async (event) => {
		if (!emailAuthEnabled) {
			return fail(400, {
				message: 'Email & password sign-in is temporarily unavailable. Please continue with Google.'
			});
		}

		const formData = await event.request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		const redirectUrl = event.url.searchParams.get('redirect');

		const user = await userRepository.findUserByEmail(email);

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

		// Check if email is verified
		if (!user.emailVerified) {
			// Send verification email if not already sent recently
			const hasPending = await EmailVerificationService.hasPendingVerification(user.id);
			if (!hasPending) {
				await EmailVerificationService.createAndSendVerificationCode(
					user.id,
					user.email,
					user.displayName || undefined
				);
			}

			const { session, token } = await createSession(user.id);
			setSessionTokenCookie(event, token, session.expiresAt);

			throw redirect(302, '/auth/verify-email');
		}

		const { session, token } = await createSession(user.id);
		setSessionTokenCookie(event, token, session.expiresAt);

		throw redirect(302, redirectUrl || '/');
	}
};
