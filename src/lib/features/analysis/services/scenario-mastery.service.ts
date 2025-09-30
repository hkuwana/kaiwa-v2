import type { ScenarioMasterySignal } from '../types/analysis-playbook.types';

export interface ScenarioMasteryQuery {
	userId: string;
	languageId: string;
	limit?: number;
}

export class ScenarioMasteryService {
	async fetchSignals(_query: ScenarioMasteryQuery): Promise<ScenarioMasterySignal[]> {
		console.warn('ScenarioMasteryService.fetchSignals is using placeholder data.');

		return [
			{
				scenarioId: 'scenario-next-step',
				title: 'Dinner with the family',
				capabilityTag: 'relationships',
				score: 0.68,
				attempts: 3,
				lastCompletedAt: new Date().toISOString()
			}
		];
	}
}

export const scenarioMasteryService = new ScenarioMasteryService();
