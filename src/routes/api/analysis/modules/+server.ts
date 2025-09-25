import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { analysisPipelineService } from '$lib/features/analysis/services/analysis-pipeline.service';

export const GET: RequestHandler = async () => {
	const modules = analysisPipelineService.listAvailableModules().map((module) => ({
		id: module.id,
		label: module.label,
		description: module.description,
		modality: module.modality,
		tier: module.tier,
		requiresAudio: module.requiresAudio ?? false
	}));

	return json({ modules });
};
