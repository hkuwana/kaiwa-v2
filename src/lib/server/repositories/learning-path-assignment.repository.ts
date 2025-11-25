// src/lib/server/repositories/learning-path-assignment.repository.ts

import { db } from '$lib/server/db/index';
import { learningPathAssignments } from '$lib/server/db/schema';
import type { NewLearningPathAssignment, LearningPathAssignment } from '$lib/server/db/types';
import { eq, and, lt, sql } from 'drizzle-orm';

export const learningPathAssignmentRepository = {
	// CREATE
	async createAssignment(input: NewLearningPathAssignment): Promise<LearningPathAssignment> {
		const [assignment] = await db
			.insert(learningPathAssignments)
			.values({
				...input,
				createdAt: new Date(),
				updatedAt: new Date()
			})
			.returning();

		return assignment;
	},

	// READ
	async findAssignmentById(assignmentId: string): Promise<LearningPathAssignment | undefined> {
		return db.query.learningPathAssignments.findFirst({
			where: eq(learningPathAssignments.id, assignmentId)
		});
	},

	async findAssignment(
		userId: string,
		pathId: string
	): Promise<LearningPathAssignment | undefined> {
		return db.query.learningPathAssignments.findFirst({
			where: and(
				eq(learningPathAssignments.userId, userId),
				eq(learningPathAssignments.pathId, pathId)
			)
		});
	},

	async listAssignmentsForUser(
		userId: string,
		options?: { status?: 'invited' | 'active' | 'completed' | 'archived' }
	): Promise<LearningPathAssignment[]> {
		const conditions = [eq(learningPathAssignments.userId, userId)];

		if (options?.status) {
			conditions.push(eq(learningPathAssignments.status, options.status));
		}

		return db.query.learningPathAssignments.findMany({
			where: and(...conditions),
			orderBy: [learningPathAssignments.startsAt]
		});
	},

	async getActiveAssignmentsForPath(pathId: string): Promise<LearningPathAssignment[]> {
		return db.query.learningPathAssignments.findMany({
			where: and(
				eq(learningPathAssignments.pathId, pathId),
				eq(learningPathAssignments.status, 'active')
			)
		});
	},

	async getTestersForPath(pathId: string): Promise<LearningPathAssignment[]> {
		return db.query.learningPathAssignments.findMany({
			where: and(
				eq(learningPathAssignments.pathId, pathId),
				eq(learningPathAssignments.role, 'tester')
			)
		});
	},

	async getAssignmentsDueForEmail(now: Date = new Date()): Promise<LearningPathAssignment[]> {
		// Find assignments that:
		// 1. Are active
		// 2. Have email reminders enabled
		// 3. Started on or before today
		// 4. Haven't been completed
		// 5. Either never received an email, or last email was sent yesterday or earlier
		const yesterdayStart = new Date(now);
		yesterdayStart.setDate(yesterdayStart.getDate() - 1);
		yesterdayStart.setHours(0, 0, 0, 0);

		return db.query.learningPathAssignments.findMany({
			where: and(
				eq(learningPathAssignments.status, 'active'),
				eq(learningPathAssignments.emailRemindersEnabled, true),
				lt(learningPathAssignments.startsAt, now)
			)
		});
	},

	// UPDATE
	async updateAssignmentStatus(
		assignmentId: string,
		status: 'invited' | 'active' | 'completed' | 'archived'
	): Promise<LearningPathAssignment | undefined> {
		const updateData: any = {
			status,
			updatedAt: new Date()
		};

		// If completing, set completedAt
		if (status === 'completed') {
			updateData.completedAt = new Date();
		}

		const [updatedAssignment] = await db
			.update(learningPathAssignments)
			.set(updateData)
			.where(eq(learningPathAssignments.id, assignmentId))
			.returning();

		return updatedAssignment;
	},

	async updateProgress(
		assignmentId: string,
		dayIndex: number
	): Promise<LearningPathAssignment | undefined> {
		const [updatedAssignment] = await db
			.update(learningPathAssignments)
			.set({
				currentDayIndex: dayIndex,
				updatedAt: new Date()
			})
			.where(eq(learningPathAssignments.id, assignmentId))
			.returning();

		return updatedAssignment;
	},

	async markEmailSent(assignmentId: string): Promise<LearningPathAssignment | undefined> {
		const [updatedAssignment] = await db
			.update(learningPathAssignments)
			.set({
				lastEmailSentAt: new Date(),
				updatedAt: new Date()
			})
			.where(eq(learningPathAssignments.id, assignmentId))
			.returning();

		return updatedAssignment;
	},

	async updateEmailPreference(
		assignmentId: string,
		enabled: boolean
	): Promise<LearningPathAssignment | undefined> {
		const [updatedAssignment] = await db
			.update(learningPathAssignments)
			.set({
				emailRemindersEnabled: enabled,
				updatedAt: new Date()
			})
			.where(eq(learningPathAssignments.id, assignmentId))
			.returning();

		return updatedAssignment;
	},

	async updateAssignment(
		assignmentId: string,
		data: Partial<NewLearningPathAssignment>
	): Promise<LearningPathAssignment | undefined> {
		const [updatedAssignment] = await db
			.update(learningPathAssignments)
			.set({
				...data,
				updatedAt: new Date()
			})
			.where(eq(learningPathAssignments.id, assignmentId))
			.returning();

		return updatedAssignment;
	},

	// DELETE
	async deleteAssignment(assignmentId: string): Promise<{ success: boolean }> {
		const result = await db
			.delete(learningPathAssignments)
			.where(eq(learningPathAssignments.id, assignmentId))
			.returning({ id: learningPathAssignments.id });

		return { success: result.length > 0 };
	},

	// UTILITY
	async getAssignmentStats(pathId: string): Promise<{
		total: number;
		active: number;
		completed: number;
		testers: number;
		learners: number;
	}> {
		const [stats] = await db
			.select({
				total: sql<number>`count(*)`,
				active: sql<number>`count(*) filter (where ${learningPathAssignments.status} = 'active')`,
				completed: sql<number>`count(*) filter (where ${learningPathAssignments.status} = 'completed')`,
				testers: sql<number>`count(*) filter (where ${learningPathAssignments.role} = 'tester')`,
				learners: sql<number>`count(*) filter (where ${learningPathAssignments.role} = 'learner')`
			})
			.from(learningPathAssignments)
			.where(eq(learningPathAssignments.pathId, pathId));

		return {
			total: Number(stats?.total) || 0,
			active: Number(stats?.active) || 0,
			completed: Number(stats?.completed) || 0,
			testers: Number(stats?.testers) || 0,
			learners: Number(stats?.learners) || 0
		};
	}
};
