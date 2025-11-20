import { error } from '@sveltejs/kit';
import { scenarioRepository } from '$lib/server/repositories';
import { scenariosData } from '$lib/data/scenarios';
import type { Scenario } from '$lib/server/db/types';

export const load = async ({ params }) => {
	const { shareSlug } = params;

	// First, try to find in static scenarios data by shareSlug or ID
	let scenario: Scenario | undefined = scenariosData.find(
		(s) => s.shareSlug === shareSlug || s.id === shareSlug
	);

	// If not found in static data, try database
	if (!scenario) {
		scenario = await scenarioRepository.findScenarioByIdOrSlug(shareSlug);
	}

	// If still not found, return 404
	if (!scenario) {
		throw error(404, 'Scenario not found');
	}

	// Return the scenario data
	return {
		scenario
	};
};
