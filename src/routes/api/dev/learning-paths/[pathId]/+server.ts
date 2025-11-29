// src/routes/api/dev/learning-paths/[pathId]/+server.ts

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { learningPathRepository } from '$lib/server/repositories/learning-path.repository';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const { pathId } = params;

		const path = await learningPathRepository.findPathById(pathId);

		if (!path) {
			return json({ success: false, error: 'Path not found' }, { status: 404 });
		}

		return json({
			success: true,
			path
		});
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (error: any) {
		return json({ success: false, error: error.message }, { status: 500 });
	}
};
