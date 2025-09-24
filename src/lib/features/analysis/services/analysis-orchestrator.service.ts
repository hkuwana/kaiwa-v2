import type { Language, Message, UserPreferences } from '$lib/server/db/types';

import { cloneDefaultCategories, analysisCategoryConfigs } from '../config/analysis-categories.config';

type CategoryConfig = (typeof analysisCategoryConfigs)[number];
type Processor = CategoryConfig['processors'][number];
type ProcessorResult = Awaited<ReturnType<Processor>>;

type ProcessorFinding = ProcessorResult extends {
    findings: Array<infer Item>;
}
    ? Item & {
          modality?: 'text' | 'audio';
          category?: string;
          targetMessageId?: string;
          suggestedAction?: string;
          confidence?: number;
      }
    : never;

type AnalysisFinding = ProcessorFinding & {
    id: string;
    category: string;
    modality: 'text' | 'audio';
    summary: string;
};

type RunCallbacks = {
    onCategoryStart?: (config: Pick<CategoryConfig, 'id' | 'label'>) => void;
    onCategoryComplete?: (result: {
        config: Pick<CategoryConfig, 'id' | 'label'>;
        findings: AnalysisFinding[];
        durationMs: number;
        raw?: Record<string, unknown>;
        summary?: string;
    }) => void;
    onLog?: (message: string) => void;
};

type RunOptions = {
    categories?: CategoryConfig[];
    messages: Message[];
    language: Language;
    mode: 'quick' | 'full';
    preferences: Partial<UserPreferences>;
    sessionId: string;
    context?: Record<string, unknown>;
};

type RunResult = {
    snapshot: {
        meta: {
            mode: 'quick' | 'full';
            languageCode: string;
            sessionId: string;
            analysisRunId: string;
            requestedAt: Date;
            completedAt: Date;
            context?: Record<string, unknown>;
        };
        categories: string[];
        findings: AnalysisFinding[];
        logs: string[];
    };
    results: Array<{
        config: CategoryConfig;
        findings: AnalysisFinding[];
        raw?: Record<string, unknown>;
        summary?: string;
        durationMs: number;
        logs: string[];
    }>;
};

export function getDefaultAnalysisCategories() {
    return cloneDefaultCategories();
}

export async function runAnalysisOrchestrator(
    { categories = cloneDefaultCategories(), messages, language, mode, preferences, sessionId, context }: RunOptions,
    callbacks?: RunCallbacks
): Promise<RunResult> {
    const requestedAt = new Date();
    const runId = generateId();
    const logs: string[] = [];
    const aggregatedResults: RunResult['results'] = [];

    for (const category of categories) {
        callbacks?.onCategoryStart?.({ id: category.id, label: category.label });
        const categoryLogs: string[] = [];
        const started = performanceNow();
        const findings: AnalysisFinding[] = [];
        let combinedRaw: Record<string, unknown> | undefined;
        let combinedSummary: string | undefined;

        for (const processor of category.processors) {
            const result = await Promise.resolve(
                processor({ messages, language, mode, preferences, context })
            );

            if (!result) continue;

            if (Array.isArray(result.findings)) {
                result.findings.forEach((rawFinding) => {
                    const finding = rawFinding as Record<string, unknown>;

                    findings.push({
                        id: generateId(),
                        category: (finding.category as string) ?? category.id,
                        modality: (finding.modality as 'text' | 'audio') ?? (category.modality as 'text' | 'audio'),
                        summary: String(finding.summary ?? 'No summary provided'),
                        details: finding.details as Record<string, unknown> | undefined,
                        targetMessageId: finding.targetMessageId as string | undefined,
                        suggestedAction: finding.suggestedAction as string | undefined,
                        confidence:
                            typeof finding.confidence === 'number'
                                ? (finding.confidence as number)
                                : undefined
                    });
                });
            }

            if (result.raw) {
                combinedRaw = { ...(combinedRaw ?? {}), ...result.raw };
            }

            if (result.summary) {
                combinedSummary = combinedSummary
                    ? `${combinedSummary}\n${result.summary}`
                    : result.summary;
            }

            if (Array.isArray((result as { logs?: string[] }).logs)) {
                categoryLogs.push(...((result as { logs?: string[] }).logs ?? []));
            }
        }

        const durationMs = performanceNow() - started;
        const categoryResult: RunResult['results'][number] = {
            config: category,
            findings,
            raw: combinedRaw,
            summary: combinedSummary,
            durationMs,
            logs: categoryLogs
        };

        aggregatedResults.push(categoryResult);
        logs.push(`[${category.id}] completed in ${durationMs.toFixed(1)}ms`);
        categoryLogs.forEach((entry) => logs.push(`[${category.id}] ${entry}`));

        callbacks?.onCategoryComplete?.({
            config: { id: category.id, label: category.label },
            findings,
            durationMs,
            raw: combinedRaw,
            summary: combinedSummary
        });
    }

    const completedAt = new Date();

    return {
        snapshot: {
            meta: {
                mode,
                languageCode: language.code,
                sessionId,
                analysisRunId: runId,
                requestedAt,
                completedAt,
                context
            },
            categories: aggregatedResults.map((entry) => entry.config.id),
            findings: aggregatedResults.flatMap((entry) => entry.findings),
            logs
        },
        results: aggregatedResults
    };
}

function generateId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    return `analysis-${Math.random().toString(36).slice(2, 10)}`;
}

function performanceNow() {
    if (typeof performance !== 'undefined' && performance.now) {
        return performance.now();
    }
    return Date.now();
}
