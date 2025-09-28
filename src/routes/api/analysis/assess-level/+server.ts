import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { analysisPipelineService } from '$lib/features/analysis/services/analysis-pipeline.service';

interface AssessLevelPayload {
	conversationId?: string;
	languageCode: string;
	messages: Array<{
		id: string;
		role: 'user' | 'assistant' | 'system';
		content: string;
		timestamp?: string;
	}>;
	includeRecommendations?: boolean;
}

export const POST: RequestHandler = async ({ request, locals }) => {
	const userId = locals.user?.id ?? null;

	try {
		const body = (await request.json()) as AssessLevelPayload;

		if (!body?.languageCode) {
			return json({ error: 'languageCode is required' }, { status: 400 });
		}

		if (!body.messages || body.messages.length === 0) {
			return json({ error: 'messages array is required' }, { status: 400 });
		}

		// Run only the language level assessment module
		const run = await analysisPipelineService.runAnalysis({
			conversationId: body.conversationId || `assessment_${Date.now()}`,
			languageCode: body.languageCode,
			moduleIds: ['language-level-assessment'],
			userId: userId ?? undefined,
			messagesOverride: body.messages.map((msg) => ({
				id: msg.id,
				role: msg.role,
				content: msg.content,
				timestamp: msg.timestamp ? new Date(msg.timestamp) : undefined
			}))
		});

		const assessmentResult = run.moduleResults[0];

		if (!assessmentResult) {
			return json({ error: 'Assessment failed to run' }, { status: 500 });
		}

		// Extract key information for easy consumption
		const assessment = assessmentResult.details?.assessment;
		const practicalLevelDescription = assessmentResult.details?.practicalLevelDescription;
		const confidenceLevel = assessmentResult.details?.confidenceLevel;

		const response = {
			success: true,
			assessment: {
				runId: run.runId,
				timestamp: run.completedAt,
				currentLevel: assessment?.currentLevel,
				suggestedNextLevel: assessment?.suggestedNextLevel,
				practicalDescription: practicalLevelDescription,
				confidenceLevel,
				strengthAreas: assessment?.strengthAreas || [],
				growthAreas: assessment?.growthAreas || [],
				confidenceIndicators: assessment?.confidenceIndicators || [],
				recommendedScenarios: assessment?.recommendedScenarios || []
			},
			rawResult: body.includeRecommendations ? assessmentResult : undefined
		};

		return json(response);
	} catch (error) {
		console.error('Failed to assess language level', error);
		return json(
			{
				error: error instanceof Error ? error.message : 'Assessment failed',
				details: error instanceof Error ? error.stack : undefined
			},
			{ status: 500 }
		);
	}
};