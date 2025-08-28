// src/lib/server/repositories/session.repository.ts

import { db } from '$lib/server/db/index';
import { session } from '$lib/server/db/schema';
import type { Session } from '$lib/server/db/types';
import { eq } from 'drizzle-orm';

export const sessionRepository = {
	// CREATE
	async create(sessionData: Session): Promise<Session> {
		const [createdSession] = await db.insert(session).values(sessionData).returning();
		return createdSession;
	},

	// READ
	async findById(id: string): Promise<Session | undefined> {
		return db.query.session.findFirst({ where: eq(session.id, id) });
	},

	async findByUserId(userId: string): Promise<Session[]> {
		return db.query.session.findMany({ where: eq(session.userId, userId) });
	},

	// UPDATE
	async updateExpiration(id: string, expiresAt: Date): Promise<Session | undefined> {
		const [updatedSession] = await db
			.update(session)
			.set({ expiresAt })
			.where(eq(session.id, id))
			.returning();
		return updatedSession;
	},

	// DELETE
	async delete(id: string): Promise<{ success: boolean }> {
		const result = await db.delete(session).where(eq(session.id, id)).returning({ id: session.id });
		return { success: result.length > 0 };
	},

	async deleteByUserId(userId: string): Promise<{ success: boolean }> {
		const result = await db
			.delete(session)
			.where(eq(session.userId, userId))
			.returning({ id: session.id });
		return { success: result.length > 0 };
	}
};

export type SessionRepository = typeof sessionRepository;
