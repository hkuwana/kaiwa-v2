import { userScenarioProgressRepository, scenarioRepository } from '$lib/server/repositories';

export const load = async ({ locals }) => {
	const userId = locals.user?.id;

	if (!userId || userId === 'guest') {
		// Guest user - no saved scenarios or user-created scenarios
		return {
			savedScenarioIds: [],
			userCreatedScenarios: [],
			conversationCount: 0
		};
	}

	try {
		// Load user's saved scenarios
		const savedProgress = await userScenarioProgressRepository.getUserSavedScenarios(userId, {
			limit: 100
		});
		const savedScenarioIds = savedProgress.map((p) => p.scenarioId);

		// Load user's created scenarios
		const userCreatedScenarios = await scenarioRepository.listUserScenarios({
			userId,
			includeInactive: false
		});

		// TODO: Get conversation count for suggesting scenarios after 3 conversations
		// For now, just hardcode 0
		const conversationCount = 0;

		return {
			savedScenarioIds,
			userCreatedScenarios,
			conversationCount
		};
	} catch (error) {
		console.error('Error loading scenario data:', error);
		return {
			savedScenarioIds: [],
			userCreatedScenarios: [],
			conversationCount: 0
		};
	}
};
