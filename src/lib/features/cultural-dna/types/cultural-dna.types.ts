// 🧬 Cultural DNA Types
// Type definitions for the viral Cultural Conversation DNA feature

import type { Language } from '$lib/server/db/types';

// Core DNA result structure
export interface CulturalDNA {
	id: string;
	userId?: string;
	personalityType: string;
	culturalMix: CulturalMix[];
	traits: ConversationTraits;
	compatibility: CulturalCompatibility;
	createdAt: Date;
	shareableData: ShareableData;
}

// Cultural composition (e.g., 60% German + 40% Japanese)
export interface CulturalMix {
	culture: CultureType;
	percentage: number;
	dominantTraits: string[];
}

// Conversation personality traits
export interface ConversationTraits {
	conflictStyle: 'direct' | 'diplomatic' | 'avoidant' | 'harmonious';
	emotionalExpression: 'reserved' | 'warm' | 'expressive' | 'dramatic';
	decisionMaking: 'individual' | 'collaborative' | 'hierarchical' | 'consensus';
	formalityLevel: 'casual' | 'balanced' | 'formal' | 'ceremonial';
	communicationPace: 'slow' | 'moderate' | 'fast' | 'rapid';
}

// Cultural compatibility analysis
export interface CulturalCompatibility {
	perfectMatches: CultureType[];
	goodMatches: CultureType[];
	growthAreas: CultureType[];
	travelCompatibility: TravelCompatibility[];
	relationshipStyle: RelationshipStyle;
}

// Travel/cultural comfort zones
export interface TravelCompatibility {
	culture: CultureType;
	compatibilityScore: number; // 0-100
	reason: string;
	tips?: string;
}

// Relationship compatibility insights
export interface RelationshipStyle {
	strengths: string[];
	challenges: string[];
	idealPartnerTraits: string[];
	communicationTips: string[];
}

// Data optimized for sharing
export interface ShareableData {
	headline: string; // "The Diplomatic Warrior"
	personalityType: string; // "The Diplomatic Warrior"
	culturalMixSummary: string; // "60% German + 40% Japanese"
	oneLineSummary: string; // "Direct but thoughtful, efficient but kind"
	shareUrl: string;
	imageUrl?: string;
	hashtags: string[];
}

// Supported cultures with personality mappings (basic + hyper-specific)
export type CultureType =
	| 'german' | 'japanese' | 'spanish' | 'italian' | 'french'
	| 'british' | 'american' | 'brazilian' | 'korean' | 'chinese'
	| 'scandinavian' | 'dutch' | 'mexican' | 'canadian' | 'australian'
	// Hyper-specific culture types for viral appeal
	| 'london_tube_commuter' | 'brooklyn_hipster' | 'silicon_valley_optimist' | 'australian_larrikin'
	| 'berlin_efficiency_expert' | 'bavarian_gemutlichkeit' | 'hamburg_maritime_direct'
	| 'parisian_intellectual' | 'lyon_food_critic' | 'nice_vacation_philosopher'
	| 'madrid_night_owl' | 'barcelona_creative' | 'seville_family_gatherer'
	| 'milanese_fashion_critic' | 'roman_storyteller' | 'neapolitan_passionate'
	| 'tokyo_salaryman' | 'kyoto_traditional_diplomat' | 'osaka_comedian'
	| 'beijing_authority_respecter' | 'shanghai_business_networker' | 'guangzhou_pragmatic_trader'
	| 'seoul_hierarchical_perfectionist' | 'busan_coastal_direct' | 'jeju_island_peaceful'
	| 'lisbon_melancholic_poet' | 'rio_beach_philosopher' | 'sao_paulo_hustle_culture'
	| 'dubai_international_connector' | 'cairo_storytelling_historian' | 'marrakech_hospitality_master'
	| 'amsterdam_blunt_cyclist' | 'istanbul_bridge_cultural' | 'mumbai_bollywood_dramatic'
	| 'moscow_stoic_survivor' | 'hanoi_family_consensus' | 'manila_relationship_harmony'
	| 'jakarta_humble_community';

// Viral assessment scenarios
export interface ViralScenario {
	id: string;
	title: string;
	description: string;
	situation: string;
	context: string;
	targetLanguages?: string[];
	analysisWeights: {
		conflictStyle: number;
		emotionalExpression: number;
		decisionMaking: number;
		formalityLevel: number;
		communicationPace: number;
	};
}

// Assessment session state
export interface DNAAssessmentSession {
	sessionId: string;
	currentScenario: number;
	totalScenarios: number;
	selectedLanguage: Language;
	responses: ScenarioResponse[];
	startTime: Date;
	isComplete: boolean;
}

// Response to each scenario
export interface ScenarioResponse {
	scenarioId: string;
	audioTranscript: string;
	responseTime: number; // seconds
	analysisNotes?: string;
	culturalIndicators: Partial<ConversationTraits>;
}

// Pre-defined personality archetypes
export interface DNAPersonalityType {
	id: string;
	name: string; // "The Diplomatic Warrior", "The Warm Strategist"
	description: string;
	culturalMix: CulturalMix[];
	traits: ConversationTraits;
	famous_examples?: string[]; // "Angela Merkel meets Marie Kondo"
	relationship_style: string;
	career_strengths: string[];
}

// Share link data for viral distribution
export interface ShareLinkData {
	dnaId: string;
	personalityType: string;
	culturalMix: string;
	shareText: string;
	platform: 'instagram' | 'tiktok' | 'twitter' | 'whatsapp' | 'link';
}