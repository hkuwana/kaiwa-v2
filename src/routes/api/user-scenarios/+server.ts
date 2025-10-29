import { json, type RequestHandler } from '@sveltejs/kit';
import { createErrorResponse } from '$lib/types/api';
import type { ScenarioWithHints } from '$lib/data/scenarios';
import type { ScenarioVisibility } from '$lib/services/scenarios/user-scenarios.service';
import {
	createUserScenario,
	listUserScenariosForUser,
	ScenarioLimitError
} from '$lib/server/services/scenarios/user-scenarios.server';
import { createSchema, querySchema } from './validation';

export const GET: RequestHandler = async ({ locals, url }) => {
	const user = locals.user;
	if (!user) {
		return json(createErrorResponse('Unauthorized'), { status: 401 });
	}

	const params = querySchema.safeParse(Object.fromEntries(url.searchParams));
	if (!params.success) {
		return json(createErrorResponse('Invalid query parameters'), { status: 400 });
	}

	try {
		const response = await listUserScenariosForUser({
			userId: user.id,
			visibility: params.data.visibility
		});

		return json(response);
	} catch (error) {
		console.error('Failed to list user scenarios', error);
		return json(createErrorResponse('Internal server error'), { status: 500 });
	}
};

export const POST: RequestHandler = async ({ locals, request }) => {
	const user = locals.user;
	if (!user) {
		return json(createErrorResponse('Unauthorized'), { status: 401 });
	}

	let rawBody: unknown;
	try {
		rawBody = await request.json();
	} catch {
		return json(createErrorResponse('Invalid JSON body'), { status: 400 });
	}

	const body = createSchema.safeParse(rawBody);

	if (!body.success) {
		console.warn('Invalid scenario payload', body.error.flatten());
		return json(createErrorResponse('Invalid scenario payload'), {
			status: 400
		});
	}

	try {
		const summary = await createUserScenario({
			userId: user.id,
			scenario: body.data.scenario as ScenarioWithHints,
			visibility: body.data.visibility as ScenarioVisibility | undefined
		});

		return json(summary, { status: 201 });
	} catch (error) {
		if (error instanceof ScenarioLimitError) {
			return json(createErrorResponse(error.message), { status: 403 });
		}

		console.error('Failed to create user scenario', error);
		return json(createErrorResponse('Internal server error'), { status: 500 });
	}
};
