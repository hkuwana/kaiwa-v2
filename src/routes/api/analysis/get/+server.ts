import { logger } from '$lib/logger';
import { json } from '@sveltejs/kit';
import { analysisFindingsRepository } from '$lib/server/repositories/analysis-findings.repository';
import { analysisSuggestionService } from '$lib/features/analysis/services/analysis-suggestion.service';
import type { AnalysisRunResult } from '$lib/features/analysis/services/analysis.service';
import type { AnalysisSuggestion } from '$lib/features/analysis/types/analysis-suggestion.types';

interface GetAnalysisPayload {
	conversationId: string;
}

/**
 * Fetch the latest analysis results for a conversation
 * Reconstructs the analysis run from persisted findings
 */
export const GET = async ({ url, locals }) => {
	const conversationId = url.searchParams.get('conversationId');

	if (!conversationId) {
		return json({ error: 'conversationId is required' }, { status: 400 });
	}

	try {
		// Fetch all findings for this conversation
		const findings = await analysisFindingsRepository.listFindingsForConversation(conversationId);

		if (findings.length === 0) {
			return json({ success: false, run: null, suggestions: null });
		}

		// Group findings by runId to identify the latest run
		const findingsByRun = new Map<string | null, typeof findings>();
		for (const finding of findings) {
			const runId = finding.runId || 'default-run';
			if (!findingsByRun.has(runId)) {
				findingsByRun.set(runId, []);
			}
			findingsByRun.get(runId)!.push(finding);
		}

		// Get the latest run (most recent by createdAt)
		let latestRun: (typeof findings) = [];
		let latestRunId: string | null = null;

		for (const [runId, runFindings] of findingsByRun) {
			if (latestRun.length === 0 || runFindings[0].createdAt > latestRun[0].createdAt) {
				latestRun = runFindings;
				latestRunId = runId;
			}
		}

		// Group findings by moduleId to reconstruct module results
		const findingsByModule = new Map<string, typeof findings>();
		for (const finding of latestRun) {
			const moduleId = finding.moduleId || 'unknown';
			if (!findingsByModule.has(moduleId)) {
				findingsByModule.set(moduleId, []);
			}
			findingsByModule.get(moduleId)!.push(finding);
		}

		// Convert findings to suggestions for compatibility
		const suggestions: AnalysisSuggestion[] = latestRun.map((finding) => ({
			id: finding.id,
			ruleId: finding.featureId,
			category: finding.featureId,
			severity: finding.severity,
			messageId: finding.messageId,
			originalText: finding.originalText || '',
			suggestedText: finding.suggestedText || '',
			explanation: finding.explanation || '',
			example: finding.example || undefined,
			offsets: finding.offsetStart !== null && finding.offsetEnd !== null
				? { start: finding.offsetStart, end: finding.offsetEnd }
				: undefined
		}));

		// Reconstruct module results from findings
		const moduleResults = Array.from(findingsByModule.entries()).map(([moduleId, moduleFinding]) => {
			// Get aggregated data from findings
			const suggestions = moduleFinding.map((f) => ({
				messageId: f.messageId,
				originalText: f.originalText,
				suggestedText: f.suggestedText,
				explanation: f.explanation,
				example: f.example,
				severity: f.severity
			}));

			// Create summary based on module type
			let summary = '';
			if (moduleId === 'grammar-suggestions') {
				summary = `Found ${moduleFinding.length} language suggestions`;
			} else if (moduleId === 'quick-stats') {
				summary = `Analyzed conversation`;
			} else if (moduleId === 'language-assessment') {
				summary = `Language assessment completed`;
			} else {
				summary = `${moduleId} analysis complete`;
			}

			return {
				moduleId,
				summary,
				recommendations: [], // Could extract from metadata if needed
				data: {
					suggestions
				}
			};
		});

		// Reconstruct the analysis run
		const reconstructedRun: AnalysisRunResult = {
			runId: latestRunId || 'run-from-db',
			conversationId,
			moduleResults,
			startedAt: latestRun[latestRun.length - 1]?.createdAt || new Date(),
			completedAt: latestRun[0]?.createdAt || new Date(),
			languageCode: 'unknown' // We might need to fetch this from conversation data
		};

		return json({
			success: true,
			run: reconstructedRun,
			suggestions,
			isFromStorage: true,
			analysisDate: latestRun[0]?.createdAt
		});
	} catch (error) {
		logger.error('Failed to fetch analysis', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to fetch analysis' },
			{ status: 500 }
		);
	}
};
