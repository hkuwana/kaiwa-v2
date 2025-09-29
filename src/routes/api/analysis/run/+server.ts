import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { analysisPipelineService } from '$lib/features/analysis/services/analysis-pipeline.service';
import { analysisSuggestionService } from '$lib/features/analysis/services/analysis-suggestion.service';
import { analysisLogbookService } from '$lib/features/analysis/services/analysis-logbook.service';
import type { AnalysisModuleId } from '$lib/features/analysis/types/analysis-module.types';
import { userUsageRepository } from '$lib/server/repositories/user-usage.repository';
import type { AnalysisMessage } from '$lib/features/analysis/services/analysis.service';

interface RunAnalysisPayload {
	conversationId: string;
	languageCode: string;
	moduleIds?: AnalysisModuleId[];
	messages?: Array<{
		id: string;
		role: 'user' | 'assistant' | 'system';
		content: string;
		timestamp?: string;
	}>;
}

export const POST: RequestHandler = async ({ request, locals }) => {
	const userId = locals.user?.id ?? null;

	const body = (await request.json()) as RunAnalysisPayload;

	if (!body?.conversationId) {
		return json({ error: 'conversationId is required' }, { status: 400 });
	}

	if (!body.languageCode) {
		return json({ error: 'languageCode is required' }, { status: 400 });
	}

	try {
		const normalizedMessages: AnalysisMessage[] | undefined = body.messages?.map((msg) => ({
			id: msg.id,
			role: msg.role,
			content: msg.content,
			timestamp: msg.timestamp ? new Date(msg.timestamp) : undefined
		}));

		const run = await analysisPipelineService.runAnalysis({
			conversationId: body.conversationId,
			languageCode: body.languageCode,
			moduleIds: body.moduleIds,
			userId: userId ?? undefined,
			messagesOverride: normalizedMessages
		});

		const suggestions = analysisSuggestionService.extract(run, {
			runId: run.runId,
			messages: normalizedMessages ?? []
		});

		let findingDrafts = [];
		let findingsError: string | null = null;
		try {
			findingDrafts = await analysisLogbookService.buildDrafts(suggestions, {
				conversationId: body.conversationId,
				languageId: body.languageCode,
				userId: userId ?? null
			});
		} catch (draftError) {
			findingsError = draftError instanceof Error ? draftError.message : 'Failed to build findings';
		}

		if (userId) {
			await recordAnalysisUsage(userId, body.moduleIds ?? run.moduleResults.map((m) => m.moduleId));
		}

		return json({
			success: true,
			run,
			suggestions,
			findings: findingDrafts,
			findingsError
		});
	} catch (error) {
		console.error('Failed to run analysis', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Analysis failed' },
			{ status: 500 }
		);
	}
};

async function recordAnalysisUsage(userId: string, moduleIds: AnalysisModuleId[]): Promise<void> {
	if (moduleIds.length === 0) return;

	try {
		await userUsageRepository.incrementUsage(userId, {
			analysesUsed: 1
		});

		const uniqueModules = new Set<AnalysisModuleId>(moduleIds);
		const updates: Record<string, number> = {};

		uniqueModules.forEach((moduleId) => {
			switch (moduleId) {
				case 'advanced-grammar':
					updates.advancedGrammarUsed = (updates.advancedGrammarUsed || 0) + 1;
					break;
				case 'fluency-analysis':
					updates.fluencyAnalysisUsed = (updates.fluencyAnalysisUsed || 0) + 1;
					break;
				case 'onboarding-profile':
					updates.onboardingProfileUsed = (updates.onboardingProfileUsed || 0) + 1;
					break;
				case 'pronunciation-analysis':
					updates.pronunciationAnalysisUsed = (updates.pronunciationAnalysisUsed || 0) + 1;
					break;
				case 'speech-rhythm':
					updates.speechRhythmUsed = (updates.speechRhythmUsed || 0) + 1;
					break;
				case 'quick-stats':
				case 'grammar-suggestions':
				case 'phrase-suggestions':
				default:
					updates.basicAnalysesUsed = (updates.basicAnalysesUsed || 0) + 1;
			}
		});

		await userUsageRepository.incrementUsage(userId, updates);
	} catch (error) {
		console.warn('Failed to record analysis usage', error);
	}
}
