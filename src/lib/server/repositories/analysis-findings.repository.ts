import { and, desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { analysisFindings } from '$lib/server/db/schema/analysis-findings';
import type {
	AnalysisFinding,
	NewAnalysisFinding,
	AnalysisFindingAction
} from '$lib/server/db/types';

export class AnalysisFindingsRepository {
	async createFinding(finding: NewAnalysisFinding): Promise<AnalysisFinding> {
		const [created] = await db.insert(analysisFindings).values(finding).returning();
		return created;
	}

	async bulkInsert(findings: NewAnalysisFinding[]): Promise<AnalysisFinding[]> {
		if (findings.length === 0) return [];
		const inserted = await db.insert(analysisFindings).values(findings).returning();
		return inserted;
	}

	async updateActionStatus(
		id: string,
		action: AnalysisFindingAction
	): Promise<AnalysisFinding | null> {
		const [updated] = await db
			.update(analysisFindings)
			.set({ actionStatus: action, actionUpdatedAt: new Date() })
			.where(eq(analysisFindings.id, id))
			.returning();
		return updated ?? null;
	}

	async getFindingById(id: string): Promise<AnalysisFinding | null> {
		const result = await db
			.select()
			.from(analysisFindings)
			.where(eq(analysisFindings.id, id))
			.limit(1);
		return result[0] ?? null;
	}

	async listFindingsForConversation(conversationId: string): Promise<AnalysisFinding[]> {
		return await db
			.select()
			.from(analysisFindings)
			.where(eq(analysisFindings.conversationId, conversationId))
			.orderBy(desc(analysisFindings.createdAt));
	}

	async listRecentFindings(options: {
		userId: string;
		limit?: number;
		languageId?: string;
	}): Promise<AnalysisFinding[]> {
		const conditions = [eq(analysisFindings.userId, options.userId)];
		if (options.languageId) {
			conditions.push(eq(analysisFindings.languageId, options.languageId));
		}

		return await db
			.select()
			.from(analysisFindings)
			.where(and(...conditions))
			.orderBy(desc(analysisFindings.createdAt))
			.limit(options.limit ?? 50);
	}
}

export const analysisFindingsRepository = new AnalysisFindingsRepository();
