import type { AnalysisRunResult } from './analysis.service';
import type {
	GrowthPlaybook,
	GrowthPlaybookInput,
	GrowthPlaybookPersona,
	ScenarioMasterySignal
} from '../types/analysis-playbook.types';

interface BuildOptions {
	persona?: GrowthPlaybookPersona;
	scenarioMastery?: ScenarioMasterySignal[];
}

export class GrowthPlaybookService {
	buildFromAnalysis(run: AnalysisRunResult | null, options: BuildOptions = {}): GrowthPlaybook {
		const persona = options.persona ?? 'relationship-navigator';

		const moduleHeadline =
			run?.results?.[0]?.summary ?? 'Stay confident—your conversations are building momentum.';
		const capabilityTag = run?.results?.[0]?.moduleId ?? 'conversation-confidence';

		const recommendation = this.pickNextScenario(options.scenarioMastery);

		return {
			persona,
			celebration: {
				headline: this.formatCelebrationHeadline(persona, moduleHeadline),
				supporting: this.buildSupportingCopy(run),
				capabilityTag,
				confidenceScore: run?.results?.[0]?.confidence
			},
			recommendation,
			masterySignals: recommendation?.seedSignals ?? options.scenarioMastery,
			sharePrompt: this.composeSharePrompt(persona, recommendation?.title, moduleHeadline),
			metadata: {
				runId: run?.runId,
				generatedAt: new Date().toISOString()
			}
		};
	}

	buildCustom(input: GrowthPlaybookInput): GrowthPlaybook {
		const primarySummary = input.analysisSummary?.moduleSummaries?.[0];

		return {
			persona: input.persona,
			celebration: {
				headline: primarySummary?.headline ?? 'Confident progress detected',
				supporting:
					primarySummary?.detail ??
					`You are meeting your ${input.analysisSummary?.confidenceAverages ?? 'recent'} goals—keep applying it to real conversations.`,
				capabilityTag: primarySummary?.moduleId,
				confidenceScore: primarySummary?.confidence
			},
			recommendation: this.pickNextScenario(input.scenarioMastery),
			masterySignals: input.scenarioMastery,
			sharePrompt: this.composeSharePrompt(
				input.persona,
				input.scenarioMastery?.[0]?.title,
				primarySummary?.headline
			),
			metadata: {
				usageSignals: input.usageSignals
			}
		};
	}

	private pickNextScenario(signals?: ScenarioMasterySignal[]) {
		if (!signals || signals.length === 0) return undefined;
		const top = [...signals].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
		if (!top) return undefined;

		return {
			scenarioId: top.scenarioId,
			title: top.title,
			difficultyLabel: top.capabilityTag ?? 'next-up',
			reason:
				"You're ready to stretch this scenario again with fresh twists—build on the confidence you just showed.",
			ctaLabel: 'Launch next conversation',
			seedSignals: signals
		};
	}

	private formatCelebrationHeadline(persona: GrowthPlaybookPersona, defaultHeadline: string) {
		if (persona === 'relationship-navigator') {
			return defaultHeadline.includes('relationship')
				? defaultHeadline
				: 'You just made that conversation feel more natural—your partner will feel it next time.';
		}

		if (persona === 'expat-survivor') {
			return 'You pushed past the awkward moment—Tokyo just got easier.';
		}

		return defaultHeadline;
	}

	private buildSupportingCopy(run: AnalysisRunResult | null) {
		if (!run) {
			return 'Kaiwa will keep tracking your momentum—jump back in for another real scenario.';
		}

		const highlights = run.results
			.filter((result) => Boolean(result.summary))
			.slice(0, 2)
			.map((result) => result.summary.trim());

		if (highlights.length === 0) {
			return 'Keep practicing—each conversation boosts your survival instinct.';
		}

		return highlights.join(' • ');
	}

	private composeSharePrompt(
		persona: GrowthPlaybookPersona,
		leadScenario?: string,
		headline?: string
	) {
		const scenarioName = leadScenario ?? 'today’s win';
		const subjectBase = headline ?? 'I just unlocked a real conversation win';

		return {
			label: 'Share momentum',
			subject: subjectBase,
			body:
				persona === 'relationship-navigator'
					? `Kaiwa just showed me a new way to talk through ${scenarioName}. Want to practice it with me?`
					: `Kaiwa just flagged ${scenarioName} as my next stretch scenario. You’ll appreciate how real it feels.`,
			cta: {
				label: 'Invite a friend'
			}
		};
	}
}

export const growthPlaybookService = new GrowthPlaybookService();
