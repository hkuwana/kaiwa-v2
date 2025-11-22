import { logger } from '$lib/logger';
import { scenariosData } from '$lib/data/scenarios';
import { scenarioRepository } from '$lib/server/repositories/scenario.repository';
import { buildGhibliBackgroundPrompt } from '$lib/server/prompts/scenario-backgrounds';
import type { Scenario } from '$lib/server/db/types';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	let liveScenarios: Scenario[] = [];

	try {
		liveScenarios = await scenarioRepository.findActiveScenarios(500);
	} catch (error) {
		logger.error('Failed to fetch scenarios from DB for /dev/scenarios, falling back to seed data', error);
	}

	const source = liveScenarios.length ? liveScenarios : scenariosData.filter((scenario) => scenario.isActive);

	const scenarioPrompts = source
		.map((scenario) => ({
			id: scenario.id,
			title: scenario.title,
			description: scenario.description,
			role: scenario.role,
			difficulty: scenario.difficulty,
			tags: scenario.tags ?? [],
			prompt: buildGhibliBackgroundPrompt(scenario)
		}))
		.sort((a, b) => a.title.localeCompare(b.title));

	return {
		scenarioPrompts
	};
};
