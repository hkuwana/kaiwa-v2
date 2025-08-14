// src/lib/server/repositories/language.repository.ts

import { db } from '$lib/server/db/index';
import { languages, speakers } from '$lib/server/db/schema';
import type { NewLanguage, NewSpeaker, Language, Speaker } from '$lib/server/db/types';
import { eq, and, asc } from 'drizzle-orm';

export const languageRepository = {
	// CREATE
	async createLanguage(newLanguage: NewLanguage): Promise<Language> {
		const [createdLanguage] = await db.insert(languages).values(newLanguage).returning();
		return createdLanguage;
	},

	async createSpeaker(newSpeaker: NewSpeaker): Promise<Speaker> {
		const [createdSpeaker] = await db.insert(speakers).values(newSpeaker).returning();
		return createdSpeaker;
	},

	// READ
	async findLanguageById(id: string): Promise<Language | undefined> {
		return db.query.languages.findFirst({ where: eq(languages.id, id) });
	},

	async findLanguageByCode(code: string): Promise<Language | undefined> {
		return db.query.languages.findFirst({ where: eq(languages.code, code) });
	},

	async findSupportedLanguages(): Promise<Language[]> {
		return db.query.languages.findMany({
			where: eq(languages.isSupported, true),
			orderBy: [asc(languages.name)]
		});
	},

	async findLanguagesByWritingSystem(writingSystem: string): Promise<Language[]> {
		return db.query.languages.findMany({
			where: eq(languages.writingSystem, writingSystem),
			orderBy: [asc(languages.name)]
		});
	},

	async findSpeakerById(id: string): Promise<Speaker | undefined> {
		return db.query.speakers.findFirst({ where: eq(speakers.id, id) });
	},

	async findSpeakersByLanguage(
		languageId: string,
		limit: number = 50,
		offset: number = 0
	): Promise<Speaker[]> {
		return db.query.speakers.findMany({
			where: and(eq(speakers.languageId, languageId), eq(speakers.isActive, true)),
			orderBy: [asc(speakers.voiceName)],
			limit,
			offset
		});
	},

	async findSpeakersByGender(
		gender: 'male' | 'female',
		limit: number = 50,
		offset: number = 0
	): Promise<Speaker[]> {
		return db.query.speakers.findMany({
			where: and(eq(speakers.gender, gender), eq(speakers.isActive, true)),
			orderBy: [asc(speakers.voiceName)],
			limit,
			offset
		});
	},

	async findActiveSpeakers(limit: number = 100, offset: number = 0): Promise<Speaker[]> {
		return db.query.speakers.findMany({
			where: eq(speakers.isActive, true),
			orderBy: [asc(speakers.languageId), asc(speakers.voiceName)],
			limit,
			offset
		});
	},

	// UPDATE
	async updateLanguage(id: string, data: Partial<NewLanguage>): Promise<Language | undefined> {
		const [updatedLanguage] = await db
			.update(languages)
			.set(data)
			.where(eq(languages.id, id))
			.returning();
		return updatedLanguage;
	},

	async updateSpeaker(id: string, data: Partial<NewSpeaker>): Promise<Speaker | undefined> {
		const [updatedSpeaker] = await db
			.update(speakers)
			.set(data)
			.where(eq(speakers.id, id))
			.returning();
		return updatedSpeaker;
	},

	async toggleSpeakerActive(id: string): Promise<Speaker | undefined> {
		const currentSpeaker = await this.findSpeakerById(id);
		if (!currentSpeaker) return undefined;

		const [updatedSpeaker] = await db
			.update(speakers)
			.set({ isActive: !currentSpeaker.isActive })
			.where(eq(speakers.id, id))
			.returning();
		return updatedSpeaker;
	},

	// DELETE
	async deleteLanguage(id: string): Promise<{ success: boolean }> {
		// First delete all speakers for this language
		await db.delete(speakers).where(eq(speakers.languageId, id));

		// Then delete the language
		const result = await db
			.delete(languages)
			.where(eq(languages.id, id))
			.returning({ id: languages.id });
		return { success: result.length > 0 };
	},

	async deleteSpeaker(id: string): Promise<{ success: boolean }> {
		const result = await db
			.delete(speakers)
			.where(eq(speakers.id, id))
			.returning({ id: speakers.id });
		return { success: result.length > 0 };
	}
};
