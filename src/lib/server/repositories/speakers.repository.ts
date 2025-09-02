import { eq, and, desc, asc, sql, count } from 'drizzle-orm';
import { db } from '$lib/server/db/index';
import { speakers } from '$lib/server/db/schema';
import type { NewSpeaker, Speaker } from '$lib/server/db/types';

export class SpeakersRepository {
	/**
	 * Create a new speaker
	 */
	async createSpeaker(speaker: NewSpeaker): Promise<Speaker> {
		const [created] = await db.insert(speakers).values(speaker).returning();
		return created;
	}

	/**
	 * Get a speaker by ID
	 */
	async getSpeakerById(id: string): Promise<Speaker | null> {
		const result = await db.select().from(speakers).where(eq(speakers.id, id)).limit(1);
		return result[0] || null;
	}

	/**
	 * Get all speakers for a language
	 */
	async getSpeakersByLanguage(languageId: string): Promise<Speaker[]> {
		return await db
			.select()
			.from(speakers)
			.where(eq(speakers.languageId, languageId))
			.orderBy(asc(speakers.voiceName));
	}

	/**
	 * Get active speakers for a language
	 */
	async getActiveSpeakersByLanguage(languageId: string): Promise<Speaker[]> {
		return await db
			.select()
			.from(speakers)
			.where(and(eq(speakers.languageId, languageId), eq(speakers.isActive, true)))
			.orderBy(asc(speakers.voiceName));
	}

	/**
	 * Get speakers by gender for a language
	 */
	async getSpeakersByGender(languageId: string, gender: 'male' | 'female'): Promise<Speaker[]> {
		return await db
			.select()
			.from(speakers)
			.where(
				and(
					eq(speakers.languageId, languageId),
					eq(speakers.gender, gender),
					eq(speakers.isActive, true)
				)
			)
			.orderBy(asc(speakers.voiceName));
	}

	/**
	 * Get speakers by region
	 */
	async getSpeakersByRegion(region: string): Promise<Speaker[]> {
		return await db
			.select()
			.from(speakers)
			.where(and(eq(speakers.region, region), eq(speakers.isActive, true)))
			.orderBy(asc(speakers.voiceName));
	}

	/**
	 * Get speaker by voice provider ID
	 */
	async getSpeakerByVoiceProviderId(voiceProviderId: string): Promise<Speaker | null> {
		const result = await db
			.select()
			.from(speakers)
			.where(eq(speakers.voiceProviderId, voiceProviderId))
			.limit(1);
		return result[0] || null;
	}

	/**
	 * Get speaker by OpenAI voice ID
	 */
	async getSpeakerByOpenaiVoiceId(openaiVoiceId: string): Promise<Speaker | null> {
		const result = await db
			.select()
			.from(speakers)
			.where(eq(speakers.openaiVoiceId, openaiVoiceId))
			.limit(1);
		return result[0] || null;
	}

	/**
	 * Get all active speakers
	 */
	async getAllActiveSpeakers(): Promise<Speaker[]> {
		return await db
			.select()
			.from(speakers)
			.where(eq(speakers.isActive, true))
			.orderBy(asc(speakers.languageId), asc(speakers.voiceName));
	}

	/**
	 * Update a speaker
	 */
	async updateSpeaker(id: string, updates: Partial<NewSpeaker>): Promise<Speaker | null> {
		const [updated] = await db.update(speakers).set(updates).where(eq(speakers.id, id)).returning();
		return updated || null;
	}

	/**
	 * Activate/deactivate a speaker
	 */
	async setSpeakerActive(id: string, isActive: boolean): Promise<Speaker | null> {
		const [updated] = await db
			.update(speakers)
			.set({ isActive })
			.where(eq(speakers.id, id))
			.returning();
		return updated || null;
	}

	/**
	 * Delete a speaker
	 */
	async deleteSpeaker(id: string): Promise<boolean> {
		const result = await db
			.delete(speakers)
			.where(eq(speakers.id, id))
			.returning({ id: speakers.id });
		return result.length > 0;
	}

	/**
	 * Get speaker count by language
	 */
	async getSpeakerCountByLanguage(languageId: string): Promise<number> {
		const result = await db
			.select({ count: count() })
			.from(speakers)
			.where(eq(speakers.languageId, languageId));
		return Number(result[0]?.count) || 0;
	}

	/**
	 * Get active speaker count by language
	 */
	async getActiveSpeakerCountByLanguage(languageId: string): Promise<number> {
		const result = await db
			.select({ count: count() })
			.from(speakers)
			.where(and(eq(speakers.languageId, languageId), eq(speakers.isActive, true)));
		return Number(result[0]?.count) || 0;
	}

	/**
	 * Search speakers by voice name
	 */
	async searchSpeakersByVoiceName(
		languageId: string,
		searchTerm: string,
		limit: number = 20
	): Promise<Speaker[]> {
		return await db
			.select()
			.from(speakers)
			.where(
				and(
					eq(speakers.languageId, languageId),
					eq(speakers.isActive, true),
					sql`${speakers.voiceName} ILIKE ${`%${searchTerm}%`}`
				)
			)
			.orderBy(asc(speakers.voiceName))
			.limit(limit);
	}

	/**
	 * Get speakers by BCP47 code
	 */
	async getSpeakersByBcp47Code(bcp47Code: string): Promise<Speaker[]> {
		return await db
			.select()
			.from(speakers)
			.where(and(eq(speakers.bcp47Code, bcp47Code), eq(speakers.isActive, true)))
			.orderBy(asc(speakers.voiceName));
	}
}

// Export singleton instance
export const speakersRepository = new SpeakersRepository();
