import { json, type RequestHandler } from '@sveltejs/kit';
import { createErrorResponse } from '$lib/types/api';
import type { ScenarioWithHints } from '$lib/data/scenarios';
import {
	deleteUserScenario,
	getUserScenarioDetail,
	updateUserScenario,
	ScenarioLimitError,
	ScenarioNotFoundError
} from '$lib/server/services/scenarios/user-scenarios.server';
import { updateSchema } from '../validation';

export const GET: RequestHandler = async ({ locals, params }) => {
	const user = locals.user;
	if (!user) {
		return json(createErrorResponse('Unauthorized'), { status: 401 });
	}

	const scenarioId = params.id;

	try {
		const record = await getUserScenarioDetail({
			userId: user.id,
			scenarioId
		});

		const scenarioPayload = {
			...record,
			learningObjectives: record.learningObjectives ?? [],
			comfortIndicators: record.comfortIndicators ?? undefined,
			persona: record.persona ?? undefined,
			difficultyRating: record.difficultyRating ?? undefined,
			cefrLevel: record.cefrLevel ?? undefined,
			learningGoal: record.learningGoal ?? undefined,
			cefrRecommendation: record.cefrRecommendation ?? undefined,
			createdAt: record.createdAt.toISOString(),
			updatedAt: record.updatedAt.toISOString()
		};

		return json({
			summary: {
				id: record.id,
				title: record.title,
				role: record.role,
				visibility: record.visibility,
				createdAt: record.createdAt.toISOString(),
				updatedAt: record.updatedAt.toISOString(),
				usageCount: record.usageCount
			},
			scenario: scenarioPayload
		});
	} catch (error) {
		if (error instanceof ScenarioNotFoundError) {
			return json(createErrorResponse(error.message), { status: 404 });
		}

		console.error('Failed to fetch user scenario', error);
		return json(createErrorResponse('Internal server error'), { status: 500 });
	}
};

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
	const user = locals.user;
	if (!user) {
		return json(createErrorResponse('Unauthorized'), { status: 401 });
	}

	let payload: unknown;
	try {
		payload = await request.json();
	} catch {
		return json(createErrorResponse('Invalid JSON body'), { status: 400 });
	}

	const parsed = updateSchema.safeParse(payload);
	if (!parsed.success) {
		console.warn('Invalid scenario update payload', parsed.error.flatten());
		return json(createErrorResponse('Invalid scenario payload'), { status: 400 });
	}

	try {
		const summary = await updateUserScenario({
			userId: user.id,
			scenarioId: params.id,
			scenario: parsed.data.scenario as ScenarioWithHints | undefined,
			visibility: parsed.data.visibility
		});

		return json(summary);
	} catch (error) {
		if (error instanceof ScenarioLimitError) {
			return json(createErrorResponse(error.message), { status: 403 });
		}

		if (error instanceof ScenarioNotFoundError) {
			return json(createErrorResponse(error.message), { status: 404 });
		}

		console.error('Failed to update user scenario', error);
		return json(createErrorResponse('Internal server error'), { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	const user = locals.user;
	if (!user) {
		return json(createErrorResponse('Unauthorized'), { status: 401 });
	}

	try {
		await deleteUserScenario({
			userId: user.id,
			scenarioId: params.id
		});

		return json({ deleted: true });
	} catch (error) {
		if (error instanceof ScenarioNotFoundError) {
			return json(createErrorResponse(error.message), { status: 404 });
		}

		console.error('Failed to delete user scenario', error);
		return json(createErrorResponse('Internal server error'), { status: 500 });
	}
};
