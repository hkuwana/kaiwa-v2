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

	async findUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined> {
		return db.query.users.findFirst({ where: eq(users.stripeCustomerId, stripeCustomerId) });
	},

	async getAllUsers(): Promise<User[]> {
		return db.query.users.findMany();
	},

	// UPDATE
	async updateUser(id: string, data: Partial<NewUser>): Promise<User | undefined> {
		const [updatedUser] = await db.update(users).set(data).where(eq(users.id, id)).returning();
		return updatedUser;
	},

	// DELETE
	async deleteUser(id: string): Promise<{ success: boolean }> {
		const result = await db.delete(users).where(eq(users.id, id)).returning({ id: users.id });
		return { success: result.length > 0 };
	}
};
