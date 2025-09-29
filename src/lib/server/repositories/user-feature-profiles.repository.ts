import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { userFeatureProfiles } from '$lib/server/db/schema/user-feature-profiles';
import type { UserFeatureProfile } from '$lib/server/db/types';

export type UserFeatureProfileUpsert = Partial<Omit<UserFeatureProfile, 'createdAt' | 'updatedAt'>> & {
	userId: string;
	featureId: string;
};

export class UserFeatureProfilesRepository {
	async getProfile(userId: string, featureId: string): Promise<UserFeatureProfile | null> {
		const result = await db
			.select()
			.from(userFeatureProfiles)
			.where(and(eq(userFeatureProfiles.userId, userId), eq(userFeatureProfiles.featureId, featureId)))
			.limit(1);
		return result[0] ?? null;
	}

	async listProfilesForUser(userId: string, languageId?: string | null): Promise<UserFeatureProfile[]> {
		const conditions = [eq(userFeatureProfiles.userId, userId)];
		if (languageId) {
			conditions.push(eq(userFeatureProfiles.languageId, languageId));
		}

		return await db
			.select()
			.from(userFeatureProfiles)
			.where(and(...conditions))
			.orderBy(userFeatureProfiles.reviewPriority);
	}

	async upsertProfile(payload: UserFeatureProfileUpsert): Promise<UserFeatureProfile> {
		const existing = await this.getProfile(payload.userId, payload.featureId);

		if (existing) {
			const [updated] = await db
				.update(userFeatureProfiles)
				.set({
					occurrenceCount: payload.occurrenceCount ?? existing.occurrenceCount,
					cleanRunCount: payload.cleanRunCount ?? existing.cleanRunCount,
					masteryScore: payload.masteryScore ?? existing.masteryScore,
					reviewPriority: payload.reviewPriority ?? existing.reviewPriority,
					streakLength: payload.streakLength ?? existing.streakLength,
					lastSeenAt: payload.lastSeenAt ?? existing.lastSeenAt,
					lastMasteredAt: payload.lastMasteredAt ?? existing.lastMasteredAt,
					metadata: payload.metadata ?? existing.metadata,
					languageId: payload.languageId ?? existing.languageId
				})
				.where(and(eq(userFeatureProfiles.userId, payload.userId), eq(userFeatureProfiles.featureId, payload.featureId)))
				.returning();
			return updated ?? existing;
		}

		const [created] = await db
			.insert(userFeatureProfiles)
			.values({
				userId: payload.userId,
				featureId: payload.featureId,
				languageId: payload.languageId ?? null,
				occurrenceCount: payload.occurrenceCount ?? 0,
				cleanRunCount: payload.cleanRunCount ?? 0,
				streakLength: payload.streakLength ?? 0,
				masteryScore: payload.masteryScore ?? '0',
				reviewPriority: payload.reviewPriority ?? '1',
				lastSeenAt: payload.lastSeenAt ?? null,
				lastMasteredAt: payload.lastMasteredAt ?? null,
				metadata: payload.metadata ?? {}
			})
			.returning();
		return created;
	}
}

export const userFeatureProfilesRepository = new UserFeatureProfilesRepository();
