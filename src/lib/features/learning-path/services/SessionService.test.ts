import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SessionService } from './SessionService.server';

// ============================================================================
// MOCK SETUP
// ============================================================================

const mockDb = {
	transaction: vi.fn(),
	insert: vi.fn(),
	update: vi.fn(),
	query: {
		weekProgress: { findFirst: vi.fn(), findMany: vi.fn() },
		weekSessions: { findFirst: vi.fn(), findMany: vi.fn() },
		sessionTypes: { findFirst: vi.fn(), findMany: vi.fn() },
		adaptiveWeeks: { findFirst: vi.fn(), findMany: vi.fn() },
		learningPaths: { findFirst: vi.fn(), findMany: vi.fn() },
		conversations: { findFirst: vi.fn(), findMany: vi.fn() }
	}
} as any;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function setupMockSession(
	service: SessionService,
	weekProgressId: string,
	sessionTypeId: string
) {
	mockDb.transaction.mockImplementation(async (callback: any) => {
		const mockTx = {
			insert: vi.fn().mockReturnValue({
				values: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([
						{
							id: 'session-123',
							weekProgressId,
							sessionTypeId,
							conversationId: 'conv-123',
							startedAt: new Date()
						}
					])
				})
			})
		};
		return callback(mockTx);
	});

	mockDb.query.weekProgress.findFirst.mockResolvedValue({
		id: weekProgressId,
		userId: 'user-123',
		weekId: 'week-123'
	});

	mockDb.query.sessionTypes.findFirst.mockResolvedValue({
		id: sessionTypeId,
		name: 'Quick Check-in'
	});

	mockDb.query.adaptiveWeeks.findFirst.mockResolvedValue({
		id: 'week-123',
		pathId: 'path-123'
	});

	mockDb.query.learningPaths.findFirst.mockResolvedValue({
		id: 'path-123',
		targetLanguage: 'nl'
	});
}

// ============================================================================
// TESTS
// ============================================================================

