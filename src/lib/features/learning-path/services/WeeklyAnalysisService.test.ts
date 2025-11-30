import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { WeeklyAnalysisService } from './WeeklyAnalysisService.server';

// ============================================================================
// MOCK SETUP
// ============================================================================

const mockDb = {
	transaction: vi.fn(),
	insert: vi.fn(),
	update: vi.fn(),
	query: {
		weeklyAnalysis: { findFirst: vi.fn(), findMany: vi.fn() },
		weekProgress: { findFirst: vi.fn(), findMany: vi.fn() },
		adaptiveWeeks: { findFirst: vi.fn(), findMany: vi.fn() },
		learningPathAssignments: { findFirst: vi.fn(), findMany: vi.fn() },
		messages: { findFirst: vi.fn(), findMany: vi.fn() }
	}
} as any;

const mockOpenAI = {
	chat: {
		completions: {
			create: vi.fn()
		}
	}
} as any;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createMockProgress(overrides: Partial<any> = {}) {
	return {
		id: 'progress-123',
		userId: 'user-123',
		assignmentId: 'assign-123',
		weekId: 'week-123',
		sessionsCompleted: 5,
		totalMinutes: '35',
		averageComfortRating: '4.2',
		activeDaysThisWeek: 5,
		sessions: [
			{
				conversationId: 'conv-1',
				sessionTypeId: 'quick-checkin',
				comfortRating: 4,
				mood: 'good',
				durationSeconds: 300
			},
			{
				conversationId: 'conv-2',
				sessionTypeId: 'story-moment',
				comfortRating: 5,
				mood: 'great',
				durationSeconds: 480
			}
		],
		topicsThatSparkedJoy: ['food', 'daily routines'],
		topicsThatWereChallenging: ['past tense'],
		...overrides
	};
}

function createMockWeek(overrides: Partial<any> = {}) {
	return {
		id: 'week-123',
		pathId: 'path-123',
		weekNumber: 1,
		theme: 'My Day',
		themeDescription: 'Talk about your daily life',
		difficultyMin: 'A1',
		difficultyMax: 'A2',
		status: 'active',
		isAnchorWeek: true,
		...overrides
	};
}

// ============================================================================
// TESTS
// ============================================================================

