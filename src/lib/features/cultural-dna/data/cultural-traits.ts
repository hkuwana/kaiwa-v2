// 🌍 Cultural Traits and Personality Mappings
// Maps conversation patterns to cultural communication styles

import type { CultureType, ConversationTraits } from '../types/cultural-dna.types';

// Core cultural communication patterns (basic cultures only)
export const culturalTraitMappings: Partial<Record<CultureType, ConversationTraits>> = {
	german: {
		conflictStyle: 'direct',
		emotionalExpression: 'reserved',
		decisionMaking: 'individual',
		formalityLevel: 'formal',
		communicationPace: 'moderate'
	},
	japanese: {
		conflictStyle: 'harmonious',
		emotionalExpression: 'reserved',
		decisionMaking: 'consensus',
		formalityLevel: 'ceremonial',
		communicationPace: 'slow'
	},
	spanish: {
		conflictStyle: 'direct',
		emotionalExpression: 'warm',
		decisionMaking: 'collaborative',
		formalityLevel: 'casual',
		communicationPace: 'fast'
	},
	italian: {
		conflictStyle: 'direct',
		emotionalExpression: 'dramatic',
		decisionMaking: 'individual',
		formalityLevel: 'casual',
		communicationPace: 'rapid'
	},
	french: {
		conflictStyle: 'diplomatic',
		emotionalExpression: 'expressive',
		decisionMaking: 'individual',
		formalityLevel: 'formal',
		communicationPace: 'moderate'
	},
	british: {
		conflictStyle: 'avoidant',
		emotionalExpression: 'reserved',
		decisionMaking: 'individual',
		formalityLevel: 'formal',
		communicationPace: 'moderate'
	},
	american: {
		conflictStyle: 'direct',
		emotionalExpression: 'warm',
		decisionMaking: 'individual',
		formalityLevel: 'casual',
		communicationPace: 'fast'
	},
	brazilian: {
		conflictStyle: 'harmonious',
		emotionalExpression: 'dramatic',
		decisionMaking: 'collaborative',
		formalityLevel: 'casual',
		communicationPace: 'rapid'
	},
	korean: {
		conflictStyle: 'harmonious',
		emotionalExpression: 'reserved',
		decisionMaking: 'hierarchical',
		formalityLevel: 'formal',
		communicationPace: 'moderate'
	},
	chinese: {
		conflictStyle: 'diplomatic',
		emotionalExpression: 'reserved',
		decisionMaking: 'consensus',
		formalityLevel: 'formal',
		communicationPace: 'slow'
	},
	scandinavian: {
		conflictStyle: 'direct',
		emotionalExpression: 'reserved',
		decisionMaking: 'consensus',
		formalityLevel: 'casual',
		communicationPace: 'moderate'
	},
	dutch: {
		conflictStyle: 'direct',
		emotionalExpression: 'warm',
		decisionMaking: 'consensus',
		formalityLevel: 'casual',
		communicationPace: 'fast'
	},
	mexican: {
		conflictStyle: 'harmonious',
		emotionalExpression: 'warm',
		decisionMaking: 'collaborative',
		formalityLevel: 'balanced',
		communicationPace: 'moderate'
	},
	canadian: {
		conflictStyle: 'diplomatic',
		emotionalExpression: 'warm',
		decisionMaking: 'consensus',
		formalityLevel: 'casual',
		communicationPace: 'moderate'
	},
	australian: {
		conflictStyle: 'direct',
		emotionalExpression: 'warm',
		decisionMaking: 'individual',
		formalityLevel: 'casual',
		communicationPace: 'fast'
	}
};

// Cultural descriptors for personality generation (basic cultures only)
export const culturalDescriptors: Partial<
	Record<
		CultureType,
		{
			name: string;
			flag: string;
			keywords: string[];
			positiveTraits: string[];
			communicationStyle: string;
		}
	>