describe('SessionService', () => {
	let service: SessionService;

	beforeEach(() => {
		vi.clearAllMocks();
		service = new SessionService(mockDb);
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	// --------------------------------------------------------------------------
	// getSessionTypes
	// --------------------------------------------------------------------------

	describe('getSessionTypes', () => {
		it('should return all active session types', async () => {
			// Arrange
			mockDb.query.sessionTypes.findMany.mockResolvedValue([
				{ id: 'quick-checkin', name: 'Quick Check-in', isActive: true, displayOrder: 1 },
				{ id: 'story-moment', name: 'Story Moment', isActive: true, displayOrder: 2 },
				{ id: 'question-game', name: 'Question Game', isActive: true, displayOrder: 3 }
			]);

			// Act
			const result = await service.getSessionTypes();

			// Assert
			expect(result.length).toBe(3);
			expect(result[0].id).toBe('quick-checkin');
		});
	});

	// --------------------------------------------------------------------------
	// startSession
	// --------------------------------------------------------------------------

	describe('startSession', () => {
		it('should create a conversation linked to session type', async () => {
			// Arrange
			await setupMockSession(service, 'progress-123', 'quick-checkin');

			// Act
			const result = await service.startSession({
				weekProgressId: 'progress-123',
				sessionTypeId: 'quick-checkin'
			});

			// Assert
			expect(result.conversation).toBeDefined();
			expect(result.session.sessionTypeId).toBe('quick-checkin');
			expect(result.session.startedAt).toBeDefined();
		});

		it('should link to conversation seed if provided', async () => {
			// Arrange
			const seedId = 'seed-introduce-yourself';

			mockDb.transaction.mockImplementation(async (callback: any) => {
				const mockTx = {
					insert: vi.fn().mockReturnValue({
						values: vi.fn().mockImplementation((values) => ({
							returning: vi.fn().mockResolvedValue([
								{
									id: 'session-123',
									sessionTypeId: 'story-moment',
									conversationSeedId: values.conversationSeedId,
									startedAt: new Date()
								}
							])
						}))
					})
				};
				return callback(mockTx);
			});

			mockDb.query.weekProgress.findFirst.mockResolvedValue({
				id: 'progress-123',
				userId: 'user-123',
				weekId: 'week-123'
			});

			mockDb.query.sessionTypes.findFirst.mockResolvedValue({
				id: 'story-moment',
				name: 'Story Moment'
			});

			mockDb.query.adaptiveWeeks.findFirst.mockResolvedValue({
				id: 'week-123',
				pathId: 'path-123'
			});

			mockDb.query.learningPaths.findFirst.mockResolvedValue({
				id: 'path-123',
				targetLanguage: 'nl'
			});

			// Act
			const result = await service.startSession({
				weekProgressId: 'progress-123',
				sessionTypeId: 'story-moment',
				conversationSeedId: seedId
			});

			// Assert
			expect(result.session.conversationSeedId).toBe(seedId);
		});

		it('should throw if week progress not found', async () => {
			// Arrange
			mockDb.query.weekProgress.findFirst.mockResolvedValue(null);

			// Act & Assert
			await expect(
				service.startSession({
					weekProgressId: 'nonexistent',
					sessionTypeId: 'quick-checkin'
				})
			).rejects.toThrow('Week progress not found');
		});
	});

	// --------------------------------------------------------------------------
	// completeSession
	// --------------------------------------------------------------------------

	describe('completeSession', () => {
		it('should increment sessionsCompleted', async () => {
			// Arrange
			const sessionStartTime = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago

			mockDb.query.weekSessions.findFirst.mockResolvedValue({
				id: 'session-123',
				weekProgressId: 'progress-123',
				conversationId: 'conv-123',
				sessionTypeId: 'quick-checkin',
				startedAt: sessionStartTime
			});

			mockDb.query.conversations.findFirst.mockResolvedValue({
				id: 'conv-123',
				messageCount: 8
			});

			mockDb.transaction.mockImplementation(async (callback: any) => {
				let updateCallCount = 0;
				const mockTx = {
					update: vi.fn().mockImplementation(() => {
						updateCallCount++;
						const isSessionUpdate = updateCallCount === 1;
						return {
							set: vi.fn().mockReturnValue({
								where: vi.fn().mockReturnValue({
									returning: vi.fn().mockResolvedValue([
										isSessionUpdate
											? { id: 'session-123', completedAt: new Date() }
											: {
													id: 'progress-123',
													sessionsCompleted: 1,
													totalMinutes: '5',
													sessionTypesUsed: 1,
													sessionTypeIdsUsed: ['quick-checkin'],
													seedsExplored: 0,
													seedIdsExplored: [],
													averageComfortRating: '4.00',
													sessions: []
												}
									])
								})
							})
						};
					}),
					query: {
						weekProgress: {
							findFirst: vi.fn().mockResolvedValue({
								id: 'progress-123',
								sessionsCompleted: 0,
								totalMinutes: '0',
								sessionTypeIdsUsed: [],
								seedIdsExplored: [],
								sessions: [],
								averageComfortRating: null
							})
						}
					}
				};
				return callback(mockTx);
			});

			// Act
			const result = await service.completeSession({
				sessionId: 'session-123',
				comfortRating: 4,
				mood: 'good'
			});

			// Assert
			expect(result.progress.sessionsCompleted).toBe(1);
		});

		it('should update totalMinutes based on session duration', async () => {
			// Arrange
			const sessionStartTime = new Date(Date.now() - 7 * 60 * 1000); // 7 minutes ago

			mockDb.query.weekSessions.findFirst.mockResolvedValue({
				id: 'session-123',
				weekProgressId: 'progress-123',
				conversationId: 'conv-123',
				sessionTypeId: 'quick-checkin',
				startedAt: sessionStartTime
			});

			mockDb.query.conversations.findFirst.mockResolvedValue({
				id: 'conv-123',
				messageCount: 10
			});

			let capturedTotalMinutes: string;

			mockDb.transaction.mockImplementation(async (callback: any) => {
				const mockTx = {
					update: vi.fn().mockReturnValue({
						set: vi.fn().mockImplementation((values) => {
							if (values.totalMinutes) {
								capturedTotalMinutes = values.totalMinutes;
							}
							return {
								where: vi.fn().mockReturnValue({
									returning: vi.fn().mockResolvedValue([
										{
											id: 'progress-123',
											totalMinutes: values.totalMinutes ?? '0'
										}
									])
								})
							};
						})
					}),
					query: {
						weekProgress: {
							findFirst: vi.fn().mockResolvedValue({
								id: 'progress-123',
								sessionsCompleted: 0,
								totalMinutes: '0',
								sessionTypeIdsUsed: [],
								seedIdsExplored: [],
								sessions: [],
								averageComfortRating: null
							})
						}
					}
				};
				return callback(mockTx);
			});

			// Act
			const result = await service.completeSession({
				sessionId: 'session-123'
			});

			// Assert
			const totalMinutes = parseFloat(result.progress.totalMinutes?.toString() ?? '0');
			expect(totalMinutes).toBeCloseTo(7, 0);
		});

		it('should track session type variety', async () => {
			// Arrange
			const sessionStartTime = new Date(Date.now() - 5 * 60 * 1000);

			mockDb.query.weekSessions.findFirst.mockResolvedValue({
				id: 'session-123',
				weekProgressId: 'progress-123',
				conversationId: 'conv-123',
				sessionTypeId: 'story-moment', // New session type
				startedAt: sessionStartTime
			});

			mockDb.query.conversations.findFirst.mockResolvedValue({
				id: 'conv-123',
				messageCount: 8
			});

			mockDb.transaction.mockImplementation(async (callback: any) => {
				const mockTx = {
					update: vi.fn().mockReturnValue({
						set: vi.fn().mockImplementation((values) => ({
							where: vi.fn().mockReturnValue({
								returning: vi.fn().mockResolvedValue([
									{
										id: 'progress-123',
										sessionTypesUsed: values.sessionTypesUsed ?? 1,
										sessionTypeIdsUsed: values.sessionTypeIdsUsed ?? ['story-moment']
									}
								])
							})
						}))
					}),
					query: {
						weekProgress: {
							findFirst: vi.fn().mockResolvedValue({
								id: 'progress-123',
								sessionsCompleted: 1,
								totalMinutes: '5',
								sessionTypeIdsUsed: ['quick-checkin'], // Already has one type
								seedIdsExplored: [],
								sessions: [],
								averageComfortRating: '4.00'
							})
						}
					}
				};
				return callback(mockTx);
			});

			// Act
			const result = await service.completeSession({
				sessionId: 'session-123'
			});

			// Assert
			expect(result.progress.sessionTypesUsed).toBe(2);
			expect(result.progress.sessionTypeIdsUsed).toContain('quick-checkin');
			expect(result.progress.sessionTypeIdsUsed).toContain('story-moment');
		});

		it('should update comfort rating average', async () => {
			// Arrange
			const sessionStartTime = new Date(Date.now() - 5 * 60 * 1000);

			mockDb.query.weekSessions.findFirst.mockResolvedValue({
				id: 'session-123',
				weekProgressId: 'progress-123',
				conversationId: 'conv-123',
				sessionTypeId: 'quick-checkin',
				startedAt: sessionStartTime
			});

			mockDb.query.conversations.findFirst.mockResolvedValue({
				id: 'conv-123',
				messageCount: 8
			});

			mockDb.transaction.mockImplementation(async (callback: any) => {
				const mockTx = {
					update: vi.fn().mockReturnValue({
						set: vi.fn().mockImplementation((values) => ({
							where: vi.fn().mockReturnValue({
								returning: vi.fn().mockResolvedValue([
									{
										id: 'progress-123',
										averageComfortRating: values.averageComfortRating
									}
								])
							})
						}))
					}),
					query: {
						weekProgress: {
							findFirst: vi.fn().mockResolvedValue({
								id: 'progress-123',
								sessionsCompleted: 2, // Already has 2 sessions
								totalMinutes: '10',
								sessionTypeIdsUsed: [],
								seedIdsExplored: [],
								sessions: [],
								averageComfortRating: '3.50' // Average of 3 and 4
							})
						}
					}
				};
				return callback(mockTx);
			});

			// Act - Adding a session with comfort rating 5
			const result = await service.completeSession({
				sessionId: 'session-123',
				comfortRating: 5
			});

			// Assert - New average should be (3.5*2 + 5)/3 = 4.0
			const avgComfort = parseFloat(result.progress.averageComfortRating?.toString() ?? '0');
			expect(avgComfort).toBe(4);
		});

		it('should return encouraging message', async () => {
			// Arrange
			const sessionStartTime = new Date(Date.now() - 5 * 60 * 1000);

			mockDb.query.weekSessions.findFirst.mockResolvedValue({
				id: 'session-123',
				weekProgressId: 'progress-123',
				conversationId: 'conv-123',
				sessionTypeId: 'quick-checkin',
				startedAt: sessionStartTime
			});

			mockDb.query.conversations.findFirst.mockResolvedValue({
				id: 'conv-123',
				messageCount: 8
			});

			mockDb.transaction.mockImplementation(async (callback: any) => {
				const mockTx = {
					update: vi.fn().mockReturnValue({
						set: vi.fn().mockReturnValue({
							where: vi.fn().mockReturnValue({
								returning: vi.fn().mockResolvedValue([
									{ id: 'progress-123', sessionsCompleted: 3, totalMinutes: '15' }
								])
							})
						})
					}),
					query: {
						weekProgress: {
							findFirst: vi.fn().mockResolvedValue({
								id: 'progress-123',
								sessionsCompleted: 2,
								totalMinutes: '10',
								sessionTypeIdsUsed: [],
								seedIdsExplored: [],
								sessions: [],
								averageComfortRating: null
							})
						}
					}
				};
				return callback(mockTx);
			});

			// Act
			const result = await service.completeSession({
				sessionId: 'session-123'
			});

			// Assert
			expect(result.encouragement).toBeDefined();
			expect(result.encouragement).toContain('3');
		});
	});
});
