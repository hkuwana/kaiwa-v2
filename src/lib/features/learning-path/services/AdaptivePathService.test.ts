import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { getTableName } from 'drizzle-orm';
import { AdaptivePathService } from './AdaptivePathService.server';

// ============================================================================
// MOCK SETUP
// ============================================================================

// TODO: Set up proper database mocking
// Options:
// 1. Use a test database with migrations
// 2. Use drizzle's mock utilities
// 3. Create an in-memory SQLite for testing

const mockDb = {
	transaction: vi.fn(),
	insert: vi.fn(),
	update: vi.fn(),
	query: {
		learningPaths: { findFirst: vi.fn(), findMany: vi.fn() },
		learningPathAssignments: { findFirst: vi.fn(), findMany: vi.fn() },
		adaptiveWeeks: { findFirst: vi.fn(), findMany: vi.fn() },
		weekProgress: { findFirst: vi.fn(), findMany: vi.fn() },
		sessionTypes: { findFirst: vi.fn(), findMany: vi.fn() }
	}
} as any;

// ============================================================================
// TESTS
// ============================================================================

describe('AdaptivePathService', () => {
	let service: AdaptivePathService;

	beforeEach(() => {
		vi.clearAllMocks();
		service = new AdaptivePathService(mockDb);
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	// --------------------------------------------------------------------------
	// createPath
	// --------------------------------------------------------------------------

	describe('createPath', () => {
		it('should create a path with mode=adaptive', async () => {
			// Arrange
			const params = {
				userId: 'user-123',
				targetLanguage: 'nl',
				title: 'Dutch for Meeting Family',
				description: "Prepare to meet your partner's parents",
				weekThemeTemplate: 'meet-family' as const,
				cefrLevel: 'A2'
			};

			mockDb.transaction.mockImplementation(async (callback: any) => {
				const mockTx = {
					insert: vi.fn().mockReturnValue({
						values: vi.fn().mockReturnValue({
							returning: vi.fn().mockResolvedValue([
								{ id: 'path-123', mode: 'adaptive', durationWeeks: 4 }
							])
						})
					})
				};
				return callback(mockTx);
			});

			// Act
			const result = await service.createPath(params);

			// Assert
			expect(result.path.mode).toBe('adaptive');
			expect(result.path.durationWeeks).toBe(4);
		});

		it('should create Week 1 as anchor week', async () => {
			// Arrange
			const params = {
				userId: 'user-123',
				targetLanguage: 'nl',
				title: 'Dutch for Meeting Family',
				description: "Prepare to meet your partner's parents",
				weekThemeTemplate: 'meet-family' as const,
				cefrLevel: 'A2'
			};

			mockDb.transaction.mockImplementation(async (callback: any) => {
				const insertCalls: any[] = [];
				const mockTx = {
					insert: vi.fn().mockImplementation((table) => {
						return {
							values: vi.fn().mockImplementation((values) => {
								insertCalls.push({ table, values });
								// Return different values based on which table
								if (getTableName(table) === 'learning_paths') {
									return {
										returning: vi.fn().mockResolvedValue([{ id: 'path-123', mode: 'adaptive' }])
									};
								}
								if (getTableName(table) === 'learning_path_assignments') {
									return {
										returning: vi.fn().mockResolvedValue([{ id: 'assign-123' }])
									};
								}
								if (getTableName(table) === 'adaptive_weeks') {
									return {
										returning: vi.fn().mockResolvedValue([
											{
												id: 'week-123',
												weekNumber: 1,
												isAnchorWeek: true,
												status: 'active',
												theme: 'Introducing Myself'
											}
										])
									};
								}
								if (getTableName(table) === 'week_progress') {
									return {
										returning: vi.fn().mockResolvedValue([{ id: 'progress-123' }])
									};
								}
								return { returning: vi.fn().mockResolvedValue([{}]) };
							})
						};
					})
				};
				return callback(mockTx);
			});

			// Act
			const result = await service.createPath(params);

			// Assert
			expect(result.week1.isAnchorWeek).toBe(true);
			expect(result.week1.weekNumber).toBe(1);
			expect(result.week1.status).toBe('active');
		});

		it('should populate Week 1 with conversation seeds from template', async () => {
			// Arrange
			const params = {
				userId: 'user-123',
				targetLanguage: 'nl',
				title: 'Dutch for Meeting Family',
				description: "Prepare to meet your partner's parents",
				weekThemeTemplate: 'meet-family' as const,
				cefrLevel: 'A2'
			};

			let capturedWeekValues: any;

			mockDb.transaction.mockImplementation(async (callback: any) => {
				const mockTx = {
					insert: vi.fn().mockImplementation((table) => {
						return {
							values: vi.fn().mockImplementation((values) => {
								if (getTableName(table) === 'adaptive_weeks') {
									capturedWeekValues = values;
								}
								return {
									returning: vi.fn().mockResolvedValue([
										{
											id: 'week-123',
											conversationSeeds: values.conversationSeeds ?? [],
											theme: values.theme ?? 'Introducing Myself'
										}
									])
								};
							})
						};
					})
				};
				return callback(mockTx);
			});

			// Act
			const result = await service.createPath(params);

			// Assert
			expect(result.week1.conversationSeeds.length).toBeGreaterThan(0);
			expect(result.week1.theme).toBe('Introducing Myself');
		});

		it('should create empty week_progress record', async () => {
			// Arrange
			const params = {
				userId: 'user-123',
				targetLanguage: 'nl',
				title: 'Test Path',
				description: 'Test',
				weekThemeTemplate: 'daily-life' as const,
				cefrLevel: 'A1'
			};

			let capturedProgressValues: any;

			mockDb.transaction.mockImplementation(async (callback: any) => {
				const mockTx = {
					insert: vi.fn().mockImplementation((table) => {
						return {
							values: vi.fn().mockImplementation((values) => {
								if (getTableName(table) === 'week_progress') {
									capturedProgressValues = values;
								}
								return {
									returning: vi.fn().mockResolvedValue([
										{
											id: 'progress-123',
											sessionsCompleted: values.sessionsCompleted ?? 0,
											totalMinutes: values.totalMinutes ?? '0'
										}
									])
								};
							})
						};
					})
				};
				return callback(mockTx);
			});

			// Act
			const result = await service.createPath(params);

			// Assert
			expect(result.weekProgress.sessionsCompleted).toBe(0);
			expect(result.weekProgress.totalMinutes).toBe('0');
		});
	});

	// --------------------------------------------------------------------------
	// getCurrentWeek
	// --------------------------------------------------------------------------

	describe('getCurrentWeek', () => {
		it('should return active week with progress', async () => {
			// Arrange
			const assignmentId = 'assign-123';

			mockDb.query.learningPathAssignments.findFirst.mockResolvedValue({
				id: assignmentId,
				pathId: 'path-123',
				userId: 'user-123'
			});

			mockDb.query.adaptiveWeeks.findFirst.mockResolvedValue({
				id: 'week-123',
				pathId: 'path-123',
				status: 'active',
				weekNumber: 1
			});

			mockDb.query.weekProgress.findFirst.mockResolvedValue({
				id: 'progress-123',
				weekId: 'week-123',
				sessionsCompleted: 2
			});

			mockDb.query.sessionTypes.findMany.mockResolvedValue([
				{ id: 'quick-checkin', name: 'Quick Check-in' },
				{ id: 'story-moment', name: 'Story Moment' }
			]);

			// Act
			const result = await service.getCurrentWeek(assignmentId);

			// Assert
			expect(result).not.toBeNull();
			expect(result?.week.status).toBe('active');
			expect(result?.progress.sessionsCompleted).toBe(2);
		});

		it('should include all active session types', async () => {
			// Arrange
			const assignmentId = 'assign-123';

			mockDb.query.learningPathAssignments.findFirst.mockResolvedValue({
				id: assignmentId,
				pathId: 'path-123',
				userId: 'user-123'
			});

			mockDb.query.adaptiveWeeks.findFirst.mockResolvedValue({
				id: 'week-123',
				status: 'active'
			});

			mockDb.query.weekProgress.findFirst.mockResolvedValue({
				id: 'progress-123'
			});

			mockDb.query.sessionTypes.findMany.mockResolvedValue([
				{ id: 'quick-checkin', name: 'Quick Check-in', isActive: true },
				{ id: 'story-moment', name: 'Story Moment', isActive: true },
				{ id: 'question-game', name: 'Question Game', isActive: true },
				{ id: 'mini-roleplay', name: 'Mini Roleplay', isActive: true },
				{ id: 'review-chat', name: 'Review Chat', isActive: true },
				{ id: 'deep-dive', name: 'Deep Dive', isActive: true }
			]);

			// Act
			const result = await service.getCurrentWeek(assignmentId);

			// Assert
			expect(result?.sessionTypes.length).toBe(6);
			expect(result?.sessionTypes.map((s) => s.id)).toContain('quick-checkin');
			expect(result?.sessionTypes.map((s) => s.id)).toContain('story-moment');
		});

		it('should return null if assignment not found', async () => {
			// Arrange
			mockDb.query.learningPathAssignments.findFirst.mockResolvedValue(null);

			// Act
			const result = await service.getCurrentWeek('nonexistent');

			// Assert
			expect(result).toBeNull();
		});
	});

	// --------------------------------------------------------------------------
	// getPathWeeks
	// --------------------------------------------------------------------------

	describe('getPathWeeks', () => {
		it('should return all weeks for a path ordered by week number', async () => {
			// Arrange
			const pathId = 'path-123';

			mockDb.query.adaptiveWeeks.findMany.mockResolvedValue([
				{ id: 'week-1', weekNumber: 1, theme: 'Week 1' },
				{ id: 'week-2', weekNumber: 2, theme: 'Week 2' },
				{ id: 'week-3', weekNumber: 3, theme: 'Week 3' }
			]);

			// Act
			const result = await service.getPathWeeks(pathId);

			// Assert
			expect(result.length).toBe(3);
			expect(result[0].weekNumber).toBe(1);
			expect(result[2].weekNumber).toBe(3);
		});
	});
});
