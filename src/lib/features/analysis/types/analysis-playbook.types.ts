export type GrowthPlaybookPersona =
	| 'relationship-navigator'
	| 'expat-survivor'
	| 'career-switcher'
	| 'custom';

export interface ScenarioMasterySignal {
	scenarioId: string;
	title: string;
	capabilityTag?: string;
	score?: number;
	attempts?: number;
	lastCompletedAt?: string;
	confidenceDelta?: number;
}

export interface GrowthPlaybookCelebration {
	headline: string;
	supporting: string;
	capabilityTag?: string;
	confidenceScore?: number;
}

export interface GrowthPlaybookRecommendation {
	scenarioId: string;
	title: string;
	difficultyLabel: string;
	reason: string;
	ctaLabel: string;
	seedSignals?: ScenarioMasterySignal[];
}

export interface GrowthPlaybookSharePrompt {
	label: string;
	subject: string;
	body: string;
	cta?: {
		label: string;
		url?: string;
	};
}

export interface GrowthPlaybook {
	persona: GrowthPlaybookPersona;
	celebration: GrowthPlaybookCelebration;
	recommendation?: GrowthPlaybookRecommendation;
	masterySignals?: ScenarioMasterySignal[];
	sharePrompt?: GrowthPlaybookSharePrompt;
	metadata?: Record<string, unknown>;
}

export interface GrowthPlaybookInput {
	persona: GrowthPlaybookPersona;
	analysisSummary?: {
		confidenceAverages?: number;
		keyTakeaways?: string[];
		moduleSummaries?: Array<{
			moduleId: string;
			headline: string;
			detail?: string;
			confidence?: number;
		}>;
	};
	scenarioMastery?: ScenarioMasterySignal[];
	usageSignals?: {
		conversationsPerWeek?: number;
		lastConversationAt?: string;
	};
}
