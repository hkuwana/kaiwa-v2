import type { RequestEvent } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase64url, encodeHexLowerCase } from '@oslojs/encoding';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema/index';

const DAY_IN_MS = 1000 * 60 * 60 * 24;

export const sessionCookieName = 'auth-session';

export function generateSessionToken() {
	const bytes = crypto.getRandomValues(new Uint8Array(18));
	const token = encodeBase64url(bytes);

	return token;
}

export async function createSession(token: string, userId: string) {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

	const session: table.Session = {
		id: sessionId,
		userId,
		expiresAt: new Date(Date.now() + DAY_IN_MS * 30)
	};

	await db.insert(table.session).values(session);
	return session;
}

export async function validateSessionToken(token: string) {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

	const [result] = await db
		.select({
			// Enhanced user data for orchestrator and kernel
			user: {
				id: table.users.id,
				displayName: table.users.displayName,
				username: table.users.username,
				email: table.users.email,
				avatarUrl: table.users.avatarUrl,
				nativeLanguageId: table.users.nativeLanguageId,
				preferredUILanguageId: table.users.preferredUILanguageId,
				tier: table.users.tier,
				subscriptionStatus: table.users.subscriptionStatus,
				subscriptionExpiresAt: table.users.subscriptionExpiresAt,
				createdAt: table.users.createdAt,
				lastUsage: table.users.lastUsage
			},
			session: table.session
		})
		.from(table.session)
		.innerJoin(table.users, eq(table.session.userId, table.users.id))
		.where(eq(table.session.id, sessionId));

	if (!result) {
		return { session: null, user: null };
	}

	const { session, user } = result;
	const sessionExpired = Date.now() >= session.expiresAt.getTime();

	if (sessionExpired) {
		await db.delete(table.session).where(eq(table.session.id, session.id));
		return { session: null, user: null };
	}

	const renewSession = Date.now() >= session.expiresAt.getTime() - DAY_IN_MS * 15;

	if (renewSession) {
		session.expiresAt = new Date(Date.now() + DAY_IN_MS * 30);
		await db
			.update(table.session)
			.set({ expiresAt: session.expiresAt })
			.where(eq(table.session.id, session.id));
	}

	return { session, user };
}

// Enhanced function to get full user context including tier limits and usage
export async function getUserContext(userId: string) {
	try {
		// Get user with tier information
		const [userResult] = await db
			.select({
				user: table.users,
				tier: table.tiers
			})
			.from(table.users)
			.leftJoin(table.tiers, eq(table.users.tier, table.tiers.id))
			.where(eq(table.users.id, userId))
			.limit(1);

		if (!userResult) return null;

		// Get current usage for this month
		const now = new Date();
		const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
		// const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

		const [usageResult] = await db
			.select()
			.from(table.userUsage)
			.where(eq(table.userUsage.userId, userId) && eq(table.userUsage.periodStart, monthStart))
			.limit(1);

		// Get user's language preferences
		const [nativeLang] = await db
			.select()
			.from(table.languages)
			.where(eq(table.languages.id, userResult.user.nativeLanguageId))
			.limit(1);

		const [preferredLang] = await db
			.select()
			.from(table.languages)
			.where(eq(table.languages.id, userResult.user.preferredUILanguageId))
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

export type SessionValidationResult = Awaited<ReturnType<typeof validateSessionToken>>;
export type UserContext = Awaited<ReturnType<typeof getUserContext>>;

export async function invalidateSession(sessionId: string) {
	await db.delete(table.session).where(eq(table.session.id, sessionId));
}

export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date) {
	event.cookies.set(sessionCookieName, token, { expires: expiresAt, path: '/' });
}

export function deleteSessionTokenCookie(event: RequestEvent) {
	event.cookies.delete(sessionCookieName, { path: '/' });
}