describe('WeeklyAnalysisService', () => {
	let service: WeeklyAnalysisService;

	beforeEach(() => {
		vi.clearAllMocks();
		service = new WeeklyAnalysisService(mockDb, mockOpenAI);
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	// --------------------------------------------------------------------------
	// queueAnalysis
	// --------------------------------------------------------------------------

	describe('queueAnalysis', () => {
		it('should create analysis record with pending status', async () => {
			// Arrange
			const progress = createMockProgress();
			mockDb.query.weekProgress.findFirst.mockResolvedValue(progress);
			mockDb.query.weeklyAnalysis.findFirst.mockResolvedValue(null); // No existing analysis

			mockDb.insert.mockReturnValue({
				values: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([
						{
							id: 'analysis-123',
							status: 'pending',
							weekProgressId: progress.id
						}
					])
				})
			});

			// Act
			const result = await service.queueAnalysis(progress.id);

			// Assert
			expect(result.status).toBe('pending');
			expect(result.weekProgressId).toBe(progress.id);
		});

		it('should return existing analysis if already exists', async () => {
			// Arrange
			const progress = createMockProgress();
			mockDb.query.weekProgress.findFirst.mockResolvedValue(progress);
			mockDb.query.weeklyAnalysis.findFirst.mockResolvedValue({
				id: 'existing-analysis',
				status: 'completed',
				weekProgressId: progress.id
			});

			// Act
			const result = await service.queueAnalysis(progress.id);

			// Assert
			expect(result.id).toBe('existing-analysis');
			expect(mockDb.insert).not.toHaveBeenCalled();
		});

		it('should throw if week progress not found', async () => {
			// Arrange
			mockDb.query.weekProgress.findFirst.mockResolvedValue(null);

			// Act & Assert
			await expect(service.queueAnalysis('nonexistent')).rejects.toThrow(
				'Week progress not found'
			);
		});
	});

	// --------------------------------------------------------------------------
	// processAnalysis
	// --------------------------------------------------------------------------

	describe('processAnalysis', () => {
		it('should update status to processing then completed', async () => {
			// Arrange
			const progress = createMockProgress();
			const week = createMockWeek();

			const updateCalls: string[] = [];

			mockDb.update.mockImplementation(() => ({
				set: vi.fn().mockImplementation((values) => {
					updateCalls.push(values.status);
					return {
						where: vi.fn().mockReturnValue({
							returning: vi.fn().mockResolvedValue([
								{ id: 'analysis-123', status: values.status }
							])
						})
					};
				})
			}));

			mockDb.query.weeklyAnalysis.findFirst.mockResolvedValue({
				id: 'analysis-123',
				weekProgressId: progress.id
			});

			mockDb.query.weekProgress.findFirst.mockResolvedValue(progress);
			mockDb.query.adaptiveWeeks.findFirst.mockResolvedValue(week);
			mockDb.query.messages.findMany.mockResolvedValue([]);

			// Act
			await service.processAnalysis('analysis-123');

			// Assert
			expect(updateCalls).toContain('processing');
			expect(updateCalls).toContain('completed');
		});

		it('should identify strengths from conversation data', async () => {
			// Arrange
			const progress = createMockProgress({
				sessions: [
					{
						conversationId: 'conv-1',
						sessionTypeId: 'quick-checkin',
						comfortRating: 5,
						mood: 'great',
						durationSeconds: 300
					}
				]
			});
			const week = createMockWeek();

			let capturedStrengths: any[];

			mockDb.update.mockImplementation(() => ({
				set: vi.fn().mockImplementation((values) => {
					if (values.strengths) {
						capturedStrengths = values.strengths;
					}
					return {
						where: vi.fn().mockReturnValue({
							returning: vi.fn().mockResolvedValue([
								{
									id: 'analysis-123',
									status: values.status ?? 'completed',
									strengths: values.strengths ?? []
								}
							])
						})
					};
				})
			}));

			mockDb.query.weeklyAnalysis.findFirst.mockResolvedValue({
				id: 'analysis-123',
				weekProgressId: progress.id
			});

			mockDb.query.weekProgress.findFirst.mockResolvedValue(progress);
			mockDb.query.adaptiveWeeks.findFirst.mockResolvedValue(week);
			mockDb.query.messages.findMany.mockResolvedValue([
				{ role: 'user', content: 'Ik werk vandaag' },
				{ role: 'assistant', content: 'Wat voor werk doe je?' },
				{ role: 'user', content: 'Ik ben een programmeur' }
			]);

			// Act
			const result = await service.processAnalysis('analysis-123');

			// Assert
			expect(result.strengths).toBeDefined();
			expect(Array.isArray(result.strengths)).toBe(true);
		});

		it('should generate conversation seeds for next week', async () => {
			// Arrange
			const progress = createMockProgress({
				topicsThatSparkedJoy: ['food', 'cooking']
			});
			const week = createMockWeek();

			let capturedSeeds: any[];

			mockDb.update.mockImplementation(() => ({
				set: vi.fn().mockImplementation((values) => {
					if (values.generatedSeeds) {
						capturedSeeds = values.generatedSeeds;
					}
					return {
						where: vi.fn().mockReturnValue({
							returning: vi.fn().mockResolvedValue([
								{
									id: 'analysis-123',
									status: 'completed',
									generatedSeeds: values.generatedSeeds ?? []
								}
							])
						})
					};
				})
			}));

			mockDb.query.weeklyAnalysis.findFirst.mockResolvedValue({
				id: 'analysis-123',
				weekProgressId: progress.id
			});

			mockDb.query.weekProgress.findFirst.mockResolvedValue(progress);
			mockDb.query.adaptiveWeeks.findFirst.mockResolvedValue(week);
			mockDb.query.messages.findMany.mockResolvedValue([]);

			// Act
			const result = await service.processAnalysis('analysis-123');

			// Assert
			expect(result.generatedSeeds).toBeDefined();
			expect((result.generatedSeeds as any[]).length).toBeGreaterThan(0);
		});

		it('should generate encouraging summary message', async () => {
			// Arrange
			const progress = createMockProgress({
				sessionsCompleted: 5,
				totalMinutes: '35'
			});
			const week = createMockWeek();

			mockDb.update.mockImplementation(() => ({
				set: vi.fn().mockImplementation((values) => ({
					where: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([
							{
								id: 'analysis-123',
								status: 'completed',
								weekSummary: values.weekSummary,
								encouragementMessage: values.encouragementMessage
							}
						])
					})
				}))
			}));

			mockDb.query.weeklyAnalysis.findFirst.mockResolvedValue({
				id: 'analysis-123',
				weekProgressId: progress.id
			});

			mockDb.query.weekProgress.findFirst.mockResolvedValue(progress);
			mockDb.query.adaptiveWeeks.findFirst.mockResolvedValue(week);
			mockDb.query.messages.findMany.mockResolvedValue([]);

			// Act
			const result = await service.processAnalysis('analysis-123');

			// Assert
			expect(result.weekSummary).toBeDefined();
			expect(result.encouragementMessage).toBeDefined();
		});

		it('should set status to failed on error', async () => {
			// Arrange
			mockDb.update.mockReturnValue({
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([{ id: 'analysis-123', status: 'failed' }])
					})
				})
			});

			mockDb.query.weeklyAnalysis.findFirst.mockResolvedValue({
				id: 'analysis-123',
				weekProgressId: 'progress-123'
			});

			mockDb.query.weekProgress.findFirst.mockResolvedValue(null); // Will cause error

			// Act & Assert
			await expect(service.processAnalysis('analysis-123')).rejects.toThrow();
		});
	});

	// --------------------------------------------------------------------------
	// generateNextWeek
	// --------------------------------------------------------------------------

	describe('generateNextWeek', () => {
		it('should create new week with seeds from analysis', async () => {
			// Arrange
			const analysis = {
				id: 'analysis-123',
				status: 'completed',
				weekId: 'week-123',
				assignmentId: 'assign-123',
				userId: 'user-123',
				generatedSeeds: [
					{ id: 'seed-1', title: 'Weekend plans', suggestedSessionTypes: ['story-moment'] },
					{ id: 'seed-2', title: 'Favorite foods', suggestedSessionTypes: ['question-game'] }
				],
				strengths: [],
				recommendations: [],
				suggestedNextTheme: 'Last Week',
				nextWeekPreview: 'Practice past tense through storytelling',
				suggestedDifficultyAdjustment: 'maintain'
			};

			const currentWeek = createMockWeek();
			const assignment = { id: 'assign-123', currentWeekNumber: 1 };

			mockDb.query.weeklyAnalysis.findFirst.mockResolvedValue(analysis);
			mockDb.query.adaptiveWeeks.findFirst.mockResolvedValue(currentWeek);
			mockDb.query.learningPathAssignments.findFirst.mockResolvedValue(assignment);

			let capturedNextWeek: any;

			mockDb.transaction.mockImplementation(async (callback: any) => {
				const mockTx = {
					update: vi.fn().mockReturnValue({
						set: vi.fn().mockReturnValue({
							where: vi.fn().mockReturnValue({
								returning: vi.fn().mockResolvedValue([{}])
							})
						})
					}),
					insert: vi.fn().mockImplementation((table) => ({
						values: vi.fn().mockImplementation((values) => {
							if (table._.name === 'adaptive_weeks') {
								capturedNextWeek = values;
							}
							return {
								returning: vi.fn().mockResolvedValue([
									{
										id: 'week-2',
										weekNumber: 2,
										conversationSeeds: values.conversationSeeds ?? [],
										status: 'active'
									}
								])
							};
						})
					}))
				};
				return callback(mockTx);
			});

			// Act
			const result = await service.generateNextWeek('analysis-123');

			// Assert
			expect(result.weekNumber).toBe(2);
			expect(result.conversationSeeds).toHaveLength(2);
			expect(result.status).toBe('active');
		});

		it('should apply focus areas from analysis', async () => {
			// Arrange
			const analysis = {
				id: 'analysis-123',
				status: 'completed',
				weekId: 'week-123',
				assignmentId: 'assign-123',
				userId: 'user-123',
				generatedSeeds: [],
				strengths: [],
				recommendations: [
					{
						type: 'focus',
						area: 'past tense',
						description: 'Practice past tense through storytelling',
						priority: 'high'
					}
				],
				suggestedNextTheme: 'Last Week',
				nextWeekPreview: 'Practice past tense',
				suggestedDifficultyAdjustment: 'maintain'
			};

			const currentWeek = createMockWeek();
			const assignment = { id: 'assign-123', currentWeekNumber: 1 };

			mockDb.query.weeklyAnalysis.findFirst.mockResolvedValue(analysis);
			mockDb.query.adaptiveWeeks.findFirst.mockResolvedValue(currentWeek);
			mockDb.query.learningPathAssignments.findFirst.mockResolvedValue(assignment);

			let capturedFocusAreas: any[];

			mockDb.transaction.mockImplementation(async (callback: any) => {
				const mockTx = {
					update: vi.fn().mockReturnValue({
						set: vi.fn().mockReturnValue({
							where: vi.fn().mockReturnValue({
								returning: vi.fn().mockResolvedValue([{}])
							})
						})
					}),
					insert: vi.fn().mockImplementation((table) => ({
						values: vi.fn().mockImplementation((values) => {
							if (table._.name === 'adaptive_weeks') {
								capturedFocusAreas = values.focusAreas;
							}
							return {
								returning: vi.fn().mockResolvedValue([
									{
										id: 'week-2',
										focusAreas: values.focusAreas ?? []
									}
								])
							};
						})
					}))
				};
				return callback(mockTx);
			});

			// Act
			const result = await service.generateNextWeek('analysis-123');

			// Assert
			expect(result.focusAreas).toBeDefined();
		});

		it('should increment difficulty if user did well', async () => {
			// Arrange
			const analysis = {
				id: 'analysis-123',
				status: 'completed',
				weekId: 'week-123',
				assignmentId: 'assign-123',
				userId: 'user-123',
				generatedSeeds: [],
				strengths: [],
				recommendations: [],
				suggestedNextTheme: 'Moving Up',
				nextWeekPreview: 'Ready for more challenge',
				suggestedDifficultyAdjustment: 'increase'
			};

			const currentWeek = createMockWeek({
				difficultyMin: 'A1',
				difficultyMax: 'A2'
			});
			const assignment = { id: 'assign-123', currentWeekNumber: 1 };

			mockDb.query.weeklyAnalysis.findFirst.mockResolvedValue(analysis);
			mockDb.query.adaptiveWeeks.findFirst.mockResolvedValue(currentWeek);
			mockDb.query.learningPathAssignments.findFirst.mockResolvedValue(assignment);

			let capturedDifficulty: { min: string; max: string };

			mockDb.transaction.mockImplementation(async (callback: any) => {
				const mockTx = {
					update: vi.fn().mockReturnValue({
						set: vi.fn().mockReturnValue({
							where: vi.fn().mockReturnValue({
								returning: vi.fn().mockResolvedValue([{}])
							})
						})
					}),
					insert: vi.fn().mockImplementation((table) => ({
						values: vi.fn().mockImplementation((values) => {
							if (table._.name === 'adaptive_weeks') {
								capturedDifficulty = {
									min: values.difficultyMin,
									max: values.difficultyMax
								};
							}
							return {
								returning: vi.fn().mockResolvedValue([
									{
										id: 'week-2',
										difficultyMin: values.difficultyMin,
										difficultyMax: values.difficultyMax
									}
								])
							};
						})
					}))
				};
				return callback(mockTx);
			});

			// Act
			const result = await service.generateNextWeek('analysis-123');

			// Assert
			expect(result.difficultyMin).toBe('A2');
			expect(result.difficultyMax).toBe('B1');
		});

		it('should mark previous week as completed', async () => {
			// Arrange
			const analysis = {
				id: 'analysis-123',
				status: 'completed',
				weekId: 'week-123',
				assignmentId: 'assign-123',
				userId: 'user-123',
				generatedSeeds: [],
				strengths: [],
				recommendations: [],
				suggestedNextTheme: 'Week 2',
				nextWeekPreview: 'Continue learning',
				suggestedDifficultyAdjustment: 'maintain'
			};

			const currentWeek = createMockWeek({ status: 'active' });
			const assignment = { id: 'assign-123', currentWeekNumber: 1 };

			mockDb.query.weeklyAnalysis.findFirst.mockResolvedValue(analysis);
			mockDb.query.adaptiveWeeks.findFirst.mockResolvedValue(currentWeek);
			mockDb.query.learningPathAssignments.findFirst.mockResolvedValue(assignment);

			let weekStatusUpdated = false;

			mockDb.transaction.mockImplementation(async (callback: any) => {
				const mockTx = {
					update: vi.fn().mockImplementation((table) => ({
						set: vi.fn().mockImplementation((values) => {
							if (table._.name === 'adaptive_weeks' && values.status === 'completed') {
								weekStatusUpdated = true;
							}
							return {
								where: vi.fn().mockReturnValue({
									returning: vi.fn().mockResolvedValue([{}])
								})
							};
						})
					})),
					insert: vi.fn().mockReturnValue({
						values: vi.fn().mockReturnValue({
							returning: vi.fn().mockResolvedValue([{ id: 'week-2' }])
						})
					})
				};
				return callback(mockTx);
			});

			// Act
			await service.generateNextWeek('analysis-123');

			// Assert
			expect(weekStatusUpdated).toBe(true);
		});

		it('should throw if analysis not completed', async () => {
			// Arrange
			mockDb.query.weeklyAnalysis.findFirst.mockResolvedValue({
				id: 'analysis-123',
				status: 'pending'
			});

			// Act & Assert
			await expect(service.generateNextWeek('analysis-123')).rejects.toThrow(
				'Analysis not completed'
			);
		});
	});
});
