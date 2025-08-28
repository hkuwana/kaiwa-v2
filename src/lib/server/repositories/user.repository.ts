// src/lib/server/repositories/user.repository.ts

import { db } from '$lib/server/db/index';
import { users } from '$lib/server/db/schema';
import type { NewUser, User } from '$lib/server/db/types';
import { eq } from 'drizzle-orm';

export const userRepository = {
	// CREATE
	async createUser(newUser: NewUser): Promise<User> {
		const [createdUser] = await db.insert(users).values(newUser).returning();
		return createdUser;
	},

	// READ
	async findUserById(id: string): Promise<User | undefined> {
		return db.query.users.findFirst({ where: eq(users.id, id) });
	},

	async findUserByEmail(email: string): Promise<User | undefined> {
		return db.query.users.findFirst({ where: eq(users.email, email) });
	},

	async findUserByGoogleId(googleId: string): Promise<User | undefined> {
		return db.query.users.findFirst({ where: eq(users.googleId, googleId) });
	},

	async findUserByUsername(username: string): Promise<User | undefined> {
		return db.query.users.findFirst({ where: eq(users.username, username) });
	},

	// UPDATE
	async updateUser(id: string, data: Partial<NewUser>): Promise<User | undefined> {
		const [updatedUser] = await db.update(users).set(data).where(eq(users.id, id)).returning();
		return updatedUser;
	},

	async updateUserStripeCustomerId(
		id: string,
		stripeCustomerId: string
	): Promise<User | undefined> {
		const [updatedUser] = await db
			.update(users)
			.set({ stripeCustomerId })
			.where(eq(users.id, id))
			.returning();

		return updatedUser;
	},

	async updateLastUsage(id: string): Promise<User | undefined> {
		const [updatedUser] = await db
			.update(users)
			.set({ lastUsage: new Date() })
			.where(eq(users.id, id))
			.returning();

		return updatedUser;
	},

	// DELETE
	async deleteUser(id: string): Promise<{ success: boolean }> {
		const result = await db.delete(users).where(eq(users.id, id)).returning({ id: users.id });
		return { success: result.length > 0 };
	}
};
