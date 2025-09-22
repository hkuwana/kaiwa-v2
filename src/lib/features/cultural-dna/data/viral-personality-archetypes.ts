// 🎭 Viral Personality Archetypes
// Hyper-specific personality combinations designed for maximum shareability

import type { DNAPersonalityType } from '../types/cultural-dna.types';

// Viral personality archetypes using hyper-specific culture combinations
export const viralPersonalityArchetypes: DNAPersonalityType[] = [
	{
		id: 'efficient_zen_master',
		name: 'The Efficient Zen Master',
		description: 'Berlin productivity meets Kyoto mindfulness',
		culturalMix: [
			{
				culture: 'berlin_efficiency_expert',
				percentage: 65,
				dominantTraits: ['efficient', 'direct', 'organized']
			},
			{
				culture: 'kyoto_traditional_diplomat',
				percentage: 35,
				dominantTraits: ['thoughtful', 'respectful', 'ceremonial']
			}
		],
		traits: {
			conflictStyle: 'diplomatic',
			emotionalExpression: 'reserved',
			decisionMaking: 'individual',
			formalityLevel: 'formal',
			communicationPace: 'moderate'
		},
		famous_examples: ['Marie Kondo meets German engineering'],
		relationship_style: 'Methodically thoughtful, schedules romance with precision',
		career_strengths: ['Project management', 'Cultural consulting', 'Process optimization']
	},
	{
		id: 'passionate_strategist',
		name: 'The Passionate Strategist',
		description: 'Neapolitan fire with Shanghai business acumen',
		culturalMix: [
			{
				culture: 'neapolitan_passionate',
				percentage: 55,
				dominantTraits: ['dramatic', 'expressive', 'family-oriented']
			},
			{
				culture: 'shanghai_business_networker',
				percentage: 45,
				dominantTraits: ['strategic', 'networked', 'international']
			}
		],
		traits: {
			conflictStyle: 'direct',
			emotionalExpression: 'dramatic',
			decisionMaking: 'collaborative',
			formalityLevel: 'casual',
			communicationPace: 'rapid'
		},
		famous_examples: ['Roberto Benigni meets Jack Ma'],
		relationship_style: 'Intensely loyal, treats love like a business partnership with benefits',
		career_strengths: ['International sales', 'Event planning', 'Restaurant empire building']
	},
	{
		id: 'philosophical_hustler',
		name: 'The Philosophical Hustler',
		description: 'Parisian intellectual depth with São Paulo grind energy',
		culturalMix: [
			{
				culture: 'parisian_intellectual',
				percentage: 60,
				dominantTraits: ['sophisticated', 'analytical', 'artistic']
			},
			{
				culture: 'sao_paulo_hustle_culture',
				percentage: 40,
				dominantTraits: ['driven', 'entrepreneurial', 'coffee-powered']
			}
		],
		traits: {
			conflictStyle: 'diplomatic',
			emotionalExpression: 'expressive',
			decisionMaking: 'individual',
			formalityLevel: 'formal',
			communicationPace: 'fast'
		},
		famous_examples: ['Simone de Beauvoir meets startup founder'],
		relationship_style: 'Intellectually seductive, discusses Proust over productivity hacks',
		career_strengths: ['Strategy consulting', 'Publishing', 'Cultural entrepreneurship']
	},
	{
		id: 'humble_drama_queen',
		name: 'The Humble Drama Queen',
		description: 'Jakarta modesty with Mumbai Bollywood flair',
		culturalMix: [
			{
				culture: 'jakarta_humble_community',
				percentage: 70,
				dominantTraits: ['humble', 'community-focused', 'consensus-seeking']
			},
			{
				culture: 'mumbai_bollywood_dramatic',
				percentage: 30,
				dominantTraits: ['dramatic', 'storytelling', 'expressive']
			}
		],
		traits: {
			conflictStyle: 'harmonious',
			emotionalExpression: 'dramatic',
			decisionMaking: 'consensus',
			formalityLevel: 'casual',
			communicationPace: 'moderate'
		},
		famous_examples: ['Humble Indonesian meets Bollywood director'],
		relationship_style: 'Dramatically modest, apologizes for having feelings too intensely',
		career_strengths: ['Community organizing', 'Entertainment', 'Social media storytelling']
	},
	{
		id: 'blunt_poet',
		name: 'The Blunt Poet',
		description: 'Amsterdam directness with Lisbon melancholy',
		culturalMix: [
			{
				culture: 'amsterdam_blunt_cyclist',
				percentage: 65,
				dominantTraits: ['direct', 'honest', 'practical']
			},
			{
				culture: 'lisbon_melancholic_poet',
				percentage: 35,
				dominantTraits: ['melancholic', 'artistic', 'contemplative']
			}
		],
		traits: {
			conflictStyle: 'direct',
			emotionalExpression: 'expressive',
			decisionMaking: 'individual',
			formalityLevel: 'casual',
			communicationPace: 'moderate'
		},
		famous_examples: ['Van Gogh meets fado singer'],
		relationship_style: 'Brutally romantic, writes beautiful breakup letters',
		career_strengths: ['Creative writing', 'Truth-telling journalism', 'Relationship coaching']
	},
	{
		id: 'diplomatic_survivor',
		name: 'The Diplomatic Survivor',
		description: 'Moscow resilience with Seoul perfectionist manners',
		culturalMix: [
			{
				culture: 'moscow_stoic_survivor',
				percentage: 55,
				dominantTraits: ['resilient', 'stoic', 'unbreakable']
			},
			{
				culture: 'seoul_hierarchical_perfectionist',
				percentage: 45,
				dominantTraits: ['perfectionist', 'respectful', 'hierarchical']
			}
		],
		traits: {
			conflictStyle: 'diplomatic',
			emotionalExpression: 'reserved',
			decisionMaking: 'hierarchical',
			formalityLevel: 'formal',
			communicationPace: 'slow'
		},
		famous_examples: ['Russian chess master meets K-pop manager'],
		relationship_style:
			'Politely indestructible, survives relationship winters with perfect manners',
		career_strengths: ['Crisis management', 'International diplomacy', 'Luxury brand management']
	},
	{
		id: 'global_harmonizer',
		name: 'The Global Harmonizer',
		description: 'Dubai international connector meets Manila family harmony',
		culturalMix: [
			{
				culture: 'dubai_international_connector',
				percentage: 50,
				dominantTraits: ['international', 'networking', 'multicultural']
			},
			{
				culture: 'manila_relationship_harmony',
				percentage: 50,
				dominantTraits: ['harmony-seeking', 'family-oriented', 'consensus-building']
			}
		],
		traits: {
			conflictStyle: 'harmonious',
			emotionalExpression: 'warm',
			decisionMaking: 'consensus',
			formalityLevel: 'formal',
			communicationPace: 'moderate'
		},
		famous_examples: ['UN diplomat meets family reunion organizer'],
		relationship_style: 'Peacekeeping expert, mediates conflicts in five languages',
		career_strengths: ['International relations', 'Event coordination', 'Cultural bridge-building']
	},
	{
		id: 'creative_historian',
		name: 'The Creative Historian',
		description: 'Barcelona artistic vision with Cairo storytelling wisdom',
		culturalMix: [
			{
				culture: 'barcelona_creative',
				percentage: 60,
				dominantTraits: ['creative', 'artistic', 'innovative']
			},
			{
				culture: 'cairo_storytelling_historian',
				percentage: 40,
				dominantTraits: ['storytelling', 'historical', 'wise']
			}
		],
		traits: {
			conflictStyle: 'diplomatic',
			emotionalExpression: 'expressive',
			decisionMaking: 'collaborative',
			formalityLevel: 'casual',
			communicationPace: 'moderate'
		},
		famous_examples: ['Gaudí meets ancient Egyptian scribe'],
		relationship_style: "Artistically wise, dates like it's a historically significant art project",
		career_strengths: ['Museum curation', 'Documentary filmmaking', 'Cultural preservation']
	},
	{
		id: 'island_innovator',
		name: 'The Island Innovator',
		description: 'Jeju peaceful wisdom with Silicon Valley optimism',
		culturalMix: [
			{
				culture: 'jeju_island_peaceful',
				percentage: 65,
				dominantTraits: ['peaceful', 'nature-connected', 'slow-living']
			},
			{
				culture: 'silicon_valley_optimist',
				percentage: 35,
				dominantTraits: ['optimistic', 'innovative', 'solution-focused']
			}
		],
		traits: {
			conflictStyle: 'harmonious',
			emotionalExpression: 'warm',
			decisionMaking: 'collaborative',
			formalityLevel: 'casual',
			communicationPace: 'moderate'
		},
		famous_examples: ['Mindful monk meets tech startup founder'],
		relationship_style: 'Zen-level patience with startup-level enthusiasm',
		career_strengths: ['Sustainable tech', 'Wellness apps', 'Nature-based solutions']
	},
	{
		id: 'hospitality_hipster',
		name: 'The Hospitality Hipster',
		description: 'Marrakech hosting mastery with Brooklyn cultural curation',
		culturalMix: [
			{
				culture: 'marrakech_hospitality_master',
				percentage: 70,
				dominantTraits: ['hospitable', 'generous', 'welcoming']
			},
			{
				culture: 'brooklyn_hipster',
				percentage: 30,
				dominantTraits: ['curated', 'artistic', 'trend-setting']
			}
		],
		traits: {
			conflictStyle: 'harmonious',
			emotionalExpression: 'warm',
			decisionMaking: 'collaborative',
			formalityLevel: 'casual',
			communicationPace: 'moderate'
		},
		famous_examples: ['Moroccan tea master meets artisanal coffee roaster'],
		relationship_style: 'Hosts legendary dinner parties, curates perfect date experiences',
		career_strengths: [
			'Event hospitality',
			'Restaurant concept development',
			'Cultural experience design'
		]
	}
];

// Get random viral archetype
export function getRandomViralArchetype(): DNAPersonalityType {
	return viralPersonalityArchetypes[Math.floor(Math.random() * viralPersonalityArchetypes.length)];
}

// Find archetype by ID
export function getViralArchetypeById(id: string): DNAPersonalityType | undefined {
	return viralPersonalityArchetypes.find((archetype) => archetype.id === id);
}

// Get archetype by cultural mix similarity
export function getArchetypeByCulturalMatch(
	primaryCulture: string,
	secondaryCulture?: string
): DNAPersonalityType {
	// Find best match based on cultural composition
	const matches = viralPersonalityArchetypes.filter((archetype) => {
		const cultures = archetype.culturalMix.map((mix) => mix.culture);
		return (
			cultures.includes(primaryCulture as any) ||
			(secondaryCulture && cultures.includes(secondaryCulture as any))
		);
	});

	return matches.length > 0 ? matches[0] : viralPersonalityArchetypes[0];
}
