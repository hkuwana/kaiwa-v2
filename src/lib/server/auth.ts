import type { RequestEvent } from '@sveltejs/kit';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase64url, encodeHexLowerCase } from '@oslojs/encoding';
import type { Session } from './db/types';
import { sessionRepository, type SessionRepository } from './repositories/session.repository';
import { userRepository } from './repositories/user.repository';

const DAY_IN_MS = 1000 * 60 * 60 * 24;

export const sessionCookieName = 'auth-session';

export function generateSessionToken() {
	const bytes = crypto.getRandomValues(new Uint8Array(18));
	const token = encodeBase64url(bytes);

	return token;
}

export async function createSession(
	userId: string,
	repository: SessionRepository = sessionRepository
) {
	const token = generateSessionToken();
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

	const sessionData: Session = {
		id: sessionId,
		userId,
		expiresAt: new Date(Date.now() + DAY_IN_MS * 30)
	};

	const session = await repository.createSession(sessionData);
	return { session, token };
}

export async function validateSessionToken(token: string) {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

	const result = await sessionRepository.findSessionAndUser(sessionId);

	if (!result) {
		return { session: null, user: null };
	}

	const { session, user } = result;
	const sessionExpired = Date.now() >= session.expiresAt.getTime();

	if (sessionExpired) {
		await sessionRepository.deleteSession(session.id);
		return { session: null, user: null };
	}

	const renewSession = Date.now() >= session.expiresAt.getTime() - DAY_IN_MS * 15;

	if (renewSession) {
		session.expiresAt = new Date(Date.now() + DAY_IN_MS * 30);
		await sessionRepository.extendSession(session.id, session.expiresAt);
	}

	return { session, user };
}

export type SessionValidationResult = Awaited<ReturnType<typeof validateSessionToken>>;

/**
 * Get user ID from session cookie in request
 */
export async function getUserFromSession(cookies: {
	get: (name: string) => string | undefined;
}): Promise<string | null> {
	const sessionToken = cookies.get(sessionCookieName);
	if (!sessionToken) {
		return null;
	}

	const { user } = await validateSessionToken(sessionToken);
	return user?.id || null;
}

export async function invalidateSession(sessionId: string) {
	await sessionRepository.deleteSession(sessionId);
}

export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date) {
	const isProduction = process.env.NODE_ENV === 'production';
	event.cookies.set(sessionCookieName, token, {
		path: '/',
		expires: expiresAt,
		httpOnly: true,
		sameSite: 'lax',
		secure: isProduction
	});
}

export function deleteSessionTokenCookie(event: RequestEvent) {
	const isProduction = process.env.NODE_ENV === 'production';
	event.cookies.set(sessionCookieName, '', {
		path: '/',
		expires: new Date(0),
		httpOnly: true,
		sameSite: 'lax',
		secure: isProduction
	});
}

/**
 * Find or create a user, handling both email/password and OAuth accounts
 * This prevents duplicate email constraint violations by linking accounts
 */
export async function findOrCreateUser({
	email,
	googleId,
	displayName,
	avatarUrl,
	hashedPassword
}: {
	email: string;
	googleId?: string;
	displayName?: string;
	avatarUrl?: string;
	hashedPassword?: string;
}) {
	// First, check if user exists by Google ID
	if (googleId) {
		const existingUserByGoogleId = await userRepository.findUserByGoogleId(googleId);

		if (existingUserByGoogleId) {
			return { user: existingUserByGoogleId, isNew: false };
		}
	}

	// Check if user exists by email
	const existingUserByEmail = await userRepository.findUserByEmail(email);

	if (existingUserByEmail) {
		// Link the missing authentication method to existing user
		const updateData: Partial<any> = {};

		if (googleId && !existingUserByEmail.googleId) {
			updateData.googleId = googleId;
			updateData.displayName = displayName;
			updateData.avatarUrl = avatarUrl;
		}

		if (hashedPassword && !existingUserByEmail.hashedPassword) {
			updateData.hashedPassword = hashedPassword;
		}

		if (Object.keys(updateData).length > 0) {
			await userRepository.updateUser(existingUserByEmail.id, updateData);
		}

		return { user: existingUserByEmail, isNew: false };
	}

	// Create new user
	const userId = crypto.randomUUID();
	const newUser = await userRepository.createUser({
		id: userId,
		email,
		googleId,
		displayName,
		avatarUrl,
		hashedPassword,
		// For OAuth users (Google), mark email as verified since Google already verified it
		emailVerified: googleId ? new Date() : null
	});

	return { user: newUser, isNew: true };
}
