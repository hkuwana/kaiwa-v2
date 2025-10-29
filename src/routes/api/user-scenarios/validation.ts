import { z } from 'zod';

export const visibilitySchema = z.enum(['public', 'private']);

export const comfortIndicatorsSchema = z
	.object({
		confidence: z.number().optional(),
		engagement: z.number().optional(),
		understanding: z.number().optional()
	})
	.partial()
	.optional();

export const personaSchema = z
	.object({
		title: z.string().optional(),
		nameTemplate: z.string().optional(),
		setting: z.string().optional(),
		introPrompt: z.string().optional(),
		stakes: z.string().optional()
	})
	.partial()
	.nullable()
	.optional();

export const scenarioSchema = z
	.object({
		id: z.string().min(1).optional(),
		title: z.string().min(1).max(160),
		description: z.string().optional(),
		role: z.enum(['tutor', 'character', 'friendly_chat', 'expert']),
		difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
		difficultyRating: z.number().min(1).max(8).optional(),
		cefrLevel: z.string().optional(),
		instructions: z.string().optional(),
		context: z.string().optional(),
		expectedOutcome: z.string().optional(),
		learningObjectives: z.array(z.string().max(200)).max(12).optional(),
		learningGoal: z.string().optional(),
		persona: personaSchema,
		comfortIndicators: comfortIndicatorsSchema,
		createdAt: z.union([z.string(), z.date()]).optional(),
		updatedAt: z.union([z.string(), z.date()]).optional(),
		isActive: z.boolean().optional()
	})
	.passthrough();

export const createSchema = z.object({
	scenario: scenarioSchema,
	visibility: visibilitySchema.optional()
});

export const updateSchema = z
	.object({
		scenario: scenarioSchema.optional(),
		visibility: visibilitySchema.optional()
	})
	.refine((value) => Boolean(value.scenario) || Boolean(value.visibility), {
		message: 'Must include scenario updates or visibility change.'
	});

export const querySchema = z.object({
	visibility: visibilitySchema.optional()
});