> = {
	german: {
		name: 'German',
		flag: '🇩🇪',
		keywords: ['efficient', 'direct', 'logical', 'structured'],
		positiveTraits: ['Clear communication', 'Reliable', 'Honest', 'Organized'],
		communicationStyle: 'Direct and efficient, values honesty over politeness'
	},
	japanese: {
		name: 'Japanese',
		flag: '🇯🇵',
		keywords: ['harmonious', 'respectful', 'thoughtful', 'detailed'],
		positiveTraits: ['Considerate', 'Respectful', 'Attentive', 'Diplomatic'],
		communicationStyle: 'Indirect and context-rich, prioritizes harmony'
	},
	spanish: {
		name: 'Spanish',
		flag: '🇪🇸',
		keywords: ['warm', 'expressive', 'social', 'passionate'],
		positiveTraits: ['Warm', 'Engaging', 'Authentic', 'Family-oriented'],
		communicationStyle: 'Expressive and personal, values relationships'
	},
	italian: {
		name: 'Italian',
		flag: '🇮🇹',
		keywords: ['expressive', 'passionate', 'dramatic', 'artistic'],
		positiveTraits: ['Passionate', 'Expressive', 'Creative', 'Engaging'],
		communicationStyle: 'Animated and emotional, uses gestures and drama'
	},
	french: {
		name: 'French',
		flag: '🇫🇷',
		keywords: ['sophisticated', 'diplomatic', 'artistic', 'intellectual'],
		positiveTraits: ['Sophisticated', 'Diplomatic', 'Intellectual', 'Elegant'],
		communicationStyle: 'Refined and diplomatic, appreciates nuance'
	},
	british: {
		name: 'British',
		flag: '🇬🇧',
		keywords: ['polite', 'reserved', 'understated', 'witty'],
		positiveTraits: ['Polite', 'Witty', 'Reserved', 'Diplomatic'],
		communicationStyle: 'Polite and understated, masters of subtext'
	},
	american: {
		name: 'American',
		flag: '🇺🇸',
		keywords: ['direct', 'optimistic', 'informal', 'confident'],
		positiveTraits: ['Direct', 'Confident', 'Optimistic', 'Informal'],
		communicationStyle: 'Direct and confident, values clarity and efficiency'
	},
	brazilian: {
		name: 'Brazilian',
		flag: '🇧🇷',
		keywords: ['warm', 'expressive', 'social', 'joyful'],
		positiveTraits: ['Warm', 'Joyful', 'Social', 'Spontaneous'],
		communicationStyle: 'Warm and expressive, emphasizes connection and joy'
	},
	korean: {
		name: 'Korean',
		flag: '🇰🇷',
		keywords: ['respectful', 'hierarchical', 'thoughtful', 'dedicated'],
		positiveTraits: ['Respectful', 'Dedicated', 'Thoughtful', 'Loyal'],
		communicationStyle: 'Respectful and hierarchical, values harmony and respect'
	},
	chinese: {
		name: 'Chinese',
		flag: '🇨🇳',
		keywords: ['diplomatic', 'strategic', 'respectful', 'patient'],
		positiveTraits: ['Strategic', 'Patient', 'Respectful', 'Wise'],
		communicationStyle: 'Diplomatic and strategic, values face and harmony'
	},
	scandinavian: {
		name: 'Scandinavian',
		flag: '🇸🇪',
		keywords: ['direct', 'egalitarian', 'honest', 'practical'],
		positiveTraits: ['Honest', 'Egalitarian', 'Practical', 'Balanced'],
		communicationStyle: 'Direct but egalitarian, values honesty and fairness'
	},
	dutch: {
		name: 'Dutch',
		flag: '🇳🇱',
		keywords: ['direct', 'practical', 'open', 'egalitarian'],
		positiveTraits: ['Direct', 'Practical', 'Open', 'Honest'],
		communicationStyle: 'Very direct and practical, no-nonsense approach'
	},
	mexican: {
		name: 'Mexican',
		flag: '🇲🇽',
		keywords: ['warm', 'family-oriented', 'respectful', 'social'],
		positiveTraits: ['Warm', 'Family-oriented', 'Respectful', 'Social'],
		communicationStyle: 'Warm and personal, values relationships and respect'
	},
	canadian: {
		name: 'Canadian',
		flag: '🇨🇦',
		keywords: ['polite', 'diplomatic', 'inclusive', 'apologetic'],
		positiveTraits: ['Polite', 'Inclusive', 'Diplomatic', 'Considerate'],
		communicationStyle: 'Polite and inclusive, seeks consensus and harmony'
	},
	australian: {
		name: 'Australian',
		flag: '🇦🇺',
		keywords: ['direct', 'informal', 'humorous', 'egalitarian'],
		positiveTraits: ['Direct', 'Humorous', 'Egalitarian', 'Laid-back'],
		communicationStyle: 'Direct and informal, uses humor to connect'
	}
};

// Helper functions
export function getCulturalDescriptor(culture: CultureType) {
	return culturalDescriptors[culture];
}

export function getCulturalTraits(culture: CultureType): ConversationTraits {
	return (
		culturalTraitMappings[culture] ?? {
			conflictStyle: 'direct',
			emotionalExpression: 'warm',
			decisionMaking: 'individual',
			formalityLevel: 'casual',
			communicationPace: 'fast'
		}
	);
}

// Get cultures that match specific traits
export function getCulturesWithTrait(
	trait: keyof ConversationTraits,
	value: string
): CultureType[] {
	return Object.entries(culturalTraitMappings)
		.filter(([, traits]) => traits[trait] === value)
		.map(([culture]) => culture as CultureType);
}
