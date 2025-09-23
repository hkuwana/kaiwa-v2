// src/lib/server/repositories/emailVerification.repository.ts

import { db } from '$lib/server/db/index';
import { emailVerification } from '$lib/server/db/schema';
import type { NewEmailVerification, EmailVerification } from '$lib/server/db/types';
import { eq, and, gt, isNull } from 'drizzle-orm';

export const emailVerificationRepository = {
	// CREATE
	async createVerification(newVerification: NewEmailVerification): Promise<EmailVerification> {
		const [createdVerification] = await db
			.insert(emailVerification)
			.values(newVerification)
			.returning();
		return createdVerification;
	},

	// READ
	async findVerificationById(id: string): Promise<EmailVerification | undefined> {
		return db.query.emailVerification.findFirst({ where: eq(emailVerification.id, id) });
	},

	async findVerificationByUserId(userId: string): Promise<EmailVerification | undefined> {
		return db.query.emailVerification.findFirst({ where: eq(emailVerification.userId, userId) });
	},

	async findPendingVerificationByUserId(userId: string): Promise<EmailVerification | undefined> {
		return db
			.select()
			.from(emailVerification)
			.where(
				and(
					eq(emailVerification.userId, userId),
					isNull(emailVerification.verifiedAt),
					gt(emailVerification.expiresAt, new Date())
				)
			)
			.then((results) => results[0]);
	},

	async findVerificationByCode(
		userId: string,
		code: string
	): Promise<EmailVerification | undefined> {
		return db
			.select()
			.from(emailVerification)
			.where(
				and(
					eq(emailVerification.userId, userId),
					eq(emailVerification.code, code),
					isNull(emailVerification.verifiedAt),
					gt(emailVerification.expiresAt, new Date())
				)
			)
			.then((results) => results[0]);
	},

	async findVerificationByEmail(email: string): Promise<EmailVerification | undefined> {
		return db.query.emailVerification.findFirst({ where: eq(emailVerification.email, email) });
	},

	// UPDATE
	async updateVerification(
		id: string,
		data: Partial<NewEmailVerification>
	): Promise<EmailVerification | undefined> {
		const [updatedVerification] = await db
			.update(emailVerification)
			.set(data)
			.where(eq(emailVerification.id, id))
			.returning();
		return updatedVerification;
	},

	async markAsVerified(id: string): Promise<EmailVerification | undefined> {
		const [updatedVerification] = await db
			.update(emailVerification)
			.set({ verifiedAt: new Date() })
			.where(eq(emailVerification.id, id))
			.returning();
		return updatedVerification;
	},

	async incrementAttempts(userId: string): Promise<EmailVerification | undefined> {
		// First get the current verification to increment attempts
		const [currentVerification] = await db
			.select()
			.from(emailVerification)
			.where(eq(emailVerification.userId, userId));

		if (!currentVerification) {
			return undefined;
		}

		const [updatedVerification] = await db
			.update(emailVerification)
			.set({ attempts: currentVerification.attempts + 1 })
			.where(eq(emailVerification.id, currentVerification.id))
			.returning();
		return updatedVerification;
	},

	// DELETE
	async deleteVerification(id: string): Promise<{ success: boolean }> {
		const result = await db
			.delete(emailVerification)
			.where(eq(emailVerification.id, id))
			.returning({ id: emailVerification.id });
		return { success: result.length > 0 };
	},

	async deleteVerificationByUserId(userId: string): Promise<{ success: boolean }> {
		const result = await db
			.delete(emailVerification)
			.where(eq(emailVerification.userId, userId))
			.returning({ id: emailVerification.id });
		return { success: result.length > 0 };
	},

	async deleteUnverifiedVerificationsByUserId(userId: string): Promise<{ success: boolean }> {
		const result = await db
			.delete(emailVerification)
			.where(and(eq(emailVerification.userId, userId), isNull(emailVerification.verifiedAt)))
			.returning({ id: emailVerification.id });
		return { success: result.length > 0 };
	}
};
