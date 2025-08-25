import type { RequestEvent } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase64url, encodeHexLowerCase } from '@oslojs/encoding';
import { db } from './db';
import { session as sessionTable } from './db/schema';
import type { Session } from './db/types';
import { users } from './db/schema';
// import { userUsage } from './db/schema'; // Not available in MVP schema
// import { languages } from './db/schema'; // Not used in MVP version
// import { tiers } from './db/schema'; // Not used in MVP version

const DAY_IN_MS = 1000 * 60 * 60 * 24;

export const sessionCookieName = 'auth-session';

export function generateSessionToken() {
	const bytes = crypto.getRandomValues(new Uint8Array(18));
	const token = encodeBase64url(bytes);

	return token;
}

export async function createSession(token: string, userId: string) {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

	const sessionData: Session = {
		id: sessionId,
		userId,
		expiresAt: new Date(Date.now() + DAY_IN_MS * 30)
	};

	await db.insert(sessionTable).values(sessionData);
	return sessionData;
}

export async function validateSessionToken(token: string) {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

	const [result] = await db
		.select({
			// Enhanced user data for orchestrator and kernel
			user: {
				id: users.id,
				displayName: users.displayName,
				username: users.username,
				email: users.email,
				avatarUrl: users.avatarUrl,
				nativeLanguageId: users.nativeLanguageId,
				preferredUILanguageId: users.preferredUILanguageId,
				// tier: users.tier, // Not available in MVP schema
				// subscriptionStatus: users.subscriptionStatus, // Not available in MVP schema
				// subscriptionExpiresAt: users.subscriptionExpiresAt, // Not available in MVP schema
				createdAt: users.createdAt,
				lastUsage: users.lastUsage
			},
			session: sessionTable
		})
		.from(sessionTable)
		.innerJoin(users, eq(sessionTable.userId, users.id))
		.where(eq(sessionTable.id, sessionId));

	if (!result) {
		return { session: null, user: null };
	}

	const { session, user } = result;
	const sessionExpired = Date.now() >= session.expiresAt.getTime();

	if (sessionExpired) {
		await db.delete(sessionTable).where(eq(sessionTable.id, session.id));
		return { session: null, user: null };
	}

	const renewSession = Date.now() >= session.expiresAt.getTime() - DAY_IN_MS * 15;

	if (renewSession) {
		session.expiresAt = new Date(Date.now() + DAY_IN_MS * 30);
		await db
			.update(sessionTable)
			.set({ expiresAt: session.expiresAt })
			.where(eq(sessionTable.id, session.id));
	}

	return { session, user };
}

// Enhanced function to get full user context including tier limits and usage
// DISABLED in MVP - tier and userUsage fields not available in current schema
/*
export async function getUserContext(userId: string) {
	try {
		// Get user with tier information
		const [userResult] = await db
			.select({
				user: users,
				tier: tiers
			})
			.from(users)
			.leftJoin(tiers, eq(users.tier, tiers.id))
			.where(eq(users.id, userId))
			.limit(1);

		if (!userResult) return null;

		// Get current usage for this month
		const now = new Date();
		const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

		const [usageResult] = await db
			.select()
			.from(userUsage)
			.where(eq(userUsage.userId, userId) && eq(userUsage.periodStart, monthStart))
			.limit(1);

		// Get user's language preferences
		const [nativeLang] = await db
			.select()
			.from(languages)
			.where(eq(languages.id, userResult.user.nativeLanguageId))
			.limit(1);

		const [preferredLang] = await db
			.select()
			.from(languages)
			.where(eq(languages.id, userResult.user.preferredUILanguageId))
			.limit(1);

		return {
			user: userResult.user,
			tier: userResult.tier,
			usage: usageResult || {
				conversationsUsed: 0,
				minutesUsed: 0,
				realtimeSessionsUsed: 0
			},
			languages: {
				native: nativeLang,
				preferred: preferredLang
			},
			limits: {
				conversationsRemaining:
					(userResult.tier?.monthlyConversations || 10) - (usageResult?.conversationsUsed || 0),
				minutesRemaining: (userResult.tier?.monthlyMinutes || 60) - (usageResult?.minutesUsed || 0),
				realtimeSessionsRemaining:
					(userResult.tier?.monthlyRealtimeSessions || 0) -
					(usageResult?.realtimeSessionsUsed || 0),
				hasRealtimeAccess: userResult.tier?.hasRealtimeAccess || false,
				hasAdvancedVoices: userResult.tier?.hasAdvancedVoices || false,
				hasAnalytics: userResult.tier?.hasAnalytics || false
			}
		};
	} catch (error) {
		console.error('Error getting user context:', error);
		return null;
	}
}
*/

export type SessionValidationResult = Awaited<ReturnType<typeof validateSessionToken>>;
// export type UserContext = Awaited<ReturnType<typeof getUserContext>>; // getUserContext disabled in MVP
export async function invalidateSession(sessionId: string) {
	await db.delete(sessionTable).where(eq(sessionTable.id, sessionId));
}

export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date) {
	event.cookies.set(sessionCookieName, token, { expires: expiresAt, path: '/' });
}

export function deleteSessionTokenCookie(event: RequestEvent) {
	event.cookies.delete(sessionCookieName, { path: '/' });
}
