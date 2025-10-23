import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db/index';
import { messageAudioAnalysis } from '$lib/server/db/schema';
import type { NewMessageAudioAnalysis, MessageAudioAnalysis } from '$lib/server/db/types';

/**
 * Repository for message_audio_analysis table
 *
 * Manages detailed speech analysis results that are stored separately
 * from the main messages table for performance optimization.
 */
export class MessageAudioAnalysisRepository {
	/**
	 * Create a new audio analysis record
	 */
	async createAnalysis(analysis: NewMessageAudioAnalysis): Promise<MessageAudioAnalysis> {
		const [created] = await db.insert(messageAudioAnalysis).values(analysis).returning();
		return created;
	}

	/**
	 * Get audio analysis for a specific message
	 */
	async getByMessageId(messageId: string): Promise<MessageAudioAnalysis | null> {
		const result = await db
			.select()
			.from(messageAudioAnalysis)
			.where(eq(messageAudioAnalysis.messageId, messageId))
			.limit(1);

		return result[0] || null;
	}

	/**
	 * Get multiple analyses by message IDs
	 */
	async getByMessageIds(messageIds: string[]): Promise<MessageAudioAnalysis[]> {
		if (messageIds.length === 0) return [];

		return await db
			.select()
			.from(messageAudioAnalysis)
			.where(eq(messageAudioAnalysis.messageId, messageIds[0])); // TODO: Use IN operator when available
	}

	/**
	 * Update an existing analysis
	 */
	async updateAnalysis(
		messageId: string,
		updates: Partial<NewMessageAudioAnalysis>
	): Promise<MessageAudioAnalysis | null> {
		const [updated] = await db
			.update(messageAudioAnalysis)
			.set(updates)
			.where(eq(messageAudioAnalysis.messageId, messageId))
			.returning();

		return updated || null;
	}

	/**
	 * Delete analysis for a message
	 * Note: Cascade delete is configured, so this is automatic when message is deleted
	 */
	async deleteAnalysis(messageId: string): Promise<boolean> {
		const result = await db
			.delete(messageAudioAnalysis)
			.where(eq(messageAudioAnalysis.messageId, messageId))
			.returning({ id: messageAudioAnalysis.id });

		return result.length > 0;
	}

	/**
	 * Check if analysis exists for a message
	 */
	async hasAnalysis(messageId: string): Promise<boolean> {
		const result = await db
			.select({ id: messageAudioAnalysis.id })
			.from(messageAudioAnalysis)
			.where(eq(messageAudioAnalysis.messageId, messageId))
			.limit(1);

		return result.length > 0;
	}

	/**
	 * Get analysis with specific fields only (for performance)
	 */
	async getAnalysisSummary(messageId: string): Promise<{
		overallAccuracyScore: number | null;
		overallFluencyScore: number | null;
		speechRateWpm: number | null;
		pauseCount: number | null;
		hesitationCount: number | null;
	} | null> {
		const result = await db
			.select({
				overallAccuracyScore: messageAudioAnalysis.overallAccuracyScore,
				overallFluencyScore: messageAudioAnalysis.overallFluencyScore,
				speechRateWpm: messageAudioAnalysis.speechRateWpm,
				pauseCount: messageAudioAnalysis.pauseCount,
				hesitationCount: messageAudioAnalysis.hesitationCount
			})
			.from(messageAudioAnalysis)
			.where(eq(messageAudioAnalysis.messageId, messageId))
			.limit(1);

		return result[0] || null;
	}

	/**
	 * Get problematic words from analysis
	 */
	async getProblematicWords(messageId: string): Promise<
		Array<{
			word: string;
			issue: string;
			severity: 'low' | 'medium' | 'high';
			startMs: number;
			endMs: number;
			suggestion?: string;
		}>
	> {
		const analysis = await this.getByMessageId(messageId);
		return (analysis?.problematicWords as any) || [];
	}

	/**
	 * Get practice recommendations for a message
	 */
	async getRecommendations(messageId: string): Promise<{
		recommendations: string[];
		practiceWords: string[];
	}> {
		const analysis = await this.getByMessageId(messageId);
		return {
			recommendations: (analysis?.recommendations as string[]) || [],
			practiceWords: (analysis?.practiceWords as string[]) || []
		};
	}

	/**
	 * Batch upsert analyses (useful for reprocessing)
	 */
	async upsertAnalyses(analyses: NewMessageAudioAnalysis[]): Promise<void> {
		if (analyses.length === 0) return;

		// Note: Drizzle doesn't support batch upsert yet, so we do one at a time
		for (const analysis of analyses) {
			await db.insert(messageAudioAnalysis).values(analysis).onConflictDoUpdate({
				target: messageAudioAnalysis.messageId,
				set: analysis
			});
		}
	}
}

// Export singleton instance
export const messageAudioAnalysisRepository = new MessageAudioAnalysisRepository();
