import { messagesRepository } from '$lib/server/repositories/messages.repository';
import { getAnalysisModule, listAnalysisModules } from './module-registry';
import type {
	AnalysisModuleContext,
	AnalysisModuleDefinition,
	AnalysisModuleId,
	AnalysisModuleResult
} from '../types/analysis-module.types';

type PipelineMessage = {
	id: string;
	role: 'user' | 'assistant' | 'system';
	content: string;
	timestamp?: Date;
};

export interface AnalysisPipelineOptions {
	conversationId: string;
	languageCode: string;
	moduleIds?: AnalysisModuleId[];
	userId?: string;
	messagesOverride?: PipelineMessage[];
}

export interface AnalysisPipelineRun {
	runId: string;
	conversationId: string;
	moduleResults: AnalysisModuleResult[];
	startedAt: Date;
	completedAt: Date;
	languageCode: string;
}

export class AnalysisPipelineService {
	async runAnalysis(options: AnalysisPipelineOptions): Promise<AnalysisPipelineRun> {
		const modules = this.resolveModules(options.moduleIds);

		const sourceMessages: PipelineMessage[] = options.messagesOverride
			? options.messagesOverride
			: (await messagesRepository.getConversationMessages(options.conversationId)).map((msg) => ({
					id: msg.id,
					role: msg.role,
					content: msg.content,
					timestamp: msg.timestamp ?? undefined
				}));

		if (!sourceMessages || sourceMessages.length === 0) {
			throw new Error('No conversation messages found for analysis');
		}

		const normalizedMessages: AnalysisModuleContext['messages'] = sourceMessages.map((msg) => ({
			id: msg.id,
			role: msg.role,
			content: msg.content,
			timestamp: msg.timestamp ?? undefined
		}));

		const context: AnalysisModuleContext = {
			conversationId: options.conversationId,
			languageCode: options.languageCode,
			messages: normalizedMessages,
			userId: options.userId
		};

		const startedAt = new Date();
		const moduleResults = await Promise.all(
			modules.map(async (module) => {
				try {
					const result = await module.run(context);
					return result;
				} catch (error) {
					return {
						moduleId: module.id,
						summary: error instanceof Error ? error.message : 'Module failed',
						details: { error: String(error) }
					};
				}
			})
		);

		return {
			runId: `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
			conversationId: options.conversationId,
			moduleResults,
			startedAt,
			completedAt: new Date(),
			languageCode: options.languageCode
		};
	}

	listAvailableModules(): AnalysisModuleDefinition[] {
		return listAnalysisModules();
	}

	private resolveModules(moduleIds?: AnalysisModuleId[]): AnalysisModuleDefinition[] {
		if (!moduleIds || moduleIds.length === 0) {
			return listAnalysisModules().filter((module) => module.modality === 'text');
		}

		return moduleIds.map((moduleId) => getAnalysisModule(moduleId));
	}
}

export const analysisPipelineService = new AnalysisPipelineService();
