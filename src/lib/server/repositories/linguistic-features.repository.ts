import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import {
	linguisticFeatures,
	linguisticFeatureAliases
} from '$lib/server/db/schema/linguistic-features';
import type {
	LinguisticFeature,
	NewLinguisticFeature,
	LinguisticFeatureAlias,
	NewLinguisticFeatureAlias,
	LinguisticMacroSkill
} from '$lib/server/db/types';

interface FeatureLookupParams {
	languageId?: string | null;
	macroSkill: LinguisticMacroSkill;
	subSkill: string;
	microRule: string;
}

interface ResolveFeatureParams extends FeatureLookupParams {
	alias?: string;
	featureIdHint?: string;
	coachingCopy?: string | null;
	metadata?: Record<string, unknown>;
	createIfMissing?: boolean;
}

export class LinguisticFeaturesRepository {
	async listFeatures(filter?: {
		languageId?: string | null;
		macroSkill?: LinguisticMacroSkill;
		onlyActive?: boolean;
	}): Promise<LinguisticFeature[]> {
		const conditions = [] as any[];
		if (filter?.languageId) {
			conditions.push(eq(linguisticFeatures.languageId, filter.languageId));
		}
		if (filter?.macroSkill) {
			conditions.push(eq(linguisticFeatures.macroSkill, filter.macroSkill));
		}
		if (filter?.onlyActive) {
			conditions.push(eq(linguisticFeatures.isActive, true));
		}

		const query = db.select().from(linguisticFeatures);
		if (conditions.length > 0) {
			query.where(and(...conditions));
		}
		return await query;
	}

	async getFeatureById(id: string): Promise<LinguisticFeature | null> {
		const result = await db
			.select()
			.from(linguisticFeatures)
			.where(eq(linguisticFeatures.id, id))
			.limit(1);
		return result[0] ?? null;
	}

	async findFeatureByKey(params: FeatureLookupParams): Promise<LinguisticFeature | null> {
		const conditions = [
			eq(linguisticFeatures.macroSkill, params.macroSkill),
			eq(linguisticFeatures.subSkill, params.subSkill),
			eq(linguisticFeatures.microRule, params.microRule)
		];
		if (params.languageId) {
			conditions.push(eq(linguisticFeatures.languageId, params.languageId));
		}

		const result = await db
			.select()
			.from(linguisticFeatures)
			.where(and(...conditions))
			.limit(1);

		return result[0] ?? null;
	}

	async createFeature(
		feature: Omit<NewLinguisticFeature, 'createdAt' | 'updatedAt'>
	): Promise<LinguisticFeature> {
		const [created] = await db.insert(linguisticFeatures).values(feature).returning();
		return created;
	}

	async findAlias(
		alias: string,
		languageId?: string | null
	): Promise<LinguisticFeatureAlias | null> {
		const conditions = [eq(linguisticFeatureAliases.alias, alias.toLowerCase())];
		if (languageId) {
			conditions.push(eq(linguisticFeatureAliases.languageId, languageId));
		}

		const result = await db
			.select()
			.from(linguisticFeatureAliases)
			.where(and(...conditions))
			.limit(1);

		return result[0] ?? null;
	}

	async createAlias(
		alias: Omit<NewLinguisticFeatureAlias, 'createdAt'>
	): Promise<LinguisticFeatureAlias> {
		const [created] = await db
			.insert(linguisticFeatureAliases)
			.values({ ...alias, alias: alias.alias.toLowerCase() })
			.returning();
		return created;
	}

	generateFeatureId(params: FeatureLookupParams & { languageId?: string | null }): string {
		const parts = [
			params.languageId || 'global',
			params.macroSkill,
			params.subSkill,
			params.microRule
		]
			.filter(Boolean)
			.map((part) => part.replace(/\s+/g, '-').toLowerCase());
		return parts.join(':');
	}

	async resolveFeature(params: ResolveFeatureParams): Promise<LinguisticFeature | null> {
		const aliasKey = params.alias?.toLowerCase();
		if (aliasKey) {
			const existingAlias = await this.findAlias(aliasKey, params.languageId ?? undefined);
			if (existingAlias) {
				return this.getFeatureById(existingAlias.featureId);
			}
		}

		const existingFeature = await this.findFeatureByKey(params);
		if (existingFeature) {
			if (aliasKey) {
				await this.createAlias({
					featureId: existingFeature.id,
					alias: aliasKey,
					languageId: params.languageId ?? null,
					notes: params.coachingCopy ?? null
				});
			}
			return existingFeature;
		}

		if (!params.createIfMissing) {
			return null;
		}

		const id = params.featureIdHint ?? this.generateFeatureId(params);
		const featurePayload: Omit<NewLinguisticFeature, 'createdAt' | 'updatedAt'> = {
			id,
			languageId: params.languageId ?? null,
			macroSkill: params.macroSkill,
			subSkill: params.subSkill,
			microRule: params.microRule,
			cefrReferences: [],
			coachingCopy: params.coachingCopy ?? null,
			isActive: true,
			metadata: params.metadata ?? {}
		};

		const created = await this.createFeature(featurePayload);
		if (aliasKey) {
			await this.createAlias({
				featureId: created.id,
				alias: aliasKey,
				languageId: params.languageId ?? null,
				notes: params.coachingCopy ?? null
			});
		}
		return created;
	}
}

export const linguisticFeaturesRepository = new LinguisticFeaturesRepository();
